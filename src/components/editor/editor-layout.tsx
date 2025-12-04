"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileTree } from "./file-tree"
import { CodeEditor } from "./code-editor"
import { AIChat } from "./ai-chat"
import { LivePreview } from "./live-preview"
import { EditorTabs } from "./editor-tabs"
import { DebugConsole } from "./debug-console"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useCollaboratorPresence } from "@/hooks/use-realtime"
import {
  Sparkles,
  PanelLeftClose,
  MessageSquare,
  Eye,
  Save,
  Rocket,
  ChevronLeft,
  Terminal,
  Users,
  Loader2,
  Github,
  History
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditorLayoutProps {
  projectId: string
}

export function EditorLayout({ projectId }: EditorLayoutProps) {
  const { supabase } = useSupabase()
  const { project } = useProjectStore()
  const {
    sidebarOpen,
    chatOpen,
    previewOpen,
    consoleOpen,
    toggleSidebar,
    toggleChat,
    togglePreview,
    toggleConsole,
    openTabs,
    activeTabId
  } = useEditorStore()

  const { collaborators } = useCollaboratorPresence(projectId)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  // Save files
  const saveFiles = useCallback(async () => {
    const dirtyTabs = openTabs.filter((t) => t.isDirty)
    if (dirtyTabs.length === 0) {
      toast.info("Nenhuma alteração para salvar")
      return
    }

    setIsSaving(true)
    try {
      for (const tab of dirtyTabs) {
        await supabase
          .from("project_files")
          .update({ content: tab.content, updated_at: new Date().toISOString() })
          .eq("project_id", projectId)
          .eq("path", tab.path)
      }
      toast.success(`${dirtyTabs.length} arquivo(s) salvo(s)!`)
    } catch (error) {
      toast.error("Erro ao salvar arquivos")
    } finally {
      setIsSaving(false)
    }
  }, [openTabs, projectId, supabase])

  // Deploy project
  const deployProject = useCallback(async () => {
    setIsDeploying(true)
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      })

      if (!response.ok) throw new Error("Deploy failed")

      const data = await response.json()
      toast.success("Deploy iniciado!", {
        description: `URL: ${data.url}`,
        action: {
          label: "Abrir",
          onClick: () => window.open(data.url, "_blank")
        }
      })
    } catch (error) {
      toast.error("Erro ao iniciar deploy")
    } finally {
      setIsDeploying(false)
    }
  }, [projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveFiles()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault()
        toggleConsole()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [saveFiles, toggleSidebar, toggleConsole])

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="h-12 border-b flex items-center justify-between px-2 bg-background">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voltar ao Dashboard</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 px-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">{project?.name || "Projeto"}</span>
            </div>

            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center gap-1 ml-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {collaborators.slice(0, 5).map((collab) => (
                    <Tooltip key={collab.id}>
                      <TooltipTrigger>
                        <Avatar
                          className="h-6 w-6 border-2 border-background"
                          style={{ borderColor: collab.color }}
                        >
                          <AvatarImage src={collab.avatarUrl} />
                          <AvatarFallback
                            className="text-[10px]"
                            style={{ backgroundColor: collab.color }}
                          >
                            {collab.userName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{collab.userName}</TooltipContent>
                    </Tooltip>
                  ))}
                  {collaborators.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                      +{collaborators.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className={cn(!sidebarOpen && "text-muted-foreground")}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Sidebar (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleConsole}
                  className={cn(!consoleOpen && "text-muted-foreground")}
                >
                  <Terminal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Console (Ctrl+J)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className={cn(!chatOpen && "text-muted-foreground")}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle AI Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePreview}
                  className={cn(!previewOpen && "text-muted-foreground")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Preview</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Action buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Histórico de versões</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Github className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>GitHub Sync</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveFiles}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={deployProject}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  Deploy
                </Button>
              </TooltipTrigger>
              <TooltipContent>Publicar projeto</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Sidebar */}
            {sidebarOpen && (
              <>
                <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                  <FileTree projectId={projectId} />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Editor + Preview area */}
            <ResizablePanel defaultSize={chatOpen ? 55 : 85}>
              <ResizablePanelGroup direction="vertical">
                {/* Editor and Preview row */}
                <ResizablePanel defaultSize={consoleOpen ? 70 : 100}>
                  <ResizablePanelGroup direction="horizontal">
                    {/* Code Editor */}
                    <ResizablePanel defaultSize={previewOpen ? 50 : 100} minSize={30}>
                      <div className="h-full flex flex-col">
                        <EditorTabs />
                        <div className="flex-1 overflow-hidden">
                          {activeTab ? (
                            <CodeEditor
                              content={activeTab.content}
                              language={activeTab.language}
                              path={activeTab.path}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              <div className="text-center">
                                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Selecione um arquivo para editar</p>
                                <p className="text-sm text-muted-foreground/70 mt-2">
                                  ou use o chat AI para criar novos arquivos
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ResizablePanel>

                    {/* Preview */}
                    {previewOpen && (
                      <>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50} minSize={30}>
                          <LivePreview projectId={projectId} />
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </ResizablePanel>

                {/* Debug Console */}
                {consoleOpen && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
                      <DebugConsole />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* AI Chat */}
            {chatOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <AIChat projectId={projectId} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </TooltipProvider>
  )
}
