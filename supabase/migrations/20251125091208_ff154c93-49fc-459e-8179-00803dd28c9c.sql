-- Create enums for lead fields
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'in_progress', 'converted', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'email', 'phone', 'other');
CREATE TYPE activity_type AS ENUM ('status_change', 'assignment', 'note_added', 'email_sent', 'call_made', 'meeting_scheduled', 'other');

-- Lead stages table for pipeline management
CREATE TABLE public.lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Main leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source lead_source DEFAULT 'other',
  status lead_status DEFAULT 'new',
  stage_id UUID REFERENCES public.lead_stages(id),
  assigned_user_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead activity history
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  activity_type activity_type NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead notes/comments
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_stages
CREATE POLICY "Admins can manage stages" ON public.lead_stages FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Managers and team members can view stages" ON public.lead_stages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager', 'team_member')
  )
);

-- RLS Policies for leads
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view all leads" ON public.leads FOR SELECT USING (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can create leads" ON public.leads FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can update all leads" ON public.leads FOR UPDATE USING (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can delete all leads" ON public.leads FOR DELETE USING (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Team members can view assigned leads" ON public.leads FOR SELECT USING (
  public.has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid()
);

CREATE POLICY "Team members can update assigned leads" ON public.leads FOR UPDATE USING (
  public.has_role(auth.uid(), 'team_member') AND assigned_user_id = auth.uid()
);

-- RLS Policies for lead_activities
CREATE POLICY "Admins can manage all activities" ON public.lead_activities FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view all activities" ON public.lead_activities FOR SELECT USING (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can create activities" ON public.lead_activities FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Team members can view activities for assigned leads" ON public.lead_activities FOR SELECT USING (
  public.has_role(auth.uid(), 'team_member') AND 
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_user_id = auth.uid())
);

CREATE POLICY "Team members can create activities for assigned leads" ON public.lead_activities FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'team_member') AND 
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_user_id = auth.uid())
);

-- RLS Policies for lead_notes
CREATE POLICY "Admins can manage all notes" ON public.lead_notes FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view all notes" ON public.lead_notes FOR SELECT USING (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can create notes" ON public.lead_notes FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can update their notes" ON public.lead_notes FOR UPDATE USING (
  public.has_role(auth.uid(), 'manager') AND user_id = auth.uid()
);

CREATE POLICY "Managers can delete their notes" ON public.lead_notes FOR DELETE USING (
  public.has_role(auth.uid(), 'manager') AND user_id = auth.uid()
);

CREATE POLICY "Team members can view notes for assigned leads" ON public.lead_notes FOR SELECT USING (
  public.has_role(auth.uid(), 'team_member') AND 
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_notes.lead_id AND leads.assigned_user_id = auth.uid())
);

CREATE POLICY "Team members can create notes for assigned leads" ON public.lead_notes FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'team_member') AND 
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_notes.lead_id AND leads.assigned_user_id = auth.uid())
);

CREATE POLICY "Team members can update their notes" ON public.lead_notes FOR UPDATE USING (
  public.has_role(auth.uid(), 'team_member') AND user_id = auth.uid()
);

CREATE POLICY "Team members can delete their notes" ON public.lead_notes FOR DELETE USING (
  public.has_role(auth.uid(), 'team_member') AND user_id = auth.uid()
);

-- Triggers for updated_at
CREATE TRIGGER update_lead_stages_updated_at BEFORE UPDATE ON public.lead_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pipeline stages
INSERT INTO public.lead_stages (name, order_index, color) VALUES
  ('New', 1, '#D4AF37'),
  ('Contacted', 2, '#3b82f6'),
  ('In Progress', 3, '#f59e0b'),
  ('Converted', 4, '#10b981'),
  ('Lost', 5, '#ef4444');