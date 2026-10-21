#!/bin/bash
# Build and publish dist/ to the gh-pages branch of nhigh723/nico-game-3 (GitHub Pages).
set -e; cd "$(dirname "$0")/.."; npm run build
SITE=$(mktemp -d); cp -r dist/. "$SITE"; touch "$SITE/.nojekyll"
cd "$SITE" && git init -q -b gh-pages && git add -A && git -c user.name=nhigh723 -c user.email=nhigh723@users.noreply.github.com commit -qm "Deploy $(date -u +%FT%TZ)" \
  && git push -qf "https://github.com/nhigh723/nico-game-3.git" gh-pages && echo deployed
