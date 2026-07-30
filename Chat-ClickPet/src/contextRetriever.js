const { query } = require("./db");

const COMPANY_SLUG = process.env.COMPANY_SLUG || "clickpet";
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 12000);
const DEFAULT_LIMIT = Number(process.env.CONTEXT_DEFAULT_LIMIT || 8);

const SCHEMA = process.env.DB_SCHEMA || "clickpet_institutional";

const INTENT_TABLES = {
  company_overview: ["companies", "content_sections", "knowledge_entries"],
  investment_thesis: ["investment_theses", "market_opportunities", "competitive_advantages", "traction_metrics",],
  investment_round: ["investment_rounds", "funding_use_allocations"],
  team: ["knowledge_entries", "investor_faqs",],
  market_opportunity: ["market_opportunities", "content_sections", "knowledge_entries",],
  problem: ["market_problems", "content_sections"],
  solution: ["solutions", "product_modules", "product_features"],
  product: ["product_modules", "product_features", "traction_metrics"],
  traction: ["traction_metrics", "product_modules", "knowledge_entries"],
  business_model: ["revenue_streams", "investment_theses", "growth_strategies"],
  growth_strategy: ["growth_strategies", "growth_targets"],
  financial_projection: ["growth_targets", "investment_rounds"],
  funding_use: ["funding_use_allocations", "investment_rounds"],
  competition: ["competitors", "competitor_analysis", "competitive_advantages",],
  competitive_advantages: ["competitive_advantages", "competitor_analysis", "investment_theses",],
  risks: ["risks", "investment_theses"],
  vision: ["content_sections", "knowledge_entries", "investment_theses"],
  faq: ["investor_faqs", "knowledge_entries"],
  unknown: ["investor_faqs", "knowledge_entries"],
};

const CONTENT_CATEGORIES_BY_INTENT = {
  company_overview: ["company", "vision"],
  investment_thesis: ["investment_thesis", "market", "traction"],
  market_opportunity: ["market"],
  problem: ["problem"],
  solution: ["solution"],
  product: ["product"],
  team: ["team"],
  traction: ["traction"],
  business_model: ["business_model"],
  growth_strategy: ["growth"],
  financial_projection: ["projection"],
  funding_use: ["funding", "valuation"],
  competition: ["competition"],
  competitive_advantages: ["competition", "investment_thesis"],
  risks: ["risk"],
  vision: ["vision"],
  faq: ["faq"],
  unknown: ["faq"],
};

function normalizeInput(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeTopics(topics) {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics
    .filter((topic) => typeof topic === "string")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function buildSearchTerms(message, topics) {
  const rawTerms = [
    ...normalizeInput(message)
      .split(" ")
      .filter((term) => term.length >= 4),
    ...normalizeTopics(topics),
  ];

  const uniqueTerms = [...new Set(rawTerms)]
    .map((term) => term.toLowerCase())
    .filter((term) => term.length >= 3)
    .slice(0, 12);

  return uniqueTerms;
}

function buildLikePatterns(searchTerms) {
  return searchTerms.map((term) => `%${term}%`);
}

function compactText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().replace(/\s+/g, " ");
}

function formatMoney(value, currency = "BRL") {
  if (value === null || value === undefined) {
    return "";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  if (currency === "BRL") {
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });
  }

  return `${currency} ${numericValue.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return `${numericValue.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatMetricValue(row) {
  if (row.value_type === "money") {
    return formatMoney(row.money_value, "BRL");
  }

  if (row.value_type === "percentage") {
    return formatPercent(row.percentage_value);
  }

  if (row.value_type === "boolean") {
    return row.boolean_value ? "Sim" : "Não";
  }

  if (row.value_type === "number") {
    const value = row.numeric_value ?? "";
    const unit = row.unit ? ` ${row.unit}` : "";
    return `${value}${unit}`.trim();
  }

  return compactText(row.text_value);
}

function buildBlock(title, rows, formatter) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "";
  }

  const lines = [`## ${title}`];

  for (const row of rows) {
    const formatted = formatter(row);

    if (formatted) {
      lines.push(formatted);
    }
  }

  return lines.join("\n");
}

function trimContext(contextText) {
  if (contextText.length <= MAX_CONTEXT_CHARS) {
    return contextText;
  }

  return `${contextText.slice(0, MAX_CONTEXT_CHARS).trim()}\n\n[Contexto truncado por limite de tamanho.]`;
}

async function fetchCompanyOverview(patterns) {
  const result = await query(
    `
    SELECT
      c.name,
      c.slogan,
      c.short_description,
      c.institutional_description,
      c.business_context,
      c.business_model_summary,
      c.target_audience,
      c.market_segment,
      c.positioning,
      c.value_proposition,
      c.current_stage,
      c.headquarters_country,
      c.website_url,
      c.app_status
    FROM ${SCHEMA}.companies c
    WHERE c.slug = $1
      AND c.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          c.name,
          c.slogan,
          c.short_description,
          c.institutional_description,
          c.business_context,
          c.business_model_summary,
          c.target_audience,
          c.market_segment,
          c.positioning,
          c.value_proposition,
          c.app_status
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END
    LIMIT 1
    `,
    [COMPANY_SLUG, patterns],
    { label: "context_company_overview" }
  );

  return buildBlock("Empresa", result.rows, (row) => {
    return [
      `Nome: ${compactText(row.name)}`,
      row.slogan ? `Slogan: ${compactText(row.slogan)}` : "",
      row.short_description
        ? `Descrição curta: ${compactText(row.short_description)}`
        : "",
      row.institutional_description
        ? `Descrição institucional: ${compactText(row.institutional_description)}`
        : "",
      row.business_context
        ? `Contexto do negócio: ${compactText(row.business_context)}`
        : "",
      row.business_model_summary
        ? `Resumo do modelo de negócio: ${compactText(row.business_model_summary)}`
        : "",
      row.target_audience
        ? `Público-alvo: ${compactText(row.target_audience)}`
        : "",
      row.market_segment
        ? `Segmento de mercado: ${compactText(row.market_segment)}`
        : "",
      row.positioning
        ? `Posicionamento: ${compactText(row.positioning)}`
        : "",
      row.value_proposition
        ? `Proposta de valor: ${compactText(row.value_proposition)}`
        : "",
      row.current_stage ? `Estágio atual: ${row.current_stage}` : "",
      row.headquarters_country
        ? `País de operação: ${compactText(row.headquarters_country)}`
        : "",
      row.app_status ? `Status do aplicativo: ${compactText(row.app_status)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchContentSections(intent, patterns) {
  const categories = CONTENT_CATEGORIES_BY_INTENT[intent] || ["faq"];

  const result = await query(
    `
    SELECT
      cs.category,
      cs.title,
      cs.summary,
      cs.full_content,
      cs.page_reference,
      cs.section_reference,
      cs.tags,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.content_sections cs
    JOIN ${SCHEMA}.companies c ON c.id = cs.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = cs.source_id
    WHERE c.slug = $1
      AND cs.visibility IN ('public', 'investor')
      AND cs.category = ANY($2::${SCHEMA}.content_category[])
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          cs.title,
          cs.summary,
          cs.full_content,
          array_to_string(cs.tags, ' ')
        ) ILIKE ANY($3::text[]) THEN 0
        ELSE 1
      END,
      cs.display_order ASC,
      cs.created_at ASC
    LIMIT $4
    `,
    [COMPANY_SLUG, categories, patterns, DEFAULT_LIMIT],
    { label: "context_content_sections" }
  );

  return buildBlock("Seções institucionais", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Categoria: ${row.category}`,
      row.summary ? `Resumo: ${compactText(row.summary)}` : "",
      row.full_content ? `Conteúdo: ${compactText(row.full_content)}` : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      row.page_reference ? `Página: ${compactText(row.page_reference)}` : "",
      row.section_reference
        ? `Seção: ${compactText(row.section_reference)}`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchKnowledgeEntries(intent, patterns) {
  const categories = CONTENT_CATEGORIES_BY_INTENT[intent] || ["faq"];

  const result = await query(
    `
    SELECT
      k.category,
      k.title,
      k.answer_summary,
      k.answer_detail,
      k.investor_relevance,
      k.confidence_score,
      k.tags,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.knowledge_entries k
    JOIN ${SCHEMA}.companies c ON c.id = k.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = k.source_id
    WHERE c.slug = $1
      AND k.visibility IN ('public', 'investor')
      AND k.category = ANY($2::${SCHEMA}.content_category[])
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          k.title,
          k.answer_summary,
          k.answer_detail,
          k.investor_relevance,
          array_to_string(k.tags, ' ')
        ) ILIKE ANY($3::text[]) THEN 0
        ELSE 1
      END,
      k.confidence_score DESC,
      k.created_at ASC
    LIMIT $4
    `,
    [COMPANY_SLUG, categories, patterns, DEFAULT_LIMIT],
    { label: "context_knowledge_entries" }
  );

  return buildBlock("Entradas de conhecimento", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Categoria: ${row.category}`,
      row.answer_summary ? `Resumo: ${compactText(row.answer_summary)}` : "",
      row.answer_detail ? `Detalhe: ${compactText(row.answer_detail)}` : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchInvestmentTheses(patterns) {
  const result = await query(
    `
    SELECT
      it.title,
      it.thesis_summary,
      it.thesis_detail,
      it.market_reason,
      it.product_reason,
      it.traction_reason,
      it.timing_reason,
      it.investor_takeaway,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.investment_theses it
    JOIN ${SCHEMA}.companies c ON c.id = it.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = it.source_id
    WHERE c.slug = $1
      AND it.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          it.title,
          it.thesis_summary,
          it.thesis_detail,
          it.market_reason,
          it.product_reason,
          it.traction_reason,
          it.timing_reason,
          it.investor_takeaway
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      it.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_investment_theses" }
  );

  return buildBlock("Tese de investimento", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Resumo: ${compactText(row.thesis_summary)}`,
      row.thesis_detail ? `Detalhe: ${compactText(row.thesis_detail)}` : "",
      row.market_reason
        ? `Razão de mercado: ${compactText(row.market_reason)}`
        : "",
      row.product_reason
        ? `Razão de produto: ${compactText(row.product_reason)}`
        : "",
      row.traction_reason
        ? `Razão de tração: ${compactText(row.traction_reason)}`
        : "",
      row.timing_reason
        ? `Razão de timing: ${compactText(row.timing_reason)}`
        : "",
      row.investor_takeaway
        ? `Takeaway para investidores: ${compactText(row.investor_takeaway)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchFallbackKnowledgeEntries(patterns) {
  const result = await query(
    `
    SELECT
      k.category,
      k.title,
      k.answer_summary,
      k.answer_detail,
      k.investor_relevance,
      k.confidence_score,
      k.tags,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.knowledge_entries k
    JOIN ${SCHEMA}.companies c ON c.id = k.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = k.source_id
    WHERE c.slug = $1
      AND k.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          k.title,
          k.answer_summary,
          k.answer_detail,
          k.investor_relevance,
          array_to_string(k.tags, ' ')
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      k.confidence_score DESC,
      k.created_at ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_fallback_knowledge_entries" }
  );

  return buildBlock("Entradas de conhecimento", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Categoria: ${row.category}`,
      row.answer_summary ? `Resumo: ${compactText(row.answer_summary)}` : "",
      row.answer_detail ? `Detalhe: ${compactText(row.answer_detail)}` : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchInvestmentRounds(patterns) {
  const result = await query(
    `
    SELECT
      ir.round_name,
      ir.stage,
      ir.currency,
      ir.pre_money_valuation,
      ir.target_raise_amount,
      ir.post_money_valuation,
      ir.equity_offered_percent,
      ir.valuation_rationale,
      ir.round_objective,
      ir.status,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.investment_rounds ir
    JOIN ${SCHEMA}.companies c ON c.id = ir.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = ir.source_id
    WHERE c.slug = $1
      AND ir.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          ir.round_name,
          ir.stage,
          ir.currency,
          ir.valuation_rationale,
          ir.round_objective,
          ir.status
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      ir.created_at DESC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_investment_rounds" }
  );

  return buildBlock("Rodada e valuation", result.rows, (row) => {
    return [
      `Rodada: ${compactText(row.round_name)}`,
      `Estágio: ${row.stage}`,
      `Status: ${compactText(row.status)}`,
      row.pre_money_valuation !== null
        ? `Valuation pré-money: ${formatMoney(row.pre_money_valuation, row.currency)}`
        : "",
      row.target_raise_amount !== null
        ? `Captação pretendida: ${formatMoney(row.target_raise_amount, row.currency)}`
        : "",
      row.post_money_valuation !== null
        ? `Valuation pós-money: ${formatMoney(row.post_money_valuation, row.currency)}`
        : "",
      row.equity_offered_percent !== null
        ? `Participação ofertada: ${formatPercent(row.equity_offered_percent)}`
        : "",
      row.valuation_rationale
        ? `Racional do valuation: ${compactText(row.valuation_rationale)}`
        : "",
      row.round_objective
        ? `Objetivo da rodada: ${compactText(row.round_objective)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchFundingUseAllocations(patterns) {
  const result = await query(
    `
    SELECT
      fua.allocation_area,
      fua.allocation_percent,
      fua.estimated_amount,
      fua.purpose,
      fua.expected_impact,
      ir.currency,
      ir.round_name,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.funding_use_allocations fua
    JOIN ${SCHEMA}.investment_rounds ir ON ir.id = fua.round_id
    JOIN ${SCHEMA}.companies c ON c.id = ir.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = ir.source_id
    WHERE c.slug = $1
      AND ir.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          fua.allocation_area,
          fua.purpose,
          fua.expected_impact,
          ir.round_name
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      fua.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_funding_use_allocations" }
  );

  return buildBlock("Uso dos recursos", result.rows, (row) => {
    return [
      `Área: ${compactText(row.allocation_area)}`,
      `Percentual: ${formatPercent(row.allocation_percent)}`,
      row.estimated_amount !== null
        ? `Valor estimado: ${formatMoney(row.estimated_amount, row.currency)}`
        : "",
      row.purpose ? `Finalidade: ${compactText(row.purpose)}` : "",
      row.expected_impact
        ? `Impacto esperado: ${compactText(row.expected_impact)}`
        : "",
      `Rodada vinculada: ${compactText(row.round_name)}`,
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchMarketOpportunities(patterns) {
  const result = await query(
    `
    SELECT
      mo.title,
      mo.market_context,
      mo.opportunity_summary,
      mo.target_segment,
      mo.timing_factor,
      mo.scalability_factor,
      mo.investor_relevance,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.market_opportunities mo
    JOIN ${SCHEMA}.companies c ON c.id = mo.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = mo.source_id
    WHERE c.slug = $1
      AND mo.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          mo.title,
          mo.market_context,
          mo.opportunity_summary,
          mo.target_segment,
          mo.timing_factor,
          mo.scalability_factor,
          mo.investor_relevance
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      mo.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_market_opportunities" }
  );

  return buildBlock("Oportunidade de mercado", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Contexto de mercado: ${compactText(row.market_context)}`,
      `Oportunidade: ${compactText(row.opportunity_summary)}`,
      row.target_segment
        ? `Segmento-alvo: ${compactText(row.target_segment)}`
        : "",
      row.timing_factor
        ? `Fator de timing: ${compactText(row.timing_factor)}`
        : "",
      row.scalability_factor
        ? `Fator de escala: ${compactText(row.scalability_factor)}`
        : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchMarketProblems(patterns) {
  const result = await query(
    `
    SELECT
      mp.title,
      mp.problem_summary,
      mp.problem_detail,
      mp.affected_audience,
      mp.severity_level,
      mp.business_impact,
      mp.evidence_notes,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.market_problems mp
    JOIN ${SCHEMA}.companies c ON c.id = mp.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = mp.source_id
    WHERE c.slug = $1
      AND mp.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          mp.title,
          mp.problem_summary,
          mp.problem_detail,
          mp.affected_audience,
          mp.business_impact,
          mp.evidence_notes
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      mp.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_market_problems" }
  );

  return buildBlock("Problemas de mercado", result.rows, (row) => {
    return [
      `Problema: ${compactText(row.title)}`,
      `Resumo: ${compactText(row.problem_summary)}`,
      row.problem_detail ? `Detalhe: ${compactText(row.problem_detail)}` : "",
      row.affected_audience
        ? `Público afetado: ${compactText(row.affected_audience)}`
        : "",
      row.severity_level ? `Severidade: ${row.severity_level}` : "",
      row.business_impact
        ? `Impacto no negócio: ${compactText(row.business_impact)}`
        : "",
      row.evidence_notes
        ? `Evidências/observações: ${compactText(row.evidence_notes)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchSolutions(patterns) {
  const result = await query(
    `
    SELECT
      sol.title,
      sol.solution_summary,
      sol.solution_detail,
      sol.delivered_value,
      sol.implementation_status,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.solutions sol
    JOIN ${SCHEMA}.companies c ON c.id = sol.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = sol.source_id
    WHERE c.slug = $1
      AND sol.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          sol.title,
          sol.solution_summary,
          sol.solution_detail,
          sol.delivered_value,
          sol.implementation_status
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      sol.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_solutions" }
  );

  return buildBlock("Solução", result.rows, (row) => {
    return [
      `Solução: ${compactText(row.title)}`,
      `Resumo: ${compactText(row.solution_summary)}`,
      row.solution_detail ? `Detalhe: ${compactText(row.solution_detail)}` : "",
      row.delivered_value
        ? `Valor entregue: ${compactText(row.delivered_value)}`
        : "",
      row.implementation_status
        ? `Status de implementação: ${compactText(row.implementation_status)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchProductModules(patterns) {
  const result = await query(
    `
    SELECT
      pm.module_name,
      pm.module_summary,
      pm.module_detail,
      pm.user_group,
      pm.business_value,
      pm.status,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.product_modules pm
    JOIN ${SCHEMA}.companies c ON c.id = pm.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = pm.source_id
    WHERE c.slug = $1
      AND pm.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          pm.module_name,
          pm.module_summary,
          pm.module_detail,
          pm.user_group,
          pm.business_value,
          pm.status
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      pm.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_product_modules" }
  );

  return buildBlock("Módulos do produto", result.rows, (row) => {
    return [
      `Módulo: ${compactText(row.module_name)}`,
      `Resumo: ${compactText(row.module_summary)}`,
      row.module_detail ? `Detalhe: ${compactText(row.module_detail)}` : "",
      row.user_group ? `Usuário-alvo: ${compactText(row.user_group)}` : "",
      row.business_value
        ? `Valor de negócio: ${compactText(row.business_value)}`
        : "",
      row.status ? `Status: ${compactText(row.status)}` : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchProductFeatures(patterns) {
  const result = await query(
    `
    SELECT
      pf.feature_name,
      pf.feature_summary,
      pf.feature_detail,
      pf.user_benefit,
      pf.investor_relevance,
      pf.status,
      pm.module_name,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.product_features pf
    JOIN ${SCHEMA}.companies c ON c.id = pf.company_id
    LEFT JOIN ${SCHEMA}.product_modules pm ON pm.id = pf.module_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = pf.source_id
    WHERE c.slug = $1
      AND pf.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          pf.feature_name,
          pf.feature_summary,
          pf.feature_detail,
          pf.user_benefit,
          pf.investor_relevance,
          pf.status,
          pm.module_name
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      pf.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_product_features" }
  );

  return buildBlock("Funcionalidades do produto", result.rows, (row) => {
    return [
      `Funcionalidade: ${compactText(row.feature_name)}`,
      row.module_name ? `Módulo: ${compactText(row.module_name)}` : "",
      `Resumo: ${compactText(row.feature_summary)}`,
      row.feature_detail ? `Detalhe: ${compactText(row.feature_detail)}` : "",
      row.user_benefit
        ? `Benefício para o usuário: ${compactText(row.user_benefit)}`
        : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.status ? `Status: ${compactText(row.status)}` : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchTractionMetrics(patterns) {
  const result = await query(
    `
    SELECT
      tm.metric_name,
      tm.value_type,
      tm.numeric_value,
      tm.money_value,
      tm.percentage_value,
      tm.boolean_value,
      tm.text_value,
      tm.unit,
      tm.measured_at,
      tm.context,
      tm.investor_relevance,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.traction_metrics tm
    JOIN ${SCHEMA}.companies c ON c.id = tm.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = tm.source_id
    WHERE c.slug = $1
      AND tm.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          tm.metric_name,
          tm.text_value,
          tm.context,
          tm.investor_relevance,
          tm.unit
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      tm.created_at ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_traction_metrics" }
  );

  return buildBlock("Tração e evidências de execução", result.rows, (row) => {
    return [
      `Métrica: ${compactText(row.metric_name)}`,
      `Valor: ${formatMetricValue(row)}`,
      row.measured_at ? `Data de referência: ${row.measured_at}` : "",
      row.context ? `Contexto: ${compactText(row.context)}` : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchRevenueStreams(patterns) {
  const result = await query(
    `
    SELECT
      rs.stream_name,
      rs.description,
      rs.monetization_logic,
      rs.maturity_stage,
      rs.priority_level,
      rs.investor_relevance,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.revenue_streams rs
    JOIN ${SCHEMA}.companies c ON c.id = rs.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = rs.source_id
    WHERE c.slug = $1
      AND rs.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          rs.stream_name,
          rs.description,
          rs.monetization_logic,
          rs.maturity_stage,
          rs.investor_relevance
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      rs.priority_level DESC,
      rs.created_at ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_revenue_streams" }
  );

  return buildBlock("Modelo de negócio e monetização", result.rows, (row) => {
    return [
      `Fonte de receita: ${compactText(row.stream_name)}`,
      `Descrição: ${compactText(row.description)}`,
      row.monetization_logic
        ? `Lógica de monetização: ${compactText(row.monetization_logic)}`
        : "",
      row.maturity_stage
        ? `Estágio de maturidade: ${compactText(row.maturity_stage)}`
        : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchGrowthStrategies(patterns) {
  const result = await query(
    `
    SELECT
      gs.strategy_name,
      gs.strategy_summary,
      gs.strategy_detail,
      gs.channel,
      gs.objective,
      gs.expected_outcome,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.growth_strategies gs
    JOIN ${SCHEMA}.companies c ON c.id = gs.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = gs.source_id
    WHERE c.slug = $1
      AND gs.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          gs.strategy_name,
          gs.strategy_summary,
          gs.strategy_detail,
          gs.channel,
          gs.objective,
          gs.expected_outcome
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      gs.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_growth_strategies" }
  );

  return buildBlock("Estratégia de crescimento", result.rows, (row) => {
    return [
      `Estratégia: ${compactText(row.strategy_name)}`,
      `Resumo: ${compactText(row.strategy_summary)}`,
      row.strategy_detail ? `Detalhe: ${compactText(row.strategy_detail)}` : "",
      row.channel ? `Canal: ${compactText(row.channel)}` : "",
      row.objective ? `Objetivo: ${compactText(row.objective)}` : "",
      row.expected_outcome
        ? `Resultado esperado: ${compactText(row.expected_outcome)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchGrowthTargets(patterns) {
  const result = await query(
    `
    SELECT
      gt.target_name,
      gt.period_type,
      gt.period_label,
      gt.target_metric,
      gt.target_value,
      gt.target_unit,
      gt.target_description,
      gt.strategic_relevance,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.growth_targets gt
    JOIN ${SCHEMA}.companies c ON c.id = gt.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = gt.source_id
    WHERE c.slug = $1
      AND gt.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          gt.target_name,
          gt.period_label,
          gt.target_metric,
          gt.target_unit,
          gt.target_description,
          gt.strategic_relevance
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      gt.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_growth_targets" }
  );

  return buildBlock("Projeções e metas", result.rows, (row) => {
    return [
      `Meta: ${compactText(row.target_name)}`,
      `Período: ${compactText(row.period_label)} (${row.period_type})`,
      `Métrica: ${compactText(row.target_metric)}`,
      row.target_value !== null
        ? `Valor-alvo: ${row.target_value} ${compactText(row.target_unit)}`
        : "",
      row.target_description
        ? `Descrição: ${compactText(row.target_description)}`
        : "",
      row.strategic_relevance
        ? `Relevância estratégica: ${compactText(row.strategic_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchCompetitors(patterns) {
  const result = await query(
    `
    SELECT
      comp.name,
      comp.competitor_type,
      comp.description,
      comp.market_position,
      comp.website_url,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.competitors comp
    JOIN ${SCHEMA}.companies c ON c.id = comp.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = comp.source_id
    WHERE c.slug = $1
      AND comp.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          comp.name,
          comp.competitor_type,
          comp.description,
          comp.market_position
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      comp.created_at ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_competitors" }
  );

  return buildBlock("Concorrentes", result.rows, (row) => {
    return [
      `Concorrente: ${compactText(row.name)}`,
      `Tipo: ${row.competitor_type}`,
      row.description ? `Descrição: ${compactText(row.description)}` : "",
      row.market_position
        ? `Posição de mercado: ${compactText(row.market_position)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchCompetitorAnalysis(patterns) {
  const result = await query(
    `
    SELECT
      ca.comparison_dimension,
      ca.competitor_strength,
      ca.competitor_weakness,
      ca.clickpet_advantage,
      ca.threat_level,
      ca.opportunity_for_clickpet,
      ca.strategic_note,
      comp.name AS competitor_name,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.competitor_analysis ca
    JOIN ${SCHEMA}.companies c ON c.id = ca.company_id
    LEFT JOIN ${SCHEMA}.competitors comp ON comp.id = ca.competitor_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = ca.source_id
    WHERE c.slug = $1
      AND ca.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          ca.comparison_dimension,
          ca.competitor_strength,
          ca.competitor_weakness,
          ca.clickpet_advantage,
          ca.opportunity_for_clickpet,
          ca.strategic_note,
          comp.name
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      ca.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_competitor_analysis" }
  );

  return buildBlock("Análise competitiva", result.rows, (row) => {
    return [
      row.competitor_name
        ? `Concorrente: ${compactText(row.competitor_name)}`
        : "",
      `Dimensão: ${compactText(row.comparison_dimension)}`,
      row.competitor_strength
        ? `Força do concorrente: ${compactText(row.competitor_strength)}`
        : "",
      row.competitor_weakness
        ? `Limitação do concorrente: ${compactText(row.competitor_weakness)}`
        : "",
      row.clickpet_advantage
        ? `Vantagem da ClickPet: ${compactText(row.clickpet_advantage)}`
        : "",
      row.threat_level ? `Nível de ameaça: ${row.threat_level}` : "",
      row.opportunity_for_clickpet
        ? `Oportunidade para a ClickPet: ${compactText(row.opportunity_for_clickpet)}`
        : "",
      row.strategic_note
        ? `Nota estratégica: ${compactText(row.strategic_note)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchCompetitiveAdvantages(patterns) {
  const result = await query(
    `
    SELECT
      ca.advantage_name,
      ca.advantage_summary,
      ca.advantage_detail,
      ca.defensibility_level,
      ca.investor_relevance,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.competitive_advantages ca
    JOIN ${SCHEMA}.companies c ON c.id = ca.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = ca.source_id
    WHERE c.slug = $1
      AND ca.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          ca.advantage_name,
          ca.advantage_summary,
          ca.advantage_detail,
          ca.defensibility_level,
          ca.investor_relevance
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      ca.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_competitive_advantages" }
  );

  return buildBlock("Diferenciais competitivos", result.rows, (row) => {
    return [
      `Diferencial: ${compactText(row.advantage_name)}`,
      `Resumo: ${compactText(row.advantage_summary)}`,
      row.advantage_detail
        ? `Detalhe: ${compactText(row.advantage_detail)}`
        : "",
      row.defensibility_level
        ? `Nível de defensibilidade: ${row.defensibility_level}`
        : "",
      row.investor_relevance
        ? `Relevância para investidores: ${compactText(row.investor_relevance)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchRisks(patterns) {
  const result = await query(
    `
    SELECT
      r.risk_name,
      r.risk_summary,
      r.risk_detail,
      r.risk_level,
      r.mitigation_strategy,
      r.investor_note,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.risks r
    JOIN ${SCHEMA}.companies c ON c.id = r.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = r.source_id
    WHERE c.slug = $1
      AND r.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          r.risk_name,
          r.risk_summary,
          r.risk_detail,
          r.mitigation_strategy,
          r.investor_note
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      CASE r.risk_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      r.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_risks" }
  );

  return buildBlock("Riscos e mitigação", result.rows, (row) => {
    return [
      `Risco: ${compactText(row.risk_name)}`,
      `Resumo: ${compactText(row.risk_summary)}`,
      row.risk_detail ? `Detalhe: ${compactText(row.risk_detail)}` : "",
      row.risk_level ? `Nível: ${row.risk_level}` : "",
      row.mitigation_strategy
        ? `Mitigação: ${compactText(row.mitigation_strategy)}`
        : "",
      row.investor_note
        ? `Nota para investidores: ${compactText(row.investor_note)}`
        : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function fetchInvestorFaqs(patterns) {
  const result = await query(
    `
    SELECT
      f.question,
      f.short_answer,
      f.detailed_answer,
      f.category,
      f.tags,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.investor_faqs f
    JOIN ${SCHEMA}.companies c ON c.id = f.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = f.source_id
    WHERE c.slug = $1
      AND f.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          f.question,
          f.short_answer,
          f.detailed_answer,
          array_to_string(f.tags, ' ')
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      f.display_order ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_investor_faqs" }
  );

  return buildBlock("FAQ para investidores", result.rows, (row) => {
    return [
      `Pergunta: ${compactText(row.question)}`,
      `Resposta curta: ${compactText(row.short_answer)}`,
      row.detailed_answer
        ? `Resposta detalhada: ${compactText(row.detailed_answer)}`
        : "",
      `Categoria: ${row.category}`,
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

const TABLE_FETCHERS = {
  companies: fetchCompanyOverview,
  content_sections: fetchContentSections,
  knowledge_entries: fetchKnowledgeEntries,
  investment_theses: fetchInvestmentTheses,
  investment_rounds: fetchInvestmentRounds,
  funding_use_allocations: fetchFundingUseAllocations,
  market_opportunities: fetchMarketOpportunities,
  market_problems: fetchMarketProblems,
  solutions: fetchSolutions,
  product_modules: fetchProductModules,
  product_features: fetchProductFeatures,
  traction_metrics: fetchTractionMetrics,
  revenue_streams: fetchRevenueStreams,
  growth_strategies: fetchGrowthStrategies,
  growth_targets: fetchGrowthTargets,
  competitors: fetchCompetitors,
  competitor_analysis: fetchCompetitorAnalysis,
  competitive_advantages: fetchCompetitiveAdvantages,
  risks: fetchRisks,
  investor_faqs: fetchInvestorFaqs,
};

async function fetchFallbackContentSections(patterns) {
  const result = await query(
    `
    SELECT
      cs.category,
      cs.title,
      cs.summary,
      cs.full_content,
      cs.page_reference,
      cs.section_reference,
      cs.tags,
      s.title AS source_title,
      s.source_type
    FROM ${SCHEMA}.content_sections cs
    JOIN ${SCHEMA}.companies c ON c.id = cs.company_id
    LEFT JOIN ${SCHEMA}.institutional_sources s ON s.id = cs.source_id
    WHERE c.slug = $1
      AND cs.visibility IN ('public', 'investor')
    ORDER BY
      CASE
        WHEN concat_ws(' ',
          cs.title,
          cs.summary,
          cs.full_content,
          array_to_string(cs.tags, ' ')
        ) ILIKE ANY($2::text[]) THEN 0
        ELSE 1
      END,
      cs.display_order ASC,
      cs.created_at ASC
    LIMIT $3
    `,
    [COMPANY_SLUG, patterns, DEFAULT_LIMIT],
    { label: "context_fallback_content_sections" }
  );

  return buildBlock("Seções institucionais", result.rows, (row) => {
    return [
      `Título: ${compactText(row.title)}`,
      `Categoria: ${row.category}`,
      row.summary ? `Resumo: ${compactText(row.summary)}` : "",
      row.full_content ? `Conteúdo: ${compactText(row.full_content)}` : "",
      row.source_title
        ? `Fonte: ${compactText(row.source_title)} (${row.source_type})`
        : "",
      row.page_reference ? `Página: ${compactText(row.page_reference)}` : "",
      row.section_reference
        ? `Seção: ${compactText(row.section_reference)}`
        : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

async function getFallbackContext(intent, patterns, attemptedTables = []) {
  const fallbackBlocks = [];
  const fallbackSources = [];
  const attempted = new Set(attemptedTables);

  if (!attempted.has("investor_faqs")) {
    const faqBlock = await fetchInvestorFaqs(patterns);

    if (faqBlock) {
      fallbackBlocks.push(faqBlock);
      fallbackSources.push("investor_faqs");
    }
  }

  if (!attempted.has("knowledge_entries")) {
    const knowledgeBlock = await fetchFallbackKnowledgeEntries(patterns);

    if (knowledgeBlock) {
      fallbackBlocks.push(knowledgeBlock);
      fallbackSources.push("knowledge_entries");
    }
  }

  if (!attempted.has("content_sections")) {
    const contentBlock = await fetchFallbackContentSections(patterns);

    if (contentBlock) {
      fallbackBlocks.push(contentBlock);
      fallbackSources.push("content_sections");
    }
  }

  return {
    blocks: fallbackBlocks,
    sources: fallbackSources,
  };
}

async function getContextByIntent({
  intent,
  message,
  topics,
  forceFallback = false,
}) {
  const normalizedIntent = INTENT_TABLES[intent] ? intent : "unknown";
  const searchTerms = buildSearchTerms(message, topics);
  const patterns = buildLikePatterns(searchTerms);

  if (forceFallback) {
    const fallback = await getFallbackContext(normalizedIntent, patterns, []);

    const contextText = trimContext(fallback.blocks.join("\n\n"));

    return {
      context: contextText,
      contextText,
      sources: [...new Set(fallback.sources)],
    };
  }

  const tables = INTENT_TABLES[normalizedIntent] || INTENT_TABLES.unknown;

  const contextBlocks = [];
  const sources = [];

  for (const tableName of tables) {
    const fetcher = TABLE_FETCHERS[tableName];

    if (!fetcher) {
      continue;
    }

    const block =
      tableName === "content_sections" || tableName === "knowledge_entries"
        ? await fetcher(normalizedIntent, patterns)
        : await fetcher(patterns);

    if (block) {
      contextBlocks.push(block);
      sources.push(tableName);
    }
  }

if (contextBlocks.length === 0) {
  const fallback = await getFallbackContext(
    normalizedIntent,
    patterns,
    []
  );

  contextBlocks.push(...fallback.blocks);
  sources.push(...fallback.sources);
}

  const contextText = trimContext(contextBlocks.join("\n\n"));

  return {
    context: contextText,
    contextText,
    sources: [...new Set(sources)],
  };
}

module.exports = {
  getContextByIntent,
};