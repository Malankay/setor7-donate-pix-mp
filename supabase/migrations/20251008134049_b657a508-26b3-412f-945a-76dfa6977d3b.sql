-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for authenticated users to update all profiles
CREATE POLICY "Authenticated users can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete all profiles
CREATE POLICY "Authenticated users can delete all profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (true);

-- Create policy for service role to insert profiles
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_profiles_email ON public.profiles(email);