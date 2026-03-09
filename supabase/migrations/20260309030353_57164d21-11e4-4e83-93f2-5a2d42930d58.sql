
DROP POLICY "Users can insert submissions" ON public.tajwid_submissions;
CREATE POLICY "Users can insert own submissions" ON public.tajwid_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
