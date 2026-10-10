// Offline-First Synchronization Engine for BizLedger
import { supabase, isSupabaseConfigured } from './supabase';
import {
  getPendingSyncItems,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getDB,
} from './db';
import { SyncQueueItem } from '../types';

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'failed' | 'conflict';

type SyncListener = (state: {
  status: SyncState;
  pendingCount: number;
  lastSyncTime: string | null;
  message?: string;
}) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private currentStatus: SyncState = navigator.onLine ? 'online' : 'offline';
  private lastSyncTime: string | null = null;
  private syncInterval: any = null;

  constructor() {
    window.addEventListener('online', () => {
      this.currentStatus = 'online';
      this.notify();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.currentStatus = 'offline';
      this.notify();
    });

    // Auto sync interval every 60 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && isSupabaseConfigured()) {
        this.syncNow();
      }
    }, 60000);
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify(message?: string) {
    let pendingCount = 0;
    try {
      const db = await getDB();
      pendingCount = await db.count('sync_queue');
    } catch {
      // ignore
    }

    const payload = {
      status: this.currentStatus,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      message,
    };

    this.listeners.forEach((l) => l(payload));
  }

  public async syncNow(businessId?: string): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, error: 'Sync already in progress' };
    if (!navigator.onLine) {
      this.currentStatus = 'offline';
      this.notify('Device is offline');
      return { success: false, syncedCount: 0, error: 'Offline' };
    }

    if (!isSupabaseConfigured()) {
      this.currentStatus = 'synced';
      this.lastSyncTime = new Date().toISOString();
      this.notify('Local mode (Supabase URL/Key not configured)');
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.currentStatus = 'syncing';
    this.notify('Synchronizing data with cloud...');

    let syncedCount = 0;

    try {
      const db = await getDB();
      const allQueue = await db.getAll('sync_queue');
      const targetQueue = businessId
        ? allQueue.filter((item) => item.business_id === businessId)
        : allQueue;

      for (const item of targetQueue) {
        try {
          item.status = 'processing';
          await updateSyncQueueItem(item);

          let error: any = null;

          if (item.action === 'insert' || item.action === 'update') {
            const { error: upsertErr } = await supabase
              .from(item.table_name)
              .upsert(item.payload, { onConflict: 'id' });
            error = upsertErr;
          } else if (item.action === 'delete') {
            const { error: delErr } = await supabase
              .from(item.table_name)
              .delete()
              .eq('id', item.record_id);
            error = delErr;
          }

          if (error) {
            item.status = 'failed';
            item.retry_count += 1;
            item.last_error = error.message;
            await updateSyncQueueItem(item);
          } else {
            await removeSyncQueueItem(item.id);
            syncedCount++;
          }
        } catch (itemErr: any) {
          item.status = 'failed';
          item.retry_count += 1;
          item.last_error = itemErr.message || 'Unknown network error';
          await updateSyncQueueItem(item);
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.currentStatus = 'synced';
      this.notify('Synchronization completed');
      return { success: true, syncedCount };
    } catch (err: any) {
      this.currentStatus = 'failed';
      this.notify(err.message || 'Sync failed');
      return { success: false, syncedCount, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  public getStatus(): SyncState {
    return this.currentStatus;
  }
}

export const syncManager = new SyncManager();
