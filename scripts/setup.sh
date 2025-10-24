#!/bin/bash

# ============================================================================
# Vibe Code v3.0.0 - Setup Script
# ============================================================================

set -e

echo "🚀 Vibe Code v3.0.0 - Setup Script"
echo "====================================="
echo ""

# ----------------------------------------------------------------------------
# 1. Check prerequisites
# ----------------------------------------------------------------------------

echo "✓ Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "  ✓ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "  Installing pnpm..."
    npm install -g pnpm
fi

echo "  ✓ pnpm $(pnpm -v)"

# ----------------------------------------------------------------------------
# 2. Install dependencies
# ----------------------------------------------------------------------------

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo "  ✓ Dependencies installed"

# ----------------------------------------------------------------------------
# 3. Setup environment variables
# ----------------------------------------------------------------------------

echo ""
echo "⚙️  Setting up environment variables..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "  ✓ Created .env file from .env.example"
    echo ""
    echo "  ⚠️  IMPORTANT: You need to add your API keys to .env:"
    echo "     - ANTHROPIC_API_KEY (https://console.anthropic.com/)"
    echo "     - OPENAI_API_KEY (https://platform.openai.com/api-keys)"
    echo "     - GOOGLE_API_KEY (https://ai.google.dev/)"
    echo ""
else
    echo "  ✓ .env file already exists"
fi

# ----------------------------------------------------------------------------
# 4. Run type check
# ----------------------------------------------------------------------------

echo ""
echo "🔍 Running type check..."
pnpm run type-check

echo "  ✓ Type check passed"

# ----------------------------------------------------------------------------
# 5. Run tests
# ----------------------------------------------------------------------------

echo ""
echo "🧪 Running tests..."
pnpm run test:unit

echo "  ✓ All tests passed"

# ----------------------------------------------------------------------------
# 6. Success!
# ----------------------------------------------------------------------------

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add your API keys to .env file"
echo "  2. Run 'pnpm run dev' to start development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "Documentation:"
echo "  - Implementation Guide: IMPLEMENTATION_GUIDE.md"
echo "  - README: README.md"
echo ""
echo "Happy coding! 🚀"
