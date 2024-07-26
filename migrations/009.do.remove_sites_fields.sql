ALTER TABLE sites 
  DROP COLUMN IF EXISTS public_headers, 
  DROP COLUMN IF EXISTS private_headers, 
  DROP COLUMN IF EXISTS cookies;
