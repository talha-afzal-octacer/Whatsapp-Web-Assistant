document.getElementById('start').addEventListener('click', () => {
    alert('Starting WhatsApp Web Assistant!');
    
    // Send a message to the content script to start the process
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        });
    });
});