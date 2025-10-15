-- Create streamer_campanhas table
CREATE TABLE public.streamer_campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL REFERENCES public.streamers(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (data_fim > data_inicio),
  CONSTRAINT valor_positivo CHECK (valor > 0)
);

-- Enable RLS
ALTER TABLE public.streamer_campanhas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all campaigns"
  ON public.streamer_campanhas
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert campaigns"
  ON public.streamer_campanhas
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update campaigns"
  ON public.streamer_campanhas
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaigns"
  ON public.streamer_campanhas
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_streamer_campanhas_updated_at
  BEFORE UPDATE ON public.streamer_campanhas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();