/**
 * Pricing Types
 * Core types for the transparent pricing system
 */

export type AIModel =
  | 'claude-sonnet-4'
  | 'gpt-4o'
  | 'gemini-2.0-flash'

export interface ModelPricing {
  inputTokenCost: number  // Cost per 1M input tokens
  outputTokenCost: number // Cost per 1M output tokens
  name: string
  provider: string
}

export interface Operation {
  id: string
  timestamp: Date
  operation: 'code-generation' | 'refactor' | 'debug' | 'explain'
  modelUsed: AIModel
  tokensInput: number
  tokensOutput: number
  cost: number
  success: boolean
  errorCausedByAI: boolean
  duration: number // in milliseconds
}

export interface UsageStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  totalTokensInput: number
  totalTokensOutput: number
  totalCost: number
  costCharged: number // excludes AI errors
  costSaved: number   // from not charging AI errors
  savingsVsLovable: number
}

export interface BudgetAlert {
  id: string
  threshold: number
  currentSpend: number
  triggered: boolean
  timestamp: Date
}
