import { create } from "zustand"
import type { FileNode, EditorTab, ChatMessageUI } from "@/types"

export interface ConsoleLog {
  id: string
  type: "log" | "warn" | "error" | "info"
  message: string
  timestamp: Date
  source?: string
}

export interface NetworkRequest {
  id: string
  url: string
  method: string
  status: number
  duration: number
  timestamp: Date
}

interface EditorState {
  // File tree
  files: FileNode[]
  setFiles: (files: FileNode[]) => void
  updateFile: (id: string, content: string) => void
  updateFileByPath: (path: string, content: string) => void
  addFile: (file: FileNode) => void
  deleteFile: (id: string) => void
  renameFile: (id: string, newName: string, newPath: string) => void

  // Tabs
  openTabs: EditorTab[]
  activeTabId: string | null
  openTab: (tab: EditorTab) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void

  // Chat
  messages: ChatMessageUI[]
  addMessage: (message: ChatMessageUI) => void
  updateMessage: (id: string, updates: Partial<ChatMessageUI>) => void
  clearMessages: () => void

  // Console & Debugging
  consoleLogs: ConsoleLog[]
  networkRequests: NetworkRequest[]
  addConsoleLog: (log: ConsoleLog) => void
  addNetworkRequest: (request: NetworkRequest) => void
  clearConsoleLogs: () => void
  clearNetworkRequests: () => void

  // UI State
  sidebarOpen: boolean
  chatOpen: boolean
  previewOpen: boolean
  consoleOpen: boolean
  toggleSidebar: () => void
  toggleChat: () => void
  togglePreview: () => void
  toggleConsole: () => void

  // Selection
  selectedFilePath: string | null
  setSelectedFilePath: (path: string | null) => void

  // Preview
  previewUrl: string | null
  setPreviewUrl: (url: string | null) => void
  previewError: string | null
  setPreviewError: (error: string | null) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // File tree
  files: [],
  setFiles: (files) => set({ files }),

  updateFile: (id, content) =>
    set((state) => ({
      files: updateFileInTreeById(state.files, id, content),
      openTabs: state.openTabs.map((t) => {
        const file = findFileById(state.files, id)
        if (file && t.path === file.path) {
          return { ...t, content, isDirty: true }
        }
        return t
      })
    })),

  updateFileByPath: (path, content) =>
    set((state) => ({
      files: updateFileInTreeByPath(state.files, path, content),
      openTabs: state.openTabs.map((t) =>
        t.path === path ? { ...t, content, isDirty: true } : t
      )
    })),

  addFile: (file) =>
    set((state) => {
      // Find parent folder and add file
      const parentPath = file.path.split("/").slice(0, -1).join("/") || "/"
      const newFiles = addFileToTree(state.files, parentPath, file)
      return { files: newFiles }
    }),

  deleteFile: (id) =>
    set((state) => ({
      files: deleteFileFromTree(state.files, id),
      openTabs: state.openTabs.filter((t) => {
        const file = findFileById(state.files, id)
        return !file || t.path !== file.path
      })
    })),

  renameFile: (id, newName, newPath) =>
    set((state) => ({
      files: renameFileInTree(state.files, id, newName, newPath),
      openTabs: state.openTabs.map((t) => {
        const file = findFileById(state.files, id)
        if (file && t.path === file.path) {
          return { ...t, name: newName, path: newPath }
        }
        return t
      })
    })),

  // Tabs
  openTabs: [],
  activeTabId: null,
  openTab: (tab) =>
    set((state) => {
      const existing = state.openTabs.find((t) => t.path === tab.path)
      if (existing) {
        return { activeTabId: existing.id }
      }
      return { openTabs: [...state.openTabs, tab], activeTabId: tab.id }
    }),
  closeTab: (id) =>
    set((state) => {
      const tabs = state.openTabs.filter((t) => t.id !== id)
      const activeId = state.activeTabId === id
        ? tabs[tabs.length - 1]?.id ?? null
        : state.activeTabId
      return { openTabs: tabs, activeTabId: activeId }
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTabContent: (id, content) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      )
    })),

  // Chat
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m))
    })),
  clearMessages: () => set({ messages: [] }),

  // Console & Debugging
  consoleLogs: [],
  networkRequests: [],
  addConsoleLog: (log) =>
    set((state) => ({
      consoleLogs: [...state.consoleLogs.slice(-99), log] // Keep last 100 logs
    })),
  addNetworkRequest: (request) =>
    set((state) => ({
      networkRequests: [...state.networkRequests.slice(-49), request] // Keep last 50 requests
    })),
  clearConsoleLogs: () => set({ consoleLogs: [] }),
  clearNetworkRequests: () => set({ networkRequests: [] }),

  // UI State
  sidebarOpen: true,
  chatOpen: true,
  previewOpen: true,
  consoleOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
  toggleConsole: () => set((state) => ({ consoleOpen: !state.consoleOpen })),

  // Selection
  selectedFilePath: null,
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),

  // Preview
  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),
  previewError: null,
  setPreviewError: (error) => set({ previewError: error })
}))

// Helper functions
function updateFileInTreeById(files: FileNode[], id: string, content: string): FileNode[] {
  return files.map((file) => {
    if (file.id === id) {
      return { ...file, content }
    }
    if (file.children) {
      return { ...file, children: updateFileInTreeById(file.children, id, content) }
    }
    return file
  })
}

function updateFileInTreeByPath(files: FileNode[], path: string, content: string): FileNode[] {
  return files.map((file) => {
    if (file.path === path) {
      return { ...file, content }
    }
    if (file.children) {
      return { ...file, children: updateFileInTreeByPath(file.children, path, content) }
    }
    return file
  })
}

function findFileById(files: FileNode[], id: string): FileNode | null {
  for (const file of files) {
    if (file.id === id) return file
    if (file.children) {
      const found = findFileById(file.children, id)
      if (found) return found
    }
  }
  return null
}

function addFileToTree(files: FileNode[], parentPath: string, newFile: FileNode): FileNode[] {
  // If parent is root, add directly
  if (parentPath === "/" || parentPath === "") {
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

function deleteFileFromTree(files: FileNode[], id: string): FileNode[] {
  return files
    .filter((file) => file.id !== id)
    .map((file) => {
      if (file.children) {
        return { ...file, children: deleteFileFromTree(file.children, id) }
      }
      return file
    })
}

function renameFileInTree(
  files: FileNode[],
  id: string,
  newName: string,
  newPath: string
): FileNode[] {
  return files.map((file) => {
    if (file.id === id) {
      return { ...file, name: newName, path: newPath }
    }
    if (file.children) {
      return { ...file, children: renameFileInTree(file.children, id, newName, newPath) }
    }
    return file
  })
}
