import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, LayoutGrid, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadKanban } from "@/components/leads/LeadKanban";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  stage_id: string | null;
  assigned_user_id: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  lead_stages: { name: string; color: string } | null;
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, statusFilter, assigneeFilter]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles!assigned_user_id(full_name),
          lead_stages(name, color)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (assigneeFilter !== "all") {
      filtered = filtered.filter((lead) => lead.assigned_user_id === assigneeFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to delete lead: " + error.message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "contacted":
        return "secondary";
      case "in_progress":
        return "outline";
      case "converted":
        return "default";
      case "lost":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your leads</p>
        </div>
        <Button onClick={() => {
          setSelectedLead(null);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
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
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <LeadKanban leads={filteredLeads} onUpdate={fetchLeads} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No leads found. Add your first lead to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.company || "-"}</TableCell>
                    <TableCell className="capitalize">{lead.source.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.lead_stages && (
                        <Badge style={{ backgroundColor: lead.lead_stages.color }}>
                          {lead.lead_stages.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.profiles?.full_name || "Unassigned"}</TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
