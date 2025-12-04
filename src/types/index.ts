export * from "./database"

export interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
  content?: string
}

export interface ChatMessageUI {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  codeChanges?: CodeChange[]
}

export interface CodeChange {
  path: string
  content: string
  action: "create" | "update" | "delete"
}

export interface EditorTab {
  id: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  framework: string
  files: Record<string, string>
}

export interface CollaboratorPresence {
  id: string
  userId: string
  userName: string
  avatarUrl?: string
  cursor?: {
    file: string
    line: number
    column: number
  }
  lastSeen: Date
}
