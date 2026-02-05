-- Create table for infaq popup content
CREATE TABLE public.infaq_popup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Mari Berinfak',
  description TEXT,
  image_url TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.infaq_popup ENABLE ROW LEVEL SECURITY;

-- Everyone can view active popup
CREATE POLICY "Anyone can view active infaq popup"
ON public.infaq_popup
FOR SELECT
USING (is_active = true);

-- Admin/pengurus can manage popup
CREATE POLICY "Admin and pengurus can manage infaq popup"
ON public.infaq_popup
FOR ALL
USING (public.is_admin_or_pengurus(auth.uid()));

-- Insert default popup content
INSERT INTO public.infaq_popup (title, description, bank_name, account_number, account_holder)
VALUES (
  'Mari Berinfak untuk Kebaikan',
  'Salurkan infak terbaik Anda untuk mendukung program-program dakwah dan kegiatan masjid.',
  'Bank Syariah Indonesia (BSI)',
  '1234567890',
  'Masjid Al-Ikhlas'
);

-- Add trigger for updated_at
CREATE TRIGGER update_infaq_popup_updated_at
BEFORE UPDATE ON public.infaq_popup
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();