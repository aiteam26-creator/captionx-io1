import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Filter, ArrowLeft, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  user_id: string | null;
  event_name: string;
  timestamp: string;
  device: string | null;
  metadata: any;
}

export default function AdminEvents() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin, eventFilter, deviceFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("analytics_events")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      if (eventFilter !== "all") {
        query = query.eq("event_name", eventFilter as any);
      }

      if (deviceFilter !== "all") {
        query = query.eq("device", deviceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      event.event_name.toLowerCase().includes(searchLower) ||
      event.user_id?.toLowerCase().includes(searchLower) ||
      event.device?.toLowerCase().includes(searchLower)
    );
  });

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/usage")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Filter className="w-8 h-8" />
                Events Log
              </h1>
              <p className="text-muted-foreground">Raw event data with filtering and search</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/usage")} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="auth_success">Auth Success</SelectItem>
                <SelectItem value="project_created">Project Created</SelectItem>
                <SelectItem value="upload_started">Upload Started</SelectItem>
                <SelectItem value="upload_completed">Upload Completed</SelectItem>
                <SelectItem value="export_success">Export Success</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Events Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Device</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No events found
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {event.event_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono truncate max-w-xs">
                        {event.user_id || "anonymous"}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {event.device || "unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono max-w-xs truncate">
                        {JSON.stringify(event.metadata || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredEvents.length} of {events.length} events (max 500 most recent)
        </p>
      </div>
    </div>
  );
}