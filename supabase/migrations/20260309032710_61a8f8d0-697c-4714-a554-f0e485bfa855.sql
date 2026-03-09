
-- Allow anonymous uploads to tajwid-audio bucket
DROP POLICY IF EXISTS "Authenticated can upload tajwid audio" ON storage.objects;
CREATE POLICY "Anyone can upload tajwid audio"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'tajwid-audio');
