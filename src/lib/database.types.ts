export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRole = "owner" | "admin" | "member";
type AssetType = "us_equity" | "eu_equity" | "etf";
type AssetStatus = "active" | "inactive";
type EventType =
  | "earnings"
  | "guidance"
  | "analyst"
  | "m_and_a"
  | "product_launch"
  | "legal"
  | "macro"
  | "sector"
  | "competitor"
  | "perception"
  | "other";
type ImpactDirection = "positive" | "negative" | "neutral" | "mixed";
type ImpactLevel = "low" | "medium" | "high";
type AnalysisStatus = "pending" | "analyzed" | "needs_review" | "failed";
type SetupDirection = "long" | "short" | "no_trade" | "none";
type SetupStatus = "draft" | "approved" | "rejected" | "watching" | "paper_trade";
type RiskVerdict = "paper_trade_ok" | "wait" | "skip" | "ok";
type PaperTradeStatus = "open" | "closed" | "stop_loss_hit" | "target_hit" | "expired" | "cancelled";
type CloseReason =
  | "target_hit"
  | "stop_loss_hit"
  | "manual_close"
  | "hypothesis_invalidated"
  | "expired"
  | "cancelled";
type AIProvider = "openai" | "gemini" | "news_search" | "market_data" | "mock";
type AIAnalysisType =
  | "event_analysis"
  | "setup_generation"
  | "risk_review"
  | "daily_briefing"
  | "web_research"
  | "discovery_run"
  | "candidate_dedupe"
  | "candidate_ranking"
  | "source_quality"
  | "advice_filter"
  | "advice_analysis"
  | "advice_setup"
  | "advice_risk"
  | "advice_assembly"
  | "advice_briefing"
  | "pipeline_step";
type DiscoveryStatus = "running" | "completed" | "failed";
type DiscoveryTrigger = "manual" | "morning" | "mock" | "future_cron" | "cron";
type DiscoveryProvider = "mock" | "news_search" | "market_data" | "mixed";
type RunProfile = "eu_open" | "us_open" | "mock";
type SourceCategory =
  | "broad_news"
  | "financial_feed"
  | "primary_source"
  | "macro_calendar"
  | "market_context"
  | "manual";
type CandidateStatus = "new" | "accepted" | "ignored" | "merged" | "analyzed";
type AdviceDirection = "long" | "short";
type AdviceMarket = "us" | "eu";
type AdviceStatus = "active" | "expired" | "invalidated" | "rejected_by_user";
type AdviceTrackingOutcome =
  | "target"
  | "stop"
  | "expired_positive"
  | "expired_negative"
  | "invalidated";
type PipelineStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type UserOwned = {
  id: string;
  user_id: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string;
          full_name: string | null;
          role: ProfileRole;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          full_name?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        }
      >;
      assets: TableDefinition<
        UserOwned &
          Timestamps & {
            ticker: string;
            name: string;
            asset_type: AssetType;
            sector: string | null;
            exchange: string | null;
            currency: string;
            country: string | null;
            priority: number;
            status: AssetStatus;
            notes: string | null;
            last_move_percent: number | null;
          }
      >;
      discovery_runs: TableDefinition<
        UserOwned &
          Timestamps & {
            status: DiscoveryStatus;
            trigger: DiscoveryTrigger;
            provider: DiscoveryProvider;
            run_profile: RunProfile;
            context_hints: Json;
            started_at: string;
            completed_at: string | null;
            source_count: number;
            candidate_count: number;
            top_candidate_count: number;
            cost_summary: Json;
            error_message: string | null;
            metadata: Json;
          }
      >;
      event_sources: TableDefinition<
        UserOwned &
          Timestamps & {
            discovery_run_id: string;
            provider: string;
            source_category: SourceCategory;
            provider_item_id: string | null;
            source_name: string;
            source_url: string | null;
            published_at: string | null;
            fetched_at: string;
            raw_payload_ref: string | null;
            title: string;
            snippet: string | null;
            symbols: string[];
            topics: string[];
            source_quality_score: number;
            metadata: Json;
          }
      >;
      source_payload_snapshots: TableDefinition<
        UserOwned &
          Timestamps & {
            discovery_run_id: string | null;
            event_source_id: string | null;
            raw_payload_ref: string;
            provider: string;
            payload_kind: "metadata" | "snippet" | "api_response";
            payload: Json;
            payload_hash: string | null;
            retention_note: string | null;
          }
      >;
      event_candidates: TableDefinition<
        UserOwned &
          Timestamps & {
            discovery_run_id: string;
            title: string;
            summary: string | null;
            reason_to_watch: string | null;
            affected_symbols: string[];
            affected_markets: string[];
            event_type_guess: EventType;
            impact_direction_guess: ImpactDirection;
            impact_level_guess: ImpactLevel;
            relevance_score: number;
            confidence_score: number;
            source_quality_score: number;
            recency_score: number;
            candidate_quality_score: number;
            dedupe_key: string | null;
            merge_hint: string | null;
            candidate_status: CandidateStatus;
            ignore_reason: string | null;
            accepted_market_event_id: string | null;
            canonical_candidate_id: string | null;
            source_ids: string[];
            raw_payload_refs: string[];
            score_breakdown: Json;
            uncertainty_notes: string | null;
            metadata: Json;
          }
      >;
      market_events: TableDefinition<
        UserOwned &
          Timestamps & {
            title: string;
            summary: string | null;
            source: string | null;
            occurred_at: string;
            event_type: EventType;
            impact_direction: ImpactDirection;
            impact_level: ImpactLevel;
            analysis_status: AnalysisStatus;
            price_move_percent: number | null;
          }
      >;
      event_assets: TableDefinition<
        {
          id: string;
          user_id: string;
          event_id: string;
          asset_id: string;
          created_at: string;
        }
      >;
      event_analyses: TableDefinition<
        UserOwned &
          Timestamps & {
            event_id: string;
            sentiment: ImpactDirection;
            impact_level: ImpactLevel;
            time_horizon: string | null;
            confidence_score: number;
            summary: string | null;
            bull_case: string | null;
            bear_case: string | null;
            key_risks: string | null;
            fundamental_impact: string | null;
            sentiment_impact: string | null;
            price_impact: string | null;
            reversal_chance: string | null;
            follow_through_risk: string | null;
          }
      >;
      trade_setups: TableDefinition<
        UserOwned &
          Timestamps & {
            event_id: string;
            asset_id: string | null;
            asset_ticker: string | null;
            title: string;
            direction: SetupDirection;
            strategy: string | null;
            entry_logic: string | null;
            stop_loss: string | null;
            target: string | null;
            time_horizon: string | null;
            confidence_score: number;
            rationale: string | null;
            invalidation: string | null;
            assumptions: string | null;
            status: SetupStatus;
          }
      >;
      risk_reviews: TableDefinition<
        UserOwned &
          Timestamps & {
            setup_id: string;
            key_risks: string | null;
            counterargument: string | null;
            reason_to_skip: string | null;
            risk_score: number;
            final_verdict: RiskVerdict;
          }
      >;
      advices: TableDefinition<
        UserOwned &
          Timestamps & {
            discovery_run_id: string | null;
            candidate_id: string | null;
            analysis_id: string | null;
            setup_id: string | null;
            risk_review_id: string | null;
            asset_id: string | null;
            ticker: string;
            direction: AdviceDirection;
            market: AdviceMarket;
            entry_zone_low: number;
            entry_zone_high: number;
            stop_loss: number;
            target: number;
            horizon_days: number;
            size_suggestion_eur: number;
            confidence: number;
            rank: number | null;
            event_type: EventType;
            run_profile: RunProfile;
            reasoning: string;
            counterargument: string;
            invalidation: string;
            source_refs: Json;
            executability_note: string | null;
            expected_move_pct: number | null;
            cost_estimate_pct: number | null;
            cost_hurdle_ratio: number | null;
            correlation_warning: string | null;
            gap_risk_note: string | null;
            squeeze_risk_note: string | null;
            status: AdviceStatus;
            taken_by_user: boolean;
            user_entry_price: number | null;
            user_exit_price: number | null;
            user_note: string | null;
            rejected_reason: string | null;
            metadata: Json;
          }
      >;
      advice_tracking: TableDefinition<
        UserOwned &
          Timestamps & {
            advice_id: string;
            reference_entry: number;
            d1_return: number | null;
            d3_return: number | null;
            d5_return: number | null;
            stop_hit_at: string | null;
            target_hit_at: string | null;
            expired_at: string | null;
            final_return: number | null;
            outcome: AdviceTrackingOutcome | null;
            last_checked_at: string | null;
            last_price: number | null;
            metadata: Json;
          }
      >;
      pipeline_step_runs: TableDefinition<
        UserOwned &
          Timestamps & {
            discovery_run_id: string;
            candidate_id: string | null;
            advice_id: string | null;
            step_name: string;
            status: PipelineStepStatus;
            attempt: number;
            prompt_version: string | null;
            model: string | null;
            input_payload: Json;
            output_payload: Json;
            cost_summary: Json;
            source_payload_refs: string[];
            error_message: string | null;
            started_at: string | null;
            completed_at: string | null;
          }
      >;
      paper_trades: TableDefinition<
        UserOwned &
          Timestamps & {
            setup_id: string;
            asset_id: string;
            asset_ticker: string | null;
            direction: SetupDirection;
            entry_price: number;
            stop_loss: number | null;
            target_price: number | null;
            opened_at: string;
            closed_at: string | null;
            status: PaperTradeStatus;
            exit_price: number | null;
            result_percent: number | null;
            close_reason: CloseReason | null;
            notes: string | null;
            hypothesis_review: string | null;
          }
      >;
      trade_evaluations: TableDefinition<
        UserOwned &
          Timestamps & {
            paper_trade_id: string;
            result_percent: number | null;
            close_reason: CloseReason | null;
            hypothesis_review: string | null;
          }
      >;
      ai_analysis_logs: TableDefinition<
        UserOwned & {
          analysis_type: AIAnalysisType;
          provider: AIProvider;
          model: string | null;
          prompt_version: string;
          discovery_run_id: string | null;
          candidate_id: string | null;
          advice_id: string | null;
          pipeline_step_run_id: string | null;
          input_payload: Json;
          output_payload: Json;
          status: "success" | "failed";
          usefulness_rating: number | null;
          summary: string | null;
          error_message: string | null;
          source_payload_refs: string[];
          score_inputs: Json;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_eur: number | null;
          created_at: string;
        }
      >;
      daily_briefings: TableDefinition<
        UserOwned &
          Timestamps & {
            briefing_date: string;
            title: string;
            market_summary: string | null;
            key_events: string[];
            possible_setups: string[];
            key_risks: string[];
            open_trades: string[];
            do_nothing_warning: string | null;
            conclusion: string | null;
          }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      asset_type: AssetType;
      asset_status: AssetStatus;
      event_type: EventType;
      impact_direction: ImpactDirection;
      impact_level: ImpactLevel;
      analysis_status: AnalysisStatus;
      setup_direction: SetupDirection;
      setup_status: SetupStatus;
      risk_verdict: RiskVerdict;
      paper_trade_status: PaperTradeStatus;
      close_reason: CloseReason;
      ai_provider: AIProvider;
      ai_analysis_type: AIAnalysisType;
      advice_direction: AdviceDirection;
      advice_market: AdviceMarket;
      advice_status: AdviceStatus;
      advice_tracking_outcome: AdviceTrackingOutcome;
      pipeline_step_status: PipelineStepStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
