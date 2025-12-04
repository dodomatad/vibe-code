"use client"

import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  History,
  Save,
  RotateCcw,
  Loader2,
  GitCommit
} from "lucide-react"
import { toast } from "sonner"
import { formatRelativeTime } from "@/lib/utils"

interface VersionHistoryProps {
  projectId: string
}

interface Version {
  id: string
  version_number: number
  message: string
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

export function VersionHistory({ projectId }: VersionHistoryProps) {
  const { versions, setVersions, addVersion } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, projectId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/versions?projectId=${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setVersions(data.versions || [])
      } else {
        toast.error(data.error || "Erro ao carregar versões")
      }
    } catch (error) {
      toast.error("Erro ao carregar versões")
    } finally {
      setLoading(false)
    }
  }

  const createVersion = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem para a versão")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: message.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Versão criada!")
        setMessage("")
        loadVersions()
      } else {
        toast.error(data.error || "Erro ao criar versão")
      }
    } catch (error) {
      toast.error("Erro ao criar versão")
    } finally {
      setSaving(false)
    }
  }

  const restoreVersion = async (versionId: string) => {
    setRestoring(versionId)
    try {
      const response = await fetch("/api/versions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, versionId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Versão restaurada! Recarregue a página para ver as mudanças.")
        loadVersions()
      } else {
        toast.error(data.error || "Erro ao restaurar versão")
      }
    } catch (error) {
      toast.error("Erro ao restaurar versão")
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Histórico de Versões</SheetTitle>
          <SheetDescription>
            Salve e restaure versões do seu projeto
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Create new version */}
          <div className="space-y-2">
            <Input
              placeholder="Descrição da versão..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createVersion()
              }}
            />
            <Button
              onClick={createVersion}
              disabled={saving || !message.trim()}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Versão
            </Button>
          </div>

          {/* Versions list */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma versão salva ainda</p>
                <p className="text-sm mt-1">
                  Salve uma versão para poder restaurar depois
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(versions as Version[]).map((version, index) => (
                  <div
                    key={version.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <GitCommit className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">
                            {version.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              v{version.version_number}
                            </Badge>
                            <span>{formatRelativeTime(version.created_at)}</span>
                          </div>
                          {version.profiles && (
                            <div className="flex items-center gap-1 mt-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={version.profiles.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {version.profiles.full_name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {version.profiles.full_name || "Unknown"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreVersion(version.id)}
                          disabled={restoring === version.id}
                        >
                          {restoring === version.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
