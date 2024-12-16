#!/usr/bin/env sh
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
export NODE_EXTRA_CA_CERTS=$SCRIPT_DIR/../node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_bundle.pem
exec node "${SCRIPT_DIR}/../src/scan.js" "$@"
