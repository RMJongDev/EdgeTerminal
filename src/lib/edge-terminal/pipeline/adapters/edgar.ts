import { createRawPayloadRef } from "../contracts.ts";
import type { RunWindow, SourceAdapter, SourceItem } from "../types.ts";

type FetchLike = typeof fetch;

export type EdgarFormType = "8-K" | "6-K";

type EdgarAdapterOptions = {
  userAgent?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  forms?: EdgarFormType[];
  count?: number;
  delayMs?: number;
};

type EdgarAtomEntry = {
  id: string;
  title: string;
  link: string | null;
  updated: string | null;
  summary: string | null;
};

function getUserAgent(options: EdgarAdapterOptions) {
  return options.userAgent ?? process.env.EDGAR_USER_AGENT ?? "";
}

function baseUrl(options: EdgarAdapterOptions) {
  return (options.baseUrl ?? "https://www.sec.gov").replace(/\/$/, "");
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function tagValue(entry: string, tag: string) {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));

  return match ? stripTags(match[1]) : null;
}

function linkHref(entry: string) {
  const match = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);

  return match ? decodeXml(match[1]) : null;
}

export function parseEdgarAtom(xml: string): EdgarAtomEntry[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  return entries.map((entry) => ({
    id: tagValue(entry, "id") ?? linkHref(entry) ?? "unknown-edgar-entry",
    title: tagValue(entry, "title") ?? "SEC filing",
    link: linkHref(entry),
    updated: tagValue(entry, "updated"),
    summary: tagValue(entry, "summary"),
  }));
}

function companyFromTitle(title: string, formType: EdgarFormType) {
  return title
    .replace(new RegExp(`^${formType}\\s*-\\s*`, "i"), "")
    .replace(/\s*\([^)]*\).*$/, "")
    .trim() || "Unknown filer";
}

function entryToSourceItem(entry: EdgarAtomEntry, formType: EdgarFormType, fetchedAt: string): SourceItem {
  const company = companyFromTitle(entry.title, formType);
  const providerItemId = entry.id || entry.link || `${formType}-${company}-${entry.updated ?? fetchedAt}`;

  return {
    providerItemId,
    sourceName: "SEC EDGAR",
    sourceUrl: entry.link ?? "https://www.sec.gov/edgar/search/",
    publishedAt: entry.updated ?? fetchedAt,
    fetchedAt,
    title: `${formType} filing - ${company}`,
    snippet: entry.summary ? `SEC ${formType}: ${entry.summary}` : `SEC ${formType} filing by ${company}.`,
    symbols: [],
    topics: ["sec_filing", formType.toLowerCase()],
    rawPayloadRef: createRawPayloadRef("sec_edgar", providerItemId, fetchedAt),
  };
}

async function wait(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCurrentFeed(options: Required<Pick<EdgarAdapterOptions, "fetchImpl" | "count" | "delayMs">> & {
  userAgent: string;
  baseUrl: string;
  formType: EdgarFormType;
}) {
  const url = new URL(`${options.baseUrl}/cgi-bin/browse-edgar`);
  url.searchParams.set("action", "getcurrent");
  url.searchParams.set("type", options.formType);
  url.searchParams.set("count", String(options.count));
  url.searchParams.set("output", "atom");

  const response = await options.fetchImpl(url, {
    headers: {
      "User-Agent": options.userAgent,
      Accept: "application/atom+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`SEC EDGAR current ${options.formType} feed failed with HTTP ${response.status}`);
  }

  await wait(options.delayMs);

  return response.text();
}

export function hasEdgarEnv(options: EdgarAdapterOptions = {}) {
  return Boolean(getUserAgent(options));
}

export function createEdgarCurrentFilingsAdapter(options: EdgarAdapterOptions = {}): SourceAdapter | null {
  const userAgent = getUserAgent(options);

  if (!userAgent) {
    return null;
  }

  return {
    provider: "sec_edgar",
    category: "primary_source",
    async fetchItems(window: RunWindow) {
      const fetchImpl = options.fetchImpl ?? fetch;
      const forms = options.forms ?? ["8-K", "6-K"];
      const fetchedAt = window.to.toISOString();
      const items: SourceItem[] = [];

      for (const formType of forms) {
        const xml = await fetchCurrentFeed({
          fetchImpl,
          formType,
          userAgent,
          baseUrl: baseUrl(options),
          count: options.count ?? 100,
          delayMs: options.delayMs ?? 120,
        });
        const entries = parseEdgarAtom(xml)
          .map((entry) => entryToSourceItem(entry, formType, fetchedAt))
          .filter((item) => {
            const publishedAt = Date.parse(item.publishedAt);

            return Number.isFinite(publishedAt) ? publishedAt >= window.from.getTime() && publishedAt <= window.to.getTime() : true;
          });

        items.push(...entries);
      }

      return items;
    },
  };
}
