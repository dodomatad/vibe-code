# 📚 Vibe Code Documentation

Welcome to the Vibe Code documentation! This guide will help you understand, use, and contribute to the project.

## 📖 Table of Contents

1. [Getting Started](./getting-started.md)
2. [Architecture](./ARCHITECTURE.md)
3. [API Reference](./api-reference.md)
4. [Contributing](./CONTRIBUTING.md)
5. [Testing Guide](./testing.md)

## 🎯 What is Vibe Code?

Vibe Code is an AI-powered code generation platform built to solve real problems:

### The Problem

Existing platforms like Lovable, Replit, and Cursor have critical issues:

1. **Hidden costs**: They charge you even when the AI makes mistakes
2. **Framework lock-in**: Limited to React or specific frameworks
3. **Opaque pricing**: You don't know what you're paying until the bill arrives
4. **Poor reliability**: Missing tests, unclear quality standards

### Our Solution

Vibe Code addresses these with:

1. **Transparent Pricing**: Never pay for AI errors, see costs in real-time
2. **Multi-Framework**: React, Vue, Svelte, Angular, Solid - your choice
3. **Production Quality**: 80%+ test coverage, real benchmarks
4. **Open Development**: Public roadmap, clear documentation

## 🚀 Quick Start

```bash
# Install
npm install

# Setup environment
cp .env.example .env
# Add your API keys

# Run development server
npm run dev

# Run tests
npm test
```

## 🏗️ Core Concepts

### 1. Transparent Pricing Engine

The heart of Vibe Code. Tracks every operation and ensures you're never charged for AI mistakes.

**Key files:**
- `src/lib/pricing/pricing-engine.ts` - Main engine
- `src/lib/pricing/types.ts` - Type definitions
- `src/lib/pricing/__tests__/` - Comprehensive tests

**Learn more:** [Pricing System Guide](./pricing-system.md)

### 2. Multi-Framework Support

Detects and generates code for multiple frameworks without lock-in.

**Key files:**
- `src/lib/frameworks/detector.ts` - Framework detection
- `src/lib/frameworks/types.ts` - Framework types

**Learn more:** [Framework Support Guide](./framework-support.md)

### 3. AI Code Generation

Multi-model routing to use the best AI for each task.

**Key files:**
- `src/lib/ai/code-generator.ts` - Code generation
- `src/lib/ai/types.ts` - Generation types

**Learn more:** [AI Integration Guide](./ai-integration.md)

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│         User Interface (Next.js)         │
├─────────────────────────────────────────┤
│  ┌────────────┐  ┌──────────────────┐  │
│  │   Pricing   │  │   Framework      │  │
│  │   Tracker   │  │   Detector       │  │
│  └────────────┘  └──────────────────┘  │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │   AI Code Generator               │  │
│  │   (Multi-model routing)           │  │
│  └──────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────────┐     │
│  │Claude│  │ GPT  │  │  Gemini  │     │
│  └──────┘  └──────┘  └──────────┘     │
└─────────────────────────────────────────┘
```

**Learn more:** [Architecture Deep Dive](./ARCHITECTURE.md)

## 🧪 Testing Philosophy

We maintain 80%+ test coverage because:

1. **Reliability**: Users trust us with their code and money
2. **Confidence**: Refactor without fear
3. **Documentation**: Tests show how to use the code
4. **Quality**: Catch bugs before users do

**Learn more:** [Testing Guide](./testing.md)

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🧪 More tests

**Learn more:** [Contributing Guide](./CONTRIBUTING.md)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/vibe-code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/vibe-code/discussions)
- **Email**: support@vibecode.dev

## 🗺️ What's Next?

- [Getting Started Guide](./getting-started.md) - Start using Vibe Code
- [Architecture](./ARCHITECTURE.md) - Understand the system design
- [API Reference](./api-reference.md) - Complete API documentation
- [Testing Guide](./testing.md) - Learn our testing practices

---

**Questions?** Open an issue or discussion on GitHub!
