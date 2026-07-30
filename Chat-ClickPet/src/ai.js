const OpenAI = require("openai");

let clientInstance = null;

function getClient() {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ou GEMINI_API_KEY não foi definida no ambiente.");
  }

  clientInstance = new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.GEMINI_API_KEY ? "https://generativelanguage.googleapis.com/v1/openai/" : undefined,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
    maxRetries: OPENAI_MAX_RETRIES,
  });

  return clientInstance;
}

function getModel() {
  return process.env.OPENAI_MODEL || (process.env.GEMINI_API_KEY ? "gemini-2.5-flash" : "gpt-4.1-mini");
}

const OPENAI_TEMPERATURE = parseNumberEnv({
  value: process.env.OPENAI_TEMPERATURE,
  fallback: 0.2,
  min: 0,
  max: 2,
});

const OPENAI_MAX_OUTPUT_TOKENS = parseNumberEnv({
  value: process.env.OPENAI_MAX_OUTPUT_TOKENS,
  fallback: 700,
  min: 1,
  max: 4000,
});

const OPENAI_REQUEST_TIMEOUT_MS = parseNumberEnv({
  value: process.env.OPENAI_REQUEST_TIMEOUT_MS,
  fallback: 20000,
  min: 1000,
  max: 120000,
});

const OPENAI_MAX_RETRIES = parseNumberEnv({
  value: process.env.OPENAI_MAX_RETRIES,
  fallback: 1,
  min: 0,
  max: 5,
});

function parseNumberEnv({ value, fallback, min, max }) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed < min) {
    return min;
  }

  if (parsed > max) {
    return max;
  }

  return parsed;
}

function normalizePrompt(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} deve ser um texto não vazio.`);
  }

  return value.trim();
}

function normalizeModel(model) {
  if (typeof model !== "string" || !model.trim()) {
    return getModel();
  }

  return model.trim();
}

function normalizeTemperature(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return OPENAI_TEMPERATURE;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 2) {
    return 2;
  }

  return value;
}

function normalizeMaxOutputTokens(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return OPENAI_MAX_OUTPUT_TOKENS;
  }

  if (value < 1) {
    return 1;
  }

  if (value > 4000) {
    return 4000;
  }

  return Math.floor(value);
}

function buildTextConfig(options = {}) {
  if (options.textFormat) {
    return {
      format: options.textFormat,
    };
  }

  const textConfig = {
    format: {
      type: "text",
    },
  };

  if (typeof options.verbosity === "string" && options.verbosity.trim()) {
    textConfig.verbosity = options.verbosity.trim();
  }

  return textConfig;
}

async function callAI(systemPrompt, userPrompt, options = {}) {
  const instructions = normalizePrompt(systemPrompt, "systemPrompt");
  const input = normalizePrompt(userPrompt, "userPrompt");

  const model = normalizeModel(options.model);
  const temperature = normalizeTemperature(options.temperature);
  const maxOutputTokens = normalizeMaxOutputTokens(options.maxOutputTokens);

  const messages = [
    { role: "system", content: instructions },
    { role: "user", content: input }
  ];

  const requestParams = {
    model,
    messages,
    temperature,
    max_tokens: maxOutputTokens,
  };

  if (options.textFormat) {
    requestParams.response_format = options.textFormat;
  }

  try {
    const response = await getClient().chat.completions.create(requestParams);
    const outputText = response.choices[0]?.message?.content?.trim();

    if (!outputText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    return outputText;
  } catch (error) {
    console.error("Erro ao chamar a IA:", {
      message: error.message,
      model,
    });

    throw new Error("Falha ao gerar resposta com a IA.");
  }
}

module.exports = {
  callAI,
};