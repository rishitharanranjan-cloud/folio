-- Migration: add annual_goal to users table
-- Run in Supabase SQL Editor

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS annual_goal int;
