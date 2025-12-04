"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/components/providers/supabase-provider"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { EditorLayout } from "@/components/editor/editor-layout"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { FileNode } from "@/types"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { user, loading: userLoading } = useUser()
  const { setProject, setLoading, isLoading } = useProjectStore()
  const { setFiles } = useEditorStore()
  const [initializing, setInitializing] = useState(true)

  const projectId = params.projectId as string

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
      return
    }

    if (user && projectId) {
      loadProject()
    }
  }, [user, userLoading, projectId])

  const loadProject = async () => {
    setLoading(true)

    // Load project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      toast.error("Projeto não encontrado")
      router.push("/dashboard")
      return
    }

    setProject(project)

    // Load files
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("path")

    if (filesError) {
      toast.error("Erro ao carregar arquivos")
      return
    }

    // Convert to file tree structure
    const fileTree = buildFileTree(files || [])
    setFiles(fileTree)

    setLoading(false)
    setInitializing(false)
  }

  if (userLoading || initializing || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  return <EditorLayout projectId={projectId} />
}

function buildFileTree(files: any[]): FileNode[] {
  const root: FileNode[] = []
  const pathMap = new Map<string, FileNode>()

  // Sort files so directories come before files
  const sortedFiles = [...files].sort((a, b) => {
    const aDepth = a.path.split("/").length
    const bDepth = b.path.split("/").length
    if (aDepth !== bDepth) return aDepth - bDepth
    return a.path.localeCompare(b.path)
  })

  for (const file of sortedFiles) {
    const parts = file.path.split("/").filter(Boolean)
    const fileName = parts[parts.length - 1]
    const parentPath = "/" + parts.slice(0, -1).join("/")

    const node: FileNode = {
      id: file.id,
      name: fileName,
      path: file.path,
      type: file.is_directory ? "folder" : "file",
      content: file.content,
      children: file.is_directory ? [] : undefined,
    }

    pathMap.set(file.path, node)

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parent = pathMap.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  return root
}
