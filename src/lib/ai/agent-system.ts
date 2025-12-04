// Advanced Multi-Agent System
// Inspired by Devin, ReAct, and Tree-of-Thought approaches

import OpenAI from "openai"
import { getSystemPrompt } from "./system-prompt"
import { AI_TOOLS, getOpenAITools } from "./tools"
import { parseAIResponse, extractCodeBlocks, applyDiff } from "./code-parser"

// Agent Types (inspired by Devin's architecture)
export type AgentType =
  | "planner"      // Plans and coordinates tasks
  | "coder"        // Writes and modifies code
  | "reviewer"     // Reviews code for quality
  | "debugger"     // Fixes errors and bugs
  | "documenter"   // Writes documentation
  | "tester"       // Creates tests

export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  systemPrompt: string
  tools: string[]
  temperature: number
  maxRetries: number
}

// Agent configurations
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  planner: {
    type: "planner",
    name: "Planner Agent",
    description: "Analyzes tasks and creates execution plans",
    systemPrompt: `You are a Planning Agent specialized in breaking down complex tasks.

Your responsibilities:
1. Analyze the user's request thoroughly
2. Break it into smaller, manageable subtasks
3. Identify dependencies between subtasks
4. Estimate complexity and potential challenges
5. Create a clear execution plan

Output Format:
<plan>
  <task id="1" complexity="low|medium|high" agent="coder|reviewer|debugger|tester">
    <description>Task description</description>
    <dependencies>none|task_ids</dependencies>
  </task>
  ...
</plan>

<thinking>
Your reasoning about the approach
</thinking>`,
    tools: ["vibe_view", "vibe_search"],
    temperature: 0.3,
    maxRetries: 2
  },

  coder: {
    type: "coder",
    name: "Coder Agent",
    description: "Writes and modifies code",
    systemPrompt: `You are an Expert Coding Agent with deep knowledge of modern web development.

Your responsibilities:
1. Write clean, efficient, type-safe code
2. Follow the project's existing patterns and conventions
3. Use TypeScript with strict types
4. Implement responsive designs with Tailwind CSS
5. Handle edge cases and errors properly

Before writing code:
<thinking>
- What is the goal?
- What existing code should I reference?
- What patterns should I follow?
- What edge cases should I handle?
</thinking>

Then provide the complete implementation with file paths.`,
    tools: ["vibe_view", "vibe_write", "vibe_edit", "vibe_search", "vibe_add_dependency"],
    temperature: 0.4,
    maxRetries: 3
  },

  reviewer: {
    type: "reviewer",
    name: "Code Reviewer Agent",
    description: "Reviews code for quality and best practices",
    systemPrompt: `You are a Senior Code Reviewer Agent focused on code quality.

Review code for:
1. Type safety and TypeScript best practices
2. Performance issues and optimizations
3. Security vulnerabilities
4. Accessibility compliance
5. Code maintainability and readability
6. Proper error handling

Output Format:
<review>
  <score>1-10</score>
  <issues>
    <issue severity="critical|major|minor|suggestion" line="N">
      Description and fix suggestion
    </issue>
  </issues>
  <summary>Overall assessment</summary>
</review>`,
    tools: ["vibe_view", "vibe_search"],
    temperature: 0.2,
    maxRetries: 1
  },

  debugger: {
    type: "debugger",
    name: "Debugger Agent",
    description: "Identifies and fixes bugs",
    systemPrompt: `You are an Expert Debugging Agent specialized in finding and fixing bugs.

Your debugging process:
1. Analyze the error message and stack trace
2. Identify the root cause
3. Search for related code
4. Understand the context and expected behavior
5. Propose and implement a fix

<thinking>
- Error type: [syntax|runtime|logic|type]
- Root cause analysis
- Affected components
- Fix strategy
</thinking>

<fix>
  <file>path/to/file</file>
  <description>What the fix does</description>
  <code>The corrected code</code>
</fix>`,
    tools: ["vibe_view", "vibe_edit", "vibe_search", "vibe_read_console"],
    temperature: 0.3,
    maxRetries: 5
  },

  documenter: {
    type: "documenter",
    name: "Documentation Agent",
    description: "Creates and updates documentation",
    systemPrompt: `You are a Documentation Agent that writes clear, helpful documentation.

Create documentation that:
1. Explains the purpose and usage
2. Provides clear examples
3. Documents all parameters and return types
4. Includes edge cases and error handling
5. Is well-organized and searchable`,
    tools: ["vibe_view", "vibe_write", "vibe_search"],
    temperature: 0.5,
    maxRetries: 2
  },

  tester: {
    type: "tester",
    name: "Testing Agent",
    description: "Creates comprehensive tests",
    systemPrompt: `You are a Testing Agent that creates thorough test suites.

Create tests that:
1. Cover happy paths and edge cases
2. Test error handling
3. Include integration tests where appropriate
4. Use descriptive test names
5. Follow testing best practices

Use Vitest/Jest syntax with React Testing Library for components.`,
    tools: ["vibe_view", "vibe_write", "vibe_search"],
    temperature: 0.3,
    maxRetries: 2
  }
}

// Execution context for agent memory
export interface ExecutionContext {
  projectId: string
  projectName: string
  files: Array<{ path: string; content: string }>
  history: Array<{ role: string; content: string }>
  errors: string[]
  iterations: number
  maxIterations: number
  decisions: Array<{
    agent: AgentType
    action: string
    result: string
    timestamp: Date
  }>
}

// ReAct step result
export interface ReActStep {
  thought: string
  action: string
  actionInput: any
  observation: string
}

// Agent execution result
export interface AgentResult {
  success: boolean
  output: string
  codeChanges: Array<{
    path: string
    content: string
    action: "create" | "update" | "delete"
  }>
  errors: string[]
  steps: ReActStep[]
  tokensUsed: number
}

// Main Agent Orchestrator
export class AgentOrchestrator {
  private openai: OpenAI
  private context: ExecutionContext

  constructor(apiKey: string, context: Partial<ExecutionContext>) {
    this.openai = new OpenAI({ apiKey })
    this.context = {
      projectId: context.projectId || "",
      projectName: context.projectName || "Project",
      files: context.files || [],
      history: context.history || [],
      errors: context.errors || [],
      iterations: 0,
      maxIterations: context.maxIterations || 10,
      decisions: []
    }
  }

  // Main execution method with ReAct loop
  async execute(userMessage: string): Promise<AgentResult> {
    const result: AgentResult = {
      success: false,
      output: "",
      codeChanges: [],
      errors: [],
      steps: [],
      tokensUsed: 0
    }

    try {
      // Step 1: Planning phase
      const plan = await this.plan(userMessage)
      result.steps.push({
        thought: "Creating execution plan",
        action: "plan",
        actionInput: userMessage,
        observation: plan
      })

      // Step 2: Parse and execute plan
      const tasks = this.parsePlan(plan)

      for (const task of tasks) {
        if (this.context.iterations >= this.context.maxIterations) {
          result.errors.push("Max iterations reached")
          break
        }

        // Execute task with appropriate agent
        const taskResult = await this.executeTask(task)
        result.steps.push(...taskResult.steps)
        result.codeChanges.push(...taskResult.codeChanges)

        if (!taskResult.success) {
          // Self-correction: try to fix errors
          const fixResult = await this.selfCorrect(task, taskResult.errors)
          if (fixResult.success) {
            result.steps.push(...fixResult.steps)
            result.codeChanges.push(...fixResult.codeChanges)
          } else {
            result.errors.push(...fixResult.errors)
          }
        }

        this.context.iterations++
      }

      // Step 3: Review phase (optional but recommended)
      if (result.codeChanges.length > 0) {
        const review = await this.review(result.codeChanges)
        result.steps.push({
          thought: "Reviewing generated code",
          action: "review",
          actionInput: result.codeChanges.map(c => c.path),
          observation: review
        })
      }

      result.success = result.errors.length === 0
      result.output = this.formatOutput(result)

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error")
    }

    return result
  }

  // Planning with Chain-of-Thought
  private async plan(userMessage: string): Promise<string> {
    const config = AGENT_CONFIGS.planner

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: config.systemPrompt },
      {
        role: "system",
        content: `Project: ${this.context.projectName}\nExisting files: ${this.context.files.map(f => f.path).join(", ")}`
      },
      { role: "user", content: userMessage }
    ]

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: config.temperature,
      max_tokens: 2000
    })

    return completion.choices[0]?.message?.content || ""
  }

  // Parse plan into executable tasks
  private parsePlan(plan: string): Array<{
    id: string
    description: string
    agent: AgentType
    dependencies: string[]
  }> {
    const tasks: Array<{
      id: string
      description: string
      agent: AgentType
      dependencies: string[]
    }> = []

    // Parse XML-like plan format
    const taskRegex = /<task id="(\d+)"[^>]*agent="(\w+)"[^>]*>\s*<description>([^<]+)<\/description>\s*<dependencies>([^<]*)<\/dependencies>\s*<\/task>/g
    let match

    while ((match = taskRegex.exec(plan)) !== null) {
      tasks.push({
        id: match[1],
        agent: match[2] as AgentType,
        description: match[3].trim(),
        dependencies: match[4] === "none" ? [] : match[4].split(",").map(d => d.trim())
      })
    }

    // If no structured plan, create a single coder task
    if (tasks.length === 0) {
      tasks.push({
        id: "1",
        description: plan,
        agent: "coder",
        dependencies: []
      })
    }

    return tasks
  }

  // Execute a single task with the appropriate agent
  private async executeTask(task: {
    id: string
    description: string
    agent: AgentType
    dependencies: string[]
  }): Promise<AgentResult> {
    const config = AGENT_CONFIGS[task.agent] || AGENT_CONFIGS.coder
    const result: AgentResult = {
      success: false,
      output: "",
      codeChanges: [],
      errors: [],
      steps: [],
      tokensUsed: 0
    }

    // Build context-aware prompt
    const fileContext = this.buildFileContext()

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: config.systemPrompt },
      { role: "system", content: fileContext },
      ...this.context.history.slice(-10).map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content
      })),
      { role: "user", content: task.description }
    ]

    // Get tools for this agent
    const tools = getOpenAITools().filter(t =>
      config.tools.includes(t.function.name)
    )

    let retries = 0
    while (retries < config.maxRetries) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages,
          temperature: config.temperature,
          max_tokens: 8000,
          tools: tools.length > 0 ? tools : undefined
        })

        const response = completion.choices[0]?.message
        result.tokensUsed += completion.usage?.total_tokens || 0

        // Handle tool calls
        if (response?.tool_calls && response.tool_calls.length > 0) {
          for (const toolCall of response.tool_calls) {
            const toolResult = await this.executeTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            )
            result.steps.push({
              thought: `Using tool: ${toolCall.function.name}`,
              action: toolCall.function.name,
              actionInput: JSON.parse(toolCall.function.arguments),
              observation: JSON.stringify(toolResult)
            })
          }
        }

        // Parse code changes from response
        if (response?.content) {
          const parsed = parseAIResponse(response.content)
          result.codeChanges = parsed.codeBlocks.map(block => ({
            path: block.filePath || "",
            content: block.content,
            action: block.action as "create" | "update" | "delete"
          })).filter(c => c.path)

          result.output = response.content
        }

        result.success = true
        break

      } catch (error) {
        retries++
        result.errors.push(`Attempt ${retries}: ${error instanceof Error ? error.message : "Unknown error"}`)

        if (retries >= config.maxRetries) {
          result.success = false
        }
      }
    }

    // Record decision
    this.context.decisions.push({
      agent: task.agent,
      action: task.description,
      result: result.success ? "success" : "failed",
      timestamp: new Date()
    })

    return result
  }

  // Self-correction mechanism
  private async selfCorrect(
    task: { id: string; description: string; agent: AgentType },
    errors: string[]
  ): Promise<AgentResult> {
    const config = AGENT_CONFIGS.debugger
    const result: AgentResult = {
      success: false,
      output: "",
      codeChanges: [],
      errors: [],
      steps: [],
      tokensUsed: 0
    }

    const errorContext = errors.join("\n")

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: config.systemPrompt },
      {
        role: "user",
        content: `Previous task failed with errors:\n\n${errorContext}\n\nOriginal task: ${task.description}\n\nPlease analyze and fix the issues.`
      }
    ]

    result.steps.push({
      thought: "Self-correction triggered",
      action: "analyze_error",
      actionInput: { errors, task: task.description },
      observation: "Starting error analysis"
    })

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: config.temperature,
        max_tokens: 4000
      })

      const response = completion.choices[0]?.message?.content || ""

      // Extract fix from response
      const fixMatch = response.match(/<fix>([\s\S]*?)<\/fix>/)
      if (fixMatch) {
        const codeMatch = fixMatch[1].match(/<code>([\s\S]*?)<\/code>/)
        const fileMatch = fixMatch[1].match(/<file>([^<]+)<\/file>/)

        if (codeMatch && fileMatch) {
          result.codeChanges.push({
            path: fileMatch[1].trim(),
            content: codeMatch[1].trim(),
            action: "update"
          })
          result.success = true
        }
      }

      result.output = response
      result.steps.push({
        thought: "Error correction applied",
        action: "apply_fix",
        actionInput: result.codeChanges,
        observation: result.success ? "Fix applied successfully" : "Could not apply fix"
      })

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Self-correction failed")
    }

    return result
  }

  // Code review
  private async review(codeChanges: AgentResult["codeChanges"]): Promise<string> {
    const config = AGENT_CONFIGS.reviewer

    const codeContext = codeChanges
      .map(c => `File: ${c.path}\n\`\`\`\n${c.content}\n\`\`\``)
      .join("\n\n")

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: config.systemPrompt },
      { role: "user", content: `Review the following code changes:\n\n${codeContext}` }
    ]

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: config.temperature,
      max_tokens: 2000
    })

    return completion.choices[0]?.message?.content || ""
  }

  // Execute a tool
  private async executeTool(name: string, args: any): Promise<any> {
    // Tool execution would be implemented here
    // For now, return mock results
    switch (name) {
      case "vibe_view":
        const file = this.context.files.find(f => f.path === args.path)
        return file ? { content: file.content } : { error: "File not found" }

      case "vibe_search":
        const matches = this.context.files.filter(f =>
          f.content.includes(args.pattern)
        )
        return { matches: matches.map(f => f.path) }

      default:
        return { executed: true, args }
    }
  }

  // Build file context string
  private buildFileContext(): string {
    const relevantFiles = this.context.files.slice(0, 10)
    return `## Project Files\n\n${relevantFiles.map(f =>
      `### ${f.path}\n\`\`\`\n${f.content.substring(0, 2000)}${f.content.length > 2000 ? "\n// ... truncated" : ""}\n\`\`\``
    ).join("\n\n")}`
  }

  // Format final output
  private formatOutput(result: AgentResult): string {
    let output = result.output

    if (result.codeChanges.length > 0) {
      output += "\n\n## Changes Applied\n"
      output += result.codeChanges.map(c =>
        `- ${c.action}: ${c.path}`
      ).join("\n")
    }

    if (result.errors.length > 0) {
      output += "\n\n## Errors Encountered\n"
      output += result.errors.map(e => `- ${e}`).join("\n")
    }

    return output
  }
}

// Utility: Run multiple agents in parallel
export async function runAgentsInParallel(
  orchestrator: AgentOrchestrator,
  tasks: Array<{ description: string; agent: AgentType }>
): Promise<AgentResult[]> {
  return Promise.all(
    tasks.map(task =>
      orchestrator.execute(task.description)
    )
  )
}

// Utility: Tree-of-Thought exploration
export async function exploreWithTreeOfThought(
  orchestrator: AgentOrchestrator,
  problem: string,
  branches: number = 3
): Promise<AgentResult> {
  // Generate multiple solution approaches
  const approaches = await Promise.all(
    Array(branches).fill(null).map((_, i) =>
      orchestrator.execute(`Approach ${i + 1}: ${problem}`)
    )
  )

  // Select best result based on success and error count
  const best = approaches.reduce((a, b) => {
    if (a.success && !b.success) return a
    if (!a.success && b.success) return b
    if (a.errors.length < b.errors.length) return a
    return b
  })

  return best
}
