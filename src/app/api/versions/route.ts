import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    // Verify user has access to the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user owns the project or is a collaborator
    if (project.user_id !== user.id) {
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (!collaborator) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Get versions
    const { data: versions, error } = await supabase
      .from("project_versions")
      .select(`
        id,
        name,
        description,
        created_at,
        created_by,
        profiles:created_by (
          full_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching versions:", error)
      return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
    }

    return NextResponse.json({ versions })
  } catch (error) {
    console.error("Versions GET API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, name, description } = await request.json()

    if (!projectId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access to the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user owns the project or is an editor
    if (project.user_id !== user.id) {
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (!collaborator || collaborator.role === "viewer") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Get current project files
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)

    // Create snapshot of files
    const snapshot = files?.map((file) => ({
      path: file.path,
      content: file.content,
      is_directory: file.is_directory,
    }))

    // Create version
    const { data: version, error } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        name,
        description,
        snapshot,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating version:", error)
      return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error("Versions POST API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { versionId } = await request.json()

    if (!versionId) {
      return NextResponse.json({ error: "Version ID required" }, { status: 400 })
    }

    // Get version with project info
    const { data: version } = await supabase
      .from("project_versions")
      .select(`
        *,
        projects:project_id (
          id,
          user_id
        )
      `)
      .eq("id", versionId)
      .single()

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    const project = version.projects as any

    // Check if user owns the project or is an editor
    if (project.user_id !== user.id) {
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .single()

      if (!collaborator || collaborator.role === "viewer") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Create a backup version before restoring
    const { data: currentFiles } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", project.id)

    const currentSnapshot = currentFiles?.map((file) => ({
      path: file.path,
      content: file.content,
      is_directory: file.is_directory,
    }))

    await supabase.from("project_versions").insert({
      project_id: project.id,
      name: `Backup before restore to "${version.name}"`,
      description: "Auto-created backup before version restore",
      snapshot: currentSnapshot,
      created_by: user.id,
    })

    // Delete current files
    await supabase
      .from("project_files")
      .delete()
      .eq("project_id", project.id)

    // Restore files from version snapshot
    const snapshot = version.snapshot as Array<{
      path: string
      content: string | null
      is_directory: boolean
    }>

    if (snapshot && Array.isArray(snapshot)) {
      // Insert directories first
      const directories = snapshot.filter((item) => item.is_directory)
      for (const dir of directories) {
        await supabase.from("project_files").insert({
          project_id: project.id,
          path: dir.path,
          is_directory: true,
        })
      }

      // Insert files
      const files = snapshot.filter((item) => !item.is_directory)
      for (const file of files) {
        await supabase.from("project_files").insert({
          project_id: project.id,
          path: file.path,
          content: file.content,
          is_directory: false,
        })
      }
    }

    // Update project updated_at
    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", project.id)

    return NextResponse.json({
      success: true,
      message: `Restored to version "${version.name}"`,
    })
  } catch (error) {
    console.error("Versions PUT API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
