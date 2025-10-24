export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vibe Code
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-powered code generation with transparent pricing
          </p>
          <p className="text-lg mb-4">
            The only platform that <strong>never charges you for AI errors</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            title="Transparent Pricing"
            description="See costs in real-time. Never pay for AI mistakes. Save 40%+ vs competitors."
            icon="💰"
          />
          <FeatureCard
            title="Multi-Framework"
            description="React, Vue, Svelte, Angular, Solid. No lock-in. Your framework, your choice."
            icon="🎨"
          />
          <FeatureCard
            title="Smart AI Routing"
            description="Automatically uses the best AI model for your task. Quality meets efficiency."
            icon="🧠"
          />
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Why Vibe Code?</h2>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <p>
                <strong>Never pay for AI errors</strong> - Other platforms charge you even when the AI makes mistakes. We don't.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <p>
                <strong>Real-time cost tracking</strong> - Know exactly what you're spending, when you're spending it.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <p>
                <strong>Multi-framework support</strong> - Unlike Lovable (React-only), we support 6+ frameworks.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <p>
                <strong>80%+ test coverage</strong> - Production-ready code you can trust.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with Next.js 15, React 19, and TypeScript</p>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
