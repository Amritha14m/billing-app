// Sync Context for BizLedger
import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncManager, SyncState } from '../lib/sync';
import { useAuth } from './AuthContext';

interface SyncContextType {
  status: SyncState;
  pendingCount: number;
  lastSyncTime: string | null;
  message?: string;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeBusiness } = useAuth();
  const [status, setStatus] = useState<SyncState>(syncManager.getStatus());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setStatus(state.status);
      setPendingCount(state.pendingCount);
      setLastSyncTime(state.lastSyncTime);
      setMessage(state.message);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const triggerSync = async () => {
    await syncManager.syncNow(activeBusiness?.id);
  };

  return (
    <SyncContext.Provider
      value={{
        status,
        pendingCount,
        lastSyncTime,
        message,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
