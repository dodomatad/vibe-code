"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Code,
  Check,
  X,
  FileCode,
  ChevronDown,
  ChevronUp,
  Wand2,
  AlertCircle,
  Brain,
  GitBranch,
  Zap,
  Eye,
  Settings2
} from "lucide-react"
import { cn, generateId } from "@/lib/utils"
import type { ChatMessageUI, CodeChange } from "@/types"
import { toast } from "sonner"

interface AIChatProps {
  projectId: string
}

type AgentMode = "standard" | "tree-of-thought" | "agent"

interface ThinkingStep {
  thought: string
  action: string
  observation: string
}

interface StreamEvent {
  type: "content" | "code_changes" | "tool_calls" | "done" | "error" | "status" | "thinking"
  content?: string
  changes?: CodeChange[]
  calls?: Array<{ name: string; arguments: any }>
  fullContent?: string
  error?: string
  status?: string
  message?: string
  thought?: string
  action?: string
  observation?: string
  success?: boolean
  tokensUsed?: number
}

export function AIChat({ projectId }: AIChatProps) {
  const {
    messages,
    addMessage,
    updateMessage,
    files,
    updateFile,
    addFile,
    activeTabId,
    openTabs,
    consoleLogs
  } = useEditorStore()

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([])
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const [agentMode, setAgentMode] = useState<AgentMode>("standard")
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get recent console errors for context
  const getRecentErrors = () => {
    return consoleLogs
      .filter(log => log.type === "error")
      .slice(-5)
      .map(log => log.message)
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Get current file context
  const getCurrentFileContext = () => {
    if (!activeTabId) return undefined
    const activeTab = openTabs.find(t => t.id === activeTabId)
    return activeTab?.path
  }

  // Send message with streaming
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessageUI = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    addMessage(userMessage)
    setInput("")
    setIsLoading(true)
    setPendingChanges([])
    setThinkingSteps([])
    setCurrentStatus(null)

    const assistantMessageId = generateId()
    const assistantMessage: ChatMessageUI = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true
    }
    addMessage(assistantMessage)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    // Decide API endpoint based on mode
    const apiEndpoint = agentMode === "agent" || agentMode === "tree-of-thought"
      ? "/api/agent"
      : "/api/chat"

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          projectId,
          files: files,
          history: messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
          currentFile: getCurrentFileContext(),
          consoleErrors: getRecentErrors(),
          mode: agentMode === "tree-of-thought" ? "tree-of-thought" : "standard",
          useStreaming: true
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""
      let codeChanges: CodeChange[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6))

                switch (event.type) {
                  case "content":
                    accumulatedContent += event.content || ""
                    updateMessage(assistantMessageId, {
                      content: accumulatedContent,
                      isStreaming: true
                    })
                    break

                  case "status":
                    setCurrentStatus(event.message || event.status || null)
                    break

                  case "thinking":
                    if (event.thought && event.action) {
                      setThinkingSteps(prev => [...prev, {
                        thought: event.thought!,
                        action: event.action!,
                        observation: event.observation || ""
                      }])
                    }
                    break

                  case "code_changes":
                    if (event.changes) {
                      codeChanges = event.changes
                      setPendingChanges(event.changes)
                    }
                    break

                  case "done":
                    updateMessage(assistantMessageId, {
                      content: event.fullContent || accumulatedContent,
                      isStreaming: false,
                      codeChanges: codeChanges
                    })
                    setCurrentStatus(null)
                    if (event.tokensUsed) {
                      toast.info(`Tokens usados: ${event.tokensUsed}`)
                    }
                    break

                  case "error":
                    toast.error(event.error || "Erro no streaming")
                    setCurrentStatus(null)
                    break
                }
              } catch {
                // Invalid JSON, skip
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        updateMessage(assistantMessageId, {
          content: "Resposta cancelada.",
          isStreaming: false
        })
      } else {
        updateMessage(assistantMessageId, {
          content: "Desculpe, ocorreu um erro. Tente novamente.",
          isStreaming: false
        })
        toast.error("Erro ao processar mensagem")
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Cancel streaming
  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // Apply a single code change
  const applyChange = useCallback((change: CodeChange) => {
    if (!change.path) {
      toast.error("Caminho do arquivo não especificado")
      return
    }

    const findAndUpdateFile = (nodes: any[], path: string): boolean => {
      for (const node of nodes) {
        if (node.path === path) {
          updateFile(node.id, change.content)
          return true
        }
        if (node.children) {
          if (findAndUpdateFile(node.children, path)) return true
        }
      }
      return false
    }

    if (change.action === "create" || !findAndUpdateFile(files, change.path)) {
      // Create new file
      addFile({
        id: generateId(),
        name: change.path.split("/").pop() || "new-file",
        path: change.path,
        type: "file",
        content: change.content
      })
      toast.success(`Arquivo criado: ${change.path}`)
    } else {
      toast.success(`Arquivo atualizado: ${change.path}`)
    }

    // Remove from pending
    setPendingChanges(prev => prev.filter(c => c.path !== change.path))
  }, [files, updateFile, addFile])

  // Apply all pending changes
  const applyAllChanges = useCallback(() => {
    for (const change of pendingChanges) {
      applyChange(change)
    }
    setPendingChanges([])
    toast.success("Todas as alterações aplicadas!")
  }, [pendingChanges, applyChange])

  // Reject a change
  const rejectChange = useCallback((path: string) => {
    setPendingChanges(prev => prev.filter(c => c.path !== path))
    toast.info(`Alteração rejeitada: ${path}`)
  }, [])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Toggle change expansion
  const toggleChange = (path: string) => {
    setExpandedChanges(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  // Render markdown-like content
  const renderContent = (content: string) => {
    // Simple markdown rendering
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/)
        if (match) {
          const [, lang, filePath, code] = match
          return (
            <div key={i} className="my-2 rounded-md bg-muted/50 overflow-hidden">
              {filePath && (
                <div className="px-3 py-1.5 bg-muted/80 text-xs font-mono flex items-center gap-2">
                  <FileCode className="h-3 w-3" />
                  {filePath}
                </div>
              )}
              <pre className="p-3 text-xs overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          )
        }
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>
    })
  }

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Vibe AI</span>
          <Badge variant="secondary" className="ml-auto">
            {agentMode === "agent" ? "Agent" : agentMode === "tree-of-thought" ? "ToT" : "GPT-4"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Modo de IA</span>
              <Select value={agentMode} onValueChange={(v) => setAgentMode(v as AgentMode)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      <span>Rapido</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3" />
                      <span>Agente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tree-of-thought">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span>Tree-of-Thought</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {agentMode === "standard" && "Respostas rapidas para tarefas simples."}
              {agentMode === "agent" && "Sistema multi-agente com planejamento, execucao e revisao automatica."}
              {agentMode === "tree-of-thought" && "Explora multiplas solucoes e escolhe a melhor abordagem."}
            </p>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {currentStatus && (
        <div className="px-4 py-2 bg-primary/10 border-b flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-primary">{currentStatus}</span>
        </div>
      )}

      {/* Thinking Steps (for agent mode) */}
      {thinkingSteps.length > 0 && (
        <Collapsible className="border-b">
          <CollapsibleTrigger className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/50">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pensamento da IA</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {thinkingSteps.length} etapas
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-2 space-y-2 bg-muted/30 max-h-40 overflow-auto">
              {thinkingSteps.map((step, i) => (
                <div key={i} className="text-xs space-y-1 pb-2 border-b border-muted last:border-0">
                  <div className="flex items-start gap-2">
                    <Eye className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{step.thought}</span>
                  </div>
                  <div className="flex items-start gap-2 ml-5">
                    <Code className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span className="font-mono text-green-600">{step.action}</span>
                  </div>
                  {step.observation && (
                    <div className="ml-5 text-muted-foreground truncate">
                      → {step.observation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Wand2 className="h-12 w-12 text-primary/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Ola! Sou o Vibe AI.</p>
              <p className="text-sm text-muted-foreground">
                {agentMode === "standard" && "Descreva o que voce quer criar ou modificar."}
                {agentMode === "agent" && "Modo Agente: Planejo, executo e reviso automaticamente."}
                {agentMode === "tree-of-thought" && "Modo ToT: Exploro multiplas solucoes para encontrar a melhor."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  "Crie um componente de login",
                  "Corrija os erros do console",
                  "Refatore este codigo"
                ].map(suggestion => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
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
                <Avatar className="h-8 w-8 flex-shrink-0">
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
                    <span className="text-sm">
                      {message.content || "Pensando..."}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm">
                    {renderContent(message.content)}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Pending Changes Panel */}
      {pendingChanges.length > 0 && (
        <div className="border-t bg-muted/30 p-3 space-y-2 max-h-[40%] overflow-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Code className="h-4 w-4 text-primary" />
              {pendingChanges.length} alteração(ões) pendente(s)
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingChanges([])}
              >
                <X className="h-3 w-3 mr-1" />
                Rejeitar todas
              </Button>
              <Button size="sm" onClick={applyAllChanges}>
                <Check className="h-3 w-3 mr-1" />
                Aplicar todas
              </Button>
            </div>
          </div>

          {pendingChanges.map((change) => (
            <div
              key={change.path}
              className="bg-background rounded-md border overflow-hidden"
            >
              <div
                className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleChange(change.path)}
              >
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono flex-1 truncate">
                  {change.path}
                </span>
                <Badge variant="outline" className="text-xs">
                  {change.action}
                </Badge>
                {expandedChanges.has(change.path) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>

              {expandedChanges.has(change.path) && (
                <div className="border-t">
                  <pre className="p-3 text-xs overflow-auto max-h-40 bg-muted/30">
                    <code>{change.content}</code>
                  </pre>
                  <div className="px-3 py-2 border-t flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectChange(change.path)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => applyChange(change)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Descreva o que voce quer criar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[200px] pr-12 resize-none"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              size="icon"
              variant="destructive"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={cancelStreaming}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
