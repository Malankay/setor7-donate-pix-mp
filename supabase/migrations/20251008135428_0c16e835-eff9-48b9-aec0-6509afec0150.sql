-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Populate existing users into profiles table (if they don't exist)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);