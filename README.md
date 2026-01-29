# MCP Registry

A static MCP (Model Context Protocol) Server Registry deployed on GitHub Pages, following the JMDC Tech Blog approach for static API endpoints.

## Overview

This repository implements a lightweight, static MCP server registry that provides a centralized directory of MCP servers. It generates static API endpoint files (HTML and JSON) that can be deployed to GitHub Pages, making it easy to discover and integrate MCP servers.

## Features

- ✅ **Static API Endpoints**: Generates both JSON and HTML versions of API endpoints
- ✅ **GitHub Pages Ready**: Automated deployment via GitHub Actions
- ✅ **MCP Registry Schema**: Follows the `GET /v0.1/servers` specification
- ✅ **Sample Servers**: Includes Serena and Figma sample servers
- ✅ **SEO Control**: Includes robots.txt to control search engine indexing

## Project Structure

```
.
├── mcp-registry.json              # Registry data following MCP schema
├── generate-registry-endpoints.js # Node.js script to generate static endpoints
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions workflow for deployment
├── robots.txt                    # Search engine directives
├── .nojekyll                     # GitHub Pages Jekyll bypass
└── README.md                     # This file
```

## API Endpoints

Once deployed, the following endpoints are available:

- `GET /v0.1/servers/` - List all MCP servers
- `GET /v0.1/servers/{server-id}/` - Get details for a specific server

Each endpoint is available in both JSON (`index.json`) and HTML (`index.html`) formats.

## Usage

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kobayashi-kazu-gnavi/mcp-regstory-07e0784b.git
   cd mcp-regstory-07e0784b
   ```

2. **Generate the registry endpoints**:
   ```bash
   node generate-registry-endpoints.js
   ```

3. **View the generated files**:
   The script generates all API endpoint files in the `dist/` directory.

### Adding a New Server

1. Edit `mcp-registry.json` and add your server entry:
   ```json
   {
     "id": "your-server-id",
     "name": "Your Server Name",
     "description": "Description of your MCP server",
     "version": "1.0.0",
     "repository": "https://github.com/your/repo",
     "homepage": "https://your-server.example.com",
     "license": "MIT",
     "author": {
       "name": "Your Name",
       "email": "your@email.com"
     },
     "installation": {
       "npm": "your-package-name"
     },
     "capabilities": [
       "resources",
       "tools",
       "prompts"
     ],
     "tags": [
       "tag1",
       "tag2"
     ]
   }
   ```

2. Commit and push your changes:
   ```bash
   git add mcp-registry.json
   git commit -m "Add new server: your-server-id"
   git push
   ```

3. GitHub Actions will automatically regenerate and deploy the registry.

## Registry Schema

The registry follows the MCP server specification with the following structure:

```json
{
  "servers": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "version": "string",
      "repository": "string",
      "homepage": "string",
      "license": "string",
      "author": {
        "name": "string",
        "email": "string"
      },
      "installation": {
        "npm": "string"
      },
      "capabilities": ["resources", "tools", "prompts"],
      "tags": ["string"]
    }
  ],
  "metadata": {
    "version": "0.1",
    "updated": "ISO 8601 timestamp",
    "count": number
  }
}
```

## GitHub Actions Workflow

The deployment workflow (`deploy.yml`) automatically:

1. Checks out the repository
2. Sets up Node.js environment
3. Runs the registry generation script
4. Configures GitHub Pages
5. Deploys the generated files to GitHub Pages

The workflow triggers on:
- Push to `main` or `copilot/create-mcp-registry` branches
- Manual workflow dispatch

## Configuration

### robots.txt

The `robots.txt` file is configured to disallow all crawlers:
```
User-agent: *
Disallow: /
```

### .nojekyll

An empty `.nojekyll` file is included to bypass GitHub's default Jekyll processing.

## Sample Servers

The registry includes two sample servers:

1. **Serena MCP Server**: A versatile MCP server for Serena integration
2. **Figma MCP Server**: MCP server for Figma design tool integration

## Contributing

To contribute to this registry:

1. Fork the repository
2. Add or update servers in `mcp-registry.json`
3. Test locally using `node generate-registry-endpoints.js`
4. Submit a pull request

## License

This project structure and scripts are provided as-is for creating MCP server registries.

## References

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [JMDC Tech Blog - Static API Approach](https://techblog.jmdc.co.jp/)
- [GitHub Pages Documentation](https://docs.github.com/pages)
