-- Adicionar coluna discount_coupon na tabela donations
ALTER TABLE public.donations
ADD COLUMN discount_coupon text;

-- Criar tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percentage numeric NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de cupons
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cupons
CREATE POLICY "Authenticated users can view active coupons"
ON public.discount_coupons
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can insert coupons"
ON public.discount_coupons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons"
ON public.discount_coupons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons"
ON public.discount_coupons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_discount_coupons_updated_at
BEFORE UPDATE ON public.discount_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();