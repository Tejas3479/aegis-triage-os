'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radar, AlertOctagon, Activity, MapPin, RefreshCw } from 'lucide-react';
import { fetchOutbreakClusters, OutbreakCluster } from '@/lib/api';

export default function CommandCenter() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await fetchOutbreakClusters();
      // Sort CRITICAL clusters to the top
      const sorted = data.sort((a, b) => {
        const riskWeight = { CRITICAL: 3, WARNING: 2, MONITOR: 1 };
        return riskWeight[b.risk_level] - riskWeight[a.risk_level];
      });
      setClusters(sorted);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("HDBSCAN sync failure", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
    const interval = setInterval(loadClusters, 30000); // 30-second polling
    return () => clearInterval(interval);
  }, []);

  const totalCases = clusters.reduce((acc, curr) => acc + curr.case_count, 0);
  const criticalCount = clusters.filter(c => c.risk_level === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-950/50 rounded-lg border border-indigo-500/30">
              <Radar className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase text-slate-100">Public Health Command</h1>
              <p className="text-slate-400 text-sm font-mono mt-1">Geospatial HDBSCAN Epidemic Clustering System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">LAST SYNC</div>
              <div className="text-sm font-medium text-slate-300">{lastUpdated.toLocaleTimeString()}</div>
            </div>
            <Button onClick={loadClusters} variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Force Scan
            </Button>
          </div>
        </div>

        {/* Global Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-indigo-400" /> Total Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-100 font-mono">{totalCases}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-emerald-400" /> Active Clusters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-100 font-mono">{clusters.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 text-red-500" /> Critical Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-500 font-mono">{criticalCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tactical Cluster Table */}
        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg tracking-wide uppercase text-slate-200">Live Outbreak Topology</CardTitle>
            <CardDescription className="text-slate-500 font-mono text-xs">Real-time geospatial aggregation mapping via backend vector analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 font-mono text-xs">CLUSTER ID</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs">RISK LEVEL</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs">DISEASE PATTERN</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs">CASE DENSITY</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs text-right">COORDINATES (LAT, LNG)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusters.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500 font-mono">No active epidemiological clusters detected.</TableCell>
                    </TableRow>
                  )}
                  {clusters.map((cluster) => {
                    const isCritical = cluster.risk_level === 'CRITICAL';
                    return (
                      <TableRow 
                        key={cluster.cluster_id} 
                        className={`border-slate-800 ${isCritical ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-slate-800/50'} transition-colors`}
                      >
                        <TableCell className="font-mono text-sm text-slate-300">
                          #{cluster.cluster_id.toString().padStart(4, '0')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isCritical ? 'destructive' : cluster.risk_level === 'WARNING' ? 'default' : 'secondary'}
                            className={`font-mono text-[10px] tracking-wider uppercase ${isCritical ? 'animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)] border border-red-500' : ''}`}
                          >
                            {isCritical && <AlertOctagon className="w-3 h-3 mr-1 inline" />}
                            {cluster.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          {cluster.disease_pattern}
                        </TableCell>
                        <TableCell className="font-mono text-slate-300">
                          {cluster.case_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-400">
                          {cluster.center_latitude.toFixed(4)}, {cluster.center_longitude.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
