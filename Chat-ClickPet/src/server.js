const dotenv = require("dotenv");

dotenv.config({
  quiet: true,
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { classifyIntent } = require("./intentClassifier");
const { getContextByIntent } = require("./contextRetriever");
const { generateInvestorResponse } = require("./responseGenerator");
const { closePool } = require("./db");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const CHAT_TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS || 25000);

const INTENT_CONFIDENCE_THRESHOLD = Number(
  process.env.INTENT_CONFIDENCE_THRESHOLD || 0.7
);

const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 60000
);

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 20);

function normalizeOrigin(origin) {
  if (typeof origin !== "string") {
    return "";
  }

  return origin.trim().replace(/\/+$/, "");
}

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean)
);

const LOCAL_DEVELOPMENT_ORIGIN =
  /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

const ALLOWED_INTENTS = new Set([
  "company_overview",
  "investment_thesis",
  "investment_round",
  "market_opportunity",
  "problem",
  "solution",
  "product",
  "team",
  "traction",
  "business_model",
  "growth_strategy",
  "financial_projection",
  "funding_use",
  "competition",
  "competitive_advantages",
  "risks",
  "vision",
  "faq",
  "unknown",
]);

if (!DATABASE_URL) {
  console.warn("Aviso: DATABASE_URL não foi definida no arquivo .env");
}

if (!OPENAI_API_KEY) {
  console.warn("Aviso: OPENAI_API_KEY não foi definida no arquivo .env");
}

if (ALLOWED_ORIGINS.size === 0) {
  console.warn(
    "Aviso: ALLOWED_ORIGINS não foi definida. Configure o domínio do frontend antes da publicação."
  );
}

function isOriginAllowed(origin) {
  // Postman, curl e algumas chamadas internas não enviam Origin.
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (ALLOWED_ORIGINS.has(normalizedOrigin)) {
    return true;
  }

  // Em desenvolvimento, permite localhost e 127.0.0.1,
  // independentemente da porta utilizada pelo Live Server.
  if (
    !IS_PRODUCTION &&
    LOCAL_DEVELOPMENT_ORIGIN.test(normalizedOrigin)
  ) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.error("Origem bloqueada pelo CORS:", {
      receivedOrigin: origin,
      allowedOrigins: Array.from(ALLOWED_ORIGINS),
      environment: NODE_ENV,
    });

    const error = new Error("Origem não permitida pelo CORS.");
    error.code = "CORS_ORIGIN_DENIED";

    return callback(error);
  },

  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

function withTimeout(promise, timeoutMs, operationName) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(`Tempo limite excedido na operação: ${operationName}`)
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function normalizeMessage(message) {
  if (typeof message !== "string") {
    return "";
  }

  return message.trim().replace(/\s+/g, " ");
}

function normalizeClassification(classification) {
  if (!classification || typeof classification !== "object") {
    return {
      intent: "unknown",
      topics: [],
      confidence: 0,
    };
  }

  const intent = ALLOWED_INTENTS.has(classification.intent)
    ? classification.intent
    : "unknown";

  const topics = Array.isArray(classification.topics)
    ? classification.topics
        .filter((topic) => typeof topic === "string")
        .map((topic) => topic.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const rawConfidence = Number(classification.confidence);

  const confidence = Number.isFinite(rawConfidence)
    ? Math.min(Math.max(rawConfidence, 0), 1)
    : 0;

  return {
    intent,
    topics,
    confidence,
  };
}

function extractContext(contextResult) {
  if (typeof contextResult?.contextText === "string") {
    return contextResult.contextText.trim();
  }

  if (typeof contextResult?.context === "string") {
    return contextResult.context.trim();
  }

  return "";
}

app.disable("x-powered-by");

app.use(helmet());
app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "10kb",
  })
);

const chatRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Muitas solicitações foram feitas em pouco tempo. Tente novamente em alguns instantes.",
  },
});

app.get("/", (req, res) => {
  return res.json({
    message: "ClickPet Investor Assistant API está rodando.",
  });
});

app.get("/api/health", (req, res) => {
  return res.json({
    status: "ok",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/chat", chatRateLimiter, async (req, res, next) => {
  try {
    const message = normalizeMessage(req.body?.message);

    if (!message) {
      return res.status(400).json({
        error: "A pergunta é obrigatória.",
      });
    }

    if (message.length < 3) {
      return res.status(400).json({
        error: "A pergunta é muito curta.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: "A pergunta é muito longa. Limite máximo: 1000 caracteres.",
      });
    }

    const rawClassification = await withTimeout(
      classifyIntent(message),
      CHAT_TIMEOUT_MS,
      "classifyIntent"
    );

    const classification = normalizeClassification(rawClassification);

    const shouldUseFallback =
      classification.confidence < INTENT_CONFIDENCE_THRESHOLD;

    const intent = shouldUseFallback
      ? "faq"
      : classification.intent;

    const contextResult = await withTimeout(
      getContextByIntent({
        intent,
        message,
        topics: classification.topics,
        forceFallback: shouldUseFallback,
      }),
      CHAT_TIMEOUT_MS,
      "getContextByIntent"
    );

    const context = extractContext(contextResult);

    const sources = Array.isArray(contextResult?.sources)
      ? contextResult.sources
      : [];

    if (!context) {
      return res.json({
        answer:
          "Essa informação não está disponível na base institucional atual da ClickPet.",
        intent,
        sources: [],
      });
    }

    const answer = await withTimeout(
      generateInvestorResponse({
        message,
        context,
        intent,
      }),
      CHAT_TIMEOUT_MS,
      "generateInvestorResponse"
    );

    return res.json({
      answer:
        typeof answer === "string" && answer.trim()
          ? answer.trim()
          : "Não foi possível gerar uma resposta com base na base institucional atual da ClickPet.",
      intent,
      sources,
    });
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada.",
  });
});

app.use((error, req, res, next) => {
  const errorMessage =
    error instanceof Error && error.message
      ? error.message
      : "Erro sem mensagem principal.";

  console.error("Erro interno:", {
    name: error?.name,
    message: errorMessage,
    code: error?.code,
    method: req.method,
    path: req.originalUrl,
  });

  if (
    error?.code === "CORS_ORIGIN_DENIED" ||
    errorMessage === "Origem não permitida pelo CORS."
  ) {
    return res.status(403).json({
      error: "Origem não permitida.",
    });
  }

  if (errorMessage.startsWith("Tempo limite excedido")) {
    return res.status(504).json({
      error:
        "A solicitação demorou mais do que o esperado. Tente novamente em alguns instantes.",
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "O corpo da solicitação contém JSON inválido.",
    });
  }

  return res.status(500).json({
    error: "Erro interno ao processar a solicitação.",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${NODE_ENV}`);
  console.log(
    "Origens configuradas:",
    Array.from(ALLOWED_ORIGINS)
  );
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Recebido ${signal}. Encerrando servidor...`);

  server.close(async () => {
    try {
      await closePool();

      console.log("Servidor encerrado com sucesso.");
      process.exit(0);
    } catch (error) {
      console.error("Erro durante encerramento:", {
        message: error?.message || "Erro sem mensagem.",
      });

      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Promise rejeitada sem tratamento:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Exceção não capturada:", {
    message: error?.message || "Erro sem mensagem.",
    stack: error?.stack,
  });

  process.exit(1);
});