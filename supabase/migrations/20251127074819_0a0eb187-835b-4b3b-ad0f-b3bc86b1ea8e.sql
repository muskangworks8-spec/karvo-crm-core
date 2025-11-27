-- Create client status enum
CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'prospect', 'former');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status client_status DEFAULT 'prospect',
  notes TEXT,
  assigned_user_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_notes table
CREATE TABLE public.client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_activities table
CREATE TABLE public.client_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  activity_type activity_type DEFAULT 'other',
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  assigned_user_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT task_linked_to_lead_or_client CHECK (
    (lead_id IS NOT NULL AND client_id IS NULL) OR
    (lead_id IS NULL AND client_id IS NOT NULL) OR
    (lead_id IS NULL AND client_id IS NULL)
  )
);

-- Create task_activities table
CREATE TABLE public.task_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  activity_type activity_type DEFAULT 'other',
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Admins can manage all clients" ON public.clients FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Managers can view all clients" ON public.clients FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can create clients" ON public.clients FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update all clients" ON public.clients FOR UPDATE USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can delete all clients" ON public.clients FOR DELETE USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Team members can view assigned clients" ON public.clients FOR SELECT USING (has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid());
CREATE POLICY "Team members can update assigned clients" ON public.clients FOR UPDATE USING (has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid());

-- RLS Policies for client_notes
CREATE POLICY "Admins can manage all client notes" ON public.client_notes FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Managers can view all client notes" ON public.client_notes FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can create client notes" ON public.client_notes FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update their client notes" ON public.client_notes FOR UPDATE USING (has_role(auth.uid(), 'manager') AND user_id = auth.uid());
CREATE POLICY "Managers can delete their client notes" ON public.client_notes FOR DELETE USING (has_role(auth.uid(), 'manager') AND user_id = auth.uid());
CREATE POLICY "Team members can view notes for assigned clients" ON public.client_notes FOR SELECT USING (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_user_id = auth.uid()));
CREATE POLICY "Team members can create notes for assigned clients" ON public.client_notes FOR INSERT WITH CHECK (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_user_id = auth.uid()));
CREATE POLICY "Team members can update their client notes" ON public.client_notes FOR UPDATE USING (has_role(auth.uid(), 'team_member') AND user_id = auth.uid());
CREATE POLICY "Team members can delete their client notes" ON public.client_notes FOR DELETE USING (has_role(auth.uid(), 'team_member') AND user_id = auth.uid());

-- RLS Policies for client_activities
CREATE POLICY "Admins can manage all client activities" ON public.client_activities FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Managers can view all client activities" ON public.client_activities FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can create client activities" ON public.client_activities FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'));
CREATE POLICY "Team members can view activities for assigned clients" ON public.client_activities FOR SELECT USING (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_activities.client_id AND clients.assigned_user_id = auth.uid()));
CREATE POLICY "Team members can create activities for assigned clients" ON public.client_activities FOR INSERT WITH CHECK (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_activities.client_id AND clients.assigned_user_id = auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Managers can view all tasks" ON public.tasks FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can create tasks" ON public.tasks FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update all tasks" ON public.tasks FOR UPDATE USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can delete all tasks" ON public.tasks FOR DELETE USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Team members can view assigned tasks" ON public.tasks FOR SELECT USING (has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid());
CREATE POLICY "Team members can update assigned tasks" ON public.tasks FOR UPDATE USING (has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid());

-- RLS Policies for task_activities
CREATE POLICY "Admins can manage all task activities" ON public.task_activities FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Managers can view all task activities" ON public.task_activities FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can create task activities" ON public.task_activities FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'));
CREATE POLICY "Team members can view activities for assigned tasks" ON public.task_activities FOR SELECT USING (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_activities.task_id AND tasks.assigned_user_id = auth.uid()));
CREATE POLICY "Team members can create activities for assigned tasks" ON public.task_activities FOR INSERT WITH CHECK (has_role(auth.uid(), 'team_member') AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_activities.task_id AND tasks.assigned_user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_notes_updated_at BEFORE UPDATE ON public.client_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();