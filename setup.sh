#!/bin/bash

# ======================================
# Flood Risk Backend - Setup Script
# ======================================

echo "🚀 Flood Risk Backend Setup"
echo "============================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to >= 18.0.0"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB:"
    echo "   mongod"
    echo ""
    echo "   Or if using MongoDB Atlas, update MONGODB_URI in .env"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please update the JWT secrets and database URI in .env"
    else
        echo "❌ .env.example not found. Please create .env manually."
        echo "   Refer to ENV_CONFIG.md for configuration details."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check environment configuration
echo "🔧 Checking environment configuration..."
if npm run check-env; then
    echo "✅ Environment configuration is valid"
else
    echo "❌ Environment configuration issues found"
    echo "   Please fix the issues above and run setup again"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads logs backups

# Ask user if they want to seed data
echo ""
echo "🌱 Do you want to seed sample data? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🌱 Seeding sample data..."
    if npm run seed; then
        echo "✅ Sample data seeded successfully"
    else
        echo "❌ Failed to seed data. Make sure MongoDB is running."
        exit 1
    fi
else
    echo "ℹ️  Skipping data seeding"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📊 Available scripts:"
echo "   npm run dev     - Start development server"
echo "   npm run build   - Build for production"
echo "   npm run start   - Start production server"
echo "   npm run seed    - Seed sample data"
echo "   npm run test    - Run tests"
echo "   npm check-env   - Check environment configuration"
echo ""
echo "📚 Documentation:"
echo "   README.md       - Main documentation"
echo "   ENV_CONFIG.md   - Environment configuration guide"
echo "   API_REFERENCE.md- API documentation"
echo ""
echo "🔗 Server will be available at: http://localhost:5000"
echo "🔗 API endpoints: http://localhost:5000/api/v1"
echo ""
echo "👤 Default admin account:"
echo "   Username: admin"
echo "   Password: Admin123!"
echo "   Email: admin@floodrisk.com"
