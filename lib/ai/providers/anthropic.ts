/**
 * Anthropic Provider v3.0.0
 *
 * Provider for Claude models:
 * - claude-sonnet-4 (best for code generation)
 * - claude-opus-4 (best for complex tasks)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Streaming support
 * - Error classification (AI vs user)
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  GenerateOptions,
  GenerateResponse,
  ProviderConfig,
  AIProviderError,
  RateLimitError,
  InvalidRequestError,
  ModelUnavailableError,
} from './types';

// ============================================================================
// Anthropic Provider
// ============================================================================

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private maxRetries: number;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      maxRetries: 0, // We handle retries ourselves
      timeout: config.timeout || 60000,
    });

    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Generate response (non-streaming)
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    const {
      maxTokens = 4096,
      temperature = 0.7,
      topP = 1,
      stopSequences = [],
      systemPrompt,
    } = options;

    let lastError: any;
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop_sequences: stopSequences,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Extract text from response
        const text = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('\n');

        return {
          text,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          model: response.model,
          finishReason: this.mapFinishReason(response.stop_reason),
        };
      } catch (error: any) {
        lastError = error;

        // Classify error
        const classifiedError = this.classifyError(error);

        // Retry only for AI errors
        if (classifiedError.causedByAI && retries < this.maxRetries) {
          retries++;
          await this.sleep(this.getRetryDelay(retries));
          continue;
        }

        // Don't retry user errors
        throw classifiedError;
      }
    }

    throw lastError;
  }

  /**
   * Generate response (streaming)
   */
  async *stream(
    prompt: string,
    options: GenerateOptions = {}
  ): AsyncGenerator<string> {
    const {
      maxTokens = 4096,
      temperature = 0.7,
      topP = 1,
      stopSequences = [],
      systemPrompt,
    } = options;

    try {
      const stream = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stop_sequences: stopSequences,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
    } catch (error: any) {
      throw this.classifyError(error);
    }
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  private classifyError(error: any): AIProviderError {
    const message = error.message || 'Unknown error';
    const statusCode = error.status || error.statusCode;

    // Rate limit (AI error)
    if (statusCode === 429) {
      const retryAfter = error.headers?.['retry-after'];
      return new RateLimitError('anthropic', retryAfter);
    }

    // Service unavailable (AI error)
    if (statusCode === 503 || statusCode === 504) {
      return new ModelUnavailableError('anthropic', 'claude-sonnet-4');
    }

    // Invalid request (user error)
    if (statusCode === 400 || statusCode === 422) {
      return new InvalidRequestError('anthropic', message);
    }

    // Default to AI error (safer for billing)
    return {
      name: 'AIProviderError',
      message,
      provider: 'anthropic',
      causedByAI: true,
    } as AIProviderError;
  }

  private mapFinishReason(
    reason: string | null
  ): GenerateResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return undefined;
    }
  }

  // ==========================================================================
  // Retry Logic
  // ==========================================================================

  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
