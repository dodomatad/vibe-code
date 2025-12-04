"use client"

import { useProjectStore } from "@/stores/project-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, UserPlus, Mail, Loader2 } from "lucide-react"
import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "sonner"

interface CollaboratorsProps {
  projectId: string
}

export function Collaborators({ projectId }: CollaboratorsProps) {
  const { collaborators, project } = useProjectStore()
  const { supabase } = useSupabase()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"editor" | "viewer">("editor")
  const [loading, setLoading] = useState(false)

  const inviteCollaborator = async () => {
    if (!email.trim()) {
      toast.error("Digite um email")
      return
    }

    setLoading(true)

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .single()

      if (profileError || !profile) {
        toast.error("Usuário não encontrado")
        setLoading(false)
        return
      }

      // Add collaborator
      const { error } = await supabase.from("project_collaborators").insert({
        project_id: projectId,
        user_id: profile.id,
        role,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("Este usuário já é um colaborador")
        } else {
          toast.error("Erro ao adicionar colaborador")
        }
        setLoading(false)
        return
      }

      toast.success("Colaborador adicionado!")
      setEmail("")
      setOpen(false)
    } catch (error) {
      toast.error("Erro ao convidar colaborador")
    } finally {
      setLoading(false)
    }
  }

  // Online indicators
  const onlineCollaborators = collaborators.filter(
    (c) => Date.now() - c.lastSeen.getTime() < 60000
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        {/* Online avatars */}
        <div className="flex -space-x-2">
          {onlineCollaborators.slice(0, 3).map((collaborator) => (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={collaborator.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {collaborator.userName?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collaborator.userName}</p>
                {collaborator.cursor && (
                  <p className="text-xs text-muted-foreground">
                    Editando: {collaborator.cursor.file}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          {onlineCollaborators.length > 3 && (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
              +{onlineCollaborators.length - 3}
            </div>
          )}
        </div>

        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Colaboradores</span>
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colaboradores</DialogTitle>
          <DialogDescription>
            Gerencie quem pode acessar e editar este projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite form */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Select value={role} onValueChange={(v: "editor" | "viewer") => setRole(v)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={inviteCollaborator} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Current collaborators */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {/* Owner */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>O</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Owner</p>
                    <p className="text-xs text-muted-foreground">
                      {project?.owner_id}
                    </p>
                  </div>
                </div>
                <Badge>Owner</Badge>
              </div>

              {/* Online collaborators */}
              {onlineCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.avatarUrl} />
                        <AvatarFallback>
                          {collaborator.userName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{collaborator.userName}</p>
                      {collaborator.cursor && (
                        <p className="text-xs text-muted-foreground">
                          Em: {collaborator.cursor.file}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">Online</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
