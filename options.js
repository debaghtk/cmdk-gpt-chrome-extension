document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
});

// Restore saved API key
chrome.storage.sync.get('openaiApiKey', (data) => {
  if (data.openaiApiKey) {
    document.getElementById('apiKey').value = data.openaiApiKey;
  }
});

