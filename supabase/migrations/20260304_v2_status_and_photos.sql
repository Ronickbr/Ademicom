-- Migration: Update products status and add photo fields
-- Description: Adds 'VENDIDO' to status check and photo columns

-- 1. Update the check constraint for status
-- First, drop the existing constraint if possible, or add a new one.
-- Looking at the initial schema, it was: status TEXT CHECK (status IN ('CADASTRO', 'TECNICO', 'SUPERVISOR', 'GESTOR', 'LIBERADO'))

DO $$ 
BEGIN 
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
    ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('CADASTRO', 'TECNICO', 'SUPERVISOR', 'GESTOR', 'LIBERADO', 'VENDIDO'));
END $$;

-- 2. Add photo URL columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_product TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_model TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_serial TEXT;

-- 3. Update statusConfig in app code will follow
