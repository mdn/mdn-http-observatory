#!/usr/bin/env sh
export NODE_EXTRA_CA_CERTS=node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem
exec node bin/scan.js "$@"
