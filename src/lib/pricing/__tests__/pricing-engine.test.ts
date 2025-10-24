/**
 * Transparent Pricing Engine Tests
 * Ensures AI errors are NEVER charged
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TransparentPricingEngine } from '../pricing-engine'

describe('TransparentPricingEngine', () => {
  let engine: TransparentPricingEngine

  beforeEach(() => {
    engine = new TransparentPricingEngine()
  })

  describe('Cost Calculation', () => {
    it('should calculate cost correctly for successful operation', () => {
      const operation = engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
        errorCausedByAI: false,
        duration: 1500,
      })

      // Claude Sonnet 4: $3/1M input, $15/1M output
      // (1000/1M * 3) + (2000/1M * 15) = 0.003 + 0.03 = 0.033
      expect(operation.cost).toBeCloseTo(0.033, 6)
    })

    it('should calculate cost for different models', () => {
      const op1 = engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'gpt-4o',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: true,
        errorCausedByAI: false,
        duration: 1000,
      })

      // GPT-4o: $2.5/1M input, $10/1M output
      expect(op1.cost).toBeCloseTo(0.0125, 6)
    })
  })

  describe('Transparent Pricing - Core Feature', () => {
    it('should NOT charge for AI-caused errors', () => {
      // Successful operation
      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: true,
        errorCausedByAI: false,
        duration: 1000,
      })

      // AI error - should NOT be charged
      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: false,
        errorCausedByAI: true,  // KEY: AI caused the error
        duration: 1000,
      })

      const stats = engine.getUsageStats()

      // Total cost includes both
      expect(stats.totalCost).toBeCloseTo(0.036, 6)

      // Cost charged only includes successful operation
      expect(stats.costCharged).toBeCloseTo(0.018, 6)

      // Savings from not charging AI errors
      expect(stats.costSaved).toBeCloseTo(0.018, 6)
    })

    it('should charge for user-caused errors', () => {
      // User error (e.g., invalid input) - should be charged
      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: false,
        errorCausedByAI: false,  // User caused the error
        duration: 1000,
      })

      const stats = engine.getUsageStats()

      // Should be charged even though it failed
      expect(stats.costCharged).toBeCloseTo(0.018, 6)
    })

    it('should calculate savings vs Lovable correctly', () => {
      // 3 successful operations
      for (let i = 0; i < 3; i++) {
        engine.trackOperation({
          operation: 'code-generation',
          modelUsed: 'claude-sonnet-4',
          tokensInput: 1000,
          tokensOutput: 1000,
          success: true,
          errorCausedByAI: false,
          duration: 1000,
        })
      }

      // 2 AI errors
      for (let i = 0; i < 2; i++) {
        engine.trackOperation({
          operation: 'code-generation',
          modelUsed: 'claude-sonnet-4',
          tokensInput: 1000,
          tokensOutput: 1000,
          success: false,
          errorCausedByAI: true,
          duration: 1000,
        })
      }

      const comparison = engine.compareWithCompetitors()

      // Vibe: only charges 3 successful = 3 * 0.018 = 0.054
      expect(comparison.vibeCost).toBeCloseTo(0.054, 6)

      // Lovable: charges all 5 = 5 * 0.018 = 0.09
      expect(comparison.lovableCost).toBeCloseTo(0.09, 6)

      // Savings: 0.09 - 0.054 = 0.036 (40% savings)
      expect(comparison.savings).toBeCloseTo(0.036, 6)
      expect(comparison.savingsPercentage).toBeCloseTo(40, 2)
    })
  })

  describe('Usage Statistics', () => {
    it('should track operations correctly', () => {
      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
        errorCausedByAI: false,
        duration: 1500,
      })

      engine.trackOperation({
        operation: 'refactor',
        modelUsed: 'gpt-4o',
        tokensInput: 500,
        tokensOutput: 800,
        success: false,
        errorCausedByAI: true,
        duration: 1200,
      })

      const stats = engine.getUsageStats()

      expect(stats.totalOperations).toBe(2)
      expect(stats.successfulOperations).toBe(1)
      expect(stats.failedOperations).toBe(1)
      expect(stats.totalTokensInput).toBe(1500)
      expect(stats.totalTokensOutput).toBe(2800)
    })

    it('should return sorted operations', () => {
      const op1 = engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: true,
        errorCausedByAI: false,
        duration: 1000,
      })

      const op2 = engine.trackOperation({
        operation: 'refactor',
        modelUsed: 'gpt-4o',
        tokensInput: 500,
        tokensOutput: 500,
        success: true,
        errorCausedByAI: false,
        duration: 800,
      })

      const operations = engine.getOperations()

      // Should be sorted by timestamp (newest first)
      expect(operations[0].id).toBe(op2.id)
      expect(operations[1].id).toBe(op1.id)
    })

    it('should limit returned operations', () => {
      for (let i = 0; i < 5; i++) {
        engine.trackOperation({
          operation: 'code-generation',
          modelUsed: 'claude-sonnet-4',
          tokensInput: 1000,
          tokensOutput: 1000,
          success: true,
          errorCausedByAI: false,
          duration: 1000,
        })
      }

      const limited = engine.getOperations(3)
      expect(limited).toHaveLength(3)
    })
  })

  describe('Budget Alerts', () => {
    it('should trigger budget alert when threshold exceeded', () => {
      const alert = engine.setBudgetAlert(0.05) // $0.05 threshold

      // Add operations to exceed threshold
      for (let i = 0; i < 3; i++) {
        engine.trackOperation({
          operation: 'code-generation',
          modelUsed: 'claude-sonnet-4',
          tokensInput: 1000,
          tokensOutput: 1000,
          success: true,
          errorCausedByAI: false,
          duration: 1000,
        })
      }

      // 3 * 0.018 = 0.054 > 0.05
      expect(alert.triggered).toBe(true)
    })

    it('should not trigger alert below threshold', () => {
      const alert = engine.setBudgetAlert(1.0) // $1 threshold

      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: true,
        errorCausedByAI: false,
        duration: 1000,
      })

      expect(alert.triggered).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero tokens', () => {
      const operation = engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 0,
        tokensOutput: 0,
        success: true,
        errorCausedByAI: false,
        duration: 100,
      })

      expect(operation.cost).toBe(0)
    })

    it('should handle very large token counts', () => {
      const operation = engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1_000_000, // 1M tokens
        tokensOutput: 1_000_000,
        success: true,
        errorCausedByAI: false,
        duration: 5000,
      })

      // (1M/1M * 3) + (1M/1M * 15) = 3 + 15 = 18
      expect(operation.cost).toBeCloseTo(18, 2)
    })

    it('should handle reset', () => {
      engine.trackOperation({
        operation: 'code-generation',
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 1000,
        success: true,
        errorCausedByAI: false,
        duration: 1000,
      })

      engine.reset()

      const stats = engine.getUsageStats()
      expect(stats.totalOperations).toBe(0)
      expect(stats.costCharged).toBe(0)
    })
  })
})
