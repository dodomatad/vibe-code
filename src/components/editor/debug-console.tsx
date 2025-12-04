"use client"

import { useState } from "react"
import { useEditorStore, type ConsoleLog, type NetworkRequest } from "@/stores/editor-store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Terminal,
  Globe,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type LogFilter = "all" | "log" | "warn" | "error" | "info"

export function DebugConsole() {
  const {
    consoleLogs,
    networkRequests,
    clearConsoleLogs,
    clearNetworkRequests
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState("console")
  const [logFilter, setLogFilter] = useState<LogFilter>("all")
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  // Filter logs
  const filteredLogs = consoleLogs.filter(
    (log) => logFilter === "all" || log.type === logFilter
  )

  // Count by type
  const errorCount = consoleLogs.filter((l) => l.type === "error").length
  const warnCount = consoleLogs.filter((l) => l.type === "warn").length

  // Toggle log expansion
  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Copy log to clipboard
  const copyLog = (log: ConsoleLog) => {
    navigator.clipboard.writeText(log.message)
    toast.success("Copiado para a área de transferência")
  }

  // Get icon for log type
  const getLogIcon = (type: ConsoleLog["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Terminal className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500"
    if (status >= 300 && status < 400) return "text-yellow-500"
    if (status >= 400) return "text-destructive"
    return "text-muted-foreground"
  }

  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="h-full flex flex-col border-t bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-2 border-b">
          <TabsList className="h-9 bg-transparent">
            <TabsTrigger value="console" className="text-xs gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Console
              {(errorCount > 0 || warnCount > 0) && (
                <div className="flex gap-1">
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                      {errorCount}
                    </Badge>
                  )}
                  {warnCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-500/20 text-yellow-600">
                      {warnCount}
                    </Badge>
                  )}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Network
              {networkRequests.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {networkRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            {activeTab === "console" && (
              <div className="flex items-center gap-1 mr-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as LogFilter)}
                  className="text-xs bg-transparent border-none focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="log">Log</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (activeTab === "console") {
                  clearConsoleLogs()
                } else {
                  clearNetworkRequests()
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <TabsContent value="console" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum log para exibir
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "group flex items-start gap-2 px-2 py-1 rounded text-xs font-mono hover:bg-muted/50",
                      log.type === "error" && "bg-destructive/10",
                      log.type === "warn" && "bg-yellow-500/10"
                    )}
                  >
                    <button
                      onClick={() => toggleLog(log.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                    {getLogIcon(log.type)}
                    <span className="text-muted-foreground flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <pre
                        className={cn(
                          "whitespace-pre-wrap break-all",
                          !expandedLogs.has(log.id) && "line-clamp-2"
                        )}
                      >
                        {log.message}
                      </pre>
                      {log.source && (
                        <span className="text-muted-foreground text-[10px]">
                          {log.source}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => copyLog(log)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="network" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {networkRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma requisição para exibir
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Método</th>
                      <th className="pb-2 font-medium">URL</th>
                      <th className="pb-2 font-medium text-right">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-muted/50 hover:bg-muted/30"
                      >
                        <td className={cn("py-1.5", getStatusColor(req.status))}>
                          {req.status}
                        </td>
                        <td className="py-1.5">
                          <Badge variant="outline" className="text-[10px] px-1">
                            {req.method}
                          </Badge>
                        </td>
                        <td className="py-1.5 font-mono truncate max-w-[300px]">
                          {req.url}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground">
                          {req.duration}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
