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
                    messages: [{ role: "user", content: request.query }],
                    max_tokens: 100
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                        // Send the result back to the content script
                        chrome.tabs.sendMessage(sender.tab.id, { action: "insertText", text: data.choices[0].message.content });
                    } else {
                        throw new Error('Unexpected API response format');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    chrome.tabs.sendMessage(sender.tab.id, { action: "showError", error: error.message });
                });
        });
    }
});
