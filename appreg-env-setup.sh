#!/bin/shell
#
# @(#)$Id$
#
# Script to set up the environment for appreg-frontend
# by installing NVM, node and yarn packages and attempts to build the 
# current project. Ensure this script is run in the root directory of the
# project and that it has the necessary permissions to execute.

set -e

echo "====== - Setting up environment for appreg-frontend - ======";
echo "Script executed from: ${PWD}";

echo "Running: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash";
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash;

set +e
echo "======== reloading nvm into current shell ========"
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
. "$NVM_DIR/bash_completion"

set -e

echo "======== Setup up script complete ========";

echo "NVM installed, version is:"
nvm --version;

echo "Installing node 20.19.4";
nvm install 20.19.4;

if [[ $? -ne 0 ]]; then
    echo "Node installation failed, exit code: $?";
else
    echo "Node installed successfully";
    NODE_VERSION=$(node --version);

    if [[ ${NODE_VERSION} == "v20.19.4" ]]; then
        echo "Correct node version found";
    else
        echo "Incorrect node version, attempting to use the correct version";
        nvm use 20.19.4;
    fi
fi

echo "====== running: corepack enable ======";
corepack enable;

echo "Attempting to install and build yarn packages";
yarn install && yarn build;

exec ${SHELL}