#!/bin/bash

# Usenet Project Startup Script
# Usage: ./start.sh [https]
#   ./start.sh        - Start in development mode (HTTP)
#   ./start.sh https  - Start in production mode (HTTPS)

set -e

if [ "$1" = "https" ]; then
    echo "🚀 Starting Usenet Project with HTTPS..."
    HTTPS_MODE=true
else
    echo "🚀 Starting Usenet Project (Development Mode)..."
    HTTPS_MODE=false
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p sabnzbd-config

if [ "$HTTPS_MODE" = true ]; then
    # HTTPS Production Mode
    echo "🔐 Generating SSL certificates..."
    ./generate-ssl.sh
    
    echo "🐳 Starting all services with HTTPS..."
    docker-compose -f docker-compose.https.yml up -d --build
    
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    echo "✅ Usenet Project is running with HTTPS!"
    echo "   - Main App: https://5.181.1.26"
    echo "   - SABnzbd Web UI: http://5.181.1.26:8080"
    echo ""
    echo "⚠️  Users will see a security warning - they need to click 'Advanced' → 'Proceed'"
    
else
    # HTTP Development Mode
    echo "🐳 Starting SABnzbd..."
    docker-compose up -d sabnzbd
    
    echo "⏳ Waiting for SABnzbd to start..."
    sleep 10
    
    if ! curl -s http://localhost:8080 > /dev/null; then
        echo "⚠️  SABnzbd might not be ready yet. You may need to configure it manually."
        echo "   Visit http://localhost:8080 to complete the setup."
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    echo "🌐 Starting Next.js application..."
    npm run dev
    
    echo "✅ Usenet Project is running!"
    echo "   - Next.js App: http://localhost:3000"
    echo "   - SABnzbd Web UI: http://localhost:8080"
    echo ""
    echo "📝 First time setup:"
    echo "   1. Visit http://localhost:8080 to configure SABnzbd"
    echo "   2. Add your Eweka provider settings"
    echo "   3. Get your API key from SABnzbd settings"
    echo "   4. Add SABNZBD_API_KEY to your .env file"
fi
