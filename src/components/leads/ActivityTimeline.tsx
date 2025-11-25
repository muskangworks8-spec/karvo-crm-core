import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface ActivityTimelineProps {
  leadId: string;
}

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [leadId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_activities")
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch activities: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "status_change":
        return "bg-blue-500";
      case "assignment":
        return "bg-purple-500";
      case "note_added":
        return "bg-green-500";
      case "email_sent":
        return "bg-yellow-500";
      case "call_made":
        return "bg-orange-500";
      case "meeting_scheduled":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activities yet</p>
          ) : (
            activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.activity_type)}`} />
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-border absolute top-3" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {activity.activity_type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  {activity.profiles && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {activity.profiles.full_name}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
