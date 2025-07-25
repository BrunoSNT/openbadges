const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

// WebGL-friendly headers middleware
app.use((req, res, next) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Add WebGL compatibility headers
  res.header('Cross-Origin-Embedder-Policy', 'cross-origin');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create proxy middleware
const proxy = httpProxy.createProxyMiddleware({
  target: 'http://127.0.0.1:8051',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Proxy error occurred');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Additional headers for better compatibility
    proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
    proxyRes.headers['pragma'] = 'no-cache';
    proxyRes.headers['expires'] = '0';
  }
});

// Use proxy for all requests
app.use('/', proxy);

// Create HTTP server
const server = http.createServer(app);

// Handle WebSocket upgrade
server.on('upgrade', proxy.upgrade);

// Start server on port 8050 (external port)
const PORT = 8050;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Decentraland Proxy Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Proxying to Decentraland server on http://127.0.0.1:8051`);
  console.log(`🌐 External access: http://164.41.20.252:${PORT}`);
  console.log('');
  console.log('🎮 Ready for WebGL connections!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});
