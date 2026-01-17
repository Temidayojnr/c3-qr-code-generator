#!/usr/bin/env bash
# Render build script

echo "Installing system dependencies for canvas..."

# Update package list
apt-get update

# Install canvas dependencies
apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
