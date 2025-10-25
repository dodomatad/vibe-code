'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { socketClient } from '@/lib/socket';
import { SocketEvent } from '@quizflow/shared';

export default function PlayPage() {
  const searchParams = useSearchParams();
  const pin = searchParams.get('pin');
  const name = searchParams.get('name');
  const avatar = searchParams.get('avatar');

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'answered' | 'results' | 'finished'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!pin || !name || !avatar) return;

    const socket = socketClient.connect();

    // Join the game
    socketClient.emit(SocketEvent.JOIN_GAME, { pin, name, avatar });

    // Listen for game events
    socketClient.on('joined', (data) => {
      console.log('Joined game:', data);
    });

    socketClient.on(SocketEvent.GAME_STARTED, (data) => {
      console.log('Game started:', data);
      setGameState('waiting');
    });

    socketClient.on(SocketEvent.QUESTION_STARTED, (data) => {
      console.log('Question started:', data);
      setCurrentQuestion(data.question);
      setTimeLeft(data.question.timeLimit);
      setGameState('playing');
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    });

    socketClient.on(SocketEvent.ANSWER_SUBMITTED, (data) => {
      console.log('Answer submitted:', data);
      setIsCorrect(data.isCorrect);
      setPointsEarned(data.pointsEarned);
      setScore(data.totalScore);
      setGameState('answered');
    });

    socketClient.on(SocketEvent.QUESTION_ENDED, (data) => {
      console.log('Question ended:', data);
      setLeaderboard(data.leaderboard || []);
      setGameState('results');
    });

    socketClient.on(SocketEvent.GAME_FINISHED, (data) => {
      console.log('Game finished:', data);
      setLeaderboard(data.leaderboard || []);
      setGameState('finished');
    });

    socketClient.on(SocketEvent.ERROR, (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    return () => {
      socketClient.off('joined');
      socketClient.off(SocketEvent.GAME_STARTED);
      socketClient.off(SocketEvent.QUESTION_STARTED);
      socketClient.off(SocketEvent.ANSWER_SUBMITTED);
      socketClient.off(SocketEvent.QUESTION_ENDED);
      socketClient.off(SocketEvent.GAME_FINISHED);
      socketClient.off(SocketEvent.ERROR);
      socketClient.disconnect();
    };
  }, [pin, name, avatar]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft]);

  const handleSelectOption = (optionId: string) => {
    if (gameState !== 'playing') return;
    setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const timeToAnswer = Date.now() - questionStartTime;

    socketClient.emit(SocketEvent.SUBMIT_ANSWER, {
      pin,
      playerId: 'player-temp', // This will be set by server
      questionId: currentQuestion.id,
      selectedOptions: [selectedOption],
      timeToAnswer,
    });
  };

  if (!pin || !name || !avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Parâmetros inválidos. Volte para /join</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 text-white p-4">
      {/* Header */}
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{avatar}</div>
            <div>
              <div className="font-bold text-xl">{name}</div>
              <div className="text-sm opacity-75">Pontos: {score}</div>
            </div>
          </div>
          {gameState === 'playing' && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-2xl font-bold">
              ⏱️ {timeLeft}s
            </div>
          )}
        </div>

        {/* Waiting State */}
        {gameState === 'waiting' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-4xl font-bold mb-4">Aguardando próxima pergunta...</h1>
            <p className="text-xl opacity-75">Prepare-se!</p>
          </div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && currentQuestion && (
          <div className="animate-slide-up">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
              <h2 className="text-3xl font-bold mb-4">{currentQuestion.text}</h2>
              <div className="flex items-center gap-4 text-sm opacity-75">
                <span>⚡ {currentQuestion.points} pontos</span>
                <span>⏱️ {currentQuestion.timeLimit} segundos</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion.options.map((option: any, index: number) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`
                    p-6 rounded-xl text-lg font-semibold text-left transition-all
                    ${
                      selectedOption === option.id
                        ? 'bg-white text-purple-600 scale-105'
                        : 'bg-white/20 hover:bg-white/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {String.fromCharCode(65 + index)}
                    </div>
                    {option.text}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 py-6 rounded-xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Confirmar Resposta
            </button>
          </div>
        )}

        {/* Answered State */}
        {gameState === 'answered' && (
          <div className="text-center py-20 animate-fade-in">
            <div className={`text-8xl mb-6 ${isCorrect ? 'animate-pulse' : ''}`}>
              {isCorrect ? '✅' : '❌'}
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {isCorrect ? 'Correto!' : 'Incorreto!'}
            </h2>
            {isCorrect && (
              <div className="text-2xl opacity-90">
                +{pointsEarned} pontos
              </div>
            )}
            <div className="mt-4 text-xl">
              Total: {score} pontos
            </div>
          </div>
        )}

        {/* Results State */}
        {gameState === 'results' && (
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-6 text-center">Ranking</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              {leaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg mb-2 ${
                    player.name === name ? 'bg-yellow-500/30' : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-8">#{index + 1}</div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div className="font-semibold">{player.name}</div>
                  </div>
                  <div className="text-xl font-bold">{player.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finished State */}
        {gameState === 'finished' && (
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">🏁</div>
            <h1 className="text-5xl font-bold mb-8">Jogo Finalizado!</h1>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Classificação Final</h2>
              {leaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-6 rounded-xl mb-3 ${
                    index === 0
                      ? 'bg-yellow-500/40 text-yellow-100'
                      : index === 1
                      ? 'bg-gray-300/30'
                      : index === 2
                      ? 'bg-orange-600/30'
                      : player.name === name
                      ? 'bg-blue-500/30'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="text-3xl">{player.avatar}</div>
                    <div>
                      <div className="font-bold text-xl">{player.name}</div>
                      <div className="text-sm opacity-75">
                        {player.correctAnswers}/{player.totalAnswers} corretas
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{player.score}</div>
                </div>
              ))}
            </div>

            <a href="/" className="btn-primary inline-block px-8 py-4 text-lg">
              Voltar para Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
