ALTER TABLE scans 
  DROP COLUMN IF EXISTS "hidden", 
  DROP COLUMN IF EXISTS likelihood_indicator;
