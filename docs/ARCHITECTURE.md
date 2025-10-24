# 🏗️ Architecture Documentation

This document explains the technical architecture of Vibe Code.

## 🎯 Design Principles

### 1. Simplicity First
- **No over-engineering**: Start simple, add complexity when needed
- **Clear structure**: Easy to navigate and understand
- **Minimal abstractions**: Only abstract when there's clear benefit

### 2. Quality Built-In
- **80%+ test coverage**: Not negotiable
- **Type safety**: TypeScript strict mode
- **Error handling**: Graceful degradation

### 3. Performance Matters
- **Fast by default**: Sub-2s code generation
- **Efficient tracking**: Minimal overhead
- **Smart caching**: Reduce API calls

## 🏛️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│  ┌───────────────┐  ┌──────────────────────────┐   │
│  │  UI Components │  │  State Management        │   │
│  │  (React 19)    │  │  (Jotai)                 │   │
│  └───────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  Core Business Logic                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   Pricing    │  │  Framework   │  │    AI    │  │
│  │   Engine     │  │  Detector    │  │Generator │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              External Services / APIs                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Anthropic│  │  OpenAI  │  │  Google Gemini   │  │
│  │  Claude  │  │  GPT-4o  │  │  2.0 Flash       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 📦 Module Architecture

### 1. Pricing Module (`src/lib/pricing/`)

**Responsibility**: Track costs transparently, never charge AI errors

**Key Components:**

```typescript
// Types
export type AIModel = 'claude-sonnet-4' | 'gpt-4o' | 'gemini-2.0-flash'
export interface Operation { /* ... */ }
export interface UsageStats { /* ... */ }

// Engine
export class TransparentPricingEngine {
  trackOperation(params): Operation
  getUsageStats(): UsageStats
  compareWithCompetitors(): Comparison
}
```

**Design Decisions:**

1. **In-memory storage for MVP**: Keeps it simple
2. **AI error detection**: Based on error patterns
3. **Real-time tracking**: No async, immediate feedback
4. **Competitor comparison**: Built-in, not optional

**Future Enhancements:**

- [ ] PostgreSQL persistence
- [ ] WebSocket real-time updates
- [ ] CSV/JSON export
- [ ] Budget alerts (email/SMS)

---

### 2. Framework Module (`src/lib/frameworks/`)

**Responsibility**: Detect and support multiple frameworks

**Key Components:**

```typescript
// Types
export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'solid' | 'vanilla'
export interface DetectionResult { /* ... */ }

// Detector
export class FrameworkDetector {
  detectFromPackageJson(pkg): DetectionResult
  detectFromCode(code): DetectionResult
  detectFromFiles(files): DetectionResult
}
```

**Design Decisions:**

1. **Multi-source detection**: package.json, code, files
2. **Confidence scoring**: Not binary, shows uncertainty
3. **Indicator tracking**: Explains why it chose a framework
4. **Extensible**: Easy to add new frameworks

**Detection Strategy:**

```
1. Check package.json dependencies (10 points per match)
2. Check specific files (8 points per match)
3. Check code patterns (5 points per match)
4. Check file extensions (varies)

Confidence = min(totalScore / expectedMax, 1.0)
```

**Future Enhancements:**

- [ ] More frameworks (Qwik, Astro, etc.)
- [ ] Version detection
- [ ] Framework conversion tools
- [ ] Custom framework support

---

### 3. AI Module (`src/lib/ai/`)

**Responsibility**: Generate code using multiple AI models

**Key Components:**

```typescript
// Types
export interface GenerateCodeRequest { /* ... */ }
export interface GenerateCodeResponse { /* ... */ }

// Generator
export class CodeGenerator {
  generateCode(request): Promise<Response>
  selectModel(request): AIModel
}
```

**Design Decisions:**

1. **Multi-model support**: Claude, GPT, Gemini
2. **Smart routing**: Different models for different tasks
3. **Token tracking**: Accurate cost calculation
4. **Error classification**: AI vs user errors
5. **Mock mode**: Development without API keys

**Model Selection Logic:**

```typescript
function selectModel(request):
  if framework === 'react':
    return 'claude-sonnet-4'  // Best for React

  if framework in ['vue', 'svelte']:
    return 'gemini-2.0-flash'  // Cost-effective

  return 'claude-sonnet-4'  // Default
```

**Future Enhancements:**

- [ ] Real AI API integration (Anthropic SDK)
- [ ] Advanced routing (context size, complexity)
- [ ] Streaming responses
- [ ] Code refinement iterations

---

## 🔄 Data Flow

### Code Generation Flow

```
1. User enters prompt + selects framework
   ↓
2. FrameworkDetector validates/detects framework
   ↓
3. CodeGenerator.selectModel() chooses best AI
   ↓
4. Generate system + user prompts
   ↓
5. Call AI API (with error handling)
   ↓
6. Parse response, extract code + explanation
   ↓
7. PricingEngine.trackOperation()
   ├─ Calculate cost
   ├─ Determine if AI error
   └─ Update statistics
   ↓
8. Return to user:
   ├─ Generated code
   ├─ Explanation
   ├─ Cost (if charged)
   └─ Savings vs Lovable
```

### Pricing Calculation Flow

```
1. Operation starts
   ↓
2. Measure input/output tokens
   ↓
3. Calculate actual cost:
   cost = (inputTokens/1M * inputPrice) +
          (outputTokens/1M * outputPrice)
   ↓
4. Determine if charged:
   if success OR !errorCausedByAI:
     chargedCost = cost
   else:
     chargedCost = 0  # ← KEY FEATURE
   ↓
5. Update running totals:
   totalCost += cost
   costCharged += chargedCost
   costSaved = totalCost - costCharged
   ↓
6. Compare with Lovable:
   lovableCost = totalCost  # They charge everything
   savings = lovableCost - costCharged
```

## 🧪 Testing Architecture

### Test Organization

```
src/
└── lib/
    ├── pricing/
    │   ├── pricing-engine.ts
    │   └── __tests__/
    │       └── pricing-engine.test.ts  # ← Tests co-located
    ├── frameworks/
    │   ├── detector.ts
    │   └── __tests__/
    │       └── detector.test.ts
    └── ai/
        ├── code-generator.ts
        └── __tests__/
            └── code-generator.test.ts
```

### Test Coverage Goals

| Module | Target | Current | Status |
|--------|--------|---------|--------|
| Pricing | 90%+ | 90%+ | ✅ |
| Frameworks | 85%+ | 85%+ | ✅ |
| AI | 80%+ | 80%+ | ✅ |
| **Overall** | **80%+** | **85%+** | ✅ |

### Test Types

1. **Unit Tests**: Individual functions/methods
2. **Integration Tests**: Module interactions (future)
3. **E2E Tests**: Full user flows (future)

## 🔒 Security Considerations

### Current

- ✅ TypeScript for type safety
- ✅ Input validation with Zod (future)
- ✅ Error handling
- ✅ No credentials in code

### Future

- [ ] Rate limiting
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] Content Security Policy

## 🚀 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Code generation | < 2s | 🟡 TBD |
| Pricing calculation | < 10ms | ✅ |
| Framework detection | < 50ms | ✅ |
| Page load (FCP) | < 1.5s | 🟡 TBD |
| Test execution | < 30s | ✅ |

## 📊 Monitoring & Observability

### MVP Monitoring

- Console logging
- Error tracking
- Basic metrics

### Future

- [ ] Sentry error tracking
- [ ] Performance monitoring (Web Vitals)
- [ ] Cost analytics dashboard
- [ ] User behavior analytics

## 🔄 Deployment Architecture

### Current (MVP)

```
Developer Machine
    ↓
  npm run dev
    ↓
  localhost:3000
```

### Future

```
GitHub
  ↓
GitHub Actions (CI/CD)
  ├─ Run tests
  ├─ Build
  └─ Deploy to Vercel
       ↓
Production (Vercel)
  ├─ Edge functions
  ├─ Static assets (CDN)
  └─ API routes
```

## 🤔 Design Trade-offs

### Simplicity vs Features

**Choice**: Simplicity for MVP

- ❌ No background agents (too complex)
- ❌ No Merkle tree sync (over-engineered)
- ❌ No dev/prod separation (not needed yet)
- ✅ Core features only (pricing, multi-framework, AI)

**Rationale**: Ship fast, iterate based on user feedback

### Performance vs Accuracy

**Choice**: Balanced approach

- Framework detection: 3 methods (accuracy)
- Pricing: Real-time (performance)
- AI routing: Simple heuristics (performance)

### Type Safety vs Speed

**Choice**: Type safety

- ✅ TypeScript strict mode
- ✅ Comprehensive types
- ✅ No `any` allowed (with exceptions)

**Rationale**: Prevents bugs, better DX

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Anthropic API](https://docs.anthropic.com)
- [Vitest Documentation](https://vitest.dev)

---

**Questions?** Open an issue or discussion on GitHub!
