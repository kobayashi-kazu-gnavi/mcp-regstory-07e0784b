#!/usr/bin/env node

/**
 * generate-registry-endpoints.js
 * * MCP Registry API仕様に基づき、静的なJSONファイルのみを生成します。
 * HTMLファイルは生成しません。
 */

const fs = require('fs');
const path = require('path');

// 設定
const REGISTRY_FILE = 'mcp-registry.json';
const OUTPUT_DIR = 'dist';
const API_BASE = 'v0.1';
const SCHEMA_URL = "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json";

/**
 * ディレクトリ再帰作成
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * JSONファイル書き出し
 */
function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ JSON: ${filePath}`);
}

/**
 * レジストリファイルの読み込み
 */
function readRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${REGISTRY_FILE}:`, error.message);
    process.exit(1);
  }
}

/**
 * サーバー詳細API用のレスポンス構造を作成（ラップ処理）
 * { server: {...}, _meta: {...} }
 */
function wrapServerResponse(serverData, isLatest = true) {
  const now = new Date().toISOString();
  
  return {
    server: {
      $schema: SCHEMA_URL,
      ...serverData
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
 * メイン処理
 */
function main() {
  // 出力ディレクトリの初期化
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  ensureDir(OUTPUT_DIR);

  const registry = readRegistry();

  // 1. 全サーバー一覧 (GET /v0.1/servers)
  // ここは仕様上、servers配列をそのまま返す（またはラップしない）のが一般的ですが
  // 必要に応じて変更してください。現在は { servers: [...] } のまま書き出します。
  const serversPath = path.join(OUTPUT_DIR, API_BASE, 'servers');
  writeJSON(path.join(serversPath, 'index.json'), registry);

  // 2. 個別サーバー詳細 (GET /v0.1/servers/{id}/versions/...)
  if (registry.servers && Array.isArray(registry.servers)) {
    registry.servers.forEach(server => {
      const serverId = server.id;
      const version = server.version;

      // ラップされたデータを準備
      const responseData = wrapServerResponse(server, true);

      // パスA: 指定バージョン (/versions/{version})
      const versionPath = path.join(serversPath, serverId, 'versions', version);
      writeJSON(path.join(versionPath, 'index.json'), responseData);

      // パスB: 最新バージョン (/versions/latest)
      const latestPath = path.join(serversPath, serverId, 'versions', 'latest');
      writeJSON(path.join(latestPath, 'index.json'), responseData);
    });
  }

  // 静的ファイルのコピー（.nojekyll 等）
  ['.nojekyll', 'robots.txt'].forEach(f => {
    if (fs.existsSync(f)) {
      fs.copyFileSync(f, path.join(OUTPUT_DIR, f));
      console.log(`✓ Copied: ${f}`);
    }
  });

  console.log('\nBuild complete. (JSON only)');
}

main();
