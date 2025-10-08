-- Create servers table
CREATE TABLE public.servidores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  host TEXT NOT NULL,
  valor_mensal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create server mods table
CREATE TABLE public.servidores_mods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  nome_mod TEXT NOT NULL,
  discord TEXT,
  loja_steam TEXT,
  valor_mensal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores_mods ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all servers"
ON public.servidores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert servers"
ON public.servidores
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update servers"
ON public.servidores
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete servers"
ON public.servidores
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all server mods"
ON public.servidores_mods
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert server mods"
ON public.servidores_mods
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update server mods"
ON public.servidores_mods
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete server mods"
ON public.servidores_mods
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates on servidores
CREATE TRIGGER update_servidores_updated_at
BEFORE UPDATE ON public.servidores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on servidores_mods
CREATE TRIGGER update_servidores_mods_updated_at
BEFORE UPDATE ON public.servidores_mods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();