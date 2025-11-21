import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, UserCog } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    managers: 0,
    teamMembers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");

      setStats({
        totalUsers: profiles?.length || 0,
        admins: roles?.filter((r) => r.role === "admin").length || 0,
        managers: roles?.filter((r) => r.role === "manager").length || 0,
        teamMembers: roles?.filter((r) => r.role === "team_member").length || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Administrators",
      value: stats.admins,
      icon: ShieldCheck,
      description: "Full access users",
    },
    {
      title: "Managers",
      value: stats.managers,
      icon: UserCog,
      description: "Management level",
    },
    {
      title: "Team Members",
      value: stats.teamMembers,
      icon: Users,
      description: "Standard users",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Karvo CRM - Your fashion business command center
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Karvo CRM Milestone 1 - Core Setup Complete</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-3" />
              <span className="text-sm text-foreground">User authentication & role-based access</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-3" />
              <span className="text-sm text-foreground">User management system</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-3" />
              <span className="text-sm text-foreground">Luxury black, white & gold theme</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-3" />
              <span className="text-sm text-foreground">Responsive design with sidebar navigation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
