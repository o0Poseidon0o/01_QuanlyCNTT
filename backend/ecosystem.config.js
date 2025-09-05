module.exports = {
  apps: [
    {
      name: "quanlycntt-backend",
      cwd: "/opt/quanlycntt/01_QuanlyCNTT/backend",
      script: "node",
      args: "server.js",         // đổi theo file start của bạn (vd app.js, dist/server.js)
      instances: 1,              // hoặc "max" nếu CPU nhiều
             
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        HOST: "127.0.0.1"
      },
      watch: false,
      max_memory_restart: "512M"
    }
  ]
}
