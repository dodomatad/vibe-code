import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VERCEL_API_URL = "https://api.vercel.com"

interface DeploymentFile {
  file: string
  data: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get project files
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_directory", false)

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files to deploy" }, { status: 400 })
    }

    // Prepare files for Vercel deployment
    const deploymentFiles: DeploymentFile[] = files.map((file) => ({
      file: file.path.startsWith("/") ? file.path.slice(1) : file.path,
      data: Buffer.from(file.content || "").toString("base64"),
    }))

    // Add package.json if not exists
    const hasPackageJson = files.some((f) => f.path === "/package.json" || f.path === "package.json")
    if (!hasPackageJson) {
      deploymentFiles.push({
        file: "package.json",
        data: Buffer.from(
          JSON.stringify(
            {
              name: project.slug,
              version: "1.0.0",
              private: true,
              scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
              },
              dependencies: {
                next: "14.0.0",
                react: "^18.2.0",
                "react-dom": "^18.2.0",
              },
            },
            null,
            2
          )
        ).toString("base64"),
      })
    }

    // Create deployment on Vercel
    const vercelToken = process.env.VERCEL_TOKEN
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken) {
      return NextResponse.json({ error: "Vercel not configured" }, { status: 500 })
    }

    const deploymentPayload = {
      name: project.slug,
      files: deploymentFiles,
      projectSettings: {
        framework: "nextjs",
      },
      target: "production",
    }

    const vercelUrl = vercelTeamId
      ? `${VERCEL_API_URL}/v13/deployments?teamId=${vercelTeamId}`
      : `${VERCEL_API_URL}/v13/deployments`

    const deployResponse = await fetch(vercelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deploymentPayload),
    })

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json()
      console.error("Vercel deployment error:", errorData)
      return NextResponse.json(
        { error: "Failed to create deployment" },
        { status: 500 }
      )
    }

    const deployment = await deployResponse.json()

    // Save deployment to database
    await supabase.from("deployments").insert({
      project_id: projectId,
      user_id: user.id,
      deployment_id: deployment.id,
      url: deployment.url,
      status: "building",
      provider: "vercel",
    })

    // Update project with deployment URL
    await supabase
      .from("projects")
      .update({
        deployed_url: `https://${deployment.url}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)

    return NextResponse.json({
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,
      status: "building",
    })
  } catch (error) {
    console.error("Deploy API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deploymentId = searchParams.get("deploymentId")

    if (!deploymentId) {
      return NextResponse.json({ error: "Deployment ID required" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken) {
      return NextResponse.json({ error: "Vercel not configured" }, { status: 500 })
    }

    const vercelUrl = vercelTeamId
      ? `${VERCEL_API_URL}/v13/deployments/${deploymentId}?teamId=${vercelTeamId}`
      : `${VERCEL_API_URL}/v13/deployments/${deploymentId}`

    const response = await fetch(vercelUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
    }

    const deployment = await response.json()

    // Update deployment status in database
    await supabase
      .from("deployments")
      .update({
        status: deployment.readyState,
        updated_at: new Date().toISOString(),
      })
      .eq("deployment_id", deploymentId)

    return NextResponse.json({
      status: deployment.readyState,
      url: deployment.url ? `https://${deployment.url}` : null,
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      ready: deployment.ready,
    })
  } catch (error) {
    console.error("Deploy status API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
