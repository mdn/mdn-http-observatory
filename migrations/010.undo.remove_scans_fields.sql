ALTER TABLE scans ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS likelihood_indicator VARCHAR NULL;

CREATE INDEX IF NOT EXISTS scans_hidden_idx ON scans(hidden);
