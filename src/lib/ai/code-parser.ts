// Code Parser - Extract and process code from AI responses
// Handles multiple formats: markdown code blocks, file paths, diffs

export interface ParsedCodeBlock {
  language: string
  content: string
  filePath?: string
  action: "create" | "update" | "delete"
  startLine?: number
  endLine?: number
}

export interface ParsedResponse {
  text: string
  codeBlocks: ParsedCodeBlock[]
  toolCalls: Array<{ tool: string; args: Record<string, any> }>
  hasErrors: boolean
  errors: string[]
}

// Main parser function
export function parseAIResponse(response: string): ParsedResponse {
  const result: ParsedResponse = {
    text: response,
    codeBlocks: [],
    toolCalls: [],
    hasErrors: false,
    errors: []
  }

  // Extract code blocks with file paths
  result.codeBlocks = extractCodeBlocks(response)

  // Extract tool calls
  result.toolCalls = extractToolCalls(response)

  // Check for error patterns
  const errorPatterns = [
    /error:/i,
    /failed to/i,
    /cannot find/i,
    /undefined/i,
    /null reference/i
  ]

  for (const pattern of errorPatterns) {
    if (pattern.test(response)) {
      result.hasErrors = true
      break
    }
  }

  return result
}

// Extract code blocks from markdown
export function extractCodeBlocks(content: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = []

  // Pattern 1: ```language:filepath
  const pattern1 = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g

  // Pattern 2: **File: filepath** followed by code block
  const pattern2 = /\*\*File:\s*([^\*]+)\*\*\s*\n```(\w+)?\n([\s\S]*?)```/g

  // Pattern 3: // filepath at start of code block
  const pattern3 = /```(\w+)?\n(\/\/\s*([^\n]+)\n)?([\s\S]*?)```/g

  let match

  // Process pattern 1
  while ((match = pattern1.exec(content)) !== null) {
    const language = match[1] || "text"
    const filePath = match[2]?.trim()
    const code = match[3]

    if (code.trim()) {
      blocks.push({
        language: normalizeLanguage(language),
        content: code.trim(),
        filePath: filePath ? normalizePath(filePath) : undefined,
        action: "update"
      })
    }
  }

  // Process pattern 2 if pattern 1 found nothing with file paths
  if (!blocks.some(b => b.filePath)) {
    pattern2.lastIndex = 0
    while ((match = pattern2.exec(content)) !== null) {
      const filePath = match[1]?.trim()
      const language = match[2] || "text"
      const code = match[3]

      if (code.trim() && filePath) {
        blocks.push({
          language: normalizeLanguage(language),
          content: code.trim(),
          filePath: normalizePath(filePath),
          action: "update"
        })
      }
    }
  }

  // Try pattern 3 for path in first line comment
  if (!blocks.some(b => b.filePath)) {
    pattern3.lastIndex = 0
    while ((match = pattern3.exec(content)) !== null) {
      const language = match[1] || "text"
      const pathComment = match[3]
      const code = match[4]

      if (code.trim()) {
        const filePath = pathComment && isValidFilePath(pathComment)
          ? normalizePath(pathComment)
          : undefined

        blocks.push({
          language: normalizeLanguage(language),
          content: code.trim(),
          filePath,
          action: "update"
        })
      }
    }
  }

  // Remove duplicates and merge if same file
  return deduplicateBlocks(blocks)
}

// Extract tool calls from response
export function extractToolCalls(content: string): Array<{ tool: string; args: Record<string, any> }> {
  const calls: Array<{ tool: string; args: Record<string, any> }> = []

  // Pattern: <tool_call>...</tool_call>
  const xmlPattern = /<tool_call>\s*({[\s\S]*?})\s*<\/tool_call>/g

  // Pattern: function call format
  const funcPattern = /(\w+)\(([\s\S]*?)\)/g

  let match

  while ((match = xmlPattern.exec(content)) !== null) {
    try {
      const call = JSON.parse(match[1])
      if (call.tool && call.args) {
        calls.push(call)
      }
    } catch {
      // Invalid JSON
    }
  }

  return calls
}

// Extract file path from various formats
export function extractFilePath(text: string): string | null {
  // Common file path patterns
  const patterns = [
    /(?:file|path|create|update|modify):\s*[`"']?([^\s`"']+\.\w+)[`"']?/i,
    /([a-zA-Z0-9_\-\/]+\.(tsx?|jsx?|css|html|json|md))/,
    /`([^`]+\.\w+)`/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && isValidFilePath(match[1])) {
      return normalizePath(match[1])
    }
  }

  return null
}

// Normalize language identifiers
function normalizeLanguage(lang: string): string {
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    yml: "yaml",
    sh: "bash",
    shell: "bash",
    zsh: "bash"
  }
  return map[lang.toLowerCase()] || lang.toLowerCase()
}

// Normalize file path
function normalizePath(path: string): string {
  // Remove leading/trailing whitespace and quotes
  let normalized = path.trim().replace(/^["'`]|["'`]$/g, "")

  // Ensure path starts with /
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized
  }

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, "/")

  return normalized
}

// Check if string looks like a valid file path
function isValidFilePath(str: string): boolean {
  // Must have an extension
  if (!/\.\w+$/.test(str)) return false

  // Must not contain invalid characters
  if (/[<>:"|?*]/.test(str)) return false

  // Must not be just an extension
  if (/^\.\w+$/.test(str)) return false

  return true
}

// Remove duplicate blocks and merge same file
function deduplicateBlocks(blocks: ParsedCodeBlock[]): ParsedCodeBlock[] {
  const map = new Map<string, ParsedCodeBlock>()

  for (const block of blocks) {
    const key = block.filePath || `${block.language}-${blocks.indexOf(block)}`

    if (block.filePath && map.has(key)) {
      // Merge with existing - keep the longer content
      const existing = map.get(key)!
      if (block.content.length > existing.content.length) {
        map.set(key, block)
      }
    } else {
      map.set(key, block)
    }
  }

  return Array.from(map.values())
}

// Apply diff to existing content
export function applyDiff(
  original: string,
  search: string,
  replace: string
): { success: boolean; result: string; error?: string } {
  // Try exact match first
  if (original.includes(search)) {
    return {
      success: true,
      result: original.replace(search, replace)
    }
  }

  // Try with normalized whitespace
  const normalizedOriginal = original.replace(/\s+/g, " ")
  const normalizedSearch = search.replace(/\s+/g, " ")

  if (normalizedOriginal.includes(normalizedSearch)) {
    // Find the actual position in original
    const lines = original.split("\n")
    const searchLines = search.split("\n").map(l => l.trim())

    for (let i = 0; i <= lines.length - searchLines.length; i++) {
      let match = true
      for (let j = 0; j < searchLines.length; j++) {
        if (lines[i + j].trim() !== searchLines[j]) {
          match = false
          break
        }
      }
      if (match) {
        const before = lines.slice(0, i)
        const after = lines.slice(i + searchLines.length)
        return {
          success: true,
          result: [...before, replace, ...after].join("\n")
        }
      }
    }
  }

  return {
    success: false,
    result: original,
    error: "Could not find the specified content to replace"
  }
}

// Generate diff preview
export function generateDiffPreview(
  original: string,
  modified: string
): string {
  const originalLines = original.split("\n")
  const modifiedLines = modified.split("\n")

  const diff: string[] = []
  let i = 0, j = 0

  while (i < originalLines.length || j < modifiedLines.length) {
    if (i >= originalLines.length) {
      diff.push(`+ ${modifiedLines[j]}`)
      j++
    } else if (j >= modifiedLines.length) {
      diff.push(`- ${originalLines[i]}`)
      i++
    } else if (originalLines[i] === modifiedLines[j]) {
      diff.push(`  ${originalLines[i]}`)
      i++
      j++
    } else {
      // Simple diff - mark as changed
      diff.push(`- ${originalLines[i]}`)
      diff.push(`+ ${modifiedLines[j]}`)
      i++
      j++
    }
  }

  return diff.join("\n")
}

// Validate code syntax (basic check)
export function validateCode(
  code: string,
  language: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (language === "typescript" || language === "javascript") {
    // Check for common syntax issues
    const openBraces = (code.match(/\{/g) || []).length
    const closeBraces = (code.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`)
    }

    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`)
    }

    const openBrackets = (code.match(/\[/g) || []).length
    const closeBrackets = (code.match(/\]/g) || []).length
    if (openBrackets !== closeBrackets) {
      errors.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`)
    }

    // Check for unclosed strings
    const singleQuotes = (code.match(/'/g) || []).length
    const doubleQuotes = (code.match(/"/g) || []).length
    const backticks = (code.match(/`/g) || []).length
    if (singleQuotes % 2 !== 0) {
      errors.push("Unclosed single quote string")
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push("Unclosed double quote string")
    }
    if (backticks % 2 !== 0) {
      errors.push("Unclosed template literal")
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
