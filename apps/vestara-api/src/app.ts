import Fastify from "fastify";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { marked } from "marked";

import swaggerPlugin from "./plugins/swagger.plugin.js";

import authRoutes from "./modules/auth/auth.route.js";
import subscribersRoutes from "./modules/subscribers/subscribers.route.js";
import uploadRoutes from "./modules/uploads/uploads.route.js";

import { SubscribersRepository } from "./modules/subscribers/subscribers.repository.js";
import { SubscribersService } from "./modules/subscribers/subscribers.service.js";

dotenv.config();

export const app = Fastify({
  logger: true,
});

/**
 * =========================================================
 * PLUGINS
 * =========================================================
 */
await app.register(swaggerPlugin);

/**
 * =========================================================
 * README SETUP
 * =========================================================
 */
const readmePath = path.resolve(process.cwd(), "README.md");

let cachedHtml: string | null = null;
let cachedMtime: number | null = null;

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
  if (lang === "mermaid") {
    return `<pre class="mermaid">${text}</pre>`;
  }

  return `
<pre><code class="language-${lang ?? ""}">
${text}
</code></pre>
`;
};

marked.setOptions({
  renderer,
});

async function renderReadme(): Promise<string> {
  const stat = await fs.stat(readmePath);

  if (cachedHtml && cachedMtime === stat.mtimeMs) {
    return cachedHtml;
  }

  const raw = await fs.readFile(readmePath, "utf8");
  const html = await marked.parse(raw);

  cachedHtml = html;
  cachedMtime = stat.mtimeMs;

  return html;
}

/**
 * =========================================================
 * ROOT DOCUMENTATION
 * =========================================================
 */
app.get("/", async (_req, reply) => {
  const html = await renderReadme();

  return reply.type("text/html").send(`
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Vestara API Documentation</title>

<link
rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css"
/>

<style>
body{
  margin:0;
  padding:40px;
}

.markdown-body{
  box-sizing:border-box;
  max-width:1200px;
  margin:0 auto;
  padding:45px;
}

.mermaid{
  text-align:center;
  margin:2rem 0;
}
</style>
</head>

<body>
<article class="markdown-body">
${html}
</article>

<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad:true,
  theme:"light",
  securityLevel:"loose"
});
</script>

</body>
</html>
`);
});

/**
 * =========================================================
 * ROUTES
 * =========================================================
 */
await app.register(authRoutes, {
  prefix: "/api",
});

await app.register(subscribersRoutes, {
  prefix: "/api",
});

await app.register(uploadRoutes, {
  prefix: "/api",
});

/**
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */
app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

/**
 * =========================================================
 * CRON
 * =========================================================
 */
app.get("/cron/sync-subscribers", async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.code(401).send({
      error: "Unauthorized",
    });
  }

  try {
    app.log.info("Running subscriber sync");

    const repo = new SubscribersRepository();
    const service = new SubscribersService(repo);

    const subscribers = await service.findAll();

    return {
      success: true,
      count: subscribers.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    app.log.error(error);

    return reply.code(500).send({
      success: false,
      error: "Failed to sync subscribers",
    });
  }
});