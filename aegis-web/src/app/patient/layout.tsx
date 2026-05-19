import React from "react";
import { EmergencyBanner } from "@/components/layout/EmergencyBanner";
import { SyncStatus } from "@/components/layout/SyncStatus";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmergencyBanner />
      {children}
      <SyncStatus />
    </>
  );
}
