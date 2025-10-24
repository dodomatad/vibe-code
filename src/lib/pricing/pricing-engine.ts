/**
 * Transparent Pricing Engine
 * Core feature: Never charges for AI errors
 */

import { nanoid } from 'nanoid'
import type { AIModel, ModelPricing, Operation, UsageStats, BudgetAlert } from './types'

export const MODEL_PRICING: Record<AIModel, ModelPricing> = {
  'claude-sonnet-4': {
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    inputTokenCost: 3.0,   // $3 per 1M tokens
    outputTokenCost: 15.0, // $15 per 1M tokens
  },
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputTokenCost: 2.5,
    outputTokenCost: 10.0,
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    inputTokenCost: 0.075,
    outputTokenCost: 0.3,
  },
}

export class TransparentPricingEngine {
  private operations: Operation[] = []
  private budgetAlerts: BudgetAlert[] = []

  /**
   * Track an operation and calculate cost
   * CORE FEATURE: AI errors are NOT charged
   */
  trackOperation(params: {
    operation: Operation['operation']
    modelUsed: AIModel
    tokensInput: number
    tokensOutput: number
    success: boolean
    errorCausedByAI: boolean
    duration: number
  }): Operation {
    const pricing = MODEL_PRICING[params.modelUsed]

    // Calculate actual cost
    const cost = this.calculateCost(
      params.tokensInput,
      params.tokensOutput,
      params.modelUsed
    )

    const operation: Operation = {
      id: nanoid(),
      timestamp: new Date(),
      cost,
      ...params,
    }

    this.operations.push(operation)
    this.checkBudgetAlerts()

    return operation
  }

  /**
   * Calculate cost for tokens
   */
  private calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: AIModel
  ): number {
    const pricing = MODEL_PRICING[model]
    const inputCost = (inputTokens / 1_000_000) * pricing.inputTokenCost
    const outputCost = (outputTokens / 1_000_000) * pricing.outputTokenCost
    return inputCost + outputCost
  }

  /**
   * Get usage statistics
   * Shows transparent breakdown including savings
   */
  getUsageStats(): UsageStats {
    const totalOperations = this.operations.length
    const successfulOperations = this.operations.filter(op => op.success).length
    const failedOperations = totalOperations - successfulOperations

    const totalTokensInput = this.operations.reduce((sum, op) => sum + op.tokensInput, 0)
    const totalTokensOutput = this.operations.reduce((sum, op) => sum + op.tokensOutput, 0)

    const totalCost = this.operations.reduce((sum, op) => sum + op.cost, 0)

    // KEY FEATURE: Only charge for successful operations OR user-caused errors
    const costCharged = this.operations
      .filter(op => op.success || !op.errorCausedByAI)
      .reduce((sum, op) => sum + op.cost, 0)

    const costSaved = totalCost - costCharged

    // Compare with Lovable (they charge everything)
    const lovableCost = totalCost // Lovable charges even for AI errors
    const savingsVsLovable = lovableCost - costCharged

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      totalTokensInput,
      totalTokensOutput,
      totalCost,
      costCharged,
      costSaved,
      savingsVsLovable,
    }
  }

  /**
   * Get operations history
   */
  getOperations(limit?: number): Operation[] {
    const sorted = [...this.operations].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
    return limit ? sorted.slice(0, limit) : sorted
  }

  /**
   * Set budget alert threshold
   */
  setBudgetAlert(threshold: number): BudgetAlert {
    const alert: BudgetAlert = {
      id: nanoid(),
      threshold,
      currentSpend: 0,
      triggered: false,
      timestamp: new Date(),
    }
    this.budgetAlerts.push(alert)
    return alert
  }

  /**
   * Check and trigger budget alerts
   */
  private checkBudgetAlerts(): void {
    const stats = this.getUsageStats()

    this.budgetAlerts.forEach(alert => {
      if (!alert.triggered && stats.costCharged >= alert.threshold) {
        alert.triggered = true
        alert.currentSpend = stats.costCharged
        // In production, this would send notification
        console.warn(`Budget alert triggered: $${stats.costCharged.toFixed(4)} >= $${alert.threshold}`)
      }
    })
  }

  /**
   * Compare with competitor pricing
   */
  compareWithCompetitors(): {
    vibeCost: number
    lovableCost: number
    savings: number
    savingsPercentage: number
  } {
    const stats = this.getUsageStats()
    const vibeCost = stats.costCharged
    const lovableCost = stats.totalCost // Lovable charges everything
    const savings = lovableCost - vibeCost
    const savingsPercentage = lovableCost > 0 ? (savings / lovableCost) * 100 : 0

    return {
      vibeCost,
      lovableCost,
      savings,
      savingsPercentage,
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.operations = []
    this.budgetAlerts = []
  }
}
