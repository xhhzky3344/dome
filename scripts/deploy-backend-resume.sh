#!/usr/bin/env bash
set -euo pipefail
release=/opt/lumenhaus-releases/backend-20260912
runtime=/opt/lumenhaus-runtime/node-v24.12.0-linux-x64
if test -L "$release/node_modules"; then
  test "$(readlink "$release/node_modules")" = /opt/lumenhaus/node_modules
  unlink "$release/node_modules"
  cp -a /opt/lumenhaus/node_modules "$release/node_modules"
fi
export PATH="$runtime/bin:$PATH"
export DATABASE_PATH=/opt/lumenhaus/data/demo.sqlite
export UPLOAD_DIR=/opt/lumenhaus/public/uploads
export APP_ORIGIN=http://demo.hekecm.com
export NEXT_PUBLIC_SITE_URL=http://demo.hekecm.com
cd "$release"
node node_modules/next/dist/bin/next build
pm2 start ecosystem.backend.config.cjs
for attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:3001/api/health; then exit 0; fi
  sleep 1
done
exit 1
