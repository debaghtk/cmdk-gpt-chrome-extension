document.getElementById('submit').addEventListener('click', () => {
    const query = document.getElementById('query').value;
    // Send query to background script for API call
    chrome.runtime.sendMessage({ action: "makeApiCall", query: query });
});
