#!/bin/sh
# Builds what yawmie.me serves: the landing page (apps/site/) at the root, the website app (apps/app/dist/) at /app/.
set -eu
OUT="${1:-public-site}"
rm -rf "$OUT"
mkdir -p "$OUT/app"
cp -R apps/site/. "$OUT/"
cp -R apps/app/dist/. "$OUT/app/"
echo "yawmie.me" > "$OUT/CNAME"
touch "$OUT/.nojekyll"
echo "Assembled $OUT: landing at /, app at /app/"
