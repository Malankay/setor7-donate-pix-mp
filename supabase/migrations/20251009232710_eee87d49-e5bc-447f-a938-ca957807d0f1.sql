-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table to manage user permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if a user has a specific role
-- This prevents recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Only admins can view user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can insert user roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update user roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- DROP existing insecure policies on donations table
DROP POLICY IF EXISTS "Authenticated users can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Service role can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Service role can update donations" ON public.donations;

-- Create new secure policies for donations table (admin-only access)
CREATE POLICY "Only admins can view donations"
ON public.donations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert donations"
ON public.donations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update donations"
ON public.donations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete donations"
ON public.donations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- DROP existing insecure policies on profiles table
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create new secure policies for profiles table (users can only manage their own)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- DROP existing insecure modification policies on servidores table
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON public.servidores;
DROP POLICY IF EXISTS "Authenticated users can update servers" ON public.servidores;
DROP POLICY IF EXISTS "Authenticated users can delete servers" ON public.servidores;

-- Create new secure policies for servidores table (admin-only modifications)
CREATE POLICY "Only admins can insert servers"
ON public.servidores
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update servers"
ON public.servidores
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete servers"
ON public.servidores
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- DROP existing insecure modification policies on servidores_mods table
DROP POLICY IF EXISTS "Authenticated users can insert server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Authenticated users can update server mods" ON public.servidores_mods;
DROP POLICY IF EXISTS "Authenticated users can delete server mods" ON public.servidores_mods;

-- Create new secure policies for servidores_mods table (admin-only modifications)
CREATE POLICY "Only admins can insert server mods"
ON public.servidores_mods
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update server mods"
ON public.servidores_mods
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete server mods"
ON public.servidores_mods
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));