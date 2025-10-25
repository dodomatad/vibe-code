# ⚡ Deploy com 1 Clique - QuizFlow

## 🚀 Deploy Instantâneo

Clique nos botões abaixo para fazer deploy automático:

---

## Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dodomatad/vibe-code&root-directory=apps/frontend&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_SOCKET_URL&envDescription=Backend%20URLs&project-name=quizflow&repository-name=quizflow)

**Após o deploy:**
1. Copie a URL gerada (ex: `https://quizflow.vercel.app`)
2. Guarde para configurar o backend

---

## Backend (Render)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dodomatad/vibe-code)

**Configure as variáveis:**
- `FRONTEND_URL`: URL do Vercel (copiada acima)
- `JWT_SECRET`: Qualquer string aleatória longa
- `NODE_ENV`: `production`

---

## Backend (Railway)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/dodomatad/vibe-code)

**Configure:**
- Root Directory: `apps/backend`
- Environment Variables: (mesmas do Render)

---

## Tudo em Um (Replit)

[![Run on Replit](https://replit.com/badge/github/dodomatad/vibe-code)](https://replit.com/new/github/dodomatad/vibe-code)

**Instruções:**
1. Clique no botão
2. Fork o projeto
3. Clique em "Run"
4. Pronto! URL gerada automaticamente

---

## 📝 Configuração Pós-Deploy

### Passo 1: Atualizar URLs

**No Vercel (Environment Variables):**
- `NEXT_PUBLIC_API_URL` = URL do Render/Railway
- `NEXT_PUBLIC_SOCKET_URL` = URL do Render/Railway

**No Render/Railway (Environment Variables):**
- `FRONTEND_URL` = URL do Vercel

### Passo 2: Redeploy

Após atualizar as variáveis:
- **Vercel:** Deploy automático
- **Render:** Redeploy manual necessário

---

## 🎮 Testar

Acesse sua URL do Vercel:
```
https://SEU-APP.vercel.app
```

**Login:**
- Email: `teacher@quizflow.com`
- Senha: `password123`

---

## 🆘 Problemas?

### Backend não responde
1. Verifique se o Render está acordado (primeiro acesso demora ~30s)
2. Teste: `https://seu-backend.onrender.com/health`
3. Verifique logs no Render Dashboard

### Frontend não conecta
1. Confirme as variáveis de ambiente no Vercel
2. Verifique se o backend URL está correto
3. Teste em modo anônimo (limpar cache)

### WebSocket não funciona
1. Certifique-se que está usando HTTPS (não HTTP)
2. Verifique CORS no backend (já configurado)
3. Teste em navegador diferente

---

## 🔄 Atualizar Código

**Método 1: Git Push**
```bash
git add .
git commit -m "Update"
git push
```
Deploy automático em ambas plataformas!

**Método 2: Replit**
Edite diretamente no Replit e clique "Run"

---

## 💡 Dicas

### Manter Ativo (Render)
Use [Cron-job.org](https://cron-job.org):
1. Crie conta grátis
2. Adicione job: `https://seu-backend.onrender.com/health`
3. Intervalo: 5 minutos

### Domínio Customizado
**Vercel:**
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS

**Render:**
1. Settings → Custom Domain
2. Adicione domínio
3. Configure DNS (CNAME ou A record)

---

## 📊 Monitoramento

### Uptime
- **Render:** Dashboard mostra status
- **Vercel:** Analytics built-in

### Logs
- **Render:** Logs tab (real-time)
- **Vercel:** Functions tab

---

## ✅ Checklist Final

- [ ] Frontend deployed no Vercel
- [ ] Backend deployed no Render/Railway
- [ ] Variáveis de ambiente configuradas
- [ ] URLs atualizadas
- [ ] `/health` endpoint respondendo
- [ ] Login funcionando
- [ ] Criar quiz funcionando
- [ ] Jogo completo testado
- [ ] Compartilhado! 🎉

---

**🎊 Parabéns! Sua plataforma está online!**

Compartilhe com o mundo: `https://SUA-URL.vercel.app`

---

## 🌟 Próximos Passos

1. **Customize:** Mude cores, logos, textos
2. **Expanda:** Adicione mais features do roadmap
3. **Compartilhe:** Mostre para professores e escolas
4. **Contribua:** Abra PRs com melhorias
5. **Monetize:** Adicione planos premium (opcional)

---

## 📞 Suporte

- 📧 Issues: https://github.com/dodomatad/vibe-code/issues
- 📚 Docs completos: Ver `DEPLOY.md` e `DEPLOY-SIMPLES.md`
- 💬 Comunidade: (adicionar Discord/Slack se tiver)

**Feito com ❤️ usando Claude Code**
