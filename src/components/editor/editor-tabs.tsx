"use client"

import { useEditorStore } from "@/stores/editor-store"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { X, FileCode } from "lucide-react"
import { cn, getFileExtension } from "@/lib/utils"

const fileIcons: Record<string, string> = {
  tsx: "text-blue-400",
  ts: "text-blue-500",
  jsx: "text-yellow-400",
  js: "text-yellow-500",
  css: "text-pink-400",
  html: "text-orange-400",
  json: "text-green-400",
}

export function EditorTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useEditorStore()

  if (openTabs.length === 0) return null

  return (
    <div className="border-b bg-muted/30">
      <ScrollArea className="w-full">
        <div className="flex">
          {openTabs.map((tab) => {
            const ext = getFileExtension(tab.name)
            const iconColor = fileIcons[ext] || "text-muted-foreground"
            const isActive = tab.id === activeTabId

            return (
              <div
                key={tab.id}
                className={cn("group flex items-center gap-2 px-4 py-2 border-r cursor-pointer transition-colors", isActive ? "bg-background border-b-2 border-b-primary" : "hover:bg-muted/50")}
                onClick={() => setActiveTab(tab.id)}
              >
                <FileCode className={cn("h-4 w-4", iconColor)} />
                <span className={cn("text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>{tab.name}</span>
                {tab.isDirty && <span className="w-2 h-2 rounded-full bg-primary" />}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
