-- =============================================================
-- ClickPet Institutional Database
-- Migration 002: equipe atual e conteúdo consultável pela IA
-- PostgreSQL 14+
--
-- O arquivo é idempotente: pode ser executado novamente sem
-- duplicar integrantes ou FAQs.
-- =============================================================

ALTER TYPE clickpet_institutional.content_category
ADD VALUE IF NOT EXISTS 'team';

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS clickpet_institutional;
SET search_path TO clickpet_institutional, public;

-- Interrompe a execução caso o schema principal ainda não tenha
-- sido carregado ou a empresa ClickPet não esteja cadastrada.
DO $$
BEGIN
  IF to_regclass('clickpet_institutional.companies') IS NULL THEN
    RAISE EXCEPTION
      'A tabela clickpet_institutional.companies não existe. Execute schemas.sql antes desta migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM clickpet_institutional.companies
    WHERE slug = 'clickpet'
  ) THEN
    RAISE EXCEPTION
      'A empresa com slug "clickpet" não foi encontrada. Execute seed.sql antes desta migration.';
  END IF;
END
$$;

-- =============================================================
-- TABELA DE EQUIPE
-- =============================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id UUID NOT NULL
    REFERENCES companies(id)
    ON DELETE CASCADE,

  source_id UUID
    REFERENCES institutional_sources(id)
    ON DELETE SET NULL,

  full_name VARCHAR(180) NOT NULL,
  member_slug VARCHAR(200) NOT NULL,
  role_title VARCHAR(180) NOT NULL,
  department VARCHAR(160),

  member_type VARCHAR(40) NOT NULL DEFAULT 'employee',

  short_bio TEXT,
  professional_background TEXT,
  responsibilities TEXT NOT NULL,

  expertise TEXT[] NOT NULL DEFAULT '{}',
  notable_achievements TEXT[] NOT NULL DEFAULT '{}',

  founder_market_fit TEXT,
  investor_relevance TEXT,

  linkedin_url TEXT,
  photo_url TEXT,

  joined_at DATE,
  left_at DATE,

  is_current BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,

  visibility visibility_level NOT NULL DEFAULT 'investor',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (company_id, member_slug),

  CONSTRAINT team_member_slug_format
    CHECK (member_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  CONSTRAINT team_member_type_allowed
    CHECK (
      member_type IN (
        'founder',
        'cofounder',
        'executive',
        'employee',
        'advisor',
        'contractor',
        'intern',
        'other'
      )
    ),

  CONSTRAINT team_member_dates_valid
    CHECK (
      left_at IS NULL
      OR joined_at IS NULL
      OR left_at >= joined_at
    ),

  CONSTRAINT team_member_display_order_nonnegative
    CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_team_members_company_current
  ON team_members (company_id, is_current, display_order);

CREATE INDEX IF NOT EXISTS idx_team_members_company_type
  ON team_members (company_id, member_type);

CREATE INDEX IF NOT EXISTS idx_team_members_expertise
  ON team_members USING GIN (expertise);

-- Garante que a migration funcione mesmo se a função não tiver
-- sido criada anteriormente.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON team_members;

CREATE TRIGGER trg_team_members_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- EQUIPE ATUAL DA CLICKPET
-- =============================================================

INSERT INTO team_members (
  company_id,
  source_id,
  full_name,
  member_slug,
  role_title,
  department,
  member_type,
  short_bio,
  professional_background,
  responsibilities,
  expertise,
  notable_achievements,
  founder_market_fit,
  investor_relevance,
  linkedin_url,
  photo_url,
  joined_at,
  left_at,
  is_current,
  display_order,
  visibility,
  metadata
)
SELECT
  c.id,
  NULL,
  team.full_name,
  team.member_slug,
  team.role_title,
  team.department,
  'cofounder',
  team.short_bio,
  NULL,
  team.responsibilities,
  team.expertise,
  ARRAY[]::TEXT[],
  NULL,
  team.investor_relevance,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  team.display_order,
  'investor',
  jsonb_build_object(
    'data_status', 'confirmed_by_company',
    'team_status', 'current'
  )
FROM companies c
CROSS JOIN (
  VALUES
    (
      'Luis Soares',
      'luis-soares',
      'CEO',
      'Administração e Financeiro',
      'Cofundador e CEO responsável pela liderança estratégica, visão de negócio e governança executiva da ClickPet.',
      'Liderança estratégica e visão de negócio, com foco na expansão e na governança executiva da ClickPet.',
      ARRAY[
        'Liderança estratégica',
        'Visão de negócio',
        'Expansão',
        'Governança executiva',
        'Administração',
        'Financeiro'
      ]::TEXT[],
      'Conduz a estratégia, a expansão e a governança executiva da ClickPet.',
      1
    ),
    (
      'Murilo Rodrigues',
      'murilo-rodrigues',
      'CTO',
      'Tecnologia',
      'Cofundador e CTO responsável pela arquitetura tecnológica e pela inovação escalável da ClickPet.',
      'Arquitetura tecnológica e inovação escalável, liderando o desenvolvimento de soluções disruptivas.',
      ARRAY[
        'Arquitetura tecnológica',
        'Inovação',
        'Escalabilidade',
        'Desenvolvimento de soluções',
        'Liderança técnica'
      ]::TEXT[],
      'Lidera a arquitetura tecnológica, a inovação e a capacidade de escala do produto.',
      2
    ),
    (
      'Luis Macedo',
      'luis-macedo',
      'Brand Strategist',
      'Marketing e Publicidade',
      'Cofundador e Brand Strategist responsável pela estratégia, pelo posicionamento e pela identidade do ecossistema ClickPet.',
      'Estratégia de marca e posicionamento global, construindo a identidade visual e verbal do ecossistema.',
      ARRAY[
        'Estratégia de marca',
        'Posicionamento global',
        'Identidade visual',
        'Identidade verbal',
        'Marketing',
        'Publicidade'
      ]::TEXT[],
      'Conduz o posicionamento da marca e a construção da identidade visual e verbal do ecossistema.',
      3
    )
) AS team (
  full_name,
  member_slug,
  role_title,
  department,
  short_bio,
  responsibilities,
  expertise,
  investor_relevance,
  display_order
)
WHERE c.slug = 'clickpet'
ON CONFLICT (company_id, member_slug)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_title = EXCLUDED.role_title,
  department = EXCLUDED.department,
  member_type = EXCLUDED.member_type,
  short_bio = EXCLUDED.short_bio,
  responsibilities = EXCLUDED.responsibilities,
  expertise = EXCLUDED.expertise,
  investor_relevance = EXCLUDED.investor_relevance,
  is_current = EXCLUDED.is_current,
  display_order = EXCLUDED.display_order,
  visibility = EXCLUDED.visibility,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- =============================================================
-- CONTEÚDO PARA O BACKEND ATUAL
--
-- Estes registros permitem que a equipe seja encontrada pelo
-- fallback de knowledge_entries/investor_faqs mesmo antes de o
-- contextRetriever.js ganhar um fetcher específico para team_members.
-- =============================================================

DELETE FROM knowledge_entries
WHERE company_id = (
  SELECT id FROM companies WHERE slug = 'clickpet'
)
AND title = 'Equipe atual e cofundadores da ClickPet';

INSERT INTO knowledge_entries (
  company_id,
  source_id,
  category,
  title,
  answer_summary,
  answer_detail,
  investor_relevance,
  confidence_score,
  tags,
  visibility,
  metadata
)
SELECT
  c.id,
  NULL,
  'team'::content_category,
  'Equipe atual e cofundadores da ClickPet',
  'A equipe atual é formada pelos cofundadores Luis Soares, Murilo Rodrigues e Luis Macedo.',
  'Luis Soares atua como CEO na área de Administração e Financeiro. É responsável pela liderança estratégica e visão de negócio, com foco na expansão e na governança executiva da ClickPet. Murilo Rodrigues atua como CTO no departamento de Tecnologia. É responsável pela arquitetura tecnológica e pela inovação escalável, liderando o desenvolvimento de soluções disruptivas. Luis Macedo atua como Brand Strategist na área de Marketing e Publicidade. É responsável pela estratégia de marca e pelo posicionamento global, construindo a identidade visual e verbal do ecossistema ClickPet.',
  'A composição reúne liderança executiva, tecnologia e estratégia de marca entre os três cofundadores.',
  1.00,
  ARRAY[
    'equipe',
    'time',
    'fundadores',
    'cofundadores',
    'ceo',
    'cto',
    'brand strategist',
    'liderança'
  ],
  'investor',
  jsonb_build_object(
    'data_status', 'confirmed_by_company',
    'generated_by_migration', '002_add_clickpet_team.sql'
  )
FROM companies c
WHERE c.slug = 'clickpet';

INSERT INTO investor_faqs (
  company_id,
  source_id,
  question,
  short_answer,
  detailed_answer,
  category,
  display_order,
  tags,
  visibility,
  metadata
)
SELECT
  c.id,
  NULL,
  'Quem compõe a equipe atual da ClickPet?',
  'A equipe atual é formada por Luis Soares, CEO; Murilo Rodrigues, CTO; e Luis Macedo, Brand Strategist. Os três são cofundadores.',
  'Luis Soares lidera a estratégia, a visão de negócio, a expansão e a governança executiva, atuando em Administração e Financeiro. Murilo Rodrigues lidera a arquitetura tecnológica, a inovação escalável e o desenvolvimento de soluções, atuando em Tecnologia. Luis Macedo conduz a estratégia de marca, o posicionamento global e a identidade visual e verbal do ecossistema, atuando em Marketing e Publicidade.',
  'faq',
  0,
  ARRAY[
    'equipe',
    'time',
    'fundadores',
    'cofundadores',
    'liderança',
    'ceo',
    'cto'
  ],
  'investor',
  jsonb_build_object(
    'data_status', 'confirmed_by_company',
    'generated_by_migration', '002_add_clickpet_team.sql'
  )
FROM companies c
WHERE c.slug = 'clickpet'
ON CONFLICT (company_id, question)
DO UPDATE SET
  short_answer = EXCLUDED.short_answer,
  detailed_answer = EXCLUDED.detailed_answer,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  tags = EXCLUDED.tags,
  visibility = EXCLUDED.visibility,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Atualiza o índice de busca institucional, quando ele existir.
DO $$
BEGIN
  IF to_regclass('clickpet_institutional.investor_search_index') IS NOT NULL THEN
    REFRESH MATERIALIZED VIEW clickpet_institutional.investor_search_index;
  END IF;
END
$$;

COMMIT;

-- =============================================================
-- CONSULTAS DE VERIFICAÇÃO
-- =============================================================

SELECT
  full_name,
  role_title,
  department,
  member_type,
  responsibilities,
  is_current,
  display_order
FROM clickpet_institutional.team_members
WHERE company_id = (
  SELECT id
  FROM clickpet_institutional.companies
  WHERE slug = 'clickpet'
)
ORDER BY display_order;

SELECT
  title,
  category,
  answer_summary
FROM clickpet_institutional.knowledge_entries
WHERE company_id = (
  SELECT id
  FROM clickpet_institutional.companies
  WHERE slug = 'clickpet'
)
AND title = 'Equipe atual e cofundadores da ClickPet';

SELECT
  question,
  short_answer
FROM clickpet_institutional.investor_faqs
WHERE company_id = (
  SELECT id
  FROM clickpet_institutional.companies
  WHERE slug = 'clickpet'
)
AND question = 'Quem compõe a equipe atual da ClickPet?';
