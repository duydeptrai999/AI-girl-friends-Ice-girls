# 🌸 IceGirl Live2D Viewer — Ultra Premium AI Experience

Language / Ngôn ngữ: **[ 🇬🇧 English ](README_EN.md)** | **[ 🇻🇳 Tiếng Việt ](README.md)**

[![Vibe Coding](https://img.shields.io/badge/Code_Style-100%25_Vibe_Coding-ff69b4?style=for-the-badge&logo=sparkles)](https://github.com)
[![Built with Live2D](https://img.shields.io/badge/Live2D-Cubism_4-00d2ff?style=for-the-badge)](https://www.live2d.com)
[![i18n Supported](https://img.shields.io/badge/i18n-9_Languages-a78bfa?style=for-the-badge&logo=translate)](i18n.js)

An ultra-premium, interactive **Live2D (Cubism 4)** character viewer paired with a multi-provider AI companion (**Google Gemini**, **OpenRouter**, **Cohere**) featuring real-time emotion reaction and full 9-language i18n support.

![IceGirl Live2D Viewer](01.png)

## ✨ Key Features

- 🌐 **9-Language Internationalization (i18n):** Complete UI & AI Chat translation for **Vietnamese 🇻🇳, English 🇬🇧, Japanese 🇯🇵, Chinese 🇨🇳, Korean 🇰🇷, French 🇫🇷, Spanish 🇪🇸, German 🇩🇪, Russian 🇷🇺**. Auto-detects browser language and persists user preference.
- 🎨 **100% Vibe Coding:** Entire project designed, WebGL optimized, and styled with pure artistic vision & AI Pair Programming.
- 🎭 **Flexible Expressions & Items:** Independent toggles for accessories (cat ears, crown, angel wings, game controller...) and facial expressions.
- ⚡ **Motion Library & Smooth Idle:** Rich motion animations with automatic smooth transition back to Idle stance without residual arm position artifacts.
- 🤖 **Emotion-Aware AI Companion:** AI auto-detects conversational emotion (happy, surprised, blushing...) to trigger character poses and expressions dynamically.
- 🧠 **Multi-Provider AI Intelligence:** Select between Google Gemini, OpenRouter (Llama 3.3, DeepSeek V3, Claude 3.5, GPT-4o-mini), or Cohere with dynamic system prompts tailored to your selected language.
- 🎥 **Chroma Green Mode:** OBS Studio green screen backdrop for VTubers and streamers for easy background keying.
- 🔒 **Maximum Privacy:** 100% Client-Side. API keys are stored securely in browser `localStorage` without any proxy server.

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/duydeptrai999/AI-girl-friends-Ice-girls.git
   ```
2. Open `index.html` directly in your browser or run via a Local Web Server (VS Code Live Server, Python `http.server`, etc.).
3. Click the 💬 **AI Chat** button -> ⚙️ **Settings** to paste your API Key and start interacting!

## 🛡️ Security & Privacy

- **Local Storage Key Security:** API keys remain strictly in your browser's private `localStorage`.
- **Direct API Calls:** No backend server or proxy collects your data. Requests connect directly to AI provider endpoints (Google / OpenRouter / Cohere).
- **XSS Protection:** All AI markdown responses are sanitized before DOM insertion.

## ⚖️ Model License Notice

> ⚠️ **Notice:** Commercial copyright of the Live2D model belongs to author **TianyeLulu** ([Booth Shop](https://tianyelulu.booth.pm)). The model files included in this repository are for demonstration purposes only. Please do not re-distribute original model files commercially without explicit permission from the author.

---
✨ *Built with 100% Vibe Coding energy, 💙 & Live2D Cubism 4.*
