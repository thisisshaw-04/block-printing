import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname);
const sourceHtml = resolve(root, "../../outputs/saree-block-print/index.html");
const html = await readFile(sourceHtml, "utf8");

await mkdir(resolve(root, "dist/server"), { recursive: true });
await writeFile(
  resolve(root, "dist/server/index.js"),
  `const HTML = ${JSON.stringify(html)};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain;charset=utf-8" } });
    }
    return new Response(HTML, {
      headers: {
        "content-type": "text/html;charset=utf-8",
        "cache-control": "public, max-age=60"
      }
    });
  }
};
`
);

console.log("Built Sites worker.");
