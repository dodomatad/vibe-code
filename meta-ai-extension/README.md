# 🎨 Meta.ai Bulk Image Generator

Extensão do Chrome/Edge para gerar e baixar múltiplas imagens do Meta.ai automaticamente.

## ✨ Features

- ✅ **Geração em Massa** - Processa múltiplos prompts automaticamente
- 📥 **Download Automático** - Baixa todas as 4 imagens geradas
- ⏸️ **Controle Total** - Pause, continue ou pare a qualquer momento
- 📊 **Progresso em Tempo Real** - Acompanhe o status de cada prompt
- ⚙️ **Configurável** - Ajuste delay, download automático e mais
- 💾 **Salva Estado** - Continua de onde parou se fechar a extensão

---

## 📦 Instalação

### Chrome / Edge / Brave / Opera

1. **Baixe a extensão**
   ```bash
   # Clone ou baixe os arquivos da extensão
   cd meta-ai-extension
   ```

2. **Abra o gerenciador de extensões**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

3. **Ative o "Modo do desenvolvedor"**
   - Toggle no canto superior direito

4. **Clique em "Carregar sem compactação"**
   - Selecione a pasta `meta-ai-extension`

5. **Pronto!** 🎉
   - A extensão aparecerá na barra de ferramentas

---

## 🚀 Como Usar

### Passo 1: Prepare seus Prompts

1. **Clique no ícone da extensão** na barra de ferramentas
2. **Cole seus prompts** no campo de texto (um por linha)

Exemplo:
```
A beautiful sunset over the ocean with palm trees
A futuristic city with flying cars and neon lights
A cute cat playing with a ball of yarn
A mountain landscape with aurora borealis
```

3. **Clique em "📋 Carregar Lista"**

### Passo 2: Configure (Opcional)

- ✅ **Download automático** - Baixa as imagens automaticamente
- ✅ **Iniciar próximo automaticamente** - Continua para o próximo prompt
- ⏱️ **Delay entre prompts** - Tempo de espera (3-30 segundos)

### Passo 3: Inicie a Geração

1. **Abra uma aba do Meta.ai**
   - Vá para: https://www.meta.ai/media

2. **Clique em "▶️ Iniciar Geração"**

3. **Acompanhe o progresso**
   - A extensão vai:
     - ✍️ Digitar o prompt
     - 🚀 Enviar
     - ⏳ Aguardar geração (até 2 minutos)
     - 📥 Baixar as 4 imagens
     - ➡️ Iniciar o próximo prompt

### Passo 4: Controle

- **⏸️ Pausar** - Pausa após o prompt atual
- **⏹️ Parar** - Interrompe completamente
- **▶️ Continuar** - Retoma de onde parou

---

## 📂 Onde Ficam as Imagens?

As imagens são salvas em:

**Windows:**
```
C:\Users\SeuUsuario\Downloads\meta-ai-images\
```

**Mac:**
```
~/Downloads/meta-ai-images/
```

**Linux:**
```
~/Downloads/meta-ai-images/
```

### Nomenclatura dos Arquivos

```
meta_ai_1_beautiful_sunset_over_the_ocean_1.png
meta_ai_1_beautiful_sunset_over_the_ocean_2.png
meta_ai_1_beautiful_sunset_over_the_ocean_3.png
meta_ai_1_beautiful_sunset_over_the_ocean_4.png
meta_ai_2_futuristic_city_with_flying_car_1.png
...
```

Formato: `meta_ai_{índice}_{prompt_resumido}_{número_imagem}.png`

---

## ⚙️ Configurações

### Delay Entre Prompts

- **Mínimo:** 3 segundos
- **Recomendado:** 5-10 segundos
- **Máximo:** 30 segundos

⚠️ **Importante:** Delays muito curtos podem causar erros!

### Download Automático

Se **desativado**, a extensão apenas gera as imagens sem baixar.

### Auto Próximo

Se **desativado**, a extensão para após cada prompt e espera você clicar em "Continuar".

---

## 🛠️ Troubleshooting

### Extensão não encontra o campo de entrada

**Solução:**
1. Verifique se está em https://www.meta.ai/media
2. Recarregue a página (F5)
3. Desinstale e reinstale a extensão

### Imagens não são geradas

**Possíveis causas:**
- Meta.ai está com problemas (verifique manualmente)
- Prompt muito complexo ou inapropriado
- Limite de geração atingido (Meta.ai tem limites)

**Solução:**
- Aguarde alguns minutos
- Tente prompts mais simples
- Use uma conta diferente

### Download não inicia

**Solução:**
1. Verifique permissões de download do navegador
2. Certifique-se que "Download automático" está ativado
3. Verifique se tem espaço em disco

### Timeout aguardando imagens

**Possíveis causas:**
- Geração demorou mais de 2 minutos
- Meta.ai não respondeu

**Solução:**
- Aumente o delay entre prompts
- Tente novamente mais tarde
- Verifique se o Meta.ai está funcionando manualmente

---

## ⚠️ Limitações

### Limites do Meta.ai

- **Quantidade:** Meta.ai pode limitar quantas imagens você gera
- **Frequência:** Pode haver cooldown entre gerações
- **Conteúdo:** Prompts inapropriados são bloqueados

### Limitações da Extensão

- ⏳ **Tempo de espera:** Máximo 2 minutos por prompt
- 🖼️ **Número de imagens:** Sempre busca 4 imagens
- 🌐 **Requer conexão:** Não funciona offline
- 📱 **Desktop apenas:** Não funciona em mobile

---

## 💡 Dicas e Truques

### Melhores Práticas

1. **Use prompts claros e detalhados**
   ```
   ✅ "A photorealistic portrait of a cat wearing a crown"
   ❌ "cat"
   ```

2. **Evite prompts muito longos**
   - Máximo: 200 caracteres
   - Ideal: 50-100 caracteres

3. **Teste manualmente primeiro**
   - Verifique se o prompt funciona antes de adicionar na lista

4. **Use delay adequado**
   - Muitos prompts: 10-15 segundos
   - Poucos prompts: 5 segundos

5. **Monitore o progresso**
   - Mantenha a aba do Meta.ai visível
   - Acompanhe os logs no console (F12)

### Organizando Downloads

Crie subpastas manualmente:
```bash
Downloads/
└── meta-ai-images/
    ├── landscapes/
    ├── portraits/
    ├── abstract/
    └── animals/
```

### Processamento em Lote

**Para grandes listas (50+ prompts):**

1. Divida em lotes menores (10-20 prompts)
2. Processe um lote de cada vez
3. Aguarde 5-10 minutos entre lotes

---

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
meta-ai-extension/
├── manifest.json          # Configuração da extensão
├── popup.html            # Interface da extensão
├── styles.css            # Estilos
├── scripts/
│   ├── popup.js         # Lógica da interface
│   ├── content.js       # Automação do Meta.ai
│   └── background.js    # Service worker (downloads)
├── icons/               # Ícones da extensão
└── README.md           # Este arquivo
```

### Debug

1. **Abra o popup**
2. **Clique com botão direito** → "Inspecionar"
3. **Console** mostrará logs detalhados

**Ou:**

1. Vá para `chrome://extensions/`
2. Encontre "Meta.ai Bulk Image Generator"
3. Clique em "Inspecionar visualizações de serviço"

### Testar Content Script

1. Abra https://www.meta.ai/media
2. Pressione **F12** (DevTools)
3. Na aba **Console**, você verá:
   ```
   🎨 Meta.ai Bulk Generator - Content script loaded
   🎨 Bulk Generator Ready!
   ```

---

## 📄 Licença

MIT License - Use livremente!

---

## 🤝 Contribuindo

Melhorias são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/melhoria`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

## 📞 Suporte

**Problemas ou dúvidas?**

1. Verifique a seção "Troubleshooting"
2. Abra uma issue no GitHub
3. Consulte o console para erros

---

## 🎉 Agradecimentos

- Meta.ai pela API de geração de imagens
- Comunidade open source

---

## ⚖️ Aviso Legal

Esta extensão é um projeto independente e não é afiliado ou endossado pela Meta.

**Use com responsabilidade:**
- Respeite os termos de serviço do Meta.ai
- Não abuse da API
- Use para fins legítimos

---

**Desenvolvido com ❤️ usando Claude Code**

Versão: 1.0.0
