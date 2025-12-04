"use client"

import { useState } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FilePlus, FolderPlus } from "lucide-react"
import { cn, getFileExtension, getLanguageFromExtension } from "@/lib/utils"
import type { FileNode, EditorTab } from "@/types"

interface FileTreeProps {
  projectId: string
}

export function FileTree({ projectId }: FileTreeProps) {
  const { files, openTab, selectedFilePath, setSelectedFilePath } = useEditorStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/", "/src", "/app"]))

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (file: FileNode) => {
    if (file.type === "folder") {
      toggleFolder(file.path)
      return
    }

    setSelectedFilePath(file.path)

    const ext = getFileExtension(file.name)
    const language = getLanguageFromExtension(ext)

    const tab: EditorTab = {
      id: file.id,
      path: file.path,
      name: file.name,
      content: file.content || "",
      language,
      isDirty: false,
    }

    openTab(tab)
  }

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFilePath === node.path
    const Icon = node.type === "folder" ? (isExpanded ? FolderOpen : Folder) : File

    return (
      <div key={node.path}>
        <div
          className={cn("file-tree-item", isSelected && "active")}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === "folder" && (
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
          <Icon className={cn("h-4 w-4", node.type === "folder" ? "text-blue-400" : "text-muted-foreground")} />
          <span className="text-sm truncate">{node.name}</span>
        </div>

        {node.type === "folder" && isExpanded && node.children?.map((child) => renderFileNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Arquivos</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">{files.map((file) => renderFileNode(file))}</div>
      </ScrollArea>
    </div>
  )
}
