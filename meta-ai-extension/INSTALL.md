# 📦 Instalação - Meta.ai Bulk Image Generator

## ⚡ Instalação Rápida

### 1. Baixar Extensão

A extensão está em: `/home/user/vibe-code/meta-ai-extension/`

### 2. Gerar Ícones (OBRIGATÓRIO)

**Opção A: Gerar Automaticamente**

1. Abra no navegador: `create-icons.html`
2. Clique em "🎨 Gerar Ícones"
3. Baixe os 3 arquivos (icon16.png, icon48.png, icon128.png)
4. Mova para a pasta `icons/`

**Opção B: Criar Manualmente**

Use qualquer editor de imagem para criar 3 imagens PNG:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Salve na pasta `icons/`

### 3. Instalar no Navegador

#### Chrome / Edge / Brave / Opera

1. **Abra o gerenciador de extensões:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Opera: `opera://extensions/`

2. **Ative o "Modo do desenvolvedor"**
   - Toggle no canto superior direito

3. **Carregue a extensão:**
   - Clique em "Carregar sem compactação" ou "Load unpacked"
   - Selecione a pasta `meta-ai-extension`

4. **Fixe na barra de ferramentas:**
   - Clique no ícone de quebra-cabeça 🧩
   - Encontre "Meta.ai Bulk Image Generator"
   - Clique no alfinete 📌

### 4. Verificar Instalação

1. Clique no ícone da extensão
2. Você deve ver a interface com:
   - Campo de texto para prompts
   - Botões de controle
   - Barra de progresso

3. Abra: https://www.meta.ai/media
4. No console (F12), você deve ver:
   ```
   🎨 Meta.ai Bulk Generator - Content script loaded
   🎨 Bulk Generator Ready!
   ```

---

## 🔧 Configuração Inicial

### Permissões

A extensão precisa de:
- ✅ Acesso a `meta.ai`
- ✅ Permissão de download
- ✅ Acesso a armazenamento local

Todas as permissões são aprovadas automaticamente na instalação.

### Primeira Execução

1. **Teste básico:**
   - Adicione 1 prompt simples: "A beautiful sunset"
   - Clique em "Carregar Lista"
   - Clique em "Iniciar Geração"

2. **Verifique:**
   - ✅ Prompt foi digitado no Meta.ai
   - ✅ Imagens foram geradas
   - ✅ Download iniciou
   - ✅ Arquivos em `Downloads/meta-ai-images/`

---

## 🗂️ Estrutura de Arquivos

Após instalação, você terá:

```
meta-ai-extension/
├── manifest.json         # ✅ Configuração
├── popup.html           # ✅ Interface
├── styles.css           # ✅ Estilos
├── scripts/
│   ├── popup.js        # ✅ Lógica UI
│   ├── content.js      # ✅ Automação
│   └── background.js   # ✅ Downloads
├── icons/
│   ├── icon16.png      # ⚠️ GERAR
│   ├── icon48.png      # ⚠️ GERAR
│   └── icon128.png     # ⚠️ GERAR
├── README.md           # 📚 Docs completa
├── QUICKSTART.md       # ⚡ Guia rápido
├── INSTALL.md          # 📦 Este arquivo
└── create-icons.html   # 🎨 Gerador de ícones
```

---

## 🐛 Troubleshooting

### Erro: "Extension is not loaded"

**Causa:** Ícones não foram criados

**Solução:**
1. Abra `create-icons.html`
2. Gere os ícones
3. Mova para pasta `icons/`
4. Recarregue a extensão

### Erro: "Could not load manifest"

**Causa:** `manifest.json` com erro

**Solução:**
1. Valide o JSON: https://jsonlint.com
2. Verifique se todos os arquivos existem
3. Recarregue a extensão

### Extensão não aparece na barra

**Solução:**
1. Clique no ícone de quebra-cabeça 🧩
2. Encontre a extensão
3. Clique no alfinete 📌

### Content script não carrega

**Solução:**
1. Vá para: `chrome://extensions/`
2. Encontre a extensão
3. Clique em "Recarregar"
4. Recarregue a aba do Meta.ai (F5)

---

## 🔄 Atualizar Extensão

### Método 1: Automático (Git)

```bash
cd meta-ai-extension
git pull origin main
```

Depois:
1. Vá para `chrome://extensions/`
2. Clique em "Recarregar" na extensão

### Método 2: Manual

1. Baixe nova versão
2. Substitua arquivos antigos
3. Recarregue extensão no navegador

---

## 🗑️ Desinstalar

1. Vá para `chrome://extensions/`
2. Encontre "Meta.ai Bulk Image Generator"
3. Clique em "Remover"
4. Confirme

Dados salvos (prompts, progresso) serão mantidos no armazenamento local do navegador.

Para remover completamente:
1. Desinstale a extensão
2. Delete a pasta `meta-ai-extension`
3. Delete `Downloads/meta-ai-images/`

---

## 📊 Checklist de Instalação

- [ ] Pasta `meta-ai-extension` baixada
- [ ] Ícones gerados (3 arquivos PNG)
- [ ] Ícones movidos para pasta `icons/`
- [ ] Extensão carregada no navegador
- [ ] "Modo desenvolvedor" ativado
- [ ] Extensão fixada na barra de ferramentas
- [ ] Teste realizado com 1 prompt
- [ ] Download funcionando
- [ ] Pasta `meta-ai-images` criada

---

## 🎓 Próximos Passos

Após instalação:

1. **Leia:** [README.md](README.md) - Documentação completa
2. **Comece:** [QUICKSTART.md](QUICKSTART.md) - Guia rápido
3. **Use:** Adicione seus prompts e gere imagens!

---

## 💡 Dicas

### Performance

- **Use Chrome** para melhor compatibilidade
- **Mantenha aba visível** durante geração
- **Não feche o popup** enquanto processar

### Segurança

- **Código aberto:** Todos os arquivos são visíveis
- **Sem telemetria:** Nenhum dado é enviado
- **Local apenas:** Tudo roda no seu navegador

### Produtividade

- **Crie templates** de prompts
- **Organize por pastas** temáticas
- **Use atalhos:** Ctrl+Shift+P (popup)

---

## 📞 Suporte

**Problemas na instalação?**

1. Verifique os pré-requisitos
2. Siga o troubleshooting
3. Veja os logs no console (F12)
4. Abra uma issue no GitHub

---

## ✅ Instalação Completa!

**Parabéns!** 🎉

Você está pronto para:
- ✨ Gerar centenas de imagens automaticamente
- 📥 Baixar tudo com 1 clique
- ⚡ Economizar horas de trabalho manual

**Comece agora:**
```
1. Abra: meta.ai/media
2. Clique no ícone da extensão
3. Cole seus prompts
4. Clique em "Iniciar"
5. Relaxe! ☕
```

---

**Happy generating! 🎨✨**
