import { useState, useEffect, useCallback } from 'react';
import { fetchDoctorQueue } from '@/lib/api';
import { DoctorQueueItem } from '@/types';
import { toast } from 'sonner';

export function useQueue(refreshInterval = 10000) {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchDoctorQueue();
      // Enterprise Sorting: Risk Score (desc) -> Updates (asc)
      const sorted = data.sort((a, b) => b.risk_score - a.risk_score);
      setQueue(sorted);
    } catch (error: unknown) {
      toast.error("Queue Sync Failed", {
        description: error instanceof Error ? error.message : "Network disconnected."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncQueue = async () => {
      await loadQueue();
    };
    syncQueue();
    const interval = setInterval(() => loadQueue(true), refreshInterval);
    return () => clearInterval(interval);
  }, [loadQueue, refreshInterval]);

  return { queue, loading, refresh: loadQueue };
}
