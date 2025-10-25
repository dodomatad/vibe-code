// Using mock database for demo (no external DB required)
import { mockPrisma } from '../db/mock';

export const prisma = mockPrisma as any;
