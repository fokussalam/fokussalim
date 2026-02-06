-- Add column to track who registered the account and how
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS registration_type text DEFAULT 'self' CHECK (registration_type IN ('self', 'admin', 'pengurus'));