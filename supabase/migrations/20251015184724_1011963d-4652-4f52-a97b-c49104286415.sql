-- Add steam_id column to streamers table
ALTER TABLE public.streamers 
ADD COLUMN steam_id text;