-- Create streamer_coupons table
CREATE TABLE public.streamer_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL REFERENCES public.streamers(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  valor NUMERIC,
  porcentagem NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (data_fim > data_inicio),
  CONSTRAINT valor_or_porcentagem CHECK (
    (valor IS NOT NULL AND porcentagem IS NULL) OR
    (valor IS NULL AND porcentagem IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.streamer_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all streamer coupons"
  ON public.streamer_coupons
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert streamer coupons"
  ON public.streamer_coupons
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update streamer coupons"
  ON public.streamer_coupons
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete streamer coupons"
  ON public.streamer_coupons
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_streamer_coupons_updated_at
  BEFORE UPDATE ON public.streamer_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();