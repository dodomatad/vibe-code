import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { AvatarClass } from '@quizflow/shared';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  avatarClass: z.nativeEnum(AvatarClass).optional(),
  avatarSkin: z.string().optional(),
});

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        avatarClass: true,
        avatarSkin: true,
        level: true,
        xp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        avatarClass: true,
        avatarSkin: true,
        level: true,
        xp: true,
        createdAt: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get player stats
    const players = await prisma.player.findMany({
      where: { userId },
      include: {
        answers: true,
        session: {
          include: {
            quiz: true,
          },
        },
      },
    });

    const totalGames = players.length;
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const totalAnswers = players.reduce((sum, p) => sum + p.answers.length, 0);
    const correctAnswers = players.reduce(
      (sum, p) => sum + p.answers.filter((a) => a.isCorrect).length,
      0
    );

    const stats = {
      totalGames,
      totalScore,
      averageScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
      accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      recentGames: players.slice(0, 10).map((p) => ({
        quizTitle: p.session.quiz.title,
        score: p.score,
        date: p.joinedAt,
      })),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    throw error;
  }
};
