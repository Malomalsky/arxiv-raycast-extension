import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

const stored = new Map();
globalThis.__arxivTestStorage = {
  getItem: async (key) => stored.get(key),
  setItem: async (key, value) => stored.set(key, value),
};
globalThis.__arxivTestFetch = async () => {
  throw new Error("Unexpected network request");
};
globalThis.__arxivTestPreferences = { autoOpenPDF: false };

const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./src/api/arxiv";
      export * from "./src/utils/gostCitation";
      export * from "./src/utils/latexFormatter";
      export * from "./src/utils/storage";
      export * from "./src/utils/bookmarks";
      export * from "./src/utils/readingStatus";
      export * from "./src/utils/subscriptions";
      export * from "./src/api/semanticScholar";
      export * from "./src/api/feed";
      export * from "./src/utils/pdfManager";`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  plugins: [
    {
      name: "test-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /^@raycast\/api$/ }, ({ path }) => ({
          path,
          namespace: "mock",
        }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: `export const LocalStorage = globalThis.__arxivTestStorage;
              export const getPreferenceValues = () => globalThis.__arxivTestPreferences;
              export const showToast = async (options) => (globalThis.__arxivTestToast = { ...options });
              export const Toast = { Style: { Animated: "loading", Success: "success", Failure: "failure" } };
              export const open = async () => {};`,
        }));
      },
    },
  ],
});
const compiled = { exports: {} };
new Function("module", "exports", "require", outputFiles[0].text)(
  compiled,
  compiled.exports,
  createRequire(import.meta.url),
);
const {
  generateBibTeX,
  generateGOSTCitation,
  formatLatexTitle,
  searchArxiv,
  getBookmarks,
  setBookmark,
  editBookmark,
  parseTags,
  getPaperStatuses,
  setReadingStatus,
  markAsDownloaded,
  saveSubscription,
  getSubscriptions,
  getBatchCitations,
  getFeedPapers,
  downloadPDF,
} = compiled.exports;

const paper = {
  id: "2601.00001v1",
  arxivId: "2601.00001v1",
  title: "A paper about learning",
  authors: ["Ada Example"],
  abstract: "An abstract.",
  categories: ["cs.LG"],
  primaryCategory: "cs.LG",
  published: "2026-01-02T10:00:00Z",
  updated: "2026-01-03T10:00:00Z",
  pdfUrl: "https://arxiv.org/pdf/2601.00001v1",
  arxivUrl: "https://arxiv.org/abs/2601.00001v1",
};

const feed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"
  xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>1</opensearch:totalResults><entry>
  <id>http://arxiv.org/abs/2601.00001v1</id><title>A paper about learning</title>
  <summary>An abstract.</summary><published>2026-01-02T10:00:00Z</published>
  <updated>2026-01-03T10:00:00Z</updated><author><name>Ada Example</name></author>
  <category term="cs.LG"/></entry></feed>`;

let clock = Date.now();
beforeEach((context) => {
  stored.clear();
  context.mock.method(globalThis, "fetch", (...args) =>
    globalThis.__arxivTestFetch(...args),
  );
  context.mock.method(Date, "now", () => (clock += 4000));
  globalThis.__arxivTestFetch = async () => ({
    ok: true,
    status: 200,
    text: async () => feed,
  });
});

test("citations accept papers restored from bookmark JSON", () => {
  const restored = JSON.parse(JSON.stringify(paper));
  assert.match(generateBibTeX(restored), /year=\{2026\}/);
  assert.match(generateGOSTCitation(restored), /2026/);
});

test("search encodes query operators once", async () => {
  let requested;
  globalThis.__arxivTestFetch = async (url) => {
    requested = new URL(url);
    return { ok: true, status: 200, text: async () => feed };
  };
  await searchArxiv("ti:learning", {
    sortBy: "relevance",
    sortOrder: "descending",
    categories: ["cs.LG", "cs.AI"],
  });
  assert.equal(requested.protocol, "https:");
  assert.equal(
    requested.searchParams.get("search_query"),
    "(ti:learning) AND (cat:cs.LG OR cat:cs.AI)",
  );
});

test("citation sorting uses a supported arXiv sort order", async () => {
  let requested;
  globalThis.__arxivTestFetch = async (url) => {
    requested = new URL(url);
    return { ok: true, status: 200, text: async () => feed };
  };
  await searchArxiv("learning", {
    sortBy: "citationCount",
    sortOrder: "descending",
  });
  assert.equal(requested.searchParams.get("sortBy"), "relevance");
});

test("HTTP failures remain errors instead of looking like search results", async () => {
  globalThis.__arxivTestFetch = async () => ({
    ok: false,
    status: 503,
    text: async () => feed,
  });
  await assert.rejects(searchArxiv("learning"), /503|unavailable/i);
});

test("paper dates stay serializable through the result cache", async () => {
  const result = await searchArxiv("learning");
  const restored = JSON.parse(JSON.stringify(result));
  assert.equal(restored.papers[0].published, result.papers[0].published);
  assert.equal(restored.papers[0].updated, result.papers[0].updated);
  assert.equal(typeof restored.papers[0].published, "string");
  assert.equal(result.papers[0].arxivId, paper.arxivId);
});

test("display math does not leave dollar delimiters in titles", () => {
  assert.equal(formatLatexTitle("Energy $$E=mc^2$$"), "Energy E=mc²");
});

test("custom date filters use UTC minutes and reject reversed ranges", async () => {
  let requested;
  globalThis.__arxivTestFetch = async (url) => {
    requested = new URL(url);
    return { ok: true, status: 200, text: async () => feed };
  };
  const filter = {
    sortBy: "relevance",
    sortOrder: "descending",
    dateRange: "custom",
    customDateStart: "2026-01-01T03:00:00+03:00",
    customDateEnd: "2026-01-02T03:00:00+03:00",
  };
  await searchArxiv("learning", filter);
  assert.equal(
    requested.searchParams.get("search_query"),
    "(learning) AND submittedDate:[202601010000 TO 202601020000]",
  );
  await assert.rejects(
    searchArxiv("learning", {
      ...filter,
      customDateStart: filter.customDateEnd,
      customDateEnd: filter.customDateStart,
    }),
    /valid date range/,
  );
});

test("malformed bookmark dates are reported without changing saved data", async () => {
  const raw = JSON.stringify([
    { paperId: paper.id, paper: { ...paper, published: "invalid" }, tags: [] },
  ]);
  stored.set("bookmarks", raw);
  await assert.rejects(getBookmarks(), /invalid/);
  assert.equal(stored.get("bookmarks"), raw);
});

test("concurrent bookmark writes retain every paper and existing notes", async () => {
  await Promise.all([
    setBookmark(paper, true),
    setBookmark({ ...paper, id: "second" }, true),
  ]);
  await editBookmark(paper.id, {
    tags: ["methods"],
    notes: "Keep this note",
    rating: 4,
  });
  await setBookmark(paper, true);
  const bookmarks = await getBookmarks();
  assert.equal(bookmarks.length, 2);
  assert.equal(
    bookmarks.find((item) => item.paperId === paper.id).notes,
    "Keep this note",
  );
  assert.match(generateBibTeX(bookmarks[1].paper), /2026/);
  await assert.rejects(
    editBookmark(paper.id, { tags: [], rating: 6 }),
    /rating/i,
  );
});

test("tags trim whitespace and remove case-insensitive duplicates", () => {
  assert.deepEqual(parseTags(" methods, ,Methods, to-read, methods "), [
    "methods",
    "to-read",
  ]);
});

test("invalid saved data is not overwritten, and failed writes do not block later updates", async () => {
  stored.set("bookmarks", "invalid json");
  await assert.rejects(setBookmark(paper, true));
  assert.equal(stored.get("bookmarks"), "invalid json");
  stored.set("bookmarks", "{}");
  await assert.rejects(setBookmark(paper, true), /invalid/);
  assert.equal(stored.get("bookmarks"), "{}");
  stored.set("bookmarks", "[]");
  await setBookmark(paper, true);
  assert.equal((await getBookmarks()).length, 1);
});

test("reading and download updates preserve each other's metadata", async () => {
  await Promise.all([
    setReadingStatus(paper.id, "read"),
    markAsDownloaded(paper.id),
  ]);
  const [status] = await getPaperStatuses();
  assert.equal(status.status, "read");
  assert.ok(status.downloadedAt);
});

test("reading status write failures reach the caller", async (context) => {
  context.mock.method(globalThis.__arxivTestStorage, "setItem", async () => {
    throw new Error("Disk full");
  });
  await assert.rejects(setReadingStatus(paper.id, "read"), /Disk full/);
});

test("subscriptions reject empty and duplicate values without dropping existing data", async () => {
  await saveSubscription({
    type: "author",
    value: " Ada Example ",
    name: "Ada",
  });
  await assert.rejects(
    saveSubscription({
      type: "author",
      value: "ada example",
      name: "Duplicate",
    }),
    /already follow/,
  );
  await assert.rejects(
    saveSubscription({ type: "keyword", value: "  ", name: "Empty" }),
    /Enter/,
  );
  const [subscription] = await getSubscriptions();
  await saveSubscription({ ...subscription, name: "Renamed" }, subscription);
  const [updated] = await getSubscriptions();
  assert.equal(updated.id, subscription.id);
  assert.equal(updated.createdAt, subscription.createdAt);
  assert.equal(updated.name, "Renamed");
  await assert.rejects(
    saveSubscription({ type: "invalid", value: "test", name: "Test" }),
    /subscription type/,
  );
  stored.set("subscriptions", "[]");
  await assert.rejects(
    saveSubscription({ ...updated, name: "Removed" }, updated),
    /already been removed/,
  );
  assert.deepEqual(await getSubscriptions(), []);
});

test("cancelled queries do not hit the network or block later searches", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  globalThis.__arxivTestFetch = async () => {
    calls++;
    return { ok: true, status: 200, text: async () => feed };
  };
  await assert.rejects(
    searchArxiv("old", undefined, 30, 0, controller.signal),
    { name: "AbortError" },
  );
  await searchArxiv("new");
  assert.equal(calls, 1);
});

test("arXiv error entries surface their explanation", async () => {
  globalThis.__arxivTestFetch = async () => ({
    ok: true,
    status: 200,
    text: async () =>
      "<feed><entry><id>http://arxiv.org/api/errors#bad_query</id><summary>Invalid search syntax</summary></entry></feed>",
  });
  await assert.rejects(searchArxiv("broken"), /Invalid search syntax/);
});

test("legacy arXiv identifiers retain their archive prefix", async () => {
  globalThis.__arxivTestFetch = async () => ({
    ok: true,
    status: 200,
    text: async () => feed.replaceAll("2601.00001v1", "hep-th/9901001v1"),
  });
  const result = await searchArxiv("legacy");
  assert.equal(result.papers[0].arxivId, "hep-th/9901001v1");
});

test("citation batches strip versions, preserve zero counts and reuse the cache", async () => {
  let calls = 0;
  globalThis.__arxivTestFetch = async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body).ids, [
      "ARXIV:2601.00001",
      "ARXIV:2601.00002",
    ]);
    return { ok: true, json: async () => [{ citationCount: 0 }, null] };
  };
  const citations = await getBatchCitations([paper.arxivId, "2601.00002v1"]);
  assert.equal(citations.get(paper.arxivId), 0);
  assert.equal(citations.has("2601.00002v1"), false);
  assert.equal(
    (await getBatchCitations([paper.arxivId])).get(paper.arxivId),
    0,
  );
  assert.equal(calls, 1);
});

test("citation rate limits are not presented as zero citations", async () => {
  globalThis.__arxivTestFetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(getBatchCitations([paper.arxivId]), /rate limited/);
});

test("feed deduplication preserves subscriptions added while requests are running", async () => {
  const subscriptions = [
    { id: "category", type: "category", value: "cs.LG", name: "Learning" },
    { id: "author", type: "author", value: "Ada Example", name: "Ada" },
  ];
  stored.set("subscriptions", JSON.stringify(subscriptions));
  globalThis.__arxivTestFetch = async () => {
    stored.set(
      "subscriptions",
      JSON.stringify([
        ...subscriptions,
        { id: "new", type: "keyword", value: "graphs", name: "Graphs" },
      ]),
    );
    return { ok: true, status: 200, text: async () => feed };
  };
  assert.equal((await getFeedPapers(subscriptions)).length, 1);
  assert.equal((await getSubscriptions()).length, 3);
});

test("PDFs have distinct names, are reused and update download metadata", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "arxiv-pdf-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  globalThis.__arxivTestPreferences = {
    downloadPath: directory,
    autoOpenPDF: false,
  };
  let calls = 0;
  globalThis.__arxivTestFetch = async () => {
    calls++;
    return {
      ok: true,
      arrayBuffer: async () =>
        new TextEncoder().encode("%PDF-1.4\nexample").buffer,
    };
  };
  const first = await downloadPDF(paper);
  const second = await downloadPDF({
    ...paper,
    id: "2601.00002v1",
    arxivId: "2601.00002v1",
  });
  assert.ok(first);
  assert.notEqual(first, second);
  assert.equal(await downloadPDF(paper), first);
  assert.equal(calls, 2);
  assert.equal((await readdir(directory)).length, 2);
  assert.match(await readFile(first, "utf8"), /^%PDF-/);
  assert.equal((await getPaperStatuses()).length, 2);
});

test("HTML error pages are not saved as PDFs", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "arxiv-pdf-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  globalThis.__arxivTestPreferences = {
    downloadPath: directory,
    autoOpenPDF: false,
  };
  globalThis.__arxivTestFetch = async () => ({
    ok: true,
    arrayBuffer: async () =>
      new TextEncoder().encode("<html>Error</html>").buffer,
  });
  assert.equal(await downloadPDF(paper), null);
  assert.deepEqual(await readdir(directory), []);
  assert.equal(globalThis.__arxivTestToast.style, "failure");
});
