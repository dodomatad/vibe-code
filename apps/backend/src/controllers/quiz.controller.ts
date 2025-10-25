import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { GameMode, QuestionType, Difficulty } from '@quizflow/shared';

const createQuizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  gameMode: z.nativeEnum(GameMode).default(GameMode.CLASSIC),
  isPublic: z.boolean().default(false),
  questions: z.array(
    z.object({
      type: z.nativeEnum(QuestionType),
      text: z.string().min(3),
      timeLimit: z.number().min(5).max(300),
      points: z.number().min(10).max(1000),
      difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
      explanation: z.string().optional(),
      options: z.array(
        z.object({
          text: z.string().min(1),
          isCorrect: z.boolean(),
        })
      ).min(2),
    })
  ).min(1),
});

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createQuizSchema.parse(req.body);

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        gameMode: data.gameMode,
        isPublic: data.isPublic,
        teacherId: userId,
        questions: {
          create: data.questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            timeLimit: q.timeLimit,
            points: q.points,
            difficulty: q.difficulty,
            explanation: q.explanation,
            order: index + 1,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
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
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation error', details: error.errors },
      });
    }
    throw error;
  }
};

export const getQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { isPublic } = req.query;

    const where: any = {};

    if (isPublic === 'true') {
      where.isPublic = true;
    } else {
      where.teacherId = userId;
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    throw error;
  }
};

export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    throw error;
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    if (quiz.teacherId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const data = createQuizSchema.partial().parse(req.body);

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        gameMode: data.gameMode,
        isPublic: data.isPublic,
      },
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
    });

    res.json({
      success: true,
      data: updatedQuiz,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation error', details: error.errors },
      });
    }
    throw error;
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    if (quiz.teacherId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.quiz.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Quiz deleted successfully' },
    });
  } catch (error) {
    throw error;
  }
};
