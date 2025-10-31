// State management
let prompts = [];
let currentIndex = 0;
let isRunning = false;
let isPaused = false;
let stats = {
  completed: 0,
  downloaded: 0,
  errors: 0
};

// DOM elements
const elements = {
  promptsInput: document.getElementById('promptsInput'),
  loadPrompts: document.getElementById('loadPrompts'),
  clearPrompts: document.getElementById('clearPrompts'),
  promptsList: document.getElementById('promptsList'),
  promptCounter: document.getElementById('promptCounter'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  stopBtn: document.getElementById('stopBtn'),
  statusBar: document.getElementById('statusBar'),
  statusText: document.getElementById('statusText'),
  autoDownload: document.getElementById('autoDownload'),
  autoNext: document.getElementById('autoNext'),
  delayInput: document.getElementById('delayInput'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  completedCount: document.getElementById('completedCount'),
  downloadCount: document.getElementById('downloadCount'),
  errorCount: document.getElementById('errorCount')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupEventListeners();
  checkMetaAiTab();
});

function setupEventListeners() {
  elements.loadPrompts.addEventListener('click', loadPromptsFromInput);
  elements.clearPrompts.addEventListener('click', clearAll);
  elements.startBtn.addEventListener('click', startGeneration);
  elements.pauseBtn.addEventListener('click', pauseGeneration);
  elements.stopBtn.addEventListener('click', stopGeneration);

  // Auto-save settings
  elements.autoDownload.addEventListener('change', saveState);
  elements.autoNext.addEventListener('change', saveState);
  elements.delayInput.addEventListener('change', saveState);
}

function loadPromptsFromInput() {
  const text = elements.promptsInput.value.trim();
  if (!text) {
    updateStatus('❌ Cole seus prompts primeiro!', 'error');
    return;
  }

  // Split by line and filter empty lines
  const newPrompts = text.split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (newPrompts.length === 0) {
    updateStatus('❌ Nenhum prompt válido encontrado!', 'error');
    return;
  }

  prompts = newPrompts.map((text, index) => ({
    id: Date.now() + index,
    text,
    status: 'pending', // pending, processing, completed, error
    downloaded: 0
  }));

  currentIndex = 0;
  stats = { completed: 0, downloaded: 0, errors: 0 };

  renderPromptsList();
  updateCounter();
  updateStats();
  saveState();

  updateStatus(`✅ ${prompts.length} prompts carregados!`, 'success');
  elements.promptsInput.value = '';
}

function renderPromptsList() {
  elements.promptsList.innerHTML = '';

  if (prompts.length === 0) {
    elements.promptsList.style.display = 'none';
    return;
  }

  elements.promptsList.style.display = 'block';

  prompts.forEach((prompt, index) => {
    const div = document.createElement('div');
    div.className = `prompt-item ${prompt.status}`;
    div.innerHTML = `
      <span class="prompt-status">${getStatusIcon(prompt.status)}</span>
      <span class="prompt-text">${prompt.text}</span>
    `;
    elements.promptsList.appendChild(div);
  });
}

function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    error: '❌'
  };
  return icons[status] || '⏳';
}

function updateCounter() {
  elements.promptCounter.textContent = `${prompts.length} prompts`;
}

function updateStatus(text, type = 'normal') {
  elements.statusText.textContent = text;
  elements.statusBar.className = 'status-bar';

  if (type === 'success' || type === 'active') {
    elements.statusBar.classList.add('active');
  } else if (type === 'error') {
    elements.statusBar.classList.add('error');
  }
}

function updateProgress() {
  const total = prompts.length;
  const current = currentIndex;
  const percentage = total > 0 ? (current / total) * 100 : 0;

  elements.progressFill.style.width = `${percentage}%`;
  elements.progressText.textContent = `${current}/${total}`;
}

function updateStats() {
  elements.completedCount.textContent = stats.completed;
  elements.downloadCount.textContent = stats.downloaded;
  elements.errorCount.textContent = stats.errors;
}

async function startGeneration() {
  if (prompts.length === 0) {
    updateStatus('❌ Adicione prompts primeiro!', 'error');
    return;
  }

  // Check if meta.ai tab is open
  const tab = await findMetaAiTab();
  if (!tab) {
    updateStatus('❌ Abra uma aba do Meta.ai primeiro!', 'error');
    alert('Por favor, abra https://www.meta.ai/media em uma nova aba primeiro!');
    return;
  }

  isRunning = true;
  isPaused = false;

  elements.startBtn.disabled = true;
  elements.pauseBtn.disabled = false;
  elements.stopBtn.disabled = false;
  elements.loadPrompts.disabled = true;

  updateStatus('🚀 Geração iniciada!', 'active');

  // Send configuration to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'startGeneration',
    data: {
      prompts,
      currentIndex,
      settings: {
        autoDownload: elements.autoDownload.checked,
        autoNext: elements.autoNext.checked,
        delay: parseInt(elements.delayInput.value) * 1000
      }
    }
  });

  // Listen for updates from content script
  setupMessageListener();
}

function pauseGeneration() {
  isPaused = !isPaused;

  if (isPaused) {
    elements.pauseBtn.textContent = '▶️ Continuar';
    updateStatus('⏸️ Pausado', 'normal');
  } else {
    elements.pauseBtn.textContent = '⏸️ Pausar';
    updateStatus('🚀 Continuando...', 'active');
  }

  findMetaAiTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'pauseGeneration',
        data: { isPaused }
      });
    }
  });
}

function stopGeneration() {
  isRunning = false;
  isPaused = false;

  elements.startBtn.disabled = false;
  elements.pauseBtn.disabled = true;
  elements.stopBtn.disabled = true;
  elements.loadPrompts.disabled = false;
  elements.pauseBtn.textContent = '⏸️ Pausar';

  updateStatus('⏹️ Parado', 'normal');

  findMetaAiTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'stopGeneration'
      });
    }
  });
}

function clearAll() {
  if (isRunning) {
    if (!confirm('A geração está em andamento. Deseja realmente limpar?')) {
      return;
    }
    stopGeneration();
  }

  prompts = [];
  currentIndex = 0;
  stats = { completed: 0, downloaded: 0, errors: 0 };

  renderPromptsList();
  updateCounter();
  updateProgress();
  updateStats();
  saveState();

  updateStatus('🗑️ Lista limpa', 'normal');
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProgress') {
      const { promptIndex, status, downloaded, error } = message.data;

      if (promptIndex < prompts.length) {
        prompts[promptIndex].status = status;
        if (downloaded !== undefined) {
          prompts[promptIndex].downloaded = downloaded;
        }

        if (status === 'completed') {
          stats.completed++;
          stats.downloaded += downloaded || 0;
          currentIndex = promptIndex + 1;
        } else if (status === 'error') {
          stats.errors++;
          currentIndex = promptIndex + 1;
        }

        renderPromptsList();
        updateProgress();
        updateStats();
        updateStatus(`Processando: ${prompts[promptIndex].text.substring(0, 50)}...`, 'active');
      }
    } else if (message.action === 'generationComplete') {
      isRunning = false;
      elements.startBtn.disabled = false;
      elements.pauseBtn.disabled = true;
      elements.stopBtn.disabled = true;
      elements.loadPrompts.disabled = false;

      updateStatus('🎉 Geração completa!', 'success');

      setTimeout(() => {
        alert(`Geração completa!\n\n✅ Concluídos: ${stats.completed}\n📥 Downloads: ${stats.downloaded}\n❌ Erros: ${stats.errors}`);
      }, 500);
    }
  });
}

async function findMetaAiTab() {
  const tabs = await chrome.tabs.query({ url: 'https://www.meta.ai/*' });
  return tabs.length > 0 ? tabs[0] : null;
}

async function checkMetaAiTab() {
  const tab = await findMetaAiTab();
  if (!tab) {
    updateStatus('⚠️ Abra o Meta.ai primeiro', 'error');
  }
}

function saveState() {
  const state = {
    prompts,
    currentIndex,
    stats,
    settings: {
      autoDownload: elements.autoDownload.checked,
      autoNext: elements.autoNext.checked,
      delay: parseInt(elements.delayInput.value)
    }
  };
  chrome.storage.local.set({ state });
}

function loadState() {
  chrome.storage.local.get(['state'], (result) => {
    if (result.state) {
      const { prompts: savedPrompts, currentIndex: savedIndex, stats: savedStats, settings } = result.state;

      if (savedPrompts && savedPrompts.length > 0) {
        prompts = savedPrompts;
        currentIndex = savedIndex || 0;
        stats = savedStats || { completed: 0, downloaded: 0, errors: 0 };

        renderPromptsList();
        updateCounter();
        updateProgress();
        updateStats();
      }

      if (settings) {
        elements.autoDownload.checked = settings.autoDownload !== false;
        elements.autoNext.checked = settings.autoNext !== false;
        elements.delayInput.value = settings.delay || 5;
      }
    }
  });
}
