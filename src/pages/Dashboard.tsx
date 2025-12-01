import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, UserCog, Target, CheckCircle2, Clock, TrendingUp, Briefcase, ListTodo } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    managers: 0,
    teamMembers: 0,
    totalLeads: 0,
    convertedLeads: 0,
    totalClients: 0,
    activeClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    conversionRate: 0,
  });

  const [leadsByStage, setLeadsByStage] = useState<any[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<any[]>([]);
  const [tasksByPriority, setTasksByPriority] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const fetchStats = async () => {
    try {
      const [profiles, roles, leads, clients, tasks] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("leads").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("tasks").select("*"),
      ]);

      const convertedCount = leads.data?.filter((l) => l.status === "converted").length || 0;
      const totalLeadsCount = leads.data?.length || 0;

      setStats({
        totalUsers: profiles.data?.length || 0,
        admins: roles.data?.filter((r) => r.role === "admin").length || 0,
        managers: roles.data?.filter((r) => r.role === "manager").length || 0,
        teamMembers: roles.data?.filter((r) => r.role === "team_member").length || 0,
        totalLeads: totalLeadsCount,
        convertedLeads: convertedCount,
        totalClients: clients.data?.length || 0,
        activeClients: clients.data?.filter((c) => c.status === "active").length || 0,
        totalTasks: tasks.data?.length || 0,
        completedTasks: tasks.data?.filter((t) => t.status === "completed").length || 0,
        pendingTasks: tasks.data?.filter((t) => t.status === "pending").length || 0,
        conversionRate: totalLeadsCount > 0 ? Math.round((convertedCount / totalLeadsCount) * 100) : 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Leads by stage
      const { data: stages } = await supabase
        .from("lead_stages")
        .select("id, name, color")
        .order("order_index");

      const { data: leads } = await supabase.from("leads").select("stage_id, source");

      if (stages && leads) {
        const stageData = stages.map((stage) => ({
          name: stage.name,
          count: leads.filter((l) => l.stage_id === stage.id).length,
          color: stage.color,
        }));
        setLeadsByStage(stageData);

        // Leads by source
        const sourceMap: Record<string, number> = {};
        leads.forEach((lead) => {
          const source = lead.source || "other";
          sourceMap[source] = (sourceMap[source] || 0) + 1;
        });

        const sourceData = Object.entries(sourceMap).map(([name, count]) => ({
          name: name.replace("_", " "),
          count,
        }));
        setLeadsBySource(sourceData);
      }

      // Tasks by priority
      const { data: tasks } = await supabase.from("tasks").select("priority");
      if (tasks) {
        const priorityMap: Record<string, number> = {};
        tasks.forEach((task) => {
          const priority = task.priority || "medium";
          priorityMap[priority] = (priorityMap[priority] || 0) + 1;
        });

        const priorityData = Object.entries(priorityMap).map(([name, count]) => ({
          name,
          count,
        }));
        setTasksByPriority(priorityData);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--gold-light))", "hsl(var(--accent))", "hsl(var(--muted))"];

  const primaryStatCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: Target,
      description: "All leads in pipeline",
      trend: "+12% from last month",
    },
    {
      title: "Active Clients",
      value: stats.activeClients,
      icon: Briefcase,
      description: "Active partnerships",
      trend: "+8% from last month",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: ListTodo,
      description: "Awaiting completion",
      trend: `${stats.totalTasks} total tasks`,
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: "Lead to client conversion",
      trend: `${stats.convertedLeads} converted`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Karvo CRM - Your fashion business command center
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {primaryStatCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="border-border bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] transition-all duration-300 group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-primary mt-2">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leads Pipeline Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Leads Pipeline Overview</CardTitle>
            <CardDescription>Distribution of leads across stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Lead Sources Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Task distribution and urgency</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--gold))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>User roles and access levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Administrators</p>
                    <p className="text-xs text-muted-foreground">Full access</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.admins}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Managers</p>
                    <p className="text-xs text-muted-foreground">Management access</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.managers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Team Members</p>
                    <p className="text-xs text-muted-foreground">Standard access</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.teamMembers}</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Users</span>
                  <span className="text-xl font-bold text-primary">{stats.totalUsers}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
