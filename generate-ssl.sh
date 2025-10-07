#!/bin/bash

# Generate SSL certificates for HTTPS support
set -e

echo "🔐 Generating SSL certificates..."

# Create SSL directory
mkdir -p ssl

# Generate private key and certificate in one step
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=5.181.1.26"

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ SSL certificates generated!"
echo "   Your app will be available at: https://5.181.1.26"
echo "   Users will see a security warning - they need to click 'Advanced' → 'Proceed'"
