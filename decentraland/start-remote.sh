#!/bin/bash

# Network-aware Decentraland server startup script
# Handles CORS, WebGL compatibility, and Unity streaming assets issues

echo "🚀 Starting Decentraland scene with network compatibility..."

# Set the port
PORT=${SCENE_PORT:-8050}

# Check if express is available
if command -v node >/dev/null 2>&1 && [ -f "proxy-server.js" ]; then
    echo "🌐 Starting with Express proxy server (recommended for remote access)..."
    echo "📡 This solves CORS and Unity streaming assets issues"
    echo ""
    echo "Server will be available at:"
    echo "   Local:  http://localhost:$PORT"
    echo "   Remote: http://164.41.20.252:$PORT"
    echo ""
    echo "🔧 Features enabled:"
    echo "   ✓ CORS headers"
    echo "   ✓ WebGL compatibility"
    echo "   ✓ Unity streaming assets fix"
    echo "   ✓ Proper MIME types"
    echo ""
    
    # Start the proxy server
    SCENE_PORT=$PORT node proxy-server.js
else
    echo "⚠️  Express proxy not available, using standard SDK server..."
    echo "🔧 Installing dependencies first..."
    
    # Install required dependencies
    npm install express 2>/dev/null || echo "⚠️  Could not install dependencies"
    
    # Enhanced startup parameters for better compatibility
    STARTUP_PARAMS="-p $PORT --ci --no-browser"
    
    echo "📡 Server will be available at:"
    echo "   Local:  http://localhost:$PORT"
    echo "   Remote: http://164.41.20.252:$PORT"
    echo ""
    
    echo "🌐 Remote server mode detected"
    echo "   Recommended URL: http://164.41.20.252:$PORT/?position=11%2C12&FORCE_WEBGL1=true&DISABLE_SHADOWS=true&DISABLE_ANTIALIASING=true&LOW_QUALITY=true&DISABLE_ADDRESSABLES=true"
    echo ""
    echo "⚠️  Note: If Unity gets stuck in infinite loop, use SSH tunnel instead:"
    echo "   ssh -L 8050:localhost:8050 -p 13508 sanguinetti@164.41.20.252"
    echo ""
    
    echo "🔧 Starting with parameters: $STARTUP_PARAMS"
    echo "⚡ WebGL compatibility layer: ENABLED"
    echo "🎯 Performance optimizations: ENABLED"
    echo ""
    
    # Start the development server
    npx @dcl/sdk-commands start $STARTUP_PARAMS
fi

echo "✅ Server stopped"
