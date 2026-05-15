"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Activity, Users, LogOut, Radar, Mic } from "lucide-react";
import Cookies from "js-cookie";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide Navbar on Auth pages and Landing page
  const hideNavbar = ["/", "/login", "/signup", "/privacy", "/terms"].includes(pathname);
  if (hideNavbar) return null;

  const handleLogout = () => {
    Cookies.remove("aegis_token");
    Cookies.remove("aegis_role");
    router.push("/login");
  };

  const navLinks = [
    { name: "Patient Portal", href: "/patient", icon: Mic },
    { name: "Clinical Queue", href: "/doctor", icon: Users },
    { name: "Epidemic Radar", href: "/admin/outbreaks", icon: Radar },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tighter text-xl bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Aegis OS
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">
              Authenticated
            </span>
            <span className="text-[12px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Clinical Node
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all group"
            title="Secure Logout"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}
