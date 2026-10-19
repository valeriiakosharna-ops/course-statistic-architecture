import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
function textFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    return entry.isDirectory()
      ? textFiles(p)
      : /\.(tsx?|html|md|txt|json|ya?ml|csv|mmd|mjs)$/.test(p)
        ? [p]
        : [];
  });
}
it("publishes English content across UI, payloads, downloadable references and exported instructions", () => {
  const paths = [
    ...textFiles("src").filter((p) => !p.endsWith(".test.ts")),
    ...textFiles("public"),
    "index.html",
    "scripts/export-site.mjs",
    ".github/workflows/pages.yml",
  ];
  const untranslated = paths.filter((p) =>
    /\p{Script=Cyrillic}/u.test(readFileSync(p, "utf8")),
  );
  expect(untranslated).toEqual([]);
  expect(readFileSync("index.html", "utf8")).toContain('lang="en"');
});
