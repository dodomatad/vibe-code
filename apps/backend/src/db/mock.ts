// Mock database for demonstration
import { User, Quiz, GameSession, Player, Question, QuizOption } from '@quizflow/shared';

// In-memory storage
export const mockDb = {
  users: [] as any[],
  quizzes: [] as any[],
  gameSessions: [] as any[],
  players: [] as any[],
  questions: [] as any[],
  options: [] as any[],
  answers: [] as any[],
};

// Seed initial data
const bcrypt = require('bcryptjs');

async function seedMockData() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  mockDb.users = [
    {
      id: 'teacher-1',
      email: 'teacher@quizflow.com',
      password: hashedPassword,
      name: 'Professor Silva',
      role: 'TEACHER',
      avatar: 'teacher-1',
      avatarClass: 'SCHOLAR',
      avatarSkin: 'default',
      level: 1,
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'student-1',
      email: 'student@quizflow.com',
      password: hashedPassword,
      name: 'João Estudante',
      role: 'STUDENT',
      avatar: 'student-1',
      avatarClass: 'SPEEDSTER',
      avatarSkin: 'default',
      level: 1,
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Create quiz
  const quiz = {
    id: 'quiz-1',
    title: 'Quiz de Matemática Básica',
    description: 'Teste seus conhecimentos em operações matemáticas fundamentais',
    teacherId: 'teacher-1',
    gameMode: 'CLASSIC',
    isPublic: true,
    isPremium: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockDb.quizzes.push(quiz);

  // Create questions
  const questions = [
    {
      id: 'q1',
      quizId: 'quiz-1',
      type: 'MULTIPLE_CHOICE',
      text: 'Quanto é 2 + 2?',
      timeLimit: 20,
      points: 100,
      difficulty: 'EASY',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q2',
      quizId: 'quiz-1',
      type: 'MULTIPLE_CHOICE',
      text: 'Qual é o resultado de 10 × 5?',
      timeLimit: 25,
      points: 150,
      difficulty: 'MEDIUM',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q3',
      quizId: 'quiz-1',
      type: 'MULTIPLE_CHOICE',
      text: 'Quanto é 144 ÷ 12?',
      timeLimit: 30,
      points: 200,
      difficulty: 'HARD',
      order: 3,
      explanation: 'Para dividir 144 por 12, podemos pensar: 12 × 12 = 144, então 144 ÷ 12 = 12',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  mockDb.questions.push(...questions);

  // Create options
  const options = [
    // Q1 options
    { id: 'q1-opt1', questionId: 'q1', text: '3', isCorrect: false, createdAt: new Date() },
    { id: 'q1-opt2', questionId: 'q1', text: '4', isCorrect: true, createdAt: new Date() },
    { id: 'q1-opt3', questionId: 'q1', text: '5', isCorrect: false, createdAt: new Date() },
    { id: 'q1-opt4', questionId: 'q1', text: '6', isCorrect: false, createdAt: new Date() },

    // Q2 options
    { id: 'q2-opt1', questionId: 'q2', text: '15', isCorrect: false, createdAt: new Date() },
    { id: 'q2-opt2', questionId: 'q2', text: '50', isCorrect: true, createdAt: new Date() },
    { id: 'q2-opt3', questionId: 'q2', text: '55', isCorrect: false, createdAt: new Date() },
    { id: 'q2-opt4', questionId: 'q2', text: '100', isCorrect: false, createdAt: new Date() },

    // Q3 options
    { id: 'q3-opt1', questionId: 'q3', text: '10', isCorrect: false, createdAt: new Date() },
    { id: 'q3-opt2', questionId: 'q3', text: '11', isCorrect: false, createdAt: new Date() },
    { id: 'q3-opt3', questionId: 'q3', text: '12', isCorrect: true, createdAt: new Date() },
    { id: 'q3-opt4', questionId: 'q3', text: '13', isCorrect: false, createdAt: new Date() },
  ];

  mockDb.options.push(...options);

  console.log('✅ Mock database seeded');
}

seedMockData();

export const mockPrisma = {
  user: {
    findUnique: async ({ where }: any) => {
      return mockDb.users.find((u) => u.id === where.id || u.email === where.email) || null;
    },
    create: async ({ data }: any) => {
      const user = { ...data, id: `user-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
      mockDb.users.push(user);
      return user;
    },
    update: async ({ where, data }: any) => {
      const index = mockDb.users.findIndex((u) => u.id === where.id);
      if (index !== -1) {
        mockDb.users[index] = { ...mockDb.users[index], ...data, updatedAt: new Date() };
        return mockDb.users[index];
      }
      return null;
    },
  },
  quiz: {
    findMany: async ({ where, include }: any = {}) => {
      let quizzes = mockDb.quizzes;
      if (where?.teacherId) {
        quizzes = quizzes.filter((q) => q.teacherId === where.teacherId);
      }
      if (where?.isPublic !== undefined) {
        quizzes = quizzes.filter((q) => q.isPublic === where.isPublic);
      }

      return quizzes.map((q) => ({
        ...q,
        teacher: mockDb.users.find((u) => u.id === q.teacherId),
        _count: { questions: mockDb.questions.filter((qu) => qu.quizId === q.id).length },
      }));
    },
    findUnique: async ({ where, include }: any) => {
      const quiz = mockDb.quizzes.find((q) => q.id === where.id);
      if (!quiz) return null;

      const questions = mockDb.questions
        .filter((q) => q.quizId === quiz.id)
        .map((q) => ({
          ...q,
          options: mockDb.options.filter((o) => o.questionId === q.id),
        }));

      return {
        ...quiz,
        teacher: mockDb.users.find((u) => u.id === quiz.teacherId),
        questions,
      };
    },
    create: async ({ data, include }: any) => {
      const quizId = `quiz-${Date.now()}`;
      const quiz = {
        id: quizId,
        title: data.title,
        description: data.description,
        teacherId: data.teacherId,
        gameMode: data.gameMode || 'CLASSIC',
        isPublic: data.isPublic || false,
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.quizzes.push(quiz);

      if (data.questions?.create) {
        for (const [index, q] of data.questions.create.entries()) {
          const questionId = `q-${Date.now()}-${index}`;
          const question = {
            id: questionId,
            quizId,
            ...q,
            order: index + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          delete question.options;
          mockDb.questions.push(question);

          if (q.options?.create) {
            for (const [optIndex, opt] of q.options.create.entries()) {
              mockDb.options.push({
                id: `opt-${Date.now()}-${index}-${optIndex}`,
                questionId,
                ...opt,
                createdAt: new Date(),
              });
            }
          }
        }
      }

      return mockPrisma.quiz.findUnique({ where: { id: quizId }, include });
    },
    update: async ({ where, data }: any) => {
      const index = mockDb.quizzes.findIndex((q) => q.id === where.id);
      if (index !== -1) {
        mockDb.quizzes[index] = { ...mockDb.quizzes[index], ...data, updatedAt: new Date() };
        return mockPrisma.quiz.findUnique({ where: { id: where.id } });
      }
      return null;
    },
    delete: async ({ where }: any) => {
      const index = mockDb.quizzes.findIndex((q) => q.id === where.id);
      if (index !== -1) {
        const quiz = mockDb.quizzes[index];
        mockDb.quizzes.splice(index, 1);
        return quiz;
      }
      return null;
    },
  },
  question: {
    findUnique: async ({ where, include }: any) => {
      const question = mockDb.questions.find((q) => q.id === where.id);
      if (!question) return null;

      return {
        ...question,
        options: mockDb.options.filter((o) => o.questionId === question.id),
      };
    },
  },
  gameSession: {
    findUnique: async ({ where, include }: any) => {
      const session = mockDb.gameSessions.find((s) => s.id === where.id || s.pin === where.pin);
      if (!session) return null;

      const quiz = await mockPrisma.quiz.findUnique({ where: { id: session.quizId }, include: { questions: true } });
      const players = mockDb.players.filter((p) => p.sessionId === session.id).map((p) => ({
        ...p,
        answers: mockDb.answers.filter((a) => a.playerId === p.id),
      }));

      return { ...session, quiz, players };
    },
    create: async ({ data, include }: any) => {
      const session = {
        ...data,
        id: `session-${Date.now()}`,
        createdAt: new Date(),
      };
      mockDb.gameSessions.push(session);
      return mockPrisma.gameSession.findUnique({ where: { id: session.id }, include });
    },
    update: async ({ where, data }: any) => {
      const index = mockDb.gameSessions.findIndex((s) => s.id === where.id);
      if (index !== -1) {
        mockDb.gameSessions[index] = { ...mockDb.gameSessions[index], ...data };
        return mockPrisma.gameSession.findUnique({ where: { id: where.id } });
      }
      return null;
    },
  },
  player: {
    create: async ({ data }: any) => {
      const player = {
        ...data,
        id: `player-${Date.now()}`,
        score: 0,
        isConnected: true,
        joinedAt: new Date(),
      };
      mockDb.players.push(player);
      return player;
    },
    update: async ({ where, data }: any) => {
      const index = mockDb.players.findIndex((p) => p.id === where.id);
      if (index !== -1) {
        if (data.score?.increment) {
          mockDb.players[index].score += data.score.increment;
        } else {
          mockDb.players[index] = { ...mockDb.players[index], ...data };
        }
        return mockDb.players[index];
      }
      return null;
    },
    findMany: async ({ where }: any = {}) => {
      let players = mockDb.players;
      if (where?.userId) {
        players = players.filter((p) => p.userId === where.userId);
      }
      return players.map((p) => ({
        ...p,
        answers: mockDb.answers.filter((a) => a.playerId === p.id),
        session: mockDb.gameSessions.find((s) => s.id === p.sessionId),
      }));
    },
  },
  playerAnswer: {
    create: async ({ data }: any) => {
      const answer = {
        ...data,
        id: `answer-${Date.now()}`,
        timestamp: new Date(),
      };
      mockDb.answers.push(answer);
      return answer;
    },
  },
};
