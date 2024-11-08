# Welcome to Mozilla's HTTP Observatory

[HTTP Observatory](https://developer.mozilla.org/en-US/observatory/) is a service that checks web sites for security-relevant headers. It is hosted by [MDN Web Docs](https://github.com/mdn).

## Getting Started

If you just want to scan a host, please head over to <https://developer.mozilla.org/en-US/observatory/>. If you want to
run the code locally or on your premises, continue reading.

### Running a simple scan from the command line

Using npx to install the package, simply run

```sh
npx @mdn/mdn-http-observatory mdn.dev
```

If you want to install the package first, use npm to install it globally

```sh
npm install --global @mdn/mdn-http-observatory
```

After that, the `mdn-http-observatory-scan` command should be available in your shell. To scan a host, run 

```sh
mdn-http-observatory-scan mdn.dev
```

Both methods return a JSON response of the following form:

```json
{
  "scan": {
    "algorithmVersion": 4,
    "grade": "A+",
    "error": null,
    "score": 105,
    "statusCode": 200,
    "testsFailed": 0,
    "testsPassed": 10,
    "testsQuantity": 10,
    "responseHeaders": {
      ...
    }
  },
  "tests": {
    "cross-origin-resource-sharing": {
      "expectation": "cross-origin-resource-sharing-not-implemented",
      "pass": true,
      "result": "cross-origin-resource-sharing-not-implemented",
      "scoreModifier": 0,
      "data": null
    },
    ...
  }
}
```

### Running a local API server

This needs a [postgres](https://www.postgresql.org/) database for the API to use as a persistence layer. All scans and results initiated via the API are stored in the database.

#### Configuration

Default configuration is read from a default `config/config.json` file. See [this file](src/config.js) for a list of possible configuration options.

Create a configuration file by copying the [`config/config-example.json`](conf/config-example.json) to `config/config.json`.
Put in your database credentials into `config/config.json`:

```json
{
  "database": {
    "database": "observatory",
    "user": "postgres"
  }
}

```

To initialize the database with the proper tables, use this command to migrate. This is a one-time action, but future code changes
might need further database changes, so run this migration every time the code is updated from the repository.

```sh
npm run migrate
```

Finally, start the server by running

```sh
npm start
```

The server is listening on your local interface on port `8080`. You can check the root path by opening <http://localhost:8080/> in your browser or `curl` the URL. The server should respond with `Welcome to the MDN Observatory!`.

## JSON API

**Note:** We provide these endpoints on our public deployment of HTTP Observatory at <https://observatory-api.mdn.mozilla.net/>

### POST `/api/v2/scan`

For integration in CI pipelines or similar applications, a JSON API endpoint is provided. The request rate is limited to one scan per host per `api.cooldown` (default: One minute) seconds. If exceeded, a cached result will be returned.

#### Query parameters

* `host` hostname (required)

#### Examples

* `POST /api/v2/scan?host=mdn.dev`
* `POST /api/v2/scan?host=google.com`

#### Result

On success, a JSON object is returned, structured like this example response:

```json
{
  "id": 77666718,
  "details_url": "https://developer.mozilla.org/en-US/observatory/analyze?host=mdn.dev",
  "algorithm_version": 4,
  "scanned_at": "2024-08-12T08:20:18.926Z",
  "error": null,
  "grade": "A+",
  "score": 105,
  "status_code": 200,
  "tests_failed": 0,
  "tests_passed": 10,
  "tests_quantity": 10
}
```

**Note:** For a full set of details about the host, use the provided link in the `details_url` field.

If an error occurred, an object like this is returned:

```json
{
  "error": "invalid-hostname-lookup",
  "message": "some.invalid.hostname.dev cannot be resolved"
}
```

## Migrating from the public V1 API to the V2 API

### Sunset of the V1 API

The previous iteration of the Observatory JSON API has bee deprecated and will be shut down on October 31, 2024. At some point, there will be a strong reminder of that fact by responding with an error if a special header is not included with the request. At Oct 31 2024, the API will be completely shut down.

### Migrating your application

If you previously used the Observatory API with some automation or a CI context, the switch from the old `/api/v1/analyze` endpoint to the new `/api/v2/scan` endpoint should be painless:

* Replace all API calls to `POST https://http-observatory.security.mozilla.org/api/v1/analyze?host=<HOST TO SCAN>` with `POST https://observatory-api.mdn.mozilla.net/api/v2/scan?host=<HOST TO SCAN>`
* Be aware that the complete list of headers has been removed from the response.
* The POST parameters `rescan` and `hidden` in the POST body have been removed.
* Remove all other requests from your application, if any. If you need any additional information about your scan, open the URL from the `detail_url` field of the response in your browser.
* Note that scans are still limited to one every minute per host, otherwise a cached response is returned.

## Contributing

Our project welcomes contributions from any member of our community.
To get started contributing, please see our [Contributor Guide](CONTRIBUTING.md).

By participating in and contributing to our projects and discussions, you acknowledge that you have read and agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Communications

If you have any questions, please reach out to us on [Mozilla Developer Network](https://developer.mozilla.org).

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).
