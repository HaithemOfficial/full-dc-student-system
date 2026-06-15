module.exports = {
  apps: [
    {
      name: 'elnadjah-api',
      script: './server.js',
      cwd: '/var/www/el-nadjah-apps/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      error_file: '/var/www/el-nadjah-apps/backend/logs/pm2-error.log',
      out_file: '/var/www/el-nadjah-apps/backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
