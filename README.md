# 🎮 QuizFlow - Plataforma Interativa de Aprendizado Gamificado

![QuizFlow Banner](https://img.shields.io/badge/QuizFlow-Education%20Platform-8b5cf6?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

Uma plataforma web/mobile revolucionária que combina quizzes educativos com gamificação intensa, transformando o aprendizado em uma experiência competitiva e colaborativa.

## 🚀 Deploy Rápido (Hospedagem Gratuita)

**Deploy com 1 clique:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dodomatad/vibe-code&root-directory=apps/frontend)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dodomatad/vibe-code)
[![Run on Replit](https://replit.com/badge/github/dodomatad/vibe-code)](https://replit.com/new/github/dodomatad/vibe-code)

**Guias de deploy:**
- 📘 [Deploy Completo](DEPLOY.md) - Vercel + Render (Recomendado)
- ⚡ [Deploy Simples](DEPLOY-SIMPLES.md) - Replit, Glitch, Railway
- 🎯 [Deploy 1-Click](DEPLOY-1-CLICK.md) - Botões e automação

## ✨ Principais Features (MVP)

### 🎯 Para Professores
- ✅ Criação rápida de quizzes com múltiplas questões
- ✅ Editor visual com tipos de pergunta (múltipla escolha, verdadeiro/falso)
- ✅ Sistema de PIN para compartilhar jogos
- ✅ Acompanhamento em tempo real do desempenho dos alunos
- ✅ Dashboard com resultados e estatísticas

### 🎓 Para Estudantes
- ✅ Entrar em jogos usando PIN (sem necessidade de cadastro)
- ✅ Avatares personalizáveis (emojis)
- ✅ Competição em tempo real
- ✅ Sistema de pontuação baseado em velocidade e precisão
- ✅ Ranking ao vivo durante o jogo

### 🔥 Funcionalidades Técnicas
- ✅ Comunicação em tempo real via WebSocket (Socket.IO)
- ✅ Autenticação JWT para professores
- ✅ Sistema de salas de jogo
- ✅ Cálculo automático de pontuação
- ✅ Persistência de resultados no banco de dados

## 🏗️ Arquitetura

```
quizflow/
├── apps/
│   ├── frontend/          # Next.js 14 + React + TypeScript
│   │   ├── src/
│   │   │   ├── app/       # App Router (pages)
│   │   │   ├── components/
│   │   │   ├── lib/       # API & Socket clients
│   │   │   ├── store/     # Zustand state management
│   │   │   └── styles/    # Tailwind CSS
│   │   └── package.json
│   │
│   └── backend/           # Node.js + Express + TypeScript
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── socket/    # Socket.IO handlers
│       │   └── utils/
│       ├── prisma/        # Database schema & migrations
│       └── package.json
│
└── packages/
    └── shared/            # Shared types & utilities
        ├── src/
        │   └── types.ts   # TypeScript interfaces
        └── package.json
```

## 🚀 Stack Tecnológica

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **Validation**: Zod

### DevOps
- **Monorepo**: npm workspaces
- **Package Manager**: npm
- **Database Migrations**: Prisma Migrate

## 📦 Instalação e Setup

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd quizflow
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Backend

#### 3.1 Configure as variáveis de ambiente
```bash
cd apps/backend
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/quizflow?schema=public"
JWT_SECRET="seu-segredo-super-secreto-mude-em-producao"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### 3.2 Configure o banco de dados
```bash
# Gere o Prisma Client
npm run prisma:generate

# Execute as migrations
npm run prisma:migrate

# (Opcional) Popule o banco com dados de exemplo
npm run prisma:seed
```

**Dados de exemplo criados pelo seed:**
- **Professor**: `teacher@quizflow.com` / `password123`
- **Estudante**: `student@quizflow.com` / `password123`
- 1 Quiz de Matemática Básica com 3 questões
- Power-ups e conquistas básicas

### 4. Configure o Frontend

```bash
cd apps/frontend
```

Crie `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 🎯 Executar o Projeto

### Modo Desenvolvimento (Recomendado)

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

**Ou execute ambos simultaneamente:**
```bash
npm run dev
```

### Acessar a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Prisma Studio** (visualizar DB): `npm run prisma:studio --workspace=apps/backend`

## 📚 Guia de Uso

### Para Professores

1. **Cadastro/Login**
   - Acesse http://localhost:3000/login
   - Crie uma conta ou use `teacher@quizflow.com` / `password123`

2. **Criar um Quiz**
   - No dashboard, clique em "Criar Quiz"
   - Adicione título, descrição e perguntas
   - Configure tempo limite e pontos por pergunta
   - Salve o quiz

3. **Iniciar um Jogo**
   - Selecione um quiz
   - Clique em "Iniciar Jogo"
   - Compartilhe o PIN com os alunos
   - Aguarde os alunos entrarem
   - Inicie o jogo

4. **Acompanhar Resultados**
   - Veja o ranking ao vivo durante o jogo
   - Acesse estatísticas detalhadas ao final
   - Exporte relatórios (futuro)

### Para Estudantes

1. **Entrar em um Jogo**
   - Acesse http://localhost:3000/join
   - Digite o PIN fornecido pelo professor
   - Escolha um avatar
   - Digite seu nome
   - Entre no jogo!

2. **Jogar**
   - Aguarde o início do jogo
   - Responda as perguntas o mais rápido possível
   - Acompanhe sua pontuação no ranking
   - Veja os resultados finais

## 🎮 Modos de Jogo (Roadmap)

- ✅ **Clássico**: Modo tradicional estilo Kahoot
- ⏳ **Cooperativo**: Times vs Boss
- ⏳ **Battle Royale**: Eliminação progressiva
- ⏳ **Missão**: Narrativa linear
- ⏳ **Duelo**: 1v1
- ⏳ **Revezamento**: Times alternados

## 🔌 API Endpoints

### Autenticação
```
POST   /api/auth/register    # Cadastro
POST   /api/auth/login       # Login
GET    /api/auth/me          # Obter usuário logado
```

### Quizzes
```
POST   /api/quiz             # Criar quiz
GET    /api/quiz             # Listar quizzes
GET    /api/quiz/:id         # Obter quiz por ID
PUT    /api/quiz/:id         # Atualizar quiz
DELETE /api/quiz/:id         # Deletar quiz
```

### Jogos
```
POST   /api/game/session          # Criar sessão de jogo
GET    /api/game/session/:pin     # Obter sessão por PIN
GET    /api/game/results/:id      # Obter resultados
```

### WebSocket Events
```javascript
// Client → Server
JOIN_GAME          // Entrar no jogo
START_GAME         # Iniciar jogo (host)
SUBMIT_ANSWER      // Enviar resposta
LEAVE_GAME         // Sair do jogo

// Server → Client
PLAYER_JOINED      // Jogador entrou
GAME_STARTED       // Jogo iniciou
QUESTION_STARTED   // Nova questão
ANSWER_SUBMITTED   // Resposta recebida
QUESTION_ENDED     // Questão encerrou
GAME_FINISHED      // Jogo finalizado
```

## 🗂️ Modelos do Banco de Dados

### Principais Tabelas
- **User**: Professores e estudantes cadastrados
- **Quiz**: Quizzes criados
- **Question**: Perguntas dos quizzes
- **QuizOption**: Opções de resposta
- **GameSession**: Sessões de jogo ativas
- **Player**: Jogadores em uma sessão
- **PlayerAnswer**: Respostas dos jogadores
- **PowerUp**: Power-ups disponíveis
- **Achievement**: Conquistas do sistema

## 🎨 Customização

### Cores (Tailwind)
Edite `apps/frontend/tailwind.config.js`:
```javascript
colors: {
  primary: { ... },     // Roxo (padrão)
  secondary: { ... },   // Verde
  danger: { ... },      // Vermelho
}
```

### Avatares
Adicione mais emojis em `apps/frontend/src/app/join/page.tsx`:
```typescript
const AVATARS = ['🦊', '🐼', ...];
```

## 🚧 Próximos Passos (Roadmap)

### Fase 1 - MVP Completo ✅
- [x] Sistema de autenticação
- [x] CRUD de quizzes
- [x] Jogo em tempo real
- [x] Sistema de pontuação
- [x] Interface básica

### Fase 2 - Gamificação Avançada 🚀
- [ ] Sistema completo de avatares (customização)
- [ ] Power-ups funcionais (50/50, Escudo, etc.)
- [ ] Conquistas e badges
- [ ] Sistema de níveis e XP
- [ ] Rankings semanais/mensais

### Fase 3 - Features Avançadas 🎯
- [ ] IA para geração de perguntas
- [ ] Perguntas com imagens/vídeo/áudio
- [ ] Modo História/RPG
- [ ] Análise de desempenho com gráficos
- [ ] Exportação de relatórios (PDF)

### Fase 4 - Social & Multiplayer 🌍
- [ ] Competições entre turmas/escolas
- [ ] Desafios entre amigos
- [ ] Modo treino
- [ ] Feed de atividades
- [ ] Eventos globais

### Fase 5 - Mobile & Deploy 📱
- [ ] App mobile (React Native)
- [ ] PWA otimizado
- [ ] Deploy em produção (Vercel + Railway)
- [ ] CDN para assets
- [ ] Monitoramento e logs

## 🧪 Testes

```bash
# Backend
cd apps/backend
npm test

# Frontend
cd apps/frontend
npm test
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: support@quizflow.com
- 📚 Documentação: [docs.quizflow.com](https://docs.quizflow.com)
- 💬 Discord: [discord.gg/quizflow](https://discord.gg/quizflow)

## 🙏 Agradecimentos

- Inspirado em plataformas como Kahoot, Quizizz e Gimkit
- Comunidade Next.js e Prisma
- Todos os educadores que tornam o aprendizado divertido!

---

**Desenvolvido com ❤️ para revolucionar a educação**
