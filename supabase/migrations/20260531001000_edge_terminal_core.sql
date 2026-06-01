create extension if not exists "pgcrypto";

create type public.asset_type as enum ('us_equity', 'eu_equity', 'etf');
create type public.asset_status as enum ('active', 'inactive');
create type public.event_type as enum (
  'earnings',
  'guidance',
  'analyst',
  'm_and_a',
  'product_launch',
  'legal',
  'macro',
  'sector',
  'competitor',
  'perception',
  'other'
);
create type public.impact_direction as enum ('positive', 'negative', 'neutral', 'mixed');
create type public.impact_level as enum ('low', 'medium', 'high');
create type public.analysis_status as enum ('pending', 'analyzed', 'needs_review', 'failed');
create type public.setup_direction as enum ('long', 'short', 'no_trade');
create type public.setup_status as enum ('draft', 'approved', 'rejected', 'watching', 'paper_trade');
create type public.risk_verdict as enum ('paper_trade_ok', 'wait', 'skip');
create type public.paper_trade_status as enum ('open', 'closed', 'stop_loss_hit', 'target_hit', 'expired', 'cancelled');
create type public.close_reason as enum ('target_hit', 'stop_loss_hit', 'manual_close', 'hypothesis_invalidated', 'expired', 'cancelled');
create type public.ai_provider as enum ('openai', 'gemini', 'mock');
create type public.ai_analysis_type as enum ('event_analysis', 'setup_generation', 'risk_review', 'daily_briefing', 'web_research');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  name text not null,
  asset_type public.asset_type not null,
  sector text,
  exchange text,
  currency text not null default 'USD',
  country text,
  priority integer not null default 5,
  status public.asset_status not null default 'active',
  notes text,
  last_move_percent numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create table public.market_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  source text,
  occurred_at timestamptz not null default now(),
  event_type public.event_type not null default 'other',
  impact_direction public.impact_direction not null default 'mixed',
  impact_level public.impact_level not null default 'medium',
  analysis_status public.analysis_status not null default 'pending',
  price_move_percent numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.market_events(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, asset_id)
);

create table public.event_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.market_events(id) on delete cascade,
  sentiment public.impact_direction not null default 'mixed',
  impact_level public.impact_level not null default 'medium',
  time_horizon text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  summary text,
  bull_case text,
  bear_case text,
  key_risks text,
  fundamental_impact text,
  sentiment_impact text,
  price_impact text,
  reversal_chance text,
  follow_through_risk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trade_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.market_events(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  asset_ticker text,
  title text not null,
  direction public.setup_direction not null,
  strategy text,
  entry_logic text,
  stop_loss text,
  target text,
  time_horizon text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  rationale text,
  invalidation text,
  assumptions text,
  status public.setup_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.risk_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setup_id uuid not null references public.trade_setups(id) on delete cascade,
  key_risks text,
  counterargument text,
  reason_to_skip text,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  final_verdict public.risk_verdict not null default 'wait',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setup_id uuid not null references public.trade_setups(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  asset_ticker text,
  direction public.setup_direction not null,
  entry_price numeric not null,
  stop_loss numeric,
  target_price numeric,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status public.paper_trade_status not null default 'open',
  exit_price numeric,
  result_percent numeric,
  close_reason public.close_reason,
  notes text,
  hypothesis_review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trade_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_trade_id uuid not null references public.paper_trades(id) on delete cascade,
  result_percent numeric,
  close_reason public.close_reason,
  hypothesis_review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type public.ai_analysis_type not null,
  provider public.ai_provider not null default 'mock',
  model text,
  prompt_version text not null,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  status text not null default 'success' check (status in ('success', 'failed')),
  usefulness_rating integer check (usefulness_rating between 1 and 5),
  summary text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.daily_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  briefing_date date not null default current_date,
  title text not null,
  market_summary text,
  key_events text[] not null default '{}',
  possible_setups text[] not null default '{}',
  key_risks text[] not null default '{}',
  open_trades text[] not null default '{}',
  do_nothing_warning text,
  conclusion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, briefing_date)
);

alter table public.assets enable row level security;
alter table public.market_events enable row level security;
alter table public.event_assets enable row level security;
alter table public.event_analyses enable row level security;
alter table public.trade_setups enable row level security;
alter table public.risk_reviews enable row level security;
alter table public.paper_trades enable row level security;
alter table public.trade_evaluations enable row level security;
alter table public.ai_analysis_logs enable row level security;
alter table public.daily_briefings enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'assets',
    'market_events',
    'event_assets',
    'event_analyses',
    'trade_setups',
    'risk_reviews',
    'paper_trades',
    'trade_evaluations',
    'ai_analysis_logs',
    'daily_briefings'
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

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
drop trigger if exists set_market_events_updated_at on public.market_events;
create trigger set_market_events_updated_at before update on public.market_events for each row execute function public.set_updated_at();
drop trigger if exists set_event_analyses_updated_at on public.event_analyses;
create trigger set_event_analyses_updated_at before update on public.event_analyses for each row execute function public.set_updated_at();
drop trigger if exists set_trade_setups_updated_at on public.trade_setups;
create trigger set_trade_setups_updated_at before update on public.trade_setups for each row execute function public.set_updated_at();
drop trigger if exists set_risk_reviews_updated_at on public.risk_reviews;
create trigger set_risk_reviews_updated_at before update on public.risk_reviews for each row execute function public.set_updated_at();
drop trigger if exists set_paper_trades_updated_at on public.paper_trades;
create trigger set_paper_trades_updated_at before update on public.paper_trades for each row execute function public.set_updated_at();
drop trigger if exists set_trade_evaluations_updated_at on public.trade_evaluations;
create trigger set_trade_evaluations_updated_at before update on public.trade_evaluations for each row execute function public.set_updated_at();
drop trigger if exists set_daily_briefings_updated_at on public.daily_briefings;
create trigger set_daily_briefings_updated_at before update on public.daily_briefings for each row execute function public.set_updated_at();

create index assets_user_status_idx on public.assets (user_id, status, priority);
create index market_events_user_date_idx on public.market_events (user_id, occurred_at desc);
create index market_events_user_type_idx on public.market_events (user_id, event_type);
create index trade_setups_user_status_idx on public.trade_setups (user_id, status);
create index paper_trades_user_status_idx on public.paper_trades (user_id, status, opened_at desc);
create index ai_logs_user_created_idx on public.ai_analysis_logs (user_id, created_at desc);
