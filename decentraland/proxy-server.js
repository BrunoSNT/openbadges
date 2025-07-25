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
  ws: true, // Enable WebGL proxying
  logLevel: 'silent', // Suppress proxy logs
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
    
    // Inject WebGL error suppression for HTML responses
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      delete proxyRes.headers['content-length'];
      proxyRes.headers['transfer-encoding'] = 'chunked';
    }
  },
  onProxyResData: (responseBuffer, req, res) => {
    const response = responseBuffer.toString('utf8');
    
    // Only modify HTML responses
    if (res.getHeader('content-type') && res.getHeader('content-type').includes('text/html')) {
      // Inject WebGL error suppression script
      const webglErrorSuppression = `
        <script>
          // Comprehensive error handling and suppression
          (function() {
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            
            // Override console methods
            console.error = function() {
              const message = arguments[0];
              if (typeof message === 'string' && (
                message.includes('GL_INVALID_OPERATION') ||
                message.includes('GL_INVALID_ENUM') ||
                message.includes('GL_INVALID_VALUE') ||
                message.includes('WebGL:') ||
                message.includes('glDrawArrays') ||
                message.includes('texture format and sampler type') ||
                message.includes('Error initializing rendering') ||
                message.includes('Maximum call stack size exceeded')
              )) {
                // Suppress WebGL and Unity errors
                return;
              }
              originalConsoleError.apply(console, arguments);
            };
            
            console.warn = function() {
              const message = arguments[0];
              if (typeof message === 'string' && (
                message.includes('WebGL') ||
                message.includes('GL_') ||
                message.includes('Unity')
              )) {
                // Suppress WebGL warnings
                return;
              }
              originalConsoleWarn.apply(console, arguments);
            };
            
            // Override window.onerror to catch fatal errors
            window.addEventListener('error', function(event) {
              if (event.message.includes('GL_INVALID') || 
                  event.message.includes('WebGL') ||
                  event.message.includes('Maximum call stack size exceeded')) {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }
            });
            
            // Override unhandled promise rejections
            window.addEventListener('unhandledrejection', function(event) {
              if (event.reason && event.reason.message && (
                event.reason.message.includes('GL_INVALID') ||
                event.reason.message.includes('WebGL') ||
                event.reason.message.includes('rendering')
              )) {
                event.preventDefault();
                return false;
              }
            });
            
            // Patch the BringDownClientAndReportFatalError function
            setTimeout(() => {
              if (window.BringDownClientAndReportFatalError) {
                const original = window.BringDownClientAndReportFatalError;
                window.BringDownClientAndReportFatalError = function(error, context, payload) {
                  if (error && error.message && (
                    error.message.includes('Error initializing rendering') ||
                    error.message.includes('WebGL') ||
                    error.message.includes('GL_INVALID')
                  )) {
                    console.log('%c🎮 Suppressed WebGL fatal error', 'color: orange; font-weight: bold;');
                    return; // Don't call the original function
                  }
                  return original.call(this, error, context, payload);
                };
              }
            }, 1000);
            
            console.log('%c🎮 Enhanced WebGL error suppression active', 'color: #00ff00; font-weight: bold;');
          })();
        </script>
      `;
      
      // Insert before closing head tag or body tag
      const modifiedResponse = response.replace(
        /<\/head>/i, 
        webglErrorSuppression + '</head>'
      ).replace(
        /<\/body>/i,
        webglErrorSuppression + '</body>'
      );
      
      return Buffer.from(modifiedResponse, 'utf8');
    }
    
    return responseBuffer;
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
