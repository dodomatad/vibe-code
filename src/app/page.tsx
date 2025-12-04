import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Zap,
  Code2,
  Rocket,
  Users,
  GitBranch,
  Eye,
  MessageSquare,
  ArrowRight,
  CheckCircle2
} from "lucide-react"

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
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition">
              Preços
            </Link>
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Começar Grátis</Button>
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
            Construa apps{" "}
            <span className="gradient-text">incríveis</span>
            <br />
            com o poder da IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descreva o que você quer criar e veja a mágica acontecer.
            Editor visual, preview em tempo real, deploy com um clique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Eye className="mr-2 h-4 w-4" />
                Ver Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Sem cartão de crédito. Comece em segundos.
          </p>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="rounded-xl border bg-background shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-muted-foreground ml-2">Vibe Code Editor</span>
            </div>
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-background to-purple-500/20 flex items-center justify-center">
              <div className="text-center">
                <Code2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Preview do Editor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para criar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para transformar suas ideias em aplicações reais
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Chat com IA",
                description: "Descreva o que você quer e a IA gera o código automaticamente"
              },
              {
                icon: Code2,
                title: "Editor Visual",
                description: "Editor de código completo com syntax highlighting e autocomplete"
              },
              {
                icon: Eye,
                title: "Preview em Tempo Real",
                description: "Veja as mudanças instantaneamente enquanto a IA trabalha"
              },
              {
                icon: Rocket,
                title: "Deploy Automático",
                description: "Publique seu app com um clique para o mundo ver"
              },
              {
                icon: Users,
                title: "Colaboração",
                description: "Trabalhe em equipe em tempo real no mesmo projeto"
              },
              {
                icon: GitBranch,
                title: "GitHub Sync",
                description: "Integração completa com GitHub para versionamento"
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border bg-card hover:shadow-lg transition">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground">
              Comece grátis e escale conforme sua necessidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "R$0",
                description: "Perfeito para começar",
                features: [
                  "3 projetos",
                  "100 mensagens IA/mês",
                  "Preview em tempo real",
                  "Deploy básico"
                ]
              },
              {
                name: "Pro",
                price: "R$49",
                description: "Para criadores sérios",
                features: [
                  "Projetos ilimitados",
                  "1000 mensagens IA/mês",
                  "Domínio personalizado",
                  "GitHub integration",
                  "Colaboração em equipe",
                  "Suporte prioritário"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Para grandes equipes",
                features: [
                  "Tudo do Pro",
                  "IA ilimitada",
                  "SSO/SAML",
                  "SLA garantido",
                  "Suporte dedicado",
                  "On-premise option"
                ]
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-8 rounded-xl border bg-card ${
                  plan.popular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="mb-4">Mais Popular</Badge>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/mês</span>}
                </div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <Button className="w-full mb-6" variant={plan.popular ? "default" : "outline"}>
                  {plan.price === "Custom" ? "Falar com Vendas" : "Começar"}
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para criar algo incrível?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Junte-se a milhares de desenvolvedores que já estão construindo o futuro
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Vibe Code</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition">Termos</Link>
              <Link href="/privacy" className="hover:text-foreground transition">Privacidade</Link>
              <Link href="/docs" className="hover:text-foreground transition">Docs</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Vibe Code. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
