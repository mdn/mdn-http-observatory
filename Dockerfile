FROM node:24

RUN apt-get -y update && \
  apt-get install -y git libpq-dev && \
  mkdir -p /home/node/app/node_modules && \
  chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
COPY --chown=node:node . .
RUN npm ci

ARG GIT_SHA=dev
ARG RUN_ID=unknown

RUN env

ENV RUN_ID=${RUN_ID}
ENV GIT_SHA=${GIT_SHA}
EXPOSE 8080
CMD [ "node", "src/api/index.js" ]
