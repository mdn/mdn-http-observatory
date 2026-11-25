# Test Fixtures

These fixtures contain captured HTTP responses for scanner integration tests. Using fixtures prevents test breakage when external websites change their security configuration.

## Purpose

The scanner tests validate that our security analysis correctly evaluates real-world websites. However, these websites can change their security headers at any time, causing tests to fail even though our code is working correctly. Fixtures solve this by capturing a snapshot of HTTP responses that we can test against consistently.

## Updating Fixtures

When you want to update test expectations to reflect current website configurations:

1. Run the capture script:

   ```bash
   npm run capture-fixtures
   ```

   (This runs `scripts/capture-fixtures.js`)

2. Review the changes:

   ```bash
   git diff test/fixtures/
   ```

3. Update corresponding test assertions in [test/scanner.test.js](../scanner.test.js) if needed

4. Commit both fixture changes and test assertion changes together:

   ```bash
   git add test/fixtures/ test/scanner.test.js
   git commit -m "test: update scanner fixtures and expectations"
   ```

## Files

- `mozilla-org.json` - Response data for mozilla.org scanner tests
- `observatory-mozilla-org.json` - Response data for observatory.mozilla.org scanner tests
- `expired-cert.pem`, `expired-cert-key.pem` - Expired self-signed certificate for `localhost` (and its test-only private key), served by a local HTTPS server in the retriever tests
- `localhost-cert.pem`, `localhost-cert-key.pem` - Self-signed certificate for `localhost` valid until 9999 (and its test-only private key), trusted temporarily by the retriever tests

## Fixture Contents

Each fixture file contains:

- **Site information**: hostname, port, path
- **HTTP responses**: Headers, status codes, body content for HTTP and HTTPS requests
- **Redirect chains**: Complete redirect history for both protocols
- **CORS preflight**: OPTIONS request response
- **TLS verification**: Whether certificates were successfully verified
- **Session URL**: Base URL used for the scanning session
- **Metadata**: Timestamp and scan results at time of capture (for reference)

## Regenerating the Certificates

The certificates never need renewal: one is meant to be expired, the other is valid until 9999. To recreate them (requires OpenSSL 3.4+):

```bash
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout test/fixtures/expired-cert-key.pem -out test/fixtures/expired-cert.pem \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
  -not_before 20200101000000Z -not_after 20200102000000Z

openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout test/fixtures/localhost-cert-key.pem -out test/fixtures/localhost-cert.pem \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
  -not_before 20200101000000Z -not_after 99991231235959Z
```

## When to Update

Update fixtures when:

- Intentionally updating test expectations to match current site behavior
- Adding new test cases that require different response scenarios
- Upgrading dependencies (like axios) that change response structure

## History

Fixtures are versioned in git, so you can see the history of website security configuration changes over time using `git log -- test/fixtures/`.
