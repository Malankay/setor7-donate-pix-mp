-- Criar tabela de streamers
CREATE TABLE public.streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  youtube text,
  instagram text,
  facebook text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de streamers
ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para streamers
CREATE POLICY "Authenticated users can view all streamers"
ON public.streamers
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert streamers"
ON public.streamers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update streamers"
ON public.streamers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete streamers"
ON public.streamers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_streamers_updated_at
BEFORE UPDATE ON public.streamers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();