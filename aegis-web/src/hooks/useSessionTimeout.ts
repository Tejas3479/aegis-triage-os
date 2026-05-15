import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useSessionTimeout(timeoutMs = 900000) { // Default 15 minutes
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    Cookies.remove('aegis_token');
    toast("Session Expired", {
      description: "You have been logged out due to inactivity for security compliance.",
    });
    router.push('/login');
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, timeoutMs);
  };

  useEffect(() => {
    // Initial timer setup
    resetTimer();

    // Listen for user interaction events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs, router]);

  return { resetTimer };
}
