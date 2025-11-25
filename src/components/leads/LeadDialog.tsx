import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(["website", "referral", "social_media", "email", "phone", "other"]),
  status: z.enum(["new", "contacted", "in_progress", "converted", "lost"]),
  stage_id: z.string().optional(),
  assigned_user_id: z.string().optional(),
});

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  onSuccess: () => void;
}

export function LeadDialog({ open, onOpenChange, lead, onSuccess }: LeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "other",
      status: "new",
      stage_id: "",
      assigned_user_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchStages();
      if (lead) {
        form.reset({
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          source: lead.source,
          status: lead.status,
          stage_id: lead.stage_id || "",
          assigned_user_id: lead.assigned_user_id || "",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          phone: "",
          company: "",
          source: "other",
          status: "new",
          stage_id: "",
          assigned_user_id: "",
        });
      }
    }
  }, [open, lead]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    setUsers(data || []);
  };

  const fetchStages = async () => {
    const { data } = await supabase
      .from("lead_stages")
      .select("*")
      .order("order_index");
    setStages(data || []);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const leadData = {
        ...values,
        email: values.email || null,
        phone: values.phone || null,
        company: values.company || null,
        stage_id: values.stage_id || null,
        assigned_user_id: values.assigned_user_id || null,
        created_by: user.id,
      };

      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            company: values.company || null,
            source: values.source,
            status: values.status,
            stage_id: values.stage_id || null,
            assigned_user_id: values.assigned_user_id || null,
          })
          .eq("id", lead.id);
        if (error) throw error;
        
        // Log activity
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: "other",
          description: "Lead updated",
        });

        toast.success("Lead updated successfully");
      } else {
        const { data: newLead, error } = await supabase
          .from("leads")
          .insert([{
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            company: values.company || null,
            source: values.source,
            status: values.status,
            stage_id: values.stage_id || null,
            assigned_user_id: values.assigned_user_id || null,
            created_by: user.id,
          }])
          .select()
          .single();
        if (error) throw error;

        // Log activity
        await supabase.from("lead_activities").insert({
          lead_id: newLead.id,
          user_id: user.id,
          activity_type: "other",
          description: "Lead created",
        });

        toast.success("Lead created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : lead ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
