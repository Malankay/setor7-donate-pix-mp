-- Fix RLS policies for servidores table - restrict modifications to admins only
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON public.servidores;
DROP POLICY IF EXISTS "Authenticated users can update servers" ON public.servidores;
DROP POLICY IF EXISTS "Authenticated users can delete servers" ON public.servidores;

CREATE POLICY "Admins can insert servers" 
ON public.servidores 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update servers" 
ON public.servidores 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete servers" 
ON public.servidores 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for servidores_mods table - restrict modifications to admins only
DROP POLICY IF EXISTS "Authenticated users can insert server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Authenticated users can update server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Authenticated users can delete server mods" ON public.servidores_mods;

CREATE POLICY "Admins can insert server mods" 
ON public.servidores_mods 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update server mods" 
ON public.servidores_mods 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete server mods" 
ON public.servidores_mods 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));