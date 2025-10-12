-- Drop overly permissive policies on donations table
DROP POLICY IF EXISTS "Authenticated users can update donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can delete donations" ON public.donations;

-- Create admin-only policies for donations
CREATE POLICY "Admins can update donations" 
ON public.donations 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete donations" 
ON public.donations 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));