# Graph Report - .  (2026-05-31)

## Corpus Check
- 27 files · ~12,420 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 82 nodes · 84 edges · 22 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `hasSupabaseEnv()` - 9 edges
2. `New Default` - 9 edges
3. `createClient()` - 8 edges
4. `GET()` - 7 edges
5. `signIn()` - 6 edges
6. `signUp()` - 6 edges
7. `Project Kickstart` - 6 edges
8. `getCredentials()` - 4 edges
9. `getSupabaseEnv()` - 4 edges
10. `updateSession()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `HomePage()` --calls--> `hasSupabaseEnv()`  [INFERRED]
  src\app\page.tsx → src\lib\env.ts
- `House Style (NL docs, EN code, ASCII, darkmode)` --semantically_similar_to--> `DEPT-style Tone of Voice`  [INFERRED] [semantically similar]
  CLAUDE.md → Docs/Context/developer-context.md
- `hasSupabaseEnv()` --calls--> `updateSession()`  [INFERRED]
  src\lib\env.ts → src\lib\supabase\proxy.ts
- `getSupabaseEnv()` --calls--> `createClient()`  [INFERRED]
  src\lib\env.ts → src\lib\supabase\server.ts
- `proxy()` --calls--> `updateSession()`  [INFERRED]
  src\proxy.ts → src\lib\supabase\proxy.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (11): getCredentials(), safeNext(), signIn(), signOut(), signUp(), hasSupabaseEnv(), DashboardPage(), LoginPage() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (13): Four-Phase Kickstart, Project Accelerator Skill, Granokoffie, Mendix Platform, New Default, Pauline, Robin de Jong, New Default Services (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (12): .claude/ Configuration, Docs/ Structure, Graphify Integration, House Style (NL docs, EN code, ASCII, darkmode), Mandatory Implementation Log, Project Kickstart, Settings Team vs Local, Skill Location Convention (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (4): createClient(), getSupabaseEnv(), proxy(), updateSession()

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (1): HomePage()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

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

## Knowledge Gaps
- **12 isolated node(s):** `Four-Phase Kickstart`, `Docs/ Structure`, `Skill Location Convention`, `Settings Team vs Local`, `Graphify Integration` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `HomePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `ProtectedLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `AuthErrorPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `AppShell()`, `app-shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `status-pill.tsx`, `StatusPill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `Button()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `Label()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `smoke.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `New Default` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `hasSupabaseEnv()` connect `Community 0` to `Community 3`, `Community 6`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Project Kickstart` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `hasSupabaseEnv()` (e.g. with `HomePage()` and `DashboardPage()`) actually correct?**
  _`hasSupabaseEnv()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `createClient()` (e.g. with `DashboardPage()` and `signIn()`) actually correct?**
  _`createClient()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `GET()` (e.g. with `getCredentials()` and `signIn()`) actually correct?**
  _`GET()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `signIn()` (e.g. with `hasSupabaseEnv()` and `createClient()`) actually correct?**
  _`signIn()` has 3 INFERRED edges - model-reasoned connections that need verification._