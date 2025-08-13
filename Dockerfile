# ─── Stage 1: deps ───────────────────────────────────────────────────────────────
FROM hmctspublic.azurecr.io/base/node:20-alpine AS deps
WORKDIR /home/hmcts/app

USER root
RUN corepack enable
ENV YARN_NODE_LINKER=node-modules
USER hmcts

COPY --chown=hmcts:hmcts package.json yarn.lock ./
RUN yarn install

# ─── Stage 2: build ──────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /home/hmcts/app
COPY --chown=hmcts:hmcts . .
# Build browser + server
RUN yarn build:prod


# ─── Stage 3: runtime ────────────────────────────────────────────────────────────
FROM hmctspublic.azurecr.io/base/node:20-alpine AS runtime
WORKDIR /home/hmcts/app
USER root
RUN corepack enable
USER hmcts

# bring in all dependencies installed in deps stage
COPY --from=deps --chown=hmcts:hmcts /home/hmcts/app/node_modules ./node_modules

# Flatten the dist/appreg-frontend/* into /dist
COPY --from=build --chown=hmcts:hmcts /home/hmcts/app/dist/appreg-frontend ./dist

EXPOSE 4000
CMD ["node", "dist/server/server.mjs"]
