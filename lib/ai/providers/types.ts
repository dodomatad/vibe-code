/**
 * AI Provider Types v3.0.0
 *
 * Common types for all AI providers
 */

// ============================================================================
// Core Types
// ============================================================================

export interface AIProvider {
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse>;
  stream(prompt: string, options: GenerateOptions): AsyncGenerator<string>;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public causedByAI: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, true);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  retryAfter?: number;
}

export class InvalidRequestError extends AIProviderError {
  constructor(provider: string, message: string) {
    super(message, provider, false); // User error, not AI error
    this.name = 'InvalidRequestError';
  }
}

export class ModelUnavailableError extends AIProviderError {
  constructor(provider: string, model: string) {
    super(`Model ${model} unavailable for ${provider}`, provider, true);
    this.name = 'ModelUnavailableError';
  }
}
