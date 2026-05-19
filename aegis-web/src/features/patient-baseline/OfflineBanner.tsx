'use client';
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setHydrated(true);
      setIsOffline(!navigator.onLine);
    };
    init();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!hydrated || !isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 p-2 animate-in slide-in-from-top-4">
      <Alert variant="destructive" className="bg-red-950 border-red-700 text-red-100 shadow-xl">
        <WifiOff className="h-4 w-4" />
        <AlertTitle className="font-bold tracking-tight">Rural Offline Resilience Active</AlertTitle>
        <AlertDescription className="text-xs text-red-300">
          Network disconnected. Audio symptom profiles will automatically queue locally and sync when connectivity returns.
        </AlertDescription>
      </Alert>
    </div>
  );
};
