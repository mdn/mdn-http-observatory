ALTER TABLE sites ADD COLUMN IF NOT EXISTS public_headers   jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS private_headers  jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS cookies          jsonb;
