// utils.ts
import { detect } from 'detect-browser';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Global variable to store the current offline content
let currentOfflineContent: string | null = null;

// Set up event listener for offline content
listen('offline-content-available', (event) => {
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
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
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
        <h2 class="text-base font-semibold text-white" style="margin: 0 !important;">Offline Content Viewer</h2>
        <button id="close-modal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        line-height: 1.6;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        cursor: text;
    `;
    contentArea.innerHTML = content;

    // Add CSS to ensure all content elements allow text selection
    const style = document.createElement('style');
    style.textContent = `
        #offline-content-modal * {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
        }
        #offline-content-modal a {
            cursor: pointer !important;
        }
        #offline-content-modal p, #offline-content-modal div, #offline-content-modal span {
            cursor: text !important;
        }
    `;
    document.head.appendChild(style);

    // Prevent event bubbling on content area to allow text selection
    contentArea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    contentArea.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add ID for CSS targeting
    contentArea.id = 'offline-content-modal';

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

        // Remove dynamically added style for text selection
        const style = document.querySelector('style');
        if (style && style.textContent?.includes('#offline-content-modal')) {
            style.remove();
        }
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
    if (tryOfflineFirst) {
        try {
            // Try to open offline content first using the new command
            const offlineOpened = (await invoke('get_offline_content', { url: link })) as boolean;

            if (offlineOpened) {
                return;
            } else {
                console.log('No offline content available for:', link);
            }
        } catch (error) {
            console.warn('Failed to open offline content, falling back to online:', error);
        }
    }

    // Fallback to opening the original URL
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
