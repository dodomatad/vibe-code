"use client"

import { useCallback } from "react"
import Editor, { OnMount, OnChange } from "@monaco-editor/react"
import { useEditorStore } from "@/stores/editor-store"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"

interface CodeEditorProps {
  content: string
  language: string
  path: string
}

export function CodeEditor({ content, language, path }: CodeEditorProps) {
  const { theme } = useTheme()
  const { activeTabId, updateTabContent } = useEditorStore()

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      padding: { top: 16, bottom: 16 },
    })
  }

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value)
      }
    },
    [activeTabId, updateTabContent]
  )

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      theme={theme === "dark" ? "vs-dark" : "light"}
      onMount={handleEditorDidMount}
      onChange={handleChange}
      loading={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    />
  )
}
