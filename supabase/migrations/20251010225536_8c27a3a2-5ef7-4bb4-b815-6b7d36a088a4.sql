-- Create a table for storing application secrets
CREATE TABLE public.app_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins can view secrets
CREATE POLICY "Admins can view all secrets" 
ON public.app_secrets 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert secrets
CREATE POLICY "Admins can insert secrets" 
ON public.app_secrets 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update secrets
CREATE POLICY "Admins can update secrets" 
ON public.app_secrets 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete secrets
CREATE POLICY "Admins can delete secrets" 
ON public.app_secrets 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_secrets_updated_at
BEFORE UPDATE ON public.app_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing secrets
INSERT INTO public.app_secrets (key, value, description) VALUES
  ('RESEND_API_KEY', '', 'API key para envio de emails via Resend'),
  ('MERCADO_PAGO_ACCESS_TOKEN', '', 'Token de acesso do Mercado Pago')
ON CONFLICT (key) DO NOTHING;