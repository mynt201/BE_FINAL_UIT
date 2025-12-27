#!/bin/bash

# ======================================
# Docker Configuration Validator
# ======================================

echo "🐳 Validating Docker Configuration..."
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "   Please install Docker Compose"
    exit 1
fi

echo "✅ Docker Compose is available"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo "   Please start Docker Desktop or Docker service"
    exit 1
fi

echo "✅ Docker daemon is running"

# Check required files
files=("Dockerfile" "docker-compose.yml" "docker-compose.dev.yml" ".dockerignore")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file missing - will use default values"
fi

# Check required directories
dirs=("docker/nginx" "docker/mongo-init")

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir directory exists"
    else
        echo "❌ $dir directory missing"
        exit 1
    fi
done

# Validate docker-compose files
echo ""
echo "🔍 Validating Docker Compose configurations..."

if docker-compose -f docker-compose.yml config --quiet 2>/dev/null; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has errors"
    exit 1
fi

if docker-compose -f docker-compose.dev.yml config --quiet 2>/dev/null; then
    echo "✅ docker-compose.dev.yml is valid"
else
    echo "❌ docker-compose.dev.yml has errors"
    exit 1
fi

if docker-compose -f docker-compose.prod.yml config --quiet 2>/dev/null; then
    echo "✅ docker-compose.prod.yml is valid"
else
    echo "❌ docker-compose.prod.yml has errors"
    exit 1
fi

echo ""
echo "🎉 All Docker configurations are valid!"
echo ""
echo "🚀 Ready to deploy:"
echo "   Development:  docker-compose -f docker-compose.dev.yml up --build"
echo "   Production:   docker-compose -f docker-compose.prod.yml up --build -d"
echo "   Azure:        docker-compose -f docker-compose.azure.yml up --build -d"
echo ""
echo "📚 See README-Docker.md for detailed deployment instructions"
