import { NextResponse } from 'next/server';

// Load the Chat-ClickPet CommonJS engine
const { classifyIntent } = require('../../../../Chat-ClickPet/src/intentClassifier');
const { getContextByIntent } = require('../../../../Chat-ClickPet/src/contextRetriever');
const { generateInvestorResponse } = require('../../../../Chat-ClickPet/src/responseGenerator');

const INTENT_CONFIDENCE_THRESHOLD = Number(process.env.INTENT_CONFIDENCE_THRESHOLD || 0.7);

function normalizeMessage(message: any) {
  if (typeof message !== "string") return "";
  return message.trim().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = normalizeMessage(body?.message);
    
    console.log("[API Chat] Recebida pergunta:", message);

    if (!message) {
      console.warn("[API Chat] Pergunta vazia recebida.");
      return NextResponse.json({ error: "A pergunta é obrigatória." }, { status: 400 });
    }

    if (message.length < 3) {
      console.warn("[API Chat] Pergunta muito curta:", message);
      return NextResponse.json({ error: "A pergunta é muito curta." }, { status: 400 });
    }

    if (message.length > 1000) {
      console.warn("[API Chat] Pergunta muito longa:", message.length);
      return NextResponse.json({ error: "A pergunta é muito longa. Limite máximo: 1000 caracteres." }, { status: 400 });
    }

    // 1. Classificar intenção
    console.log("[API Chat] Classificando intenção...");
    const classification = await classifyIntent(message);
    console.log("[API Chat] Intenção classificada:", classification);
    
    const shouldUseFallback = classification.confidence < INTENT_CONFIDENCE_THRESHOLD;
    const intent = shouldUseFallback ? "faq" : classification.intent;

    // 2. Recuperar contexto
    console.log(`[API Chat] Recuperando contexto para intent "${intent}" (fallback: ${shouldUseFallback})...`);
    const contextResult = await getContextByIntent({
      intent,
      message,
      topics: classification.topics,
      forceFallback: shouldUseFallback,
    });

    const context = contextResult?.context || "";
    const sources = Array.isArray(contextResult?.sources) ? contextResult.sources : [];
    console.log(`[API Chat] Contexto recuperado (${context.length} caracteres), Fontes:`, sources);

    if (!context) {
      console.log("[API Chat] Nenhum contexto encontrado, retornando resposta padrão.");
      return NextResponse.json({
        answer: "Essa informação não está disponível na base institucional atual da ClickPet.",
        intent,
        sources: [],
      });
    }

    // 3. Gerar resposta
    console.log("[API Chat] Gerando resposta com a IA...");
    const answer = await generateInvestorResponse({
      message,
      context,
      intent,
    });
    console.log("[API Chat] Resposta gerada com sucesso!");

    return NextResponse.json({
      answer: typeof answer === "string" && answer.trim()
        ? answer.trim()
        : "Não foi possível gerar uma resposta com base na base institucional atual da ClickPet.",
      intent,
      sources,
    });
  } catch (error: any) {
    console.error("[API Chat] Erro crítico no handler /api/chat:", error);
    return NextResponse.json({ error: error?.message || "Erro interno ao processar a solicitação." }, { status: 500 });
  }
}
