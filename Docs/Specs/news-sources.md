# News Sources - concrete bronnen en ophaalstrategie

> Status: bouwvoorbereiding slice 1, hoort bij `technical-design.md` (sectie Providerstack).
> Laatst aangepast: 2026-06-12. Gratis tiers en limieten geverifieerd op 2026-06-12; bij bouwstart opnieuw checken.
> Principe: geen vrije LLM-websearch. Elke candidate komt uit een van onderstaande bronnen met URL en publicatietijd.

## Overzicht

| # | Bron | Laag | Dekking | Kosten | Auth | Limiet |
|---|---|---|---|---|---|---|
| 1 | Finnhub | financiele feed + marktdata | US sterk, EU beperkt op free | gratis tier | API key (header) | 60 calls/min |
| 2 | SEC EDGAR | primair (filings) | US + foreign issuers (ASML e.d.) | gratis | User-Agent verplicht | 10 req/s |
| 3 | GDELT DOC 2.0 | broad news | wereldwijd, alle media | gratis | geen key | informeel; max 250 art./call, 3 mnd historie |
| 4 | RSS-feeds (GlobeNewswire, EQS, Euronext, PR Newswire) | primair (persberichten EU+US) | EU-dekking goed | gratis | geen | beleefd pollen |
| 5 | Marketaux | financiele feed (entiteiten+sentiment) | wereldwijd incl. EU | gratis tier | API token (query) | 100 req/dag |
| 6 | Alpha Vantage NEWS_SENTIMENT | financiele feed (sentiment) | vooral US | gratis tier | API key (query) | 25 req/dag |
| 7 | Macro: FRED + ECB/Fed RSS | primair (macro) | US + EU | gratis | FRED key | ruim |
| 8 | Mover sweep (AV TOP_GAINERS_LOSERS + EU quote-sweep) | trigger: koersbeweging -> nieuws | US gratis endpoint; EU via eigen sweep | gratis | API key | 25 req/dag (AV); sweep via marktdata |

Slice 1-startset: **1 + 2 + 4 + 8** verplicht, **3 of 5** als brede laag erbij. 6 en 7 optioneel/erna. Alles past in EUR 0; het budget blijft beschikbaar voor marktdata en LLM.

## 1. Finnhub - financiele nieuwsfeed en quotes

Gratis tier: 60 API-calls per minuut, US company news, algemene marktheadlines, quotes en earnings calendar. Key gratis via finnhub.io.

```text
# Bedrijfsnieuws per ticker (tijdvenster = run-profiel)
GET https://finnhub.io/api/v1/company-news?symbol=AAPL&from=2026-06-11&to=2026-06-12
Header: X-Finnhub-Token: <FINANCIAL_NEWS_API_KEY>

# Algemene marktheadlines
GET https://finnhub.io/api/v1/news?category=general

# Quote (market context / tracking)
GET https://finnhub.io/api/v1/quote?symbol=AAPL

# Earnings calendar (run-context: wie rapporteert vandaag)
GET https://finnhub.io/api/v1/calendar/earnings?from=2026-06-12&to=2026-06-13
```

Response: JSON-array met `headline`, `summary`, `url`, `datetime` (unix), `source`, `related` (ticker). Mapt direct op ons source-item formaat.

Aandachtspunten:
- company-news op free tier is vooral Noord-Amerika; **EU-dekking in week 1 van slice 1 testen** met een mandje EU-tickers (ASML, SAP, LVMH, Shell). Schiet dat tekort, dan vangt laag 4/5 het EU-gat af.
- 60/min is ruim: een run met 30 tickers + categorieen blijft onder de limiet met een kleine delay tussen calls.
- Bij 429: exponential backoff, run draait door met wat binnen is.

## 2. SEC EDGAR - filings (gratis event-goud)

8-K filings zijn letterlijk "material events": resultaten, overnames, contractwinst, vertrek bestuurders. Foreign issuers zoals ASML filen 6-K. Geen API key; wel verplichte `User-Agent` met naam + e-mail, max 10 req/s. Feeds worden elke 10 minuten ververst (ma-vr, 6:00-22:00 ET).

```text
# Atom-feed: nieuwste 8-K's (alle bedrijven) - de discovery-ingang
GET https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&count=100&output=atom
Header: User-Agent: EdgeTerminal robin@mdejong.dev

# Zelfde voor 6-K (Europese/foreign issuers met US-notering)
GET https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=6-K&count=100&output=atom

# Full-text search (gericht zoeken, JSON)
GET https://efts.sec.gov/LATEST/search-index?q=%22guidance%22&forms=8-K

# Alle filings van een bedrijf (CIK met voorloopnullen)
GET https://data.sec.gov/submissions/CIK0000320193.json
```

Aandachtspunten:
- 100ms delay tussen requests; responses cachen; nooit bulk-crawlen tijdens een run.
- De Atom-feed geeft titel + form type + link; de filing zelf alleen ophalen voor candidates die de LLM-filter passeren (kosten/snelheid).

## 3. GDELT DOC 2.0 - brede wereldwijde nieuwslaag

Monitort wereldwijd nieuws in tientallen talen, gratis, geen key. Perfect voor de "random nieuws"-wens en perception events (Ferrari-scenario), maar ruisig: altijd door de dedupe + LLM-filter.

```text
# Artikelen over een onderwerp/bedrijf, laatste 12 uur, JSON
GET https://api.gdeltproject.org/api/v2/doc/doc?query=(ASML%20OR%20%22Ferrari%22)%20sourcelang:eng&mode=artlist&maxrecords=100&timespan=12h&sort=datedesc&format=json

# Querysyntax
#   "exacte frase", OR/AND, sourcelang:eng, sourcecountry:NL, domain:reuters.com
#   tone<-5 (negatief nieuws - bruikbaar voor perception events)

# Generieke event-pattern-query (verplicht naast watchlist/sector-query's):
# het vangnet voor namen die we NIET kennen - geen bedrijfsnamen in de query
GET https://api.gdeltproject.org/api/v2/doc/doc?query=(shares%20OR%20stock)%20(plunge%20OR%20slump%20OR%20backlash%20OR%20%22profit%20warning%22)%20sourcelang:eng%20tone%3C-5&mode=artlist&maxrecords=100&timespan=12h&sort=datedesc&format=json
```

Aandachtspunten:
- max 250 artikelen per call; historie ~3 maanden; updates elke 15 min;
- informele rate limit: enkele gerichte queries per run (per profiel 3-5 query's), niet hammeren;
- `timespan` koppelen aan het run-profiel (eu_open: `timespan=16h` sinds US-close; us_open: `timespan=8h`);
- titels in vreemde talen meenemen: de LLM-filter leest ze prima, `sourcelang:eng` alleen als ruisfilter voor de brede query.

## 4. RSS-feeds - persberichten en EU regulated news

Gratis, stabiel, en de beste EU-dekking. EU-bedrijven distribueren regulated news vrijwel altijd via GlobeNewswire, EQS (DE/EU) of Euronext company news. Pollen met een standaard RSS-parser (npm `rss-parser`), GUID/link opslaan voor dedupe.

Startlijst (uitbreidbaar, configuratie in code of tabel):

```text
GlobeNewswire (tags/regio's en per organisatie):
  https://www.globenewswire.com/RssFeed/orgclass/1/feedTitle/GlobeNewswire%20-%20News%20Releases  (alle releases)
  https://www.globenewswire.com/search/tag/europe  (Europa-tag; RSS-variant via site)
EQS News (Duitse/EU regulated news):
  https://www.eqs-news.com/  (RSS per categorie via site)
Euronext company news (AEX/Brussel/Parijs/Lissabon):
  https://live.euronext.com/en/products/equities/company-news  (RSS/notification via site)
PR Newswire:
  https://www.prnewswire.com/rss/  (categorie-feeds, o.a. financial services)
ECB persberichten:        https://www.ecb.europa.eu/rss/press.html
Federal Reserve:          https://www.federalreserve.gov/feeds/press_all.xml
```

Aandachtspunten:
- exacte RSS-URL's per feed in week 1 vastleggen in de adapter-config (sites herschikken ze soms; daarom hier de vindplaats, niet alleen de URL);
- poll-moment = run-start; items ouder dan het profiel-tijdvenster overslaan;
- per item opslaan: titel, link (GUID), pubDate, bron, samenvatting. Geen volledige artikelen herpubliceren.

## 5. Marketaux - brede financiele feed met entiteiten

Gratis: 100 requests per dag, geen betaalgegevens nodig. Levert nieuws met herkende tickers/entiteiten en sentiment, wereldwijd inclusief EU - een goede tweede brede laag naast of in plaats van GDELT.

```text
GET https://api.marketaux.com/v1/news/all?symbols=ASML,SAP&filter_entities=true&language=en&published_after=2026-06-12T05:00&api_token=<KEY>
```

Aandachtspunten:
- het aantal artikelen per response is op de free tier beperkt; paginering kost requests - testen of 100/dag genoeg is voor 2 runs (verwachting: ja, ~10-20 calls per run);
- entity/ticker-herkenning scheelt LLM-filterwerk: `entities[].symbol` mapt direct op affected_symbols;
- draai naast de symbols-query ook een brede query zonder symbols met negatief-sentimentfilter, als event-pattern-vangnet voor namen buiten de watchlist.

## 6. Alpha Vantage NEWS_SENTIMENT - optionele sentimentlaag

Gratis tier: 25 requests per dag (premium vanaf ~$50/mnd). Levert nieuws met sentimentscores en ticker-relevantie. 25/dag is krap maar genoeg voor ~10 gerichte calls per run.

```text
GET https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=ASML&topics=earnings&time_from=20260612T0500&limit=200&apikey=<KEY>
```

Inzet: niet als primaire discovery maar als verrijking op candidates die de filter al passeerden (sentimentscore als extra rankinginput). Kan ook later.

## 7. Macro - FRED en centrale-bank-RSS

- FRED API (gratis key): macro-reeksen en release-calendar; `https://api.stlouisfed.org/fred/releases/dates?api_key=<KEY>&file_type=json`.
- ECB/Fed RSS (zie 4) voor rentebesluiten en speeches.
- Earnings calendar komt al uit Finnhub (1).

## 8. Mover sweep - koersbeweging als trigger (omgekeerde lookup)

De funnel hierboven stroomt van nieuws naar marktcontext. Voor perception events (geflopte productlancering, reputatieschade - het Ferrari-scenario) is de betrouwbare volgorde andersom: **de koersbeweging is het signaal, het nieuws is de verklaring.** Daarom draait elke run ook een mover sweep:

```text
1. Movers ophalen
   US:  GET https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=<KEY>
        (top 20 gainers/losers/most active; 1 call per run, past in 25/dag)
        Alternatief: FMP gainers/losers-endpoint (gratis tier).
   EU:  geen gratis movers-endpoint -> quote-sweep over een vast large-cap universum
        (AEX, DAX, CAC 40, FTSE MIB, IBEX; ~200 tickers) via de delayed marktdata-provider.
        Drempel: |beweging| >= 4% (configureerbaar per profiel).

2. Per flinke beweging die nog NIET door een bronitem wordt verklaard:
   - gerichte fetch: Finnhub company-news op de ticker (bron 1)
   - + GDELT-query op de bedrijfsnaam (bron 3)

3. Uitkomst:
   - nieuws gevonden  -> bronitem met de koersreactie als bewijs -> normale funnel in
   - niets gevonden   -> "unexplained move": context op het dashboard, GEEN candidate
                         (de regel "geen candidate zonder bron" blijft altijd gelden)
```

Hiermee is gegarandeerd dat alles wat hard beweegt - watchlist of niet - minstens een gerichte nieuws-zoektocht krijgt. Kosten: 1 endpoint-call + enkele tientallen quote-calls + 2-10 gerichte nieuws-fetches per run; verwaarloosbaar binnen de limieten.

## Ophaalpatroon (adapter-implementatie)

Alle bronnen volgen hetzelfde patroon, conform de adapter-interface in `technical-design.md`:

```ts
// elke adapter implementeert:
type SourceAdapter = {
  provider: string;                        // "finnhub" | "edgar" | "gdelt" | "rss" | "marketaux"
  category: SourceCategory;                // broad_news | financial_feed | primary_source | macro
  fetchItems(window: RunWindow): Promise<SourceItem[]>;  // window komt uit het run-profiel
};

type SourceItem = {
  providerItemId: string;   // GUID/URL/filing-id -> dedupe
  sourceName: string; sourceUrl: string;
  publishedAt: string; fetchedAt: string;
  title: string; snippet?: string;
  symbols?: string[]; topics?: string[];
  rawPayloadRef: string;    // opgeslagen response-referentie, niet de volledige content
};
```

Regels voor alle adapters:
1. **Pull bij run-start**, geen streaming/webhooks: de pipeline draait 2x per dag, polling is genoeg en houdt alles simpel.
2. **Tijdvenster uit het run-profiel**: eu_open haalt sinds vorige US-close, us_open sinds de EU-run. Items buiten het venster direct droppen.
3. **Failures zijn non-fataal**: timeout/429/5xx -> loggen op de run, doorgaan met overige adapters; backoff bij 429.
4. **Dedupe op twee niveaus**: exact op `providerItemId`/URL, daarna fuzzy op titel+symbool+tijd (clustering, bestaat al in het ontwerp).
5. **Cache en fixtures**: responses kort cachen (zelfde run niet dubbel fetchen); van elke adapter een opgenomen fixture voor tests, geen live calls in CI.
6. **Licentie**: alleen titel/snippet/link opslaan en tonen; volledige artikelen niet herpubliceren.

## Volume-inschatting per run

| Bron | Items per run (verwacht) |
|---|---|
| Finnhub company + general news | 30-60 |
| EDGAR 8-K/6-K Atom | 20-50 (waarvan enkele relevant) |
| GDELT of Marketaux | 30-80 |
| RSS-set (5-10 feeds) | 10-40 |
| Mover sweep (gerichte fetches) | 5-20 |
| **Totaal naar dedupe/filter** | **~100-220, na dedupe ~50-100** |

Dat matcht de aanname in `technical-design.md` (filter-LLM krijgt ~50-100 items, batch-gewijs, goedkoop model).

## Beslissing en vervolg

- **Slice 1 bouwt:** Finnhub + EDGAR + RSS-startset + mover sweep, plus GDELT **of** Marketaux als brede laag (keuze in week 1 na de EU-dekkingstest; Marketaux is de makkelijkste start, GDELT de breedste).
- **Upgradepad:** schiet de EU-dekking of kwaliteit tekort na de validatieperiode, dan is de eerste betaalde stap een professionelere feed (Benzinga/Finnhub betaald of EODHD met nieuws) - de adapter-interface verandert daar niet door.
- Env vars en de plek van elke laag in de pipeline: zie `technical-design.md`.
