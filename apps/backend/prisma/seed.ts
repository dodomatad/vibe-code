import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@quizflow.com' },
    update: {},
    create: {
      email: 'teacher@quizflow.com',
      password: hashedPassword,
      name: 'Professor Silva',
      role: 'TEACHER',
      avatar: 'teacher-1',
      avatarClass: 'SCHOLAR',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@quizflow.com' },
    update: {},
    create: {
      email: 'student@quizflow.com',
      password: hashedPassword,
      name: 'João Estudante',
      role: 'STUDENT',
      avatar: 'student-1',
      avatarClass: 'SPEEDSTER',
    },
  });

  console.log('✅ Users created:', { teacher, student });

  // Create sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Quiz de Matemática Básica',
      description: 'Teste seus conhecimentos em operações matemáticas fundamentais',
      teacherId: teacher.id,
      gameMode: 'CLASSIC',
      isPublic: true,
      questions: {
        create: [
          {
            type: 'MULTIPLE_CHOICE',
            text: 'Quanto é 2 + 2?',
            timeLimit: 20,
            points: 100,
            difficulty: 'EASY',
            order: 1,
            options: {
              create: [
                { text: '3', isCorrect: false },
                { text: '4', isCorrect: true },
                { text: '5', isCorrect: false },
                { text: '6', isCorrect: false },
              ],
            },
          },
          {
            type: 'MULTIPLE_CHOICE',
            text: 'Qual é o resultado de 10 × 5?',
            timeLimit: 25,
            points: 150,
            difficulty: 'MEDIUM',
            order: 2,
            options: {
              create: [
                { text: '15', isCorrect: false },
                { text: '50', isCorrect: true },
                { text: '55', isCorrect: false },
                { text: '100', isCorrect: false },
              ],
            },
          },
          {
            type: 'MULTIPLE_CHOICE',
            text: 'Quanto é 144 ÷ 12?',
            timeLimit: 30,
            points: 200,
            difficulty: 'HARD',
            order: 3,
            explanation: 'Para dividir 144 por 12, podemos pensar: 12 × 12 = 144, então 144 ÷ 12 = 12',
            options: {
              create: [
                { text: '10', isCorrect: false },
                { text: '11', isCorrect: false },
                { text: '12', isCorrect: true },
                { text: '13', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log('✅ Quiz created:', quiz.title);

  // Create Power-ups
  const powerUps = await prisma.powerUp.createMany({
    data: [
      {
        type: 'FIFTY_FIFTY',
        name: '50/50',
        description: 'Elimina duas respostas incorretas',
        icon: '✂️',
        maxUses: 3,
      },
      {
        type: 'EXTRA_TIME',
        name: 'Tempo Extra',
        description: 'Adiciona 10 segundos ao cronômetro',
        icon: '⏱️',
        maxUses: 2,
      },
      {
        type: 'SHIELD',
        name: 'Escudo',
        description: 'Protege contra perda de pontos',
        icon: '🛡️',
        maxUses: 1,
      },
      {
        type: 'VISION',
        name: 'Visão',
        description: 'Mostra a distribuição de respostas da turma',
        icon: '👁️',
        maxUses: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Power-ups created');

  // Create Achievements
  const achievements = await prisma.achievement.createMany({
    data: [
      {
        name: 'Primeira Vitória',
        description: 'Vença seu primeiro quiz',
        icon: '🏆',
        rarity: 'COMMON',
        points: 10,
      },
      {
        name: 'Sequência Perfeita',
        description: 'Acerte 5 perguntas seguidas',
        icon: '🔥',
        rarity: 'RARE',
        points: 25,
      },
      {
        name: 'Mestre da Velocidade',
        description: 'Responda em menos de 5 segundos',
        icon: '⚡',
        rarity: 'EPIC',
        points: 50,
      },
      {
        name: 'Lenda QuizFlow',
        description: 'Alcance 10.000 pontos totais',
        icon: '👑',
        rarity: 'LEGENDARY',
        points: 100,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Achievements created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
