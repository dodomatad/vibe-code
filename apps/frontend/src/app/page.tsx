'use client';

import Link from 'next/link';
import { Gamepad2, Users, Trophy, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 animate-fade-in">
          <span className="text-gradient">QuizFlow</span>
        </h1>
        <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Revolucione o aprendizado em sala de aula com quizzes interativos e gamificação
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="btn-primary">
            Entrar como Professor
          </Link>
          <Link href="/join" className="btn-outline">
            Entrar como Estudante
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <FeatureCard
            icon={<Gamepad2 className="w-12 h-12 text-primary-600" />}
            title="Modos de Jogo"
            description="Clássico, Cooperativo, Battle Royale e mais"
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-primary-600" />}
            title="Tempo Real"
            description="Interação instantânea entre professor e alunos"
          />
          <FeatureCard
            icon={<Trophy className="w-12 h-12 text-primary-600" />}
            title="Gamificação"
            description="Avatares, conquistas e rankings"
          />
          <FeatureCard
            icon={<Zap className="w-12 h-12 text-primary-600" />}
            title="Power-ups"
            description="50/50, Escudo, Visão e muito mais"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard number="10K+" label="Estudantes Ativos" />
            <StatCard number="500+" label="Professores" />
            <StatCard number="50K+" label="Quizzes Criados" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 QuizFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card text-center hover:scale-105 transition-transform">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-5xl font-bold mb-2">{number}</div>
      <div className="text-xl opacity-90">{label}</div>
    </div>
  );
}
