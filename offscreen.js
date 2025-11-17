// Offscreen document script for handling clipboard operations in Manifest V3

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'clipboard-write') {
        writeToClipboard(message.data, message.html).then(() => {
            sendResponse(true);
        }).catch(error => {
            console.error('Failed to write to clipboard:', error);
            sendResponse(false);
        });
        return true; // Keep message channel open for async response
    } else if (message.type === 'clipboard-read') {
        readFromClipboard().then(text => {
            sendResponse(text);
        }).catch(error => {
            console.error('Failed to read from clipboard:', error);
            sendResponse('');
        });
        return true; // Keep message channel open for async response
    }
});

async function writeToClipboard(text, isHTML) {
    try {
        if (isHTML && navigator.clipboard.write) {
            // Write both HTML and plain text
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([text], { type: 'text/html' }),
                'text/plain': new Blob([text], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);
        } else {
            // Write plain text only
            await navigator.clipboard.writeText(text);
        }
        return true;
    } catch (error) {
        // Fallback method using execCommand
        return fallbackWrite(text);
    }
}

async function readFromClipboard() {
    try {
        return await navigator.clipboard.readText();
    } catch (error) {
        // Fallback method using execCommand
        return fallbackRead();
    }
}

function fallbackWrite(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
    } catch (error) {
        console.error('Fallback copy failed:', error);
        return false;
    }
}

function fallbackRead() {
    try {
        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        document.execCommand('paste');
        const text = textArea.value;
        document.body.removeChild(textArea);
        return text;
    } catch (error) {
        console.error('Fallback paste failed:', error);
        return '';
    }
}