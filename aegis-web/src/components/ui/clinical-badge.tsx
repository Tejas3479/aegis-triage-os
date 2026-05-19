import React from 'react';

interface ClinicalBadgeProps {
  severity: "critical" | "warning" | "stable" | "info";
  children: React.ReactNode;
}

const severityStyles = {
  critical: "bg-critical/10 text-critical border-critical/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  stable: "bg-stable/10 text-stable border-stable/20",
  info: "bg-info/10 text-info border-info/20",
};

export function ClinicalBadge({ severity, children }: ClinicalBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[severity]}`}>
      {children}
    </span>
  );
}
