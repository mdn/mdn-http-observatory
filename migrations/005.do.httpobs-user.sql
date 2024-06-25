CREATE USER httpobsapi;
GRANT USAGE ON SCHEMA public TO httpobsapi;
GRANT SELECT ON expectations, scans, tests to httpobsapi;
GRANT SELECT (id, domain, creation_time, public_headers) ON sites TO httpobsapi;
GRANT INSERT ON sites, scans TO httpobsapi;
GRANT UPDATE (public_headers, private_headers, cookies) ON sites TO httpobsapi;
GRANT UPDATE ON scans TO httpobsapi;
GRANT USAGE ON SEQUENCE sites_id_seq TO httpobsapi;
GRANT USAGE ON SEQUENCE scans_id_seq TO httpobsapi;
GRANT USAGE ON SEQUENCE expectations_id_seq TO httpobsapi;
GRANT SELECT on sites, scans, expectations, tests TO httpobsapi;
GRANT UPDATE (domain) ON sites to httpobsapi;  /* TODO: there's got to be a better way with SELECT ... FOR UPDATE */
GRANT UPDATE on scans TO httpobsapi;
GRANT INSERT on tests TO httpobsapi;
GRANT USAGE ON SEQUENCE tests_id_seq TO httpobsapi;
