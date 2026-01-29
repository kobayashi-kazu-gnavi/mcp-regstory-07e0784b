#!/usr/bin/env node

/**
 * generate-registry-endpoints.js
 * MCP Registry API仕様に基づき、静的なエンドポイント構造を生成します。
 * * 修正点: 個別エンドポイントのレスポンスを { server: {...}, _meta: {...} } 形式にラップしました。
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REGISTRY_FILE = 'mcp-registry.json';
const OUTPUT_DIR = 'dist';
const API_BASE = 'v0.1';
const SCHEMA_URL = "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json";

/**
 * HTMLエスケープ（XSS対策）
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
 * サーバーIDのバリデーション
 */
function isValidServerId(id) {
  return /^[a-z0-9\-.]+$/i.test(id); // ドット(.)も許容するように修正
}

/**
 * レジストリファイルの読み込み
 */
function readRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
    const registry = JSON.parse(data);
    
    if (!registry.servers || !Array.isArray(registry.servers)) {
      console.error('Error: Registry must contain a "servers" array');
      process.exit(1);
    }
    
    return registry;
  } catch (error) {
    console.error(`Error reading ${REGISTRY_FILE}:`, error.message);
    process.exit(1);
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ JSON: ${filePath}`);
}

/**
 * HTML書き出し（デバッグ・閲覧用）
 */
function writeHTML(filePath, data, title) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 20px auto; padding: 20px; background: #f4f4f4; }
    pre { background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>This is a static JSON endpoint.</p>
  <pre><code>${escapeHtml(JSON.stringify(data, null, 2))}</code></pre>
</body>
</html>`;
  
  fs.writeFileSync(filePath, html, 'utf8');
}

/**
 * 【一覧用】GET /v0.1/servers
 * こちらは { servers: [...] } の形式のままです。
 */
function generateServersEndpoint(registry) {
  const apiPath = path.join(OUTPUT_DIR, API_BASE, 'servers');
  writeJSON(path.join(apiPath, 'index.json'), registry);
  writeHTML(path.join(apiPath, 'index.html'), registry, 'All MCP Servers');
}

/**
 * 【詳細用】レスポンスをラップするヘルパー関数
 * ご指定の { server: {}, _meta: {} } 形式を作ります。
 */
function wrapServerResponse(serverData, isLatest = true) {
  const now = new Date().toISOString();
  
  return {
    server: {
      $schema: SCHEMA_URL,
      ...serverData // 元のサーバー情報を展開
    },
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: "active",
        publishedAt: now,
        updatedAt: now,
        isLatest: isLatest
      }
    }
  };
}

/**
 * 【詳細用】エンドポイント生成
 * - GET /v0.1/servers/{id}/versions/{version}
 * - GET /v0.1/servers/{id}/versions/latest
 */
function generateServerDetailEndpoints(registry) {
  if (!registry.servers) return;

  registry.servers.forEach(server => {
    const serverId = server.id;
    const version = server.version;

    // 1. バージョン指定: /versions/{version}
    const versionPath = path.join(OUTPUT_DIR, API_BASE, 'servers', serverId, 'versions', version);
    const versionData = wrapServerResponse(server, true); // ラップする
    
    writeJSON(path.join(versionPath, 'index.json'), versionData);
    writeHTML(path.join(versionPath, 'index.html'), versionData, `${server.name} v${version}`);

    // 2. 最新版: /versions/latest
    const latestPath = path.join(OUTPUT_DIR, API_BASE, 'servers', serverId, 'versions', 'latest');
    const latestData = wrapServerResponse(server, true); // ラップする（中身は同じ）
    
    writeJSON(path.join(latestPath, 'index.json'), latestData);
    writeHTML(path.join(latestPath, 'index.html'), latestData, `${server.name} (Latest)`);
  });
}

function generateIndexPage(registry) {
  // 簡易的なランディングページ生成（省略なし）
  const html = `<!DOCTYPE html>
<html><body><h1>MCP Registry</h1><p>Running ${registry.servers.length} servers.</p></body></html>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
}

function copyStaticFiles() {
  ['.nojekyll', 'robots.txt'].forEach(f => {
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(OUTPUT_DIR, f));
  });
}

function main() {
  if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
  ensureDir(OUTPUT_DIR);

  const registry = readRegistry();
  
  generateServersEndpoint(registry);       // 一覧（servers: [...]）
  generateServerDetailEndpoints(registry); // 詳細（server: {...}, _meta: {...}）
  generateIndexPage(registry);
  copyStaticFiles();
  
  console.log('\nBuild complete.');
}

main();
