#!/bin/sh

SEMANTIC_NAME=$1

if [[ `git status --porcelain` ]]; then
  echo
  echo "Error: Git working directory is not clean. Please commit your changes or stash them."
  echo
  exit 1
fi;

# Check if logged in to npm
echo "Checking npm login status..."
if ! npm whoami --loglevel=error > /dev/null 2>&1; then
  echo
  echo "You are not logged in to npm."
  echo "Please log in to continue."
  echo
  npm login
  if ! npm whoami --loglevel=error > /dev/null 2>&1; then
    echo
    echo "Error: npm login failed. Aborting."
    echo
    exit 1
  fi
  echo
  echo "Successfully logged in to npm as: $(npm whoami)"
  echo
else
  echo "Already logged in to npm as: $(npm whoami --loglevel=error)"
  echo
fi

if [ "$SEMANTIC_NAME" == "" ]; then
  echo
  echo "Missing semantic name parameter. Valid values are [patch, minor, major]"
  echo
  echo "Example: sh $0 patch"
  exit 1
fi

case "$SEMANTIC_NAME" in
  patch)
    npm version patch --loglevel=error
    break;
    ;;
  minor)
    while true; do
      read -p "Are you sure you want to increase the minor version? [y/n] " yn
      case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer [y]es or [n]o.";;
      esac
    done
    npm version minor --loglevel=error
    break;
    ;;
  major)
    while true; do
      read -p "Are you sure you want to increase the major version? [y/n] " yn
      case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer [y]es or [n]o.";;
      esac
    done
    npm version major --loglevel=error
    break;
    ;;
  *)
    echo
    echo "Invalid semantic name parameter. Valid values are [patch, minor, major]"
    echo
    echo "Example: sh $0 patch"
    exit 1
    ;;
esac

npm publish --new-version $(node -p "require('./package.json').version")
git push origin
git push origin v$(node -p "require('./package.json').version")
