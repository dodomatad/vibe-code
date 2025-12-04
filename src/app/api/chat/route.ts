import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Voce e um assistente de programacao especializado em criar e modificar codigo.
Voce ajuda usuarios a construir aplicacoes web modernas usando React, TypeScript, Tailwind CSS e outras tecnologias.

Quando o usuario pedir para criar ou modificar codigo:
1. Analise o contexto dos arquivos existentes
2. Gere codigo limpo, moderno e bem estruturado
3. Use TypeScript quando apropriado
4. Siga as melhores praticas do ecossistema React/Next.js
5. Use Tailwind CSS para estilizacao
6. Sempre responda em portugues

Se o usuario pedir para criar um novo arquivo ou componente, forneca o codigo completo.
Se for uma modificacao, explique as mudancas e forneca o codigo atualizado.

Formate as respostas de codigo usando blocos de codigo markdown com a linguagem especificada.
Exemplo:
\`\`\`typescript
// codigo aqui
\`\`\`

Quando criar componentes React, use functional components com hooks.
Inclua tipagem TypeScript adequada.
Use 'use client' quando o componente precisar de interatividade no browser.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, projectId, context, history } = await request.json()

    if (!message || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access to the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user owns the project or is a collaborator
    if (project.user_id !== user.id) {
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (!collaborator || collaborator.role === "viewer") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Build messages for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // Add context about existing files
    if (context) {
      messages.push({
        role: "system",
        content: `Contexto do projeto atual:\n\n${context}`,
      })
    }

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    }

    // Add current message
    messages.push({ role: "user", content: message })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    })

    const responseContent = completion.choices[0]?.message?.content || "Desculpe, nao consegui gerar uma resposta."

    // Save messages to database
    await supabase.from("chat_messages").insert([
      {
        project_id: projectId,
        user_id: user.id,
        role: "user",
        content: message,
      },
      {
        project_id: projectId,
        user_id: user.id,
        role: "assistant",
        content: responseContent,
      },
    ])

    // Parse code changes from response (if any)
    const codeChanges = parseCodeChanges(responseContent)

    return NextResponse.json({
      content: responseContent,
      codeChanges,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function parseCodeChanges(content: string): Array<{ path: string; content: string; action: string }> {
  const codeChanges: Array<{ path: string; content: string; action: string }> = []

  // Match code blocks with file paths
  // Pattern: ```language:path/to/file or // path/to/file at the start of code block
  const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1]
    let filePath = match[2]
    const code = match[3]

    // Try to extract path from first line comment if not in header
    if (!filePath && code) {
      const firstLine = code.split("\n")[0]
      const pathMatch = firstLine.match(/^\/\/\s*(.+\.\w+)/) || firstLine.match(/^#\s*(.+\.\w+)/)
      if (pathMatch) {
        filePath = pathMatch[1]
      }
    }

    if (filePath && code) {
      codeChanges.push({
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        content: code.trim(),
        action: "update",
      })
    }
  }

  return codeChanges
}
