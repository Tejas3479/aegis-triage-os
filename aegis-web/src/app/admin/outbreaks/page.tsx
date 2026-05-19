'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radar, AlertOctagon, Activity, MapPin, RefreshCw } from 'lucide-react';
import { fetchOutbreakClusters } from '@/lib/api';
// import { toast } from "sonner";
import Cookies from "js-cookie";
// import { useSessionTimeout } from "../../../hooks/useSessionTimeout";
import { OutbreakCluster } from '@/types';
import { ClinicalBadge } from '@/components/ui/clinical-badge';

export default function CommandCenter() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const router = useRouter();

  // Route Guard
  useEffect(() => {
    const token = Cookies.get('aegis_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await fetchOutbreakClusters();
      // Sort CRITICAL clusters to the top
      const sorted = data.sort((a, b) => {
        const riskWeight: Record<string, number> = { CRITICAL: 3, WARNING: 2, MONITOR: 1 };
        return riskWeight[b.risk_level] - riskWeight[a.risk_level];
      });
      setClusters(sorted);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Network Disconnected", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadClusters();
    };
    init();
    const interval = setInterval(loadClusters, 30000); // 30-second polling
    return () => clearInterval(interval);
  }, []);

  const totalCases = clusters.reduce((acc, curr) => acc + curr.case_count, 0);
  const criticalCount = clusters.filter(c => c.risk_level === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans medical-grid">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <Radar className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase text-foreground">Public Health Command</h1>
              <p className="text-muted-foreground text-sm font-mono mt-1">Geospatial HDBSCAN Epidemic Clustering System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-mono">LAST SYNC</div>
              <div className="text-sm font-medium text-foreground">{lastUpdated.toLocaleTimeString()}</div>
            </div>
            <Button onClick={loadClusters} variant="outline" className="border-border bg-card hover:bg-secondary text-foreground" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Force Scan
            </Button>
          </div>
        </div>

        {/* Global Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" /> Total Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground font-mono">{totalCases}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-stable" /> Active Clusters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground font-mono">{clusters.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 text-critical" /> Critical Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-critical font-mono">{criticalCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tactical Cluster Table */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg tracking-wide uppercase text-foreground">Live Outbreak Topology</CardTitle>
            <CardDescription className="text-muted-foreground font-mono text-xs">Real-time geospatial aggregation mapping via backend vector analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary">
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground font-mono text-xs">CLUSTER ID</TableHead>
                    <TableHead className="text-muted-foreground font-mono text-xs">RISK LEVEL</TableHead>
                    <TableHead className="text-muted-foreground font-mono text-xs">DISEASE PATTERN</TableHead>
                    <TableHead className="text-muted-foreground font-mono text-xs">CASE DENSITY</TableHead>
                    <TableHead className="text-muted-foreground font-mono text-xs text-right">COORDINATES (LAT, LNG)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusters.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-mono">No active epidemiological clusters detected.</TableCell>
                    </TableRow>
                  )}
                  {clusters.map((cluster) => {
                    const isCritical = cluster.risk_level === 'CRITICAL';
                    return (
                      <TableRow 
                        key={cluster.cluster_id} 
                        className={`border-border ${isCritical ? 'bg-critical/10 hover:bg-critical/20' : 'hover:bg-secondary/50'} transition-colors`}
                      >
                        <TableCell className="font-mono text-sm text-foreground">
                          #{cluster.cluster_id.toString().padStart(4, '0')}
                        </TableCell>
                        <TableCell>
                          <ClinicalBadge severity={
                            cluster.risk_level === 'CRITICAL' ? 'critical' : 
                            cluster.risk_level === 'WARNING' ? 'warning' : 'stable'
                          }>
                            {cluster.risk_level}
                          </ClinicalBadge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {cluster.disease_pattern}
                        </TableCell>
                        <TableCell className="font-mono text-foreground">
                          {cluster.case_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
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
