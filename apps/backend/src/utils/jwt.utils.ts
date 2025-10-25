import jwt from 'jsonwebtoken';
import { UserRole } from '@quizflow/shared';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};
