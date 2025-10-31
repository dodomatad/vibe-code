// Background service worker
console.log('Meta.ai Bulk Generator - Background service worker loaded');

// Handle download requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadImage') {
    const { url, filename } = message.data;

    chrome.downloads.download({
      url: url,
      filename: `meta-ai-images/${filename}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Download started:', downloadId);
        sendResponse({ success: true, downloadId });
      }
    });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Log when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed!');

    // Open welcome page
    chrome.tabs.create({
      url: 'https://www.meta.ai/media'
    });
  }
});
