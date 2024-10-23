chrome.commands.onCommand.addListener((command) => {
    if (command === "open-dialog") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "openDialog" });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "makeApiCall") {
        // Make API call to OpenAI or Anthropic
        // This is a placeholder and needs to be implemented with actual API credentials
        fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '
            },
            body: JSON.stringify({
                model: "text-davinci-002",
                prompt: request.query,
                max_tokens: 100
            })
        })
            .then(response => response.json())
            .then(data => {
                // Send the result back to the content script
                chrome.tabs.sendMessage(sender.tab.id, { action: "insertText", text: data.choices[0].text });
            })
            .catch(error => console.error('Error:', error));
    }
});
