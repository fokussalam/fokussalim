-- Add new kas categories to transaction_category enum
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_safa';
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_hit';
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_ips';
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_qurban';
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_umroh';
ALTER TYPE public.transaction_category ADD VALUE IF NOT EXISTS 'kas_dll';