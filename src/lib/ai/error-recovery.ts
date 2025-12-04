// Advanced Error Recovery System
// Self-correction and iterative refinement based on Agent-R and CYCLE approaches

export interface ErrorContext {
  errorType: "syntax" | "runtime" | "type" | "logic" | "import" | "network" | "unknown"
  message: string
  stack?: string
  file?: string
  line?: number
  column?: number
  code?: string
  previousAttempts: number
}

export interface RecoveryStrategy {
  name: string
  description: string
  applicableTo: ErrorContext["errorType"][]
  priority: number
  execute: (error: ErrorContext, context: any) => Promise<RecoveryResult>
}

export interface RecoveryResult {
  success: boolean
  fix?: {
    file: string
    oldContent: string
    newContent: string
    description: string
  }
  suggestion?: string
  needsHumanReview: boolean
}

// Error classification patterns
const ERROR_PATTERNS: Array<{
  type: ErrorContext["errorType"]
  patterns: RegExp[]
}> = [
  {
    type: "syntax",
    patterns: [
      /SyntaxError/i,
      /Unexpected token/i,
      /Unterminated string/i,
      /Invalid or unexpected token/i,
      /Parsing error/i
    ]
  },
  {
    type: "type",
    patterns: [
      /TypeError/i,
      /is not a function/i,
      /Cannot read propert/i,
      /undefined is not/i,
      /null is not/i,
      /Type '.*' is not assignable/i,
      /Property '.*' does not exist/i
    ]
  },
  {
    type: "runtime",
    patterns: [
      /ReferenceError/i,
      /is not defined/i,
      /Cannot find module/i,
      /Module not found/i
    ]
  },
  {
    type: "import",
    patterns: [
      /Cannot find module/i,
      /Module not found/i,
      /Failed to resolve import/i,
      /does not provide an export/i
    ]
  },
  {
    type: "network",
    patterns: [
      /NetworkError/i,
      /fetch failed/i,
      /ECONNREFUSED/i,
      /timeout/i
    ]
  },
  {
    type: "logic",
    patterns: [
      /Maximum call stack/i,
      /Infinite loop/i,
      /assertion failed/i
    ]
  }
]

// Classify error type
export function classifyError(message: string): ErrorContext["errorType"] {
  for (const { type, patterns } of ERROR_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return type
      }
    }
  }
  return "unknown"
}

// Parse error details from message
export function parseErrorDetails(errorMessage: string): Partial<ErrorContext> {
  const result: Partial<ErrorContext> = {
    message: errorMessage,
    errorType: classifyError(errorMessage)
  }

  // Extract file and line number
  const fileLineMatch = errorMessage.match(/(?:at |in |from )([^:]+):(\d+)(?::(\d+))?/)
  if (fileLineMatch) {
    result.file = fileLineMatch[1]
    result.line = parseInt(fileLineMatch[2], 10)
    result.column = fileLineMatch[3] ? parseInt(fileLineMatch[3], 10) : undefined
  }

  // Extract stack trace
  const stackMatch = errorMessage.match(/(?:Error:.*\n)?((?:\s+at .+\n?)+)/)
  if (stackMatch) {
    result.stack = stackMatch[1]
  }

  return result
}

// Common fix strategies
export const RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  // Strategy: Fix missing imports
  {
    name: "fix_missing_import",
    description: "Add missing import statement",
    applicableTo: ["import", "runtime"],
    priority: 10,
    execute: async (error, context) => {
      const importMatch = error.message.match(/Cannot find module '([^']+)'|Module not found.*'([^']+)'/)
      if (!importMatch) return { success: false, needsHumanReview: true }

      const moduleName = importMatch[1] || importMatch[2]

      // Check if it's a local import or npm package
      const isLocalImport = moduleName.startsWith(".") || moduleName.startsWith("@/")

      if (isLocalImport) {
        // For local imports, suggest creating the file
        return {
          success: false,
          suggestion: `Create the missing file: ${moduleName}`,
          needsHumanReview: true
        }
      }

      // For npm packages, suggest installation
      return {
        success: true,
        suggestion: `Install missing package: npm install ${moduleName}`,
        needsHumanReview: false
      }
    }
  },

  // Strategy: Fix undefined property access
  {
    name: "fix_undefined_access",
    description: "Add optional chaining or null check",
    applicableTo: ["type", "runtime"],
    priority: 8,
    execute: async (error, context) => {
      const propMatch = error.message.match(/Cannot read propert(?:y|ies) (?:'|")(\w+)(?:'|") of (undefined|null)/)
      if (!propMatch || !error.file || !error.code) {
        return { success: false, needsHumanReview: true }
      }

      const property = propMatch[1]
      const line = error.line || 0

      // Find the problematic access pattern
      const lines = error.code.split("\n")
      const problemLine = lines[line - 1] || ""

      // Add optional chaining
      const fixedLine = problemLine.replace(
        new RegExp(`\\.${property}(?!\\?)`, "g"),
        `?.${property}`
      )

      if (fixedLine !== problemLine) {
        const newCode = [...lines]
        newCode[line - 1] = fixedLine

        return {
          success: true,
          fix: {
            file: error.file,
            oldContent: error.code,
            newContent: newCode.join("\n"),
            description: `Added optional chaining for ${property} access`
          },
          needsHumanReview: false
        }
      }

      return { success: false, needsHumanReview: true }
    }
  },

  // Strategy: Fix TypeScript type errors
  {
    name: "fix_type_error",
    description: "Fix TypeScript type assignment errors",
    applicableTo: ["type"],
    priority: 7,
    execute: async (error, context) => {
      const typeMatch = error.message.match(/Type '([^']+)' is not assignable to type '([^']+)'/)
      if (!typeMatch) return { success: false, needsHumanReview: true }

      const [, sourceType, targetType] = typeMatch

      // Common type fixes
      if (targetType === "string" && (sourceType === "number" || sourceType === "undefined")) {
        return {
          success: true,
          suggestion: `Add type conversion: String(value) or value?.toString() ?? ""`,
          needsHumanReview: true
        }
      }

      if (targetType.includes("[]") && !sourceType.includes("[]")) {
        return {
          success: true,
          suggestion: `Wrap in array: [value] or ensure the source returns an array`,
          needsHumanReview: true
        }
      }

      return {
        success: false,
        suggestion: `Type mismatch: expected ${targetType}, got ${sourceType}. Review the code logic.`,
        needsHumanReview: true
      }
    }
  },

  // Strategy: Fix syntax errors
  {
    name: "fix_syntax_error",
    description: "Fix common syntax errors",
    applicableTo: ["syntax"],
    priority: 9,
    execute: async (error, context) => {
      if (!error.code || !error.line) {
        return { success: false, needsHumanReview: true }
      }

      const lines = error.code.split("\n")
      const problemLine = lines[error.line - 1] || ""

      // Check for common issues
      const fixes: Array<{ pattern: RegExp; fix: string; description: string }> = [
        // Missing closing bracket
        { pattern: /\{[^}]*$/, fix: "$&}", description: "Added missing closing brace" },
        // Missing closing parenthesis
        { pattern: /\([^)]*$/, fix: "$&)", description: "Added missing closing parenthesis" },
        // Missing semicolon (for style)
        { pattern: /[^;{}\s]$/, fix: "$&;", description: "Added missing semicolon" },
        // Extra comma in array/object
        { pattern: /,\s*[}\]]/, fix: (m: string) => m.replace(",", ""), description: "Removed trailing comma" }
      ]

      for (const { pattern, fix, description } of fixes) {
        if (pattern.test(problemLine)) {
          const fixedLine = typeof fix === "function"
            ? problemLine.replace(pattern, fix)
            : problemLine.replace(pattern, fix)

          if (fixedLine !== problemLine) {
            const newCode = [...lines]
            newCode[error.line - 1] = fixedLine

            return {
              success: true,
              fix: {
                file: error.file!,
                oldContent: error.code,
                newContent: newCode.join("\n"),
                description
              },
              needsHumanReview: false
            }
          }
        }
      }

      return { success: false, needsHumanReview: true }
    }
  },

  // Strategy: Fix async/await issues
  {
    name: "fix_async_issues",
    description: "Fix missing async/await",
    applicableTo: ["type", "runtime"],
    priority: 6,
    execute: async (error, context) => {
      if (error.message.includes("is not a function") && error.code && error.line) {
        const lines = error.code.split("\n")
        const problemLine = lines[error.line - 1] || ""

        // Check if missing await
        if (/\.then\(|Promise|async/.test(error.code) && !/await/.test(problemLine)) {
          return {
            success: true,
            suggestion: "This might be a Promise that needs 'await'. Add 'await' before the async call.",
            needsHumanReview: true
          }
        }
      }

      return { success: false, needsHumanReview: true }
    }
  }
]

// Error Recovery Engine
export class ErrorRecoveryEngine {
  private strategies: RecoveryStrategy[]
  private maxAttempts: number = 3

  constructor(customStrategies?: RecoveryStrategy[]) {
    this.strategies = [...RECOVERY_STRATEGIES, ...(customStrategies || [])]
      .sort((a, b) => b.priority - a.priority)
  }

  // Attempt to recover from an error
  async recover(error: ErrorContext, context: any): Promise<RecoveryResult> {
    if (error.previousAttempts >= this.maxAttempts) {
      return {
        success: false,
        suggestion: "Maximum recovery attempts reached. Manual intervention required.",
        needsHumanReview: true
      }
    }

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter(s =>
      s.applicableTo.includes(error.errorType) || s.applicableTo.includes("unknown")
    )

    // Try each strategy
    for (const strategy of applicableStrategies) {
      try {
        const result = await strategy.execute(error, context)
        if (result.success || result.suggestion) {
          return result
        }
      } catch (e) {
        // Strategy failed, continue to next
        console.error(`Strategy ${strategy.name} failed:`, e)
      }
    }

    return {
      success: false,
      suggestion: this.generateGenericSuggestion(error),
      needsHumanReview: true
    }
  }

  // Generate a generic suggestion based on error type
  private generateGenericSuggestion(error: ErrorContext): string {
    switch (error.errorType) {
      case "syntax":
        return "Check for missing brackets, quotes, or semicolons near the error location."
      case "type":
        return "Review the type definitions and ensure correct type annotations."
      case "runtime":
        return "Ensure all variables are defined before use and check import statements."
      case "import":
        return "Verify the import path is correct and the module is installed."
      case "network":
        return "Check network connectivity and API endpoint configuration."
      case "logic":
        return "Review the code logic for infinite loops or recursive calls without base cases."
      default:
        return "Review the error message and surrounding code for potential issues."
    }
  }

  // Validate a proposed fix
  async validateFix(fix: RecoveryResult["fix"]): Promise<boolean> {
    if (!fix) return false

    // Basic validation: check if the new content is valid
    const hasBalancedBrackets = (code: string) => {
      const brackets = { "{": 0, "(": 0, "[": 0 }
      const pairs: Record<string, keyof typeof brackets> = { "}": "{", ")": "(", "]": "[" }

      for (const char of code) {
        if (char in brackets) brackets[char as keyof typeof brackets]++
        if (char in pairs) brackets[pairs[char]]--
      }

      return Object.values(brackets).every(v => v === 0)
    }

    return hasBalancedBrackets(fix.newContent)
  }

  // Learn from successful fixes (for future improvements)
  recordSuccessfulFix(error: ErrorContext, fix: RecoveryResult["fix"]): void {
    // In a production system, this would store successful patterns
    // for machine learning or pattern matching
    console.log("Recording successful fix pattern:", {
      errorType: error.errorType,
      errorPattern: error.message.substring(0, 100),
      fixDescription: fix?.description
    })
  }
}

// Utility: Create error context from various sources
export function createErrorContext(
  source: string | Error | { message: string; stack?: string },
  code?: string,
  previousAttempts: number = 0
): ErrorContext {
  let message: string
  let stack: string | undefined

  if (typeof source === "string") {
    message = source
  } else if (source instanceof Error) {
    message = source.message
    stack = source.stack
  } else {
    message = source.message
    stack = source.stack
  }

  const parsed = parseErrorDetails(message)

  return {
    errorType: parsed.errorType || "unknown",
    message,
    stack: stack || parsed.stack,
    file: parsed.file,
    line: parsed.line,
    column: parsed.column,
    code,
    previousAttempts
  }
}

// Utility: Format error for AI context
export function formatErrorForAI(error: ErrorContext): string {
  let formatted = `## Error Analysis

**Type**: ${error.errorType}
**Message**: ${error.message}
`

  if (error.file) {
    formatted += `**Location**: ${error.file}`
    if (error.line) formatted += `:${error.line}`
    if (error.column) formatted += `:${error.column}`
    formatted += "\n"
  }

  if (error.stack) {
    formatted += `
**Stack Trace**:
\`\`\`
${error.stack}
\`\`\`
`
  }

  if (error.code) {
    formatted += `
**Relevant Code**:
\`\`\`typescript
${error.code}
\`\`\`
`
  }

  formatted += `
**Recovery Attempts**: ${error.previousAttempts}
`

  return formatted
}
