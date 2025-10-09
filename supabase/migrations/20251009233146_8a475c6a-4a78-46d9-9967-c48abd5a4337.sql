-- Create a function to automatically make the first user an admin
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (no other profiles exist)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id != NEW.id LIMIT 1) THEN
    -- Assign admin role to the first user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin role to first user
DROP TRIGGER IF EXISTS auto_assign_first_admin_trigger ON public.profiles;
CREATE TRIGGER auto_assign_first_admin_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_first_admin();