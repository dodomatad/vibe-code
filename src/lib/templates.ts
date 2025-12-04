import type { ProjectTemplate } from "@/types"

export const templates: ProjectTemplate[] = [
  {
    id: "react-starter",
    name: "React Starter",
    description: "Um projeto React basico com TypeScript e Tailwind CSS",
    framework: "react",
    files: {
      "/App.tsx": `import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Vibe Code
        </h1>
        <p className="text-gray-600 mb-6">
          Seu app React esta funcionando!
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Cliques: {count}
        </button>
      </div>
    </div>
  )
}
`,
      "/index.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
      "/styles.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    },
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Template de landing page moderna e responsiva",
    framework: "react",
    files: {
      "/App.tsx": `export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="container mx-auto px-6 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold">SeuProduto</h1>
          <button className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg">
            Comecar
          </button>
        </nav>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6">
            Construa algo incrivel
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            A solucao completa para transformar suas ideias em realidade.
          </p>
          <button className="bg-purple-500 hover:bg-purple-600 px-8 py-3 rounded-lg font-semibold">
            Teste Gratis
          </button>
        </div>
      </header>
    </div>
  )
}
`,
      "/index.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
      "/styles.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    },
  },
]

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return templates.find((t) => t.id === id)
}
