"use client"

import { useState, useRef, useEffect } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Code2,
  Copy,
  Check,
  RefreshCw
} from "lucide-react"
import { cn, generateId, getFileExtension, getLanguageFromExtension } from "@/lib/utils"
import type { ChatMessageUI, CodeChange, EditorTab } from "@/types"
import { toast } from "sonner"

interface AIChatProps {
  projectId: string
}

export function AIChat({ projectId }: AIChatProps) {
  const { supabase } = useSupabase()
  const {
    messages,
    addMessage,
    updateMessage,
    files,
    openTab,
    updateFile,
    setFiles,
    addFile
  } = useEditorStore()

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessageUI = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInput("")
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = generateId()
    const assistantMessage: ChatMessageUI = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }
    addMessage(assistantMessage)

    try {
      // Get current file context
      const fileContext = files
        .filter((f) => f.type === "file")
        .map((f) => `// ${f.path}\n${f.content}`)
        .join("\n\n")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          projectId,
          context: fileContext,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Parse code changes from response
      const codeChanges = parseCodeChanges(data.content)

      updateMessage(assistantMessageId, {
        content: data.content,
        isStreaming: false,
        codeChanges,
      })

      // Save messages to database
      await supabase.from("chat_messages").insert([
        {
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: "user",
          content: userMessage.content,
        },
        {
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: "assistant",
          content: data.content,
          metadata: { codeChanges },
        },
      ])
    } catch (error) {
      updateMessage(assistantMessageId, {
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        isStreaming: false,
      })
      toast.error("Erro ao processar mensagem")
    } finally {
      setIsLoading(false)
    }
  }

  const applyCodeChange = async (change: CodeChange) => {
    if (change.action === "create" || change.action === "update") {
      // Save to database
      const { data, error } = await supabase
        .from("project_files")
        .upsert({
          project_id: projectId,
          path: change.path,
          content: change.content,
          is_directory: false,
        }, {
          onConflict: "project_id,path"
        })
        .select()
        .single()

      if (error) {
        toast.error("Erro ao aplicar alteração")
        return
      }

      // Update local state
      updateFile(change.path, change.content)

      // Open in editor
      const ext = getFileExtension(change.path)
      const tab: EditorTab = {
        id: data?.id || generateId(),
        path: change.path,
        name: change.path.split("/").pop() || "",
        content: change.content,
        language: getLanguageFromExtension(ext),
        isDirty: false,
      }
      openTab(tab)

      toast.success(`Arquivo ${change.action === "create" ? "criado" : "atualizado"}!`)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col border-l">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-medium">AI Assistant</span>
        <Badge variant="secondary" className="ml-auto">Beta</Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Olá! Como posso ajudar?
              </p>
              <p className="text-sm text-muted-foreground">
                Descreva o que você quer criar ou modificar.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm whitespace-pre-wrap">
                      {renderMessageContent(message.content)}
                    </div>

                    {/* Code changes */}
                    {message.codeChanges && message.codeChanges.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.codeChanges.map((change, i) => (
                          <div
                            key={i}
                            className="rounded-md border bg-background p-2"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-mono">
                                  {change.path}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {change.action}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    copyToClipboard(change.content, `${message.id}-${i}`)
                                  }
                                >
                                  {copiedId === `${message.id}-${i}` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => applyCodeChange(change)}
                            >
                              Aplicar alteração
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Descreva o que você quer criar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[200px] pr-12 resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Shift+Enter para nova linha • Enter para enviar
        </p>
      </div>
    </div>
  )
}

// Parse code blocks from AI response
function parseCodeChanges(content: string): CodeChange[] {
  const changes: CodeChange[] = []
  const codeBlockRegex = /```(\w+)?\s*\n?(?:\/\/\s*(\S+)\n)?([\s\S]*?)```/g

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, lang, path, code] = match
    if (path && code) {
      changes.push({
        path: path.startsWith("/") ? path : `/${path}`,
        content: code.trim(),
        action: "update",
      })
    }
  }

  return changes
}

// Render message content with code highlighting
function renderMessageContent(content: string): React.ReactNode {
  // Simple markdown-like rendering
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w+)?\n([\s\S]*?)```/)
      if (match) {
        const [, lang, code] = match
        return (
          <pre
            key={i}
            className="mt-2 p-3 rounded-md bg-background border overflow-x-auto"
          >
            <code className="text-xs font-mono">{code.trim()}</code>
          </pre>
        )
      }
    }
    return <span key={i}>{part}</span>
  })
}
