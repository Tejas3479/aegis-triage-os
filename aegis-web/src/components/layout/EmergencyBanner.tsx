import React from "react";
import { AlertTriangle, Phone, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyBannerProps {
  showSoundToggle?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

export function EmergencyBanner({ 
  showSoundToggle = false, 
  soundEnabled = false, 
  onSoundToggle 
}: EmergencyBannerProps) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-2 text-sm flex flex-col sm:flex-row items-center justify-between gap-2 z-50 relative">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
        <span className="font-medium">Medical emergency? Call 108 or your local emergency number immediately.</span>
      </div>
      <div className="flex items-center gap-3">
        {showSoundToggle && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onSoundToggle}
            className="h-8 px-2 text-destructive hover:bg-destructive/20 rounded-lg flex items-center gap-1.5"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Alert On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Alert Muted</span>
              </>
            )}
          </Button>
        )}
        <a href="tel:108" className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-destructive/90 transition flex items-center gap-1.5 shadow-md shadow-destructive/15">
          <Phone className="w-3.5 h-3.5" /> Call 108
        </a>
      </div>
    </div>
  );
}
