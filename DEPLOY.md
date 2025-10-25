# 🚀 Guia de Deploy Gratuito - QuizFlow

Este guia mostra como fazer deploy **100% GRATUITO** da plataforma QuizFlow usando Vercel (frontend) e Render (backend).

---

## 📋 Pré-requisitos

- Conta no GitHub (gratuita)
- Conta no Vercel (gratuita) - https://vercel.com
- Conta no Render (gratuita) - https://render.com

---

## 🎯 Opção 1: Deploy Rápido (Recomendado)

### PASSO 1: Push para GitHub

```bash
# Já feito! Seu código está em:
# https://github.com/dodomatad/vibe-code
```

### PASSO 2: Deploy do Backend (Render)

1. **Acesse:** https://render.com
2. **Clique em:** "New +" → "Web Service"
3. **Conecte seu repositório GitHub:** `dodomatad/vibe-code`
4. **Configure:**
   - **Name:** `quizflow-backend`
   - **Root Directory:** `apps/backend`
   - **Environment:** `Node`
   - **Build Command:**
     ```
     cd ../.. && npm install && npm run build --workspace=packages/shared && cd apps/backend
     ```
   - **Start Command:**
     ```
     npm start
     ```
   - **Plan:** `Free`

5. **Adicione variáveis de ambiente:**
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `quizflow-secret-key-2024-production`
   - `JWT_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = `https://SEU-APP.vercel.app` (preencher depois)

6. **Clique em:** "Create Web Service"

7. **Aguarde o deploy** (3-5 minutos)

8. **Copie a URL gerada:** `https://quizflow-backend-XXXX.onrender.com`

### PASSO 3: Deploy do Frontend (Vercel)

1. **Acesse:** https://vercel.com
2. **Clique em:** "Add New..." → "Project"
3. **Import seu repositório:** `dodomatad/vibe-code`
4. **Configure:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/frontend`
   - **Build Command:**
     ```
     cd ../.. && npm install && npm run build --workspace=packages/shared && cd apps/frontend && npm run build
     ```
   - **Output Directory:** `.next`

5. **Adicione variáveis de ambiente:**
   - `NEXT_PUBLIC_API_URL` = `https://quizflow-backend-XXXX.onrender.com` (URL do Render)
   - `NEXT_PUBLIC_SOCKET_URL` = `https://quizflow-backend-XXXX.onrender.com` (mesma URL)

6. **Clique em:** "Deploy"

7. **Aguarde o deploy** (2-3 minutos)

8. **Sua aplicação estará em:** `https://vibe-code.vercel.app`

### PASSO 4: Atualizar FRONTEND_URL no Render

1. **Volte para o Render**
2. **Vá em:** Environment → Edit
3. **Atualize:** `FRONTEND_URL` = `https://vibe-code.vercel.app`
4. **Salve** e aguarde redeploy automático

---

## 🎮 TESTAR A APLICAÇÃO

Depois do deploy, acesse:

### Frontend (Vercel):
```
https://vibe-code.vercel.app
```

**Login de teste:**
- Email: `teacher@quizflow.com`
- Senha: `password123`

### Backend (Render):
```
https://quizflow-backend-XXXX.onrender.com/health
```

---

## 🔧 Opção 2: Deploy com Railway (Alternativa)

### Backend no Railway:

1. **Acesse:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Selecione:** `vibe-code`
4. **Settings:**
   - Root Directory: `apps/backend`
   - Build Command: `cd ../.. && npm install && cd apps/backend && npm start`
   - Start Command: `npm start`

5. **Variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=seu-secret-aqui`
   - `FRONTEND_URL=https://seu-app.vercel.app`

6. **Deploy** e copie a URL

---

## 🔧 Opção 3: Deploy com Netlify (Frontend alternativo)

1. **Acesse:** https://netlify.com
2. **Add new site** → **Import from Git**
3. **Selecione o repo**
4. **Build settings:**
   - Base directory: `apps/frontend`
   - Build command: `cd ../.. && npm install && npm run build --workspace=packages/shared && cd apps/frontend && npm run build`
   - Publish directory: `apps/frontend/.next`

5. **Environment variables:** (mesmo que Vercel)

---

## ⚠️ IMPORTANTE: Limitações do Plano Gratuito

### Render (Free Tier):
- ⏰ **Spin down após 15 min de inatividade**
- ⚡ Primeiro acesso pode demorar 30-60s (cold start)
- 💾 512 MB RAM
- 🌐 Domínio: `*.onrender.com`

### Vercel (Hobby):
- ✅ **Sempre ativo**
- ⚡ Deploy instantâneo
- 💾 Sem limite de RAM
- 🌐 Domínio: `*.vercel.app`

### Solução para Cold Start:
Use um serviço como [UptimeRobot](https://uptimerobot.com) para fazer ping no backend a cada 5 minutos e mantê-lo ativo.

---

## 📱 URLs Finais

Depois do deploy, você terá:

```
Frontend: https://vibe-code.vercel.app
Backend:  https://quizflow-backend-xxxx.onrender.com
API:      https://quizflow-backend-xxxx.onrender.com/api
Health:   https://quizflow-backend-xxxx.onrender.com/health
```

---

## 🐛 Troubleshooting

### Backend não responde:
1. Verifique os logs no Render
2. Confirme que as variáveis de ambiente estão corretas
3. Teste o endpoint `/health`
4. Aguarde o cold start (primeira vez demora)

### Frontend não conecta ao backend:
1. Verifique as variáveis `NEXT_PUBLIC_API_URL` no Vercel
2. Confirme que CORS está configurado (já está no código)
3. Verifique se o backend está rodando

### WebSocket não funciona:
1. Render suporta WebSocket ✅
2. Verifique a URL do socket
3. Confirme que está usando HTTPS (não HTTP)

---

## 🔄 Redeploy Automático

Ambas plataformas fazem redeploy automático quando você:
1. Faz push para o branch main
2. Merge pull request
3. Atualiza variáveis de ambiente (só Render)

---

## 💰 Upgrade (Opcional)

Se quiser melhorar:
- **Render Pro** ($7/mês): Sem cold start, mais RAM
- **Vercel Pro** ($20/mês): Mais builds, analytics
- **Railway** ($5/mês de crédito): Flexível e rápido

---

## 📞 Suporte

Problemas com deploy?
1. Verifique os logs na plataforma
2. Consulte a documentação:
   - [Vercel Docs](https://vercel.com/docs)
   - [Render Docs](https://render.com/docs)
3. Abra uma issue no GitHub

---

## ✅ Checklist Pós-Deploy

- [ ] Backend respondendo em `/health`
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Criar quiz funcionando
- [ ] Iniciar jogo funcionando
- [ ] Entrar com PIN funcionando
- [ ] WebSocket conectando
- [ ] Jogo completo funcionando

---

**🎉 Parabéns! Sua plataforma está no ar gratuitamente!**

Compartilhe com o mundo: `https://vibe-code.vercel.app`
