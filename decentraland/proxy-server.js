const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8050;

// Enhanced CORS configuration for Decentraland
app.use((req, res, next) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Security headers for WebGL/Unity compatibility
app.use((req, res, next) => {
  // Allow SharedArrayBuffer and other Unity features (relaxed for compatibility)
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  // Disable X-Frame-Options to allow embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Enable WebAssembly
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Cache control for Unity assets
  if (req.path.includes('.wasm') || req.path.includes('.data') || req.path.includes('.js')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  
  next();
});

// Serve static files with proper MIME types
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (path.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fallback route for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Decentraland scene server running on:`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   Remote: http://164.41.20.252:${PORT}`);
  console.log(`🔧 CORS enabled, WebGL optimized`);
});

module.exports = app;
