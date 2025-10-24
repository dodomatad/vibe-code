/**
 * OpenAI Provider v3.0.0
 *
 * Provider for OpenAI models:
 * - gpt-5 (best for general tasks)
 * - o3-mini (best for fast, cheap tasks)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Streaming support
 * - Error classification (AI vs user)
 */

import OpenAI from 'openai';
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
// OpenAI Provider
// ============================================================================

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private maxRetries: number;
  private model: string;

  constructor(config: ProviderConfig & { model?: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: 0, // We handle retries ourselves
      timeout: config.timeout || 60000,
    });

    this.maxRetries = config.maxRetries || 3;
    this.model = config.model || 'gpt-5';
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
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
          messages.push({
            role: 'system',
            content: systemPrompt,
          });
        }

        messages.push({
          role: 'user',
          content: prompt,
        });

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop: stopSequences.length > 0 ? stopSequences : undefined,
        });

        const choice = response.choices[0];
        if (!choice) {
          throw new Error('No response from OpenAI');
        }

        return {
          text: choice.message.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
          model: response.model,
          finishReason: this.mapFinishReason(choice.finish_reason),
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
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stop: stopSequences.length > 0 ? stopSequences : undefined,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
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
      const retryAfter = error.headers?.['retry-after-ms'];
      return new RateLimitError('openai', retryAfter);
    }

    // Service unavailable (AI error)
    if (statusCode === 503 || statusCode === 504) {
      return new ModelUnavailableError('openai', this.model);
    }

    // Invalid request (user error)
    if (statusCode === 400) {
      return new InvalidRequestError('openai', message);
    }

    // Default to AI error (safer for billing)
    return {
      name: 'AIProviderError',
      message,
      provider: 'openai',
      causedByAI: true,
    } as AIProviderError;
  }

  private mapFinishReason(
    reason: string | null | undefined
  ): GenerateResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
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
