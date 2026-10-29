import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import ts from "typescript";
import ukrainian from "./locales/uk.json";
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
it("keeps English source content separate from the explicit Ukrainian locale", () => {
  const paths = [
    ...textFiles("src").filter(
      (p) => !p.endsWith(".test.ts") && !p.startsWith("src/locales/"),
    ),
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

it("has a Ukrainian entry for every authored JSX text label and preserves message placeholders", () => {
  const dictionary: Record<string, string> = ukrainian;
  const technical = new Set([
    "learning",
    "atlas",
    "MVP",
    "JSON",
    "UTC",
    "MOODLE 8/10 · SHEETS 9/10",
    "Java Dual",
  ]);
  const missing: string[] = [];
  for (const path of textFiles("src").filter((p) => p.endsWith(".tsx"))) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (ts.isJsxText(node)) {
        const text = node.text.trim().replace(/\s+/g, " ");
        if (
          /[a-zA-Z]{3}/.test(text) &&
          !technical.has(text) &&
          !Object.hasOwn(dictionary, text)
        )
          missing.push(`${path}: ${text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(missing).toEqual([]);
  for (const [source, target] of Object.entries(dictionary))
    expect((target.match(/\$\{\d+\}/g) ?? []).sort(), source).toEqual(
      (source.match(/\$\{\d+\}/g) ?? []).sort(),
    );
});
