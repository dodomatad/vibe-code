import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GITHUB_API_URL = "https://api.github.com"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, action, repoName, commitMessage } = await request.json()

    if (!projectId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // Get user's GitHub token from their profile or session
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_token")
      .eq("id", user.id)
      .single()

    const githubToken = profile?.github_token

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub not connected. Please connect your GitHub account." },
        { status: 400 }
      )
    }

    // Get GitHub user info
    const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 401 })
    }

    const githubUser = await userResponse.json()

    switch (action) {
      case "create":
        return await createRepository(supabase, project, githubToken, githubUser, repoName)
      case "push":
        return await pushToRepository(supabase, project, githubToken, githubUser, commitMessage)
      case "pull":
        return await pullFromRepository(supabase, project, githubToken)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("GitHub API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function createRepository(
  supabase: any,
  project: any,
  githubToken: string,
  githubUser: any,
  repoName?: string
) {
  const name = repoName || project.slug

  // Create repository
  const createResponse = await fetch(`${GITHUB_API_URL}/user/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: project.description || `Created with Vibe Code`,
      private: !project.is_public,
      auto_init: false,
    }),
  })

  if (!createResponse.ok) {
    const error = await createResponse.json()
    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        { error: "Repository already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 })
  }

  const repo = await createResponse.json()

  // Update project with GitHub repo URL
  await supabase
    .from("projects")
    .update({
      github_repo: repo.html_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)

  // Get project files
  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project.id)
    .eq("is_directory", false)

  if (files && files.length > 0) {
    // Push initial commit
    await pushFiles(githubToken, githubUser.login, name, files, "Initial commit from Vibe Code")
  }

  return NextResponse.json({
    success: true,
    repoUrl: repo.html_url,
    message: "Repository created successfully",
  })
}

async function pushToRepository(
  supabase: any,
  project: any,
  githubToken: string,
  githubUser: any,
  commitMessage?: string
) {
  if (!project.github_repo) {
    return NextResponse.json({ error: "No GitHub repository linked" }, { status: 400 })
  }

  // Extract owner and repo from URL
  const repoMatch = project.github_repo.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!repoMatch) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 })
  }

  const [, owner, repo] = repoMatch

  // Get project files
  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project.id)
    .eq("is_directory", false)

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files to push" }, { status: 400 })
  }

  await pushFiles(githubToken, owner, repo.replace(".git", ""), files, commitMessage || "Update from Vibe Code")

  return NextResponse.json({
    success: true,
    message: "Changes pushed successfully",
  })
}

async function pushFiles(
  githubToken: string,
  owner: string,
  repo: string,
  files: any[],
  commitMessage: string
) {
  // Get default branch
  const repoResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  })

  const repoData = await repoResponse.json()
  const defaultBranch = repoData.default_branch || "main"

  // Get current commit SHA
  let baseSha = null
  try {
    const refResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )
    if (refResponse.ok) {
      const refData = await refResponse.json()
      baseSha = refData.object.sha
    }
  } catch {
    // Repository might be empty
  }

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content || "",
            encoding: "utf-8",
          }),
        }
      )
      const blobData = await blobResponse.json()
      return {
        path: file.path.startsWith("/") ? file.path.slice(1) : file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      }
    })
  )

  // Create tree
  const treeResponse = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseSha,
        tree: blobs,
      }),
    }
  )
  const treeData = await treeResponse.json()

  // Create commit
  const commitPayload: any = {
    message: commitMessage,
    tree: treeData.sha,
  }
  if (baseSha) {
    commitPayload.parents = [baseSha]
  }

  const commitResponse = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commitPayload),
    }
  )
  const commitData = await commitResponse.json()

  // Update reference
  const refUrl = baseSha
    ? `${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`
    : `${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`

  const refPayload = baseSha
    ? { sha: commitData.sha }
    : { ref: `refs/heads/${defaultBranch}`, sha: commitData.sha }

  await fetch(refUrl, {
    method: baseSha ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(refPayload),
  })
}

async function pullFromRepository(supabase: any, project: any, githubToken: string) {
  if (!project.github_repo) {
    return NextResponse.json({ error: "No GitHub repository linked" }, { status: 400 })
  }

  // Extract owner and repo from URL
  const repoMatch = project.github_repo.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!repoMatch) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 })
  }

  const [, owner, repo] = repoMatch
  const repoName = repo.replace(".git", "")

  // Get repository contents
  const contentsResponse = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  )

  if (!contentsResponse.ok) {
    return NextResponse.json({ error: "Failed to fetch repository contents" }, { status: 500 })
  }

  const contentsData = await contentsResponse.json()

  // Get file contents
  const files = await Promise.all(
    contentsData.tree
      .filter((item: any) => item.type === "blob")
      .map(async (item: any) => {
        const blobResponse = await fetch(item.url, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
        const blobData = await blobResponse.json()
        const content = Buffer.from(blobData.content, "base64").toString("utf-8")
        return {
          path: `/${item.path}`,
          content,
          is_directory: false,
        }
      })
  )

  // Delete existing files and insert new ones
  await supabase
    .from("project_files")
    .delete()
    .eq("project_id", project.id)

  // Insert directories first
  const directories = new Set<string>()
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean)
    let currentPath = ""
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += `/${parts[i]}`
      directories.add(currentPath)
    }
  }

  for (const dir of directories) {
    await supabase.from("project_files").insert({
      project_id: project.id,
      path: dir,
      is_directory: true,
    })
  }

  // Insert files
  for (const file of files) {
    await supabase.from("project_files").insert({
      project_id: project.id,
      path: file.path,
      content: file.content,
      is_directory: false,
    })
  }

  return NextResponse.json({
    success: true,
    message: "Repository pulled successfully",
    filesCount: files.length,
  })
}
