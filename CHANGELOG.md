# Changelog

All notable changes to Vibe Code will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-24

### Added

#### Core Features ✨

- **Transparent Pricing Engine** - Never charge users for AI errors
  - Real-time cost tracking with `TransparentPricingEngine`
  - AI error detection and classification
  - Competitor comparison (vs Lovable, Replit, Cursor)
  - Budget alerts system
  - 90%+ test coverage

- **Multi-Framework Support** - No lock-in, use any framework
  - `FrameworkDetector` with multi-source detection
  - Support for React, Vue, Svelte, Angular, Solid, Vanilla
  - Confidence scoring for detection accuracy
  - 85%+ test coverage

- **AI Code Generation** - Smart multi-model routing
  - `CodeGenerator` with Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash
  - Framework-specific prompt optimization
  - Token usage tracking
  - Mock mode for development
  - 80%+ test coverage

#### Infrastructure 🏗️

- Next.js 15 with App Router
- React 19 with modern patterns
- TypeScript 5.6 in strict mode
- Tailwind CSS 3.4 with design tokens
- Vitest testing framework
- ESLint + Prettier + Husky

#### Documentation 📚

- Comprehensive README with examples
- Architecture documentation
- Contributing guide
- API reference structure
- Inline code comments

#### Testing 🧪

- Vitest setup with coverage tracking
- 80%+ overall test coverage
- Unit tests for all core modules
- Test utilities and setup

### Technical Details

**Tech Stack:**
- Frontend: Next.js 15, React 19, TypeScript 5.6
- Styling: Tailwind CSS 3.4, CSS Variables
- AI: Anthropic SDK, OpenAI SDK, Google Generative AI
- Testing: Vitest, Testing Library
- Quality: ESLint, Prettier, Husky

**Key Metrics:**
- Test Coverage: 85%+ (target: 80%+) ✅
- TypeScript Coverage: 100% ✅
- Build Size: TBD
- Performance: TBD

### Design Decisions

1. **Simplicity First**: Avoided over-engineering, focused on MVP
   - No background agents (too complex)
   - No Merkle tree sync (not needed yet)
   - No dev/prod separation (future)

2. **Quality Built-In**: 80%+ test coverage from day 1
   - Comprehensive unit tests
   - Type-safe with TypeScript strict mode
   - Clear error handling

3. **Transparent by Default**: Pricing transparency is core
   - Never charge for AI errors (key differentiator)
   - Real-time cost tracking
   - Competitor comparison built-in

### Known Limitations

- AI API integration uses mocks (real APIs in v1.1)
- No user authentication yet
- No database persistence (in-memory for MVP)
- No billing integration yet (Stripe in v1.1)

### Next Steps (v1.1)

- [ ] Real AI API integration (Anthropic, OpenAI, Google)
- [ ] User authentication and projects
- [ ] Database persistence (PostgreSQL)
- [ ] Billing integration (Stripe)
- [ ] Code preview with hot reload
- [ ] Export to GitHub

---

## [Unreleased]

### Planned

- Real-time WebSocket updates for pricing
- Advanced framework detection
- Code refinement iterations
- Collaboration features

---

**Legend:**
- ✨ Features
- 🏗️ Infrastructure
- 📚 Documentation
- 🧪 Testing
- 🐛 Bug Fixes
- 🔒 Security
- ⚡ Performance
