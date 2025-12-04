// AI Tools Configuration - Similar to Lovable's approach
// These tools allow the AI to interact with the codebase

export interface AITool {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
      items?: { type: string }
    }>
    required: string[]
  }
}

export const AI_TOOLS: AITool[] = [
  // File Operations
  {
    name: "vibe_view",
    description: "Read the contents of a file. Use this to understand existing code before making changes.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path relative to project root (e.g., 'src/components/Button.tsx')"
        },
        start_line: {
          type: "number",
          description: "Optional: Start line number for partial read"
        },
        end_line: {
          type: "number",
          description: "Optional: End line number for partial read"
        }
      },
      required: ["path"]
    }
  },
  {
    name: "vibe_write",
    description: "Create a new file or completely overwrite an existing file. For small edits, prefer vibe_edit instead.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path relative to project root"
        },
        content: {
          type: "string",
          description: "The complete file content"
        }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "vibe_edit",
    description: "Edit specific lines in a file using search and replace. More efficient than vibe_write for small changes.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path relative to project root"
        },
        old_content: {
          type: "string",
          description: "The exact content to find and replace (must match exactly)"
        },
        new_content: {
          type: "string",
          description: "The new content to replace with"
        }
      },
      required: ["path", "old_content", "new_content"]
    }
  },
  {
    name: "vibe_delete",
    description: "Delete a file from the project.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path to delete"
        }
      },
      required: ["path"]
    }
  },
  {
    name: "vibe_rename",
    description: "Rename or move a file.",
    parameters: {
      type: "object",
      properties: {
        old_path: {
          type: "string",
          description: "The current file path"
        },
        new_path: {
          type: "string",
          description: "The new file path"
        }
      },
      required: ["old_path", "new_path"]
    }
  },
  {
    name: "vibe_create_folder",
    description: "Create a new folder/directory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The folder path to create"
        }
      },
      required: ["path"]
    }
  },

  // Code Search
  {
    name: "vibe_search",
    description: "Search for code patterns across the project using regex.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Regex pattern to search for"
        },
        file_pattern: {
          type: "string",
          description: "Optional: Glob pattern to filter files (e.g., '*.tsx')"
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return (default: 20)"
        }
      },
      required: ["pattern"]
    }
  },

  // Dependencies
  {
    name: "vibe_add_dependency",
    description: "Install an npm package.",
    parameters: {
      type: "object",
      properties: {
        package_name: {
          type: "string",
          description: "The npm package name (e.g., 'lodash' or 'lodash@4.17.21')"
        },
        dev: {
          type: "boolean",
          description: "Install as dev dependency"
        }
      },
      required: ["package_name"]
    }
  },
  {
    name: "vibe_remove_dependency",
    description: "Uninstall an npm package.",
    parameters: {
      type: "object",
      properties: {
        package_name: {
          type: "string",
          description: "The npm package name to remove"
        }
      },
      required: ["package_name"]
    }
  },

  // External Resources
  {
    name: "vibe_fetch_url",
    description: "Fetch content from a URL. Useful for downloading assets or API documentation.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch"
        },
        format: {
          type: "string",
          description: "Output format",
          enum: ["markdown", "html", "json", "text"]
        }
      },
      required: ["url"]
    }
  },
  {
    name: "vibe_web_search",
    description: "Search the web for information. Use for finding documentation, examples, or solutions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        },
        num_results: {
          type: "number",
          description: "Number of results (default: 5)"
        }
      },
      required: ["query"]
    }
  },

  // Debugging
  {
    name: "vibe_read_console",
    description: "Read recent console logs from the preview environment.",
    parameters: {
      type: "object",
      properties: {
        log_type: {
          type: "string",
          description: "Filter by log type",
          enum: ["all", "error", "warn", "info", "log"]
        },
        limit: {
          type: "number",
          description: "Number of logs to retrieve (default: 50)"
        }
      },
      required: []
    }
  },
  {
    name: "vibe_read_network",
    description: "Read recent network requests from the preview environment.",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Filter by URL pattern"
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["all", "success", "error"]
        }
      },
      required: []
    }
  },

  // Supabase
  {
    name: "vibe_supabase_query",
    description: "Execute a Supabase query. Use for database operations.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "The operation type",
          enum: ["select", "insert", "update", "delete", "rpc"]
        },
        table: {
          type: "string",
          description: "The table name"
        },
        data: {
          type: "object",
          description: "Data for insert/update operations"
        },
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: { type: "object" }
        }
      },
      required: ["operation", "table"]
    }
  },
  {
    name: "vibe_supabase_schema",
    description: "Get or modify the database schema.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "The action to perform",
          enum: ["get_tables", "get_table_schema", "create_table", "add_column", "create_rls_policy"]
        },
        table: {
          type: "string",
          description: "The table name (if applicable)"
        },
        definition: {
          type: "object",
          description: "Schema definition for create operations"
        }
      },
      required: ["action"]
    }
  },

  // Image Generation
  {
    name: "vibe_generate_image",
    description: "Generate an image from a text prompt.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the image to generate"
        },
        style: {
          type: "string",
          description: "Image style",
          enum: ["realistic", "illustration", "3d", "icon", "logo"]
        },
        size: {
          type: "string",
          description: "Image size",
          enum: ["256x256", "512x512", "1024x1024"]
        }
      },
      required: ["prompt"]
    }
  }
]

// Convert tools to OpenAI function format
export function getOpenAITools() {
  return AI_TOOLS.map(tool => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}

// Tool execution result type
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

// Parse tool calls from AI response
export function parseToolCalls(response: string): Array<{
  tool: string
  args: Record<string, any>
}> {
  const toolCalls: Array<{ tool: string; args: Record<string, any> }> = []

  // Match JSON tool calls in the response
  const toolCallRegex = /<tool_call>\s*({[\s\S]*?})\s*<\/tool_call>/g
  let match

  while ((match = toolCallRegex.exec(response)) !== null) {
    try {
      const call = JSON.parse(match[1])
      if (call.tool && call.args) {
        toolCalls.push(call)
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return toolCalls
}

// Format tool results for AI context
export function formatToolResults(results: Array<{ tool: string; result: ToolResult }>): string {
  return results.map(({ tool, result }) => {
    if (result.success) {
      return `<tool_result tool="${tool}" status="success">\n${JSON.stringify(result.data, null, 2)}\n</tool_result>`
    } else {
      return `<tool_result tool="${tool}" status="error">\n${result.error}\n</tool_result>`
    }
  }).join('\n\n')
}
