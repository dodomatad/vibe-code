export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          github_username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          owner_id: string
          is_public: boolean
          framework: string
          created_at: string
          updated_at: string
          deployed_url: string | null
          github_repo: string | null
          vercel_project_id: string | null
          supabase_project_id: string | null
          thumbnail_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          owner_id: string
          is_public?: boolean
          framework?: string
          created_at?: string
          updated_at?: string
          deployed_url?: string | null
          github_repo?: string | null
          vercel_project_id?: string | null
          supabase_project_id?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          owner_id?: string
          is_public?: boolean
          framework?: string
          created_at?: string
          updated_at?: string
          deployed_url?: string | null
          github_repo?: string | null
          vercel_project_id?: string | null
          supabase_project_id?: string | null
          thumbnail_url?: string | null
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          path: string
          content: string
          is_directory: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          path: string
          content?: string
          is_directory?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          path?: string
          content?: string
          is_directory?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_versions: {
        Row: {
          id: string
          project_id: string
          version_number: number
          message: string
          snapshot: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          version_number: number
          message: string
          snapshot: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          version_number?: number
          message?: string
          snapshot?: Json
          created_by?: string
          created_at?: string
        }
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: "owner" | "editor" | "viewer"
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: "owner" | "editor" | "viewer"
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: "owner" | "editor" | "viewer"
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: "user" | "assistant"
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: "user" | "assistant"
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: "user" | "assistant"
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      deployments: {
        Row: {
          id: string
          project_id: string
          status: "pending" | "building" | "ready" | "error"
          url: string | null
          vercel_deployment_id: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          status?: "pending" | "building" | "ready" | "error"
          url?: string | null
          vercel_deployment_id?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          status?: "pending" | "building" | "ready" | "error"
          url?: string | null
          vercel_deployment_id?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Profile = Tables<"profiles">
export type Project = Tables<"projects">
export type ProjectFile = Tables<"project_files">
export type ProjectVersion = Tables<"project_versions">
export type ProjectCollaborator = Tables<"project_collaborators">
export type ChatMessage = Tables<"chat_messages">
export type Deployment = Tables<"deployments">
