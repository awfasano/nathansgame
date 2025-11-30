import http from "http";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const envPayload = JSON.stringify({
  VITE_GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
});

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

const port = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || "/").split("?")[0];

  let filePath = path.join(distDir, urlPath);

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch {
    filePath = path.join(distDir, "index.html"); // SPA fallback
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  if (ext === ".html") {
    try {
      const html = await fs.readFile(filePath, "utf8");
      const injected = html.replace(
        "</head>",
        `<script>window.__ENV = ${envPayload};</script></head>`
      );
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(injected);
      return;
    } catch {
      res.writeHead(500);
      res.end("Server error");
      return;
    }
  }

  const stream = createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": contentType });
    stream.pipe(res);
  });
  stream.on("error", () => {
    res.writeHead(404);
    res.end("Not found");
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
