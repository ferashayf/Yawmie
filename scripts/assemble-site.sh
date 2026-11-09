#!/bin/sh
# Builds what yawmie.me serves: the landing page (site/) at the root, the website app (dist/) at /app/.
set -eu
OUT="${1:-public-site}"
rm -rf "$OUT"
mkdir -p "$OUT/app"
cp -R site/. "$OUT/"
cp -R dist/. "$OUT/app/"
echo "yawmie.me" > "$OUT/CNAME"
touch "$OUT/.nojekyll"
echo "Assembled $OUT: landing at /, app at /app/"
