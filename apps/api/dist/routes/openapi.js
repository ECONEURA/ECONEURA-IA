import { Router } from 'express';
import { openApiSpec } from '../openapi/spec.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/openapi.json', (req, res) => {
    try {
        res.json(openApiSpec);
    }
    catch (error) {
        structuredLogger.error('Failed to serve OpenAPI spec', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate OpenAPI specification'
        });
    }
});
router.get('/openapi.yaml', (req, res) => {
    try {
        const yaml = jsonToYaml(openApiSpec);
        res.set('Content-Type', 'text/yaml');
        res.send(yaml);
    }
    catch (error) {
        structuredLogger.error('Failed to serve OpenAPI spec as YAML', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate OpenAPI specification'
        });
    }
});
router.get('/docs', (req, res) => {
    try {
        const html = generateDocsHTML();
        res.set('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        structuredLogger.error('Failed to serve API docs', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate API documentation'
        });
    }
});
router.get('/info', (req, res) => {
    try {
        const info = {
            title: openApiSpec.info.title,
            description: openApiSpec.info.description,
            version: openApiSpec.info.version,
            contact: openApiSpec.info.contact,
            license: openApiSpec.info.license,
            servers: openApiSpec.servers,
            tags: openApiSpec.tags,
            endpoints: {
                openapi: '/v1/openapi/openapi.json',
                docs: '/v1/openapi/docs',
                yaml: '/v1/openapi/openapi.yaml'
            },
            stats: {
                totalEndpoints: countEndpoints(openApiSpec.paths),
                totalTags: openApiSpec.tags?.length || 0,
                totalSchemas: Object.keys(openApiSpec.components?.schemas || {}).length
            }
        };
        res.json({
            success: true,
            data: info
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get API info', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get API information'
        });
    }
});
function jsonToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    if (typeof obj === 'string') {
        return `"${obj}"`;
    }
    else if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj);
    }
    else if (obj === null) {
        return 'null';
    }
    else if (Array.isArray(obj)) {
        if (obj.length === 0)
            return '[]';
        return obj.map(item => `${spaces}- ${jsonToYaml(item, indent + 1)}`).join('\n');
    }
    else if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0)
            return '{}';
        return entries.map(([key, value]) => {
            return `${spaces}${key}: ${jsonToYaml(value, indent + 1)}`;
        }).join('\n');
    }
    return String(obj);
}
function countEndpoints(paths) {
    let count = 0;
    for (const path in paths) {
        for (const method in paths[path]) {
            if (typeof paths[path][method] === 'object') {
                count++;
            }
        }
    }
    return count;
}
function generateDocsHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECONEURA API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .info-card h3 {
            margin-top: 0;
            color: #667eea;
        }
        .endpoint-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .endpoint-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .endpoint-item:last-child {
            border-bottom: none;
        }
        .method {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        .method.get { background-color: #61affe; }
        .method.post { background-color: #49cc90; }
        .method.put { background-color: #fca130; }
        .method.delete { background-color: #f93e3e; }
        .links {
            text-align: center;
            margin-top: 30px;
        }
        .links a {
            display: inline-block;
            margin: 0 10px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .links a:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ECONEURA API</h1>
        <p>ERP/CRM + IA + 60 agentes en Azure</p>
        <p>API completa con Analytics, Security, FinOps y más</p>
    </div>
    
    <div class="info-grid">
        <div class="info-card">
            <h3>📊 API Statistics</h3>
            <p><strong>Total Endpoints:</strong> ${countEndpoints(openApiSpec.paths)}</p>
            <p><strong>API Version:</strong> ${openApiSpec.info.version}</p>
            <p><strong>OpenAPI Version:</strong> ${openApiSpec.openapi}</p>
        </div>
        
        <div class="info-card">
            <h3>🏷️ Tags</h3>
            <p><strong>Total Tags:</strong> ${openApiSpec.tags?.length || 0}</p>
            <ul>
                ${openApiSpec.tags?.map(tag => `<li>${tag.name}</li>`).join('') || ''}
            </ul>
        </div>
        
        <div class="info-card">
            <h3>🔧 Servers</h3>
            <ul>
                ${openApiSpec.servers?.map(server => `<li>${server.url} (${server.description})</li>`).join('') || ''}
            </ul>
        </div>
        
        <div class="info-card">
            <h3>📞 Contact</h3>
            <p><strong>Name:</strong> ${openApiSpec.info.contact?.name}</p>
            <p><strong>Email:</strong> ${openApiSpec.info.contact?.email}</p>
            <p><strong>URL:</strong> ${openApiSpec.info.contact?.url}</p>
        </div>
    </div>
    
    <div class="endpoint-list">
        <h3>🔗 Available Endpoints</h3>
        ${generateEndpointList()}
    </div>
    
    <div class="links">
        <a href="/v1/openapi/openapi.json" target="_blank">📄 OpenAPI JSON</a>
        <a href="/v1/openapi/openapi.yaml" target="_blank">📄 OpenAPI YAML</a>
        <a href="https://editor.swagger.io/" target="_blank">🛠️ Swagger Editor</a>
    </div>
</body>
</html>
  `;
}
function generateEndpointList() {
    const endpoints = [];
    for (const path in openApiSpec.paths) {
        for (const method in openApiSpec.paths[path]) {
            if (typeof openApiSpec.paths[path][method] === 'object') {
                const operation = openApiSpec.paths[path][method];
                const methodClass = method.toLowerCase();
                endpoints.push(`
          <div class="endpoint-item">
            <div>
              <span class="method ${methodClass}">${method.toUpperCase()}</span>
              <strong>${path}</strong>
              ${operation.summary ? `<br><small>${operation.summary}</small>` : ''}
            </div>
            <div>
              ${operation.tags ? operation.tags.map((tag) => `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-left: 5px;">${tag}</span>`).join('') : ''}
            </div>
          </div>
        `);
            }
        }
    }
    return endpoints.join('');
}
export default router;
//# sourceMappingURL=openapi.js.map