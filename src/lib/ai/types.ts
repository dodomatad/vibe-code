/**
 * AI Integration Types
 */

import type { AIModel } from '../pricing/types'
import type { Framework } from '../frameworks/types'

export interface GenerateCodeRequest {
  prompt: string
  framework: Framework
  typescript: boolean
  context?: string
  model?: AIModel
}

export interface GenerateCodeResponse {
  code: string
  explanation: string
  tokensUsed: {
    input: number
    output: number
  }
  model: AIModel
  success: boolean
  error?: string
  errorCausedByAI: boolean
  duration: number
}

export interface RefactorRequest {
  code: string
  instructions: string
  framework: Framework
  model?: AIModel
}

export interface DebugRequest {
  code: string
  error: string
  framework: Framework
  model?: AIModel
}
