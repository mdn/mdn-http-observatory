FROM node:20

RUN apt-get -y update && \
  apt-get install -y git && \
  mkdir -p /home/node/app/node_modules && \
  chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
COPY --chown=node:node . .
RUN npm install

ARG GIT_SHA=dev
ARG RUN_ID=unknown
# Get the current HSTS list
RUN npm run updateHsts

RUN env

ENV RUN_ID=${RUN_ID}
ENV GIT_SHA=${GIT_SHA}
ENV NODE_EXTRA_CA_CERTS=node_modules/extra_certs/ca_bundle/ca_intermediate_bundle.pem
EXPOSE 8080
CMD [ "node", "src/api/index.js" ]
