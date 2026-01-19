-- Create site_settings table for editable contact info
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admin/pengurus can manage settings
CREATE POLICY "Admin can manage site settings"
ON public.site_settings
FOR ALL
USING (public.is_admin_or_pengurus(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact settings
INSERT INTO public.site_settings (key, value, label) VALUES
('contact_address_1', 'Jl. Pendidikan No. 123', 'Alamat Baris 1'),
('contact_address_2', 'Kelurahan Berkah, Kec. Barokah', 'Alamat Baris 2'),
('contact_address_3', 'Kota Islami, 12345', 'Alamat Baris 3'),
('contact_phone_1', '+62 812-3456-7890', 'Telepon 1'),
('contact_phone_2', '+62 21-1234567', 'Telepon 2'),
('contact_email_1', 'info@tamanquran.id', 'Email 1'),
('contact_email_2', 'pendaftaran@tamanquran.id', 'Email 2'),
('contact_hours_1', 'Senin - Jumat: 08:00 - 17:00', 'Jam Operasional 1'),
('contact_hours_2', 'Sabtu: 08:00 - 12:00', 'Jam Operasional 2'),
('whatsapp_number', '6281234567890', 'Nomor WhatsApp Admin');