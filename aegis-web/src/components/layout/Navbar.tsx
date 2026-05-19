'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, 
  User, 
  LogOut, 
  Home, 
  ShieldAlert, 
  Radar, 
  ChevronRight,
  Stethoscope,
  FileCheck,
  Sun,
  Moon
} from 'lucide-react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    Cookies.remove('aegis_token');
    Cookies.remove('aegis_role');
    router.push('/login');
  };

  const clinicalLinks = [
    { label: 'Dashboard', href: '/doctor', icon: Home },
    { label: 'Triage Queue', href: '/doctor/queue', icon: Activity },
    { label: 'Report Archive', href: '/doctor/reports', icon: FileCheck },
    { label: 'Epidemic Radar', href: '/admin/outbreaks', icon: ShieldAlert },
  ];

  const patientLinks = [
    { label: 'Dashboard', href: '/patient', icon: User },
    { label: 'Symptom Chat', href: '/patient/chat', icon: Activity },
    { label: 'Voice Triage', href: '/patient/voice', icon: Stethoscope },
  ];

  const isClinicalZone = pathname.includes('/doctor') || pathname.includes('/admin');
  const isPatientZone = pathname.includes('/patient');
  const isPublicZone = !isClinicalZone && !isPatientZone;

  // Logo Component
  const Logo = () => (
    <Link href="/" className="flex items-center gap-3 group relative">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/40 blur-md rounded-full group-hover:bg-emerald-400/60 transition-all duration-500" />
        <ShieldAlert className="w-7 h-7 text-emerald-400 relative z-10 transition-transform group-hover:scale-110 duration-500" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_12px_rgba(52,211,153,1)] z-20" />
      </div>
      <div className="flex flex-col">
        <span className="font-black tracking-[0.1em] text-xl leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase text-glow">
          Aegis OS
        </span>
        <span className="text-[8px] font-mono font-bold tracking-[0.4em] text-emerald-500/80 uppercase">
          Clinical Intelligence
        </span>
      </div>
    </Link>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-card border-b border-border h-16 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between relative z-10">
        
        {/* Left Section: Logo */}
        <Logo />

        {/* Right Section: Contextual Content */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          
          {/* STATE A: Clinical Zone */}
          {isClinicalZone && (
            <div className="flex items-center gap-3">
              <Link href="/doctor">
                <Button variant="ghost" size="sm" className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] gap-2 transition-all duration-300",
                  pathname === '/doctor' ? "text-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(52,211,153,0.15)]" : "text-slate-400 hover:text-slate-100"
                )}>
                  <Activity className="w-3.5 h-3.5" />
                  Queue
                </Button>
              </Link>
              <Link href="/admin/outbreaks">
                <Button variant="ghost" size="sm" className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] gap-2 transition-all duration-300",
                  pathname === '/admin/outbreaks' ? "text-indigo-400 bg-indigo-400/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "text-slate-400 hover:text-slate-100"
                )}>
                  <Radar className="w-3.5 h-3.5" />
                  Radar
                </Button>
              </Link>
              <div className="h-4 w-[1px] bg-border mx-2" />
              <ThemeToggle />
              <div className="h-4 w-[1px] bg-border mx-2" />
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase tracking-[0.2em] border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/60 transition-all duration-300 gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Secure Logout
              </Button>
            </div>
          )}

          {/* STATE B: Patient Zone */}
          {isPatientZone && (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="h-4 w-[1px] bg-border mx-2" />
              <Button 
                onClick={() => router.push('/')}
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase tracking-[0.2em] border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/30 transition-all duration-300 gap-2 px-4 rounded-full"
              >
                <Home className="w-3.5 h-3.5" />
                End Session
              </Button>
            </div>
          )}

          {/* STATE C: Public Zone */}
          {isPublicZone && (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-100 transition-colors">
                  Clinical Access
                </Button>
              </Link>
              <Link href="/patient">
                <Button className="relative group overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] h-10 px-6 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-500 hover:scale-105 active:scale-95">
                  <span className="relative z-10 flex items-center gap-2">
                    Patient Portal
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};
