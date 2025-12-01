import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Users, Database, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const handleToggle = (type: string, value: boolean) => {
    toast.success(`${type} ${value ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your CRM configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general CRM settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                General configuration options will be available in future milestones.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked);
                    handleToggle("Email notifications", checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="in-app-notifications" className="text-base">In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the application
                  </p>
                </div>
                <Switch
                  id="in-app-notifications"
                  checked={inAppNotifications}
                  onCheckedChange={(checked) => {
                    setInAppNotifications(checked);
                    handleToggle("In-app notifications", checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-reminders" className="text-base">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for upcoming tasks
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={taskReminders}
                  onCheckedChange={(checked) => {
                    setTaskReminders(checked);
                    handleToggle("Task reminders", checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status-updates" className="text-base">Status Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when lead/client status changes
                  </p>
                </div>
                <Switch
                  id="status-updates"
                  checked={statusUpdates}
                  onCheckedChange={(checked) => {
                    setStatusUpdates(checked);
                    handleToggle("Status updates", checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Configure user-related settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced user configuration options will be available in future milestones.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>Manage database settings and connections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Database configuration options will be available in future milestones.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
