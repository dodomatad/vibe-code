import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AgentOrchestrator, exploreWithTreeOfThought } from "@/lib/ai/agent-system"
import { getRAGSystem } from "@/lib/ai/rag-system"
import { ErrorRecoveryEngine, createErrorContext } from "@/lib/ai/error-recovery"

// Advanced Agent API - Full multi-agent workflow with planning, execution, and review
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
      consoleErrors,
      mode = "standard" // standard | tree-of-thought | parallel
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

    // Initialize RAG system for documentation
    const ragSystem = getRAGSystem()
    const errorRecovery = new ErrorRecoveryEngine()

    // Prepare file context
    const fileContext = files?.map((f: any) => ({
      path: f.path,
      content: f.content || ""
    })).filter((f: any) => f.content) || []

    // Add RAG context to message
    let augmentedMessage = message
    const relevantDocs = ragSystem.search(message, 2)
    if (relevantDocs.length > 0) {
      const docsContext = relevantDocs
        .map(r => `[${r.document.metadata.title}]: ${r.document.content.substring(0, 500)}`)
        .join("\n\n")
      augmentedMessage = `${message}\n\n---\nRelevant best practices:\n${docsContext}`
    }

    // Add error context if present
    if (consoleErrors && consoleErrors.length > 0) {
      const errorInfo = consoleErrors.slice(-3).map((err: string) => {
        const ctx = createErrorContext(err)
        // Attempt auto-recovery
        const fileContent = files?.find((f: any) => f.path === ctx.file)?.content
        return { ...ctx, code: fileContent }
      })

      augmentedMessage += `\n\n---\nCurrent errors to fix:\n${errorInfo.map(e =>
        `- ${e.errorType}: ${e.message}${e.file ? ` (${e.file}:${e.line})` : ""}`
      ).join("\n")}`
    }

    // Initialize the agent orchestrator
    const orchestrator = new AgentOrchestrator(process.env.OPENAI_API_KEY!, {
      projectId,
      projectName: project.name,
      files: fileContext,
      history: history || [],
      errors: consoleErrors || [],
      maxIterations: 15
    })

    // Stream the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial planning event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "status",
            status: "planning",
            message: "Analisando a solicitação e planejando a execução..."
          })}\n\n`))

          let result

          // Execute based on mode
          switch (mode) {
            case "tree-of-thought":
              // Tree-of-Thought: explore multiple solutions
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "status",
                status: "exploring",
                message: "Explorando múltiplas abordagens (Tree-of-Thought)..."
              })}\n\n`))
              result = await exploreWithTreeOfThought(orchestrator, augmentedMessage, 3)
              break

            default:
              // Standard execution
              result = await orchestrator.execute(augmentedMessage)
          }

          // Send thinking steps
          for (const step of result.steps) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "thinking",
              thought: step.thought,
              action: step.action,
              observation: step.observation.substring(0, 500)
            })}\n\n`))
          }

          // Send code changes
          if (result.codeChanges.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "code_changes",
              changes: result.codeChanges.map(c => ({
                path: c.path,
                content: c.content,
                action: c.action
              }))
            })}\n\n`))
          }

          // Send final content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "content",
            content: result.output
          })}\n\n`))

          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "done",
            success: result.success,
            errors: result.errors,
            tokensUsed: result.tokensUsed
          })}\n\n`))

          // Save to database
          await supabase.from("chat_messages").insert([
            {
              project_id: projectId,
              user_id: user.id,
              role: "user",
              content: message
            },
            {
              project_id: projectId,
              user_id: user.id,
              role: "assistant",
              content: result.output,
              metadata: {
                mode,
                success: result.success,
                changesCount: result.codeChanges.length,
                stepsCount: result.steps.length
              }
            }
          ])

        } catch (error) {
          console.error("Agent error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error"
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
  } catch (error) {
    console.error("Agent API error:", error)
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

// GET: Get agent capabilities and status
export async function GET() {
  return new Response(JSON.stringify({
    name: "Vibe AI Agent System",
    version: "2.0.0",
    capabilities: {
      planning: "Multi-step task planning with Chain-of-Thought",
      coding: "Expert code generation with TypeScript, React, Tailwind",
      review: "Automated code review for quality and security",
      debugging: "Self-correction and error recovery",
      documentation: "Automatic documentation generation",
      testing: "Test suite generation",
      rag: "Documentation retrieval for best practices",
      treeOfThought: "Multiple solution exploration"
    },
    agents: [
      { type: "planner", description: "Plans and coordinates tasks" },
      { type: "coder", description: "Writes and modifies code" },
      { type: "reviewer", description: "Reviews code quality" },
      { type: "debugger", description: "Fixes errors and bugs" },
      { type: "documenter", description: "Creates documentation" },
      { type: "tester", description: "Generates tests" }
    ],
    modes: ["standard", "tree-of-thought", "parallel"]
  }), {
    headers: { "Content-Type": "application/json" }
  })
}
