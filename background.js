import { createPrompt } from './prompt.js';

chrome.commands.onCommand.addListener((command) => {
    if (command === "open-dialog") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "openDialog" });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "makeApiCall") {
        chrome.storage.sync.get('openaiApiKey', (data) => {
            if (!data.openaiApiKey) {
                console.error('OpenAI API key not set. Please set it in the options page.');
                chrome.tabs.sendMessage(sender.tab.id, { action: "showError", error: "API key not set" });
                return;
            }
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: createPrompt(request.query),
                    max_tokens: 150,
                    stream: true
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const reader = response.body.getReader();
                let decoder = new TextDecoder();
                let buffer = '';

                function readStream() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            chrome.tabs.sendMessage(sender.tab.id, { action: "streamComplete" });
                            return;
                        }
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop();

                        processLines(lines, sender.tab.id, 0);
                    });
                }

                function processLines(lines, tabId, index) {
                    if (index >= lines.length) {
                        readStream();
                        return;
                    }

                    const line = lines[index];
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data.trim() === '[DONE]') {
                            chrome.tabs.sendMessage(tabId, { action: "streamComplete" });
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                chrome.tabs.sendMessage(tabId, { action: "insertText", text: parsed.choices[0].delta.content });
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }

                    setTimeout(() => processLines(lines, tabId, index + 1), 50); // 50ms delay
                }

                readStream();
            })
            .catch(error => {
                console.error('Error:', error);
                chrome.tabs.sendMessage(sender.tab.id, { action: "showError", error: error.message });
            });
        });
    }
});
