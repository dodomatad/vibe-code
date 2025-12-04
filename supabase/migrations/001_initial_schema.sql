-- Vibe Code - Initial Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  github_token TEXT,
  github_username TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  framework TEXT DEFAULT 'react',
  is_public BOOLEAN DEFAULT FALSE,
  github_repo TEXT,
  deployed_url TEXT,
  thumbnail_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- ============================================
-- PROJECT FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT,
  is_directory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);

-- ============================================
-- PROJECT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECT COLLABORATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEPLOYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  deployment_id TEXT NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'ready', 'error', 'canceled')),
  provider TEXT DEFAULT 'vercel',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(path);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true);

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public projects"
  ON projects FOR SELECT
  USING (is_public = true);

CREATE POLICY "Collaborators can view projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = projects.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Editors can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = projects.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project files policies
CREATE POLICY "Users can view files of their projects"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_files.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view files of public projects"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_files.project_id
      AND is_public = true
    )
  );

CREATE POLICY "Collaborators can view project files"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_files.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage files of their projects"
  ON project_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_files.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage project files"
  ON project_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_files.project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Project versions policies
CREATE POLICY "Users can view versions of their projects"
  ON project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_versions.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view project versions"
  ON project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_versions.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their projects"
  ON project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_versions.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create project versions"
  ON project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_versions.project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Project collaborators policies
CREATE POLICY "Users can view collaborators of their projects"
  ON project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_collaborators.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view other collaborators"
  ON project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = project_collaborators.project_id
      AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage collaborators"
  ON project_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_collaborators.project_id
      AND user_id = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Users can view messages of their projects"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = chat_messages.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = chat_messages.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their projects"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = chat_messages.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = chat_messages.project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Deployments policies
CREATE POLICY "Users can view deployments of their projects"
  ON deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = deployments.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view deployments"
  ON deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = deployments.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deployments for their projects"
  ON deployments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = deployments.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update deployments"
  ON deployments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME CONFIGURATION
-- ============================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_files;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload project assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-assets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view project assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets');

CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- SAMPLE DATA (Optional - remove in production)
-- ============================================

-- You can uncomment this to create sample data for testing
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User');
