// RAG (Retrieval Augmented Generation) System
// For documentation, code examples, and best practices retrieval

// Simple in-memory vector store (in production, use Pinecone, Chroma, etc.)
export interface Document {
  id: string
  content: string
  metadata: {
    type: "documentation" | "code_example" | "best_practice" | "api_reference"
    source: string
    title: string
    tags: string[]
    relevance?: number
  }
  embedding?: number[]
}

export interface SearchResult {
  document: Document
  score: number
}

// Built-in documentation and best practices
const BUILT_IN_DOCS: Document[] = [
  // React Best Practices
  {
    id: "react-components",
    content: `# React Component Best Practices

## Functional Components
Always use functional components with hooks instead of class components.

\`\`\`tsx
// Good
function MyComponent({ title }: { title: string }) {
  const [count, setCount] = useState(0)
  return <div>{title}: {count}</div>
}

// Bad - avoid class components
class MyComponent extends React.Component {}
\`\`\`

## Props Interface
Define props with TypeScript interfaces:

\`\`\`tsx
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary')}
    >
      {label}
    </button>
  )
}
\`\`\`

## Custom Hooks
Extract reusable logic into custom hooks:

\`\`\`tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
\`\`\``,
    metadata: {
      type: "best_practice",
      source: "built-in",
      title: "React Component Best Practices",
      tags: ["react", "components", "typescript", "hooks"]
    }
  },

  // Tailwind CSS Patterns
  {
    id: "tailwind-patterns",
    content: `# Tailwind CSS Design Patterns

## Responsive Design
Use mobile-first approach with breakpoint modifiers:

\`\`\`tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
    Responsive Title
  </h1>
</div>
\`\`\`

## Common UI Patterns

### Cards
\`\`\`tsx
<div className="rounded-lg border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground mt-2">Card content</p>
</div>
\`\`\`

### Buttons
\`\`\`tsx
// Primary
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
  Primary
</button>

// Secondary
<button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80">
  Secondary
</button>

// Outline
<button className="border border-input bg-background px-4 py-2 rounded-md hover:bg-accent">
  Outline
</button>
\`\`\`

### Flexbox Layouts
\`\`\`tsx
// Centered content
<div className="flex items-center justify-center min-h-screen">
  <div>Centered</div>
</div>

// Space between
<div className="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>

// Column layout
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
\`\`\`

### Grid Layouts
\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
\`\`\``,
    metadata: {
      type: "best_practice",
      source: "built-in",
      title: "Tailwind CSS Design Patterns",
      tags: ["tailwind", "css", "responsive", "design"]
    }
  },

  // Supabase Patterns
  {
    id: "supabase-patterns",
    content: `# Supabase Integration Patterns

## Authentication

### Sign Up
\`\`\`tsx
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
\`\`\`

### Sign In
\`\`\`tsx
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
\`\`\`

### OAuth
\`\`\`tsx
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: window.location.origin + '/auth/callback'
  }
})
\`\`\`

### Get User
\`\`\`tsx
const { data: { user } } = await supabase.auth.getUser()
\`\`\`

## Database Operations

### Select
\`\`\`tsx
// Basic select
const { data, error } = await supabase
  .from('posts')
  .select('*')

// With filters
const { data, error } = await supabase
  .from('posts')
  .select('id, title, content, author:users(name)')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(10)
\`\`\`

### Insert
\`\`\`tsx
const { data, error } = await supabase
  .from('posts')
  .insert({
    title: 'New Post',
    content: 'Post content',
    user_id: user.id
  })
  .select()
  .single()
\`\`\`

### Update
\`\`\`tsx
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title' })
  .eq('id', postId)
  .select()
  .single()
\`\`\`

### Delete
\`\`\`tsx
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
\`\`\`

## Realtime Subscriptions
\`\`\`tsx
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('Change received:', payload)
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
\`\`\`

## Row Level Security (RLS)

### Enable RLS
\`\`\`sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
\`\`\`

### Policies
\`\`\`sql
-- Users can read their own posts
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);
\`\`\``,
    metadata: {
      type: "api_reference",
      source: "built-in",
      title: "Supabase Integration Patterns",
      tags: ["supabase", "database", "auth", "realtime"]
    }
  },

  // Error Handling
  {
    id: "error-handling",
    content: `# Error Handling Best Practices

## Try-Catch Pattern
\`\`\`tsx
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }
    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fetch error:', error.message)
      throw error
    }
    throw new Error('Unknown error occurred')
  }
}
\`\`\`

## React Error Boundaries
\`\`\`tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-destructive/10 rounded-md">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
\`\`\`

## Form Validation with Zod
\`\`\`tsx
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required')
})

type FormData = z.infer<typeof formSchema>

function validateForm(data: unknown): FormData {
  return formSchema.parse(data)
}
\`\`\`

## API Error Responses
\`\`\`tsx
// In API route
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate
    const validated = schema.safeParse(body)
    if (!validated.success) {
      return Response.json(
        { error: 'Validation failed', details: validated.error.errors },
        { status: 400 }
      )
    }

    // Process...
    return Response.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
\`\`\``,
    metadata: {
      type: "best_practice",
      source: "built-in",
      title: "Error Handling Best Practices",
      tags: ["error", "validation", "typescript", "react"]
    }
  },

  // State Management
  {
    id: "state-management",
    content: `# State Management with Zustand

## Basic Store
\`\`\`tsx
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}))

// Usage
function Counter() {
  const { count, increment, decrement } = useCounterStore()
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
\`\`\`

## Store with Async Actions
\`\`\`tsx
interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  fetchUser: (id: string) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(\`/api/users/\${id}\`)
      const user = await response.json()
      set({ user, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false })
    }
  },

  logout: () => set({ user: null })
}))
\`\`\`

## Selectors for Performance
\`\`\`tsx
// Select specific parts of state
const count = useCounterStore((state) => state.count)
const increment = useCounterStore((state) => state.increment)

// With shallow comparison for objects
import { shallow } from 'zustand/shallow'

const { user, isLoading } = useUserStore(
  (state) => ({ user: state.user, isLoading: state.isLoading }),
  shallow
)
\`\`\``,
    metadata: {
      type: "best_practice",
      source: "built-in",
      title: "State Management with Zustand",
      tags: ["zustand", "state", "react", "store"]
    }
  },

  // Form Patterns
  {
    id: "form-patterns",
    content: `# Form Handling with React Hook Form

## Basic Form
\`\`\`tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    await login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register('email')} placeholder="Email" />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div>
        <Input {...register('password')} type="password" placeholder="Password" />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Login'}
      </Button>
    </form>
  )
}
\`\`\`

## With shadcn/ui Form
\`\`\`tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
\`\`\``,
    metadata: {
      type: "code_example",
      source: "built-in",
      title: "Form Handling Patterns",
      tags: ["forms", "react-hook-form", "zod", "validation"]
    }
  }
]

// Simple text similarity (cosine-like without actual vectors)
function calculateSimilarity(query: string, content: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/))
  const contentWords = content.toLowerCase().split(/\s+/)

  let matches = 0
  for (const word of contentWords) {
    if (queryWords.has(word)) {
      matches++
    }
  }

  // Boost for exact phrase matches
  if (content.toLowerCase().includes(query.toLowerCase())) {
    matches += query.split(/\s+/).length * 2
  }

  return matches / Math.sqrt(queryWords.size * contentWords.length)
}

// RAG System
export class RAGSystem {
  private documents: Document[]
  private customDocs: Document[]

  constructor() {
    this.documents = [...BUILT_IN_DOCS]
    this.customDocs = []
  }

  // Add custom documentation
  addDocument(doc: Document): void {
    this.customDocs.push(doc)
    this.documents.push(doc)
  }

  // Search for relevant documents
  search(query: string, limit: number = 3): SearchResult[] {
    const results: SearchResult[] = []

    for (const doc of this.documents) {
      // Calculate relevance score
      const contentScore = calculateSimilarity(query, doc.content)
      const titleScore = calculateSimilarity(query, doc.metadata.title) * 2
      const tagScore = doc.metadata.tags.some(tag =>
        query.toLowerCase().includes(tag)
      ) ? 0.3 : 0

      const score = contentScore + titleScore + tagScore

      if (score > 0.01) {
        results.push({ document: doc, score })
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Get context for a specific topic
  getContextForTopic(topic: string): string {
    const results = this.search(topic, 3)

    if (results.length === 0) {
      return ""
    }

    return results
      .map(r => `## ${r.document.metadata.title}\n\n${r.document.content}`)
      .join("\n\n---\n\n")
  }

  // Augment prompt with relevant documentation
  augmentPrompt(userMessage: string, basePrompt: string): string {
    const relevantDocs = this.search(userMessage, 2)

    if (relevantDocs.length === 0) {
      return basePrompt
    }

    const context = relevantDocs
      .map(r => `### ${r.document.metadata.title}\n${r.document.content.substring(0, 1500)}`)
      .join("\n\n")

    return `${basePrompt}

## Relevant Documentation & Best Practices

${context}

---

Use the above documentation as reference when applicable. Follow the patterns and best practices shown.`
  }

  // Get documentation by tag
  getByTag(tag: string): Document[] {
    return this.documents.filter(doc =>
      doc.metadata.tags.includes(tag.toLowerCase())
    )
  }

  // Get all documentation for a type
  getByType(type: Document["metadata"]["type"]): Document[] {
    return this.documents.filter(doc => doc.metadata.type === type)
  }
}

// Singleton instance
let ragInstance: RAGSystem | null = null

export function getRAGSystem(): RAGSystem {
  if (!ragInstance) {
    ragInstance = new RAGSystem()
  }
  return ragInstance
}

// Utility: Extract code examples from documentation
export function extractCodeExamples(content: string): Array<{
  language: string
  code: string
  description?: string
}> {
  const examples: Array<{ language: string; code: string; description?: string }> = []

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Look for description in previous line
    const beforeMatch = content.substring(0, match.index)
    const lines = beforeMatch.split("\n")
    const lastLine = lines[lines.length - 1].trim()
    const description = lastLine && !lastLine.startsWith("#") ? lastLine : undefined

    examples.push({
      language: match[1] || "text",
      code: match[2].trim(),
      description
    })
  }

  return examples
}
