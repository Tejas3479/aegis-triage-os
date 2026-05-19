'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, WifiOff } from 'lucide-react';
import { getOfflineQueue, QueuedAction, removeOfflineAction } from '@/lib/offline-queue';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SyncStatusProps {
  initialPendingCount?: number;
  initialIsOffline?: boolean;
  initialIsSyncing?: boolean;
  initialDeferredPrompt?: any;
}

export function SyncStatus({
  initialPendingCount,
  initialIsOffline,
  initialIsSyncing,
  initialDeferredPrompt
}: SyncStatusProps = {}) {
  const [pendingCount, setPendingCount] = useState(initialPendingCount ?? 0);
  const [isSyncing, setIsSyncing] = useState(initialIsSyncing ?? false);
  const [isOffline, setIsOffline] = useState(initialIsOffline ?? (typeof navigator !== 'undefined' ? !navigator.onLine : false));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(initialDeferredPrompt ?? null);

  const updateQueueCount = async () => {
    if (initialPendingCount !== undefined) return;
    const queue = await getOfflineQueue();
    setPendingCount(queue.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleUpdate = () => {
      if (initialPendingCount !== undefined) return;
      updateQueueCount();
    };
    const handleOnline = () => {
      if (initialIsOffline !== undefined) return;
      setIsOffline(false);
      replayQueue();
    };
    const handleOffline = () => {
      if (initialIsOffline !== undefined) return;
      setIsOffline(true);
    };
    
    const handleBeforeInstallPrompt = (e: any) => {
      if (initialDeferredPrompt !== undefined) return;
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('offline-queue-updated', handleUpdate);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('offline-queue-updated', handleUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replayQueue = async () => {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    toast.info(`Syncing ${queue.length} pending actions...`);

    for (const action of queue) {
      try {
        let endpoint = '/api/v1/triage/chat';
        if (action.type === 'wizard') endpoint = '/api/v1/triage/wizard';
        // Add others if needed

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });

        if (response.ok) {
          await removeOfflineAction(action.id);
        }
      } catch (err) {
        console.error(`Failed to replay action ${action.id}:`, err);
        // Stop replaying on first failure to preserve order
        break;
      }
    }

    setIsSyncing(false);
    updateQueueCount();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (pendingCount === 0 && !isOffline && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end z-50">
      {/* Install Prompt */}
      {deferredPrompt && (
        <div className="bg-card shadow-lg rounded-xl p-3 border border-border flex items-center gap-3 max-w-xs animate-in slide-in-from-bottom">
          <div className="text-xs">
            <p className="font-bold">Install Aegis App</p>
            <p className="text-muted-foreground">Add to home screen for offline access.</p>
          </div>
          <Button size="sm" onClick={handleInstall} className="h-8 text-xs gap-1">
            <Download size={12} />
            Install
          </Button>
        </div>
      )}

      {/* Sync Status */}
      {(pendingCount > 0 || isOffline) && (
        <div className={`shadow-lg rounded-full px-4 py-2 text-xs flex items-center gap-2 border ${isOffline ? 'bg-warning/10 text-warning border-warning/20' : 'bg-card text-foreground border-border'}`}>
          {isOffline ? (
            <WifiOff className="w-3 h-3" />
          ) : isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          
          {isOffline ? (
            <span>Offline ({pendingCount} pending)</span>
          ) : isSyncing ? (
            <span>Syncing {pendingCount} pending...</span>
          ) : (
            <span>{pendingCount} pending actions</span>
          )}
        </div>
      )}
    </div>
  );
}
