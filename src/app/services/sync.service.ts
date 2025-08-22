import { Injectable, EventEmitter, NgZone } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface SyncProgress {
    total: number;
    completed: number;
    current_item: string;
    is_complete: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    public syncProgress = new EventEmitter<SyncProgress>();
    public isSyncing = false;

    constructor(private ngZone: NgZone) {
        this.setupProgressListener();
    }

    private async setupProgressListener() {
        await listen('sync-progress', (event) => {
            const progress = event.payload as SyncProgress;
            // Run progress updates inside Angular's zone to trigger change detection
            this.ngZone.run(() => {
                this.syncProgress.emit(progress);
                this.isSyncing = !progress.is_complete;
            });
        });
    }

    async syncContent(urls: string[]): Promise<void> {
        this.isSyncing = true;
        console.log('Starting sync for', urls.length, 'URLs');
        try {
            await invoke('download_and_store_content', { urls });
            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed:', error);
            this.isSyncing = false;
            throw error;
        }
    }

    async getOfflineContent(url: string): Promise<string | null> {
        try {
            // Use a different command for getting content without opening a window
            const content = (await invoke('get_offline_content_raw', { url })) as string | null;
            return content;
        } catch (error) {
            console.error('Failed to get offline content:', error);
            return null;
        }
    }

    async checkOfflineAvailability(urls: string[]): Promise<boolean[]> {
        try {
            console.log('Checking offline availability for', urls.length, 'URLs');
            const availability = (await invoke('check_offline_availability', { urls })) as boolean[];
            console.log('Offline availability results:', availability);
            return availability;
        } catch (error) {
            console.error('Failed to check offline availability:', error);
            return new Array(urls.length).fill(false);
        }
    }

    async isUrlOfflineAvailable(url: string): Promise<boolean> {
        const availability = await this.checkOfflineAvailability([url]);
        return availability[0] || false;
    }
}
