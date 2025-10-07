import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytbamwypejyzhqkgokbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YmFtd3lwZWp5emhxa2dva2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4OTkyOTAsImV4cCI6MjA0NDQ3NTI5MH0.o9GyuMKNYDLpgdFRUewJGRhU78vfUDbmwD5pVP71eCY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
