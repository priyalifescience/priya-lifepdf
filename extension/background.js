// Priya PDF Editor Chrome Extension - Background Service Worker

const PDFCRAFT_URL = 'https://priya-pdf-editor.devtoolcafe.com/en';

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Create main context menu item
    chrome.contextMenus.create({
        id: 'priya-pdf-editor-open',
        title: 'Open with Priya PDF Editor',
        contexts: ['link', 'page']
    });

    // Create submenu for specific tools
    chrome.contextMenus.create({
        id: 'priya-pdf-editor-merge',
        parentId: 'priya-pdf-editor-open',
        title: 'Merge PDFs',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'priya-pdf-editor-compress',
        parentId: 'priya-pdf-editor-open',
        title: 'Compress PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'priya-pdf-editor-convert',
        parentId: 'priya-pdf-editor-open',
        title: 'Convert to PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'priya-pdf-editor-all-tools',
        parentId: 'priya-pdf-editor-open',
        title: 'All Tools →',
        contexts: ['link', 'page']
    });

    console.log('Priya PDF Editor context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    let url = PDFCRAFT_URL;

    switch (info.menuItemId) {
        case 'priya-pdf-editor-merge':
            url = `${PDFCRAFT_URL}/tools/merge-pdf`;
            break;
        case 'priya-pdf-editor-compress':
            url = `${PDFCRAFT_URL}/tools/compress-pdf`;
            break;
        case 'priya-pdf-editor-convert':
            url = `${PDFCRAFT_URL}/tools/jpg-to-pdf`;
            break;
        case 'priya-pdf-editor-all-tools':
        case 'priya-pdf-editor-open':
            url = PDFCRAFT_URL;
            break;
        default:
            url = PDFCRAFT_URL;
    }

    // Open Priya PDF Editor in a new tab
    chrome.tabs.create({ url: url });
});

// Log when service worker starts
console.log('Priya PDF Editor background service worker started');
