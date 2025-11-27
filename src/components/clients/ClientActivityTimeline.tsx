import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  description: string;
  activity_type: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export function ClientActivityTimeline({ clientId }: { clientId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();
  }, [clientId]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("client_activities")
      .select("*, profiles(full_name)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20);

    setActivities(data || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
              <div className="flex-1 space-y-1">
                <p className="text-sm">{activity.description}</p>
                <div className="text-xs text-muted-foreground">
                  {activity.profiles?.full_name || "System"} •{" "}
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
