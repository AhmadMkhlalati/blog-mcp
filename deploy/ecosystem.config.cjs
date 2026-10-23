// Run from the folder that contains blog-app/ and blog-mcp/:
//   pm2 start deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "blog",
      cwd: "./blog-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3120",
      env: { NODE_ENV: "production" },
    },
    {
      name: "blog-mcp",
      cwd: "./blog-mcp",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        MCP_TRANSPORT: "http",
        PORT: "3121",
        BLOG_URL: "http://127.0.0.1:3120",
      },
    },
  ],
};
