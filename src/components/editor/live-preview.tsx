"use client"

import { useEffect, useState } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { useTheme } from "next-themes"
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Monitor, Terminal, Smartphone, Tablet, ExternalLink } from "lucide-react"

interface LivePreviewProps {
  projectId?: string
}

type ViewportSize = "desktop" | "tablet" | "mobile"

const viewportSizes: Record<ViewportSize, { width: string; icon: React.ReactNode }> = {
  desktop: { width: "100%", icon: <Monitor className="h-4 w-4" /> },
  tablet: { width: "768px", icon: <Tablet className="h-4 w-4" /> },
  mobile: { width: "375px", icon: <Smartphone className="h-4 w-4" /> },
}

export function LivePreview({ projectId }: LivePreviewProps) {
  const { files } = useEditorStore()
  const { theme } = useTheme()
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("preview")

  const sandpackFiles = buildSandpackFiles(files)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleOpenExternal = () => {
    // In a real implementation, this would open the preview in a new tab
    // For now, we'll just show a toast or do nothing
  }

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Monitor className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum arquivo para preview</p>
          <p className="text-sm text-muted-foreground/70">Crie arquivos para ver o preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-1">
          {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => (
            <Button
              key={size}
              variant={viewport === size ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewport(size)}
              title={size.charAt(0).toUpperCase() + size.slice(1)}
            >
              {viewportSizes[size].icon}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenExternal} title="Abrir em nova aba">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-background h-9 px-2">
          <TabsTrigger value="preview" className="text-xs">
            <Monitor className="h-3 w-3 mr-1" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="console" className="text-xs">
            <Terminal className="h-3 w-3 mr-1" />
            Console
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <SandpackProvider
            key={refreshKey}
            template="react"
            theme={theme === "dark" ? "dark" : "light"}
            files={sandpackFiles}
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
              recompileMode: "delayed",
              recompileDelay: 500,
            }}
          >
            <TabsContent value="preview" className="h-full m-0 p-0">
              <div
                className="h-full flex justify-center bg-muted/30 overflow-auto"
                style={{ padding: viewport !== "desktop" ? "16px" : 0 }}
              >
                <div
                  className="h-full bg-background shadow-lg transition-all duration-300"
                  style={{
                    width: viewportSizes[viewport].width,
                    maxWidth: "100%",
                  }}
                >
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={false}
                    showOpenInCodeSandbox={false}
                    style={{ height: "100%" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="console" className="h-full m-0 p-0">
              <SandpackConsole style={{ height: "100%" }} />
            </TabsContent>
          </SandpackProvider>
        </div>
      </Tabs>
    </div>
  )
}

function buildSandpackFiles(files: any[]): Record<string, string> {
  const sandpackFiles: Record<string, string> = {}

  const processFiles = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === "file" && node.content) {
        // Sandpack expects paths starting with /
        const path = node.path.startsWith("/") ? node.path : `/${node.path}`
        sandpackFiles[path] = node.content
      }
      if (node.children) {
        processFiles(node.children)
      }
    }
  }

  processFiles(files)

  // Ensure we have an entry point
  if (!sandpackFiles["/App.js"] && !sandpackFiles["/App.tsx"] && !sandpackFiles["/App.jsx"]) {
    // Check for index files
    if (!sandpackFiles["/index.js"] && !sandpackFiles["/index.tsx"] && !sandpackFiles["/index.jsx"]) {
      // Create a default App.js if none exists
      sandpackFiles["/App.js"] = `export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bem-vindo ao Vibe Code</h1>
      <p className="mt-2 text-gray-600">Comece a editar seus arquivos para ver o preview.</p>
    </div>
  )
}`
    }
  }

  return sandpackFiles
}
