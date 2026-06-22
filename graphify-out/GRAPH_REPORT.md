# Graph Report - .  (2026-06-13)

## Corpus Check
- 84 files · ~81,371 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 438 nodes · 751 edges · 62 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `startRun()` - 24 edges
2. `GET()` - 15 edges
3. `updateLocalTerminalData()` - 15 edges
4. `asString()` - 14 edges
5. `round()` - 14 edges
6. `isLocalRuntime()` - 13 edges
7. `refresh()` - 12 edges
8. `startDailyScan()` - 12 edges
9. `getAuthenticatedSupabase()` - 11 edges
10. `analyzeCandidate()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `createEmptyCostSummary()` --calls--> `startRun()`  [INFERRED]
  src\lib\edge-terminal\pipeline\contracts.ts → src\lib\edge-terminal\pipeline\run.ts
- `House Style (NL docs, EN code, ASCII, darkmode)` --semantically_similar_to--> `DEPT-style Tone of Voice`  [INFERRED] [semantically similar]
  CLAUDE.md → Docs/Context/developer-context.md
- `AiLogPage()` --calls--> `getTerminalData()`  [INFERRED]
  src\app\(app)\ai-log\page.tsx → src\lib\edge-terminal\data.ts
- `GET()` --calls--> `asString()`  [INFERRED]
  src\app\auth\confirm\route.ts → src\lib\edge-terminal\actions.ts
- `GET()` --calls--> `asNumber()`  [INFERRED]
  src\app\auth\confirm\route.ts → src\lib\edge-terminal\actions.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (42): createEventAnalysis(), createEventFromCandidate(), createCandidatesFromSources(), hasOpenAiApiKey(), createRiskReview(), aggregateStepCost(), briefingPromptInput(), buildRunWindow() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (38): createRawPayloadRef(), createFinnhubAdapters(), createFinnhubEarningsAdapter(), createFinnhubNewsAdapter(), createFinnhubQuoteAdapter(), earningsToSourceItem(), fetchFinnhubLastPrices(), getFinnhubConfig() (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (28): acceptCandidate(), analyzeCandidate(), asJson(), asNumber(), asRecord(), asScanHintMode(), asString(), createAsset() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (20): getCredentials(), safeNext(), signIn(), signOut(), signUp(), createClient(), getEdgeRuntimeMode(), getLocalDatabasePath() (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (25): .claude/ Configuration, Docs/ Structure, Four-Phase Kickstart, Graphify Integration, House Style (NL docs, EN code, ASCII, darkmode), Mandatory Implementation Log, Project Accelerator Skill, Project Kickstart (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (21): mergeCluster(), applyScanHint(), calculateCandidateQualityScore(), clampScore(), getScanHintFit(), tokenize(), checkExecutability(), round() (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (14): asAdviceSourceRefs(), asContextHints(), asRecord(), asScoreBreakdown(), asStringArray(), getEventDetail(), getTerminalData(), toAdvice() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (13): createAiLog(), getAiRuntimeStatus(), hasOpenAiEnv(), callOpenAiStructured(), estimateOpenAiCost(), extractOutputText(), fetchWithRetry(), getApiKey() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (11): average(), formatPercent(), getAdvicePerformance(), getCalibrationContext(), getDashboardMetrics(), getRiskGuardrails(), groupBy(), qualityLabel() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (11): companyFromTitle(), createEdgarCurrentFilingsAdapter(), decodeXml(), entryToSourceItem(), fetchCurrentFeed(), getUserAgent(), hasEdgarEnv(), linkHref() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.32
Nodes (11): cloneData(), createInitialData(), ensureSchema(), getDatabase(), getLocalTerminalData(), normalizeTerminalData(), readSnapshot(), replaceMirrorRows() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.28
Nodes (11): buildMockDiscoveryResult(), createScanContextHints(), extractSymbols(), extractTopics(), cloneSources(), fetchBroadNewsSources(), fetchFinancialNewsSources(), fetchMarketContext() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.27
Nodes (10): assetQuery(), buildGdeltQueries(), cleanTicker(), fetchGdeltArticles(), parseGdeltDate(), quotePhrase(), sectorQuery(), timespanForWindow() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.42
Nodes (9): activeOpenSameThemeCount(), assembleAdvices(), correlationPenalty(), correlationWarning(), marketForTicker(), rankedSameThemeCount(), rankScore(), rankScoreWithOpenCorrelation() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.31
Nodes (9): dedupeAndClusterCandidates(), fuzzyMatches(), jaccard(), sharesSymbol(), sourceById(), sourceExactKeys(), sourcePublishedAt(), titleTokens() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (4): createEmptyCostSummary(), mergeStepCost(), roundCost(), sanitizeRefPart()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (0):

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (1): impactTone()

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (0):

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0):

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0):

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0):

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (0):

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0):

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0):

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0):

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0):

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0):

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0):

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0):

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0):

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0):

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0):

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0):

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0):

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0):

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0):

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0):

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0):

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0):

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0):

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0):

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0):

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0):

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0):

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0):

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0):

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0):

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0):

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0):

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0):

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0):

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0):

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0):

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0):

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0):

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0):

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0):

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0):

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0):

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0):

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **12 isolated node(s):** `Four-Phase Kickstart`, `Docs/ Structure`, `Skill Location Convention`, `Settings Team vs Local`, `Graphify Integration` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 23`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `PaperTradesRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `qualityTone()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `RiskRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `SetupsRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `SignalsRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `AuthErrorPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `status-pill.tsx`, `StatusPill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Button()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `Label()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `scoreBreakdown()`, `demo-data.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `createFixtureFetch()`, `finnhub-adapter.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `createJsonFetch()`, `openai-llm.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `createAssemblyItem()`, `pipeline-run.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `createRiskFixture()`, `risk-guardrails.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `createFixtureFetch()`, `rss-official-adapter.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `app-shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `smoke.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `edgar-adapter.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `local-store.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `pipeline-contracts.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `startRun()` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`, `Community 10`, `Community 13`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `getTerminalData()` connect `Community 6` to `Community 10`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 3` to `Community 2`, `Community 5`, `Community 8`, `Community 10`, `Community 11`, `Community 14`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `startRun()` (e.g. with `startAdviceRun()` and `getLocalTerminalData()`) actually correct?**
  _`startRun()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `GET()` (e.g. with `getCredentials()` and `signIn()`) actually correct?**
  _`GET()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `updateLocalTerminalData()` (e.g. with `startDailyScan()` and `markAdviceTaken()`) actually correct?**
  _`updateLocalTerminalData()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `round()` (e.g. with `clampScore()` and `getPerformanceSummary()`) actually correct?**
  _`round()` has 12 INFERRED edges - model-reasoned connections that need verification._
