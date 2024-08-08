# Welcome to Mozilla's MDN Observatory

MDN HTTP Observatory is a library and service that checks web sites for security-relevant headers.

MDN HTTP Observatory is hosted by [MDN Web Docs](https://github.com/mdn).

## Getting Started

Install dependencies by running this from the root of the repository:

```sh
npm i
```

### Running a local scan

To run a scan on a host, a command line script is available. It returns the same JSON response as the API endpoint's, described below.
For example, to scan `mdn.dev`:

```
[insert a scan example]
```

### Running a local API server

This needs a [postgres](https://www.postgresql.org/) database for the API to use as a persistence layer. All scans and results initiated via the API are stored in the database.
Create a configuration file by copying the [`config/config-example.json`](conf/config-example.json) to `config/config.json`.
Put in your database credentials into `config/config.json`:

```sh
[insert an example configuration file for a local database]
```

To initialize the database with the proper tables, use this command to migrate. This is a one-time action, but future code changes
might need further database changes, so run this migration every time the code is updated from the repository.

```sh
[insert migration command]
```

Finally, start the server by running

```sh
[insert server start command and output]
```

The server istening on your local interface on port `8080`. You can check the root path by opening http://localhost:8080/ in your browser or `curl` the URL. The server should respond with `Welcome to the MDN Observatory!`.

## API endpoints

### POST `/api/v2/analyze`

Used to invoke a new scan of a website. By default, HTTP Observatory will return a cached site result if the site has been scanned anytime in the previous minute. This timeout can be set to a different value in the configuration at `api.cooldown`. On success, the API will return a single [scan result object](#scan) in JSON format on success.

#### Query parameters:

* `host` hostname (required)

#### Examples:

* `POST /api/v2/analyze?host=mdn.dev`
* `POST /api/v2/analyze?host=google.com`

### GET `/api/v2/analyze`

Used to retrieve a result of a successful result for the host, not older than 24 hours (configurable under `api.cacheTimeForGet` in the configuration object).

#### Query parameters:

* `host` hostname (required)

#### Examples:

* `POST /api/v2/analyze?host=mdn.dev`
* `POST /api/v2/analyze?host=google.com`


## Contributing

Our project welcomes contributions from any member of our community.
To get started contributing, please see our [Contributor Guide](CONTRIBUTING.md).

By participating in and contributing to our projects and discussions, you acknowledge that you have read and agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Communications

If you have any questions, please reach out to us on [Mozilla Developer Network](https://developer.mozilla.org).

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).
