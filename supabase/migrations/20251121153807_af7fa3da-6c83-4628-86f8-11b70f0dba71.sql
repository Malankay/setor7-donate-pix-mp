-- Create VIP packages table
CREATE TABLE public.vip_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vip_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for VIP packages
CREATE POLICY "Authenticated users can view all VIP packages" 
ON public.vip_packages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert VIP packages" 
ON public.vip_packages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update VIP packages" 
ON public.vip_packages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete VIP packages" 
ON public.vip_packages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_vip_packages_updated_at
BEFORE UPDATE ON public.vip_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();