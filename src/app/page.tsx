import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Code2, Rocket, Users, GitBranch, Eye, MessageSquare, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Vibe Code</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Comecar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Construa apps <span className="gradient-text">incriveis</span>
            <br />
            com o poder da IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descreva o que voce quer criar e veja a magica acontecer.
            Editor visual, preview em tempo real, deploy com um clique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">
                Comecar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que voce precisa</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, title: "Chat com IA", desc: "Descreva o que voce quer e a IA gera o codigo" },
              { icon: Code2, title: "Editor Visual", desc: "Editor completo com syntax highlighting" },
              { icon: Eye, title: "Preview em Tempo Real", desc: "Veja as mudancas instantaneamente" },
              { icon: Rocket, title: "Deploy Automatico", desc: "Publique com um clique" },
              { icon: Users, title: "Colaboracao", desc: "Trabalhe em equipe em tempo real" },
              { icon: GitBranch, title: "GitHub Sync", desc: "Integracao completa com GitHub" },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border bg-card">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Pronto para criar algo incrivel?</h2>
            <p className="text-lg opacity-90 mb-8">Junte-se a milhares de desenvolvedores</p>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Criar Conta Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>2024 Vibe Code. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
