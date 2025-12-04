import { create } from "zustand"
import type { Project, ProjectVersion, CollaboratorPresence } from "@/types"

interface ProjectState {
  project: Project | null
  setProject: (project: Project | null) => void

  versions: ProjectVersion[]
  setVersions: (versions: ProjectVersion[]) => void

  collaborators: CollaboratorPresence[]
  setCollaborators: (collaborators: CollaboratorPresence[]) => void

  isLoading: boolean
  isSaving: boolean
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  setProject: (project) => set({ project }),

  versions: [],
  setVersions: (versions) => set({ versions }),

  collaborators: [],
  setCollaborators: (collaborators) => set({ collaborators }),

  isLoading: false,
  isSaving: false,
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
}))
