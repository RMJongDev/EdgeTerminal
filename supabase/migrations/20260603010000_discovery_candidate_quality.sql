do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'discovery_run'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'discovery_run';
  end if;

  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'candidate_dedupe'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'candidate_dedupe';
  end if;

  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'candidate_ranking'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'candidate_ranking';
  end if;

  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'source_quality'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'source_quality';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'news_search'
      and enumtypid = 'public.ai_provider'::regtype
  ) then
    alter type public.ai_provider add value 'news_search';
  end if;

  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'market_data'
      and enumtypid = 'public.ai_provider'::regtype
  ) then
    alter type public.ai_provider add value 'market_data';
  end if;
end $$;

alter table public.ai_analysis_logs
  add column if not exists source_payload_refs text[] not null default '{}',
  add column if not exists score_inputs jsonb not null default '{}'::jsonb;

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  trigger text not null default 'manual' check (trigger in ('manual', 'morning', 'mock', 'future_cron')),
  provider text not null default 'mock' check (provider in ('mock', 'news_search', 'market_data', 'mixed')),
  context_hints jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  source_count integer not null default 0,
  candidate_count integer not null default 0,
  top_candidate_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  provider text not null,
  source_category text not null check (source_category in ('broad_news', 'financial_feed', 'primary_source', 'macro_calendar', 'market_context', 'manual')),
  provider_item_id text,
  source_name text not null,
  source_url text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  raw_payload_ref text,
  title text not null,
  snippet text,
  symbols text[] not null default '{}',
  topics text[] not null default '{}',
  source_quality_score numeric not null default 0 check (source_quality_score >= 0 and source_quality_score <= 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  title text not null,
  summary text,
  reason_to_watch text,
  affected_symbols text[] not null default '{}',
  affected_markets text[] not null default '{}',
  event_type_guess public.event_type not null default 'other',
  impact_direction_guess public.impact_direction not null default 'mixed',
  impact_level_guess public.impact_level not null default 'medium',
  relevance_score numeric not null default 0 check (relevance_score >= 0 and relevance_score <= 100),
  confidence_score numeric not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  source_quality_score numeric not null default 0 check (source_quality_score >= 0 and source_quality_score <= 100),
  recency_score numeric not null default 0 check (recency_score >= 0 and recency_score <= 100),
  candidate_quality_score numeric not null default 0 check (candidate_quality_score >= 0 and candidate_quality_score <= 100),
  dedupe_key text,
  merge_hint text,
  candidate_status text not null default 'new' check (candidate_status in ('new', 'accepted', 'ignored', 'merged', 'analyzed')),
  ignore_reason text,
  accepted_market_event_id uuid references public.market_events(id) on delete set null,
  canonical_candidate_id uuid references public.event_candidates(id) on delete set null,
  source_ids uuid[] not null default '{}',
  raw_payload_refs text[] not null default '{}',
  score_breakdown jsonb not null default '{}'::jsonb,
  uncertainty_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discovery_runs enable row level security;
alter table public.event_sources enable row level security;
alter table public.event_candidates enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'discovery_runs',
    'event_sources',
    'event_candidates'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_own', tbl);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', tbl || '_select_own', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_insert_own', tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)', tbl || '_insert_own', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_update_own', tbl);
    execute format('create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', tbl || '_update_own', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_delete_own', tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)', tbl || '_delete_own', tbl);
  end loop;
end $$;

drop trigger if exists set_discovery_runs_updated_at on public.discovery_runs;
create trigger set_discovery_runs_updated_at
before update on public.discovery_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_event_sources_updated_at on public.event_sources;
create trigger set_event_sources_updated_at
before update on public.event_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_event_candidates_updated_at on public.event_candidates;
create trigger set_event_candidates_updated_at
before update on public.event_candidates
for each row execute function public.set_updated_at();

create index if not exists discovery_runs_user_started_idx on public.discovery_runs (user_id, started_at desc);
create index if not exists event_sources_run_category_idx on public.event_sources (discovery_run_id, source_category);
create index if not exists event_sources_user_fetched_idx on public.event_sources (user_id, fetched_at desc);
create index if not exists event_candidates_run_score_idx on public.event_candidates (discovery_run_id, candidate_quality_score desc);
create index if not exists event_candidates_user_status_idx on public.event_candidates (user_id, candidate_status, created_at desc);
create index if not exists event_candidates_dedupe_idx on public.event_candidates (user_id, dedupe_key);
