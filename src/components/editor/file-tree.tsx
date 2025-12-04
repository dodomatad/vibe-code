"use client"

import { useState } from "react"
import { useEditorStore } from "@/stores/editor-store"
import { useSupabase } from "@/components/providers/supabase-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil
} from "lucide-react"
import { cn, getFileExtension, getLanguageFromExtension, generateId } from "@/lib/utils"
import type { FileNode, EditorTab } from "@/types"
import { toast } from "sonner"

interface FileTreeProps {
  projectId: string
}

export function FileTree({ projectId }: FileTreeProps) {
  const { supabase } = useSupabase()
  const { files, setFiles, openTab, selectedFilePath, setSelectedFilePath } = useEditorStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/", "/src", "/app"]))
  const [creatingFile, setCreatingFile] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState("")

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = async (file: FileNode) => {
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

  const createNewFile = async (parentPath: string, isDirectory: boolean) => {
    if (!newFileName.trim()) {
      setCreatingFile(null)
      return
    }

    const newPath = parentPath === "/" ? `/${newFileName}` : `${parentPath}/${newFileName}`

    const { data, error } = await supabase
      .from("project_files")
      .insert({
        project_id: projectId,
        path: newPath,
        content: isDirectory ? "" : getDefaultContent(newFileName),
        is_directory: isDirectory,
      })
      .select()
      .single()

    if (error) {
      toast.error("Erro ao criar arquivo")
      return
    }

    const newNode: FileNode = {
      id: data.id,
      name: newFileName,
      path: newPath,
      type: isDirectory ? "folder" : "file",
      content: data.content,
      children: isDirectory ? [] : undefined,
    }

    // Add to file tree
    const updatedFiles = addFileToTree(files, parentPath, newNode)
    setFiles(updatedFiles)

    setCreatingFile(null)
    setNewFileName("")

    if (!isDirectory) {
      handleFileClick(newNode)
    }

    toast.success(`${isDirectory ? "Pasta" : "Arquivo"} criado!`)
  }

  const deleteFile = async (file: FileNode) => {
    const { error } = await supabase
      .from("project_files")
      .delete()
      .eq("id", file.id)

    if (error) {
      toast.error("Erro ao deletar")
      return
    }

    // Remove from tree
    const updatedFiles = removeFileFromTree(files, file.path)
    setFiles(updatedFiles)
    toast.success("Deletado!")
  }

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFilePath === node.path
    const Icon = node.type === "folder"
      ? (isExpanded ? FolderOpen : Folder)
      : File

    return (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "file-tree-item",
                isSelected && "active",
                depth > 0 && "ml-4"
              )}
              onClick={() => handleFileClick(node)}
            >
              {node.type === "folder" && (
                <span className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </span>
              )}
              <Icon className={cn(
                "h-4 w-4",
                node.type === "folder" ? "text-blue-400" : "text-muted-foreground"
              )} />
              <span className="text-sm truncate">{node.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {node.type === "folder" && (
              <>
                <ContextMenuItem onClick={() => {
                  setCreatingFile(node.path + ":file")
                  setExpandedFolders(prev => new Set([...prev, node.path]))
                }}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Novo arquivo
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  setCreatingFile(node.path + ":folder")
                  setExpandedFolders(prev => new Set([...prev, node.path]))
                }}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nova pasta
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Renomear
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive"
              onClick={() => deleteFile(node)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {node.type === "folder" && isExpanded && (
          <div>
            {creatingFile?.startsWith(node.path + ":") && (
              <div className="ml-8 py-1">
                <Input
                  autoFocus
                  placeholder={creatingFile.endsWith(":folder") ? "Nova pasta" : "novo-arquivo.tsx"}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createNewFile(node.path, creatingFile.endsWith(":folder"))
                    } else if (e.key === "Escape") {
                      setCreatingFile(null)
                      setNewFileName("")
                    }
                  }}
                  onBlur={() => {
                    if (newFileName.trim()) {
                      createNewFile(node.path, creatingFile.endsWith(":folder"))
                    } else {
                      setCreatingFile(null)
                    }
                  }}
                  className="h-7 text-sm"
                />
              </div>
            )}
            {node.children?.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Arquivos</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreatingFile("/:file")}
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreatingFile("/:folder")}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {creatingFile?.startsWith("/:") && (
            <div className="py-1">
              <Input
                autoFocus
                placeholder={creatingFile === "/:folder" ? "Nova pasta" : "novo-arquivo.tsx"}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createNewFile("/", creatingFile === "/:folder")
                  } else if (e.key === "Escape") {
                    setCreatingFile(null)
                    setNewFileName("")
                  }
                }}
                onBlur={() => {
                  if (newFileName.trim()) {
                    createNewFile("/", creatingFile === "/:folder")
                  } else {
                    setCreatingFile(null)
                  }
                }}
                className="h-7 text-sm"
              />
            </div>
          )}
          {files.map((file) => renderFileNode(file))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Helper functions
function addFileToTree(files: FileNode[], parentPath: string, newFile: FileNode): FileNode[] {
  if (parentPath === "/") {
    return [...files, newFile]
  }

  return files.map((file) => {
    if (file.path === parentPath && file.children) {
      return { ...file, children: [...file.children, newFile] }
    }
    if (file.children) {
      return { ...file, children: addFileToTree(file.children, parentPath, newFile) }
    }
    return file
  })
}

function removeFileFromTree(files: FileNode[], path: string): FileNode[] {
  return files
    .filter((file) => file.path !== path)
    .map((file) => {
      if (file.children) {
        return { ...file, children: removeFileFromTree(file.children, path) }
      }
      return file
    })
}

function getDefaultContent(filename: string): string {
  const ext = getFileExtension(filename)
  const templates: Record<string, string> = {
    tsx: `export default function Component() {
  return (
    <div>
      New Component
    </div>
  )
}
`,
    ts: `// ${filename}
`,
    css: `/* ${filename} */
`,
    json: `{

}
`,
  }
  return templates[ext] || ""
}
