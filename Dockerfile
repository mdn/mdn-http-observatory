FROM node:20

RUN apt-get -y update && \
    apt-get install -y git && \
    mkdir -p /home/node/app/node_modules && \
    chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
COPY --chown=node:node . .
RUN npm install

# Get the current HSTS list
RUN npm run updateHsts

EXPOSE 8080
CMD [ "node", "src/api/index.js" ]
