"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, AlertTriangle, FileText, Video } from "lucide-react";
import { downloadEHRPdf } from "@/lib/api";
import { triggerFHIRDownload } from "@/lib/fhir-mapper";
import { useQueue } from "@/hooks/useQueue";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const { queue, loading, refresh } = useQueue();
  const router = useRouter();

  // Route Guard
  useEffect(() => {
    const token = localStorage.getItem("aegis_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Active Triage Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time algorithmic patient prioritization</p>
          </div>
          <Button onClick={() => refresh()} variant="outline" className="border-slate-800 hover:bg-slate-900" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync EHR
          </Button>
        </div>

        <div className="rounded-md border border-white/10 bg-slate-900/40 backdrop-blur-lg shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Patient Hash</TableHead>
                <TableHead className="text-slate-400">Risk Score</TableHead>
                <TableHead className="text-slate-400">Care Level</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Interoperability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">No active triage sessions.</TableCell>
                </TableRow>
              )}
              {queue.map((patient) => {
                const isEmergency = patient.care_level === "EMERGENCY_ROOM";
                return (
                  <TableRow 
                    key={patient.id} 
                    className={`border-slate-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10 cursor-pointer ${isEmergency ? "bg-red-950/20 hover:bg-red-950/40 border-l-4 border-l-red-600" : "hover:bg-slate-800/50"}`}
                  >
                    <TableCell className="font-mono text-xs text-slate-300">
                      {isEmergency && <AlertTriangle className="inline w-4 h-4 text-red-500 mr-2 animate-pulse" />}
                      {patient.patient_id.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.risk_score > 70 ? "destructive" : "secondary"}>
                        {patient.risk_score}/100
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">{patient.care_level}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{patient.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:text-indigo-400 hover:bg-indigo-950/50"
                          onClick={() => triggerFHIRDownload(patient)}
                        >
                          <Download className="w-4 h-4 mr-2" /> FHIR R4
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:text-amber-400 hover:bg-amber-950/50"
                          onClick={async () => {
                            try {
                              await downloadEHRPdf(patient.id);
                              toast.success("EHR PDF downloaded successfully.");
                            } catch (error: unknown) {
                              toast.error(error instanceof Error ? error.message : "Download failed.");
                            }
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" /> EHR PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:text-emerald-400 hover:bg-emerald-950/50"
                          onClick={() => {
                            toast("Secure WebRTC Initializing", {
                              description: "Routing to encrypted telemedicine room...",
                            });
                          }}
                        >
                          <Video className="w-4 h-4 mr-2" /> Start Video
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
