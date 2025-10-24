/**
 * Cost Tracker Tests v3.0.0
 *
 * Tests the CRITICAL differentiator: Never charge for AI errors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CostTracker, MODEL_PRICING } from '@/lib/pricing/cost-tracker';

describe('CostTracker', () => {
  let tracker: CostTracker;
  const testUserId = 'user_test_123';
  const testSessionId = 'session_test_456';

  beforeEach(() => {
    tracker = new CostTracker({
      dailyLimit: 10.0,
      weeklyLimit: 50.0,
      monthlyLimit: 200.0,
    });
  });

  // ==========================================================================
  // Core Differentiator: Never Charge for AI Errors
  // ==========================================================================

  describe('✅ CRITICAL: Never charge for AI errors', () => {
    it('should NOT charge when errorCausedByAI = true', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1500,
        tokensOutput: 3000,
        success: false,
        errorCausedByAI: true, // ✅ KEY TEST
      });

      // Should be $0
      expect(operation.totalCost).toBe(0);
      expect(operation.costInput).toBe(0);
      expect(operation.costOutput).toBe(0);
    });

    it('should charge when errorCausedByAI = false (user error)', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1500,
        tokensOutput: 3000,
        success: false,
        errorCausedByAI: false, // User error, not AI error
      });

      // Should charge normally
      const expectedCost =
        1500 * MODEL_PRICING['claude-sonnet-4'].costPerTokenInput +
        3000 * MODEL_PRICING['claude-sonnet-4'].costPerTokenOutput;

      expect(operation.totalCost).toBeCloseTo(expectedCost, 6);
    });

    it('should charge for successful operations', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1500,
        tokensOutput: 3000,
        success: true,
      });

      const expectedCost =
        1500 * MODEL_PRICING['claude-sonnet-4'].costPerTokenInput +
        3000 * MODEL_PRICING['claude-sonnet-4'].costPerTokenOutput;

      expect(operation.totalCost).toBeCloseTo(expectedCost, 6);
    });
  });

  // ==========================================================================
  // Cost Tracking
  // ==========================================================================

  describe('Cost Tracking', () => {
    it('should track multiple operations correctly', async () => {
      // Track 3 operations
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'gpt-5',
        tokensInput: 1500,
        tokensOutput: 3000,
        success: true,
      });

      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'gemini-2.5-pro',
        tokensInput: 2000,
        tokensOutput: 4000,
        success: true,
      });

      const breakdown = await tracker.getBreakdown(testUserId);

      expect(breakdown.operations).toBe(3);
      expect(breakdown.byModel).toHaveProperty('claude-sonnet-4');
      expect(breakdown.byModel).toHaveProperty('gpt-5');
      expect(breakdown.byModel).toHaveProperty('gemini-2.5-pro');
    });

    it('should calculate costs correctly for different models', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'deepseek-v3',
        tokensInput: 10000,
        tokensOutput: 20000,
        success: true,
      });

      const expectedCost =
        10000 * MODEL_PRICING['deepseek-v3'].costPerTokenInput +
        20000 * MODEL_PRICING['deepseek-v3'].costPerTokenOutput;

      expect(operation.totalCost).toBeCloseTo(expectedCost, 6);

      // DeepSeek is very cheap
      expect(operation.totalCost).toBeLessThan(0.05);
    });

    it('should group costs by provider', async () => {
      // Anthropic models
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-opus-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      // OpenAI model
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'gpt-5',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      const breakdown = await tracker.getBreakdown(testUserId);

      expect(breakdown.byProvider).toHaveProperty('anthropic');
      expect(breakdown.byProvider).toHaveProperty('openai');
      expect(breakdown.byProvider.anthropic).toBeGreaterThan(0);
      expect(breakdown.byProvider.openai).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Budget Alerts
  // ==========================================================================

  describe('Budget Alerts', () => {
    it('should emit alert at 50% threshold', async () => {
      const alerts: any[] = [];
      tracker.on('budgetAlert', alert => alerts.push(alert));

      // Spend 5.5 USD (55% of 10 USD daily limit)
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-opus-4',
        tokensInput: 100000,
        tokensOutput: 50000,
        success: true,
      });

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].threshold).toBe(0.5);
      expect(alerts[0].period).toBe('daily');
    });

    it('should emit critical alert at 90% threshold', async () => {
      const alerts: any[] = [];
      tracker.on('budgetAlert', alert => alerts.push(alert));

      // Spend 9.5 USD (95% of 10 USD daily limit)
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-opus-4',
        tokensInput: 200000,
        tokensOutput: 100000,
        success: true,
      });

      const criticalAlerts = alerts.filter(a => a.level === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(criticalAlerts[0].threshold).toBe(0.9);
    });

    it('should not emit duplicate alerts', async () => {
      const alerts: any[] = [];
      tracker.on('budgetAlert', alert => alerts.push(alert));

      // Spend 6 USD (60% of daily limit) in two operations
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-opus-4',
        tokensInput: 100000,
        tokensOutput: 50000,
        success: true,
      });

      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-opus-4',
        tokensInput: 10000,
        tokensOutput: 5000,
        success: true,
      });

      // Should only get one alert for 50% threshold
      const fiftyPercentAlerts = alerts.filter(a => a.threshold === 0.5);
      expect(fiftyPercentAlerts).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Competitor Comparison
  // ==========================================================================

  describe('Competitor Comparison', () => {
    it('should calculate savings vs competitors', async () => {
      // Track 10 operations, 3 with AI errors
      for (let i = 0; i < 10; i++) {
        await tracker.trackOperation({
          userId: testUserId,
          sessionId: testSessionId,
          modelUsed: 'claude-sonnet-4',
          tokensInput: 1500,
          tokensOutput: 3000,
          success: i < 7, // First 7 succeed, last 3 fail
          errorCausedByAI: i >= 7, // Last 3 are AI errors
        });
      }

      const comparison = await tracker.compareWithCompetitors(testUserId);

      // Vibe Code should be cheaper (doesn't charge for 3 AI errors)
      expect(comparison.vibecode).toBeLessThan(comparison.competitors.lovable);
      expect(comparison.vibecode).toBeLessThan(comparison.competitors.bolt);
      expect(comparison.vibecode).toBeLessThan(comparison.competitors.cursor);

      // Savings should be > 0
      expect(comparison.savings.vsLovable).toBeGreaterThan(0);
      expect(comparison.savings.vsBolt).toBeGreaterThan(0);
      expect(comparison.savings.vsCursor).toBeGreaterThan(0);
    });

    it('should show Lovable charges for AI errors', async () => {
      // 1 successful operation
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      // 1 AI error (Vibe Code: $0, Lovable: charges)
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: false,
        errorCausedByAI: true,
      });

      const comparison = await tracker.compareWithCompetitors(testUserId);
      const breakdown = await tracker.getBreakdown(testUserId);

      // Lovable charges for AI error
      expect(comparison.competitors.lovable).toBeGreaterThan(
        comparison.vibecode
      );

      // Savings should equal the AI error cost
      expect(comparison.savings.vsLovable).toBeCloseTo(
        breakdown.errorsSaved,
        6
      );
    });
  });

  // ==========================================================================
  // Export
  // ==========================================================================

  describe('Export', () => {
    beforeEach(async () => {
      // Track some operations
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'gpt-5',
        tokensInput: 1500,
        tokensOutput: 3000,
        success: false,
        errorCausedByAI: true,
      });
    });

    it('should export to CSV format', async () => {
      const csv = await tracker.exportToCSV(testUserId);

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Model');
      expect(csv).toContain('claude-sonnet-4');
      expect(csv).toContain('gpt-5');

      // Check it's valid CSV
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(2); // Header + 2 operations
    });

    it('should export to JSON format', async () => {
      const json = await tracker.exportToJSON(testUserId);
      const data = JSON.parse(json);

      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('comparison');
      expect(data).toHaveProperty('operations');

      expect(data.summary.operations).toBe(2);
      expect(data.summary.errors).toBe(1);
      expect(data.summary.errorsSaved).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Period Filtering
  // ==========================================================================

  describe('Period Filtering', () => {
    it('should filter operations by custom period', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Mock timestamps (in a real app, you'd inject a time provider)
      vi.useFakeTimers();

      // Operation from last week
      vi.setSystemTime(lastWeek);
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      // Operation from yesterday
      vi.setSystemTime(yesterday);
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      // Operation from today
      vi.setSystemTime(now);
      await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 1000,
        tokensOutput: 2000,
        success: true,
      });

      vi.useRealTimers();

      // Get breakdown for last 2 days
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const breakdown = await tracker.getBreakdown(testUserId, {
        start: twoDaysAgo,
        end: now,
      });

      // Should only include yesterday and today (2 operations)
      expect(breakdown.operations).toBe(2);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle zero tokens', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'claude-sonnet-4',
        tokensInput: 0,
        tokensOutput: 0,
        success: true,
      });

      expect(operation.totalCost).toBe(0);
    });

    it('should handle very large token counts', async () => {
      const operation = await tracker.trackOperation({
        userId: testUserId,
        sessionId: testSessionId,
        modelUsed: 'gemini-2.5-pro',
        tokensInput: 1000000, // 1M tokens
        tokensOutput: 2000000, // 2M tokens
        success: true,
      });

      expect(operation.totalCost).toBeGreaterThan(0);
      expect(operation.totalCost).toBeLessThan(100); // Should still be reasonable
    });

    it('should throw error for unknown model', async () => {
      await expect(
        tracker.trackOperation({
          userId: testUserId,
          sessionId: testSessionId,
          modelUsed: 'unknown-model',
          tokensInput: 1000,
          tokensOutput: 2000,
          success: true,
        })
      ).rejects.toThrow('Unknown model');
    });

    it('should handle empty user operations', async () => {
      const breakdown = await tracker.getBreakdown('nonexistent_user');

      expect(breakdown.total).toBe(0);
      expect(breakdown.operations).toBe(0);
      expect(breakdown.errors).toBe(0);
      expect(breakdown.errorsSaved).toBe(0);
    });
  });
});
