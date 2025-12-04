import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

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

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    // Get project and files
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get project files
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)

    if (filesError) {
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from("deployments")
      .insert({
        project_id: projectId,
        status: "pending",
      })
      .select()
      .single()

    if (deployError) {
      return NextResponse.json(
        { error: "Failed to create deployment" },
        { status: 500 }
      )
    }

    // Prepare files for Vercel
    const vercelFiles = files
      ?.filter((f) => !f.is_directory)
      .map((file) => ({
        file: file.path.startsWith("/") ? file.path.slice(1) : file.path,
        data: file.content,
      }))

    // Create Vercel deployment
    try {
      const vercelResponse = await fetch(
        `https://api.vercel.com/v13/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ""}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: project.slug,
            files: vercelFiles,
            projectSettings: {
              framework: project.framework === "nextjs" ? "nextjs" : "vite",
              buildCommand: project.framework === "nextjs" ? "next build" : "npm run build",
              outputDirectory: project.framework === "nextjs" ? ".next" : "dist",
              installCommand: "npm install",
            },
            target: "production",
          }),
        }
      )

      if (!vercelResponse.ok) {
        const errorData = await vercelResponse.json()
        throw new Error(errorData.error?.message || "Vercel deployment failed")
      }

      const vercelData = await vercelResponse.json()

      // Update deployment record
      await supabase
        .from("deployments")
        .update({
          status: "building",
          vercel_deployment_id: vercelData.id,
          url: vercelData.url ? `https://${vercelData.url}` : null,
        })
        .eq("id", deployment.id)

      // Update project with deployment URL
      if (vercelData.url) {
        await supabase
          .from("projects")
          .update({
            deployed_url: `https://${vercelData.url}`,
            vercel_project_id: vercelData.projectId,
          })
          .eq("id", projectId)
      }

      return NextResponse.json({
        deploymentId: deployment.id,
        vercelId: vercelData.id,
        url: vercelData.url ? `https://${vercelData.url}` : null,
        status: "building",
      })
    } catch (vercelError: any) {
      // Update deployment as failed
      await supabase
        .from("deployments")
        .update({
          status: "error",
          error_message: vercelError.message,
        })
        .eq("id", deployment.id)

      return NextResponse.json(
        { error: vercelError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Deploy error:", error)
    return NextResponse.json(
      { error: "Deployment failed" },
      { status: 500 }
    )
  }
}

// Check deployment status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deploymentId = searchParams.get("deploymentId")

    if (!deploymentId) {
      return NextResponse.json(
        { error: "Deployment ID is required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: deployment, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("id", deploymentId)
      .single()

    if (error || !deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      )
    }

    // If building, check Vercel status
    if (deployment.status === "building" && deployment.vercel_deployment_id) {
      try {
        const vercelResponse = await fetch(
          `https://api.vercel.com/v13/deployments/${deployment.vercel_deployment_id}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
            },
          }
        )

        if (vercelResponse.ok) {
          const vercelData = await vercelResponse.json()

          let newStatus = deployment.status
          if (vercelData.readyState === "READY") {
            newStatus = "ready"
          } else if (vercelData.readyState === "ERROR") {
            newStatus = "error"
          }

          if (newStatus !== deployment.status) {
            await supabase
              .from("deployments")
              .update({
                status: newStatus,
                url: vercelData.url ? `https://${vercelData.url}` : deployment.url,
                completed_at: newStatus === "ready" ? new Date().toISOString() : null,
              })
              .eq("id", deploymentId)

            deployment.status = newStatus
          }
        }
      } catch (error) {
        console.error("Failed to check Vercel status:", error)
      }
    }

    return NextResponse.json(deployment)
  } catch (error) {
    console.error("Get deployment error:", error)
    return NextResponse.json(
      { error: "Failed to get deployment status" },
      { status: 500 }
    )
  }
}
