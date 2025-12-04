"use client"

import { useCallback, useEffect, useRef } from "react"
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
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      padding: { top: 16, bottom: 16 },
    })

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save handled at layout level
    })

    // Configure TypeScript/JavaScript
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    })

    // Add React types
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare module 'react' {
        export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export function useRef<T>(initialValue: T): { current: T };
        export function useContext<T>(context: React.Context<T>): T;
        export const Fragment: any;
        export default React;
      }`,
      "file:///node_modules/@types/react/index.d.ts"
    )
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
      options={{
        readOnly: false,
        domReadOnly: false,
      }}
    />
  )
}
