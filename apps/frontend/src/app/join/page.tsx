'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gameApi } from '@/lib/api';

const AVATARS = [
  '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄',
  '🐲', '🦋', '🐝', '🐢', '🦜', '🦩', '🦭', '🐧'
];

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<'pin' | 'name'>('pin');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verify PIN exists
      await gameApi.getSession(pin);
      setStep('name');
    } catch (err: any) {
      setError('PIN inválido ou jogo não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Digite seu nome');
      return;
    }

    router.push(`/play?pin=${pin}&name=${encodeURIComponent(name)}&avatar=${selectedAvatar}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gradient">QuizFlow</h1>
        <p className="text-gray-600 text-center mb-8">Entre no jogo</p>

        {step === 'pin' ? (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-center">
                Digite o PIN do jogo
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center text-3xl font-bold tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-lg" disabled={isLoading || pin.length !== 6}>
              {isLoading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-center">
                Escolha seu avatar
              </label>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      selectedAvatar === avatar
                        ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-center">
                Digite seu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                className="input text-center text-xl"
                placeholder="Seu nome"
                maxLength={20}
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('pin')}
                className="btn-outline flex-1"
              >
                Voltar
              </button>
              <button type="submit" className="btn-primary flex-1 text-lg">
                Entrar no Jogo! 🎮
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-600 hover:underline">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}
