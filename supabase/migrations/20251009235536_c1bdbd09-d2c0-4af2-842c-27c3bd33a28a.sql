-- Adicionar política para permitir que usuários autenticados vejam todos os perfis
-- Isso é necessário para a página de admin funcionar corretamente

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);