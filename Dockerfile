FROM hmctsprod.azurecr.io/base/node:24-alpine AS base

COPY --chown=hmcts:hmcts . .

USER root

RUN apk add --no-cache curl bash

# Install the dependencies and build the app.
RUN yarn install
RUN yarn build:ssr

ENV NODE_ENV=production
EXPOSE 4000
CMD ["yarn", "run", "start"]
