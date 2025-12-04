"use client"

import { useMemo } from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react"
import { useState } from "react"

interface LivePreviewProps {
  projectId: string
}

export function LivePreview({ projectId }: LivePreviewProps) {
  const { files, openTabs } = useEditorStore()
  const { project } = useProjectStore()
  const [viewportSize, setViewportSize] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [key, setKey] = useState(0)

  // Convert file tree to Sandpack files format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {}

    // Get content from open tabs (has latest edits) or from files
    const getFileContent = (path: string): string | undefined => {
      const tab = openTabs.find((t) => t.path === path)
      if (tab) return tab.content

      const findInTree = (nodes: typeof files): string | undefined => {
        for (const node of nodes) {
          if (node.path === path) return node.content
          if (node.children) {
            const found = findInTree(node.children)
            if (found !== undefined) return found
          }
        }
        return undefined
      }

      return findInTree(files)
    }

    // Flatten file tree
    const flattenTree = (nodes: typeof files) => {
      for (const node of nodes) {
        if (node.type === "file") {
          const content = getFileContent(node.path)
          if (content !== undefined) {
            result[node.path] = content
          }
        }
        if (node.children) {
          flattenTree(node.children)
        }
      }
    }

    flattenTree(files)
    return result
  }, [files, openTabs])

  const viewportStyles = {
    desktop: { width: "100%", maxWidth: "100%" },
    tablet: { width: "768px", maxWidth: "768px" },
    mobile: { width: "375px", maxWidth: "375px" },
  }

  // Determine template based on project framework
  const template = project?.framework === "nextjs" ? "nextjs" : "react-ts"

  // If no files, show placeholder
  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Crie alguns arquivos para ver o preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 border-b flex items-center justify-between px-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Preview</span>
          <Badge variant="secondary" className="text-xs">Live</Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewportSize === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewportSize("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewportSize === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewportSize("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewportSize === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewportSize("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sandpack Preview */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="preview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-9">
            <TabsTrigger value="preview" className="text-xs">
              Preview
            </TabsTrigger>
            <TabsTrigger value="console" className="text-xs">
              Console
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 m-0 overflow-auto">
            <div
              className="h-full flex justify-center bg-muted/20 p-4"
              style={viewportSize !== "desktop" ? { alignItems: "flex-start" } : {}}
            >
              <div
                className="bg-background rounded-lg shadow-lg overflow-hidden h-full"
                style={viewportStyles[viewportSize]}
              >
                <SandpackProvider
                  key={key}
                  template={template}
                  files={sandpackFiles}
                  theme="dark"
                  options={{
                    externalResources: [
                      "https://cdn.tailwindcss.com",
                    ],
                    recompileMode: "delayed",
                    recompileDelay: 500,
                  }}
                  customSetup={{
                    dependencies: {
                      "react": "^18.2.0",
                      "react-dom": "^18.2.0",
                      "lucide-react": "latest",
                    },
                  }}
                >
                  <SandpackLayout style={{ height: "100%", border: "none" }}>
                    <SandpackPreview
                      showNavigator={false}
                      showOpenInCodeSandbox={false}
                      showRefreshButton={false}
                      style={{ height: "100%" }}
                    />
                  </SandpackLayout>
                </SandpackProvider>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="console" className="flex-1 m-0">
            <SandpackProvider
              key={`console-${key}`}
              template={template}
              files={sandpackFiles}
              theme="dark"
            >
              <SandpackConsole style={{ height: "100%" }} />
            </SandpackProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
