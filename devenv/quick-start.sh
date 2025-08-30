#!/bin/bash

# DBpedia Databus Quick Start Script
# This script sets up a complete development environment

set -e  # Exit on any error

echo "🚀 DBpedia Databus Development Environment Setup"
echo "================================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ All prerequisites are satisfied!"

# Setup environment
echo "🔧 Setting up development environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "�� Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. You can modify it later if needed."
else
    echo "✅ .env file already exists."
fi

# Setup git hooks
echo "🔗 Setting up git hooks..."
if [ ! -L .git/hooks/pre-commit ]; then
    cd .git/hooks
    ln -s ../../.githooks/pre-commit pre-commit
    cd ../..
    echo "✅ Git hooks configured."
else
    echo "✅ Git hooks already configured."
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
make dev-setup
make dev-start

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:3003/sparql > /dev/null 2>&1; then
    echo "✅ Virtuoso is ready"
else
    echo "❌ Virtuoso is not responding"
fi

if curl -f http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ GStore is ready"
else
    echo "❌ GStore is not responding"
fi

if curl -f http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Search service is ready"
else
    echo "❌ Search service is not responding"
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
make srv-install

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "Your Databus development environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   • Databus Web UI: http://localhost:3000"
echo "   • Virtuoso SPARQL: http://localhost:3003/sparql"
echo "   • GStore API: http://localhost:3002"
echo "   • Search API: http://localhost:3005"
echo "   • Virtuoso Admin: http://localhost:3004"
echo ""
echo "🚀 To start the Databus server, run:"
echo "   make srv-start-dev"
echo ""
echo "📚 For more information, see the README.md file."
echo ""
echo "Happy coding! 🚀"
```

Make the script executable:
```bash
chmod +x devenv/quick-start.sh
```

## Summary

I've created a comprehensive development setup that includes:

1. **Updated docker-compose.yml** - Modern Docker Compose configuration with health checks, proper networking, and all required services
2. **Comprehensive README.md** - Detailed setup instructions, troubleshooting guide, and development workflow
3. **Enhanced Makefile** - Convenient commands for all development tasks with proper environment variable handling
4. **Environment template** - Well-documented .env.example file with all configuration options
5. **Quick start script** - Automated setup script for getting started quickly

Key improvements:

- **Better organization** - Clear separation of concerns and logical grouping
- **Health checks** - Services wait for dependencies to be ready
- **Comprehensive documentation** - Step-by-step instructions with troubleshooting
- **Environment management** - Proper .env file handling and configuration
- **Development workflow** - Convenient make commands for common tasks
- **Error handling** - Better error messages and validation
- **Modern Docker practices** - Using Docker Compose v3.8+ features

This setup provides a much more robust and user-friendly development environment for the DBpedia Databus project.
