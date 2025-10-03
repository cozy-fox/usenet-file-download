#!/bin/bash

# Usenet Project Startup Script
# This script starts both SABnzbd and the Next.js application

set -e

echo "🚀 Starting Usenet Project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p sabnzbd-config

# Start SABnzbd with Docker Compose
echo "🐳 Starting SABnzbd..."
docker-compose up -d sabnzbd

# Wait for SABnzbd to be ready
echo "⏳ Waiting for SABnzbd to start..."
sleep 10

# Check if SABnzbd is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "⚠️  SABnzbd might not be ready yet. You may need to configure it manually."
    echo "   Visit http://localhost:8080 to complete the setup."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start Next.js application
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
