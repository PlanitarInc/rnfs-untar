#!/usr/bin/env bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <major|minor|patch>"
  exit 1
fi

if [ ! -f package.json ]; then
  echo 'Error: package.json not found'
  echo ''
  echo 'Run this script from the root of the repository'
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo 'Error: Working directory is not clean'
  echo ''
  echo 'Commit or stash your changes before running this script'
  exit 1
fi

if [[ "$(git branch --show-current)" != 'master' ]]; then
  echo 'Error: Not on master branch'
  echo ''
  echo 'Switch to the master branch before running this script'
  exit 1
fi

case "$1" in
major)
  jqExpr='.version |= ((split(".") | .[0] | tonumber + 1 | tostring) + ".0.0")'
  ;;

minor)
  jqExpr='.version |= ((split(".") | .[0] + "." + (.[1] | tonumber + 1 | tostring) + ".0"))'
  ;;

patch)
  jqExpr='.version |= ((split(".") | .[0] + "." + .[1] + "." + (.[2] | tonumber + 1 | tostring)))'
  ;;

*)
  echo "Usage: $0 <major|minor|patch>"
  exit 1
  ;;
esac

jq --indent 2 "${jqExpr}" package.json >package.json.tmp
mv package.json package.json.bak
mv package.json.tmp package.json

npm i

gitTag="v$(jq -r .version package.json)"

echo ''
echo 'Done'
echo ''
echo '1. Review the changes:'
git status -s
git diff package.json
echo ''
echo '2. Commit the changes and tag the release:'
echo "  git commit -m 'Bump version to ${gitTag}' package.json package-lock.json"
echo "  git tag -a ${gitTag} -m '${gitTag}'"
echo ''
echo '3. Publish the release:'
echo "  git push --follow-tags origin master"
echo '  npm publish'
