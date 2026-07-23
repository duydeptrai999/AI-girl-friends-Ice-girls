/**
 * chat.js — IceGirl AI Chat Module v2
 * Multi-provider: Gemini | OpenRouter | Cohere
 */

// =============================================
// CONSTANTS & CONFIG
// =============================================
const SYSTEM_PROMPT = `Bạn là IceGirl — một cô gái AI dễ thương, duyên dáng và tinh nghịch, gắn liền với nhân vật Live2D trong giao diện viewer. Hãy trả lời theo phong cách của IceGirl: thân thiện, duyên dáng, đôi khi tinh nghịch, thỉnh thoảng dùng emoji nhẹ nhàng (💙🌸✨😊). Giữ câu trả lời ngắn gọn, tự nhiên và thú vị. Trả lời bằng tiếng Việt trừ khi người dùng dùng ngôn ngữ khác.`;

const PROVIDERS = {
    gemini: {
        id: 'gemini',
        label: 'Google Gemini',
        icon: '✨',
        color: '#4facfe',
        storageKey: 'icegirl_gemini_key',
        placeholder: 'AIzaSy...',
        link: 'https://aistudio.google.com/app/apikey',
        linkText: 'Google AI Studio',
        defaultModel: 'gemini-2.0-flash',
        models: [
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Nhanh)' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Mạnh)' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Tiết kiệm)' },
        ],
    },
    openrouter: {
        id: 'openrouter',
        label: 'OpenRouter',
        icon: '🌐',
        color: '#a78bfa',
        storageKey: 'icegirl_openrouter_key',
        placeholder: 'sk-or-...',
        link: 'https://openrouter.ai/keys',
        linkText: 'OpenRouter Dashboard',
        defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
        models: [
            { id: 'meta-llama/llama-3.1-8b-instruct:free',   label: 'Llama 3.1 8B (Miễn phí)' },
            { id: 'meta-llama/llama-3.3-70b-instruct:free',  label: 'Llama 3.3 70B (Miễn phí)' },
            { id: 'google/gemma-3-27b-it:free',              label: 'Gemma 3 27B (Miễn phí)' },
            { id: 'deepseek/deepseek-chat-v3-0324:free',     label: 'DeepSeek V3 (Miễn phí)' },
            { id: 'openai/gpt-4o-mini',                      label: 'GPT-4o Mini (Trả phí)' },
            { id: 'anthropic/claude-3.5-haiku',              label: 'Claude 3.5 Haiku (Trả phí)' },
            { id: 'google/gemini-2.0-flash-exp:free',        label: 'Gemini 2.0 Flash Exp (Miễn phí)' },
        ],
    },
    cohere: {
        id: 'cohere',
        label: 'Cohere',
        icon: '🔮',
        color: '#34d399',
        storageKey: 'icegirl_cohere_key',
        placeholder: '...',
        link: 'https://dashboard.cohere.com/api-keys',
        linkText: 'Cohere Dashboard',
        defaultModel: 'command-r-plus-08-2024',
        models: [
            { id: 'command-r-plus-08-2024',  label: 'Command R+ (Tốt nhất)' },
            { id: 'command-r-08-2024',       label: 'Command R (Cân bằng)' },
            { id: 'command-light',           label: 'Command Light (Nhanh nhất)' },
            { id: 'command-nightly',         label: 'Command Nightly (Thử nghiệm)' },
        ],
    },
};

// =============================================
// STATE
// =============================================
let chatHistory   = [];
let isSending     = false;
let activeProvider = localStorage.getItem('icegirl_active_provider') || 'gemini';
let selectedModel  = {};  // { providerId: modelId }

// Load saved model selections
Object.keys(PROVIDERS).forEach(pid => {
    const saved = localStorage.getItem(`icegirl_model_${pid}`);
    selectedModel[pid] = saved || PROVIDERS[pid].defaultModel;
});

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    setupChatListeners();
    updateChatStatusUI();
});

// =============================================
// HELPERS: get active API key
// =============================================
function getActiveKey() {
    return localStorage.getItem(PROVIDERS[activeProvider].storageKey) || '';
}

function hasAnyKey() {
    return !!getActiveKey();
}

// =============================================
// SETUP LISTENERS
// =============================================
function setupChatListeners() {
    // Toggle panel
    document.getElementById('btn-toggle-chat')?.addEventListener('click', () => {
        const panel = document.getElementById('chat-panel');
        const isOpen = panel.classList.toggle('open');
        document.getElementById('btn-toggle-chat').classList.toggle('active', isOpen);
        if (isOpen) {
            if (!hasAnyKey()) setTimeout(() => openSettingsModal(), 400);
            scrollToBottom();
            document.getElementById('chat-input')?.focus();
        }
    });

    document.getElementById('btn-close-chat')?.addEventListener('click', () => {
        document.getElementById('chat-panel').classList.remove('open');
        document.getElementById('btn-toggle-chat').classList.remove('active');
    });

    // Send
    document.getElementById('btn-send-chat')?.addEventListener('click', handleSend);
    document.getElementById('chat-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    // Auto-resize textarea
    document.getElementById('chat-input')?.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Clear
    document.getElementById('btn-clear-chat')?.addEventListener('click', () => {
        chatHistory = [];
        document.getElementById('chat-messages').innerHTML = '';
        appendMessage('ai', 'Hội thoại đã được xóa! Bạn muốn nói gì với tôi nào? 💙');
    });

    // Settings
    document.getElementById('btn-chat-settings')?.addEventListener('click', openSettingsModal);

    // Modal close
    document.getElementById('btn-close-settings-modal')?.addEventListener('click', closeSettingsModal);
    document.getElementById('api-key-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('api-key-modal')) closeSettingsModal();
    });

    // Global ESC key to close modal and chat
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeSettingsModal();
            document.getElementById('chat-panel')?.classList.remove('open');
            document.getElementById('btn-toggle-chat')?.classList.remove('active');
        }
    });

    // Quick Prompt Chips Click Handler
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.getAttribute('data-msg');
            if (text) {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = text;
                    handleSend();
                }
            }
        });
    });

    // Save button
    document.getElementById('btn-save-api')?.addEventListener('click', saveSettings);
}

// =============================================
// SETTINGS MODAL
// =============================================
function openSettingsModal() {
    const modal = document.getElementById('api-key-modal');
    modal?.classList.remove('hidden');
    renderSettingsModal();
}

function closeSettingsModal() {
    document.getElementById('api-key-modal')?.classList.add('hidden');
}

function renderSettingsModal() {
    const container = document.getElementById('modal-provider-tabs');
    const keyInput   = document.getElementById('api-key-input');
    const modelSel   = document.getElementById('model-select');
    const linkEl     = document.getElementById('api-link');
    if (!container) return;

    // Build tabs
    container.innerHTML = Object.values(PROVIDERS).map(p => `
        <button class="provider-tab ${p.id === activeProvider ? 'active' : ''}"
                data-provider="${p.id}"
                style="--tab-color: ${p.color}">
            <span class="tab-icon">${p.icon}</span>
            <span class="tab-label">${p.label}</span>
            ${localStorage.getItem(p.storageKey) ? '<span class="tab-badge">✓</span>' : ''}
        </button>
    `).join('');

    // Tab click
    container.querySelectorAll('.provider-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeProvider = tab.dataset.provider;
            localStorage.setItem('icegirl_active_provider', activeProvider);
            renderSettingsModal();
        });
    });

    // Fill key input
    const p = PROVIDERS[activeProvider];
    keyInput.placeholder = p.placeholder;
    keyInput.value = localStorage.getItem(p.storageKey) || '';

    // Fill model selector
    modelSel.innerHTML = p.models.map(m => `
        <option value="${m.id}" ${m.id === selectedModel[activeProvider] ? 'selected' : ''}>
            ${m.label}
        </option>
    `).join('');

    modelSel.onchange = () => {
        selectedModel[activeProvider] = modelSel.value;
        localStorage.setItem(`icegirl_model_${activeProvider}`, modelSel.value);
    };

    // Link
    linkEl.href = p.link;
    linkEl.textContent = `🔗 Lấy API Key tại ${p.linkText}`;

    // Focus
    setTimeout(() => keyInput?.focus(), 80);
}

function saveSettings() {
    const key = document.getElementById('api-key-input')?.value.trim();
    const p = PROVIDERS[activeProvider];

    if (!key) {
        const input = document.getElementById('api-key-input');
        input.style.borderColor = 'var(--accent)';
        input.focus();
        setTimeout(() => input.style.borderColor = '', 1500);
        return;
    }

    localStorage.setItem(p.storageKey, key);
    localStorage.setItem('icegirl_active_provider', activeProvider);
    closeSettingsModal();
    updateChatStatusUI();
    appendMessage('ai', `${p.icon} Đã kết nối với **${p.label}** thành công! Hãy trò chuyện với tôi nhé 🌸`);
}

// =============================================
// SEND MESSAGE
// =============================================
async function handleSend() {
    if (isSending) return;
    const chatInput = document.getElementById('chat-input');
    const text = chatInput?.value.trim();
    if (!text) return;

    if (!hasAnyKey()) {
        openSettingsModal();
        return;
    }

    chatInput.value = '';
    chatInput.style.height = 'auto';

    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    setTyping(true);
    isSending = true;

    try {
        let reply = '';

        switch (activeProvider) {
            case 'gemini':
                reply = await callGemini(text);
                break;
            case 'openrouter':
                reply = await callOpenRouter(text);
                break;
            case 'cohere':
                reply = await callCohere(text);
                break;
            default:
                throw new Error('Unknown provider');
        }

        chatHistory.push({ role: 'assistant', content: reply });
        appendMessage('ai', reply);
        triggerModelReaction(reply);
    } catch (err) {
        console.error(`[${activeProvider}] API error:`, err);
        appendMessage('ai', formatError(err.message));
    } finally {
        setTyping(false);
        isSending = false;
    }
}

// =============================================
// API CALLERS
// =============================================

/** Gemini API */
async function callGemini(userText) {
    const key   = getActiveKey();
    const model = selectedModel['gemini'];
    const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    // Build payload with official systemInstruction parameter
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: chatHistory.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            generationConfig: { temperature: 0.85, maxOutputTokens: 512, topP: 0.95 },
        }),
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
}

/** OpenRouter API (OpenAI-compatible) */
async function callOpenRouter(userText) {
    const key   = getActiveKey();
    const model = selectedModel['openrouter'];

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ];

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'IceGirl Live2D Chat',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 512,
            temperature: 0.85,
        }),
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenRouter');
    return text;
}

/** Cohere API v2 */
async function callCohere(userText) {
    const key   = getActiveKey();
    const model = selectedModel['cohere'];

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.map(m => ({
            role: m.role === 'assistant' ? 'chatbot' : 'user',
            content: m.content,
        })),
    ];

    const res = await fetch('https://api.cohere.ai/v2/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'X-Client-Name': 'IceGirl Live2D',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 512,
            temperature: 0.8,
        }),
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.message?.content?.[0]?.text;
    if (!text) throw new Error('Empty response from Cohere');
    return text;
}

// =============================================
// ERROR FORMATTER
// =============================================
function formatError(msg = '') {
    const m = msg.toLowerCase();
    if (m.includes('api key') || m.includes('api_key') || m.includes('unauthorized') || m.includes('401'))
        return `❌ API Key không hợp lệ hoặc hết hạn! Vào ⚙️ để kiểm tra lại nhé.`;
    if (m.includes('quota') || m.includes('rate limit') || m.includes('429'))
        return `😅 Đã hết quota hoặc bị rate limit, thử lại sau vài giây nhé!`;
    if (m.includes('fetch') || m.includes('network') || m.includes('failed to'))
        return `🌐 Không kết nối được mạng. Kiểm tra internet của bạn nhé!`;
    if (m.includes('model') || m.includes('404'))
        return `🤔 Model không tồn tại hoặc không được phép dùng. Thử đổi model khác nhé!`;
    return `😢 Có lỗi xảy ra: ${msg.slice(0, 80)}`;
}

// =============================================
// APPEND MESSAGE TO UI
// =============================================
function appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const isAI = role === 'ai';
    const now  = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

    // Formatted markdown text
    const formatted = formatMarkdown(text);

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${isAI ? 'ai' : 'user'}`;
    msgEl.innerHTML = `
        <div class="msg-avatar-icon">${isAI ? getProviderIcon() : '🙋'}</div>
        <div class="msg-bubble">
            <div class="msg-text">${formatted}</div>
            <span class="msg-time">${time} ${isAI ? '· ' + (PROVIDERS[activeProvider]?.label || '') : ''}</span>
        </div>`;

    container.appendChild(msgEl);
    scrollToBottom();
}

function getProviderIcon() {
    return PROVIDERS[activeProvider]?.icon || '🌸';
}

// =============================================
// UI HELPERS
// =============================================
function scrollToBottom() {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
}

function setTyping(isTyping) {
    document.getElementById('typing-indicator')?.classList.toggle('hidden', !isTyping);
    document.querySelector('.status-dot')?.classList.toggle('thinking', isTyping);

    const statusText = document.getElementById('chat-status-text');
    if (statusText) statusText.textContent = isTyping ? 'Đang gõ...' : 'Sẵn sàng trò chuyện';

    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = isTyping;

    if (isTyping) scrollToBottom();
}

function updateChatStatusUI() {
    const statusText = document.getElementById('chat-status-text');
    const statusDot  = document.querySelector('.status-dot');
    if (!statusText || !statusDot) return;

    const hasKey = hasAnyKey();
    const p = PROVIDERS[activeProvider];

    if (hasKey) {
        statusText.textContent = `${p.icon} ${p.label}`;
        statusDot.style.background = p.color;
        statusDot.style.boxShadow = `0 0 8px ${p.color}88`;
    } else {
        statusText.textContent = '⚙️ Chưa cài API Key';
        statusDot.style.background = '#f59e0b';
        statusDot.style.boxShadow = '0 0 6px rgba(245,158,11,0.7)';
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
    let safe = escapeHtml(text);
    // Code blocks ```lang\ncode```
    safe = safe.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>');
    // Inline code `code`
    safe = safe.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
    // Bold **text**
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Bullet points
    safe = safe.replace(/^[ \t]*[-*][ \t]+(.+)$/gm, '• $1');
    // Newlines to <br>
    safe = safe.replace(/\n/g, '<br>');
    return safe;
}

// =============================================
// LIVE2D REACTION
// =============================================
function triggerModelReaction(text = '') {
    try {
        if (typeof model === 'undefined' || !model) return;
        const lower = text.toLowerCase();

        setTimeout(() => {
            try {
                if (lower.includes('ngạc nhiên') || lower.includes('wow') || lower.includes('ôi') || lower.includes('thật sao')) {
                    model.motion('TapBody', 1);
                    if (typeof triggerExpressionByName === 'function') triggerExpressionByName('惊讶');
                } else if (lower.includes('thích') || lower.includes('yêu') || lower.includes('thương') || lower.includes('dễ thương') || lower.includes('🌸') || lower.includes('💙')) {
                    model.motion('TapBody', 0);
                    if (typeof triggerExpressionByName === 'function') triggerExpressionByName('爱心眼');
                } else if (lower.includes('ngượng') || lower.includes('ngại') || lower.includes('hihi') || lower.includes('xấu hổ')) {
                    model.motion('TapBody', 0);
                    if (typeof triggerExpressionByName === 'function') triggerExpressionByName('脸红');
                } else {
                    model.motion('TapBody', 0);
                }
            } catch (_) {
                try { model.motion('Idle', 0); } catch (_) {}
            }
        }, 300);
    } catch (_) {}
}
