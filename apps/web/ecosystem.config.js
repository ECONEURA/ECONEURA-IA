module.exports = {
  apps: [
    {
      name: 'econeura-web',
      script: 'node_modules/.bin/next',
      args: 'dev',
      cwd: '/home/user/webapp/apps/web',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      log_file: '/home/user/webapp/apps/web/logs/combined.log',
      out_file: '/home/user/webapp/apps/web/logs/out.log',
      error_file: '/home/user/webapp/apps/web/logs/error.log',
      time: true
    }
  ]
}