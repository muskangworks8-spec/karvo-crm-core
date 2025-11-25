import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  profiles: { full_name: string } | { full_name: string }[] | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface LeadKanbanProps {
  leads: Lead[];
  onUpdate: () => void;
}

export function LeadKanban({ leads, onUpdate }: LeadKanbanProps) {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    const { data } = await supabase
      .from("lead_stages")
      .select("*")
      .order("order_index");
    setStages(data || []);
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage_id === stageId);
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("leads")
        .update({ stage_id: stageId })
        .eq("id", draggedLead);

      if (error) throw error;

      // Log activity
      const stage = stages.find((s) => s.id === stageId);
      await supabase.from("lead_activities").insert({
        lead_id: draggedLead,
        user_id: user.id,
        activity_type: "status_change",
        description: `Lead moved to ${stage?.name}`,
      });

      toast.success("Lead moved successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDraggedLead(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        return (
          <div
            key={stage.id}
            className="space-y-3"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.name}
              </h3>
              <Badge variant="secondary">{stageLeads.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {stageLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">{lead.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {lead.company && (
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    )}
                    {lead.email && (
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs capitalize">
                        {lead.source.replace("_", " ")}
                      </Badge>
                      {lead.profiles && (
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(lead.profiles) ? lead.profiles[0]?.full_name : lead.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
