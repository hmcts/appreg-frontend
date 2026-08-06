# OpenAPI generation and Angular SSR compilation need development dependencies.
FROM hmctsprod.azurecr.io/base/node:24-alpine AS build

WORKDIR /app
COPY --chown=hmcts:hmcts . .

USER root

RUN apk add --no-cache curl bash

# Install the dependencies and build the app.
RUN yarn install
RUN yarn build:ssr

# Keep the deployed image free of build-only tooling, including the OpenAPI generator.
FROM hmctsprod.azurecr.io/base/node:24-alpine

WORKDIR /app

USER root

RUN apk add --no-cache curl bash

COPY --chown=hmcts:hmcts package.json yarn.lock .yarnrc.yml ./
COPY --chown=hmcts:hmcts .yarn/releases .yarn/releases
# Yarn 4 installs only runtime dependencies in this stage.
RUN yarn workspaces focus --all --production

# The compiled SSR app and its runtime configuration are the only application files needed.
COPY --chown=hmcts:hmcts --from=build /app/dist ./dist
COPY --chown=hmcts:hmcts --from=build /app/config ./config

ENV NODE_ENV=production
EXPOSE 4000
CMD ["yarn", "run", "start"]
