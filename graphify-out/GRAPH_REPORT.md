# Graph Report - .  (2026-06-12)

## Corpus Check
- 53 files · ~53,749 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 191 nodes · 275 edges · 40 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `asString()` - 15 edges
2. `getAuthenticatedSupabase()` - 15 edges
3. `refresh()` - 13 edges
4. `hasSupabaseEnv()` - 11 edges
5. `GET()` - 10 edges
6. `createClient()` - 10 edges
7. `startDailyScan()` - 9 edges
8. `New Default` - 9 edges
9. `analyzeCandidate()` - 8 edges
10. `toAiLogRow()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `generateEventAnalysis()` --calls--> `createMockEventAnalysis()`  [INFERRED]
  src\lib\edge-terminal\actions.ts → src\lib\edge-terminal\ai.ts
- `generateSetup()` --calls--> `createMockSetup()`  [INFERRED]
  src\lib\edge-terminal\actions.ts → src\lib\edge-terminal\ai.ts
- `generateRiskReview()` --calls--> `createMockRiskReview()`  [INFERRED]
  src\lib\edge-terminal\actions.ts → src\lib\edge-terminal\ai.ts
- `House Style (NL docs, EN code, ASCII, darkmode)` --semantically_similar_to--> `DEPT-style Tone of Voice`  [INFERRED] [semantically similar]
  CLAUDE.md → Docs/Context/developer-context.md
- `AiLogPage()` --calls--> `getTerminalData()`  [INFERRED]
  src\app\(app)\ai-log\page.tsx → src\lib\edge-terminal\data.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (16): getCredentials(), safeNext(), signIn(), signOut(), signUp(), AppShell(), createClient(), getSupabaseEnv() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (25): .claude/ Configuration, Docs/ Structure, Four-Phase Kickstart, Graphify Integration, House Style (NL docs, EN code, ASCII, darkmode), Mandatory Implementation Log, Project Accelerator Skill, Project Kickstart (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.3
Nodes (22): acceptCandidate(), analyzeCandidate(), asJson(), asNumber(), asRecord(), asScanHintMode(), asString(), closePaperTrade() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (11): asContextHints(), asRecord(), asScoreBreakdown(), asStringArray(), getEventDetail(), getTerminalData(), toBriefing(), toDiscoveryRun() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.28
Nodes (11): buildMockDiscoveryResult(), createScanContextHints(), extractSymbols(), extractTopics(), cloneSources(), fetchBroadNewsSources(), fetchFinancialNewsSources(), fetchMarketContext() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (4): createRawPayloadRef(), mergeStepCost(), roundCost(), sanitizeRefPart()

### Community 6 - "Community 6"
Cohesion: 0.28
Nodes (7): createMockEventAnalysis(), createMockRiskReview(), createMockSetup(), getAiRuntimeStatus(), hasGeminiEnv(), hasOpenAiEnv(), AiLogPage()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (2): getDashboardMetrics(), getPerformanceSummary()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (0):

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (5): applyScanHint(), calculateCandidateQualityScore(), clampScore(), getScanHintFit(), tokenize()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (0):

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (1): impactTone()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0):

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0):

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0):

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0):

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0):

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0):

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0):

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0):

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0):

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0):

### Community 22 - "Community 22"
Cohesion: 1.0
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

## Knowledge Gaps
- **12 isolated node(s):** `Four-Phase Kickstart`, `Docs/ Structure`, `Skill Location Convention`, `Settings Team vs Local`, `Graphify Integration` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `RiskRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `SignalsRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `AuthErrorPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `status-pill.tsx`, `StatusPill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `Button()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `Label()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `scoreBreakdown()`, `demo-data.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `smoke.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `pipeline-contracts.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getTerminalData()` connect `Community 3` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `hasSupabaseEnv()` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `getAuthenticatedSupabase()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getAuthenticatedSupabase()` (e.g. with `hasSupabaseEnv()` and `createClient()`) actually correct?**
  _`getAuthenticatedSupabase()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `hasSupabaseEnv()` (e.g. with `ProtectedLayout()` and `signIn()`) actually correct?**
  _`hasSupabaseEnv()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `GET()` (e.g. with `getCredentials()` and `signIn()`) actually correct?**
  _`GET()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Four-Phase Kickstart`, `Docs/ Structure`, `Skill Location Convention` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
