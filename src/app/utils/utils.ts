// utils.ts
import { detect } from 'detect-browser';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Global variable to store the current offline content
let currentOfflineContent: string | null = null;

// Set up event listener for offline content
listen('offline-content-available', (event) => {
    console.log('Received offline content event');
    currentOfflineContent = event.payload as string;
    displayOfflineContentModal(currentOfflineContent);
});

function displayOfflineContentModal(content: string) {
    // add css files to the head
    const head = document.head;

    const cssFiles = [
        'assets/css/bootstrap.min.css',
        'assets/css/bootstrap-tourist.css',
        'assets/css/bootstrap-select.min.css',
        'assets/css/brands.min.css',
        'assets/css/fontawesome.min.css',
        'assets/css/style-attack.css',
    ];
    cssFiles.forEach((cssFile) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssFile;
        head.appendChild(link);
    });

    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        width: 90%;
        height: 90%;
        max-width: 1200px;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        background: #2c3e50;
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #34495e;
    `;
    header.innerHTML = `
        <h2 class="text-base font-semibold" style="margin: 0 !important;">Offline Content Viewer</h2>
        <button id="close-modal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        line-height: 1.6;
    `;
    contentArea.innerHTML = content;

    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modal.appendChild(modalContent);

    // Add to document
    document.body.appendChild(modal);

    function removeOfflineCSS() {
        cssFiles.forEach((cssFile) => {
            const link = document.querySelector(`link[href="${cssFile}"]`);
            if (link) {
                link.remove();
            }
        });
    }

    // Add close functionality
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
            currentOfflineContent = null;
            removeOfflineCSS();
        };
    }

    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            currentOfflineContent = null;
            removeOfflineCSS();
        }
    };

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            currentOfflineContent = null;
            removeOfflineCSS();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

export async function openURL(link: string, tryOfflineFirst: boolean = true) {
    console.log(`openURL called with link: ${link}, tryOfflineFirst: ${tryOfflineFirst}`);

    if (tryOfflineFirst) {
        try {
            console.log('Attempting to open offline content...');
            // Try to open offline content first using the new command
            const offlineOpened = (await invoke('get_offline_content', { url: link })) as boolean;
            console.log('Offline content opened:', offlineOpened);

            if (offlineOpened) {
                console.log('Successfully opened offline content for:', link);
                return;
            } else {
                console.log('No offline content available for:', link);
            }
        } catch (error) {
            console.warn('Failed to open offline content, falling back to online:', error);
        }
    }

    // Fallback to opening the original URL
    console.log('Opening online URL:', link);
    await openUrl(link);
}

let comparatorFn = {
    '<': function (a, b) {
        return a < b;
    },
    '<=': function (a, b) {
        return a <= b;
    },
    '>': function (a, b) {
        return a > b;
    },
    '>=': function (a, b) {
        return a >= b;
    },
};

export function isBoolean(value: any): boolean {
    return typeof value === 'boolean';
}

export function isNumber(value: any): boolean {
    return typeof value === 'number';
}

export function isIE(): boolean {
    const browser = detect();
    return browser.name == 'ie';
}

export function isSafari(compRange): boolean {
    function compare(version, comp) {
        let str = comp + '';
        let n = +(/\d+/.exec(str) || NaN);
        let op = /^[<>]=?/.exec(str)[0];
        return comparatorFn[op] ? comparatorFn[op](version, n) : version == n || Number.isNaN(n);
    }

    const browser = detect();
    return browser.name == 'safari' && compare(browser.version.split('.')[0], compRange);
}
