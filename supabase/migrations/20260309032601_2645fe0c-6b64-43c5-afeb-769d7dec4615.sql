
-- Allow anyone (including anonymous/not logged in) to insert tajwid submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.tajwid_submissions;
CREATE POLICY "Anyone can insert submissions"
ON public.tajwid_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view submissions (for viewing results without login)
DROP POLICY IF EXISTS "Users can view own or admin view all" ON public.tajwid_submissions;
CREATE POLICY "Anyone can view own or admin view all"
ON public.tajwid_submissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to view analysis items
DROP POLICY IF EXISTS "Users can view own analysis items" ON public.tajwid_analysis_items;
CREATE POLICY "Anyone can view analysis items"
ON public.tajwid_analysis_items
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to view assessments
DROP POLICY IF EXISTS "Users can view own assessments" ON public.tajwid_assessments;
CREATE POLICY "Anyone can view assessments"
ON public.tajwid_assessments
FOR SELECT
TO anon, authenticated
USING (true);
