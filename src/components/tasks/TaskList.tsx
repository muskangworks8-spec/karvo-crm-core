import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { TaskDialog } from "./TaskDialog";
import { formatDistanceToNow } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  profiles: { full_name: string } | null;
}

interface TaskListProps {
  leadId?: string;
  clientId?: string;
}

export function TaskList({ leadId, clientId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  useEffect(() => {
    fetchTasks();
  }, [leadId, clientId]);

  const fetchTasks = async () => {
    let query = supabase
      .from("tasks")
      .select("*, profiles!assigned_user_id(full_name)")
      .order("due_date", { ascending: true, nullsFirst: false });

    if (leadId) {
      query = query.eq("lead_id", leadId);
    } else if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch tasks");
    } else {
      setTasks(data || []);
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", task.id);

      if (error) throw error;

      await supabase.from("task_activities").insert({
        task_id: task.id,
        user_id: user?.id,
        activity_type: "status_change",
        description: `Task marked as ${newStatus}`,
      });

      fetchTasks();
      toast.success(`Task marked as ${newStatus}`);
    } catch (error: any) {
      toast.error("Failed to update task: " + error.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Button size="sm" onClick={() => { setSelectedTask(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => { setSelectedTask(task); setDialogOpen(true); }}
              >
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusToggle(task);
                    }}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.profiles?.full_name && (
                        <span>Assigned to {task.profiles.full_name}</span>
                      )}
                      {task.due_date && (
                        <>
                          <span>•</span>
                          <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        leadId={leadId}
        clientId={clientId}
        onSuccess={fetchTasks}
      />
    </Card>
  );
}
