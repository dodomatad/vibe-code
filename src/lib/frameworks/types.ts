/**
 * Multi-Framework Support Types
 * Enables support for React, Vue, Svelte, and more
 */

export type Framework =
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'solid'
  | 'vanilla'

export interface FrameworkConfig {
  id: Framework
  name: string
  fileExtensions: string[]
  componentPattern: RegExp
  templates: FrameworkTemplate[]
}

export interface FrameworkTemplate {
  name: string
  description: string
  code: string
  dependencies: string[]
}

export interface DetectionResult {
  framework: Framework | null
  confidence: number
  indicators: string[]
}

export interface GenerationOptions {
  framework: Framework
  typescript: boolean
  styling: 'css' | 'tailwind' | 'styled-components' | 'css-modules'
  testing: boolean
}
