import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { getSystemPrompt } from "@/lib/ai/system-prompt"
import { getOpenAITools } from "@/lib/ai/tools"
import { parseAIResponse, extractCodeBlocks } from "@/lib/ai/code-parser"
import { getRAGSystem } from "@/lib/ai/rag-system"
import {
  ErrorRecoveryEngine,
  createErrorContext,
  formatErrorForAI
} from "@/lib/ai/error-recovery"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize systems
const ragSystem = getRAGSystem()
const errorRecovery = new ErrorRecoveryEngine()

// Streaming response for real-time updates
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const body = await request.json()
    const {
      message,
      projectId,
      files,
      history,
      currentFile,
      consoleErrors,
      useStreaming = true
    } = body

    if (!message || !projectId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Verify user has access to the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name, description")
      .eq("id", projectId)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Check permissions
    if (project.user_id !== user.id) {
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (!collaborator || collaborator.role === "viewer") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    // Build file context
    const existingFiles = files?.map((f: any) => f.path) || []
    const fileContext = buildFileContext(files)

    // Generate system prompt with context
    let systemPrompt = getSystemPrompt({
      projectName: project.name,
      projectDescription: project.description || undefined,
      existingFiles,
      currentFile,
      recentErrors: consoleErrors
    })

    // RAG: Augment prompt with relevant documentation
    systemPrompt = ragSystem.augmentPrompt(message, systemPrompt)

    // Add error recovery context if there are console errors
    if (consoleErrors && consoleErrors.length > 0) {
      const errorContexts = consoleErrors.slice(-3).map((err: string) => {
        const errorCtx = createErrorContext(err)
        return formatErrorForAI(errorCtx)
      })

      systemPrompt += `\n\n## Recent Errors to Address\n\n${errorContexts.join("\n\n")}\n\nPlease analyze these errors and provide fixes if relevant to the user's request.`
    }

    // Build messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt }
    ]

    // Add file context
    if (fileContext) {
      messages.push({
        role: "system",
        content: `## Current Project Files\n\n${fileContext}`
      })
    }

    // Add conversation history (last 20 messages for context)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-20)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })
      }
    }

    // Add current user message
    messages.push({ role: "user", content: message })

    // Choose model based on complexity
    const model = detectComplexity(message) === "high"
      ? "gpt-4-turbo-preview"
      : "gpt-4-turbo-preview" // Can use gpt-3.5-turbo for simple tasks

    if (useStreaming) {
      // Streaming response
      const stream = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        stream: true,
        tools: getOpenAITools(),
        tool_choice: "auto"
      })

      // Create a TransformStream to process the response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          let fullContent = ""
          let toolCalls: any[] = []

          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta

              // Handle text content
              if (delta?.content) {
                fullContent += delta.content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "content",
                  content: delta.content
                })}\n\n`))
              }

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.index !== undefined) {
                    if (!toolCalls[tc.index]) {
                      toolCalls[tc.index] = {
                        id: tc.id || "",
                        type: "function",
                        function: { name: "", arguments: "" }
                      }
                    }
                    if (tc.function?.name) {
                      toolCalls[tc.index].function.name += tc.function.name
                    }
                    if (tc.function?.arguments) {
                      toolCalls[tc.index].function.arguments += tc.function.arguments
                    }
                  }
                }
              }

              // Check for finish
              if (chunk.choices[0]?.finish_reason) {
                // Parse and send code changes
                const codeBlocks = extractCodeBlocks(fullContent)

                if (codeBlocks.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: "code_changes",
                    changes: codeBlocks.map(block => ({
                      path: block.filePath,
                      content: block.content,
                      language: block.language,
                      action: block.action
                    }))
                  })}\n\n`))
                }

                // Send tool calls if any
                if (toolCalls.length > 0) {
                  const validToolCalls = toolCalls.filter(tc => tc.function.name)
                  if (validToolCalls.length > 0) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: "tool_calls",
                      calls: validToolCalls.map(tc => ({
                        name: tc.function.name,
                        arguments: safeParseJSON(tc.function.arguments)
                      }))
                    })}\n\n`))
                  }
                }

                // Send completion signal
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "done",
                  fullContent
                })}\n\n`))

                // Save to database (non-blocking)
                saveMessages(supabase, projectId, user.id, message, fullContent).catch(console.error)
              }
            }
          } catch (error) {
            console.error("Stream error:", error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              error: "Stream interrupted"
            })}\n\n`))
          }

          controller.close()
        }
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      })
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        tools: getOpenAITools(),
        tool_choice: "auto"
      })

      const responseContent = completion.choices[0]?.message?.content || ""
      const toolCalls = completion.choices[0]?.message?.tool_calls || []

      // Parse code changes
      const parsed = parseAIResponse(responseContent)

      // Save messages
      await saveMessages(supabase, projectId, user.id, message, responseContent)

      return new Response(JSON.stringify({
        content: responseContent,
        codeChanges: parsed.codeBlocks.map(block => ({
          path: block.filePath,
          content: block.content,
          language: block.language,
          action: block.action
        })),
        toolCalls: toolCalls.map(tc => ({
          name: tc.function.name,
          arguments: safeParseJSON(tc.function.arguments)
        }))
      }), {
        headers: { "Content-Type": "application/json" }
      })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

// Build context from files
function buildFileContext(files: any[] | undefined): string {
  if (!files || files.length === 0) return ""

  const fileContents: string[] = []

  const processFile = (file: any, depth = 0) => {
    if (file.type === "file" && file.content) {
      // Truncate very long files
      const content = file.content.length > 5000
        ? file.content.substring(0, 5000) + "\n// ... (truncated)"
        : file.content

      fileContents.push(`### ${file.path}\n\`\`\`${getLanguageFromPath(file.path)}\n${content}\n\`\`\``)
    }
    if (file.children) {
      for (const child of file.children) {
        processFile(child, depth + 1)
      }
    }
  }

  for (const file of files) {
    processFile(file)
  }

  // Limit total context size
  let totalContext = fileContents.join("\n\n")
  if (totalContext.length > 50000) {
    totalContext = totalContext.substring(0, 50000) + "\n\n// ... (context truncated)"
  }

  return totalContext
}

// Detect message complexity
function detectComplexity(message: string): "low" | "medium" | "high" {
  const complexKeywords = [
    "create", "build", "implement", "design", "architecture",
    "refactor", "optimize", "debug", "fix", "multiple",
    "full", "complete", "entire", "whole", "all"
  ]

  const lowerMessage = message.toLowerCase()
  const matchCount = complexKeywords.filter(k => lowerMessage.includes(k)).length

  if (matchCount >= 3 || message.length > 500) return "high"
  if (matchCount >= 1 || message.length > 200) return "medium"
  return "low"
}

// Get language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || ""
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    sql: "sql",
    py: "python"
  }
  return map[ext] || "text"
}

// Safe JSON parse
function safeParseJSON(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}

// Save messages to database
async function saveMessages(
  supabase: any,
  projectId: string,
  userId: string,
  userMessage: string,
  assistantMessage: string
) {
  await supabase.from("chat_messages").insert([
    {
      project_id: projectId,
      user_id: userId,
      role: "user",
      content: userMessage
    },
    {
      project_id: projectId,
      user_id: userId,
      role: "assistant",
      content: assistantMessage
    }
  ])
}
