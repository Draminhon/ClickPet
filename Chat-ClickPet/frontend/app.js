const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api/chat"
    : "/api/chat";

const emptyState = document.getElementById("emptyState");
const conversationState = document.getElementById("conversationState");
const messagesContainer = document.getElementById("messages");

const initialForm = document.getElementById("initialForm");
const chatForm = document.getElementById("chatForm");

const initialMessageInput = document.getElementById("initialMessageInput");
const chatMessageInput = document.getElementById("chatMessageInput");

const userMessageTemplate = document.getElementById("userMessageTemplate");
const assistantMessageTemplate = document.getElementById(
  "assistantMessageTemplate"
);
const loadingMessageTemplate = document.getElementById("loadingMessageTemplate");

let isSubmitting = false;

const SOURCE_LABELS = {
  companies: "Empresa",
  content_sections: "Seções institucionais",
  knowledge_entries: "Base de conhecimento",
  investment_theses: "Tese de investimento",
  investment_rounds: "Rodada de investimento",
  funding_use_allocations: "Uso dos recursos",
  market_opportunities: "Oportunidade de mercado",
  market_problems: "Problemas de mercado",
  solutions: "Solução",
  product_modules: "Produto",
  product_features: "Funcionalidades",
  team_members: "Equipe atual",
  traction_metrics: "Tração",
  revenue_streams: "Modelo de receita",
  growth_strategies: "Estratégia de crescimento",
  growth_targets: "Metas e projeções",
  competitors: "Concorrentes",
  competitor_analysis: "Análise competitiva",
  competitive_advantages: "Diferenciais competitivos",
  risks: "Riscos",
  investor_faqs: "FAQ de investidores",
};

function normalizeMessage(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function setConversationMode() {
  if (!emptyState.hidden) {
    emptyState.hidden = true;
  }

  if (conversationState.hidden) {
    conversationState.hidden = false;
  }
}

function scrollToBottom() {
  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  });
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
}

function clearTextarea(textarea) {
  textarea.value = "";
  textarea.style.height = "auto";
}

function setFormsDisabled(disabled) {
  const controls = [
    initialMessageInput,
    chatMessageInput,
    ...document.querySelectorAll(".send-button"),
  ];

  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function formatSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "";
  }

  const labels = sources
    .map((source) => SOURCE_LABELS[source] || source)
    .filter(Boolean);

  return [...new Set(labels)].join(", ");
}

function createUserMessage(message) {
  const fragment = userMessageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const text = fragment.querySelector(".message-text");

  article.classList.add("message-enter");
  text.textContent = message;

  return article;
}

function createAssistantMessage(answer, sources = []) {
  const fragment = assistantMessageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const text = fragment.querySelector(".message-text");
  const sourcesCard = fragment.querySelector(".sources-card");
  const sourcesText = fragment.querySelector(".sources-text");

  text.textContent = answer;

  const formattedSources = formatSources(sources);

  if (formattedSources) {
    sourcesText.textContent = formattedSources;
    sourcesCard.hidden = false;
  }

  return article;
}

function createLoadingMessage() {
  const fragment = loadingMessageTemplate.content.cloneNode(true);
  return fragment.querySelector(".message");
}

function appendMessage(element) {
  messagesContainer.appendChild(element);
  scrollToBottom();
}

function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

async function requestChatAnswer(message) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const apiError =
      data && typeof data.error === "string"
        ? data.error
        : "Não foi possível processar a mensagem.";

    throw new Error(apiError);
  }

  return data;
}

async function handleSubmit(rawMessage, textareaToClear) {
  const message = normalizeMessage(rawMessage);

  if (!message || isSubmitting) {
    return;
  }

  if (message.length < 3) {
    appendMessage(
      createAssistantMessage("A pergunta é muito curta. Escreva um pouco mais.")
    );
    return;
  }

  if (message.length > 1000) {
    appendMessage(
      createAssistantMessage(
        "A pergunta é muito longa. O limite máximo é de 1000 caracteres."
      )
    );
    return;
  }

  isSubmitting = true;
  setFormsDisabled(true);
  setConversationMode();

  clearTextarea(textareaToClear);

  appendMessage(createUserMessage(message));

  const loadingMessage = createLoadingMessage();
  appendMessage(loadingMessage);

  try {
    const data = await requestChatAnswer(message);

    removeElement(loadingMessage);

    const answer =
      data && typeof data.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : "Não foi possível gerar uma resposta com base na base institucional atual da ClickPet.";

    const sources = Array.isArray(data?.sources) ? data.sources : [];

    appendMessage(createAssistantMessage(answer, sources));
  } catch (error) {
    removeElement(loadingMessage);

    appendMessage(
      createAssistantMessage(
        error.message ||
          "Não foi possível conectar ao assistente no momento. Tente novamente em alguns instantes."
      )
    );
  } finally {
    isSubmitting = false;
    setFormsDisabled(false);
    chatMessageInput.focus();
  }
}

function bindForm(form, textarea) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit(textarea.value, textarea);
  });

  textarea.addEventListener("input", () => {
    autoResizeTextarea(textarea);
  });

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}

bindForm(initialForm, initialMessageInput);
bindForm(chatForm, chatMessageInput);

initialMessageInput.focus();