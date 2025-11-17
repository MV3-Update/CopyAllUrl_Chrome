# Manifest V3 Migration Notes

This document outlines the changes made to migrate the Copy All URLs extension from Manifest V2 to Manifest V3.

## Key Changes Made

### 1. Manifest Updates (`manifest.json`)
- **Manifest version**: Updated from 2 to 3
- **Background scripts**: Changed from `scripts` array to single `service_worker`
- **Browser action**: Renamed `browser_action` to `action`
- **Permissions**: Separated host permissions from regular permissions
  - Moved `http://*/*` and `https://*/*` to `host_permissions`
- **Content Security Policy**: Updated format to object with `extension_pages` key
- **Version**: Bumped to 3.0 to reflect major change

### 2. Background Script (`background.js`)
- **Service Worker**: Now runs as service worker instead of persistent background page
- **Import Scripts**: Added `importScripts()` for jQuery and encoder dependencies
- **Clipboard API**: Updated to use modern `navigator.clipboard` API
- **Async Functions**: Made clipboard operations async where needed
- **DOM Access**: Removed direct DOM manipulation (service workers don't have DOM access)
- **API Updates**: Changed `chrome.browserAction` to `chrome.action`
- **Message Handling**: Added message listener for communication with popup

### 3. Popup Script (`popup.js`)
- **Background Page Access**: Updated to use `chrome.runtime.getBackgroundPage()` with promises
- **Fallback Communication**: Added message-based communication as fallback
- **Error Handling**: Added try-catch for cases where background page isn't accessible

### 4. Options Script (`options.js`)
- **Background Page Access**: Similar updates to popup.js for accessing service worker

## Important Notes

### Clipboard API
- Now uses the modern `navigator.clipboard` API
- HTML clipboard support uses `ClipboardItem` with multiple MIME types
- Requires user gesture for clipboard access

### Service Worker Limitations
- No direct DOM access
- No persistent state (use chrome.storage for persistence)
- Limited global variables
- Google Analytics may need different implementation

### Permissions
- `clipboardRead` and `clipboardWrite` permissions maintained
- Host permissions moved to separate `host_permissions` field
- `activeTab` permission might be needed for some clipboard operations

## Testing Recommendations

1. Test copy functionality with different formats (text, HTML, JSON, custom)
2. Test paste functionality with various URL formats
3. Test keyboard shortcuts (Alt+C for copy, Alt+V for paste)
4. Test options page functionality
5. Verify badge updates work correctly
6. Test notification system for updates

## Potential Issues

1. **Google Analytics**: The current GA implementation may not work in service workers
2. **Clipboard Access**: Some clipboard operations might require user interaction
3. **Cross-Origin**: Some websites may block clipboard access due to security policies

## Future Improvements

1. Consider using chrome.storage.sync for settings instead of localStorage
2. Implement proper error handling for clipboard operations
3. Update Google Analytics to use Google Analytics 4 or Measurement Protocol
4. Add content script for enhanced clipboard access if needed