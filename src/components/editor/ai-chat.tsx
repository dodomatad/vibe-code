"use client"

import { useState, useRef, useEffect } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Sparkles, User, Loader2 } from "lucide-react"
import { cn, generateId } from "@/lib/utils"
import type { ChatMessageUI } from "@/types"
import { toast } from "sonner"

interface AIChatProps {
  projectId: string
}

export function AIChat({ projectId }: AIChatProps) {
  const { messages, addMessage, updateMessage, files } = useEditorStore()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
      const fileContext = files.filter((f) => f.type === "file").map((f) => `// ${f.path}\n${f.content}`).join("\n\n")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          projectId,
          context: fileContext,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      updateMessage(assistantMessageId, { content: data.content, isStreaming: false })
    } catch (error) {
      updateMessage(assistantMessageId, { content: "Desculpe, ocorreu um erro. Tente novamente.", isStreaming: false })
      toast.error("Erro ao processar mensagem")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col border-l">
      <div className="p-3 border-b flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-medium">AI Assistant</span>
        <Badge variant="secondary" className="ml-auto">Beta</Badge>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Ola! Como posso ajudar?</p>
              <p className="text-sm text-muted-foreground">Descreva o que voce quer criar ou modificar.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn("max-w-[85%] rounded-lg px-4 py-2", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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

      <div className="p-3 border-t">
        <div className="relative">
          <Textarea
            placeholder="Descreva o que voce quer criar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[200px] pr-12 resize-none"
            disabled={isLoading}
          />
          <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8" onClick={sendMessage} disabled={!input.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Shift+Enter para nova linha</p>
      </div>
    </div>
  )
}
