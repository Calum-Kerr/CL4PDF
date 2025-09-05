-- Migration: Add password hash support to users table
-- This allows us to handle authentication directly without Supabase Auth

-- First, drop the foreign key constraint to auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Modify the users table to be standalone
ALTER TABLE public.users 
    ALTER COLUMN id DROP DEFAULT,
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make sure id is still UUID and primary key
ALTER TABLE public.users 
    ALTER COLUMN id SET DATA TYPE UUID USING id::UUID;

-- Update the table comment
COMMENT ON TABLE public.users IS 'User accounts with direct password authentication';
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password for authentication';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;
