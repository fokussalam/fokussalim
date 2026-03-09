
-- Submissions table
CREATE TABLE public.tajwid_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  santri_name text NOT NULL,
  surah_number integer NOT NULL,
  ayat_number integer NOT NULL,
  ayat_text text,
  audio_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tajwid_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert submissions" ON public.tajwid_submissions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own or admin view all" ON public.tajwid_submissions
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR is_admin_or_pengurus(auth.uid())
  );

CREATE POLICY "Admin can update submissions" ON public.tajwid_submissions
  FOR UPDATE TO authenticated USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Admin can delete submissions" ON public.tajwid_submissions
  FOR DELETE TO authenticated USING (is_admin_or_pengurus(auth.uid()));

CREATE TRIGGER update_tajwid_submissions_updated_at
  BEFORE UPDATE ON public.tajwid_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analysis items table
CREATE TABLE public.tajwid_analysis_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.tajwid_submissions(id) ON DELETE CASCADE,
  word text NOT NULL,
  hukum_tajwid text NOT NULL,
  catatan text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tajwid_analysis_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage analysis items" ON public.tajwid_analysis_items
  FOR ALL TO authenticated USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Users can view own analysis items" ON public.tajwid_analysis_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tajwid_submissions
      WHERE tajwid_submissions.id = tajwid_analysis_items.submission_id
      AND tajwid_submissions.user_id = auth.uid()
    )
  );

-- Assessments table
CREATE TABLE public.tajwid_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.tajwid_submissions(id) ON DELETE CASCADE,
  makhraj_score integer NOT NULL DEFAULT 0,
  tajwid_score integer NOT NULL DEFAULT 0,
  kelancaran_score integer NOT NULL DEFAULT 0,
  comment text,
  assessed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tajwid_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assessments" ON public.tajwid_assessments
  FOR ALL TO authenticated USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Users can view own assessments" ON public.tajwid_assessments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tajwid_submissions
      WHERE tajwid_submissions.id = tajwid_assessments.submission_id
      AND tajwid_submissions.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_tajwid_assessments_updated_at
  BEFORE UPDATE ON public.tajwid_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('tajwid-audio', 'tajwid-audio', true);

CREATE POLICY "Authenticated can upload tajwid audio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tajwid-audio');

CREATE POLICY "Anyone can view tajwid audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'tajwid-audio');
