#!/usr/bin/env bash
set -euo pipefail
release=/opt/lumenhaus-releases/backend-20260912
runtime=/opt/lumenhaus-runtime/node-v24.12.0-linux-x64
backup=/opt/lumenhaus-backups/before-backend-20260912
test ! -e "$release"
test -d /opt/lumenhaus/node_modules/next
printf '%s  %s\n' bdebee276e58d0ef5448f3d5ac12c67daa963dd5e0a9bb621a53d1cefbc852fd /tmp/lumenhaus-node-v24.12.0-linux-x64.tar.xz | sha256sum -c -
mkdir -p /opt/lumenhaus-runtime /opt/lumenhaus-releases "$backup"
tar -xJf /tmp/lumenhaus-node-v24.12.0-linux-x64.tar.xz -C /opt/lumenhaus-runtime
"$runtime/bin/node" --version
tar -czf "$backup/data-and-uploads.tar.gz" -C /opt/lumenhaus data public/uploads
cp /etc/nginx/sites-available/lumenhaus "$backup/nginx.conf"
mkdir "$release"
tar -xzf /tmp/lumenhaus-backend-source.tar.gz -C "$release"
cp -a /opt/lumenhaus/data/. "$release/data/"
cp -a /opt/lumenhaus/node_modules "$release/node_modules"
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
