module.exports = {
  apps: [
    {
      name: "vestara-api",

      cwd: "./apps/api",

      script: "dist/index.js",

      instances: "max",

      exec_mode: "cluster",

      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      autorestart: true,

      watch: false,

      max_memory_restart: "1G",

      time: true,

      error_file:
        "/home/deployer/logs/vestara-api-error.log",

      out_file:
        "/home/deployer/logs/vestara-api-out.log",

      merge_logs: true,

      kill_timeout: 5000
    }
  ]
};
