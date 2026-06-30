import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../..");

const FORBIDDEN_DIRS = [
  "lib/data",
  "lib/gmail",
  "lib/feishu",
  "lib/supabase",
  "app/api",
];

const SKIP_DIRS = new Set(["node_modules", ".next", "out", "dist", "playwright-report", "test-results"]);

const FORBIDDEN_IMPORT_PATTERNS = [
  /from ["']@\/lib\/(data|gmail|feishu|supabase)/,
  /from ["']@\/app\/api/,
  /require\(["']@\/lib\/(data|gmail|feishu|supabase)/,
  /@supabase\/supabase-js/,
  /from ["'][^"']*\/lib\/supabase/,
];

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
    } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("P1-T16 legacy import guard", () => {
  for (const dir of FORBIDDEN_DIRS) {
    it(`must not contain ${dir}/`, () => {
      expect(existsSync(join(ROOT, dir))).toBe(false);
    });
  }

  it("must not import forbidden legacy modules", () => {
    const files = walk(ROOT).filter(
      (file) => !file.includes("forbidden-legacy.test")
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${relative(ROOT, file)} matches ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
