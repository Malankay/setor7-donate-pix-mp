-- Add active status column to vip_packages table
ALTER TABLE public.vip_packages 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;