"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Plus, Search, Folder, Clock, MoreVertical, Sparkles, LogOut, Loader2 } from "lucide-react"
import type { Project } from "@/types"
import { slugify, formatRelativeTime } from "@/lib/utils"
import { templates } from "@/lib/templates"

export default function DashboardPage() {
  const { supabase } = useSupabase()
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectTemplate, setNewProjectTemplate] = useState("react-starter")

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (user) loadProjects()
  }, [user])

  const loadProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false })
    if (error) {
      toast.error("Erro ao carregar projetos")
      return
    }
    setProjects(data || [])
    setLoading(false)
  }

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Digite um nome para o projeto")
      return
    }

    setCreating(true)
    const slug = slugify(newProjectName)
    const template = templates.find((t) => t.id === newProjectTemplate)

    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name: newProjectName, slug, owner_id: user!.id, framework: template?.framework || "react" })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setCreating(false)
      return
    }

    if (template) {
      const files = Object.entries(template.files).map(([path, content]) => ({
        project_id: project.id,
        path,
        content,
        is_directory: false,
      }))
      await supabase.from("project_files").insert(files)
    }

    toast.success("Projeto criado!")
    setCreateOpen(false)
    setNewProjectName("")
    router.push(`/editor/${project.id}`)
  }

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", projectId)
    if (error) {
      toast.error("Erro ao deletar projeto")
      return
    }
    toast.success("Projeto deletado")
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Vibe Code</span>
          </Link>

          <div className="flex items-center gap-4">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar novo projeto</DialogTitle>
                  <DialogDescription>Escolha um template e comece a criar</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do projeto</Label>
                    <Input placeholder="Meu app incrivel" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={newProjectTemplate} onValueChange={setNewProjectTemplate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createProject} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Criar projeto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Projetos</h1>
            <p className="text-muted-foreground">Gerencie e edite seus projetos</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar projetos..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{searchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}</h2>
            <p className="text-muted-foreground mb-6">{searchQuery ? "Tente buscar por outro termo" : "Crie seu primeiro projeto para comecar"}</p>
            {!searchQuery && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro projeto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle>
                      <Link href={`/editor/${project.id}`} className="hover:text-primary transition">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(project.updated_at)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${project.id}`}>Abrir editor</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <Link href={`/editor/${project.id}`}>
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition cursor-pointer">
                      <Folder className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary">{project.framework}</Badge>
                    {project.deployed_url && <Badge variant="success">Online</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
