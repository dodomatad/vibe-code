/**
 * Cost Tracker v3.0.0 - Transparent Pricing System
 *
 * KEY DIFFERENTIATOR: Never charges for AI errors
 *
 * Features:
 * - Real-time cost tracking
 * - Budget alerts (50%, 75%, 90%)
 * - Multi-model cost tracking
 * - Competitor comparison
 * - Export to CSV/JSON
 * - Never charge for AI errors
 *
 * @see docs/pricing.md for pricing details
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface ModelPricing {
  modelName: string;
  costPerTokenInput: number;
  costPerTokenOutput: number;
  provider: 'anthropic' | 'openai' | 'google' | 'deepseek';
}

export interface CostOperation {
  id: string;
  userId: string;
  sessionId: string;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
  costInput: number;
  costOutput: number;
  totalCost: number;
  success: boolean;
  errorCausedByAI: boolean; // ✅ KEY: If true, cost = 0
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface BudgetLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
}

export interface BudgetAlert {
  level: 'warning' | 'critical';
  threshold: number; // 0.5 = 50%, 0.75 = 75%, 0.9 = 90%
  current: number;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface CostBreakdown {
  total: number;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
  operations: number;
  errors: number;
  errorsSaved: number; // Cost saved by not charging for AI errors
}

// ============================================================================
// Model Pricing Configuration
// ============================================================================

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-sonnet-4': {
    modelName: 'claude-sonnet-4',
    costPerTokenInput: 0.000003,  // $3 / 1M tokens
    costPerTokenOutput: 0.000015, // $15 / 1M tokens
    provider: 'anthropic',
  },
  'claude-opus-4': {
    modelName: 'claude-opus-4',
    costPerTokenInput: 0.000015,  // $15 / 1M tokens
    costPerTokenOutput: 0.000075, // $75 / 1M tokens
    provider: 'anthropic',
  },

  // OpenAI
  'gpt-5': {
    modelName: 'gpt-5',
    costPerTokenInput: 0.000005,  // $5 / 1M tokens
    costPerTokenOutput: 0.000020, // $20 / 1M tokens
    provider: 'openai',
  },
  'o3-mini': {
    modelName: 'o3-mini',
    costPerTokenInput: 0.000001,  // $1 / 1M tokens
    costPerTokenOutput: 0.000005, // $5 / 1M tokens
    provider: 'openai',
  },

  // Google
  'gemini-2.5-pro': {
    modelName: 'gemini-2.5-pro',
    costPerTokenInput: 0.000001,  // $1 / 1M tokens
    costPerTokenOutput: 0.000005, // $5 / 1M tokens
    provider: 'google',
  },

  // DeepSeek
  'deepseek-v3': {
    modelName: 'deepseek-v3',
    costPerTokenInput: 0.00000027, // $0.27 / 1M tokens
    costPerTokenOutput: 0.0000011,  // $1.10 / 1M tokens
    provider: 'deepseek',
  },
};

// ============================================================================
// Cost Tracker
// ============================================================================

export class CostTracker extends EventEmitter {
  private operations: CostOperation[] = [];
  private budgetLimits: BudgetLimits;
  private alertThresholds = [0.5, 0.75, 0.9]; // 50%, 75%, 90%
  private alertedThresholds = new Set<string>();

  constructor(budgetLimits: BudgetLimits) {
    super();
    this.budgetLimits = budgetLimits;
  }

  // ==========================================================================
  // Core Methods
  // ==========================================================================

  /**
   * Track an AI operation
   *
   * CRITICAL: If errorCausedByAI = true, cost will be $0
   */
  async trackOperation(params: {
    userId: string;
    sessionId: string;
    modelUsed: string;
    tokensInput: number;
    tokensOutput: number;
    success: boolean;
    errorCausedByAI?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<CostOperation> {
    const pricing = MODEL_PRICING[params.modelUsed];
    if (!pricing) {
      throw new Error(`Unknown model: ${params.modelUsed}`);
    }

    // ✅ KEY DIFFERENTIATOR: Never charge for AI errors
    const shouldCharge = params.success || !params.errorCausedByAI;

    const costInput = shouldCharge
      ? params.tokensInput * pricing.costPerTokenInput
      : 0;

    const costOutput = shouldCharge
      ? params.tokensOutput * pricing.costPerTokenOutput
      : 0;

    const operation: CostOperation = {
      id: generateId(),
      userId: params.userId,
      sessionId: params.sessionId,
      modelUsed: params.modelUsed,
      tokensInput: params.tokensInput,
      tokensOutput: params.tokensOutput,
      costInput,
      costOutput,
      totalCost: costInput + costOutput,
      success: params.success,
      errorCausedByAI: params.errorCausedByAI || false,
      timestamp: new Date(),
      metadata: params.metadata,
    };

    this.operations.push(operation);

    // Check budget alerts
    await this.checkBudgetAlerts(params.userId);

    // Emit event
    this.emit('operation', operation);

    return operation;
  }

  /**
   * Get current spending for a period
   */
  async getSpending(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<number> {
    const now = new Date();
    const start = this.getPeriodStart(period, now);

    return this.operations
      .filter(op =>
        op.userId === userId &&
        op.timestamp >= start &&
        op.timestamp <= now
      )
      .reduce((sum, op) => sum + op.totalCost, 0);
  }

  /**
   * Get detailed cost breakdown
   */
  async getBreakdown(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<CostBreakdown> {
    const ops = this.getOperationsInPeriod(userId, period);

    const byModel: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    let errorsSaved = 0;

    ops.forEach(op => {
      // By model
      byModel[op.modelUsed] = (byModel[op.modelUsed] || 0) + op.totalCost;

      // By provider
      const provider = MODEL_PRICING[op.modelUsed]?.provider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + op.totalCost;

      // Errors saved
      if (!op.success && op.errorCausedByAI) {
        const pricing = MODEL_PRICING[op.modelUsed];
        const wouldHaveCost =
          (op.tokensInput * pricing.costPerTokenInput) +
          (op.tokensOutput * pricing.costPerTokenOutput);
        errorsSaved += wouldHaveCost;
      }
    });

    return {
      total: ops.reduce((sum, op) => sum + op.totalCost, 0),
      byModel,
      byProvider,
      operations: ops.length,
      errors: ops.filter(op => !op.success).length,
      errorsSaved,
    };
  }

  /**
   * Compare with competitors (Lovable, Bolt, Cursor)
   *
   * Competitors charge for AI errors - we don't!
   */
  async compareWithCompetitors(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<{
    vibecode: number;
    competitors: {
      lovable: number;
      bolt: number;
      cursor: number;
    };
    savings: {
      vsLovable: number;
      vsBolt: number;
      vsCursor: number;
    };
  }> {
    const breakdown = await this.getBreakdown(userId, period);
    const vibecodeTotal = breakdown.total;

    // Competitors would charge for AI errors
    const competitorTotal = vibecodeTotal + breakdown.errorsSaved;

    // Lovable: Same pricing but charges for errors
    const lovable = competitorTotal;

    // Bolt: 20% more expensive + charges for errors
    const bolt = competitorTotal * 1.2;

    // Cursor: $20/month flat + usage
    const cursor = 20 + competitorTotal;

    return {
      vibecode: vibecodeTotal,
      competitors: { lovable, bolt, cursor },
      savings: {
        vsLovable: lovable - vibecodeTotal,
        vsBolt: bolt - vibecodeTotal,
        vsCursor: cursor - vibecodeTotal,
      },
    };
  }

  /**
   * Export costs to CSV
   */
  async exportToCSV(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<string> {
    const ops = this.getOperationsInPeriod(userId, period);

    const headers = [
      'Timestamp',
      'Model',
      'Tokens Input',
      'Tokens Output',
      'Cost Input',
      'Cost Output',
      'Total Cost',
      'Success',
      'AI Error',
    ];

    const rows = ops.map(op => [
      op.timestamp.toISOString(),
      op.modelUsed,
      op.tokensInput.toString(),
      op.tokensOutput.toString(),
      op.costInput.toFixed(6),
      op.costOutput.toFixed(6),
      op.totalCost.toFixed(6),
      op.success.toString(),
      op.errorCausedByAI.toString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export costs to JSON
   */
  async exportToJSON(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<string> {
    const ops = this.getOperationsInPeriod(userId, period);
    const breakdown = await this.getBreakdown(userId, period);
    const comparison = await this.compareWithCompetitors(userId, period);

    return JSON.stringify(
      {
        summary: breakdown,
        comparison,
        operations: ops,
      },
      null,
      2
    );
  }

  // ==========================================================================
  // Budget Alerts
  // ==========================================================================

  private async checkBudgetAlerts(userId: string): Promise<void> {
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const spending = await this.getSpending(userId, period);
      const limit = this.budgetLimits[`${period}Limit`];

      for (const threshold of this.alertThresholds) {
        const alertKey = `${userId}:${period}:${threshold}`;

        if (
          spending >= limit * threshold &&
          !this.alertedThresholds.has(alertKey)
        ) {
          this.alertedThresholds.add(alertKey);

          const alert: BudgetAlert = {
            level: threshold >= 0.9 ? 'critical' : 'warning',
            threshold,
            current: spending,
            limit,
            period,
          };

          this.emit('budgetAlert', alert);
        }
      }
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private getOperationsInPeriod(
    userId: string,
    period?: { start: Date; end: Date }
  ): CostOperation[] {
    let ops = this.operations.filter(op => op.userId === userId);

    if (period) {
      ops = ops.filter(
        op => op.timestamp >= period.start && op.timestamp <= period.end
      );
    }

    return ops;
  }

  private getPeriodStart(
    period: 'daily' | 'weekly' | 'monthly',
    now: Date
  ): Date {
    const start = new Date(now);

    if (period === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      start.setDate(start.getDate() - 7);
    } else {
      start.setMonth(start.getMonth() - 1);
    }

    return start;
  }
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
