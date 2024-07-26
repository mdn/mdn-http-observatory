CREATE UNIQUE INDEX IF NOT EXISTS sites_domain_unique_idx ON sites (domain);
DROP INDEX IF EXISTS sites_domain_idx;