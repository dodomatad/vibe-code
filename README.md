# Vibe Code

Uma plataforma de desenvolvimento de aplicativos web com IA, similar ao Lovable. Construa apps incriveis usando linguagem natural.

## Features

- **Editor Visual com IA** - Chat com IA para gerar e modificar codigo automaticamente
- **Geracao de Codigo por Prompts** - Descreva o que voce quer e a IA cria
- **Preview em Tempo Real** - Veja as mudancas instantaneamente com Sandpack
- **Deploy Automatico** - Publique com um clique usando Vercel
- **Integracao com Supabase** - Backend completo com auth, database e storage
- **Autenticacao Pronta** - Login com email/senha ou GitHub OAuth
- **Componentes UI (shadcn)** - Biblioteca de componentes moderna
- **Historico de Versoes** - Salve e restaure versoes do projeto
- **Colaboracao em Equipe** - Trabalhe em tempo real com outros usuarios
- **GitHub Sync** - Sincronize projetos com repositorios GitHub

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Editor**: Monaco Editor
- **Preview**: Sandpack (CodeSandbox)
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **AI**: OpenAI GPT-4
- **Deploy**: Vercel API
- **State**: Zustand

## Instalacao

1. Clone o repositorio:
```bash
git clone https://github.com/seu-usuario/vibe-code.git
cd vibe-code
```

2. Instale as dependencias:
```bash
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha o `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# OpenAI
OPENAI_API_KEY=sua_api_key_openai

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret

# Vercel Deploy (opcional)
VERCEL_TOKEN=seu_vercel_token
VERCEL_TEAM_ID=seu_team_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Configure o Supabase:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute o SQL em `supabase/migrations/001_initial_schema.sql`
   - Configure o OAuth do GitHub nas settings do Supabase

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse `http://localhost:3000`

## Estrutura do Projeto

```
vibe-code/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Paginas de autenticacao
│   │   ├── (dashboard)/       # Dashboard e editor
│   │   ├── api/               # API routes
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── editor/            # Componentes do editor
│   │   ├── providers/         # Context providers
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilitarios e configuracoes
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # SQL migrations
└── public/                    # Assets estaticos
```

## Configuracao do Supabase

### Database Schema

O schema inclui as seguintes tabelas:
- `profiles` - Perfis de usuarios
- `projects` - Projetos criados
- `project_files` - Arquivos dos projetos
- `project_versions` - Historico de versoes
- `project_collaborators` - Colaboradores
- `chat_messages` - Mensagens do chat com IA
- `deployments` - Historico de deploys

### Row Level Security

Todas as tabelas tem RLS configurado para garantir que:
- Usuarios so veem seus proprios dados
- Projetos publicos sao visiveis para todos
- Colaboradores tem acesso baseado em role (owner/editor/viewer)

### Realtime

As seguintes tabelas tem Realtime habilitado:
- `project_files` - Sincronizacao de arquivos
- `chat_messages` - Mensagens em tempo real
- `project_collaborators` - Presenca de usuarios

## API Routes

### `/api/chat`
- POST: Envia mensagem para a IA e recebe codigo gerado

### `/api/deploy`
- POST: Inicia deploy no Vercel
- GET: Verifica status do deployment

### `/api/github`
- POST: Cria repositorio ou faz push

### `/api/versions`
- GET: Lista versoes do projeto
- POST: Cria nova versao
- PUT: Restaura versao anterior

## Deploy

### Vercel (Recomendado)

1. Conecte seu repositorio ao Vercel
2. Configure as variaveis de ambiente
3. Deploy automatico a cada push

### Docker

```dockerfile
# Em breve
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

## Roadmap

- [ ] Suporte a mais frameworks (Vue, Svelte)
- [ ] Templates personalizados
- [ ] Marketplace de componentes
- [ ] Integracao com mais provedores de IA
- [ ] App mobile (React Native)
- [ ] Self-hosted option
- [ ] Plugins/extensoes

---

Feito com amor e IA
