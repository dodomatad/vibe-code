'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { socketClient } from '@/lib/socket';
import { SocketEvent } from '@quizflow/shared';
import { Users, Play } from 'lucide-react';

export default function HostPage() {
  const params = useParams();
  const pin = params.pin as string;
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const socket = socketClient.connect();

    // Listen for players joining
    socketClient.on(SocketEvent.PLAYER_JOINED, (data) => {
      console.log('Player joined:', data);
      setPlayers((prev) => [...prev, data.player]);
    });

    socketClient.on(SocketEvent.PLAYER_LEFT, (data) => {
      console.log('Player left:', data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    socketClient.on(SocketEvent.GAME_STARTED, () => {
      setGameStarted(true);
    });

    return () => {
      socketClient.off(SocketEvent.PLAYER_JOINED);
      socketClient.off(SocketEvent.PLAYER_LEFT);
      socketClient.off(SocketEvent.GAME_STARTED);
    };
  }, []);

  const handleStartGame = () => {
    socketClient.emit(SocketEvent.START_GAME, { pin });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 text-white p-8">
      <div className="container mx-auto max-w-4xl">
        {/* PIN Display */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">PIN do Jogo</h1>
          <div className="bg-white text-purple-600 rounded-3xl p-8 inline-block">
            <div className="text-7xl font-bold tracking-widest">{pin}</div>
          </div>
          <p className="mt-4 text-xl">
            Compartilhe este PIN com os estudantes
          </p>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Users size={32} />
              Jogadores ({players.length})
            </h2>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl opacity-75">
                Aguardando jogadores...
              </p>
              <p className="mt-2 opacity-60">
                Os jogadores devem acessar localhost:3000/join e digitar o PIN
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map((player, index) => (
                <div
                  key={player.id || index}
                  className="bg-white/20 rounded-xl p-4 text-center animate-slide-up"
                >
                  <div className="text-4xl mb-2">{player.avatar}</div>
                  <div className="font-semibold truncate">{player.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        {!gameStarted && players.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleStartGame}
              className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-6 rounded-2xl text-2xl font-bold flex items-center gap-3 mx-auto transition-all hover:scale-105 active:scale-95"
            >
              <Play size={32} />
              Iniciar Jogo
            </button>
          </div>
        )}

        {gameStarted && (
          <div className="text-center">
            <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-xl font-bold inline-block animate-pulse">
              🎮 Jogo Iniciado!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
