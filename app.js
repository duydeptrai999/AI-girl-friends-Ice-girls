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
    return nameTranslation[name] || name;
}

// Helper kích hoạt biểu cảm bằng tên từ module bên ngoài (vd: chat.js)
function triggerExpressionByName(expName) {
    if (!model) return;
    try {
        model.expression(expName);
    } catch (_) {}
}

// Danh sách tên phụ kiện (sẽ toggle độc lập, không loại trừ lẫn nhau)
const accessoryKeys = ["猫耳", "王冠", "翅膀", "手柄", "直播套装", "马尾", "披发"];

// Lưu trữ params đã pre-load: { expName: [{Id, Value}] }
const preloadedParams = {};
// Trạng thái bật/tắt của từng phụ kiện
const activeToggles = {};

document.addEventListener('DOMContentLoaded', async () => {
    setupPixi();
    await loadModel();
    setupControls();
    hideLoader();
});

// 1. Khởi tạo PixiJS
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

    // ===== RENDER PIPELINE FIX =====
    // Chỉ clear screen FBO trước mỗi frame. KHÔNG đụng FBO nội bộ của Live2D.
    app.renderer.on('prerender', () => {
        const gl = app.renderer.gl;
        if (!gl) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    });

    // Sau khi render xong: chỉ reset stencil state, KHÔNG clear FBO
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

    // Ticker: Mỗi frame — áp phụ kiện + reset arm params khi Idle
    app.ticker.add(() => {
        if (!model) return;
        
        // Khoá nhìn thẳng (Chính diện 100%, không bị nhìn lệch)
        if (lookLocked) {
            if (model.internalModel?.focusController) {
                model.internalModel.focusController.focus(0, 0);
            } else {
                model.focus(window.innerWidth / 2, window.innerHeight / 2);
            }
        }
        
        // ===== FIX TÀN ẢNH TAY VẪY =====
        // ROOT CAUSE: Idle motion (DaiJi) KHÔNG điều khiển Param58/59/60.
        // Sau khi TapBody motion kết thúc, các param này giữ giá trị cuối
        // → tay bị đóng băng ở vị trí vẫy.
        // FIX: Mỗi frame khi Idle đang chạy, ép Param58/59/60 về giá trị mặc định.
        if (_currentMotionGroup === 'Idle') {
            const core = model.internalModel.coreModel;
            TAP_BODY_PARAMS.forEach(p => {
                try {
                    const currentVal = core.getParameterValueById(p.id);
                    if (Math.abs(currentVal - p.defaultVal) > 0.001) {
                        // Fade mượt về default thay vì snap đột ngột
                        const lerped = currentVal + (p.defaultVal - currentVal) * 0.15;
                        core.setParameterValueById(p.id, lerped);
                    }
                } catch (_) {}
            });
        }
        
        // Áp phụ kiện đang bật
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

// 2. Tải mô hình Live2D
async function loadModel() {
    try {
        console.log("Đang tải mô hình:", modelUrl);
        model = await PIXI.live2d.Live2DModel.from(modelUrl);
        app.stage.addChild(model);
        fitModel();
        setupModelInteraction();

        // Cấu hình nhóm Idle motion mặc định là "Idle"
        if (model.internalModel && model.internalModel.motionManager) {
            model.internalModel.motionManager.idleMotionGroup = "Idle";
        }

        // Lắng nghe sự kiện chuyển động của model để đồng bộ nút bấm trên giao diện
        model.on('motion', (group, index) => {
            console.log(`Chuyển động thực tế đang chạy: Group=${group}, Index=${index}`);
            _currentMotionGroup = group; // Cập nhật nhóm motion đang chạy
            document.querySelectorAll('#motions-container .action-btn').forEach(b => b.classList.remove('active'));
            
            const targetBtn = document.getElementById(`btn-motion-${group}-${index}`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
        });

        // Pre-load tất cả params của phụ kiện ngay sau khi model sẵn sàng
        const settings = model.internalModel.settings;
        const expressions =
            (settings.json?.FileReferences?.Expressions) ||
            settings.expressions || settings.Expressions || [];

        await preloadAccessoryParams(expressions);

        // Khởi tạo trạng thái ban đầu của phụ kiện dựa trên các parameter hiện tại của model
        initializeAccessoryStates();

        populateSidebars(expressions);
        console.log("Tải mô hình thành công!");
    } catch (error) {
        console.error("Lỗi tải mô hình:", error);
        document.querySelector('.loading-text').innerText = "Lỗi tải mô hình. Kiểm tra console.";
    }
}

// 3. Pre-load params của tất cả phụ kiện
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
                activeToggles[name] = false; // Mặc định tắt, sẽ ghi đè ở hàm initializeAccessoryStates
                console.log("Pre-load thành công:", name, preloadedParams[name]);
            }
        } catch (err) {
            console.warn("Pre-load thất bại:", name, err);
        }
    }));
}

// 4. Khởi tạo trạng thái bật/tắt ban đầu dựa trên các parameter hiện tại của mô hình
function initializeAccessoryStates() {
    if (!model || !model.internalModel || !model.internalModel.coreModel) return;

    Object.keys(preloadedParams).forEach(name => {
        const params = preloadedParams[name];
        if (!params || params.length === 0) return;

        // Nếu tất cả các parameter định nghĩa trong file biểu cảm đều có giá trị khớp (>0.5 hoặc <-0.5 tùy theo dấu)
        const isCurrentlyActive = params.every(p => {
            try {
                const val = model.internalModel.coreModel.getParameterValueById(p.Id);
                // So sánh xem giá trị parameter của model có khớp với giá trị bật trong exp3.json không
                if (p.Value > 0) {
                    return val > 0.5; // Ví dụ: giá trị bật là 1.0, nếu model hiện tại đang >0.5 nghĩa là đang đeo phụ kiện
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
        console.log(`Phụ kiện [${name}] ban đầu trên model:`, isCurrentlyActive ? "ĐANG BẬT" : "TẮT");
    });
}

// 5. Fit model vào màn hình
function fitModel() {
    if (!model) return;
    model.anchor.set(0.5, 0.5);
    const scale = (window.innerHeight * 0.85) / model.height;
    model.scale.set(scale);
    model.x = window.innerWidth / 2;
    model.y = window.innerHeight / 2 + (model.height * scale * 0.05);
}

// 6. Tương tác chuột & cảm ứng
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

// Helper áp dụng hành động Nhìn thẳng (0,0) - đúng posture ban đầu lúc mới mở web
function applyLookStraight(lockState) {
    if (typeof lockState === 'boolean') {
        lookLocked = lockState;
    } else {
        lookLocked = !lookLocked;
    }

    if (model) {
        if (lookLocked) {
            // 1. Ép focus target về đúng tâm chính diện (0,0)
            if (model.internalModel?.focusController) {
                model.internalModel.focusController.focus(0, 0);
            } else {
                model.focus(window.innerWidth / 2, window.innerHeight / 2);
            }

            // 2. Reset các góc quay của đầu & mắt về 0 (nhìn thẳng 100%, không bị nhìn lệch)
            const core = model.internalModel?.coreModel;
            if (core) {
                ['ParamAngleX', 'ParamAngleY', 'ParamAngleZ',
                 'ParamEyeBallX', 'ParamEyeBallY',
                 'ParamBodyAngleX', 'ParamBodyAngleY', 'ParamBodyAngleZ'
                ].forEach(id => {
                    try { core.setParameterValueById(id, 0); } catch (_) {}
                });
            }

            // 3. Đưa về Idle standing pose
            _currentMotionGroup = 'Idle';
            try { model.motion('Idle', 0); } catch (_) {}
        }
    }

    // 4. Cập nhật trạng thái hiển thị trên các nút UI
    const sidebarLookBtn = document.getElementById('btn-look-straight-sidebar');
    if (sidebarLookBtn) {
        sidebarLookBtn.classList.toggle('active', lookLocked);
    }
    const dockLookBtn = document.getElementById('btn-look-center');
    if (dockLookBtn) {
        dockLookBtn.style.color = lookLocked ? 'var(--primary)' : '';
        dockLookBtn.title = lookLocked ? 'Đang khoá nhìn thẳng (click để tắt)' : 'Khoá nhìn thẳng';
        dockLookBtn.classList.toggle('active', lookLocked);
    }
}

// 7. Render sidebar
function populateSidebars(expressions) {
    const exprContainer = document.getElementById('expressions-container');
    exprContainer.innerHTML = '';

    const faceExps      = expressions.filter(exp => !accessoryKeys.some(k => (exp.Name || exp.name || "").includes(k)));
    const accessoryExps = expressions.filter(exp =>  accessoryKeys.some(k => (exp.Name || exp.name || "").includes(k)));

    // --- Nhóm biểu cảm khuôn mặt (chọn 1) ---
    if (faceExps.length > 0) {
        const h = document.createElement('h3');
        h.innerText = "🎭 Biểu cảm khuôn mặt";
        exprContainer.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'btn-grid';
        grid.id = 'face-grid';

        const resetBtn = createBtn('Mặc định', true, () => {
            document.querySelectorAll('#face-grid .action-btn').forEach(b => b.classList.remove('active'));
            resetBtn.classList.add('active');
            if (model.expressionManager) model.expression();
        });
        resetBtn.id = 'btn-face-default';
        grid.appendChild(resetBtn);

        faceExps.forEach((exp, idx) => {
            const rawName = exp.Name || exp.name || "";
            const viName  = vn(rawName);
            const btn = createBtn(viName, false, () => {
                document.querySelectorAll('#face-grid .action-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const globalIndex = expressions.indexOf(exp);
                try { model.expression(globalIndex); } catch (_) { model.expression(exp.File || exp.file || rawName); }
                console.log("Biểu cảm:", rawName, "index:", globalIndex);
            });
            grid.appendChild(btn);
        });

        exprContainer.appendChild(grid);
    }

    // --- Nhóm phụ kiện & trang phục (toggle độc lập) ---
    if (accessoryExps.length > 0) {
        const h = document.createElement('h3');
        h.innerText = "✨ Phụ kiện & Trang phục";
        exprContainer.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'btn-grid';

        accessoryExps.forEach(exp => {
            const rawName = exp.Name || exp.name || "";
            const viName  = vn(rawName);
            const isReady = !!preloadedParams[rawName];
            const isActive = activeToggles[rawName] || false; // Thiết lập trạng thái active ban đầu dựa trên model thực tế

            const btn = createBtn(viName + (isReady ? '' : ' ⚠️'), isActive, () => {
                if (!preloadedParams[rawName]) {
                    console.warn("Chưa tải được params cho:", rawName);
                    return;
                }
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
                console.log("Toggle phụ kiện:", rawName, activeToggles[rawName] ? "BẬT" : "TẮT");
            });
            grid.appendChild(btn);
        });

        exprContainer.appendChild(grid);
    }

    // --- Sidebar phải: Chuyển động ---
    const motionContainer = document.getElementById('motions-container');
    motionContainer.innerHTML = '';

    const settings = model.internalModel.settings;
    const motionGroups =
        (settings.json?.FileReferences?.Motions) ||
        settings.motions || settings.Motions || {};

    const motionKeys = Object.keys(motionGroups);
    if (motionKeys.length === 0) {
        motionContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px;">Không tìm thấy chuyển động nào.</div>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'btn-grid';
    grid.id = 'motions-grid';

    // Helper: chạy motion và tự quay về Idle khi xong
    function playMotionAndReturn(group, index) {
        _currentMotionGroup = group;
        console.log('Chạy:', group, index);
        model.motion(group, index).then(() => {
            console.log(`[FIX] Motion ${group}/${index} xong → quay về Idle`);
            _currentMotionGroup = 'Idle';
        }).catch(() => {
            _currentMotionGroup = 'Idle';
        });
    }

    // Nút Nhìn thẳng 🎯 (Chuyển sang nhóm Chuyển động)
    const lookBtn = createBtn('Nhìn thẳng 🎯', lookLocked, () => {
        applyLookStraight();
    });
    lookBtn.id = 'btn-look-straight-sidebar';
    grid.appendChild(lookBtn);

    // Nút chuyển động Ngẫu nhiên 🎲
    const randomBtn = createBtn('Ngẫu nhiên 🎲', false, () => {
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

    motionKeys.forEach(groupName => {
        const list = motionGroups[groupName];
        if (!Array.isArray(list)) return;
        list.forEach((_, index) => {
            const rawLabel = `${groupName} ${index + 1}`;
            const viLabel  = vn(rawLabel);
            const btn = createBtn(viLabel, false, () => {
                playMotionAndReturn(groupName, index);
            });
            btn.id = `btn-motion-${groupName}-${index}`;
            grid.appendChild(btn);
        });
    });

    motionContainer.appendChild(grid);
}

// Helper: tạo nút
function createBtn(label, isActive, onClick) {
    const btn = document.createElement('button');
    btn.className = 'action-btn' + (isActive ? ' active' : '');
    btn.innerText = label;
    btn.addEventListener('click', onClick);
    return btn;
}

// 8. Điều khiển zoom/reset/sidebar/bg
function setupControls() {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => model?.scale.set(model.scale.x * 1.1));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => model?.scale.set(model.scale.x * 0.9));
    document.getElementById('btn-reset')?.addEventListener('click', () => model && fitModel());

    // Nút khoá nhìn thẳng trên dock
    const btnLook = document.getElementById('btn-look-center');
    if (btnLook) {
        btnLook.addEventListener('click', () => {
            applyLookStraight();
        });
    }

    // Ẩn/Hiện thanh công cụ (Control Panel Dock)
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
        
        // Nếu bất kỳ sidebar nào đang mở -> Đóng tất cả. Ngược lại, mở tất cả.
        const shouldCollapseAll = !isLeftCollapsed || !isRightCollapsed;
        
        setLeftSidebarCollapsed(shouldCollapseAll);
        setRightSidebarCollapsed(shouldCollapseAll);
    });

    // Phím tắt & Top Header Handlers: 8 chủ đề nền (gồm Căn Phòng Streamer Cozy & 7 gradient Băng Tinh Thể)
    const bgs = [
        'url("assets/room_bg.png") center/cover no-repeat fixed', // 0. Căn Phòng Streamer Cozy (Anime Room)
        'radial-gradient(ellipse at 40% 30%, #0d2238 0%, #061220 60%, #020912 100%)', // 1. Băng Tuyết Tinh Thể (Ice Frost Crystal)
        'radial-gradient(ellipse at 30% 20%, #0a2e38 0%, #041820 60%, #020b10 100%)', // 2. Cực Quang Băng Giá (Aurora Teal)
        'radial-gradient(ellipse at 30% 20%, #201335 0%, #0e081c 60%, #07030f 100%)', // 3. Hoa Băng Huyền Diệu (Icy Lavender)
        'radial-gradient(ellipse at 30% 20%, #2a0e22 0%, #170614 60%, #0a0208 100%)', // 4. Anh Đào Băng (Snow Sakura Pink)
        'radial-gradient(ellipse at 40% 30%, #0f172a 0%, #080e1a 60%, #02060d 100%)', // 5. Đêm Đông Tuyết Rơi (Frozen Midnight)
        'radial-gradient(ellipse at 50% 20%, #072b42 0%, #031420 60%, #010810 100%)', // 6. Đại Dương Băng Giá (Deep Glacier)
        '#00ff00' // 7. Chroma Green (Tách nền OBS Studio)
    ];
    let bgIdx = 0;

    const setBackground = (idx) => {
        bgIdx = idx % bgs.length;
        document.body.style.background = bgs[bgIdx];
        
        // Highlight active theme dot
        document.querySelectorAll('.theme-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === bgIdx);
        });
    };

    // Fast Theme Dots in Top Header Bar
    document.querySelectorAll('.theme-dot').forEach((dot, idx) => {
        dot.addEventListener('click', () => setBackground(idx));
    });

    document.getElementById('btn-change-bg')?.addEventListener('click', () => {
        setBackground(bgIdx + 1);
    });

    // Thiết lập màu nền mặc định ban đầu (Căn phòng Streamer Cozy)
    setBackground(0);

    // Fullscreen Toggle
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
