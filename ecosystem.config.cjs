module.exports = {
  apps: [
    {
      name: "parih-barbershop",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3002",
      cwd: "/var/www/parih",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:./dev.db"
      }
    }
  ]
};
