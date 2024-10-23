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

async function handleSubmit() {
    if (await checkApiKey()) {
        const query = document.getElementById('ai-query').value;
        chrome.runtime.sendMessage({ action: "makeApiCall", query: query });
        closeDialog();
    }
}

function openDialog() {
    if (!dialog) createDialog();
    dialog.style.display = 'block';
    document.getElementById('ai-query').focus();
}

function closeDialog() {
    if (dialog) dialog.style.display = 'none';
}

function checkApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('openaiApiKey', (data) => {
            if (!data.openaiApiKey) {
                alert('Please set your OpenAI API key in the extension options before using the AI Assistant.');
                chrome.runtime.openOptionsPage();
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: #ff4444;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 10001;
  `;
    errorDiv.textContent = `Error: ${message}`;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function insertText(text) {
    // Try to find the active element or any focused input
    let targetElement = document.activeElement;

    // If no element is actively focused, try to find a visible input field
    if (targetElement === document.body || targetElement === document.documentElement) {
        targetElement = document.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [contenteditable="true"]');
    }

    if (targetElement) {
        if (targetElement.isContentEditable) {
            // For contenteditable elements
            targetElement.focus();
            document.execCommand('insertText', false, text);
        } else if (targetElement.tagName === 'TEXTAREA' || (targetElement.tagName === 'INPUT' && targetElement.type === 'text')) {
            // For textarea and text input elements
            const start = targetElement.selectionStart;
            const end = targetElement.selectionEnd;
            targetElement.value = targetElement.value.substring(0, start) + text + targetElement.value.substring(end);
            targetElement.selectionStart = targetElement.selectionEnd = start + text.length;
        } else {
            // For other types of inputs, try using execCommand
            targetElement.focus();
            document.execCommand('insertText', false, text);
        }
    } else {
        console.error('Unable to insert text: No suitable input element found');
        showError('Unable to insert text: Please focus on or open a text input field');
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openDialog") {
        openDialog();
    } else if (request.action === "insertText") {
        insertText(request.text);
    } else if (request.action === "showError") {
        showError(request.error);
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
