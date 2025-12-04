"use client"

import { useEffect, useCallback, useRef } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { CollaboratorPresence } from "@/types"

export function useRealtime(projectId: string) {
  const { supabase } = useSupabase()
  const { updateFile, addMessage } = useEditorStore()
  const { setCollaborators, updateCollaboratorPresence } = useProjectStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Subscribe to file changes
  useEffect(() => {
    if (!projectId) return

    // Subscribe to project_files changes
    const filesChannel = supabase
      .channel(`project-files-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_files",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const file = payload.new as any
            updateFile(file.path, file.content)
          }
        }
      )
      .subscribe()

    // Subscribe to chat messages
    const messagesChannel = supabase
      .channel(`chat-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const message = payload.new as any
          addMessage({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.created_at),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(filesChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [projectId, supabase, updateFile, addMessage])

  // Presence for collaboration
  useEffect(() => {
    if (!projectId) return

    const presenceChannel = supabase.channel(`presence-${projectId}`, {
      config: {
        presence: {
          key: supabase.auth.getUser().then((u) => u.data.user?.id || "anon"),
        },
      },
    })

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const collaborators: CollaboratorPresence[] = []

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          presences.forEach((presence) => {
            if (presence.user_id) {
              collaborators.push({
                id: key,
                userId: presence.user_id,
                userName: presence.user_name || "Anonymous",
                avatarUrl: presence.avatar_url,
                cursor: presence.cursor,
                lastSeen: new Date(),
              })
            }
          })
        })

        setCollaborators(collaborators)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences)
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              user_name: user.user_metadata?.full_name || user.email,
              avatar_url: user.user_metadata?.avatar_url,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    channelRef.current = presenceChannel

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [projectId, supabase, setCollaborators])

  // Update cursor position
  const updateCursor = useCallback(
    async (file: string, line: number, column: number) => {
      if (!channelRef.current) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await channelRef.current.track({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        avatar_url: user.user_metadata?.avatar_url,
        cursor: { file, line, column },
        online_at: new Date().toISOString(),
      })
    },
    [supabase]
  )

  return { updateCursor }
}

// Hook for subscribing to deployment status
export function useDeploymentStatus(deploymentId: string | null) {
  const { supabase } = useSupabase()
  const { setDeployment } = useProjectStore()

  useEffect(() => {
    if (!deploymentId) return

    const channel = supabase
      .channel(`deployment-${deploymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deployments",
          filter: `id=eq.${deploymentId}`,
        },
        (payload) => {
          const deployment = payload.new as any
          setDeployment({
            id: deployment.id,
            status: deployment.status,
            url: deployment.url,
            error: deployment.error_message,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deploymentId, supabase, setDeployment])
}
