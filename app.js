let app;
let model;
let lookLocked = false; // Khi bật: khoá nhìn thẳng, không theo chuột
let _currentMotionGroup = 'Idle'; // Theo dõi nhóm motion đang chạy

// Parameters chỉ được điều khiển bởi TapBody motions, KHÔNG bởi Idle.
// Khi Idle đang chạy, phải reset chúng về giá trị mặc định.
const TAP_BODY_PARAMS = [
    { id: 'Param58', defaultVal: 0 },  // Hướng vẫy tay (HuiShou)
    { id: 'Param59', defaultVal: 0 },  // Giơ tay lên/xuống (HuiShou)
    { id: 'Param60', defaultVal: 0 },  // Nháy mắt quyến rũ (MeiYan)
];

const modelUrl = './IceGIrl Live2D/IceGirl.model3.json?v=' + Date.now();

// Bảng dịch tên biểu cảm sang tiếng Việt
const nameTranslation = {
    "←歪嘴":    "Cười méo ←",
    "歪嘴→":    "Cười méo →",
    "惊讶":      "Ngạc nhiên",
    "手柄":      "Tay cầm game",
    "披发":      "Xõa tóc",
    "星星眼":    "Mắt sao",
    "流泪":      "Khóc",
    "爱心眼":    "Mắt trái tim",
    "猫耳":      "Tai mèo",
    "王冠":      "Vương miện",
    "生气":      "Tức giận",
    "疑惑":      "Nghi ngờ",
    "白眼":      "Trợn mắt",
    "直播套装":  "Bộ livestream",
    "翅膀":      "Đôi cánh",
    "脸红":      "Đỏ mặt",
    "脸黑":      "Mặt tối",
    "舌头":      "Thè lưỡi",
    "金钱眼":    "Mắt tiền",
    "马尾":      "Tóc đuôi ngựa",
    "Idle 1":    "Đứng yên",
    "TapBody 1": "Vẫy tay chào",
    "TapBody 2": "Nháy mắt quyến rũ"
};

function vn(name) {
    if (window.i18n && typeof window.i18n.translateExp === 'function') {
        return window.i18n.translateExp(name);
    }
    return nameTranslation[name] || name;
}

function triggerExpressionByName(expName) {
    if (!model) return;
    try {
        model.expression(expName);
    } catch (_) {}
}

const accessoryKeys = ["猫耳", "王冠", "翅膀", "手柄", "直播套装", "马尾", "披发"];

const preloadedParams = {};
const activeToggles = {};

document.addEventListener('DOMContentLoaded', async () => {
    setupPixi();
    await loadModel();
    setupControls();
    hideLoader();
});

window.addEventListener('icegirl_lang_change', () => {
    if (savedExpressions && savedExpressions.length > 0) {
        populateSidebars(savedExpressions);
    }
});

function setupPixi() {
    const container = document.getElementById('canvas-container');

    app = new PIXI.Application({
        view: document.getElementById('live2d-canvas'),
        autoStart: true,
        resizeTo: container,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
    });

    app.renderer.on('prerender', () => {
        const gl = app.renderer.gl;
        if (!gl) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    });

    app.renderer.on('postrender', () => {
        const gl = app.renderer.gl;
        if (!gl) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.stencilMask(0xFF);
        gl.disable(gl.STENCIL_TEST);
    });

    window.addEventListener('resize', () => {
        if (model) fitModel();
    });

    app.ticker.add(() => {
        if (!model) return;
        
        if (lookLocked) {
            if (model.internalModel?.focusController) {
                model.internalModel.focusController.focus(0, 0);
            } else {
                model.focus(window.innerWidth / 2, window.innerHeight / 2);
            }
        }
        
        if (_currentMotionGroup === 'Idle') {
            const core = model.internalModel.coreModel;
            TAP_BODY_PARAMS.forEach(p => {
                try {
                    const currentVal = core.getParameterValueById(p.id);
                    if (Math.abs(currentVal - p.defaultVal) > 0.001) {
                        const lerped = currentVal + (p.defaultVal - currentVal) * 0.15;
                        core.setParameterValueById(p.id, lerped);
                    }
                } catch (_) {}
            });
        }
        
        Object.entries(activeToggles).forEach(([expName, isOn]) => {
            if (!isOn) return;
            const params = preloadedParams[expName];
            if (!params) return;
            params.forEach(p => {
                try {
                    model.internalModel.coreModel.setParameterValueById(p.Id, p.Value);
                } catch (_) {}
            });
        });
    });
}

async function loadModel() {
    try {
        console.log("Đang tải mô hình:", modelUrl);
        model = await PIXI.live2d.Live2DModel.from(modelUrl);
        app.stage.addChild(model);
        fitModel();
        setupModelInteraction();

        if (model.internalModel && model.internalModel.motionManager) {
            model.internalModel.motionManager.idleMotionGroup = "Idle";
        }

        model.on('motion', (group, index) => {
            _currentMotionGroup = group;
            document.querySelectorAll('#motions-container .action-btn').forEach(b => b.classList.remove('active'));
            
            const targetBtn = document.getElementById(`btn-motion-${group}-${index}`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
        });

        const settings = model.internalModel.settings;
        const expressions =
            (settings.json?.FileReferences?.Expressions) ||
            settings.expressions || settings.Expressions || [];

        savedExpressions = expressions;

        await preloadAccessoryParams(expressions);

        initializeAccessoryStates();

        populateSidebars(expressions);
        console.log("Tải mô hình thành công!");
    } catch (error) {
        console.error("Lỗi tải mô hình:", error);
        document.querySelector('.loading-text').innerText = "Lỗi tải mô hình. Kiểm tra console.";
    }
}

async function preloadAccessoryParams(expressions) {
    const accessoryExps = expressions.filter(exp => {
        const name = exp.Name || exp.name || "";
        return accessoryKeys.some(k => name.includes(k));
    });

    await Promise.all(accessoryExps.map(async (exp) => {
        const name = exp.Name || exp.name || "";
        const file = exp.File || exp.file || "";
        if (!file) return;

        try {
            const resp = await fetch('./IceGIrl Live2D/' + encodeURIComponent(file));
            const data = await resp.json();
            if (data?.Parameters) {
                preloadedParams[name] = data.Parameters.map(p => ({
                    Id: p.Id || p.id,
                    Value: p.Value !== undefined ? p.Value : 1.0
                }));
                activeToggles[name] = false;
                console.log("Pre-load thành công:", name, preloadedParams[name]);
            }
        } catch (err) {
            console.warn("Pre-load thất bại:", name, err);
        }
    }));
}

function initializeAccessoryStates() {
    if (!model || !model.internalModel || !model.internalModel.coreModel) return;

    Object.keys(preloadedParams).forEach(name => {
        const params = preloadedParams[name];
        if (!params || params.length === 0) return;

        const isCurrentlyActive = params.every(p => {
            try {
                const val = model.internalModel.coreModel.getParameterValueById(p.Id);
                if (p.Value > 0) {
                    return val > 0.5;
                } else if (p.Value < 0) {
                    return val < -0.5;
                } else {
                    return Math.abs(val) < 0.1;
                }
            } catch (e) {
                return false;
            }
        });

        activeToggles[name] = isCurrentlyActive;
    });
}

function fitModel() {
    if (!model) return;
    model.anchor.set(0.5, 0.5);
    const scale = (window.innerHeight * 0.85) / model.height;
    model.scale.set(scale);
    model.x = window.innerWidth / 2;
    model.y = window.innerHeight / 2 + (model.height * scale * 0.05);
}

function setupModelInteraction() {
    if (!model) return;
    let isDragging = false, startX, startY, modelStartX, modelStartY;
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const onMouseMoveFocus = (e) => {
        if (!isDragging && !lookLocked) model.focus(e.clientX, e.clientY);
    };

    const onMouseDown = (e) => {
        if (e.button === 0) {
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            modelStartX = model.x; modelStartY = model.y;
            container.style.cursor = 'grabbing';
        }
    };

    const onWindowMouseMove = (e) => {
        if (isDragging) {
            model.x = modelStartX + (e.clientX - startX);
            model.y = modelStartY + (e.clientY - startY);
        }
    };

    const onWindowMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'grab';
        }
    };

    const onWheelZoom = (e) => {
        e.preventDefault();
        const speed = 0.08;
        let s = model.scale.x + (e.deltaY < 0 ? 1 : -1) * model.scale.x * speed;
        s = Math.max(0.05, Math.min(3.0, s));
        model.scale.set(s);
    };

    container.addEventListener('mousemove', onMouseMoveFocus);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    container.addEventListener('wheel', onWheelZoom, { passive: false });
}

function applyLookStraight() {
    if (!model) return;
    lookLocked = !lookLocked;

    if (lookLocked) {
        if (model.internalModel?.focusController) {
            model.internalModel.focusController.focus(0, 0);
        } else {
            model.focus(window.innerWidth / 2, window.innerHeight / 2);
        }
        if (model.internalModel?.coreModel) {
            const core = model.internalModel.coreModel;
            ['ParamAngleX','ParamAngleY','ParamAngleZ','ParamEyeBallX','ParamEyeBallY','ParamBodyAngleX','ParamBodyAngleY','ParamBodyAngleZ'].forEach(id => {
                try { core.setParameterValueById(id, 0); } catch (_) {}
            });
        }
    } else {
        if (_currentMotionGroup !== 'Idle') {
            _currentMotionGroup = 'Idle';
            try { model.motion('Idle', 0); } catch (_) {}
        }
    }

    const sidebarLookBtn = document.getElementById('btn-look-straight-sidebar');
    if (sidebarLookBtn) {
        sidebarLookBtn.classList.toggle('active', lookLocked);
    }
    const dockLookBtn = document.getElementById('btn-look-center');
    if (dockLookBtn) {
        dockLookBtn.style.color = lookLocked ? 'var(--primary)' : '';
        dockLookBtn.classList.toggle('active', lookLocked);
    }
}

function populateSidebars(expressions) {
    const exprContainer = document.getElementById('expressions-container');
    exprContainer.innerHTML = '';

    const faceExps      = expressions.filter(exp => !accessoryKeys.some(k => (exp.Name || exp.name || "").includes(k)));
    const accessoryExps = expressions.filter(exp =>  accessoryKeys.some(k => (exp.Name || exp.name || "").includes(k)));

    if (faceExps.length > 0) {
        const h = document.createElement('h3');
        h.innerText = "🎭 " + (window.i18n ? window.i18n.t('sidebar_left_title') : "Biểu cảm khuôn mặt");
        exprContainer.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'btn-grid';
        grid.id = 'face-grid';

        const resetBtn = createBtn(window.i18n ? window.i18n.t('dock_reset') : 'Mặc định', true, () => {
            document.querySelectorAll('#face-grid .action-btn').forEach(b => b.classList.remove('active'));
            resetBtn.classList.add('active');
            if (model.expressionManager) model.expression();
        });
        resetBtn.id = 'btn-face-default';
        grid.appendChild(resetBtn);

        faceExps.forEach((exp, idx) => {
            const rawName = exp.Name || exp.name || "";
            const translatedName = vn(rawName);
            const btn = createBtn(translatedName, false, () => {
                document.querySelectorAll('#face-grid .action-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const globalIndex = expressions.indexOf(exp);
                try { model.expression(globalIndex); } catch (_) { model.expression(exp.File || exp.file || rawName); }
            });
            grid.appendChild(btn);
        });

        exprContainer.appendChild(grid);
    }

    if (accessoryExps.length > 0) {
        const h = document.createElement('h3');
        h.innerText = "✨ " + (window.i18n ? window.i18n.t('suggestion_3') : "Phụ kiện & Trang phục");
        exprContainer.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'btn-grid';

        accessoryExps.forEach(exp => {
            const rawName = exp.Name || exp.name || "";
            const translatedName = vn(rawName);
            const isReady = !!preloadedParams[rawName];
            const isActive = activeToggles[rawName] || false;

            const btn = createBtn(translatedName + (isReady ? '' : ' ⚠️'), isActive, () => {
                if (!preloadedParams[rawName]) return;
                activeToggles[rawName] = !activeToggles[rawName];
                btn.classList.toggle('active', activeToggles[rawName]);
                
                if (!activeToggles[rawName]) {
                    const params = preloadedParams[rawName];
                    if (params) {
                        params.forEach(p => {
                            try {
                                model.internalModel.coreModel.setParameterValueById(p.Id, 0);
                            } catch (_) {}
                        });
                    }
                }
            });
            grid.appendChild(btn);
        });

        exprContainer.appendChild(grid);
    }

    const motionContainer = document.getElementById('motions-container');
    motionContainer.innerHTML = '';

    const settings = model.internalModel.settings;
    const motionGroups =
        (settings.json?.FileReferences?.Motions) ||
        settings.motions || settings.Motions || {};

    const motionKeys = Object.keys(motionGroups);
    if (motionKeys.length === 0) return;

    const grid = document.createElement('div');
    grid.className = 'btn-grid';
    grid.id = 'motions-grid';

    function playMotionAndReturn(group, index) {
        _currentMotionGroup = group;
        model.motion(group, index).then(() => {
            _currentMotionGroup = 'Idle';
        }).catch(() => {
            _currentMotionGroup = 'Idle';
        });
    }

    const lookBtnText = (window.i18n ? window.i18n.t('dock_look_center') : 'Nhìn thẳng') + ' 🎯';
    const lookBtn = createBtn(lookBtnText, lookLocked, () => {
        applyLookStraight();
    });
    lookBtn.id = 'btn-look-straight-sidebar';
    grid.appendChild(lookBtn);

    const randomBtn = createBtn('🎲', false, () => {
        const activeGroups = motionKeys.filter(k => k !== "Idle");
        if (activeGroups.length > 0) {
            const randomGroup = activeGroups[Math.floor(Math.random() * activeGroups.length)];
            const list = motionGroups[randomGroup];
            if (list && list.length > 0) {
                const randomIndex = Math.floor(Math.random() * list.length);
                playMotionAndReturn(randomGroup, randomIndex);
            }
        }
    });
    grid.appendChild(randomBtn);

    motionKeys.forEach(group => {
        const list = motionGroups[group];
        if (Array.isArray(list)) {
            list.forEach((m, idx) => {
                const rawLabel = `${group} ${idx + 1}`;
                const translatedLabel = vn(rawLabel);
                const btn = createBtn(translatedLabel, false, () => {
                    playMotionAndReturn(group, idx);
                });
                btn.id = `btn-motion-${group}-${idx}`;
                grid.appendChild(btn);
            });
        }
    });

    motionContainer.appendChild(grid);
}

function createBtn(text, active, onClick) {
    const btn = document.createElement('button');
    btn.className = `action-btn${active ? ' active' : ''}`;
    btn.innerText = text;
    btn.onclick = onClick;
    return btn;
}

function setupControls() {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
        if (!model) return;
        let s = model.scale.x * 1.15;
        model.scale.set(Math.min(3.0, s));
    });

    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
        if (!model) return;
        let s = model.scale.x * 0.85;
        model.scale.set(Math.max(0.05, s));
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
        if (model) fitModel();
    });

    document.getElementById('btn-look-center')?.addEventListener('click', () => {
        applyLookStraight();
    });

    const controlPanel = document.getElementById('control-panel');
    const btnHideDock = document.getElementById('btn-hide-dock');
    const btnShowDock = document.getElementById('btn-show-dock');

    btnHideDock?.addEventListener('click', () => {
        controlPanel?.classList.add('collapsed');
        btnShowDock?.classList.add('visible');
    });

    btnShowDock?.addEventListener('click', () => {
        controlPanel?.classList.remove('collapsed');
        btnShowDock?.classList.remove('visible');
    });

    const leftSidebar = document.getElementById('sidebar-left');
    const rightSidebar = document.getElementById('sidebar-right');
    const showLeftBtn = document.getElementById('btn-show-left-sidebar');
    const showRightBtn = document.getElementById('btn-show-right-sidebar');

    function setLeftSidebarCollapsed(collapsed) {
        if (collapsed) {
            leftSidebar?.classList.add('collapsed');
            showLeftBtn?.classList.add('visible');
        } else {
            leftSidebar?.classList.remove('collapsed');
            showLeftBtn?.classList.remove('visible');
        }
    }

    function setRightSidebarCollapsed(collapsed) {
        if (collapsed) {
            rightSidebar?.classList.add('collapsed');
            showRightBtn?.classList.add('visible');
        } else {
            rightSidebar?.classList.remove('collapsed');
            showRightBtn?.classList.remove('visible');
        }
    }

    document.getElementById('btn-close-left-sidebar')?.addEventListener('click', () => setLeftSidebarCollapsed(true));
    document.getElementById('btn-close-right-sidebar')?.addEventListener('click', () => setRightSidebarCollapsed(true));
    
    showLeftBtn?.addEventListener('click', () => setLeftSidebarCollapsed(false));
    showRightBtn?.addEventListener('click', () => setRightSidebarCollapsed(false));

    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
        const isLeftCollapsed = leftSidebar?.classList.contains('collapsed');
        const isRightCollapsed = rightSidebar?.classList.contains('collapsed');
        const shouldCollapseAll = !isLeftCollapsed || !isRightCollapsed;
        
        setLeftSidebarCollapsed(shouldCollapseAll);
        setRightSidebarCollapsed(shouldCollapseAll);
    });

    const langSelector = document.getElementById('lang-selector');
    const btnLangToggle = document.getElementById('btn-lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');

    if (btnLangToggle && langDropdown) {
        btnLangToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langSelector.classList.contains('open');
            if (isOpen) {
                langSelector.classList.remove('open');
                langDropdown.classList.add('hidden');
            } else {
                langSelector.classList.add('open');
                langDropdown.classList.remove('hidden');
            }
        });

        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = opt.getAttribute('data-lang');
                if (window.i18n && selectedLang) {
                    window.i18n.setLanguage(selectedLang);
                }
                langSelector.classList.remove('open');
                langDropdown.classList.add('hidden');
            });
        });

        document.addEventListener('click', (e) => {
            if (langSelector && !langSelector.contains(e.target)) {
                langSelector.classList.remove('open');
                langDropdown.classList.add('hidden');
            }
        });
    }

    const bgs = [
        'url("assets/room_bg.png") center/cover no-repeat fixed',
        'radial-gradient(ellipse at 40% 30%, #0d2238 0%, #061220 60%, #020912 100%)',
        'radial-gradient(ellipse at 30% 20%, #0a2e38 0%, #041820 60%, #020b10 100%)',
        'radial-gradient(ellipse at 30% 20%, #201335 0%, #0e081c 60%, #07030f 100%)',
        'radial-gradient(ellipse at 30% 20%, #2a0e22 0%, #170614 60%, #0a0208 100%)',
        'radial-gradient(ellipse at 40% 30%, #0f172a 0%, #080e1a 60%, #02060d 100%)',
        'radial-gradient(ellipse at 50% 20%, #072b42 0%, #031420 60%, #010810 100%)',
        '#00ff00'
    ];
    let bgIdx = 0;

    const setBackground = (idx) => {
        bgIdx = idx % bgs.length;
        document.body.style.background = bgs[bgIdx];
        document.querySelectorAll('.theme-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === bgIdx);
        });
    };

    document.querySelectorAll('.theme-dot').forEach((dot, idx) => {
        dot.addEventListener('click', () => setBackground(idx));
    });

    document.getElementById('btn-change-bg')?.addEventListener('click', () => {
        setBackground(bgIdx + 1);
    });

    setBackground(0);

    const btnFullscreen = document.getElementById('btn-fullscreen-header');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Lỗi fullscreen:", err);
                });
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }

    // Phím tắt Tab để toggle Sidebars
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            document.getElementById('btn-toggle-sidebar')?.click();
        }
    });
}

// 9. Ẩn màn hình chờ
function hideLoader() {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => el.style.display = 'none', 500);
}
