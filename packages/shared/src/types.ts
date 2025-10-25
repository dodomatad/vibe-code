// User Types
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  OPEN_ENDED = 'OPEN_ENDED',
  MULTI_SELECT = 'MULTI_SELECT'
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  COOPERATIVE = 'COOPERATIVE',
  BATTLE_ROYAL = 'BATTLE_ROYAL',
  MISSION = 'MISSION',
  DUEL = 'DUEL',
  RELAY = 'RELAY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  timeLimit: number; // in seconds
  points: number;
  difficulty: Difficulty;
  options: QuizOption[];
  explanation?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  coverImage?: string;
  gameMode: GameMode;
  isPublic: boolean;
  isPremium: boolean;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

// Game Session Types
export enum GameStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  QUESTION_RESULTS = 'QUESTION_RESULTS',
  FINISHED = 'FINISHED'
}

export interface PlayerAnswer {
  playerId: string;
  questionId: string;
  selectedOptions: string[];
  timeToAnswer: number; // milliseconds
  isCorrect: boolean;
  pointsEarned: number;
  timestamp: Date;
}

export interface Player {
  id: string;
  userId?: string;
  sessionId: string;
  name: string;
  avatar: string;
  score: number;
  answers: PlayerAnswer[];
  isConnected: boolean;
  joinedAt: Date;
}

export interface GameSession {
  id: string;
  quizId: string;
  hostId: string;
  pin: string;
  status: GameStatus;
  currentQuestionIndex: number;
  players: Player[];
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
}

// Power-ups Types
export enum PowerUpType {
  FIFTY_FIFTY = 'FIFTY_FIFTY',
  EXTRA_TIME = 'EXTRA_TIME',
  SHIELD = 'SHIELD',
  VISION = 'VISION',
  DOUBLE_OR_NOTHING = 'DOUBLE_OR_NOTHING',
  COLLECTIVE_HELP = 'COLLECTIVE_HELP'
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  name: string;
  description: string;
  icon: string;
  uses: number;
}

export interface PlayerPowerUp {
  playerId: string;
  powerUp: PowerUp;
  remainingUses: number;
}

// Avatar Types
export enum AvatarClass {
  STRATEGIST = 'STRATEGIST',
  SPEEDSTER = 'SPEEDSTER',
  SCHOLAR = 'SCHOLAR'
}

export interface Avatar {
  id: string;
  name: string;
  class: AvatarClass;
  skin: string;
  accessories: string[];
  level: number;
  xp: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  points: number;
}

export interface PlayerAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

// League and Ranking Types
export enum LeagueTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER'
}

export interface Ranking {
  userId: string;
  username: string;
  avatar: string;
  totalPoints: number;
  gamesPlayed: number;
  winRate: number;
  tier: LeagueTier;
  position: number;
}

// WebSocket Event Types
export enum SocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // Lobby
  JOIN_GAME = 'join_game',
  LEAVE_GAME = 'leave_game',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',

  // Game Flow
  START_GAME = 'start_game',
  GAME_STARTED = 'game_started',
  NEXT_QUESTION = 'next_question',
  QUESTION_STARTED = 'question_started',

  // Answers
  SUBMIT_ANSWER = 'submit_answer',
  ANSWER_SUBMITTED = 'answer_submitted',
  QUESTION_ENDED = 'question_ended',
  SHOW_RESULTS = 'show_results',

  // Power-ups
  USE_POWER_UP = 'use_power_up',
  POWER_UP_USED = 'power_up_used',

  // Reactions
  SEND_REACTION = 'send_reaction',
  REACTION_RECEIVED = 'reaction_received',

  // End Game
  GAME_FINISHED = 'game_finished',

  // Errors
  ERROR = 'error'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Analytics Types
export interface QuizAnalytics {
  quizId: string;
  totalPlays: number;
  averageScore: number;
  averageTimePerQuestion: number;
  completionRate: number;
  difficultyDistribution: Record<Difficulty, number>;
  questionStats: QuestionStats[];
}

export interface QuestionStats {
  questionId: string;
  totalAnswers: number;
  correctAnswers: number;
  wrongAnswers: number;
  averageTime: number;
  accuracyRate: number;
}

export interface StudentProgress {
  userId: string;
  quizzesTaken: number;
  averageScore: number;
  strongAreas: string[];
  weakAreas: string[];
  progressOverTime: {
    date: Date;
    score: number;
  }[];
}
