CREATE TABLE IF NOT EXISTS sites (
  id                                  SERIAL PRIMARY KEY,
  domain                              VARCHAR(255) NOT NULL,
  creation_time                       TIMESTAMP NOT NULL,
  public_headers                      JSONB NULL,
  private_headers                     JSONB NULL,
  cookies                             JSONB NULL
);

CREATE INDEX sites_domain_idx            ON sites (domain);
