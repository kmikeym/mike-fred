/**
 * Advertised-link tests (#23).
 *
 * The API publishes URLs telling consumers where to find things — `docs` in every
 * document's envelope, and the `links` array in the index. Those are the one kind
 * of API content the existing gates cannot check: the no-drift integration test
 * compares the API against the site, and the registry-coverage guard checks every
 * series is built, but neither asks whether a URL we *advertise* actually resolves.
 *
 * It didn't. `docs` pointed at /api, which never existed as a route, and that dead
 * link shipped in all ~20 generated documents plus the foot of llms.txt. Same class
 * as #7, where /widget advertised a JS embed that 404d.
 */

import { test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { API_ENVELOPE } from "./types";
import { buildIndex } from "./documents";
import { ALL_SERIES_IDS } from "./vintages";
import { SCHEMAS } from "./schema";

const ORIGIN = "https://mike.quarterly.systems";

/** Every path `scripts/build-api.ts` writes, derived from the same sources it uses. */
function generatedAssetPaths(): Set<string> {
  const paths = new Set(["/api/v1/index.json", "/api/v1/series.json", "/llms.txt"]);
  for (const id of ALL_SERIES_IDS) {
    paths.add(`/api/v1/series/${id}.json`);
    paths.add(`/api/v1/series/${id}.csv`);
  }
  for (const name of Object.keys(SCHEMAS)) paths.add(`/api/v1/schema/${name}.json`);
  return paths;
}

/**
 * Routes the app renders, from the filesystem. Route groups like `(site)` are
 * organisational and do not appear in the URL; `[id]` segments are dynamic and
 * matched loosely, since any id is a real page.
 */
async function appRoutePatterns(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const seg = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      out.push(...(await appRoutePatterns(path.join(dir, entry.name), prefix + seg)));
    } else if (entry.name === "page.tsx") {
      out.push(prefix === "" ? "/" : prefix);
    }
  }
  return out;
}

function resolves(target: string, assets: Set<string>, routes: string[]): boolean {
  if (assets.has(target)) return true;
  return routes.some((r) => {
    const re = new RegExp(`^${r.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
    return re.test(target);
  });
}

/** Advertised links, as {label, href} with the origin stripped. */
function advertised(): { label: string; href: string; templated: boolean }[] {
  const index = buildIndex();
  return [
    { label: "envelope.docs", href: API_ENVELOPE.docs, templated: false },
    ...index.links.map((l) => ({
      label: `index.links[${l.rel}]`,
      href: l.href,
      // A templated link carries RFC 6570 placeholders and is not meant to be
      // fetched literally. It must SAY so — an unmarked template is
      // indistinguishable from a broken URL to a naive client (#14).
      templated: (l as { templated?: true }).templated === true,
    })),
  ].map((l) => ({ ...l, href: l.href.replace(ORIGIN, "") }));
}

test("every advertised link that is not templated resolves to a real asset or route", async () => {
  const assets = generatedAssetPaths();
  const routes = await appRoutePatterns(path.join(process.cwd(), "app"));

  for (const link of advertised()) {
    if (link.templated) continue;
    expect(`${link.label} -> ${link.href}: ${resolves(link.href, assets, routes)}`).toBe(
      `${link.label} -> ${link.href}: true`,
    );
  }
});

test("a link containing a placeholder is marked templated", () => {
  for (const link of advertised()) {
    const hasPlaceholder = /\{[^}]+\}/.test(link.href);
    expect(`${link.label}: placeholder=${hasPlaceholder} templated=${link.templated}`).toBe(
      `${link.label}: placeholder=${hasPlaceholder} templated=${hasPlaceholder}`,
    );
  }
});

test("llms.txt advertises no path the build does not produce", async () => {
  const assets = generatedAssetPaths();
  const routes = await appRoutePatterns(path.join(process.cwd(), "app"));
  const llms = await fs.readFile(
    path.join(process.cwd(), "public", "llms.txt"),
    "utf-8",
  );

  // Absolute URLs on our own origin, plus bare /api/... paths listed in the
  // endpoint table. Templated segments are skipped — llms.txt is prose for an
  // LLM, and states its placeholders in context.
  const targets = new Set<string>();
  for (const m of llms.matchAll(new RegExp(`${ORIGIN}(\\S*)`, "g"))) {
    // Trim trailing prose punctuation — llms.txt writes URLs inside sentences
    // and parentheses ("(base: https://mike.quarterly.systems)").
    const href = m[1]!.replace(/[).,;:]+$/, "");
    targets.add(href === "" ? "/" : href);
  }
  for (const t of targets) {
    if (/\{[^}]+\}/.test(t)) continue;
    expect(`${t}: ${resolves(t, assets, routes)}`).toBe(`${t}: true`);
  }
});
