"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent text-xs font-bold uppercase tracking-widest text-foreground focus:outline-none cursor-pointer"
      >
        <option value="en" className="text-black">EN</option>
        <option value="hi" className="text-black">HI</option>
        <option value="kn" className="text-black">KN</option>
      </select>
    </div>
  );
}
