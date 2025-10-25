import { Server, Socket } from 'socket.io';
import { prisma } from '../utils/prisma.utils';
import { SocketEvent, GameStatus } from '@quizflow/shared';

interface GameRoom {
  sessionId: string;
  pin: string;
  hostSocket: string;
  players: Map<string, PlayerSocket>;
  currentQuestionStartTime?: number;
}

interface PlayerSocket {
  socketId: string;
  playerId: string;
  name: string;
  avatar: string;
}

const gameRooms = new Map<string, GameRoom>();

export const initializeSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join game as player
    socket.on(SocketEvent.JOIN_GAME, async (data: { pin: string; name: string; avatar?: string }) => {
      try {
        const { pin, name, avatar = 'default' } = data;

        // Find game session
        const session = await prisma.gameSession.findUnique({
          where: { pin },
          include: {
            quiz: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
        });

        if (!session) {
          socket.emit(SocketEvent.ERROR, { message: 'Game not found' });
          return;
        }

        if (session.status !== GameStatus.WAITING) {
          socket.emit(SocketEvent.ERROR, { message: 'Game already started' });
          return;
        }

        // Create player
        const player = await prisma.player.create({
          data: {
            sessionId: session.id,
            name,
            avatar,
          },
        });

        // Join socket room
        socket.join(pin);

        // Track player in game room
        let room = gameRooms.get(pin);
        if (!room) {
          room = {
            sessionId: session.id,
            pin,
            hostSocket: '',
            players: new Map(),
          };
          gameRooms.set(pin, room);
        }

        room.players.set(socket.id, {
          socketId: socket.id,
          playerId: player.id,
          name: player.name,
          avatar: player.avatar,
        });

        // Notify everyone
        io.to(pin).emit(SocketEvent.PLAYER_JOINED, {
          player: {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            score: player.score,
          },
          totalPlayers: room.players.size,
        });

        socket.emit('joined', {
          playerId: player.id,
          sessionId: session.id,
          quizTitle: session.quiz.title,
        });

        console.log(`✅ Player ${name} joined game ${pin}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit(SocketEvent.ERROR, { message: 'Failed to join game' });
      }
    });

    // Start game (host only)
    socket.on(SocketEvent.START_GAME, async (data: { pin: string }) => {
      try {
        const { pin } = data;

        const session = await prisma.gameSession.findUnique({
          where: { pin },
          include: {
            quiz: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
            players: true,
          },
        });

        if (!session) {
          socket.emit(SocketEvent.ERROR, { message: 'Game not found' });
          return;
        }

        if (session.players.length === 0) {
          socket.emit(SocketEvent.ERROR, { message: 'No players in game' });
          return;
        }

        // Update session status
        await prisma.gameSession.update({
          where: { id: session.id },
          data: {
            status: GameStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        });

        const room = gameRooms.get(pin);
        if (room) {
          room.hostSocket = socket.id;
        }

        // Notify all players
        io.to(pin).emit(SocketEvent.GAME_STARTED, {
          totalQuestions: session.quiz.questions.length,
        });

        // Start first question after 3 seconds
        setTimeout(() => {
          startQuestion(io, pin, session.id, 0);
        }, 3000);

        console.log(`🎮 Game ${pin} started`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit(SocketEvent.ERROR, { message: 'Failed to start game' });
      }
    });

    // Submit answer
    socket.on(
      SocketEvent.SUBMIT_ANSWER,
      async (data: {
        pin: string;
        playerId: string;
        questionId: string;
        selectedOptions: string[];
        timeToAnswer: number;
      }) => {
        try {
          const { pin, playerId, questionId, selectedOptions, timeToAnswer } = data;

          // Get question with correct answers
          const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
              options: true,
            },
          });

          if (!question) {
            socket.emit(SocketEvent.ERROR, { message: 'Question not found' });
            return;
          }

          // Check if answer is correct
          const correctOptions = question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.id)
            .sort();

          const isCorrect =
            selectedOptions.length === correctOptions.length &&
            selectedOptions.sort().every((opt, index) => opt === correctOptions[index]);

          // Calculate points (faster = more points)
          let pointsEarned = 0;
          if (isCorrect) {
            const timeBonus = Math.max(0, 1 - timeToAnswer / (question.timeLimit * 1000));
            pointsEarned = Math.round(question.points * (0.5 + timeBonus * 0.5));
          }

          // Save answer
          await prisma.playerAnswer.create({
            data: {
              playerId,
              questionId,
              selectedOptions,
              timeToAnswer,
              isCorrect,
              pointsEarned,
            },
          });

          // Update player score
          const player = await prisma.player.update({
            where: { id: playerId },
            data: {
              score: {
                increment: pointsEarned,
              },
            },
          });

          // Notify player
          socket.emit(SocketEvent.ANSWER_SUBMITTED, {
            isCorrect,
            pointsEarned,
            totalScore: player.score,
          });

          console.log(
            `📝 Player ${playerId} answered question ${questionId}: ${isCorrect ? '✅' : '❌'}`
          );
        } catch (error) {
          console.error('Error submitting answer:', error);
          socket.emit(SocketEvent.ERROR, { message: 'Failed to submit answer' });
        }
      }
    );

    // Leave game
    socket.on(SocketEvent.LEAVE_GAME, async () => {
      await handlePlayerDisconnect(io, socket);
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      await handlePlayerDisconnect(io, socket);
    });
  });

  console.log('✅ Socket.IO handlers initialized');
};

async function startQuestion(io: Server, pin: string, sessionId: string, questionIndex: number) {
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!session) return;

    const question = session.quiz.questions[questionIndex];
    if (!question) {
      // Game finished
      await endGame(io, pin, sessionId);
      return;
    }

    // Update session
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentQuestionIndex: questionIndex,
        status: GameStatus.QUESTION_ACTIVE,
      },
    });

    const room = gameRooms.get(pin);
    if (room) {
      room.currentQuestionStartTime = Date.now();
    }

    // Send question to players (without correct answers)
    io.to(pin).emit(SocketEvent.QUESTION_STARTED, {
      questionIndex,
      totalQuestions: session.quiz.questions.length,
      question: {
        id: question.id,
        text: question.text,
        type: question.type,
        imageUrl: question.imageUrl,
        timeLimit: question.timeLimit,
        points: question.points,
        options: question.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          imageUrl: opt.imageUrl,
        })),
      },
    });

    // Auto-advance after time limit
    setTimeout(async () => {
      await endQuestion(io, pin, sessionId, questionIndex);
    }, question.timeLimit * 1000 + 2000); // +2s for grace period

    console.log(`❓ Question ${questionIndex + 1} started for game ${pin}`);
  } catch (error) {
    console.error('Error starting question:', error);
  }
}

async function endQuestion(io: Server, pin: string, sessionId: string, questionIndex: number) {
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        players: {
          include: {
            answers: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    if (!session) return;

    const question = session.quiz.questions[questionIndex];
    const correctOptions = question.options.filter((opt) => opt.isCorrect);

    // Send results
    io.to(pin).emit(SocketEvent.QUESTION_ENDED, {
      correctOptions: correctOptions.map((opt) => opt.id),
      explanation: question.explanation,
      leaderboard: session.players.slice(0, 10).map((p, idx) => ({
        position: idx + 1,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
      })),
    });

    // Wait 5 seconds before next question
    setTimeout(() => {
      startQuestion(io, pin, sessionId, questionIndex + 1);
    }, 5000);

    console.log(`✅ Question ${questionIndex + 1} ended for game ${pin}`);
  } catch (error) {
    console.error('Error ending question:', error);
  }
}

async function endGame(io: Server, pin: string, sessionId: string) {
  try {
    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.FINISHED,
        finishedAt: new Date(),
      },
      include: {
        players: {
          include: {
            answers: true,
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    const finalResults = {
      leaderboard: session.players.map((p, idx) => ({
        position: idx + 1,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        correctAnswers: p.answers.filter((a) => a.isCorrect).length,
        totalAnswers: p.answers.length,
      })),
    };

    io.to(pin).emit(SocketEvent.GAME_FINISHED, finalResults);

    // Clean up room
    gameRooms.delete(pin);

    console.log(`🏁 Game ${pin} finished`);
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

async function handlePlayerDisconnect(io: Server, socket: Socket) {
  // Find which room the player is in
  for (const [pin, room] of gameRooms.entries()) {
    const playerSocket = room.players.get(socket.id);
    if (playerSocket) {
      // Mark player as disconnected
      await prisma.player.update({
        where: { id: playerSocket.playerId },
        data: { isConnected: false },
      });

      room.players.delete(socket.id);

      io.to(pin).emit(SocketEvent.PLAYER_LEFT, {
        playerId: playerSocket.playerId,
        name: playerSocket.name,
        totalPlayers: room.players.size,
      });

      console.log(`👋 Player ${playerSocket.name} left game ${pin}`);
      break;
    }
  }
}
