import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BASE_URL = (process.env.BLOG_URL ?? "http://localhost:3120").replace(/\/$/, "");

const NOT_AUTHENTICATED =
  "Not authenticated. The user must create an API token on the blog's 'API tokens' page and add it " +
  "to their MCP client config as the header 'Authorization: Bearer <token>' (or BLOG_TOKEN for stdio). " +
  "Do not ask the user for their password.";

// `token` is the user's blog API token. It comes from the client's Authorization header
// (HTTP mode) or the BLOG_TOKEN env var (stdio), never from a tool argument.
export function createBlogServer(token?: string): McpServer {
  async function api(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(`Cannot reach the blog at ${BASE_URL}. Is it running? (set BLOG_URL to change)`);
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 401) throw new Error(NOT_AUTHENTICATED);
    if (!res.ok) throw new Error(data.error ?? `Request failed with status ${res.status}`);
    return data;
  }

  // Wraps a handler so results become MCP text content and errors become isError results.
  function tool<A>(fn: (args: A) => Promise<unknown>) {
    return async (args: A) => {
      try {
        const data = await fn(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }],
        };
      }
    };
  }

  const server = new McpServer({ name: "blog-mcp", version: "1.0.0" });

  server.registerTool(
    "whoami",
    {
      description:
        "Show which blog user this connection acts as. Fails if no valid API token is configured.",
      inputSchema: {},
    },
    tool(() => api("GET", "/api/auth/me")),
  );

  server.registerTool(
    "list_posts",
    {
      description: "List all blog posts, newest first, with author name and comment count.",
      inputSchema: {},
    },
    tool(() => api("GET", "/api/posts")),
  );

  server.registerTool(
    "get_post",
    {
      description: "Get one post with its full content and all of its comments.",
      inputSchema: { id: z.number().int().describe("Post id") },
    },
    tool(({ id }) => api("GET", `/api/posts/${id}`)),
  );

  server.registerTool(
    "create_post",
    {
      description: "Publish a new blog post as the authenticated user.",
      inputSchema: { title: z.string().min(1), content: z.string().min(1) },
    },
    tool((a) => api("POST", "/api/posts", a)),
  );

  server.registerTool(
    "update_post",
    {
      description: "Edit the title and/or content of one of your own posts.",
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
      },
    },
    tool(({ id, ...rest }) => api("PATCH", `/api/posts/${id}`, rest)),
  );

  server.registerTool(
    "delete_post",
    {
      description: "Permanently delete one of your own posts, including its comments.",
      inputSchema: { id: z.number().int() },
    },
    tool(({ id }) => api("DELETE", `/api/posts/${id}`)),
  );

  server.registerTool(
    "add_comment",
    {
      description: "Add a comment to a post as the authenticated user.",
      inputSchema: { postId: z.number().int(), content: z.string().min(1) },
    },
    tool(({ postId, content }) => api("POST", `/api/posts/${postId}/comments`, { content })),
  );

  server.registerTool(
    "update_comment",
    {
      description: "Edit one of your own comments.",
      inputSchema: { id: z.number().int().describe("Comment id"), content: z.string().min(1) },
    },
    tool(({ id, content }) => api("PATCH", `/api/comments/${id}`, { content })),
  );

  server.registerTool(
    "delete_comment",
    {
      description: "Delete one of your own comments.",
      inputSchema: { id: z.number().int().describe("Comment id") },
    },
    tool(({ id }) => api("DELETE", `/api/comments/${id}`)),
  );

  return server;
}
