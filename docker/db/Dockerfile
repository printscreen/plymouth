FROM node:18.20-alpine3.18

RUN mkdir -p /opt/plymouth

# Copy repo
COPY ./ /opt/plymouth

# Fresh install node modules
WORKDIR /opt/plymouth

ARG DOMAIN=local
ENV DOMAIN ${DOMAIN}

#ARG NPM_TOKEN
#RUN npm set //npm.pkg.github.com/:_authToken=${NPM_TOKEN}

RUN apk --no-cache add make gcc g++ bash python3 python3-dev py3-pip git openssh openssl jq \
        ca-certificates vim libpq postgresql-client postgresql-dev sudo curl \
    && addgroup plymouth \
    && adduser -S -H -G plymouth plymouth \
    && python3 -m pip install awscli \
    && rm -rf /opt/plymouth/node_modules \
    && rm -rf ~/.npm \
    && npm i \
    && npm install -g sequelize-cli \
    && npm rebuild bcrypt --build-from-source \
    && apk del make gcc g++ python3 openssh

CMD bin/update-db.sh --service plymouth --domain ${DOMAIN}
