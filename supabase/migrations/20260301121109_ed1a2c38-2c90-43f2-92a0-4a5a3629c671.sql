
CREATE TABLE public.pab_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pab_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active PAB items"
  ON public.pab_items
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage PAB items"
  ON public.pab_items
  FOR ALL
  USING (is_admin_or_pengurus(auth.uid()));
