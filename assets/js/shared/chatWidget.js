import { askCompanion, getChatHistory } from "./api.js";

function getPageContext() {
  const params = new URLSearchParams(window.location.search);
  const symbol = params.get("symbol");
  const page = window.location.pathname.split("/").pop() || "index.html";
  return {
    page,
    symbol,
    title: document.title,
  };
}

function addMessage(container, text, role = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `cr-chat-bubble ${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

export function initChatWidget() {
  if (document.getElementById("crChatWidget")) return;

  const widget = document.createElement("section");
  widget.id = "crChatWidget";
  widget.className = "cr-chat-widget";
  widget.innerHTML = `
        <button class="btn btn-primary cr-chat-toggle" type="button" aria-expanded="false" aria-controls="crChatPanel">
            AI
        </button>
        <div id="crChatPanel" class="cr-chat-panel shadow-lg" aria-live="polite">
            <div class="cr-chat-header d-flex align-items-center justify-content-between">
                <div>
                    <div class="fw-semibold">Coin Radar AI</div>
                    <div class="small text-muted">Portfolio companion</div>
                </div>
                <button class="btn btn-sm btn-outline-secondary cr-chat-close" type="button" aria-label="Close chat">&times;</button>
            </div>
            <div class="cr-chat-messages"></div>
            <form class="cr-chat-form">
                <input class="form-control" type="text" autocomplete="off" placeholder="Ask Coin Radar AI...">
                <button class="btn btn-primary" type="submit">Send</button>
            </form>
        </div>
    `;

  document.body.appendChild(widget);

  const toggle = widget.querySelector(".cr-chat-toggle");
  const close = widget.querySelector(".cr-chat-close");
  const panel = widget.querySelector(".cr-chat-panel");
  const form = widget.querySelector(".cr-chat-form");
  const input = form.querySelector("input");
  const messages = widget.querySelector(".cr-chat-messages");
  const submit = form.querySelector("button");
  let historyPromise;

  function loadHistory() {
    if (historyPromise) return historyPromise;

    historyPromise = (async () => {
      if (!window.COINRADAR_USER) {
        addMessage(messages, "Sign in to chat and keep your conversation history.", "bot");
        return;
      }

      addMessage(messages, "Loading your previous conversation...", "status");
      try {
        const data = await getChatHistory();
        messages.replaceChildren();
        const history = Array.isArray(data.messages) ? data.messages : [];
        if (!history.length) {
          addMessage(messages, "Ask about your watchlist, a chart you're viewing, or recent market news.", "bot");
          return;
        }

        history.forEach((message) => {
          addMessage(
            messages,
            message.content,
            message.role === "user" ? "user" : "bot",
          );
        });
      } catch (error) {
        messages.replaceChildren();
        addMessage(messages, `Unable to load chat history: ${error.message}`, "bot");
      }
    })();

    return historyPromise;
  }

  function setOpen(isOpen) {
    panel.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      loadHistory();
      input.focus();
    }
  }

  toggle.addEventListener("click", () =>
    setOpen(!panel.classList.contains("open")),
  );
  close.addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadHistory();
    const message = input.value.trim();
    if (!message) return;

    input.value = "";
    addMessage(messages, message, "user");
    submit.disabled = true;
    submit.textContent = "...";

    try {
      if (!window.COINRADAR_USER) {
        addMessage(messages, "Please sign in first so I can use your saved watchlist.", "bot");
        return;
      }
      const pageContext = getPageContext();
      const response = await askCompanion({
        message,
        pageContext,
      });
      addMessage(messages, response.reply || "No answer received.", "bot");
    } catch (error) {
      addMessage(
        messages,
        `Unable to get an AI response: ${error.message}`,
        "bot",
      );
    } finally {
      submit.disabled = false;
      submit.textContent = "Send";
    }
  });
}
