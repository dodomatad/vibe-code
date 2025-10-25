import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.utils';
import { generateGamePin } from '../utils/pin.utils';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { GameStatus } from '@quizflow/shared';

export const createGameSession = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.body;
    const userId = req.user!.id;

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    if (quiz.questions.length === 0) {
      throw new AppError('Quiz must have at least one question', 400);
    }

    // Generate unique PIN
    let pin = generateGamePin();
    let existingSession = await prisma.gameSession.findUnique({
      where: { pin },
    });

    while (existingSession) {
      pin = generateGamePin();
      existingSession = await prisma.gameSession.findUnique({
        where: { pin },
      });
    }

    // Create game session
    const gameSession = await prisma.gameSession.create({
      data: {
        pin,
        quizId,
        hostId: userId,
        status: GameStatus.WAITING,
      },
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

    res.status(201).json({
      success: true,
      data: gameSession,
    });
  } catch (error) {
    throw error;
  }
};

export const getGameSession = async (req: Request, res: Response) => {
  try {
    const { pin } = req.params;

    const gameSession = await prisma.gameSession.findUnique({
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
        players: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!gameSession) {
      throw new AppError('Game session not found', 404);
    }

    res.json({
      success: true,
      data: gameSession,
    });
  } catch (error) {
    throw error;
  }
};

export const getGameResults = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: {
            title: true,
            questions: {
              select: {
                id: true,
                text: true,
                points: true,
              },
            },
          },
        },
        players: {
          include: {
            answers: {
              include: {
                question: {
                  select: {
                    id: true,
                    text: true,
                    points: true,
                  },
                },
              },
              orderBy: {
                timestamp: 'asc',
              },
            },
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    if (!gameSession) {
      throw new AppError('Game session not found', 404);
    }

    // Calculate statistics
    const totalPlayers = gameSession.players.length;
    const averageScore =
      gameSession.players.reduce((sum, p) => sum + p.score, 0) / totalPlayers || 0;

    const results = {
      sessionId: gameSession.id,
      quizTitle: gameSession.quiz.title,
      totalPlayers,
      averageScore: Math.round(averageScore),
      leaderboard: gameSession.players.map((player, index) => ({
        position: index + 1,
        name: player.name,
        avatar: player.avatar,
        score: player.score,
        correctAnswers: player.answers.filter((a) => a.isCorrect).length,
        totalAnswers: player.answers.length,
        averageTime:
          player.answers.reduce((sum, a) => sum + a.timeToAnswer, 0) /
            player.answers.length || 0,
      })),
      questionStats: gameSession.quiz.questions.map((question) => {
        const answers = gameSession.players.flatMap((p) =>
          p.answers.filter((a) => a.question.id === question.id)
        );
        const correctAnswers = answers.filter((a) => a.isCorrect).length;

        return {
          questionId: question.id,
          text: question.text,
          totalAnswers: answers.length,
          correctAnswers,
          accuracy: answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0,
        };
      }),
    };

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    throw error;
  }
};
