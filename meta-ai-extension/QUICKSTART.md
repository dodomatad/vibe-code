# ⚡ Quick Start - Meta.ai Bulk Generator

## 🚀 Instalação Rápida (2 minutos)

### 1️⃣ Gerar Ícones

```bash
# Abra o arquivo no navegador
open create-icons.html
```

- Clique em "🎨 Gerar Ícones"
- Mova os 3 arquivos baixados para a pasta `icons/`

### 2️⃣ Instalar Extensão

1. Abra: `chrome://extensions/`
2. Ative: **Modo do desenvolvedor** (toggle superior direito)
3. Clique: **"Carregar sem compactação"**
4. Selecione: pasta `meta-ai-extension`
5. ✅ Pronto!

---

## 🎮 Uso Rápido (30 segundos)

### Passo 1: Prepare os Prompts

Crie um arquivo `prompts.txt`:

```
A beautiful sunset over mountains
A futuristic city at night
A cute puppy playing in garden
A magical forest with fireflies
```

### Passo 2: Execute

1. **Abra**: https://www.meta.ai/media
2. **Clique** no ícone da extensão 🎨
3. **Cole** os prompts na caixa de texto
4. **Clique**: "📋 Carregar Lista"
5. **Clique**: "▶️ Iniciar Geração"
6. **Relaxe** ☕ enquanto as imagens são geradas e baixadas!

---

## 📥 Resultado

Todas as imagens estarão em:

```
📁 Downloads/
  └── 📁 meta-ai-images/
      ├── meta_ai_1_beautiful_sunset_over_mounta_1.png
      ├── meta_ai_1_beautiful_sunset_over_mounta_2.png
      ├── meta_ai_1_beautiful_sunset_over_mounta_3.png
      ├── meta_ai_1_beautiful_sunset_over_mounta_4.png
      ├── meta_ai_2_futuristic_city_at_night_1.png
      ├── ...
```

---

## ⚙️ Configuração Recomendada

### Para Listas Pequenas (1-10 prompts)
- **Delay:** 5 segundos
- **Download automático:** ✅ Ativado
- **Auto próximo:** ✅ Ativado

### Para Listas Grandes (10+ prompts)
- **Delay:** 10-15 segundos
- **Download automático:** ✅ Ativado
- **Auto próximo:** ✅ Ativado

---

## 🐛 Problemas Comuns

### ❌ "Abra o Meta.ai primeiro"

**Solução:** Vá para https://www.meta.ai/media

### ❌ "Could not find input field"

**Solução:**
1. Recarregue a página (F5)
2. Aguarde carregar completamente
3. Tente novamente

### ❌ "Timeout waiting for images"

**Solução:**
- Aumente o delay para 10-15 segundos
- Meta.ai pode estar lento - tente mais tarde

---

## 💡 Dicas Rápidas

1. **Mantenha a aba visível** durante o processo
2. **Não feche o popup** enquanto estiver rodando
3. **Use prompts em inglês** para melhores resultados
4. **Teste manualmente** um prompt antes de adicionar na lista
5. **Divida listas grandes** em lotes de 10-20 prompts

---

## 📊 Exemplo de Lista de Prompts

```txt
# Paisagens
A serene lake at sunrise with misty mountains
A desert oasis with palm trees and clear water
Northern lights over snowy landscape

# Animais
A majestic lion in golden savanna
A colorful parrot in tropical rainforest
A group of elephants near waterhole

# Cidades
Cyberpunk Tokyo street at night
Ancient Rome city center reconstruction
Modern Dubai skyline at sunset

# Fantasia
A fairy tale castle floating in clouds
A mystical wizard tower surrounded by magic
A dragon flying over medieval village
```

---

## 🎯 Workflow Recomendado

### 1. Planejamento
```
📝 Criar prompts.txt
✍️  Escrever 10-20 prompts
📋 Revisar e testar 1-2 manualmente
```

### 2. Execução
```
🌐 Abrir Meta.ai
🎨 Carregar extensão
▶️  Iniciar geração
☕ Aguardar conclusão
```

### 3. Organização
```
📁 Criar pastas temáticas
🖼️  Mover imagens
🗑️  Deletar ruins
✅ Usar as melhores!
```

---

## 📈 Performance

### Tempo Médio

- **1 prompt:** ~30-60 segundos (geração + download)
- **10 prompts:** ~8-12 minutos
- **50 prompts:** ~40-60 minutos
- **100 prompts:** ~2 horas

### Otimização

- **Delay menor:** Mais rápido, mas mais erros
- **Delay maior:** Mais lento, mas mais confiável
- **Recomendado:** 5-10 segundos

---

## 🔄 Automação Avançada

### Script de Preparação

```bash
#!/bin/bash
# prepare-prompts.sh

# Ler prompts de arquivo
cat << EOF > prompts.txt
$(curl -s https://sua-api.com/prompts)
EOF

# Remover linhas vazias
sed -i '/^$/d' prompts.txt

# Limitar a 50 linhas
head -n 50 prompts.txt > prompts-limited.txt
```

### Organização Automática

```bash
#!/bin/bash
# organize-images.sh

cd ~/Downloads/meta-ai-images

# Criar pastas por data
mkdir -p $(date +%Y-%m-%d)
mv meta_ai_*.png $(date +%Y-%m-%d)/

echo "✅ Imagens organizadas!"
```

---

## 🆘 Suporte

**Precisa de ajuda?**

1. Leia o [README completo](README.md)
2. Verifique o console (F12) para erros
3. Teste manualmente no Meta.ai
4. Abra uma issue com:
   - O que aconteceu
   - O que esperava
   - Screenshots/logs

---

## ✅ Checklist

Antes de começar:

- [ ] Extensão instalada
- [ ] Ícones gerados
- [ ] Meta.ai aberto
- [ ] Prompts preparados
- [ ] Configurações ajustadas
- [ ] Espaço em disco suficiente

Durante o processo:

- [ ] Aba visível
- [ ] Popup aberto
- [ ] Internet estável
- [ ] Sem interrupções

Após conclusão:

- [ ] Verificar pasta de downloads
- [ ] Contar imagens (4 por prompt)
- [ ] Organizar em pastas
- [ ] Fazer backup

---

**🎉 Pronto para gerar centenas de imagens automaticamente!**

Tempo total de setup: **2 minutos**
Tempo economizado: **Horas e horas!** ⏰💰
