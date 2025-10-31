// Content script for meta.ai automation
console.log('🎨 Meta.ai Bulk Generator - Content script loaded');

let prompts = [];
let currentIndex = 0;
let settings = {
  autoDownload: true,
  autoNext: true,
  delay: 5000
};
let isRunning = false;
let isPaused = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);

  if (message.action === 'startGeneration') {
    prompts = message.data.prompts;
    currentIndex = message.data.currentIndex;
    settings = message.data.settings;
    startGeneration();
  } else if (message.action === 'pauseGeneration') {
    isPaused = message.data.isPaused;
  } else if (message.action === 'stopGeneration') {
    stopGeneration();
  }

  sendResponse({ success: true });
});

async function startGeneration() {
  isRunning = true;
  isPaused = false;
  console.log('Starting generation with', prompts.length, 'prompts');

  for (let i = currentIndex; i < prompts.length; i++) {
    if (!isRunning) {
      console.log('Generation stopped');
      break;
    }

    // Wait if paused
    while (isPaused && isRunning) {
      await sleep(500);
    }

    if (!isRunning) break;

    currentIndex = i;
    const prompt = prompts[i];

    console.log(`Processing prompt ${i + 1}/${prompts.length}:`, prompt.text);

    try {
      // Update status to processing
      sendUpdate(i, 'processing');

      // Type and submit the prompt
      await typePrompt(prompt.text);
      await sleep(1000);
      await submitPrompt();

      // Wait for images to be generated
      console.log('Waiting for images to generate...');
      const images = await waitForImages();

      if (images && images.length > 0) {
        console.log(`Found ${images.length} images`);

        if (settings.autoDownload) {
          const downloaded = await downloadImages(images, prompt.text, i);
          sendUpdate(i, 'completed', downloaded);
        } else {
          sendUpdate(i, 'completed', images.length);
        }

        // Wait delay before next prompt
        if (settings.autoNext && i < prompts.length - 1) {
          console.log(`Waiting ${settings.delay}ms before next prompt...`);
          await sleep(settings.delay);
        }
      } else {
        throw new Error('No images generated');
      }
    } catch (error) {
      console.error('Error processing prompt:', error);
      sendUpdate(i, 'error', 0, error.message);

      // Wait a bit before continuing
      await sleep(settings.delay);
    }
  }

  isRunning = false;
  console.log('Generation complete!');
  chrome.runtime.sendMessage({ action: 'generationComplete' });
}

function stopGeneration() {
  isRunning = false;
  isPaused = false;
  console.log('Generation stopped by user');
}

async function typePrompt(text) {
  // Find the input textarea
  const input = findInputElement();
  if (!input) {
    throw new Error('Could not find input field');
  }

  // Clear existing text
  input.value = '';
  input.focus();

  // Type the prompt
  input.value = text;

  // Trigger input event
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  console.log('Prompt typed:', text);
}

async function submitPrompt() {
  // Find and click the submit button
  const submitBtn = findSubmitButton();
  if (!submitBtn) {
    throw new Error('Could not find submit button');
  }

  submitBtn.click();
  console.log('Prompt submitted');
}

async function waitForImages(maxWait = 120000, checkInterval = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const images = findGeneratedImages();

    // Check if we have 4 images (Meta.ai typically generates 4)
    if (images && images.length >= 4) {
      // Wait a bit more to ensure images are fully loaded
      await sleep(2000);
      return images;
    }

    await sleep(checkInterval);
  }

  throw new Error('Timeout waiting for images');
}

function findInputElement() {
  // Try multiple selectors for Meta.ai input
  const selectors = [
    'textarea[placeholder*="imagine"]',
    'textarea[placeholder*="Ask"]',
    'textarea[data-testid*="composer"]',
    'textarea',
    'input[type="text"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.offsetParent !== null) {
      return element;
    }
  }

  return null;
}

function findSubmitButton() {
  // Try multiple selectors for submit button
  const selectors = [
    'button[aria-label*="Send"]',
    'button[aria-label*="submit"]',
    'button[type="submit"]',
    'button svg', // Often the button contains an SVG icon
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const button = element.tagName === 'BUTTON' ? element : element.closest('button');
      if (button && button.offsetParent !== null) {
        return button;
      }
    }
  }

  return null;
}

function findGeneratedImages() {
  // Find all images in the latest response
  const images = [];

  // Try different selectors for Meta.ai generated images
  const selectors = [
    'img[src*="blob"]',
    'img[src*="cdn"]',
    'img[alt*="generated"]',
    'div[role="img"]',
    'img'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element.tagName === 'IMG' && element.src && !element.src.includes('avatar')) {
        // Check if image is visible and has reasonable dimensions
        if (element.offsetParent !== null &&
            element.naturalWidth > 200 &&
            element.naturalHeight > 200) {
          images.push(element);
        }
      }
    }
  }

  // Return unique images (by src)
  const uniqueImages = [];
  const seenSrcs = new Set();

  for (const img of images) {
    if (!seenSrcs.has(img.src)) {
      seenSrcs.add(img.src);
      uniqueImages.push(img);
    }
  }

  // Return up to 4 most recent images
  return uniqueImages.slice(-4);
}

async function downloadImages(images, promptText, promptIndex) {
  let downloadedCount = 0;

  // Create a safe filename from the prompt
  const safeFilename = promptText
    .substring(0, 50)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  for (let i = 0; i < images.length; i++) {
    try {
      const img = images[i];
      const filename = `meta_ai_${promptIndex + 1}_${safeFilename}_${i + 1}.png`;

      // Download using chrome.downloads API
      if (img.src.startsWith('blob:')) {
        // For blob URLs, we need to fetch and convert to data URL
        const blob = await fetch(img.src).then(r => r.blob());
        const dataUrl = await blobToDataURL(blob);

        await chrome.runtime.sendMessage({
          action: 'downloadImage',
          data: {
            url: dataUrl,
            filename
          }
        });
      } else {
        // For regular URLs
        await chrome.runtime.sendMessage({
          action: 'downloadImage',
          data: {
            url: img.src,
            filename
          }
        });
      }

      downloadedCount++;
      console.log(`Downloaded image ${i + 1}/${images.length}`);
      await sleep(500); // Small delay between downloads
    } catch (error) {
      console.error(`Error downloading image ${i + 1}:`, error);
    }
  }

  return downloadedCount;
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sendUpdate(promptIndex, status, downloaded, error) {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    data: {
      promptIndex,
      status,
      downloaded,
      error
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Inject a helper div to show status on page
function showPageStatus(text) {
  let statusDiv = document.getElementById('meta-ai-bulk-status');

  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'meta-ai-bulk-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(statusDiv);
  }

  statusDiv.textContent = text;

  // Auto-hide after 3 seconds if not processing
  if (!text.includes('Processing')) {
    setTimeout(() => {
      if (statusDiv.textContent === text) {
        statusDiv.remove();
      }
    }, 3000);
  }
}

// Show extension is ready
showPageStatus('🎨 Bulk Generator Ready!');
