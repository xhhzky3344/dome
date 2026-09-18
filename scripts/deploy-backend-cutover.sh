#!/usr/bin/env bash
set -euo pipefail
backup=/opt/lumenhaus-backups/before-backend-20260912
curl --fail --silent http://127.0.0.1:3001/api/health
if test -f /etc/nginx/sites-enabled/lumenhaus.bak-20260911-103712; then
  grep -q 'server_name demo.hekecm.com;' /etc/nginx/sites-enabled/lumenhaus.bak-20260911-103712
  mv /etc/nginx/sites-enabled/lumenhaus.bak-20260911-103712 "$backup/nginx-previous-enabled-backup.conf"
fi
python3 - <<'PY'
from pathlib import Path
p=Path('/etc/nginx/sites-available/lumenhaus')
text=p.read_text()
assert 'proxy_pass http://127.0.0.1:3000;' in text
text=text.replace('proxy_pass http://127.0.0.1:3000;', 'proxy_pass http://127.0.0.1:3001;')
text=text.replace('X-Forwarded-Forwarded-For', 'X-Forwarded-For')
if 'client_max_body_size' not in text:
    text=text.replace('    gzip on;', '    client_max_body_size 6m;\n    gzip on;')
p.write_text(text)
PY
if ! nginx -t; then
  cp "$backup/nginx.conf" /etc/nginx/sites-available/lumenhaus
  exit 1
fi
systemctl reload nginx
healthy=0
for attempt in 1 2 3 4 5; do
  if curl --fail --silent -H 'Host: demo.hekecm.com' http://127.0.0.1/api/health; then healthy=1; break; fi
  sleep 1
done
if test "$healthy" = 0; then
  cp "$backup/nginx.conf" /etc/nginx/sites-available/lumenhaus
  nginx -t
  systemctl reload nginx
  exit 1
fi
pm2 stop lumenhaus
pm2 save
systemctl is-enabled pm2-root || true
pm2 list
