#!/bin/bash

if [[ `git status --porcelain` ]]; then
  echo
  echo "Error: Git working directory is not clean. Please commit your changes or stash them."
  echo
  exit 1
fi;

SEMANTIC_NAME=$1

if [ "$SEMANTIC_NAME" == "" ]; then
  echo
  echo "Missing semantic name parameter. Valid values are [patch, minor, major]"
  echo
  echo "Example: sh $0 patch"
  exit 1
fi

case "$SEMANTIC_NAME" in
  patch)
    npm version patch
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
    npm version minor
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
    npm version major
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

git push origin
git push origin v$(node -p "require('./package.json').version")
npm publish
