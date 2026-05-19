'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Search, 
  Calendar,
  Filter,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { downloadEHRPdf } from '@/lib/api';

const MOCK_REPORTS = [
  { id: 'AEGIS-77-PX4', patient: 'Anonymous #PX4', date: '2024-05-15', status: 'Generated', size: '1.2MB' },
  { id: 'AEGIS-12-QB9', patient: 'Anonymous #QB9', date: '2024-05-14', status: 'Archived', size: '0.9MB' },
  { id: 'AEGIS-99-TK2', patient: 'Anonymous #TK2', date: '2024-05-14', status: 'Generated', size: '1.5MB' },
];

export default function ReportsArchivePage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      await downloadEHRPdf(id);
    } catch (err) {
      console.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col">
      <header className="px-6 py-6 bg-slate-900/40 border-b border-white/5 space-y-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/doctor">
              <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/5 bg-slate-950 text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                <FileText className="text-emerald-400" size={32} />
                Report Archive
              </h1>
              <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-widest">
                EHR Repository // Clinical Audited
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/5 bg-slate-900/50 gap-2 text-xs font-bold uppercase tracking-widest">
              <Calendar size={14} /> Date Range
            </Button>
            <Button variant="outline" className="border-white/5 bg-slate-900/50 gap-2 text-xs font-bold uppercase tracking-widest">
              <Filter size={14} /> Filter
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <Input 
            placeholder="Search by Session ID or Patient Alias..." 
            className="pl-12 h-12 bg-slate-950 border-white/10 rounded-2xl text-slate-100 focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/5 bg-slate-900/20 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="p-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">Report Reference</th>
                  <th className="p-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">Clinical Date</th>
                  <th className="p-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">Status</th>
                  <th className="p-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_REPORTS.map((report) => (
                  <tr key={report.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{report.id}</p>
                          <p className="text-[10px] font-mono text-slate-500">{report.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs text-slate-400 font-mono">{report.date}</span>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="text-[9px] uppercase font-mono border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                        <CheckCircle2 size={10} className="mr-1" /> {report.status}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <Button 
                        onClick={() => handleDownload(report.id)}
                        disabled={downloading === report.id}
                        variant="ghost" 
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 gap-2 h-9 px-4 rounded-lg transition-all"
                      >
                        {downloading === report.id ? 'Compiling...' : <><Download size={14} /> Download PDF</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              All reports are encrypted at rest with AES-GCM-256
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
