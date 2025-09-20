# ECONEURA-IA Development Container
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and pnpm
ENV NODE_VERSION=20.10.0
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /workspaces

# Default shell
ENV SHELL=/bin/bash

# Keep container running
CMD ["sleep", "infinity"]
