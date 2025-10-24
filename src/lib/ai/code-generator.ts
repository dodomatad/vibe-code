/**
 * AI Code Generator
 * Multi-model support with intelligent routing
 */

import type { AIModel } from '../pricing/types'
import type { GenerateCodeRequest, GenerateCodeResponse } from './types'

// Framework-specific prompts
const FRAMEWORK_CONTEXTS = {
  react: 'You are generating React code. Use functional components, hooks, and modern React patterns.',
  vue: 'You are generating Vue 3 code. Use Composition API with <script setup> and modern Vue patterns.',
  svelte: 'You are generating Svelte code. Use reactive declarations and Svelte-specific features.',
  angular: 'You are generating Angular code. Use components, services, and Angular-specific patterns.',
  solid: 'You are generating SolidJS code. Use reactive primitives and Solid-specific patterns.',
  vanilla: 'You are generating vanilla JavaScript/TypeScript code.',
}

export class CodeGenerator {
  private defaultModel: AIModel = 'claude-sonnet-4'

  /**
   * Generate code from prompt
   * In production, this would call actual AI APIs
   */
  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    const startTime = Date.now()
    const model = request.model || this.defaultModel

    try {
      // Build the system prompt
      const systemPrompt = this.buildSystemPrompt(request)

      // Build the user prompt
      const userPrompt = this.buildUserPrompt(request)

      // In production, this would call the actual AI API
      // For now, we'll simulate with a mock response
      const mockResponse = this.mockGeneration(request)

      const duration = Date.now() - startTime

      return {
        code: mockResponse.code,
        explanation: mockResponse.explanation,
        tokensUsed: {
          input: this.estimateTokens(systemPrompt + userPrompt),
          output: this.estimateTokens(mockResponse.code + mockResponse.explanation),
        },
        model,
        success: true,
        errorCausedByAI: false,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        code: '',
        explanation: '',
        tokensUsed: { input: 0, output: 0 },
        model,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCausedByAI: this.isAIError(error),
        duration,
      }
    }
  }

  /**
   * Build system prompt based on framework
   */
  private buildSystemPrompt(request: GenerateCodeRequest): string {
    const frameworkContext = FRAMEWORK_CONTEXTS[request.framework]
    const tsContext = request.typescript
      ? 'Use TypeScript with proper type annotations.'
      : 'Use JavaScript.'

    return `${frameworkContext}\n${tsContext}\n\nProvide clean, production-ready code following best practices.`
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(request: GenerateCodeRequest): string {
    let prompt = `Generate code for the following:\n\n${request.prompt}`

    if (request.context) {
      prompt += `\n\nAdditional context:\n${request.context}`
    }

    return prompt
  }

  /**
   * Mock code generation (replace with real AI API in production)
   */
  private mockGeneration(request: GenerateCodeRequest): { code: string; explanation: string } {
    const { framework, typescript } = request
    const ext = typescript ? 'tsx' : 'jsx'

    let code = ''
    let explanation = ''

    if (framework === 'react') {
      code = `import React from 'react'

export default function Component() {
  return (
    <div className="container">
      <h1>Generated Component</h1>
      <p>This component was generated based on your prompt.</p>
    </div>
  )
}`
      explanation = 'Generated a React functional component with modern patterns.'
    } else if (framework === 'vue') {
      code = `<template>
  <div class="container">
    <h1>Generated Component</h1>
    <p>This component was generated based on your prompt.</p>
  </div>
</template>

<script setup${typescript ? ' lang="ts"' : ''}>
// Component logic here
</script>

<style scoped>
.container {
  padding: 1rem;
}
</style>`
      explanation = 'Generated a Vue 3 component using Composition API.'
    } else if (framework === 'svelte') {
      code = `<script${typescript ? ' lang="ts"' : ''}>
  // Component logic here
</script>

<div class="container">
  <h1>Generated Component</h1>
  <p>This component was generated based on your prompt.</p>
</div>

<style>
  .container {
    padding: 1rem;
  }
</style>`
      explanation = 'Generated a Svelte component with reactive features.'
    } else {
      code = `function component() {
  return \`
    <div class="container">
      <h1>Generated Component</h1>
      <p>This component was generated based on your prompt.</p>
    </div>
  \`
}`
      explanation = 'Generated vanilla JavaScript code.'
    }

    return { code, explanation }
  }

  /**
   * Estimate token count (rough approximation)
   * In production, use proper tokenizer
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Determine if error was caused by AI
   */
  private isAIError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const aiErrorPatterns = [
      /rate limit/i,
      /quota exceeded/i,
      /model overloaded/i,
      /timeout/i,
      /api error/i,
      /service unavailable/i,
    ]

    return aiErrorPatterns.some(pattern => pattern.test(error.message))
  }

  /**
   * Select best model for task
   */
  selectModel(request: GenerateCodeRequest): AIModel {
    // Simple routing logic
    // In production, this would be more sophisticated

    if (request.framework === 'react') {
      return 'claude-sonnet-4' // Best for React
    }

    if (request.framework === 'vue' || request.framework === 'svelte') {
      return 'gemini-2.0-flash' // Cost-effective for simpler frameworks
    }

    return this.defaultModel
  }
}
