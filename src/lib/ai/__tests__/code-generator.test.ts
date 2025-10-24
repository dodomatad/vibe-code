/**
 * Code Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CodeGenerator } from '../code-generator'

describe('CodeGenerator', () => {
  let generator: CodeGenerator

  beforeEach(() => {
    generator = new CodeGenerator()
  })

  describe('generateCode', () => {
    it('should generate React code', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a button component',
        framework: 'react',
        typescript: true,
      })

      expect(response.success).toBe(true)
      expect(response.code).toContain('React')
      expect(response.code).toContain('function')
      expect(response.explanation).toBeTruthy()
      expect(response.tokensUsed.input).toBeGreaterThan(0)
      expect(response.tokensUsed.output).toBeGreaterThan(0)
    })

    it('should generate Vue code', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a button component',
        framework: 'vue',
        typescript: true,
      })

      expect(response.success).toBe(true)
      expect(response.code).toContain('<template>')
      expect(response.code).toContain('<script setup')
      expect(response.explanation).toBeTruthy()
    })

    it('should generate Svelte code', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a button component',
        framework: 'svelte',
        typescript: false,
      })

      expect(response.success).toBe(true)
      expect(response.code).toContain('<script>')
      expect(response.explanation).toBeTruthy()
    })

    it('should track token usage', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a simple component',
        framework: 'react',
        typescript: true,
      })

      expect(response.tokensUsed.input).toBeGreaterThan(0)
      expect(response.tokensUsed.output).toBeGreaterThan(0)
    })

    it('should track duration', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a component',
        framework: 'react',
        typescript: true,
      })

      expect(response.duration).toBeGreaterThanOrEqual(0)
    })

    it('should use specified model', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a component',
        framework: 'react',
        typescript: true,
        model: 'gpt-4o',
      })

      expect(response.model).toBe('gpt-4o')
    })

    it('should include context in generation', async () => {
      const response = await generator.generateCode({
        prompt: 'Create a button',
        framework: 'react',
        typescript: true,
        context: 'This is for a dark mode UI',
      })

      expect(response.success).toBe(true)
    })
  })

  describe('selectModel', () => {
    it('should select Claude for React', () => {
      const model = generator.selectModel({
        prompt: 'test',
        framework: 'react',
        typescript: true,
      })

      expect(model).toBe('claude-sonnet-4')
    })

    it('should select Gemini for Vue', () => {
      const model = generator.selectModel({
        prompt: 'test',
        framework: 'vue',
        typescript: true,
      })

      expect(model).toBe('gemini-2.0-flash')
    })

    it('should select Gemini for Svelte', () => {
      const model = generator.selectModel({
        prompt: 'test',
        framework: 'svelte',
        typescript: true,
      })

      expect(model).toBe('gemini-2.0-flash')
    })
  })
})
