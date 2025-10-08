-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  steam_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view all donations
CREATE POLICY "Authenticated users can view all donations" 
ON public.donations 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for service role to insert donations (for edge function)
CREATE POLICY "Service role can insert donations" 
ON public.donations 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create policy for service role to update donations
CREATE POLICY "Service role can update donations" 
ON public.donations 
FOR UPDATE 
TO service_role
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_payment_id ON public.donations(payment_id);