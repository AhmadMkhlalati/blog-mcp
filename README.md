# Blog + MCP server

A small blog where people write posts and comment on them, with an [MCP](https://modelcontextprotocol.io) server alongside it so an LLM client (Claude Desktop, Claude Code, …) can read and write the blog on a user's behalf.

| Folder | What it is | Port |
| --- | --- | --- |
| [`blog-app/`](blog-app) | Next.js 15 web app: accounts, posts, comments, API tokens. Prisma + SQLite. | 3120 |
| [`blog-mcp/`](blog-mcp) | MCP server that calls the blog's API. Runs over stdio or streamable HTTP. | 3121 |
| [`deploy/`](deploy) | pm2 and nginx config for running both on a server. | |

## How auth works

Users log in to the blog with email and password (a signed session cookie). From the **API tokens** page they create a token, which is shown once; only its SHA-256 hash is stored.

The MCP server never sees a password. It sends the user's token as `Authorization: Bearer <token>` with every API call, so everything the LLM does is done as that user, and they can only edit or delete their own posts and comments. Revoking the token cuts off access immediately.

## Running locally

Requires Node.js 20+.

### 1. The blog

```bash
cd blog-app
npm install
```

Create `blog-app/.env`:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="any-long-random-string"
```

Then set up the database and start the dev server:

```bash
npx prisma db push
npm run dev
```

Open http://localhost:3120, register, and create a token under **API tokens**.

### 2. The MCP server

```bash
cd blog-mcp
npm install
npm run build
```

It reads these environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `BLOG_URL` | `http://localhost:3120` | Where the blog is running |
| `MCP_TRANSPORT` | stdio | Set to `http` to serve streamable HTTP instead |
| `PORT` | `3121` | HTTP port (HTTP mode only) |
| `BLOG_TOKEN` | | The user's API token (stdio mode only) |

## Connecting an MCP client

**Stdio** (the client launches the server itself), e.g. in Claude Desktop's config:

```json
{
  "mcpServers": {
    "blog": {
      "command": "node",
      "args": ["/absolute/path/to/blog-mcp/dist/index.js"],
      "env": {
        "BLOG_URL": "http://localhost:3120",
        "BLOG_TOKEN": "<your API token>"
      }
    }
  }
}
```

**HTTP** (one shared server, each client brings its own token). Start it with `MCP_TRANSPORT=http` (`npm run start:http` on macOS/Linux), then point the client at `http://localhost:3121/mcp` with the header `Authorization: Bearer <your API token>`. A health check is at `/health`.

### Tools

| Tool | Does |
| --- | --- |
| `whoami` | Shows which user the token belongs to |
| `list_posts` | Lists all posts, newest first |
| `get_post` | Gets one post with its comments |
| `create_post` | Publishes a post |
| `update_post` | Edits your own post |
| `delete_post` | Deletes your own post and its comments |
| `add_comment` | Comments on a post |
| `update_comment` | Edits your own comment |
| `delete_comment` | Deletes your own comment |

## Deploying

[`deploy/`](deploy) runs both apps under pm2 behind nginx (`blog.neweast.cloud` → 3120, `mcp.neweast.cloud` → 3121):

```bash
cd blog-app && npm ci && npx prisma db push && npm run build && cd ..
cd blog-mcp && npm ci && npm run build && cd ..
pm2 start deploy/ecosystem.config.cjs && pm2 save
```

Copy [`deploy/nginx.conf`](deploy/nginx.conf) to `/etc/nginx/sites-available/`, enable it, and run certbot as noted at the top of the file. Set a real `SESSION_SECRET` in `blog-app/.env` on the server.
