-- ClickPet Institutional Investor Database Schema
-- PostgreSQL 14+
-- Purpose: structured institutional database for investor consultation and natural-language AI responses.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS clickpet_institutional;
SET search_path TO clickpet_institutional, public;

-- =========================
-- ENUMS
-- =========================

DO $$ BEGIN
  CREATE TYPE visibility_level AS ENUM ('internal', 'investor', 'partner', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'pitch_deck',
    'competitive_analysis',
    'project_presentation',
    'investment_memo',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_category AS ENUM (
    'company',
    'investment_thesis',
    'market',
    'problem',
    'solution',
    'product',
    'traction',
    'business_model',
    'growth',
    'projection',
    'funding',
    'valuation',
    'competition',
    'risk',
    'vision',
    'faq'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE company_stage AS ENUM ('idea', 'mvp', 'pre_seed', 'seed', 'series_a', 'growth');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metric_value_type AS ENUM ('number', 'money', 'percentage', 'boolean', 'text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE competitor_type AS ENUM (
    'direct',
    'indirect',
    'marketplace',
    'delivery_app',
    'retail_chain',
    'ecommerce',
    'informal_channel',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE target_period_type AS ENUM ('date', 'month', 'quarter', 'year', 'stage', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- CORE TABLES
-- =========================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  slogan VARCHAR(255),
  short_description TEXT,
  institutional_description TEXT,
  business_context TEXT,
  business_model_summary TEXT,
  target_audience TEXT,
  market_segment TEXT,
  positioning TEXT,
  value_proposition TEXT,
  current_stage company_stage,
  headquarters_country VARCHAR(80) DEFAULT 'Brasil',
  website_url TEXT,
  app_status TEXT,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT companies_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS institutional_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  source_type document_type NOT NULL,
  file_name VARCHAR(255),
  source_reference TEXT,
  description TEXT,
  reference_date DATE,
  version VARCHAR(40),
  reliability_notes TEXT,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, title, source_type)
);

CREATE TABLE IF NOT EXISTS content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  category content_category NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  full_content TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  page_reference VARCHAR(80),
  section_reference VARCHAR(120),
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flexible knowledge table for AI retrieval when content does not deserve a dedicated table.
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  category content_category NOT NULL,
  title VARCHAR(255) NOT NULL,
  answer_summary TEXT,
  answer_detail TEXT NOT NULL,
  investor_relevance TEXT,
  confidence_score NUMERIC(3,2) DEFAULT 1.00,
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_confidence_range CHECK (confidence_score BETWEEN 0 AND 1)
);

-- =========================
-- INVESTMENT TABLES
-- =========================

CREATE TABLE IF NOT EXISTS investment_theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  thesis_summary TEXT NOT NULL,
  thesis_detail TEXT,
  market_reason TEXT,
  product_reason TEXT,
  traction_reason TEXT,
  timing_reason TEXT,
  investor_takeaway TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  round_name VARCHAR(80) NOT NULL,
  stage company_stage NOT NULL DEFAULT 'pre_seed',
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  pre_money_valuation NUMERIC(16,2),
  target_raise_amount NUMERIC(16,2),
  post_money_valuation NUMERIC(16,2),
  equity_offered_percent NUMERIC(5,2),
  valuation_rationale TEXT,
  round_objective TEXT,
  status VARCHAR(80) DEFAULT 'proposed',
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT investment_rounds_percentage_range CHECK (equity_offered_percent IS NULL OR equity_offered_percent BETWEEN 0 AND 100),
  CONSTRAINT investment_rounds_money_positive CHECK (
    (pre_money_valuation IS NULL OR pre_money_valuation >= 0) AND
    (target_raise_amount IS NULL OR target_raise_amount >= 0) AND
    (post_money_valuation IS NULL OR post_money_valuation >= 0)
  )
);

CREATE TABLE IF NOT EXISTS funding_use_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES investment_rounds(id) ON DELETE CASCADE,
  allocation_area VARCHAR(160) NOT NULL,
  allocation_percent NUMERIC(5,2) NOT NULL,
  estimated_amount NUMERIC(16,2),
  purpose TEXT,
  expected_impact TEXT,
  display_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT funding_allocation_percent_range CHECK (allocation_percent BETWEEN 0 AND 100),
  CONSTRAINT funding_allocation_amount_positive CHECK (estimated_amount IS NULL OR estimated_amount >= 0)
);

-- =========================
-- MARKET, PROBLEM AND SOLUTION
-- =========================

CREATE TABLE IF NOT EXISTS market_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  market_context TEXT NOT NULL,
  opportunity_summary TEXT NOT NULL,
  target_segment TEXT,
  timing_factor TEXT,
  scalability_factor TEXT,
  investor_relevance TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  problem_summary TEXT NOT NULL,
  problem_detail TEXT,
  affected_audience TEXT,
  severity_level risk_level DEFAULT 'medium',
  business_impact TEXT,
  evidence_notes TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  solution_summary TEXT NOT NULL,
  solution_detail TEXT,
  target_problem_id UUID REFERENCES market_problems(id) ON DELETE SET NULL,
  delivered_value TEXT,
  implementation_status VARCHAR(100),
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PRODUCT AND FUNCTIONALITIES
-- =========================

CREATE TABLE IF NOT EXISTS product_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  module_name VARCHAR(180) NOT NULL,
  module_slug VARCHAR(200) NOT NULL,
  module_summary TEXT NOT NULL,
  module_detail TEXT,
  user_group VARCHAR(120),
  business_value TEXT,
  status VARCHAR(80) DEFAULT 'planned_or_presented',
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_slug),
  CONSTRAINT product_module_slug_format CHECK (module_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES product_modules(id) ON DELETE SET NULL,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  feature_name VARCHAR(180) NOT NULL,
  feature_slug VARCHAR(200) NOT NULL,
  feature_summary TEXT NOT NULL,
  feature_detail TEXT,
  user_benefit TEXT,
  investor_relevance TEXT,
  status VARCHAR(80) DEFAULT 'planned_or_presented',
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, feature_slug),
  CONSTRAINT product_feature_slug_format CHECK (feature_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS traction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  metric_name VARCHAR(180) NOT NULL,
  metric_slug VARCHAR(200) NOT NULL,
  value_type metric_value_type NOT NULL,
  numeric_value NUMERIC(18,4),
  money_value NUMERIC(16,2),
  percentage_value NUMERIC(7,4),
  boolean_value BOOLEAN,
  text_value TEXT,
  unit VARCHAR(80),
  measured_at DATE,
  context TEXT,
  investor_relevance TEXT,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, metric_slug),
  CONSTRAINT traction_percentage_range CHECK (percentage_value IS NULL OR percentage_value BETWEEN 0 AND 100),
  CONSTRAINT traction_metric_slug_format CHECK (metric_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- =========================
-- BUSINESS MODEL AND GROWTH
-- =========================

CREATE TABLE IF NOT EXISTS revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  stream_name VARCHAR(180) NOT NULL,
  stream_slug VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  monetization_logic TEXT,
  maturity_stage VARCHAR(100),
  priority_level INT DEFAULT 0,
  investor_relevance TEXT,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, stream_slug),
  CONSTRAINT revenue_stream_priority_range CHECK (priority_level BETWEEN 0 AND 10),
  CONSTRAINT revenue_stream_slug_format CHECK (stream_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS growth_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  strategy_name VARCHAR(180) NOT NULL,
  strategy_summary TEXT NOT NULL,
  strategy_detail TEXT,
  channel VARCHAR(120),
  objective TEXT,
  expected_outcome TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  target_name VARCHAR(180) NOT NULL,
  period_type target_period_type NOT NULL DEFAULT 'custom',
  period_label VARCHAR(120) NOT NULL,
  target_metric VARCHAR(120) NOT NULL,
  target_value NUMERIC(18,4),
  target_unit VARCHAR(80),
  target_description TEXT,
  strategic_relevance TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- COMPETITION
-- =========================

CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  competitor_type competitor_type NOT NULL DEFAULT 'other',
  description TEXT,
  market_position TEXT,
  website_url TEXT,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug),
  CONSTRAINT competitors_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  comparison_dimension VARCHAR(160) NOT NULL,
  competitor_strength TEXT,
  competitor_weakness TEXT,
  clickpet_advantage TEXT,
  threat_level risk_level DEFAULT 'medium',
  opportunity_for_clickpet TEXT,
  strategic_note TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitive_advantages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  advantage_name VARCHAR(180) NOT NULL,
  advantage_summary TEXT NOT NULL,
  advantage_detail TEXT,
  defensibility_level risk_level DEFAULT 'medium',
  investor_relevance TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- RISKS AND FAQ
-- =========================

CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  risk_name VARCHAR(180) NOT NULL,
  risk_summary TEXT NOT NULL,
  risk_detail TEXT,
  risk_level risk_level DEFAULT 'medium',
  mitigation_strategy TEXT,
  investor_note TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investor_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES institutional_sources(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  short_answer TEXT NOT NULL,
  detailed_answer TEXT,
  category content_category NOT NULL DEFAULT 'faq',
  display_order INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, question)
);

-- =========================
-- SEARCH SUPPORT
-- =========================

CREATE MATERIALIZED VIEW IF NOT EXISTS investor_search_index AS
SELECT
  'company'::TEXT AS entity_type,
  c.id AS entity_id,
  c.company_id,
  c.title,
  c.summary AS summary,
  c.full_content AS content,
  c.tags,
  c.visibility,
  to_tsvector('portuguese', coalesce(c.title,'') || ' ' || coalesce(c.summary,'') || ' ' || coalesce(c.full_content,'')) AS search_vector
FROM content_sections c
UNION ALL
SELECT
  'knowledge_entry',
  k.id,
  k.company_id,
  k.title,
  k.answer_summary,
  k.answer_detail,
  k.tags,
  k.visibility,
  to_tsvector('portuguese', coalesce(k.title,'') || ' ' || coalesce(k.answer_summary,'') || ' ' || coalesce(k.answer_detail,'') || ' ' || coalesce(k.investor_relevance,''))
FROM knowledge_entries k
UNION ALL
SELECT
  'investor_faq',
  f.id,
  f.company_id,
  f.question,
  f.short_answer,
  coalesce(f.detailed_answer, f.short_answer),
  f.tags,
  f.visibility,
  to_tsvector('portuguese', coalesce(f.question,'') || ' ' || coalesce(f.short_answer,'') || ' ' || coalesce(f.detailed_answer,''))
FROM investor_faqs f;

CREATE UNIQUE INDEX IF NOT EXISTS investor_search_index_unique_idx
  ON investor_search_index (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS investor_search_index_vector_idx
  ON investor_search_index USING GIN (search_vector);

-- =========================
-- INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_sources_company_type ON institutional_sources(company_id, source_type);
CREATE INDEX IF NOT EXISTS idx_sections_company_category ON content_sections(company_id, category, display_order);
CREATE INDEX IF NOT EXISTS idx_sections_tags ON content_sections USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_company_category ON knowledge_entries(company_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_rounds_company_stage ON investment_rounds(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_problems_company ON market_problems(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_solutions_company ON solutions(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_modules_company ON product_modules(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_features_company_module ON product_features(company_id, module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_traction_company ON traction_metrics(company_id, metric_slug);
CREATE INDEX IF NOT EXISTS idx_revenue_company ON revenue_streams(company_id, priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_growth_targets_company ON growth_targets(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_competitors_company_type ON competitors(company_id, competitor_type);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_company ON competitor_analysis(company_id, threat_level, display_order);
CREATE INDEX IF NOT EXISTS idx_advantages_company ON competitive_advantages(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_risks_company_level ON risks(company_id, risk_level, display_order);
CREATE INDEX IF NOT EXISTS idx_faq_company_category ON investor_faqs(company_id, category, display_order);
CREATE INDEX IF NOT EXISTS idx_faq_tags ON investor_faqs USING GIN(tags);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'companies',
    'institutional_sources',
    'content_sections',
    'knowledge_entries',
    'investment_theses',
    'investment_rounds',
    'funding_use_allocations',
    'market_opportunities',
    'market_problems',
    'solutions',
    'product_modules',
    'product_features',
    'traction_metrics',
    'revenue_streams',
    'growth_strategies',
    'growth_targets',
    'competitors',
    'competitor_analysis',
    'competitive_advantages',
    'risks',
    'investor_faqs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

COMMIT;
