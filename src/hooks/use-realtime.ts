"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/components/providers/supabase-provider"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Collaborator presence type
export interface CollaboratorPresence {
  id: string
  odId: string
  userName: string
  avatarUrl?: string
  color: string
  cursor?: {
    file: string
    line: number
    column: number
  }
  selection?: {
    file: string
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
  lastSeen: Date
}

// File change event type
export interface FileChangeEvent {
  type: "insert" | "update" | "delete"
  fileId: string
  path: string
  content?: string
  userId: string
  timestamp: Date
}

// Chat message event type
export interface ChatMessageEvent {
  id: string
  projectId: string
  userId: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

// Generate a random color for collaborator
function generateCollaboratorColor(): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1"
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Hook for real-time file synchronization
export function useRealtimeFiles(projectId: string) {
  const supabase = createClient()
  const [fileChanges, setFileChanges] = useState<FileChangeEvent[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!projectId) return

    // Subscribe to file changes
    const channel = supabase
      .channel(`project-files:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_files",
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const event: FileChangeEvent = {
            type: payload.eventType as "insert" | "update" | "delete",
            fileId: payload.new?.id || payload.old?.id,
            path: payload.new?.path || payload.old?.path,
            content: payload.new?.content,
            userId: payload.new?.updated_by || "",
            timestamp: new Date()
          }
          setFileChanges((prev) => [...prev.slice(-49), event])
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, supabase])

  // Clear file changes
  const clearFileChanges = useCallback(() => {
    setFileChanges([])
  }, [])

  return { fileChanges, clearFileChanges }
}

// Hook for real-time chat messages
export function useRealtimeChat(projectId: string) {
  const supabase = createClient()
  const [newMessages, setNewMessages] = useState<ChatMessageEvent[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!projectId) return

    // Subscribe to chat messages
    const channel = supabase
      .channel(`project-chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const message: ChatMessageEvent = {
            id: payload.new.id,
            projectId: payload.new.project_id,
            userId: payload.new.user_id,
            role: payload.new.role,
            content: payload.new.content,
            createdAt: new Date(payload.new.created_at)
          }
          setNewMessages((prev) => [...prev.slice(-99), message])
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, supabase])

  // Clear messages
  const clearNewMessages = useCallback(() => {
    setNewMessages([])
  }, [])

  return { newMessages, clearNewMessages }
}

// Hook for collaborator presence
export function useCollaboratorPresence(projectId: string) {
  const supabase = createClient()
  const { user } = useUser()
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const [myColor] = useState(() => generateCollaboratorColor())
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Track own presence
  const updateMyPresence = useCallback(
    (cursor?: CollaboratorPresence["cursor"], selection?: CollaboratorPresence["selection"]) => {
      if (!channelRef.current || !user) return

      channelRef.current.track({
        odId: user.id,
        userName: user.email?.split("@")[0] || "Anonymous",
        avatarUrl: user.user_metadata?.avatar_url,
        color: myColor,
        cursor,
        selection,
        lastSeen: new Date().toISOString()
      })
    },
    [user, myColor]
  )

  useEffect(() => {
    if (!projectId || !user) return

    // Create presence channel
    const channel = supabase.channel(`project-presence:${projectId}`, {
      config: {
        presence: {
          key: user.id
        }
      }
    })

    // Handle presence sync
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const presences: CollaboratorPresence[] = []

        Object.entries(state).forEach(([key, value]) => {
          const presence = (value as any[])[0]
          if (presence && presence.odId !== user.id) {
            presences.push({
              id: key,
              odId: presence.odId,
              userName: presence.userName,
              avatarUrl: presence.avatarUrl,
              color: presence.color,
              cursor: presence.cursor,
              selection: presence.selection,
              lastSeen: new Date(presence.lastSeen)
            })
          }
        })

        setCollaborators(presences)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        const presence = newPresences[0]
        if (presence && presence.odId !== user.id) {
          setCollaborators((prev) => {
            const existing = prev.find((c) => c.id === key)
            if (existing) {
              return prev.map((c) =>
                c.id === key
                  ? {
                      ...c,
                      cursor: presence.cursor,
                      selection: presence.selection,
                      lastSeen: new Date(presence.lastSeen)
                    }
                  : c
              )
            }
            return [
              ...prev,
              {
                id: key,
                odId: presence.odId,
                userName: presence.userName,
                avatarUrl: presence.avatarUrl,
                color: presence.color,
                cursor: presence.cursor,
                selection: presence.selection,
                lastSeen: new Date(presence.lastSeen)
              }
            ]
          })
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setCollaborators((prev) => prev.filter((c) => c.id !== key))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track initial presence
          await channel.track({
            odId: user.id,
            userName: user.email?.split("@")[0] || "Anonymous",
            avatarUrl: user.user_metadata?.avatar_url,
            color: myColor,
            lastSeen: new Date().toISOString()
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, user, supabase, myColor])

  return { collaborators, updateMyPresence, myColor }
}

// Hook for broadcasting cursor/selection changes
export function useCursorBroadcast(projectId: string) {
  const { updateMyPresence } = useCollaboratorPresence(projectId)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const broadcastCursor = useCallback(
    (file: string, line: number, column: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        updateMyPresence({ file, line, column })
      }, 50) // 50ms debounce
    },
    [updateMyPresence]
  )

  const broadcastSelection = useCallback(
    (
      file: string,
      startLine: number,
      startColumn: number,
      endLine: number,
      endColumn: number
    ) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        updateMyPresence(undefined, {
          file,
          startLine,
          startColumn,
          endLine,
          endColumn
        })
      }, 50)
    },
    [updateMyPresence]
  )

  return { broadcastCursor, broadcastSelection }
}

// Combined hook for all real-time features
export function useProjectRealtime(projectId: string) {
  const files = useRealtimeFiles(projectId)
  const chat = useRealtimeChat(projectId)
  const presence = useCollaboratorPresence(projectId)

  return {
    ...files,
    ...chat,
    ...presence
  }
}
