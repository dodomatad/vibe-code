-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    github_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    framework TEXT DEFAULT 'react',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_url TEXT,
    github_repo TEXT,
    vercel_project_id TEXT,
    supabase_project_id TEXT,
    thumbnail_url TEXT,
    UNIQUE(owner_id, slug)
);

-- Project files table
CREATE TABLE project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    path TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_directory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, path)
);

-- Project versions table (for history)
CREATE TABLE project_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    message TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, version_number)
);

-- Project collaborators table
CREATE TABLE project_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployments table
CREATE TABLE deployments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'ready', 'error')),
    url TEXT,
    vercel_deployment_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_versions_project ON project_versions(project_id);
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_deployments_project ON deployments(project_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Public projects are viewable by everyone"
ON projects FOR SELECT
USING (is_public = true OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners and editors can update"
ON projects FOR UPDATE
USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
));

CREATE POLICY "Only owners can delete projects"
ON projects FOR DELETE
USING (owner_id = auth.uid());

-- Project files policies
CREATE POLICY "Files are viewable if project is accessible"
ON project_files FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND (
        projects.is_public = true OR projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
        )
    )
));

CREATE POLICY "Editors can modify files"
ON project_files FOR ALL
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    )
));

-- Project versions policies
CREATE POLICY "Versions are viewable if project is accessible"
ON project_versions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_versions.project_id AND (
        projects.is_public = true OR projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
        )
    )
));

CREATE POLICY "Editors can create versions"
ON project_versions FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_versions.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    )
));

-- Collaborators policies
CREATE POLICY "Collaborators visible to project members"
ON project_collaborators FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators pc WHERE pc.project_id = projects.id AND pc.user_id = auth.uid()
        )
    )
));

CREATE POLICY "Only owners can manage collaborators"
ON project_collaborators FOR ALL
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND projects.owner_id = auth.uid()
));

-- Chat messages policies
CREATE POLICY "Messages viewable by project members"
ON chat_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
        )
    )
));

CREATE POLICY "Members can create messages"
ON chat_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
        )
    )
));

-- Deployments policies
CREATE POLICY "Deployments viewable by project members"
ON deployments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = deployments.project_id AND (
        projects.is_public = true OR projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid()
        )
    )
));

CREATE POLICY "Editors can create deployments"
ON deployments FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = deployments.project_id AND (
        projects.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    )
));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
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

-- Enable Realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE project_files;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;
