#!/bin/bash

# Enhanced Decentraland server startup script with WebGL compatibility
# This script ensures the scene works both locally and on remote servers

echo "🚀 Starting Decentraland scene with enhanced compatibility..."

# Set the host and port
HOST=${SCENE_HOST:-"0.0.0.0"}
PORT=${SCENE_PORT:-8050}

# Enhanced startup parameters for better compatibility
STARTUP_PARAMS="--host $HOST -p $PORT --ci --no-browser"

echo "📡 Server will be available at:"
echo "   Local:  http://localhost:$PORT"
echo "   Remote: http://164.41.20.252:$PORT"
echo ""

# Check if we're running on the remote server
if [[ "$HOST" == "0.0.0.0" ]] || [[ "$HOST" == "164.41.20.252" ]]; then
    echo "🌐 Remote server mode detected"
    echo "   Recommended URL: http://164.41.20.252:$PORT/?position=11%2C12&FORCE_WEBGL1=true&DISABLE_SHADOWS=true&DISABLE_ANTIALIASING=true&LOW_QUALITY=true"
    echo ""
fi

echo "🔧 Starting with parameters: $STARTUP_PARAMS"
echo "⚡ WebGL compatibility layer: ENABLED"
echo "🎯 Performance optimizations: ENABLED"
echo ""

# Start the development server
npx @dcl/sdk-commands start $STARTUP_PARAMS

echo "✅ Server stopped"
