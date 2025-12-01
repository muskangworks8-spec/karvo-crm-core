import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Reports() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, clientsRes, tasksRes] = await Promise.all([
        supabase.from("leads").select("*, profiles!assigned_user_id(full_name), lead_stages(name)"),
        supabase.from("clients").select("*, profiles!assigned_user_id(full_name)"),
        supabase.from("tasks").select("*, profiles!assigned_user_id(full_name)"),
      ]);

      setLeads(leadsRes.data || []);
      setClients(clientsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (startDate) {
      filtered = filtered.filter((l) => new Date(l.created_at) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter((l) => new Date(l.created_at) <= new Date(endDate));
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((l) => l.source === sourceFilter);
    }

    return filtered;
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    try {
      const csvContent = [
        headers.join(","),
        ...data.map((row) => 
          headers.map((header) => {
            const value = row[header.toLowerCase().replace(/ /g, "_")] || "";
            return `"${value}"`;
          }).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const exportLeadsReport = () => {
    const filtered = filterLeads();
    const data = filtered.map((lead) => ({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source,
      status: lead.status,
      stage: lead.lead_stages?.name || "",
      assigned_to: lead.profiles?.full_name || "Unassigned",
      created_at: format(new Date(lead.created_at), "yyyy-MM-dd"),
    }));

    exportToCSV(
      data,
      "leads_report",
      ["Name", "Email", "Phone", "Company", "Source", "Status", "Stage", "Assigned To", "Created At"]
    );
  };

  const exportClientsReport = () => {
    const data = clients.map((client) => ({
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status,
      assigned_to: client.profiles?.full_name || "Unassigned",
      created_at: format(new Date(client.created_at), "yyyy-MM-dd"),
    }));

    exportToCSV(
      data,
      "clients_report",
      ["Name", "Company", "Email", "Phone", "Status", "Assigned To", "Created At"]
    );
  };

  const exportTasksReport = () => {
    const data = tasks.map((task) => ({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
      assigned_to: task.profiles?.full_name || "Unassigned",
      created_at: format(new Date(task.created_at), "yyyy-MM-dd"),
    }));

    exportToCSV(
      data,
      "tasks_report",
      ["Title", "Description", "Status", "Priority", "Due Date", "Assigned To", "Created At"]
    );
  };

  const filteredLeads = filterLeads();

  const stats = {
    totalLeads: filteredLeads.length,
    convertedLeads: filteredLeads.filter((l) => l.status === "converted").length,
    totalClients: clients.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and export CRM reports</p>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filter Options
          </CardTitle>
          <CardDescription>Customize your report data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{stats.convertedLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.completedTasks}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{stats.pendingTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] transition-all">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Leads Report</CardTitle>
            <CardDescription>Export filtered leads data to CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportLeadsReport} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Export Leads
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-[0_0_30px_-5px_hsl(var(--gold)/0.3)] transition-all">
          <CardHeader>
            <FileText className="h-8 w-8 text-gold mb-2" />
            <CardTitle>Clients Report</CardTitle>
            <CardDescription>Export all clients data to CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportClientsReport} className="w-full" size="lg" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export Clients
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)] transition-all">
          <CardHeader>
            <FileText className="h-8 w-8 text-accent mb-2" />
            <CardTitle>Tasks Report</CardTitle>
            <CardDescription>Export all tasks data to CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportTasksReport} className="w-full" size="lg" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
