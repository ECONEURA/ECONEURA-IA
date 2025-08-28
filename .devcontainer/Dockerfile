FROM mcr.microsoft.com/devcontainers/typescript-node:0-20

# Playwright deps (para e2e)
RUN npx --yes playwright@latest install-deps

# pnpm ya viene con corepack, pero lo reforzamos
RUN corepack enable
