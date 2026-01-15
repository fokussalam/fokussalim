-- Tabel untuk konten beranda yang bisa diedit admin
CREATE TABLE public.homepage_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL CHECK (section IN ('features', 'values')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Star',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Everyone can view active content
CREATE POLICY "Anyone can view active homepage content"
ON public.homepage_content
FOR SELECT
USING (is_active = true);

-- Admin/Pengurus can manage all content
CREATE POLICY "Admin can manage homepage content"
ON public.homepage_content
FOR ALL
USING (is_admin_or_pengurus(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_homepage_content_updated_at
BEFORE UPDATE ON public.homepage_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default features
INSERT INTO public.homepage_content (section, title, description, icon, sort_order) VALUES
('features', 'Manajemen Anggota', 'Kelola data anggota komunitas dengan mudah dan terorganisir.', 'Users', 1),
('features', 'Jadwal Kegiatan', 'Atur dan pantau jadwal kegiatan pengajian dan pertemuan.', 'Calendar', 2),
('features', 'Keuangan & Iuran', 'Catat pemasukan, pengeluaran, dan iuran bulanan anggota.', 'Wallet', 3);

-- Insert default values
INSERT INTO public.homepage_content (section, title, description, icon, sort_order) VALUES
('values', 'Pengajian Rutin', 'Kajian Al-Quran dan ilmu agama secara berkala.', 'BookOpen', 1),
('values', 'Silaturahmi', 'Mempererat tali persaudaraan antar anggota.', 'Handshake', 2),
('values', 'Kebersamaan', 'Saling mendukung dalam kebaikan.', 'Heart', 3);