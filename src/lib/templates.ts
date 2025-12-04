import type { ProjectTemplate } from "@/types"

export const templates: ProjectTemplate[] = [
  {
    id: "react-starter",
    name: "React Starter",
    description: "Um projeto React básico com TypeScript e Tailwind CSS",
    framework: "react",
    thumbnail: "/templates/react.png",
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
          Seu app React está funcionando!
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
`,
      "/package.json": `{
  "name": "vibe-code-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
`,
    },
  },
  {
    id: "nextjs-app",
    name: "Next.js App",
    description: "Projeto Next.js 14 com App Router e Server Components",
    framework: "nextjs",
    thumbnail: "/templates/nextjs.png",
    files: {
      "/app/page.tsx": `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Next.js no Vibe Code
        </h1>
        <p className="text-gray-600 mb-6">
          Seu app Next.js está pronto para ser construído com IA!
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://nextjs.org/docs"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Documentação
          </a>
        </div>
      </div>
    </main>
  )
}
`,
      "/app/layout.tsx": `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe Code App',
  description: 'Criado com Vibe Code',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
`,
      "/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
`,
      "/package.json": `{
  "name": "vibe-code-nextjs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0"
  }
}
`,
    },
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Template de landing page moderna e responsiva",
    framework: "react",
    thumbnail: "/templates/landing.png",
    files: {
      "/App.tsx": `import { useState } from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            SeuProduto
          </h1>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-purple-400 transition">Features</a>
            <a href="#pricing" className="hover:text-purple-400 transition">Preços</a>
            <button className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition">
              Começar
            </button>
          </div>
        </nav>

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Construa algo
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> incrível </span>
            com nossa plataforma
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            A solução completa para transformar suas ideias em realidade.
            Rápido, simples e poderoso.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-purple-500 hover:bg-purple-600 px-8 py-3 rounded-lg font-semibold transition">
              Teste Grátis
            </button>
            <button className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg font-semibold transition">
              Ver Demo
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Por que nos escolher?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Rápido', desc: 'Performance otimizada para resultados instantâneos' },
            { title: 'Seguro', desc: 'Seus dados protegidos com criptografia de ponta' },
            { title: 'Escalável', desc: 'Cresce junto com seu negócio sem limites' },
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl">
              <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Pronto para começar?</h3>
          <p className="text-lg mb-8 opacity-90">
            Junte-se a milhares de usuários satisfeitos
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Criar Conta Grátis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-800">
        <p className="text-center text-gray-500">
          © 2024 SeuProduto. Feito com Vibe Code.
        </p>
      </footer>
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}
`,
      "/package.json": `{
  "name": "vibe-code-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
`,
    },
  },
]

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return templates.find((t) => t.id === id)
}

export function getDefaultFiles(framework: string): Record<string, string> {
  const template = templates.find((t) => t.framework === framework)
  return template?.files ?? templates[0].files
}
