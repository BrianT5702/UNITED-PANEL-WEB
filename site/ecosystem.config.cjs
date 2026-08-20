module.exports = {
  apps: [
    {
      name: "web-ur",
      cwd: "/home/brian/~web-ur/UNITED-PANEL-WEB/site",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        UPLOADS_DIR: "/home/brian/~web-ur/UNITED-PANEL-WEB/site/public/uploads",
      },
    },
  ],
};
