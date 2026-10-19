// Produce a file://-compatible site for reviewing the concept without Node or a server.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync, strToU8 } from "fflate";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const output = path.join(root, "release");
const files = {};
let html = await readFile(path.join(dist, "index.html"), "utf8");
const jsMatch = html.match(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/,
);
const cssMatch = html.match(
  /<link rel="stylesheet" crossorigin href="([^"]+)">/,
);
if (!jsMatch || !cssMatch)
  throw new Error(
    "Vite entry scripts/styles were not found; rebuild before exporting.",
  );

const cssPath = path.resolve(dist, cssMatch[1]);
let css = await readFile(cssPath, "utf8");
for (const match of [...css.matchAll(/url\(([^)]+)\)/g)]) {
  const url = match[1].replace(/^['"]|['"]$/g, "");
  if (url.startsWith("data:")) continue;
  if (!url.endsWith(".woff") && !url.endsWith(".woff2"))
    throw new Error(`Unexpected external style asset: ${url}`);
  const font = await readFile(path.resolve(path.dirname(cssPath), url));
  const mime = url.endsWith(".woff2") ? "font/woff2" : "font/woff";
  css = css.replace(
    match[0],
    `url(data:${mime};base64,${font.toString("base64")})`,
  );
}
const js = await readFile(path.resolve(dist, jsMatch[1]), "utf8");
html = html.replace(
  jsMatch[0],
  () =>
    `<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>`,
);
html = html.replace(
  cssMatch[0],
  () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
);
files["learning-atlas/index.html"] = strToU8(html);

async function collect(directory, relative) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) await collect(absolute, child);
    else if (entry.isFile())
      files[child] = new Uint8Array(await readFile(absolute));
  }
}
await collect(path.join(dist, "materials"), "learning-atlas/materials");
files["learning-atlas/START-HERE.txt"] = strToU8(
  "Extract the full archive and open index.html in a modern browser.\nAll examples are synthetic. No live learning systems are connected.\nReference documents are in the materials directory.\n",
);
await mkdir(path.join(output, "learning-atlas"), { recursive: true });
await writeFile(path.join(output, "learning-atlas/index.html"), html);
await writeFile(
  path.join(output, "learning-atlas.zip"),
  zipSync(files, { level: 9 }),
);
console.log(
  `Created ${path.join(output, "learning-atlas.zip")} (${Object.keys(files).length} files)`,
);
