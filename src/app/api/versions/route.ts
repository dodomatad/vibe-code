import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Create a new version (snapshot)
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { projectId, message } = await request.json()

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "Project ID and message are required" },
        { status: 400 }
      )
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Check authorization
    if (project.owner_id !== user.id) {
      // Check if user is a collaborator with edit access
      const { data: collaborator } = await supabase
        .from("project_collaborators")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (!collaborator || collaborator.role === "viewer") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      }
    }

    // Get all project files
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)

    if (filesError) {
      return NextResponse.json(
        { error: "Failed to get project files" },
        { status: 500 }
      )
    }

    // Get the latest version number
    const { data: latestVersion } = await supabase
      .from("project_versions")
      .select("version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()

    const newVersionNumber = (latestVersion?.version_number || 0) + 1

    // Create snapshot of files
    const snapshot = files?.map((file) => ({
      path: file.path,
      content: file.content,
      is_directory: file.is_directory,
    }))

    // Create version
    const { data: version, error: versionError } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        version_number: newVersionNumber,
        message,
        snapshot,
        created_by: user.id,
      })
      .select()
      .single()

    if (versionError) {
      return NextResponse.json(
        { error: "Failed to create version" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      version: version,
      message: "Version created successfully",
    })
  } catch (error: any) {
    console.error("Create version error:", error)
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    )
  }
}

// Get versions list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get versions with creator info
    const { data: versions, error } = await supabase
      .from("project_versions")
      .select(`
        *,
        profiles:created_by (
          full_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to get versions" },
        { status: 500 }
      )
    }

    return NextResponse.json({ versions })
  } catch (error: any) {
    console.error("Get versions error:", error)
    return NextResponse.json(
      { error: "Failed to get versions" },
      { status: 500 }
    )
  }
}

// Restore a version
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { projectId, versionId } = await request.json()

    if (!projectId || !versionId) {
      return NextResponse.json(
        { error: "Project ID and version ID are required" },
        { status: 400 }
      )
    }

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from("project_versions")
      .select("*")
      .eq("id", versionId)
      .eq("project_id", projectId)
      .single()

    if (versionError || !version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      )
    }

    // Delete current files
    await supabase
      .from("project_files")
      .delete()
      .eq("project_id", projectId)

    // Restore files from snapshot
    const snapshot = version.snapshot as any[]
    if (snapshot && snapshot.length > 0) {
      const filesToInsert = snapshot.map((file) => ({
        project_id: projectId,
        path: file.path,
        content: file.content,
        is_directory: file.is_directory,
      }))

      const { error: insertError } = await supabase
        .from("project_files")
        .insert(filesToInsert)

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to restore files" },
          { status: 500 }
        )
      }
    }

    // Create a new version to mark the restore
    const { data: latestVersion } = await supabase
      .from("project_versions")
      .select("version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()

    await supabase.from("project_versions").insert({
      project_id: projectId,
      version_number: (latestVersion?.version_number || 0) + 1,
      message: `Restored to version ${version.version_number}`,
      snapshot: version.snapshot,
      created_by: user.id,
    })

    return NextResponse.json({
      message: "Version restored successfully",
      restoredVersion: version.version_number,
    })
  } catch (error: any) {
    console.error("Restore version error:", error)
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    )
  }
}
