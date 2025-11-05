import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Users, Activity, Upload, FileDown, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Analytics {
  totalSignups: number;
  dau: number;
  wau: number;
  mau: number;
  totalUploads: number;
  totalExports: number;
  deviceSplit: { desktop: number; mobile: number; tablet: number };
}

export default function AdminUsage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total signups
      const { count: totalSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // DAU (last 24 hours)
      const { data: dauData } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const dau = new Set(dauData?.map(e => e.user_id).filter(Boolean)).size;

      // WAU (last 7 days)
      const { data: wauData } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("timestamp", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const wau = new Set(wauData?.map(e => e.user_id).filter(Boolean)).size;

      // MAU (last 30 days)
      const { data: mauData } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      const mau = new Set(mauData?.map(e => e.user_id).filter(Boolean)).size;

      // Uploads in time range
      const { count: totalUploads } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "upload_completed")
        .gte("timestamp", startDate.toISOString());

      // Exports in time range
      const { count: totalExports } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "export_success")
        .gte("timestamp", startDate.toISOString());

      // Device split in time range
      const { data: deviceData } = await supabase
        .from("analytics_events")
        .select("device")
        .gte("timestamp", startDate.toISOString());

      const deviceSplit = {
        desktop: deviceData?.filter(e => e.device === "desktop").length || 0,
        mobile: deviceData?.filter(e => e.device === "mobile").length || 0,
        tablet: deviceData?.filter(e => e.device === "tablet").length || 0,
      };

      setAnalytics({
        totalSignups: totalSignups || 0,
        dau,
        wau,
        mau,
        totalUploads: totalUploads || 0,
        totalExports: totalExports || 0,
        deviceSplit,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Create CSV content
      const headers = ["ID", "User ID", "Event Name", "Timestamp", "Device", "Metadata"];
      const rows = data.map(event => [
        event.id,
        event.user_id || "anonymous",
        event.event_name,
        new Date(event.timestamp).toISOString(),
        event.device || "unknown",
        JSON.stringify(event.metadata || {}),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics data exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Usage Analytics
              </h1>
              <p className="text-muted-foreground">Monitor application metrics and user activity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={() => navigate("/admin/events")} className="gap-2">
              <Activity className="w-4 h-4" />
              View Events Log
            </Button>
          </div>
        </div>

        {/* Time Range Tabs */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Signups */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Total Signups</h3>
            </div>
            <p className="text-4xl font-bold">{analytics?.totalSignups || 0}</p>
          </Card>

          {/* DAU/WAU/MAU */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Active Users</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">DAU:</span>
                <span className="font-semibold">{analytics?.dau || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">WAU:</span>
                <span className="font-semibold">{analytics?.wau || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">MAU:</span>
                <span className="font-semibold">{analytics?.mau || 0}</span>
              </div>
            </div>
          </Card>

          {/* Total Uploads */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Video Uploads</h3>
            </div>
            <p className="text-4xl font-bold">{analytics?.totalUploads || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Completed</p>
          </Card>

          {/* Total Exports */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FileDown className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Exports</h3>
            </div>
            <p className="text-4xl font-bold">{analytics?.totalExports || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Successful</p>
          </Card>
        </div>

        {/* Device Split */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Device Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {analytics?.deviceSplit.desktop || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Desktop</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {analytics?.deviceSplit.mobile || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Mobile</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">
                {analytics?.deviceSplit.tablet || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tablet</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}