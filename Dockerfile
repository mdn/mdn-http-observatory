FROM node:24

RUN apt-get -y update && \
  apt-get install -y git libpq-dev && \
  mkdir -p /home/node/app/node_modules && \
  chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
COPY --chown=node:node . .
# This also installs hsts and tld data files in a postinstall script:
RUN npm ci

ARG GIT_SHA=dev
ARG RUN_ID=unknown

RUN env

ENV RUN_ID=${RUN_ID}
ENV GIT_SHA=${GIT_SHA}
ENV NODE_EXTRA_CA_CERTS=node_modules/extra_certs/ca_bundle/ca_intermediate_bundle.pem
EXPOSE 8080
CMD [ "node", "src/api/index.js" ]
