'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { quizApi, gameApi } from '@/lib/api';
import { LogOut, Play, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated]);

  const fetchQuizzes = async () => {
    try {
      const response = await quizApi.getAll(false);
      setQuizzes(response.data.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (quizId: string) => {
    setCreatingGame(quizId);
    try {
      const response = await gameApi.createSession(quizId);
      const session = response.data.data;

      // Redirect to host page
      router.push(`/host/${session.pin}`);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Erro ao criar jogo');
    } finally {
      setCreatingGame(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gradient">QuizFlow</h1>
            <p className="text-sm text-gray-600">Olá, {user.name}!</p>
          </div>
          <button onClick={handleLogout} className="btn-outline flex items-center gap-2">
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meus Quizzes</h2>
          <p className="text-gray-600">Selecione um quiz para iniciar um jogo</p>
        </div>

        {quizzes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-xl text-gray-600 mb-4">
              Você ainda não tem quizzes
            </p>
            <p className="text-gray-500 mb-6">
              Use o quiz de exemplo para testar a plataforma
            </p>
            <button
              onClick={() => fetchQuizzes()}
              className="btn-primary"
            >
              Recarregar
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {quiz.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{quiz._count?.questions || 0} perguntas</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {quiz.gameMode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleStartGame(quiz.id)}
                    disabled={creatingGame === quiz.id}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    {creatingGame === quiz.id ? 'Criando...' : 'Iniciar Jogo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
