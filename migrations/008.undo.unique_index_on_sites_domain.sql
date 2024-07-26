DROP INDEX IF EXISTS sites_domain_unique_idx;
CREATE INDEX IF NOT EXISTS sites_domain_idx ON sites (domain);
