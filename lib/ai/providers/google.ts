/**
 * Google Provider v3.0.0
 *
 * Provider for Google Gemini models:
 * - gemini-2.5-pro (best for long context)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Streaming support
 * - Error classification (AI vs user)
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
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
// Google Provider
// ============================================================================

export class GoogleProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private maxRetries: number;
  private model: string;

  constructor(config: ProviderConfig & { model?: string }) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.maxRetries = config.maxRetries || 3;
    this.model = config.model || 'gemini-2.5-pro';
  }

  /**
   * Generate response (non-streaming)
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    const {
      maxTokens = 8192,
      temperature = 0.7,
      topP = 1,
      stopSequences = [],
      systemPrompt,
    } = options;

    let lastError: any;
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const model = this.client.getGenerativeModel({
          model: this.model,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
            topP,
            stopSequences: stopSequences.length > 0 ? stopSequences : undefined,
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(prompt);
        const response = result.response;

        return {
          text: response.text(),
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
          model: this.model,
          finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
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
      maxTokens = 8192,
      temperature = 0.7,
      topP = 1,
      stopSequences = [],
      systemPrompt,
    } = options;

    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
          topP,
          stopSequences: stopSequences.length > 0 ? stopSequences : undefined,
        },
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
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

    // Rate limit (AI error)
    if (message.includes('quota') || message.includes('rate limit')) {
      return new RateLimitError('google', undefined);
    }

    // Service unavailable (AI error)
    if (message.includes('503') || message.includes('unavailable')) {
      return new ModelUnavailableError('google', this.model);
    }

    // Invalid request (user error)
    if (message.includes('invalid') || message.includes('400')) {
      return new InvalidRequestError('google', message);
    }

    // Default to AI error (safer for billing)
    return {
      name: 'AIProviderError',
      message,
      provider: 'google',
      causedByAI: true,
    } as AIProviderError;
  }

  private mapFinishReason(reason: string | undefined): GenerateResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
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
