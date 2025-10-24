# 🤝 Contributing to Vibe Code

Thank you for your interest in contributing to Vibe Code! This guide will help you get started.

## 🎯 Our Standards

We maintain high quality standards:

1. **80%+ test coverage** - All new code must include tests
2. **TypeScript strict mode** - No `any` types without justification
3. **Clean code** - Follow existing patterns and conventions
4. **Documentation** - Update docs for new features

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/vibe-code.git
cd vibe-code

# Add upstream remote
git remote add upstream https://github.com/original/vibe-code.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
# Create a branch for your feature/fix
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 4. Make Your Changes

- Write clean, tested code
- Follow existing code style
- Update documentation
- Add tests (coverage target: 80%+)

### 5. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Must pass with 80%+ coverage!
```

### 6. Commit

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add transparent pricing dashboard

- Implement real-time cost tracking
- Add competitor comparison chart
- Update docs with pricing examples
"
```

**Commit Message Format:**

```
type: short description

- Detail 1
- Detail 2
- Detail 3
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### 7. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## 📝 Pull Request Guidelines

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Coverage is 80%+ (`npm run test:coverage`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] PR description explains changes

### PR Description Template

```markdown
## What does this PR do?

Brief description of the changes.

## Why?

Explanation of why these changes are needed.

## How?

Technical details of the implementation.

## Testing

How to test these changes.

## Screenshots (if applicable)

Before/after screenshots for UI changes.

## Checklist

- [ ] Tests pass
- [ ] Coverage 80%+
- [ ] Docs updated
- [ ] Type-safe
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Initialize
  })

  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = createInput()

      // Act
      const result = component.method(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle edge case', () => {
      // Test edge cases
    })

    it('should handle errors', () => {
      // Test error handling
    })
  })
})
```

### Coverage Requirements

| Type | Target |
|------|--------|
| Lines | 80%+ |
| Functions | 80%+ |
| Branches | 80%+ |
| Statements | 80%+ |

### What to Test

✅ **Do test:**
- Core business logic
- Edge cases
- Error handling
- User-facing features
- Integration points

❌ **Don't test:**
- Third-party libraries
- Simple getters/setters
- Configuration files

## 📁 Project Structure

```
vibe-code/
├── src/
│   ├── app/              # Next.js pages
│   ├── lib/              # Core logic
│   │   ├── pricing/      # Pricing engine
│   │   ├── frameworks/   # Framework support
│   │   └── ai/           # AI integration
│   ├── components/       # React components
│   └── tests/            # Test utilities
├── docs/                 # Documentation
└── package.json
```

## 🎨 Code Style

### TypeScript

```typescript
// ✅ Good
export interface UserData {
  id: string
  name: string
  email: string
}

export function createUser(data: UserData): User {
  // Implementation
}

// ❌ Bad
export function createUser(data: any): any {
  // No type safety
}
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase`

### Comments

```typescript
// ✅ Good - Explains WHY
// Use debounce to prevent API spam during typing
const debouncedSearch = debounce(search, 300)

// ❌ Bad - Explains WHAT (code already shows this)
// Call the search function with debounce of 300ms
const debouncedSearch = debounce(search, 300)
```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug.

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

What should happen.

## Actual Behavior

What actually happens.

## Environment

- OS: [e.g., macOS 13.0]
- Node: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]

## Additional Context

Screenshots, logs, etc.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature.

## Problem it Solves

What user problem does this address?

## Proposed Solution

How should it work?

## Alternatives Considered

Other approaches you've thought about.

## Additional Context

Mockups, examples, etc.
```

## 🎯 Areas to Contribute

### High Priority

- [ ] Real AI API integration (Anthropic, OpenAI)
- [ ] UI/UX improvements
- [ ] Performance optimizations
- [ ] More framework support

### Medium Priority

- [ ] Documentation improvements
- [ ] Example projects
- [ ] Integration tests
- [ ] E2E tests

### Good First Issues

- [ ] Fix typos in documentation
- [ ] Add more unit tests
- [ ] Improve error messages
- [ ] Add code comments

Look for issues tagged with `good-first-issue` on GitHub!

## 📞 Getting Help

- **Questions**: [GitHub Discussions](https://github.com/yourusername/vibe-code/discussions)
- **Bugs**: [GitHub Issues](https://github.com/yourusername/vibe-code/issues)
- **Chat**: [Discord Server](https://discord.gg/vibecode)

## 🏆 Recognition

Contributors are recognized in:

- README.md contributors section
- CHANGELOG.md for each release
- Monthly contributor highlights

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making Vibe Code better!** 🎉
