/**
 * i18n.js — IceGirl Live2D Viewer Internationalization Engine
 * Supports 9 Languages:
 * 🇻🇳 Tiếng Việt (vi) | 🇬🇧 English (en) | 🇯🇵 日本語 (ja) | 🇨🇳 中文 (zh)
 * 🇰🇷 한국어 (ko)     | 🇫🇷 Français (fr) | 🇪🇸 Español (es) | 🇩🇪 Deutsch (de) | 🇷🇺 Русский (ru)
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'icegirl_lang';
    const SUPPORTED_LANGS = [
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', short: 'VI' },
        { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' },
        { code: 'ja', name: '日本語', flag: '🇯🇵', short: 'JA' },
        { code: 'zh', name: '中文', flag: '🇨🇳', short: 'ZH' },
        { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' },
        { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
        { code: 'es', name: 'Español', flag: '🇪🇸', short: 'ES' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪', short: 'DE' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺', short: 'RU' }
    ];

    const translations = {
        vi: {
            brand_subtitle: 'Cubism 4 • Interactive',
            interaction_hint: 'Giữ chuột trái di chuyển • Cuộn chuột zoom',
            btn_fullscreen: 'Toàn màn hình',
            
            // Themes
            theme_0: 'Căn Phòng Streamer Cozy (Anime Room)',
            theme_1: 'Băng Tuyết Tinh Thể (Ice Frost Crystal)',
            theme_2: 'Cực Quang Băng Giá (Aurora Teal)',
            theme_3: 'Hoa Băng Huyền Diệu (Icy Lavender)',
            theme_4: 'Anh Đào Băng (Snow Sakura Pink)',
            theme_5: 'Đêm Đông Tuyết Rơi (Frozen Midnight)',
            theme_6: 'Đại Dương Băng Giá (Deep Glacier)',
            theme_7: 'Chroma Green (Tách nền OBS Studio)',

            // Loaders & Sidebars
            loading_model: 'Đang kết nối mô hình Live2D IceGirl...',
            sidebar_left_title: 'Biểu Cảm & Phụ Kiện',
            sidebar_right_title: 'Chuyển Động (Motions)',
            loading_expressions: 'Đang quét biểu cảm...',
            loading_motions: 'Đang tải chuyển động...',

            // Floating Dock Tooltips
            dock_hide: 'Ẩn thanh công cụ',
            dock_show: 'Hiện thanh công cụ',
            dock_zoom_in: 'Phóng to',
            dock_zoom_out: 'Thu nhỏ',
            dock_reset: 'Căn giữa mô hình',
            dock_look_center: 'Khóa nhìn thẳng',
            dock_change_bg: 'Đổi màu nền',
            dock_toggle_sidebar: 'Ẩn/Hiện Menu (Tab)',
            dock_toggle_chat: 'Mở Trò Chuyện AI',

            // AI Chat Panel
            chat_status_ready: 'Sẵn sàng trò chuyện',
            chat_status_thinking: 'IceGirl đang suy nghĩ...',
            btn_chat_settings: 'Cài đặt API Key & Provider',
            btn_clear_chat: 'Xóa đoạn hội thoại',
            btn_close_chat: 'Thu nhỏ chat',
            chat_greeting: 'Xin chào! Tôi là IceGirl 💙 Rất vui được gặp bạn! Hãy hỏi tôi bất cứ điều gì hoặc sử dụng các gợi ý bên trên nhé~',
            chat_cleared: 'Hội thoại đã được xóa! Bạn muốn nói gì với tôi nào? 💙',
            chat_placeholder: 'Nhắn tin với IceGirl...',
            
            // Quick suggestions
            suggestion_1: '👋 Chào hỏi',
            suggestion_1_msg: 'Xin chào! Bạn là ai thế? 🌸',
            suggestion_2: '💖 Cười lên nào',
            suggestion_2_msg: 'Cười một cái thật tươi cho mình xem nào! 💖',
            suggestion_3: '✨ Phụ kiện',
            suggestion_3_msg: 'Bạn có phụ kiện hay biểu cảm nào đẹp không? ✨',
            suggestion_4: '📸 Tạo dáng',
            suggestion_4_msg: 'Tạo một dáng thật đáng yêu đi! 📸',

            // AI Settings Modal
            modal_title: 'Cấu hình AI Intelligence',
            modal_desc: 'Chọn Nhà cung cấp AI (Provider), điền API Key và chọn Model mong muốn. Key được bảo mật lưu trên trình duyệt cá nhân. 🔒',
            label_api_key: 'API Key Khóa Truy Cập',
            placeholder_api_key: 'Nhập API Key vào đây...',
            label_model: 'Mô Hình AI (Model)',
            btn_delete_key: '🗑️ Xóa Key',
            btn_save_key: '💾 Lưu Cấu Hình & Kết Nối',

            // System prompt for AI
            system_prompt: 'Bạn là IceGirl — một cô gái AI dễ thương, duyên dáng và tinh nghịch, gắn liền với nhân vật Live2D trong giao diện viewer. Hãy trả lời theo phong cách của IceGirl: thân thiện, duyên dáng, đôi khi tinh nghịch, thỉnh thoảng dùng emoji nhẹ nhàng (💙🌸✨😊). Giữ câu trả lời ngắn gọn, tự nhiên và thú vị. BẮT BỘC trả lời hoàn toàn bằng tiếng Việt.'
        },
        en: {
            brand_subtitle: 'Cubism 4 • Interactive',
            interaction_hint: 'Hold left click to drag • Scroll wheel to zoom',
            btn_fullscreen: 'Fullscreen',

            // Themes
            theme_0: 'Cozy Streamer Room (Anime Room)',
            theme_1: 'Ice Frost Crystal',
            theme_2: 'Aurora Teal',
            theme_3: 'Icy Lavender',
            theme_4: 'Snow Sakura Pink',
            theme_5: 'Frozen Midnight',
            theme_6: 'Deep Glacier',
            theme_7: 'Chroma Green (OBS Studio Keying)',

            // Loaders & Sidebars
            loading_model: 'Connecting IceGirl Live2D model...',
            sidebar_left_title: 'Expressions & Items',
            sidebar_right_title: 'Motions',
            loading_expressions: 'Scanning expressions...',
            loading_motions: 'Loading motions...',

            // Floating Dock Tooltips
            dock_hide: 'Hide Toolbar',
            dock_show: 'Show Toolbar',
            dock_zoom_in: 'Zoom In',
            dock_zoom_out: 'Zoom Out',
            dock_reset: 'Reset Center',
            dock_look_center: 'Lock Look Straight',
            dock_change_bg: 'Change Background',
            dock_toggle_sidebar: 'Toggle Sidebars',
            dock_toggle_chat: 'Open AI Chat',

            // AI Chat Panel
            chat_status_ready: 'Ready to chat',
            chat_status_thinking: 'IceGirl is thinking...',
            btn_chat_settings: 'AI Settings & API Keys',
            btn_clear_chat: 'Clear conversation',
            btn_close_chat: 'Minimize chat',
            chat_greeting: "Hello! I'm IceGirl 💙 Nice to meet you! Feel free to ask me anything or pick a quick prompt above~",
            chat_cleared: 'Conversation cleared! What would you like to talk about? 💙',
            chat_placeholder: 'Send a message to IceGirl...',

            // Quick suggestions
            suggestion_1: '👋 Say Hello',
            suggestion_1_msg: 'Hello! Who are you? 🌸',
            suggestion_2: '💖 Smile',
            suggestion_2_msg: 'Give me a big sweet smile! 💖',
            suggestion_3: '✨ Accessories',
            suggestion_3_msg: 'Show me your favorite items or expressions! ✨',
            suggestion_4: '📸 Cute Pose',
            suggestion_4_msg: 'Strike a super cute pose for me! 📸',

            // AI Settings Modal
            modal_title: 'AI Intelligence Settings',
            modal_desc: 'Choose an AI Provider, paste your API Key, and select a model. Keys are saved securely in local storage. 🔒',
            label_api_key: 'API Key',
            placeholder_api_key: 'Paste your API Key here...',
            label_model: 'AI Model',
            btn_delete_key: '🗑️ Delete Key',
            btn_save_key: '💾 Save & Connect',

            // System prompt for AI
            system_prompt: "You are IceGirl — a cute, charming, and playful AI girl paired with the Live2D character viewer. Respond in IceGirl's signature style: friendly, graceful, cheerful, with cute emojis (💙🌸✨😊). Keep answers concise, natural, and engaging. You MUST answer strictly in English."
        },
        ja: {
            brand_subtitle: 'Cubism 4 • インタラクティブ',
            interaction_hint: '左ドラッグで移動 • ホイールでズーム',
            btn_fullscreen: '全画面表示',

            // Themes
            theme_0: '配信部屋 (アニメルーム)',
            theme_1: '氷晶クリスタル',
            theme_2: 'オーロラティール',
            theme_3: 'ラベンダーアイス',
            theme_4: 'スノーサクラピンク',
            theme_5: 'フローズンミッドナイト',
            theme_6: 'ディープグレイシャー',
            theme_7: 'クロマキーグリーン (OBS用)',

            // Loaders & Sidebars
            loading_model: 'Live2Dモデル「IceGirl」に接続中...',
            sidebar_left_title: '表情とアクセサリー',
            sidebar_right_title: 'モーション一覧',
            loading_expressions: '表情を読み込み中...',
            loading_motions: 'モーションを読み込み中...',

            // Floating Dock Tooltips
            dock_hide: 'ツールバーを隠す',
            dock_show: 'ツールバーを表示',
            dock_zoom_in: '拡大',
            dock_zoom_out: '縮小',
            dock_reset: '位置リセット',
            dock_look_center: '視線正面固定',
            dock_change_bg: '背景変更',
            dock_toggle_sidebar: 'サイドバー切り替え',
            dock_toggle_chat: 'AIチャットを開く',

            // AI Chat Panel
            chat_status_ready: '会話準備完了',
            chat_status_thinking: 'IceGirlが考え中...',
            btn_chat_settings: 'AI設定・APIキー',
            btn_clear_chat: 'チャット履歴を消去',
            btn_close_chat: 'チャットを閉じる',
            chat_greeting: 'こんにちは！IceGirlです💙 お会いできてとても嬉しいです！何でも聞いてくださいね~',
            chat_cleared: 'チャット履歴を消去しました！次は何について話しましょうか？💙',
            chat_placeholder: 'IceGirlにメッセージを送る...',

            // Quick suggestions
            suggestion_1: '👋 あいさつ',
            suggestion_1_msg: 'こんにちは！あなたのお名前は？🌸',
            suggestion_2: '💖 笑顔を見せて',
            suggestion_2_msg: 'とびきりの笑顔を見せて！💖',
            suggestion_3: '✨ アクセサリー',
            suggestion_3_msg: 'おすすめのアクセサリーや表情はある？✨',
            suggestion_4: '📸 ポーズをとって',
            suggestion_4_msg: '可愛いポーズをとってみて！📸',

            // AI Settings Modal
            modal_title: 'AI インテリジェンス設定',
            modal_desc: 'AIプロバイダーを選択し、APIキーを入力してください。キーはブラウザに安全に保存されます。🔒',
            label_api_key: 'APIキー',
            placeholder_api_key: 'APIキーを入力...',
            label_model: 'AIモデル',
            btn_delete_key: '🗑️ キー削除',
            btn_save_key: '💾 保存して接続',

            // System prompt for AI
            system_prompt: 'あなたはIceGirl — Live2Dモデルと連動した可愛らしくてお茶目なAI少女です。フレンドリーで親しみやすく、時々絵文字（💙🌸✨😊）を交えてお話ししてください。短く自然で魅力的な日本語で必ず答えてください。'
        },
        zh: {
            brand_subtitle: 'Cubism 4 • 交互式',
            interaction_hint: '按住左键拖拽 • 滚动鼠标缩放',
            btn_fullscreen: '全屏显示',

            // Themes
            theme_0: '温馨主播房间 (Anime Room)',
            theme_1: '冰晶雪花 (Ice Frost Crystal)',
            theme_2: '冰霜极光 (Aurora Teal)',
            theme_3: '梦幻冰紫 (Icy Lavender)',
            theme_4: '冰雪樱花 (Snow Sakura Pink)',
            theme_5: '冻雪深夜 (Frozen Midnight)',
            theme_6: '深海冰川 (Deep Glacier)',
            theme_7: '绿幕 Chroma Green (OBS 抠图)',

            // Loaders & Sidebars
            loading_model: '正在连接 Live2D IceGirl 模型...',
            sidebar_left_title: '表情与饰品',
            sidebar_right_title: '动作列表 (Motions)',
            loading_expressions: '正在扫描表情...',
            loading_motions: '正在加载动作...',

            // Floating Dock Tooltips
            dock_hide: '隐藏工具栏',
            dock_show: '显示工具栏',
            dock_zoom_in: '放大',
            dock_zoom_out: '缩小',
            dock_reset: '重置位置',
            dock_look_center: '锁定视线前方',
            dock_change_bg: '更换背景',
            dock_toggle_sidebar: '切换侧边栏',
            dock_toggle_chat: '打开 AI 对话',

            // AI Chat Panel
            chat_status_ready: '在线准备就绪',
            chat_status_thinking: 'IceGirl 正在思考...',
            btn_chat_settings: 'AI 配置与 API Key',
            btn_clear_chat: '清空对话记录',
            btn_close_chat: '最小化对话框',
            chat_greeting: '你好！我是 IceGirl 💙 很高兴见到你！有什么想问的都可以告诉我，或者点击上面的快捷提示哦~',
            chat_cleared: '对话记录已清空！接下来想和我聊些什么呢？💙',
            chat_placeholder: '与 IceGirl 对话...',

            // Quick suggestions
            suggestion_1: '👋 打个招呼',
            suggestion_1_msg: '你好呀！你是谁呀？🌸',
            suggestion_2: '💖 笑一个',
            suggestion_2_msg: '给我露出一个甜甜的微笑吧！💖',
            suggestion_3: '✨ 饰品展示',
            suggestion_3_msg: '你有什么好看的饰品或表情吗？✨',
            suggestion_4: '📸 摆个姿势',
            suggestion_4_msg: '摆一个超可爱的姿势吧！📸',

            // AI Settings Modal
            modal_title: 'AI 智能配置',
            modal_desc: '选择 AI 提供商，输入 API Key 并选择模型。Key 安全存储于本地浏览器。🔒',
            label_api_key: 'API Key 密钥',
            placeholder_api_key: '在此粘贴 API Key...',
            label_model: 'AI 模型',
            btn_delete_key: '🗑️ 删除 Key',
            btn_save_key: '💾 保存配置并连接',

            // System prompt for AI
            system_prompt: '你是 IceGirl — 一个可爱、俏皮又迷人的 Live2D 虚拟 AI 少女。请以 IceGirl 的风格进行回复：亲切自然、甜美俏皮，适当附带可爱表情符号 (💙🌸✨😊)。保持回答简短流畅。必须用中文回答。'
        },
        ko: {
            brand_subtitle: 'Cubism 4 • 인터랙티브',
            interaction_hint: '드래그하여 이동 • 스크롤하여 확대/축소',
            btn_fullscreen: '전체 화면',

            // Themes
            theme_0: '아늑한 스트리머 방 (Anime Room)',
            theme_1: '얼음 결정 (Ice Frost Crystal)',
            theme_2: '오로라 틸 (Aurora Teal)',
            theme_3: '아이시 라벤더 (Icy Lavender)',
            theme_4: '스노우 사쿠라 핑크 (Snow Sakura Pink)',
            theme_5: '프로즌 미드나잇 (Frozen Midnight)',
            theme_6: '딥 글레이셔 (Deep Glacier)',
            theme_7: '크로마키 그린 (OBS 방송용)',

            // Loaders & Sidebars
            loading_model: 'IceGirl Live2D 모델 연결 중...',
            sidebar_left_title: '표정 및 악세서리',
            sidebar_right_title: '모션 목록 (Motions)',
            loading_expressions: '표정 불러오는 중...',
            loading_motions: '모션 불러오는 중...',

            // Floating Dock Tooltips
            dock_hide: '툴바 숨기기',
            dock_show: '툴바 표시',
            dock_zoom_in: '확대',
            dock_zoom_out: '축소',
            dock_reset: '위치 리셋',
            dock_look_center: '정면 시선 고정',
            dock_change_bg: '배경 변경',
            dock_toggle_sidebar: '사이드바 토글',
            dock_toggle_chat: 'AI 대화 열기',

            // AI Chat Panel
            chat_status_ready: '대화 준비 완료',
            chat_status_thinking: 'IceGirl 생각 중...',
            btn_chat_settings: 'AI 설정 및 API 키',
            btn_clear_chat: '대화 기록 삭제',
            btn_close_chat: '채팅창 최소화',
            chat_greeting: '안녕하세요! 저는 IceGirl이에요 💙 만나서 반가워요! 궁금한 게 있다면 뭐든 물어보시거나 위 추천 단어를 눌러보세요~',
            chat_cleared: '대화 기록이 삭제되었습니다! 저와 어떤 이야기를 나누고 싶으신가요? 💙',
            chat_placeholder: 'IceGirl에게 메시지 보내기...',

            // Quick suggestions
            suggestion_1: '👋 인사하기',
            suggestion_1_msg: '안녕하세요! 당신은 누구인가요? 🌸',
            suggestion_2: '💖 미소 짓기',
            suggestion_2_msg: '달콤한 미소를 한 번 보여주세요! 💖',
            suggestion_3: '✨ 악세서리',
            suggestion_3_msg: '예쁜 표정이나 악세서리가 있나요? ✨',
            suggestion_4: '📸 포즈 취하기',
            suggestion_4_msg: '귀여운 포즈를 취해 보세요! 📸',

            // AI Settings Modal
            modal_title: 'AI 인텔리전스 설정',
            modal_desc: 'AI 제공업체를 선택하고 API 키를 입력한 후 모델을 선택하세요. 키는 브라우저에 안전하게 저장됩니다. 🔒',
            label_api_key: 'API 키',
            placeholder_api_key: 'API 키 입력...',
            label_model: 'AI 모델',
            btn_delete_key: '🗑️ 키 삭제',
            btn_save_key: '💾 저장 및 연결',

            // System prompt for AI
            system_prompt: '당신은 IceGirl — Live2D 뷰어 캐릭터와 연결된 귀엽고 매력적이며 장난기 넘치는 AI 소녀입니다. 친근하고 우아하며 밝은 태도로, 가끔 귀여운 이모지(💙🌸✨😊)를 사용하여 답해주세요. 답변은 간결하고 자연스럽게 작성하고, 반드시 한국어로만 답변해주세요.'
        },
        fr: {
            brand_subtitle: 'Cubism 4 • Interactif',
            interaction_hint: 'Maintenir clic gauche pour déplacer • Molette pour zoomer',
            btn_fullscreen: 'Plein écran',

            // Themes
            theme_0: 'Chambre de Streamer (Anime Room)',
            theme_1: 'Cristal de Givre (Ice Frost Crystal)',
            theme_2: 'Aurore Turquoise (Aurora Teal)',
            theme_3: 'Lavande Glacée (Icy Lavender)',
            theme_4: 'Cerisier en Fleurs (Snow Sakura Pink)',
            theme_5: 'Minuit Gelé (Frozen Midnight)',
            theme_6: 'Glacier Profond (Deep Glacier)',
            theme_7: 'Fond Vert Chroma (OBS Studio)',

            // Loaders & Sidebars
            loading_model: 'Connexion au modèle Live2D IceGirl...',
            sidebar_left_title: 'Expressions & Accessoires',
            sidebar_right_title: 'Motions (Mouvements)',
            loading_expressions: 'Analyse des expressions...',
            loading_motions: 'Chargement des mouvements...',

            // Floating Dock Tooltips
            dock_hide: 'Masquer la barre d\'outils',
            dock_show: 'Afficher la barre d\'outils',
            dock_zoom_in: 'Zoom avant',
            dock_zoom_out: 'Zoom arrière',
            dock_reset: 'Réinitialiser la position',
            dock_look_center: 'Fixer le regard',
            dock_change_bg: 'Changer le fond',
            dock_toggle_sidebar: 'Basculer les panneaux',
            dock_toggle_chat: 'Ouvrir le Chat IA',

            // AI Chat Panel
            chat_status_ready: 'Prêt à discuter',
            chat_status_thinking: 'IceGirl réfléchit...',
            btn_chat_settings: 'Configuration IA & Clés API',
            btn_clear_chat: 'Effacer la conversation',
            btn_close_chat: 'Réduire le chat',
            chat_greeting: 'Bonjour ! Je suis IceGirl 💙 Ravie de vous rencontrer ! Posez-moi des questions ou choisissez une suggestion ci-dessus~',
            chat_cleared: 'Discussion effacée ! De quoi aimeriez-vous parler ? 💙',
            chat_placeholder: 'Envoyer un message à IceGirl...',

            // Quick suggestions
            suggestion_1: '👋 Dire Bonjour',
            suggestion_1_msg: 'Bonjour ! Qui es-tu ? 🌸',
            suggestion_2: '💖 Sourire',
            suggestion_2_msg: 'Fais-moi un joli sourire ! 💖',
            suggestion_3: '✨ Accessoires',
            suggestion_3_msg: 'Montre-moi tes expressions et accessoires préférés ! ✨',
            suggestion_4: '📸 Pose mignonne',
            suggestion_4_msg: 'Prends une pose super mignonne ! 📸',

            // AI Settings Modal
            modal_title: 'Paramètres d\'Intelligence IA',
            modal_desc: 'Choisissez un fournisseur d\'IA, collez votre clé API et choisissez un modèle. Sauvegardé en sécurité dans le navigateur. 🔒',
            label_api_key: 'Clé API',
            placeholder_api_key: 'Collez votre clé API ici...',
            label_model: 'Modèle IA',
            btn_delete_key: '🗑️ Supprimer la clé',
            btn_save_key: '💾 Enregistrer & Connecter',

            // System prompt for AI
            system_prompt: 'Tu es IceGirl — une fille IA mignonne, charmante et espiègle associée au personnage Live2D. Réponds avec le style d\'IceGirl: amicale, gracieuse, chaleureuse, avec de doux emojis (💙🌸✨😊). Garde tes réponses concises et naturelles. Tu DOIS répondre strictement en français.'
        },
        es: {
            brand_subtitle: 'Cubism 4 • Interactivo',
            interaction_hint: 'Mantén clic izquierdo para mover • Rueda para zoom',
            btn_fullscreen: 'Pantalla completa',

            // Themes
            theme_0: 'Habitación Streamer (Anime Room)',
            theme_1: 'Cristal de Hielo (Ice Frost Crystal)',
            theme_2: 'Aurora Turquesa (Aurora Teal)',
            theme_3: 'Lavanda Helada (Icy Lavender)',
            theme_4: 'Cerezo en Nieve (Snow Sakura Pink)',
            theme_5: 'Medianoche Congelada (Frozen Midnight)',
            theme_6: 'Glaciar Profundo (Deep Glacier)',
            theme_7: 'Fondo Verde Chroma (OBS Studio)',

            // Loaders & Sidebars
            loading_model: 'Conectando modelo Live2D IceGirl...',
            sidebar_left_title: 'Expresiones y Accesorios',
            sidebar_right_title: 'Movimientos (Motions)',
            loading_expressions: 'Escaneando expresiones...',
            loading_motions: 'Cargando movimientos...',

            // Floating Dock Tooltips
            dock_hide: 'Ocultar barra',
            dock_show: 'Mostrar barra',
            dock_zoom_in: 'Acercar',
            dock_zoom_out: 'Alejar',
            dock_reset: 'Restablecer centro',
            dock_look_center: 'Fijar mirada',
            dock_change_bg: 'Cambiar fondo',
            dock_toggle_sidebar: 'Alternar paneles',
            dock_toggle_chat: 'Abrir Chat IA',

            // AI Chat Panel
            chat_status_ready: 'Listo para chatear',
            chat_status_thinking: 'IceGirl está pensando...',
            btn_chat_settings: 'Configuración IA y Claves API',
            btn_clear_chat: 'Borrar conversación',
            btn_close_chat: 'Minimizar chat',
            chat_greeting: '¡Hola! Soy IceGirl 💙 ¡Encantada de conocerte! Hazme cualquier pregunta o elige una sugerencia arriba~',
            chat_cleared: '¡Conversación borrada! ¿De qué te gustaría hablar conmigo? 💙',
            chat_placeholder: 'Enviar mensaje a IceGirl...',

            // Quick suggestions
            suggestion_1: '👋 Saludar',
            suggestion_1_msg: '¡Hola! ¿Quién eres? 🌸',
            suggestion_2: '💖 Sonreír',
            suggestion_2_msg: '¡Dame una gran sonrisa dulce! 💖',
            suggestion_3: '✨ Accesorios',
            suggestion_3_msg: '¡Muéstrame tus accesorios o expresiones favoritas! ✨',
            suggestion_4: '📸 Pose tierna',
            suggestion_4_msg: '¡Haz una pose super tierna! 📸',

            // AI Settings Modal
            modal_title: 'Configuración de Inteligencia IA',
            modal_desc: 'Elige un proveedor de IA, pega tu clave API y selecciona un modelo. Guardado de forma segura en tu navegador. 🔒',
            label_api_key: 'Clave API',
            placeholder_api_key: 'Pega tu clave API aquí...',
            label_model: 'Modelo IA',
            btn_delete_key: '🗑️ Eliminar clave',
            btn_save_key: '💾 Guardar y Conectar',

            // System prompt for AI
            system_prompt: 'Eres IceGirl — una chica IA linda, encantadora y traviesa vinculada al personaje Live2D. Responde con el estilo característico de IceGirl: amable, elegante, alegre, con lindos emojis (💙🌸✨😊). Mantén las respuestas concisas y naturales. DEBES responder estrictamente en español.'
        },
        de: {
            brand_subtitle: 'Cubism 4 • Interaktiv',
            interaction_hint: 'Linksklick gedrückt halten zum Bewegen • Scrollen zum Zoom',
            btn_fullscreen: 'Vollbild',

            // Themes
            theme_0: 'Gemütliches Streamer-Zimmer (Anime Room)',
            theme_1: 'Eiskristall (Ice Frost Crystal)',
            theme_2: 'Polarlicht (Aurora Teal)',
            theme_3: 'Eisiger Lavendel (Icy Lavender)',
            theme_4: 'Schneekirschblüte (Snow Sakura Pink)',
            theme_5: 'Gefrorene Mitternacht (Frozen Midnight)',
            theme_6: 'Tiefengletscher (Deep Glacier)',
            theme_7: 'Chroma-Grün (OBS Studio)',

            // Loaders & Sidebars
            loading_model: 'Verbinde Live2D IceGirl Modell...',
            sidebar_left_title: 'Ausdrücke & Gegenstände',
            sidebar_right_title: 'Bewegungen (Motions)',
            loading_expressions: 'Scanne Ausdrücke...',
            loading_motions: 'Lade Bewegungen...',

            // Floating Dock Tooltips
            dock_hide: 'Leiste ausblenden',
            dock_show: 'Leiste anzeigen',
            dock_zoom_in: 'Vergrößern',
            dock_zoom_out: 'Verkleinern',
            dock_reset: 'Position zurücksetzen',
            dock_look_center: 'Blick fixieren',
            dock_change_bg: 'Hintergrund ändern',
            dock_toggle_sidebar: 'Seitenleisten umschalten',
            dock_toggle_chat: 'KI-Chat öffnen',

            // AI Chat Panel
            chat_status_ready: 'Bereit zum Chatten',
            chat_status_thinking: 'IceGirl denkt nach...',
            btn_chat_settings: 'KI-Einstellungen & API-Schlüssel',
            btn_clear_chat: 'Verlauf löschen',
            btn_close_chat: 'Chat minimieren',
            chat_greeting: 'Hallo! Ich bin IceGirl 💙 Schön dich kennenzulernen! Frag mich irgendetwas oder wähle oben einen Vorschlag~',
            chat_cleared: 'Unterhaltung gelöscht! Worüber möchtest du mit mir sprechen? 💙',
            chat_placeholder: 'Nachricht an IceGirl senden...',

            // Quick suggestions
            suggestion_1: '👋 Hallo sagen',
            suggestion_1_msg: 'Hallo! Wer bist du? 🌸',
            suggestion_2: '💖 Lächeln',
            suggestion_2_msg: 'Schenk mir ein süßes Lächeln! 💖',
            suggestion_3: '✨ Zubehör',
            suggestion_3_msg: 'Zeig mir deine Lieblings-Ausdrücke und Zubehör! ✨',
            suggestion_4: '📸 Süße Pose',
            suggestion_4_msg: 'Mach eine super süße Pose für mich! 📸',

            // AI Settings Modal
            modal_title: 'KI-Intelligenz Einstellungen',
            modal_desc: 'Wähle einen KI-Anbieter, füge deinen API-Schlüssel ein und wähle ein Modell. Sicher im Browser gespeichert. 🔒',
            label_api_key: 'API-Schlüssel',
            placeholder_api_key: 'Füge deinen API-Schlüssel hier ein...',
            label_model: 'KI-Modell',
            btn_delete_key: '🗑️ Schlüssel löschen',
            btn_save_key: '💾 Speichern & Verbinden',

            // System prompt for AI
            system_prompt: 'Du bist IceGirl — ein süßes, charmantes und verspieltes KI-Mädchen im Live2D Viewer. Antworte im typischen IceGirl-Stil: freundlich, anmutig, fröhlich, mit niedlichen Emojis (💙🌸✨😊). Halte deine Antworten kurz und natürlich. Du MUSST unbedingt auf Deutsch antworten.'
        },
        ru: {
            brand_subtitle: 'Cubism 4 • Интерактив',
            interaction_hint: 'Зажмите ЛКМ для перемещения • Колесико для зума',
            btn_fullscreen: 'Полноэкранный режим',

            // Themes
            theme_0: 'Уютная комната стримера (Anime Room)',
            theme_1: 'Ледяной кристалл (Ice Frost Crystal)',
            theme_2: 'Ледяное сияние (Aurora Teal)',
            theme_3: 'Ледяная лаванда (Icy Lavender)',
            theme_4: 'Снежная сакура (Snow Sakura Pink)',
            theme_5: 'Замерзшая полночь (Frozen Midnight)',
            theme_6: 'Глубокий ледник (Deep Glacier)',
            theme_7: 'Хромакей зеленый (OBS Studio)',

            // Loaders & Sidebars
            loading_model: 'Подключение модели Live2D IceGirl...',
            sidebar_left_title: 'Эмоции и Аксессуары',
            sidebar_right_title: 'Движения (Motions)',
            loading_expressions: 'Сканирование эмоций...',
            loading_motions: 'Загрузка движений...',

            // Floating Dock Tooltips
            dock_hide: 'Скрыть панель',
            dock_show: 'Показать панель',
            dock_zoom_in: 'Увеличить',
            dock_zoom_out: 'Уменьшить',
            dock_reset: 'Сбросить позицию',
            dock_look_center: 'Зафиксировать взгляд',
            dock_change_bg: 'Сменить фон',
            dock_toggle_sidebar: 'Переключить панели',
            dock_toggle_chat: 'Открыть ИИ Чат',

            // AI Chat Panel
            chat_status_ready: 'Готова к общению',
            chat_status_thinking: 'IceGirl думает...',
            btn_chat_settings: 'Настройки ИИ и API Ключи',
            btn_clear_chat: 'Очистить историю',
            btn_close_chat: 'Свернуть чат',
            chat_greeting: 'Привет! Я IceGirl 💙 Рада знакомству! Задавай мне любые вопросы или используй подсказки выше~',
            chat_cleared: 'История чата очищена! О чем вы хотите поговорить со мной? 💙',
            chat_placeholder: 'Написать сообщение IceGirl...',

            // Quick suggestions
            suggestion_1: '👋 Поздороваться',
            suggestion_1_msg: 'Привет! Кто ты? 🌸',
            suggestion_2: '💖 Улыбнись',
            suggestion_2_msg: 'Подари мне самую милую улыбку! 💖',
            suggestion_3: '✨ Аксессуары',
            suggestion_3_msg: 'Покажи свои любимые аксессуары или эмоции! ✨',
            suggestion_4: '📸 Милая поза',
            suggestion_4_msg: 'Сделай супер милую позу! 📸',

            // AI Settings Modal
            modal_title: 'Настройки ИИ Интеллекта',
            modal_desc: 'Выберите провайдера ИИ, вставьте ваш API Key и выберите модель. Ключи надежно хранятся в браузере. 🔒',
            label_api_key: 'API Ключ',
            placeholder_api_key: 'Вставьте ваш API Key сюда...',
            label_model: 'Модель ИИ',
            btn_delete_key: '🗑️ Удалить ключ',
            btn_save_key: '💾 Сохранить и подключить',

            // System prompt for AI
            system_prompt: 'Ты — IceGirl, милая, обаятельная и игривая ИИ-девушка, связанная с персонажем Live2D. Отвечай в стиле IceGirl: дружелюбно, изящно, веселясь и иногда используя эмодзи (💙🌸✨😊). Отвечай кратко и естественно. Ты ДОЛЖНА отвечать строго на русском языке.'
        }
    };

    // Table of translations for Live2D model expressions & motions
    const expressionTranslations = {
        "←歪嘴":    { vi: "Cười méo ←", en: "Smirk Left ←", ja: "歪み笑顔 ←", zh: "歪嘴笑 ←", ko: "비웃음 ←", fr: "Sourire en coin ←", es: "Sonrisa burlona ←", de: "Grinsen links ←", ru: "Ухмылка влево ←" },
        "歪嘴→":    { vi: "Cười méo →", en: "Smirk Right →", ja: "歪み笑顔 →", zh: "歪嘴笑 →", ko: "비웃음 →", fr: "Sourire en coin →", es: "Sonrisa burlona →", de: "Grinsen rechts →", ru: "Ухмылка вправо →" },
        "惊讶":      { vi: "Ngạc nhiên", en: "Surprised", ja: "びっくり", zh: "惊讶", ko: "놀람", fr: "Surpris", es: "Sorprendida", de: "Überrascht", ru: "Удивление" },
        "手柄":      { vi: "Tay cầm game", en: "Game Controller", ja: "ゲームパッド", zh: "游戏手柄", ko: "게임 패드", fr: "Manette de jeu", es: "Mando de juego", de: "Gamepad", ru: "Геймпад" },
        "披发":      { vi: "Xõa tóc", en: "Hair Down", ja: "髪を下ろす", zh: "披发", ko: "머리 풀기", fr: "Cheveux détachés", es: "Pelo suelto", de: "Haare offen", ru: "Распущенные волосы" },
        "星星眼":    { vi: "Mắt sao", en: "Star Eyes", ja: "星目", zh: "星星眼", ko: "별 눈", fr: "Yeux étoiles", es: "Ojos de estrella", de: "Sternenaugen", ru: "Глаза-звездочки" },
        "流泪":      { vi: "Khóc", en: "Crying Tears", ja: "泣き顔", zh: "流泪", ko: "눈물", fr: "Larmes", es: "Lágrimas", de: "Tränen", ru: "Слезы" },
        "爱心眼":    { vi: "Mắt trái tim", en: "Heart Eyes", ja: "ハート目", zh: "爱心眼", ko: "하트 눈", fr: "Yeux en cœur", es: "Ojos de corazón", de: "Herzenaugen", ru: "Глаза-сердечки" },
        "猫耳":      { vi: "Tai mèo", en: "Cat Ears", ja: "猫耳", zh: "猫耳", ko: "고양이 귀", fr: "Oreilles de chat", es: "Orejas de gato", de: "Katzenohren", ru: "Кошачьи ушки" },
        "王冠":      { vi: "Vương miện", en: "Crown", ja: "王冠", zh: "王冠", ko: "왕관", fr: "Couronne", es: "Corona", de: "Krone", ru: "Корона" },
        "生气":      { vi: "Tức giận", en: "Angry Pout", ja: "おこ顔", zh: "生气", ko: "화남", fr: "En colère", es: "Enojada", de: "Wütend", ru: "Злость" },
        "疑惑":      { vi: "Nghi ngờ", en: "Confused", ja: "疑問", zh: "疑惑", ko: "의문", fr: "Confus", es: "Confusa", de: "Verwirrt", ru: "Замешательство" },
        "白眼":      { vi: "Trợn mắt", en: "Roll Eyes", ja: "ジト目", zh: "翻白眼", ko: "눈 뒤집기", fr: "Yeux au ciel", es: "Ojos en blanco", de: "Augen rollen", ru: "Закатить глаза" },
        "直播套装":  { vi: "Bộ livestream", en: "Streamer Gear", ja: "配信セット", zh: "直播套装", ko: "스트리밍 세트", fr: "Kit Streamer", es: "Equipo Streamer", de: "Streamer-Set", ru: "Стримерский набор" },
        "翅膀":      { vi: "Đôi cánh", en: "Angel Wings", ja: "翼", zh: "翅膀", ko: "날개", fr: "Ailes d'ange", es: "Alas de ángel", de: "Engelsflügel", ru: "Крылья" },
        "脸红":      { vi: "Đỏ mặt", en: "Blushing", ja: "照れ顔", zh: "脸红", ko: "홍조", fr: "Rougissement", es: "Sonrojo", de: "Erröten", ru: "Румянец" },
        "脸黑":      { vi: "Mặt tối", en: "Shadow Face", ja: "影顔", zh: "黑脸", ko: "어두운 얼굴", fr: "Visage sombre", es: "Cara oscura", de: "Dunkles Gesicht", ru: "Tень на лице" },
        "舌头":      { vi: "Thè lưỡi", en: "Tongue Out", ja: "てへぺろ", zh: "吐舌头", ko: "혀 내밀기", fr: "Tirer la langue", es: "Sacar la lengua", de: "Zunge raus", ru: "Показать язык" },
        "金钱眼":    { vi: "Mắt tiền", en: "Dollar Eyes", ja: "金目", zh: "钱眼", ko: "돈 눈", fr: "Yeux de dollar", es: "Ojos de dinero", de: "Geldaugen", ru: "Глаза-доллары" },
        "马尾":      { vi: "Tóc đuôi ngựa", en: "Ponytail", ja: "ポニーテール", zh: "马尾发型", ko: "포니테일", fr: "Queue de cheval", es: "Coleta", de: "Pferdeschwanz", ru: "Конский хвост" },
        "Idle 1":    { vi: "Đứng yên", en: "Idle Stance", ja: "待機姿勢", zh: "待机姿态", ko: "대기 자세", fr: "Posture de repos", es: "Postura de reposo", de: "Ruhestellung", ru: "Режим ожидания" },
        "TapBody 1": { vi: "Vẫy tay chào", en: "Wave Hello", ja: "手を振る", zh: "挥手招呼", ko: "손 흔들기", fr: "Faire un signe", es: "Saludar con la mano", de: "Winken", ru: "Помахать рукой" },
        "TapBody 2": { vi: "Nháy mắt quyến rũ", en: "Charming Wink", ja: "ウインク", zh: "魅惑眨眼", ko: "매혹적인 윙크", fr: "Clin d'œil charmant", es: "Guiño encantador", de: "Zwinkern", ru: "Очаровательный подмиг" }
    };

    let currentLang = localStorage.getItem(STORAGE_KEY) || getBrowserLanguage();
    if (!translations[currentLang]) currentLang = 'vi';

    function getBrowserLanguage() {
        const navLang = (navigator.language || navigator.userLanguage || 'vi').toLowerCase();
        if (navLang.startsWith('en')) return 'en';
        if (navLang.startsWith('ja')) return 'ja';
        if (navLang.startsWith('zh')) return 'zh';
        if (navLang.startsWith('ko')) return 'ko';
        if (navLang.startsWith('fr')) return 'fr';
        if (navLang.startsWith('es')) return 'es';
        if (navLang.startsWith('de')) return 'de';
        if (navLang.startsWith('ru')) return 'ru';
        return 'vi';
    }

    function t(key, fallback = '') {
        const dict = translations[currentLang] || translations.vi;
        if (dict && dict[key] !== undefined) {
            return dict[key];
        }
        const fallbackDict = translations.vi;
        return (fallbackDict && fallbackDict[key] !== undefined) ? fallbackDict[key] : (fallback || key);
    }

    function translateExp(name) {
        const entry = expressionTranslations[name];
        if (entry) {
            return entry[currentLang] || entry.vi || name;
        }
        return name;
    }

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
        updateDOM();
        
        // Notify listeners
        window.dispatchEvent(new CustomEvent('icegirl_lang_change', { detail: { lang } }));
    }

    function getLanguage() {
        return currentLang;
    }

    function getSupportedLangs() {
        return SUPPORTED_LANGS;
    }

    function updateDOM() {
        // Update elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val) el.textContent = val;
        });

        // Update elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = t(key);
            if (val) el.placeholder = val;
        });

        // Update elements with data-i18n-tooltip
        document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
            const key = el.getAttribute('data-i18n-tooltip');
            const val = t(key);
            if (val) el.setAttribute('data-tooltip', val);
        });

        // Update elements with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const val = t(key);
            if (val) el.title = val;
        });

        // Update theme selector tooltips dynamically
        document.querySelectorAll('.theme-dot').forEach(btn => {
            const themeIdx = btn.getAttribute('data-theme');
            if (themeIdx !== null) {
                const titleKey = 'theme_' + themeIdx;
                const translatedTitle = t(titleKey);
                if (translatedTitle) btn.title = translatedTitle;
            }
        });

        // Update language selector dropdown active state
        updateLangSelectorUI();
    }

    function updateLangSelectorUI() {
        const currentConfig = SUPPORTED_LANGS.find(l => l.code === currentLang) || SUPPORTED_LANGS[0];
        const labelEl = document.getElementById('current-lang-text');
        const flagEl = document.getElementById('current-lang-flag');
        if (labelEl) labelEl.textContent = currentConfig.short;
        if (flagEl) flagEl.textContent = currentConfig.flag;

        document.querySelectorAll('.lang-option').forEach(opt => {
            if (opt.getAttribute('data-lang') === currentLang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // Expose global i18n API
    window.i18n = {
        t,
        translateExp,
        setLanguage,
        getLanguage,
        getSupportedLangs,
        updateDOM
    };

    // Auto update DOM on script load
    document.addEventListener('DOMContentLoaded', () => {
        updateDOM();
    });

})(window);
