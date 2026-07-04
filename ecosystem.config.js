// PM2 process manager config for running this app on the Hostinger VPS.
//
// Usage (on the VPS, after `npm ci && npm run build`):
//   pm2 start ecosystem.config.js
//   pm2 save            # so it survives a reboot
//   pm2 startup         # prints the command to enable that
//
// "instances" is left at 1, not "max"/cluster mode: SQLite (this project's
// database) allows only one writer at a time regardless of how many Node
// processes ask, so extra instances would mostly just contend with each
// other on writes rather than add real throughput. If traffic grows enough
// to need more than one process, migrating off SQLite to a real database
// server (e.g. Postgres) should happen first.
module.exports = {
  apps: [
    {
      name: "tat-sneaker",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
