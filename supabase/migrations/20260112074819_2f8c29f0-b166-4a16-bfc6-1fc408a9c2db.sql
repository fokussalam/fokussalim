-- =============================================
-- APLIKASI SALIM - KOMUNITAS PENGAJIAN
-- =============================================

-- 1. Enum untuk role pengguna
CREATE TYPE public.app_role AS ENUM ('admin', 'pengurus', 'anggota');

-- 2. Enum untuk status anggota
CREATE TYPE public.member_status AS ENUM ('aktif', 'tidak_aktif', 'pending');

-- 3. Enum untuk jenis transaksi keuangan
CREATE TYPE public.transaction_type AS ENUM ('pemasukan', 'pengeluaran');

-- 4. Enum untuk kategori transaksi
CREATE TYPE public.transaction_category AS ENUM ('iuran_bulanan', 'infaq', 'donasi', 'konsumsi', 'transport', 'peralatan', 'lainnya');

-- =============================================
-- TABEL PROFIL PENGGUNA
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    status member_status NOT NULL DEFAULT 'pending',
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TABEL USER ROLES
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'anggota',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- =============================================
-- TABEL KEGIATAN
-- =============================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TABEL KEUANGAN/TRANSAKSI
-- =============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    category transaction_category NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TABEL IURAN BULANAN
-- =============================================
CREATE TABLE public.monthly_dues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    amount DECIMAL(12,2) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (member_id, month, year)
);

-- =============================================
-- FUNGSI UNTUK CEK ROLE
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fungsi untuk cek apakah user adalah admin atau pengurus
CREATE OR REPLACE FUNCTION public.is_admin_or_pengurus(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'pengurus')
  )
$$;

-- =============================================
-- TRIGGER UPDATE TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER AUTO CREATE PROFILE
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    -- Default role sebagai anggota
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'anggota');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Admin can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin_or_pengurus(auth.uid()) OR auth.uid() = user_id);

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view events"
    ON public.events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin/Pengurus can manage events"
    ON public.events FOR ALL
    TO authenticated
    USING (public.is_admin_or_pengurus(auth.uid()));

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin/Pengurus can manage transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (public.is_admin_or_pengurus(auth.uid()));

-- Monthly Dues RLS
ALTER TABLE public.monthly_dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dues"
    ON public.monthly_dues FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR public.is_admin_or_pengurus(auth.uid())
    );

CREATE POLICY "Admin/Pengurus can manage dues"
    ON public.monthly_dues FOR ALL
    TO authenticated
    USING (public.is_admin_or_pengurus(auth.uid()));