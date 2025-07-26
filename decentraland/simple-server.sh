#!/bin/bash

# Simple solution: Build the scene and serve it with proper headers
echo "🏗️  Building Decentraland scene first..."

# Build the scene
npx @dcl/sdk-commands build

echo "🚀 Starting simple HTTP server with CORS headers..."

# Create a simple Python server with CORS (most systems have Python)
python3 -c "
import http.server
import socketserver
from http.server import SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = 8050
with socketserver.TCPServer(('0.0.0.0', PORT), CORSRequestHandler) as httpd:
    print(f'🌐 Server running on:')
    print(f'   Local:  http://localhost:{PORT}')
    print(f'   Remote: http://164.41.20.252:{PORT}')
    print(f'🎯 Try: http://164.41.20.252:{PORT}/?position=11%2C12&FORCE_WEBGL1=true&DISABLE_SHADOWS=true&DISABLE_ANTIALIASING=true&LOW_QUALITY=true')
    httpd.serve_forever()
" 2>/dev/null || {
    echo "Python3 not available, falling back to Node.js..."
    
    # Fallback to Node.js if Python is not available
    if command -v node >/dev/null 2>&1; then
        node -e "
        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        const url = require('url');

        const server = http.createServer((req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            let filePath = '.' + req.url;
            if (filePath === './') filePath = './index.html';
            
            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.wasm': 'application/wasm',
                '.data': 'application/octet-stream'
            };
            
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(404);
                        res.end('File not found');
                    } else {
                        res.writeHead(500);
                        res.end('Server error: ' + error.code);
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });
        
        server.listen(8050, '0.0.0.0', () => {
            console.log('🌐 Server running on:');
            console.log('   Local:  http://localhost:8050');
            console.log('   Remote: http://164.41.20.252:8050');
            console.log('🎯 Try: http://164.41.20.252:8050/?position=11%2C12&FORCE_WEBGL1=true&DISABLE_SHADOWS=true&DISABLE_ANTIALIASING=true&LOW_QUALITY=true');
        });
        "
    else
        echo "❌ Neither Python3 nor Node.js available. Please install one of them."
        exit 1
    fi
}
