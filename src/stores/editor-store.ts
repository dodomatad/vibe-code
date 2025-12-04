import { create } from "zustand"
import type { FileNode, EditorTab, ChatMessageUI } from "@/types"

interface EditorState {
  // File tree
  files: FileNode[]
  setFiles: (files: FileNode[]) => void
  addFile: (file: FileNode) => void
  updateFile: (path: string, content: string) => void
  deleteFile: (path: string) => void

  // Tabs
  openTabs: EditorTab[]
  activeTabId: string | null
  openTab: (tab: EditorTab) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  markTabDirty: (id: string, dirty: boolean) => void

  // Chat
  messages: ChatMessageUI[]
  addMessage: (message: ChatMessageUI) => void
  updateMessage: (id: string, updates: Partial<ChatMessageUI>) => void
  clearMessages: () => void

  // UI State
  sidebarOpen: boolean
  chatOpen: boolean
  previewOpen: boolean
  toggleSidebar: () => void
  toggleChat: () => void
  togglePreview: () => void

  // Selection
  selectedFilePath: string | null
  setSelectedFilePath: (path: string | null) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // File tree
  files: [],
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  updateFile: (path, content) =>
    set((state) => ({
      files: updateFileInTree(state.files, path, content),
    })),
  deleteFile: (path) =>
    set((state) => ({
      files: deleteFileFromTree(state.files, path),
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
      return {
        openTabs: [...state.openTabs, tab],
        activeTabId: tab.id,
      }
    }),
  closeTab: (id) =>
    set((state) => {
      const tabs = state.openTabs.filter((t) => t.id !== id)
      const activeId =
        state.activeTabId === id
          ? tabs[tabs.length - 1]?.id ?? null
          : state.activeTabId
      return { openTabs: tabs, activeTabId: activeId }
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTabContent: (id, content) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    })),
  markTabDirty: (id, dirty) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === id ? { ...t, isDirty: dirty } : t
      ),
    })),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  // UI State
  sidebarOpen: true,
  chatOpen: true,
  previewOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),

  // Selection
  selectedFilePath: null,
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),
}))

// Helper functions
function updateFileInTree(
  files: FileNode[],
  path: string,
  content: string
): FileNode[] {
  return files.map((file) => {
    if (file.path === path) {
      return { ...file, content }
    }
    if (file.children) {
      return { ...file, children: updateFileInTree(file.children, path, content) }
    }
    return file
  })
}

function deleteFileFromTree(files: FileNode[], path: string): FileNode[] {
  return files
    .filter((file) => file.path !== path)
    .map((file) => {
      if (file.children) {
        return { ...file, children: deleteFileFromTree(file.children, path) }
      }
      return file
    })
}
