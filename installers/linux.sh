#!/bin/sh

# Stop if any command fails
set -e

# Install global @microbs.io/cli package
npm install -g @microbs.io/cli

# Create $HOME/.microbs and $HOME/.microbs/config.yaml if they do not exist
microbs init

# Install all official microbs plugins
microbs plugins install --all

# Install all official microbs apps
microbs apps install --all

# Done
echo
echo "Done: Installed microbs $(microbs version)"
echo
