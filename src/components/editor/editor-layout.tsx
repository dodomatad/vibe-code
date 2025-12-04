"use client"

import { useCallback, useEffect } from "react"
import Link from "next/link"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { FileTree } from "./file-tree"
import { CodeEditor } from "./code-editor"
import { AIChat } from "./ai-chat"
import { LivePreview } from "./live-preview"
import { EditorTabs } from "./editor-tabs"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Sparkles, PanelLeftClose, MessageSquare, Eye, Save, Rocket, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

interface EditorLayoutProps {
  projectId: string
}

export function EditorLayout({ projectId }: EditorLayoutProps) {
  const { supabase } = useSupabase()
  const { project } = useProjectStore()
  const { sidebarOpen, chatOpen, previewOpen, toggleSidebar, toggleChat, togglePreview, openTabs, activeTabId } = useEditorStore()

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  const saveFiles = useCallback(async () => {
    const dirtyTabs = openTabs.filter((t) => t.isDirty)
    if (dirtyTabs.length === 0) return

    for (const tab of dirtyTabs) {
      await supabase.from("project_files").update({ content: tab.content }).eq("project_id", projectId).eq("path", tab.path)
    }
    toast.success("Arquivos salvos!")
  }, [openTabs, projectId, supabase])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveFiles()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [saveFiles])

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
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
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                  <PanelLeftClose className={`h-4 w-4 ${!sidebarOpen ? "text-muted-foreground" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Sidebar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleChat}>
                  <MessageSquare className={`h-4 w-4 ${!chatOpen ? "text-muted-foreground" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle AI Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={togglePreview}>
                  <Eye className={`h-4 w-4 ${!previewOpen ? "text-muted-foreground" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Preview</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={saveFiles}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="sm">
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
              </TooltipTrigger>
              <TooltipContent>Publicar projeto</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {sidebarOpen && (
              <>
                <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                  <FileTree projectId={projectId} />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            <ResizablePanel defaultSize={chatOpen ? 55 : 85}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={previewOpen ? 50 : 100} minSize={30}>
                  <div className="h-full flex flex-col">
                    <EditorTabs />
                    <div className="flex-1 overflow-hidden">
                      {activeTab ? (
                        <CodeEditor content={activeTab.content} language={activeTab.language} path={activeTab.path} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Selecione um arquivo para editar</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ResizablePanel>

                {previewOpen && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                      <LivePreview />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

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
