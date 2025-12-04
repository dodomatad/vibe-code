import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Você é um assistente de programação especializado em criar aplicações web modernas. Você ajuda os usuários a:

1. Criar novos componentes React/TypeScript
2. Modificar código existente
3. Corrigir bugs
4. Explicar código
5. Sugerir melhorias

Quando gerar código:
- Use TypeScript sempre que possível
- Use Tailwind CSS para estilização
- Siga as melhores práticas de React (hooks, componentes funcionais)
- Inclua o caminho do arquivo no início do código como comentário: // /caminho/do/arquivo.tsx
- Sempre formate o código corretamente com indentação

Formato de resposta para código:
\`\`\`tsx
// /App.tsx
import React from 'react'

export default function App() {
  return <div>Hello</div>
}
\`\`\`

Seja conciso e direto. Foque em entregar código funcional e bem estruturado.
`

export async function POST(request: Request) {
  try {
    const { message, context, history, projectId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Build conversation messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // Add context about current files
    if (context) {
      messages.push({
        role: "system",
        content: `Contexto do projeto atual:\n\n${context}`,
      })
    }

    // Add chat history
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    })

    const content = completion.choices[0]?.message?.content || ""

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("Chat API error:", error)

    // Handle rate limiting or API errors gracefully
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
