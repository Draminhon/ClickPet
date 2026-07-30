const mockData = require('./mock-data.json');

// Helper to check if a row matches search patterns
function getMatchScore(row, columns, terms) {
  if (!terms || terms.length === 0) return 1;
  
  let textToSearch = '';
  for (const col of columns) {
    const val = row[col];
    if (Array.isArray(val)) {
      textToSearch += ' ' + val.join(' ');
    } else if (val !== null && val !== undefined) {
      textToSearch += ' ' + val;
    }
  }
  textToSearch = textToSearch.toLowerCase();
  
  const matches = terms.some(term => textToSearch.includes(term));
  return matches ? 0 : 1;
}

// Convert patterns like ['%faturamento%', '%mercado%'] to clean terms
function getSearchTerms(patterns) {
  if (!Array.isArray(patterns)) return [];
  return patterns
    .map(p => {
      if (typeof p !== 'string') return '';
      return p.replace(/%/g, '').toLowerCase().trim();
    })
    .filter(Boolean);
}

// Risk level mapping for sorting
const RISK_LEVEL_ORDER = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4
};

async function query(sql, params = [], options = {}) {
  const label = options.label || '';
  
  // Resolve table names
  const companies = mockData.companies || [];
  const contentSections = mockData.content_sections || [];
  const knowledgeEntries = mockData.knowledge_entries || [];
  const investmentTheses = mockData.investment_theses || [];
  const investmentRounds = mockData.investment_rounds || [];
  const fundingAllocations = mockData.funding_use_allocations || [];
  const marketOpportunities = mockData.market_opportunities || [];
  const marketProblems = mockData.market_problems || [];
  const solutions = mockData.solutions || [];
  const productModules = mockData.product_modules || [];
  const productFeatures = mockData.product_features || [];
  const tractionMetrics = mockData.traction_metrics || [];
  const revenueStreams = mockData.revenue_streams || [];
  const growthStrategies = mockData.growth_strategies || [];
  const growthTargets = mockData.growth_targets || [];
  const competitors = mockData.competitors || [];
  const competitorAnalysis = mockData.competitor_analysis || [];
  const competitiveAdvantages = mockData.competitive_advantages || [];
  const risks = mockData.risks || [];
  const investorFaqs = mockData.investor_faqs || [];
  const sourcesList = mockData.institutional_sources || [];

  // Helper to resolve source title and type
  const withSource = (row) => {
    if (row.source_id) {
      const src = sourcesList.find(s => s.id === row.source_id);
      if (src) {
        return {
          ...row,
          source_title: src.title,
          source_type: src.source_type
        };
      }
    }
    return { ...row, source_title: null, source_type: null };
  };

  let rows = [];

  switch (label) {
    case 'context_company_overview': {
      // params = [COMPANY_SLUG, patterns]
      const slug = params[0];
      const company = companies.find(c => c.slug === slug);
      rows = company ? [company] : [];
      break;
    }
    case 'context_content_sections':
    case 'context_fallback_content_sections': {
      // params = [COMPANY_SLUG, categories, patterns, limit] OR [COMPANY_SLUG, patterns, limit]
      const categories = label === 'context_content_sections' ? params[1] : null;
      const patterns = label === 'context_content_sections' ? params[2] : params[1];
      const limit = label === 'context_content_sections' ? params[3] : params[2];
      
      const terms = getSearchTerms(patterns);
      
      let filtered = contentSections;
      if (categories) {
        filtered = filtered.filter(cs => categories.includes(cs.category));
      }
      
      rows = filtered
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'summary', 'full_content', 'tags'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0; // maintain stability
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_knowledge_entries':
    case 'context_fallback_knowledge_entries': {
      // params = [COMPANY_SLUG, categories, patterns, limit] OR [COMPANY_SLUG, patterns, limit]
      const categories = label === 'context_knowledge_entries' ? params[1] : null;
      const patterns = label === 'context_knowledge_entries' ? params[2] : params[1];
      const limit = label === 'context_knowledge_entries' ? params[3] : params[2];
      
      const terms = getSearchTerms(patterns);
      
      let filtered = knowledgeEntries;
      if (categories) {
        filtered = filtered.filter(k => categories.includes(k.category));
      }
      
      rows = filtered
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'answer_summary', 'answer_detail', 'investor_relevance', 'tags'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return (b.confidence_score || 0) - (a.confidence_score || 0);
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_investment_theses': {
      // params = [COMPANY_SLUG, patterns, limit]
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = investmentTheses
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'thesis_summary', 'thesis_detail', 'market_reason', 'product_reason', 'traction_reason', 'timing_reason', 'investor_takeaway'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_investment_rounds': {
      // params = [COMPANY_SLUG, patterns, limit]
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = investmentRounds
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['round_name', 'stage', 'currency', 'valuation_rationale', 'round_objective', 'status'], terms)
        }));
        
      rows.sort((a, b) => {
        return a.score - b.score; // In Postgres, it's: score, then created_at DESC. In seed we only have 1 round.
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_funding_use_allocations': {
      // params = [COMPANY_SLUG, patterns, limit]
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = fundingAllocations
        .map(row => {
          const round = investmentRounds.find(ir => ir.id === row.round_id);
          const withSrc = withSource(row);
          return {
            ...withSrc,
            currency: round ? round.currency : 'BRL',
            round_name: round ? round.round_name : 'Pré-Seed'
          };
        })
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['allocation_area', 'purpose', 'expected_impact', 'round_name'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_market_opportunities': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = marketOpportunities
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'market_context', 'opportunity_summary', 'target_segment', 'timing_factor', 'scalability_factor', 'investor_relevance'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_market_problems': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = marketProblems
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'problem_summary', 'problem_detail', 'affected_audience', 'business_impact', 'evidence_notes'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_solutions': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = solutions
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['title', 'solution_summary', 'solution_detail', 'delivered_value', 'implementation_status'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_product_modules': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = productModules
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['module_name', 'module_summary', 'module_detail', 'user_group', 'business_value', 'status'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_product_features': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = productFeatures
        .map(row => {
          const mod = productModules.find(m => m.id === row.module_id);
          const withSrc = withSource(row);
          return {
            ...withSrc,
            module_name: mod ? mod.module_name : ''
          };
        })
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['feature_name', 'feature_summary', 'feature_detail', 'user_benefit', 'investor_relevance', 'status', 'module_name'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_traction_metrics': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = tractionMetrics
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['metric_name', 'text_value', 'context', 'investor_relevance', 'unit'], terms)
        }));
        
      rows.sort((a, b) => {
        return a.score - b.score;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_revenue_streams': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = revenueStreams
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['stream_name', 'description', 'monetization_logic', 'maturity_stage', 'investor_relevance'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return (b.priority_level || 0) - (a.priority_level || 0);
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_growth_strategies': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = growthStrategies
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['strategy_name', 'strategy_summary', 'strategy_detail', 'channel', 'objective', 'expected_outcome'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_growth_targets': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = growthTargets
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['target_name', 'period_label', 'target_metric', 'target_unit', 'target_description', 'strategic_relevance'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_competitors': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = competitors
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['name', 'competitor_type', 'description', 'market_position'], terms)
        }));
        
      rows.sort((a, b) => {
        return a.score - b.score;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_competitor_analysis': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = competitorAnalysis
        .map(row => {
          const comp = competitors.find(c => c.id === row.competitor_id);
          const withSrc = withSource(row);
          return {
            ...withSrc,
            competitor_name: comp ? comp.name : ''
          };
        })
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['comparison_dimension', 'competitor_strength', 'competitor_weakness', 'clickpet_advantage', 'opportunity_for_clickpet', 'strategic_note', 'competitor_name'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_competitive_advantages': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = competitiveAdvantages
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['advantage_name', 'advantage_summary', 'advantage_detail', 'defensibility_level', 'investor_relevance'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_risks': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = risks
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['risk_name', 'risk_summary', 'risk_detail', 'mitigation_strategy', 'investor_note'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const levelA = RISK_LEVEL_ORDER[a.risk_level] || 5;
        const levelB = RISK_LEVEL_ORDER[b.risk_level] || 5;
        if (levelA !== levelB) return levelA - levelB;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    case 'context_investor_faqs': {
      const patterns = params[1];
      const limit = params[2];
      const terms = getSearchTerms(patterns);
      
      rows = investorFaqs
        .map(withSource)
        .map(row => ({
          ...row,
          score: getMatchScore(row, ['question', 'short_answer', 'detailed_answer', 'tags'], terms)
        }));
        
      rows.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return 0;
      });
      
      rows = rows.slice(0, limit);
      break;
    }
    default: {
      console.warn(`Unknown query label in mock DB: ${label}`);
      rows = [];
    }
  }

  return { rows };
}

async function testConnection() {
  return true;
}

async function closePool() {
  return true;
}

module.exports = {
  query,
  testConnection,
  closePool
};