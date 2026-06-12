do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'none'
      and enumtypid = 'public.setup_direction'::regtype
  ) then
    alter type public.setup_direction add value 'none';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'ok'
      and enumtypid = 'public.risk_verdict'::regtype
  ) then
    alter type public.risk_verdict add value 'ok';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_filter'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_filter';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_analysis'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_analysis';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_setup'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_setup';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_risk'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_risk';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_assembly'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_assembly';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'advice_briefing'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'advice_briefing';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'pipeline_step'
      and enumtypid = 'public.ai_analysis_type'::regtype
  ) then
    alter type public.ai_analysis_type add value 'pipeline_step';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'advice_direction') then
    create type public.advice_direction as enum ('long', 'short');
  end if;

  if not exists (select 1 from pg_type where typname = 'advice_market') then
    create type public.advice_market as enum ('us', 'eu');
  end if;

  if not exists (select 1 from pg_type where typname = 'advice_status') then
    create type public.advice_status as enum ('active', 'expired', 'invalidated', 'rejected_by_user');
  end if;

  if not exists (select 1 from pg_type where typname = 'advice_tracking_outcome') then
    create type public.advice_tracking_outcome as enum (
      'target',
      'stop',
      'expired_positive',
      'expired_negative',
      'invalidated'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'pipeline_step_status') then
    create type public.pipeline_step_status as enum ('pending', 'running', 'completed', 'failed', 'skipped');
  end if;
end $$;

alter table public.discovery_runs
  add column if not exists run_profile text not null default 'mock',
  add column if not exists cost_summary jsonb not null default '{}'::jsonb;

alter table public.discovery_runs
  drop constraint if exists discovery_runs_trigger_check;

alter table public.discovery_runs
  add constraint discovery_runs_trigger_check
  check (trigger in ('manual', 'morning', 'mock', 'future_cron', 'cron'));

alter table public.discovery_runs
  drop constraint if exists discovery_runs_run_profile_check;

alter table public.discovery_runs
  add constraint discovery_runs_run_profile_check
  check (run_profile in ('eu_open', 'us_open', 'mock'));

alter table public.trade_setups
  alter column asset_id drop not null;

create table if not exists public.source_payload_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_run_id uuid references public.discovery_runs(id) on delete cascade,
  event_source_id uuid references public.event_sources(id) on delete set null,
  raw_payload_ref text not null,
  provider text not null,
  payload_kind text not null default 'metadata' check (payload_kind in ('metadata', 'snippet', 'api_response')),
  payload jsonb not null default '{}'::jsonb,
  payload_hash text,
  retention_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, raw_payload_ref)
);

create table if not exists public.advices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  candidate_id uuid references public.event_candidates(id) on delete set null,
  analysis_id uuid references public.event_analyses(id) on delete set null,
  setup_id uuid references public.trade_setups(id) on delete set null,
  risk_review_id uuid references public.risk_reviews(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  ticker text not null,
  direction public.advice_direction not null,
  market public.advice_market not null,
  entry_zone_low numeric not null,
  entry_zone_high numeric not null,
  stop_loss numeric not null,
  target numeric not null,
  horizon_days integer not null check (horizon_days between 1 and 14),
  size_suggestion_eur numeric not null check (size_suggestion_eur >= 0),
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  rank integer check (rank between 1 and 5),
  event_type public.event_type not null default 'other',
  run_profile text not null default 'mock' check (run_profile in ('eu_open', 'us_open', 'mock')),
  reasoning text not null,
  counterargument text not null,
  invalidation text not null,
  source_refs jsonb not null default '[]'::jsonb,
  executability_note text,
  expected_move_pct numeric,
  cost_estimate_pct numeric,
  cost_hurdle_ratio numeric,
  correlation_warning text,
  gap_risk_note text,
  squeeze_risk_note text,
  status public.advice_status not null default 'active',
  taken_by_user boolean not null default false,
  user_entry_price numeric,
  user_exit_price numeric,
  user_note text,
  rejected_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advice_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advice_id uuid not null references public.advices(id) on delete cascade,
  reference_entry numeric not null,
  d1_return numeric,
  d3_return numeric,
  d5_return numeric,
  stop_hit_at timestamptz,
  target_hit_at timestamptz,
  expired_at timestamptz,
  final_return numeric,
  outcome public.advice_tracking_outcome,
  last_checked_at timestamptz,
  last_price numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (advice_id)
);

create table if not exists public.pipeline_step_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  candidate_id uuid references public.event_candidates(id) on delete set null,
  advice_id uuid references public.advices(id) on delete set null,
  step_name text not null check (step_name in (
    'create_run',
    'fetch_sources',
    'mover_sweep',
    'normalize_sources',
    'dedupe_cluster',
    'filter_candidates',
    'analyze_event',
    'generate_setup',
    'review_risk',
    'check_executability',
    'assemble_advices',
    'update_tracking',
    'complete_run'
  )),
  status public.pipeline_step_status not null default 'pending',
  attempt integer not null default 1 check (attempt >= 1),
  prompt_version text,
  model text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  cost_summary jsonb not null default '{}'::jsonb,
  source_payload_refs text[] not null default '{}',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_analysis_logs
  add column if not exists discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  add column if not exists candidate_id uuid references public.event_candidates(id) on delete set null,
  add column if not exists advice_id uuid references public.advices(id) on delete set null,
  add column if not exists pipeline_step_run_id uuid references public.pipeline_step_runs(id) on delete set null,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists cost_eur numeric;

alter table public.source_payload_snapshots enable row level security;
alter table public.advices enable row level security;
alter table public.advice_tracking enable row level security;
alter table public.pipeline_step_runs enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'source_payload_snapshots',
    'advices',
    'advice_tracking',
    'pipeline_step_runs'
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

drop trigger if exists set_source_payload_snapshots_updated_at on public.source_payload_snapshots;
create trigger set_source_payload_snapshots_updated_at
before update on public.source_payload_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists set_advices_updated_at on public.advices;
create trigger set_advices_updated_at
before update on public.advices
for each row execute function public.set_updated_at();

drop trigger if exists set_advice_tracking_updated_at on public.advice_tracking;
create trigger set_advice_tracking_updated_at
before update on public.advice_tracking
for each row execute function public.set_updated_at();

drop trigger if exists set_pipeline_step_runs_updated_at on public.pipeline_step_runs;
create trigger set_pipeline_step_runs_updated_at
before update on public.pipeline_step_runs
for each row execute function public.set_updated_at();

create index if not exists source_snapshots_run_idx
  on public.source_payload_snapshots (discovery_run_id, provider);
create index if not exists advices_run_rank_idx
  on public.advices (discovery_run_id, rank);
create index if not exists advices_user_status_idx
  on public.advices (user_id, status, created_at desc);
create index if not exists advices_user_ticker_idx
  on public.advices (user_id, ticker, created_at desc);
create index if not exists advice_tracking_user_checked_idx
  on public.advice_tracking (user_id, last_checked_at desc);
create index if not exists pipeline_step_runs_run_step_idx
  on public.pipeline_step_runs (discovery_run_id, step_name, attempt);
create index if not exists pipeline_step_runs_user_status_idx
  on public.pipeline_step_runs (user_id, status, created_at desc);
create index if not exists ai_logs_run_idx
  on public.ai_analysis_logs (discovery_run_id, created_at desc);
