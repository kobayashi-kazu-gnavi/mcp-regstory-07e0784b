#!/usr/bin/env node

/**
 * generate-registry-endpoints.js
 * * This script generates static API endpoint files (HTML and JSON) from mcp-registry.json
 * following the MCP Registry API specification.
 * * Usage: node generate-registry-endpoints.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REGISTRY_FILE = 'mcp-registry.json';
const OUTPUT_DIR = 'dist';
const API_BASE = 'v0.1';

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate server ID to prevent path traversal
 */
function isValidServerId(id) {
  return /^[a-z0-9\-]+$/i.test(id);
}

/**
 * Read and parse the registry JSON file
 */
function readRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
    const registry = JSON.parse(data);
    
    // Validate registry structure
    if (!registry.servers || !Array.isArray(registry.servers)) {
      console.error('Error: Registry must contain a "servers" array');
      process.exit(1);
    }
    
    // Validate each server entry
    registry.servers.forEach((server, index) => {
      if (!server.id || !server.name || !server.version) {
        console.error(`Error: Server at index ${index} is missing required fields (id, name, version)`);
        process.exit(1);
      }
      if (!isValidServerId(server.id)) {
        console.error(`Error: Server "${server.id}" has invalid ID. Only alphanumeric characters and hyphens are allowed.`);
        process.exit(1);
      }
    });
    
    return registry;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Registry file "${REGISTRY_FILE}" not found`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in "${REGISTRY_FILE}":`, error.message);
    } else {
      console.error(`Error reading ${REGISTRY_FILE}:`, error.message);
    }
    process.exit(1);
  }
}

/**
 * Ensure directory exists, create if it doesn't
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write JSON file
 */
function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ JSON: ${filePath}`);
}

/**
 * Write HTML file with JSON data embedded
 */
function writeHTML(filePath, data, title) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  
  const escapedTitle = escapeHtml(title);
  const jsonString = JSON.stringify(data, null, 2);
  const escapedJson = escapeHtml(jsonString);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle} - MCP Registry</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    pre { background: #fff; padding: 20px; border-radius: 8px; overflow-x: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <div class="info">
    <p><strong>API Endpoint:</strong> This page serves as a static JSON API endpoint.</p>
  </div>
  <h2>JSON Response</h2>
  <pre><code>${escapedJson}</code></pre>
  <hr>
  <p><small><a href="/">Back to Registry Home</a></small></p>
</body>
</html>`;
  
  fs.writeFileSync(filePath, html, 'utf8');
  // HTML log omitted to reduce noise
}

/**
 * Generate: GET /v0.1/servers
 */
function generateServersEndpoint(registry) {
  const apiPath = path.join(OUTPUT_DIR, API_BASE, 'servers');
  writeJSON(path.join(apiPath, 'index.json'), registry);
  writeHTML(path.join(apiPath, 'index.html'), registry, 'All MCP Servers');
}

/**
 * Generate: 
 * - GET /v0.1/servers/{serverName}/versions/{version}
 * - GET /v0.1/servers/{serverName}/versions/latest
 */
function generateServerDetailEndpoints(registry) {
  if (!registry.servers || !Array.isArray(registry.servers)) return;

  registry.servers.forEach(server => {
    const serverId = server.id;
    const version = server.version;

    // Base path: /servers/{id} (For human navigation mostly)
    const serverBasePath = path.join(OUTPUT_DIR, API_BASE, 'servers', serverId);
    writeJSON(path.join(serverBasePath, 'index.json'), server);
    writeHTML(path.join(serverBasePath, 'index.html'), server, `${server.name} - Details`);

    // 1. Specific Version: /servers/{id}/versions/{version}
    const versionPath = path.join(serverBasePath, 'versions', version);
    writeJSON(path.join(versionPath, 'index.json'), server);
    writeHTML(path.join(versionPath, 'index.html'), server, `${server.name} v${version}`);

    // 2. Latest Version: /servers/{id}/versions/latest
    // (In this simple registry, the listed version IS the latest)
    const latestPath = path.join(serverBasePath, 'versions', 'latest');
    writeJSON(path.join(latestPath, 'index.json'), server);
    writeHTML(path.join(latestPath, 'index.html'), server, `${server.name} (Latest)`);
  });
}

/**
 * Generate index page (Landing page)
 */
function generateIndexPage(registry) {
  const serverCount = registry.servers ? registry.servers.length : 0;
  const serversList = registry.servers
    ? registry.servers
        .map(s => {
          const eId = escapeHtml(s.id);
          const eName = escapeHtml(s.name);
          const eVer = escapeHtml(s.version);
          return `
            <li>
              <strong><a href="${API_BASE}/servers/${eId}/">${eName}</a></strong> (v${eVer})<br>
              <small>
                Endpoints: 
                <a href="${API_BASE}/servers/${eId}/versions/latest/">latest</a> | 
                <a href="${API_BASE}/servers/${eId}/versions/${eVer}/">v${eVer}</a>
              </small>
            </li>`;
        })
        .join('\n')
    : '<li>No servers available</li>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MCP Registry</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; }
    code { background: #eee; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>MCP Private Registry</h1>
  
  <div class="card">
    <p>This is a static MCP registry hosting <strong>${serverCount}</strong> servers.</p>
    <p><strong>Base URL for Copilot:</strong> <code>YOUR_PAGES_URL</code></p>
  </div>

  <h3>Available Servers</h3>
  <ul>${serversList}</ul>

  <hr>
  <p><small>Last updated: ${new Date().toISOString()}</small></p>
</body>
</html>`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html, 'utf8');
  console.log(`✓ Index: ${path.join(OUTPUT_DIR, 'index.html')}`);
}

/**
 * Copy static files
 */
function copyStaticFiles() {
  ['.nojekyll', 'robots.txt'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(OUTPUT_DIR, file));
      console.log(`✓ Copied: ${file}`);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('Building MCP Registry endpoints...');
  
  // Create clean output dir
  if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
  ensureDir(OUTPUT_DIR);

  const registry = readRegistry();
  
  generateServersEndpoint(registry);       // GET /v0.1/servers
  generateServerDetailEndpoints(registry); // GET .../versions/latest & .../versions/{ver}
  generateIndexPage(registry);             // Landing page
  copyStaticFiles();
  
  console.log('\nBuild complete! 🚀');
}

main();
