-- Remove admin-only policies from donations table
DROP POLICY IF EXISTS "Only admins can view donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can update donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can delete donations" ON public.donations;

-- Create permissive policies for authenticated users on donations
CREATE POLICY "Authenticated users can view all donations" 
ON public.donations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert donations" 
ON public.donations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update donations" 
ON public.donations 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete donations" 
ON public.donations 
FOR DELETE 
TO authenticated
USING (true);

-- Remove admin-only policies from servers
DROP POLICY IF EXISTS "Only admins can insert servers" ON public.servidores;
DROP POLICY IF EXISTS "Only admins can update servers" ON public.servidores;
DROP POLICY IF EXISTS "Only admins can delete servers" ON public.servidores;

-- Create permissive policies for servers
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

-- Remove admin-only policies from server mods
DROP POLICY IF EXISTS "Only admins can insert server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Only admins can update server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Only admins can delete server mods" ON public.servidores_mods;

-- Create permissive policies for server mods
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