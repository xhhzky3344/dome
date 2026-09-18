module.exports = {
  apps: [
    {
      name: "lumenhaus-backend",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001 -H 127.0.0.1",
      interpreter: "/opt/lumenhaus-runtime/node-v24.12.0-linux-x64/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        DATABASE_PATH: "/opt/lumenhaus/data/demo.sqlite",
        UPLOAD_DIR: "/opt/lumenhaus/public/uploads",
        APP_ORIGIN: "http://demo.hekecm.com",
        NEXT_PUBLIC_SITE_URL: "http://demo.hekecm.com",
        TRUST_PROXY: "1",
        COOKIE_SECURE: "0",
      },
    },
  ],
};
