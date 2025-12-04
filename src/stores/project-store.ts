import { create } from "zustand"
import type { Project, ProjectVersion, CollaboratorPresence, DeploymentStatus } from "@/types"

interface ProjectState {
  // Current project
  project: Project | null
  setProject: (project: Project | null) => void
  updateProject: (updates: Partial<Project>) => void

  // Versions
  versions: ProjectVersion[]
  setVersions: (versions: ProjectVersion[]) => void
  addVersion: (version: ProjectVersion) => void

  // Collaborators & Presence
  collaborators: CollaboratorPresence[]
  setCollaborators: (collaborators: CollaboratorPresence[]) => void
  updateCollaboratorPresence: (userId: string, updates: Partial<CollaboratorPresence>) => void

  // Deployment
  deployment: DeploymentStatus | null
  setDeployment: (deployment: DeploymentStatus | null) => void

  // Loading states
  isLoading: boolean
  isSaving: boolean
  isDeploying: boolean
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setDeploying: (deploying: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  // Current project
  project: null,
  setProject: (project) => set({ project }),
  updateProject: (updates) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...updates } : null,
    })),

  // Versions
  versions: [],
  setVersions: (versions) => set({ versions }),
  addVersion: (version) =>
    set((state) => ({ versions: [version, ...state.versions] })),

  // Collaborators
  collaborators: [],
  setCollaborators: (collaborators) => set({ collaborators }),
  updateCollaboratorPresence: (userId, updates) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.userId === userId ? { ...c, ...updates } : c
      ),
    })),

  // Deployment
  deployment: null,
  setDeployment: (deployment) => set({ deployment }),

  // Loading states
  isLoading: false,
  isSaving: false,
  isDeploying: false,
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setDeploying: (isDeploying) => set({ isDeploying }),
}))
