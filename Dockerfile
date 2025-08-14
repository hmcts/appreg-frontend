FROM hmctspublic.azurecr.io/base/node:20-alpine AS base

COPY --chown=hmcts:hmcts . .

USER root

# Install the dependencies and build the app.
RUN yarn install
RUN yarn build:ssr

ENV NODE_ENV=production
EXPOSE 4000
CMD ["yarn", "run", "start"]
