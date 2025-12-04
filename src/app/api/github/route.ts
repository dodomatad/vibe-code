import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

// Create or sync GitHub repository
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

    const { projectId, action, repoName } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
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

    // Get user's GitHub access token from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // For demo purposes, we'll use a placeholder flow
    // In production, you'd need to implement proper OAuth token storage
    const githubToken = user.user_metadata?.provider_token

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub not connected. Please reconnect your GitHub account." },
        { status: 400 }
      )
    }

    if (action === "create") {
      // Create new repository
      const createRepoResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName || project.slug,
          description: project.description || `Created with Vibe Code`,
          private: !project.is_public,
          auto_init: false,
        }),
      })

      if (!createRepoResponse.ok) {
        const errorData = await createRepoResponse.json()
        return NextResponse.json(
          { error: errorData.message || "Failed to create repository" },
          { status: createRepoResponse.status }
        )
      }

      const repoData = await createRepoResponse.json()

      // Update project with GitHub repo info
      await supabase
        .from("projects")
        .update({
          github_repo: repoData.full_name,
        })
        .eq("id", projectId)

      return NextResponse.json({
        repo: repoData.full_name,
        url: repoData.html_url,
        message: "Repository created successfully",
      })
    }

    if (action === "push") {
      // Get project files
      const { data: files, error: filesError } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_directory", false)

      if (filesError || !files?.length) {
        return NextResponse.json(
          { error: "No files to push" },
          { status: 400 }
        )
      }

      if (!project.github_repo) {
        return NextResponse.json(
          { error: "No GitHub repository linked" },
          { status: 400 }
        )
      }

      // Create a tree with all files
      const [owner, repo] = project.github_repo.split("/")

      // First, get the default branch
      const repoInfoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      )

      if (!repoInfoResponse.ok) {
        return NextResponse.json(
          { error: "Failed to get repository info" },
          { status: 500 }
        )
      }

      const repoInfo = await repoInfoResponse.json()
      const defaultBranch = repoInfo.default_branch || "main"

      // Get the latest commit SHA
      const refResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      )

      let baseTreeSha = null
      let parentCommitSha = null

      if (refResponse.ok) {
        const refData = await refResponse.json()
        parentCommitSha = refData.object.sha

        // Get the tree SHA
        const commitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/commits/${parentCommitSha}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        )

        if (commitResponse.ok) {
          const commitData = await commitResponse.json()
          baseTreeSha = commitData.tree.sha
        }
      }

      // Create blobs for each file
      const treeItems = []

      for (const file of files) {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: Buffer.from(file.content).toString("base64"),
              encoding: "base64",
            }),
          }
        )

        if (blobResponse.ok) {
          const blobData = await blobResponse.json()
          treeItems.push({
            path: file.path.startsWith("/") ? file.path.slice(1) : file.path,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          })
        }
      }

      // Create tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: treeItems,
          }),
        }
      )

      if (!treeResponse.ok) {
        return NextResponse.json(
          { error: "Failed to create tree" },
          { status: 500 }
        )
      }

      const treeData = await treeResponse.json()

      // Create commit
      const commitResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Update from Vibe Code",
            tree: treeData.sha,
            parents: parentCommitSha ? [parentCommitSha] : [],
          }),
        }
      )

      if (!commitResponse.ok) {
        return NextResponse.json(
          { error: "Failed to create commit" },
          { status: 500 }
        )
      }

      const commitData = await commitResponse.json()

      // Update reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
        {
          method: parentCommitSha ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sha: commitData.sha,
            force: true,
          }),
        }
      )

      if (!updateRefResponse.ok) {
        // Try creating the ref if it doesn't exist
        const createRefResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ref: `refs/heads/${defaultBranch}`,
              sha: commitData.sha,
            }),
          }
        )

        if (!createRefResponse.ok) {
          return NextResponse.json(
            { error: "Failed to update repository" },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        message: "Pushed successfully",
        commit: commitData.sha,
        url: `https://github.com/${project.github_repo}`,
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("GitHub API error:", error)
    return NextResponse.json(
      { error: "GitHub operation failed" },
      { status: 500 }
    )
  }
}
