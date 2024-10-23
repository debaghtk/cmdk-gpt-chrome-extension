let dialog = null;

function createDialog() {
  dialog = document.createElement('div');
  dialog.innerHTML = `
    <div id="ai-assistant-dialog">
      <input type="text" id="ai-query" placeholder="Enter your query">
      <button id="ai-submit">Submit</button>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('ai-submit').addEventListener('click', handleSubmit);
}

function handleSubmit() {
  const query = document.getElementById('ai-query').value;
  chrome.runtime.sendMessage({action: "makeApiCall", query: query});
  closeDialog();
}

function openDialog() {
  if (!dialog) createDialog();
  dialog.style.display = 'block';
  document.getElementById('ai-query').focus();
}

function closeDialog() {
  if (dialog) dialog.style.display = 'none';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDialog") {
    openDialog();
  } else if (request.action === "insertText") {
    const activeElement = document.activeElement;
    if (activeElement.isContentEditable || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const text = activeElement.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      activeElement.value = before + request.text + after;
      activeElement.selectionStart = activeElement.selectionEnd = start + request.text.length;
    }
  }
});

// Close dialog when clicking outside
document.addEventListener('click', (event) => {
  if (dialog && !dialog.contains(event.target)) {
    closeDialog();
  }
});

// Close dialog when pressing Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDialog();
  }
});
