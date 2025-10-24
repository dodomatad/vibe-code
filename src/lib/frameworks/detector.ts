/**
 * Framework Detection Engine
 * Automatically detects which framework a project uses
 */

import type { Framework, DetectionResult } from './types'

interface DetectionPattern {
  framework: Framework
  indicators: {
    dependencies?: string[]
    files?: string[]
    patterns?: RegExp[]
  }
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  {
    framework: 'react',
    indicators: {
      dependencies: ['react', 'react-dom'],
      files: ['App.tsx', 'App.jsx'],
      patterns: [/import.*from ['"]react['"]/],
    },
  },
  {
    framework: 'vue',
    indicators: {
      dependencies: ['vue'],
      files: ['App.vue', 'main.ts'],
      patterns: [/<template>/, /<script.*setup/],
    },
  },
  {
    framework: 'svelte',
    indicators: {
      dependencies: ['svelte'],
      files: ['App.svelte'],
      patterns: [/<script>[\s\S]*<\/script>[\s\S]*<style>/],
    },
  },
  {
    framework: 'angular',
    indicators: {
      dependencies: ['@angular/core'],
      files: ['app.component.ts', 'angular.json'],
      patterns: [/@Component/, /@NgModule/],
    },
  },
  {
    framework: 'solid',
    indicators: {
      dependencies: ['solid-js'],
      files: [],
      patterns: [/import.*from ['"]solid-js['"]/],
    },
  },
]

export class FrameworkDetector {
  /**
   * Detect framework from package.json dependencies
   */
  detectFromPackageJson(packageJson: { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }): DetectionResult {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const matches: { framework: Framework; score: number; indicators: string[] }[] = []

    for (const pattern of DETECTION_PATTERNS) {
      let score = 0
      const indicators: string[] = []

      if (pattern.indicators.dependencies) {
        for (const dep of pattern.indicators.dependencies) {
          if (allDeps[dep]) {
            score += 10
            indicators.push(`dependency: ${dep}`)
          }
        }
      }

      if (score > 0) {
        matches.push({ framework: pattern.framework, score, indicators })
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score)

    if (matches.length === 0) {
      return { framework: null, confidence: 0, indicators: [] }
    }

    const best = matches[0]
    return {
      framework: best.framework,
      confidence: Math.min(best.score / 10, 1),
      indicators: best.indicators,
    }
  }

  /**
   * Detect framework from code content
   */
  detectFromCode(code: string): DetectionResult {
    const matches: { framework: Framework; score: number; indicators: string[] }[] = []

    for (const pattern of DETECTION_PATTERNS) {
      let score = 0
      const indicators: string[] = []

      if (pattern.indicators.patterns) {
        for (const regex of pattern.indicators.patterns) {
          if (regex.test(code)) {
            score += 5
            indicators.push(`pattern: ${regex.source}`)
          }
        }
      }

      if (score > 0) {
        matches.push({ framework: pattern.framework, score, indicators })
      }
    }

    matches.sort((a, b) => b.score - a.score)

    if (matches.length === 0) {
      return { framework: null, confidence: 0, indicators: [] }
    }

    const best = matches[0]
    return {
      framework: best.framework,
      confidence: Math.min(best.score / 10, 1),
      indicators: best.indicators,
    }
  }

  /**
   * Detect framework from file list
   */
  detectFromFiles(files: string[]): DetectionResult {
    const matches: { framework: Framework; score: number; indicators: string[] }[] = []

    for (const pattern of DETECTION_PATTERNS) {
      let score = 0
      const indicators: string[] = []

      if (pattern.indicators.files) {
        for (const file of pattern.indicators.files) {
          if (files.includes(file)) {
            score += 8
            indicators.push(`file: ${file}`)
          }
        }
      }

      // Check file extensions
      const hasVueFiles = files.some(f => f.endsWith('.vue'))
      const hasSvelteFiles = files.some(f => f.endsWith('.svelte'))
      const hasJsxFiles = files.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'))

      if (pattern.framework === 'vue' && hasVueFiles) {
        score += 10
        indicators.push('has .vue files')
      }
      if (pattern.framework === 'svelte' && hasSvelteFiles) {
        score += 10
        indicators.push('has .svelte files')
      }
      if (pattern.framework === 'react' && hasJsxFiles) {
        score += 5
        indicators.push('has .jsx/.tsx files')
      }

      if (score > 0) {
        matches.push({ framework: pattern.framework, score, indicators })
      }
    }

    matches.sort((a, b) => b.score - a.score)

    if (matches.length === 0) {
      return { framework: null, confidence: 0, indicators: [] }
    }

    const best = matches[0]
    return {
      framework: best.framework,
      confidence: Math.min(best.score / 15, 1),
      indicators: best.indicators,
    }
  }
}
