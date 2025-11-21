-- Add package_type column to donations table
ALTER TABLE public.donations 
ADD COLUMN package_type TEXT;