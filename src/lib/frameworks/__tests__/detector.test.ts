/**
 * Framework Detector Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FrameworkDetector } from '../detector'

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector

  beforeEach(() => {
    detector = new FrameworkDetector()
  })

  describe('detectFromPackageJson', () => {
    it('should detect React from dependencies', () => {
      const result = detector.detectFromPackageJson({
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
        },
      })

      expect(result.framework).toBe('react')
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.indicators).toContain('dependency: react')
    })

    it('should detect Vue from dependencies', () => {
      const result = detector.detectFromPackageJson({
        dependencies: {
          'vue': '^3.0.0',
        },
      })

      expect(result.framework).toBe('vue')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should detect Svelte from dependencies', () => {
      const result = detector.detectFromPackageJson({
        devDependencies: {
          'svelte': '^4.0.0',
        },
      })

      expect(result.framework).toBe('svelte')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should return null for unknown framework', () => {
      const result = detector.detectFromPackageJson({
        dependencies: {
          'lodash': '^4.0.0',
        },
      })

      expect(result.framework).toBe(null)
      expect(result.confidence).toBe(0)
    })

    it('should prioritize most confident match', () => {
      const result = detector.detectFromPackageJson({
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'vue': '^3.0.0',
        },
      })

      // React has 2 dependencies matched vs Vue's 1
      expect(result.framework).toBe('react')
    })
  })

  describe('detectFromCode', () => {
    it('should detect React from import statements', () => {
      const code = `
        import React from 'react'
        import { useState } from 'react'

        export default function App() {
          return <div>Hello</div>
        }
      `

      const result = detector.detectFromCode(code)
      expect(result.framework).toBe('react')
    })

    it('should detect Vue from template syntax', () => {
      const code = `
        <template>
          <div>{{ message }}</div>
        </template>

        <script setup>
        const message = 'Hello'
        </script>
      `

      const result = detector.detectFromCode(code)
      expect(result.framework).toBe('vue')
    })

    it('should detect Angular from decorators', () => {
      const code = `
        import { Component } from '@angular/core'

        @Component({
          selector: 'app-root',
          template: '<h1>Hello</h1>'
        })
        export class AppComponent {}
      `

      const result = detector.detectFromCode(code)
      expect(result.framework).toBe('angular')
    })

    it('should return null for plain JavaScript', () => {
      const code = `
        function hello() {
          console.log('Hello')
        }
      `

      const result = detector.detectFromCode(code)
      expect(result.framework).toBe(null)
    })
  })

  describe('detectFromFiles', () => {
    it('should detect React from .jsx/.tsx files', () => {
      const files = ['App.tsx', 'index.tsx', 'components/Button.tsx']

      const result = detector.detectFromFiles(files)
      expect(result.framework).toBe('react')
    })

    it('should detect Vue from .vue files', () => {
      const files = ['App.vue', 'components/Button.vue']

      const result = detector.detectFromFiles(files)
      expect(result.framework).toBe('vue')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should detect Svelte from .svelte files', () => {
      const files = ['App.svelte', 'routes/+page.svelte']

      const result = detector.detectFromFiles(files)
      expect(result.framework).toBe('svelte')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should detect Angular from specific files', () => {
      const files = ['app.component.ts', 'angular.json']

      const result = detector.detectFromFiles(files)
      expect(result.framework).toBe('angular')
    })

    it('should return null for generic files', () => {
      const files = ['index.js', 'utils.js', 'config.json']

      const result = detector.detectFromFiles(files)
      expect(result.framework).toBe(null)
    })
  })
})
