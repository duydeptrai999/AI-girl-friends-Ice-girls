/**
 * chat.js — IceGirl AI Chat Module
 * Sử dụng Gemini API (google.generativeai) để chat với AI
 */

// =============================================
// STATE
// =============================================
const STORAGE_KEY_API = 'icegirl_gemini_api_key';
const SYSTEM_PROMPT = `Bạn là IceGirl — một cô gái AI dễ thương, duyên dáng và tinh nghịch, được gắn liền với nhân vật Live2D trong giao diện viewer. Hãy trả lời theo phong cách của IceGirl: thân thiện, duyên dáng, đôi khi tinh nghịch, thỉnh thoảng dùng các biểu tượng cảm xúc nhẹ nhàng (💙🌸✨😊). Giữ câu trả lời ngắn gọn, tự nhiên và thú vị. Trả lời bằng tiếng Việt trừ khi người dùng nói tiếng khác.`;

let chatHistory = []; // { role: 'user'|'model', parts: [{ text }] }
let isSending = false;
let geminiApiKey = '';

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    geminiApiKey = localStorage.getItem(STORAGE_KEY_API) || '';
    setupChatListeners();
    updateChatStatusUI();
});

// =============================================
// SETUP LISTENERS
// =============================================
function setupChatListeners() {
    const btnToggleChat   = document.getElementById('btn-toggle-chat');
    const btnCloseChat    = document.getElementById('btn-close-chat');
    const btnSend         = document.getElementById('btn-send-chat');
    const chatInput       = document.getElementById('chat-input');
    const btnClearChat    = document.getElementById('btn-clear-chat');
    const btnSettings     = document.getElementById('btn-chat-settings');
    const btnCloseModal   = document.getElementById('btn-close-api-modal');
    const btnCancelApi    = document.getElementById('btn-cancel-api');
    const btnSaveApi      = document.getElementById('btn-save-api');
    const apiKeyModal     = document.getElementById('api-key-modal');
    const apiKeyInput     = document.getElementById('api-key-input');

    // Toggle chat panel open/close
    btnToggleChat?.addEventListener('click', () => {
        const panel = document.getElementById('chat-panel');
        const isOpen = panel.classList.toggle('open');
        btnToggleChat.classList.toggle('active', isOpen);

        if (isOpen) {
            // If no API key, prompt the user to set one
            if (!geminiApiKey) {
                setTimeout(() => openApiModal(), 400);
            }
            scrollToBottom();
            chatInput?.focus();
        }
    });

    btnCloseChat?.addEventListener('click', () => {
        document.getElementById('chat-panel').classList.remove('open');
        document.getElementById('btn-toggle-chat').classList.remove('active');
    });

    // Send button
    btnSend?.addEventListener('click', handleSend);

    // Enter key to send (Shift+Enter for newline)
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Clear chat
    btnClearChat?.addEventListener('click', () => {
        chatHistory = [];
        const messagesEl = document.getElementById('chat-messages');
        messagesEl.innerHTML = '';
        appendMessage('ai', 'Hội thoại đã được xóa! Bạn muốn nói gì với tôi nào? 💙');
    });

    // Open API key settings
    btnSettings?.addEventListener('click', openApiModal);

    // Close modal
    const closeModal = () => {
        apiKeyModal?.classList.add('hidden');
        apiKeyInput.value = '';
    };

    btnCloseModal?.addEventListener('click', closeModal);
    btnCancelApi?.addEventListener('click', closeModal);
    apiKeyModal?.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) closeModal();
    });

    // Save API key
    btnSaveApi?.addEventListener('click', () => {
        const key = apiKeyInput?.value.trim();
        if (!key) {
            apiKeyInput?.focus();
            apiKeyInput.style.borderColor = 'var(--accent)';
            return;
        }
        geminiApiKey = key;
        localStorage.setItem(STORAGE_KEY_API, key);
        closeModal();
        updateChatStatusUI();
        appendMessage('ai', 'Tuyệt vời! API Key đã được cài đặt 🔑 Bây giờ chúng ta có thể trò chuyện thật sự rồi! 🌸');
    });

    // Allow Enter in modal input
    apiKeyInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSaveApi?.click();
    });
}

// =============================================
// OPEN API MODAL
// =============================================
function openApiModal() {
    const modal = document.getElementById('api-key-modal');
    const input = document.getElementById('api-key-input');
    modal?.classList.remove('hidden');
    // Pre-fill if key exists
    if (geminiApiKey) input.value = geminiApiKey;
    setTimeout(() => input?.focus(), 100);
}

// =============================================
// SEND MESSAGE
// =============================================
async function handleSend() {
    if (isSending) return;

    const chatInput = document.getElementById('chat-input');
    const text = chatInput?.value.trim();
    if (!text) return;

    if (!geminiApiKey) {
        openApiModal();
        return;
    }

    // Reset input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Append user message
    appendMessage('user', text);

    // Add to history
    chatHistory.push({ role: 'user', parts: [{ text }] });

    // Show typing + update status
    setTyping(true);
    isSending = true;

    try {
        const reply = await callGeminiAPI(text);
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        appendMessage('ai', reply);

        // Optionally trigger a happy motion on the Live2D model
        triggerModelReaction('happy');
    } catch (err) {
        console.error('Gemini API error:', err);
        let errMsg = 'Ôi, có lỗi xảy ra rồi 😢 Thử lại sau nhé!';
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
            errMsg = '❌ API Key không hợp lệ. Hãy kiểm tra lại nhé! ⚙️';
        } else if (err.message?.includes('quota')) {
            errMsg = '😅 Đã hết quota API hôm nay rồi, thử lại vào ngày mai nhé!';
        } else if (err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
            errMsg = '🌐 Không có kết nối mạng, kiểm tra lại internet nhé!';
        }
        appendMessage('ai', errMsg);
    } finally {
        setTyping(false);
        isSending = false;
    }
}

// =============================================
// CALL GEMINI API
// =============================================
async function callGeminiAPI(userText) {
    // Build contents array with system prompt prepended as first user turn
    const contents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Hiểu rồi! Tôi sẽ đóng vai IceGirl 🌸' }] },
        ...chatHistory
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const body = {
        contents,
        generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 512,
            topP: 0.95,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini API');
    return text;
}

// =============================================
// APPEND MESSAGE TO UI
// =============================================
function appendMessage(role, text) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    const isAI = role === 'ai';
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${isAI ? 'ai' : 'user'}`;

    // Format text: newlines to <br>, keep links clickable
    const formattedText = escapeHtml(text).replace(/\n/g, '<br>');

    msgEl.innerHTML = `
        <div class="msg-avatar-icon">${isAI ? '🌸' : '🙋'}</div>
        <div class="msg-bubble">
            <p class="msg-text">${formattedText}</p>
            <span class="msg-time">${time}</span>
        </div>
    `;

    messagesEl.appendChild(msgEl);
    scrollToBottom();
}

// =============================================
// HELPERS
// =============================================
function scrollToBottom() {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
}

function setTyping(isTyping) {
    const indicator = document.getElementById('typing-indicator');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('chat-status-text');

    if (indicator) indicator.classList.toggle('hidden', !isTyping);

    if (statusDot) statusDot.classList.toggle('thinking', isTyping);
    if (statusText) {
        statusText.textContent = isTyping ? 'Đang gõ...' : 'Sẵn sàng trò chuyện';
    }

    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = isTyping;

    if (isTyping) scrollToBottom();
}

function updateChatStatusUI() {
    const statusText = document.getElementById('chat-status-text');
    const statusDot = document.querySelector('.status-dot');
    if (!statusText || !statusDot) return;

    if (geminiApiKey) {
        statusText.textContent = 'Sẵn sàng trò chuyện';
        statusDot.style.background = '#4ade80';
        statusDot.style.boxShadow = '0 0 6px rgba(74, 222, 128, 0.7)';
    } else {
        statusText.textContent = '⚙️ Chưa cài API Key';
        statusDot.style.background = '#f59e0b';
        statusDot.style.boxShadow = '0 0 6px rgba(245, 158, 11, 0.7)';
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// =============================================
// LIVE2D MODEL REACTION (optional)
// =============================================
function triggerModelReaction(type) {
    // Trigger a random motion when AI responds
    try {
        if (typeof model !== 'undefined' && model) {
            // Small delay so the bubble appears first
            setTimeout(() => {
                try {
                    model.motion('TapBody', 0);
                } catch (_) {
                    // fallback to any motion
                    try { model.motion('Idle', 0); } catch (_) {}
                }
            }, 300);
        }
    } catch (_) {}
}
