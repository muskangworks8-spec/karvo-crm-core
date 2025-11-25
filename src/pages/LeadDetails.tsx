import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { LeadNotes } from "@/components/leads/LeadNotes";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
  lead_stages: { name: string; color: string } | null;
}

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles!assigned_user_id(full_name),
          lead_stages(name, color)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error: any) {
      toast.error("Failed to fetch lead: " + error.message);
      navigate("/leads");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading lead details...</div>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">Lead Details</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge className="capitalize">{lead.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stage</p>
                  {lead.lead_stages && (
                    <Badge style={{ backgroundColor: lead.lead_stages.color }}>
                      {lead.lead_stages.name}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Source</p>
                  <p className="capitalize">{lead.source.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                  <p>{lead.profiles?.full_name || "Unassigned"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p>{lead.company}</p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>Created on {new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LeadNotes leadId={lead.id} />
        </div>

        <div className="lg:col-span-1">
          <ActivityTimeline leadId={lead.id} />
        </div>
      </div>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={lead}
        onSuccess={fetchLead}
      />
    </div>
  );
}
