import { askCompanion } from './api.js';
import { readWatchlist } from './storage.js';

function getPageContext() {
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return {
        page,
        symbol,
        title: document.title
    };
}

function addMessage(container, text, role = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `cr-chat-bubble ${role}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

export function initChatWidget() {
    if (document.getElementById('crChatWidget')) return;

    const widget = document.createElement('section');
    widget.id = 'crChatWidget';
    widget.className = 'cr-chat-widget';
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
            <div class="cr-chat-messages">
                <div class="cr-chat-bubble bot">Ask about your watchlist, a chart you're viewing, or recent market news.</div>
            </div>
            <form class="cr-chat-form">
                <input class="form-control" type="text" autocomplete="off" placeholder="Ask Coin Radar AI...">
                <button class="btn btn-primary" type="submit">Send</button>
            </form>
        </div>
    `;

    document.body.appendChild(widget);

    const toggle = widget.querySelector('.cr-chat-toggle');
    const close = widget.querySelector('.cr-chat-close');
    const panel = widget.querySelector('.cr-chat-panel');
    const form = widget.querySelector('.cr-chat-form');
    const input = form.querySelector('input');
    const messages = widget.querySelector('.cr-chat-messages');
    const submit = form.querySelector('button');

    function setOpen(isOpen) {
        panel.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) input.focus();
    }

    toggle.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    close.addEventListener('click', () => setOpen(false));

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        addMessage(messages, message, 'user');
        submit.disabled = true;
        submit.textContent = '...';

        try {
            const watchlist = readWatchlist();
            const pageContext = getPageContext();
            const response = await askCompanion({ message, holdings: watchlist, pageContext });
            addMessage(messages, response.reply || 'No answer received.', 'bot');
        } catch (error) {
            addMessage(messages, 'The AI backend is not connected yet. Ollama should run outside Lambda on EC2 or a small container, with Lambda only orchestrating context and requests.', 'bot');
        } finally {
            submit.disabled = false;
            submit.textContent = 'Send';
        }
    });
}
