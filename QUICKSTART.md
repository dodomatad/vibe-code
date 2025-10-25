# 🚀 QuickStart Guide - QuizFlow

Este guia vai te ajudar a rodar o QuizFlow em menos de 5 minutos!

## Opção 1: Com Docker (Mais Fácil) 🐳

### 1. Instale Docker
- Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux: `sudo apt install docker.io docker-compose`

### 2. Inicie o banco de dados
```bash
docker-compose up -d
```

Isso vai iniciar PostgreSQL na porta 5432.

### 3. Configure e rode o projeto
```bash
# Instalar dependências
npm install

# Configurar backend
cd apps/backend
cp .env.example .env
# A URL do banco já está configurada para o Docker

# Gerar Prisma Client e criar banco
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Voltar para raiz
cd ../..

# Rodar tudo
npm run dev
```

### 4. Acesse
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Opção 2: PostgreSQL Local 💻

### 1. Instale PostgreSQL
- Windows: [Download PostgreSQL](https://www.postgresql.org/download/windows/)
- Mac: `brew install postgresql`
- Linux: `sudo apt install postgresql`

### 2. Crie o banco de dados
```bash
# Entre no PostgreSQL
psql -U postgres

# Crie o banco
CREATE DATABASE quizflow;
CREATE USER quizflow WITH PASSWORD 'quizflow123';
GRANT ALL PRIVILEGES ON DATABASE quizflow TO quizflow;
\q
```

### 3. Configure e rode
```bash
# Instalar dependências
npm install

# Configurar backend
cd apps/backend
cp .env.example .env

# Edite .env e configure:
# DATABASE_URL="postgresql://quizflow:quizflow123@localhost:5432/quizflow?schema=public"

# Gerar Prisma Client e criar tabelas
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Voltar para raiz
cd ../..

# Rodar tudo
npm run dev
```

## 🎮 Teste Rápido

### Como Professor:
1. Acesse http://localhost:3000/login
2. Login: `teacher@quizflow.com` / Senha: `password123`
3. Crie um quiz ou use o quiz de exemplo
4. Clique em "Iniciar Jogo"
5. Compartilhe o PIN

### Como Estudante:
1. Acesse http://localhost:3000/join
2. Digite o PIN do jogo
3. Escolha um avatar
4. Digite seu nome
5. Jogue!

## ⚠️ Problemas Comuns

### Porta 3000 já em uso
```bash
# Mude a porta do frontend
cd apps/frontend
# Rode: PORT=3001 npm run dev
```

### Porta 5432 já em uso (PostgreSQL)
```bash
# Pare o PostgreSQL local
sudo service postgresql stop

# Ou mude a porta no docker-compose.yml para "5433:5432"
```

### Erro de conexão com banco
```bash
# Verifique se o PostgreSQL está rodando
docker ps  # Se usando Docker
# ou
sudo service postgresql status  # Se instalado localmente

# Verifique a DATABASE_URL no .env
cat apps/backend/.env
```

### Erro "Prisma Client not found"
```bash
cd apps/backend
npm run prisma:generate
```

## 🔧 Comandos Úteis

```bash
# Ver logs do Docker
docker-compose logs -f

# Parar Docker
docker-compose down

# Resetar banco de dados
cd apps/backend
npm run prisma:migrate reset

# Visualizar banco com Prisma Studio
npm run prisma:studio --workspace=apps/backend

# Build para produção
npm run build
```

## 📚 Próximos Passos

Depois de rodar o projeto, veja:
- [README.md](README.md) - Documentação completa
- [API Endpoints](#) - Lista de todas as rotas
- [Roadmap](#) - Features futuras

## 💬 Precisa de Ajuda?

- Abra uma [Issue](https://github.com/seu-usuario/quizflow/issues)
- Veja a [Documentação Completa](README.md)
- Entre no [Discord](https://discord.gg/quizflow)

---

**Bom jogo! 🎮**
