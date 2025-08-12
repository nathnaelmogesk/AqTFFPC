-- Add missing columns to profiles table for admin functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES public.profiles(id);