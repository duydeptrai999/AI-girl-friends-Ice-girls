let app;
let model;
let lookLocked = false; // Khi bật: khoá nhìn thẳng, không theo chuột

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

    // ===== FIX TÀN ẢNH TRIỆT ĐỂ (v2) =====
    // Root cause: Live2D Cubism 4 dùng multi-pass rendering với các FBO (framebuffer object) nội bộ
    // cho clipping mask. Sau mỗi pass, nó bind FBO của nó, KHÔNG tự unbind về null.
    // Hậu quả: frame trước "chảy" sang frame sau vì WebGL đang clear/render sai framebuffer.
    //
    // Chiến lược 2 lớp:
    // 1. PRERENDER: Clear canvas screen (fb=null) TRƯỚC khi Pixi/Live2D vẽ frame mới.
    // 2. POSTRENDER: Sau khi Live2D render xong, force unbind tất cả FBO nội bộ về null
    //    và clear STENCIL buffer (dùng bởi clipping mask) để tránh stencil cũ gây artifact.
    //    Lưu ý: KHÔNG clear COLOR ở đây vì frame vừa vẽ xong cần giữ lại để hiển thị.

    const _clearScreen = () => {
        const gl = app.renderer.gl;
        if (!gl) return;
        // Bind về screen framebuffer (null = default canvas FBO)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0); // trong suốt
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    };

    // Layer 1: Clear canvas trước mỗi frame
    app.renderer.on('prerender', _clearScreen);

    // Layer 2: Sau khi Live2D render xong — reset FBO về null + clear stencil
    // để triệt tiêu stencil/depth artifact từ clipping mask pass trước.
    app.renderer.on('postrender', () => {
        const gl = app.renderer.gl;
        if (!gl) return;
        // Unbind mọi FBO nội bộ của Live2D
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Chỉ clear depth+stencil — KHÔNG clear color (sẽ xoá model vừa vẽ)
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        // Reset stencil mask về mặc định
        gl.stencilMask(0xFF);
        gl.disable(gl.STENCIL_TEST);
    });

    window.addEventListener('resize', () => {
        if (model) fitModel();
    });

    // Ticker: Cứ mỗi frame, áp lại giá trị phụ kiện đang bật và khoá nhìn thẳng
    app.ticker.add(() => {
        if (!model) return;
        
        // Nếu khoá nhìn thẳng, liên tục ép model focus về đúng toạ độ của nó để tránh lệch mắt do các chuyển động khác
        if (lookLocked) {
            model.focus(model.x, model.y);
        }
        
        Object.entries(activeToggles).forEach(([expName, isOn]) => {
            // QUAN TRỌNG: Chỉ can thiệp và ép giá trị parameter trong loop nếu phụ kiện ĐANG BẬT.
            // Nếu phụ kiện tắt, để Live2D engine tự do quản lý parameter đó (tránh kẹt opacity của part gây tàn ảnh/mesh mờ).
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

// 6. Tương tác chuột
function setupModelInteraction() {
    if (!model) return;
    let isDragging = false, startX, startY, modelStartX, modelStartY;
    const container = document.getElementById('canvas-container');

    container.addEventListener('mousemove', (e) => {
        if (!isDragging && !lookLocked) model.focus(e.clientX, e.clientY);
    });

    container.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            modelStartX = model.x; modelStartY = model.y;
            container.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            model.x = modelStartX + (e.clientX - startX);
            model.y = modelStartY + (e.clientY - startY);
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const speed = 0.08;
        let s = model.scale.x + (e.deltaY < 0 ? 1 : -1) * model.scale.x * speed;
        s = Math.max(0.05, Math.min(3.0, s));
        model.scale.set(s);
    }, { passive: false });
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

        // Nút Nhìn thẳng (Toggle)
        const lookBtn = createBtn('Nhìn thẳng', lookLocked, () => {
            lookLocked = !lookLocked;
            lookBtn.classList.toggle('active', lookLocked);
            
            if (lookLocked) {
                document.getElementById('btn-face-default')?.classList.remove('active');
            }
            
            if (lookLocked && model) {
                model.focus(model.x, model.y);
            }
        });
        lookBtn.id = 'btn-look-straight-sidebar';
        grid.appendChild(lookBtn);

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
                
                // Nếu người dùng click tắt phụ kiện:
                // Thiết lập các parameter của nó về 0 MỘT LẦN DUY NHẤT để tắt nó đi ngay lập tức.
                // Ticker loop sau đó sẽ bỏ qua, không ghi đè nó nữa, giúp model tự do điều khiển.
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

    // Nút chuyển động Ngẫu nhiên 🎲
    const randomBtn = createBtn('Ngẫu nhiên 🎲', false, () => {
        const activeGroups = motionKeys.filter(k => k !== "Idle");
        if (activeGroups.length > 0) {
            const randomGroup = activeGroups[Math.floor(Math.random() * activeGroups.length)];
            const list = motionGroups[randomGroup];
            if (list && list.length > 0) {
                const randomIndex = Math.floor(Math.random() * list.length);
                model.motion(randomGroup, randomIndex);
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
                model.motion(groupName, index);
                console.log("Chạy:", groupName, index);
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

    // Nút khoá nhìn thẳng
    const btnLook = document.getElementById('btn-look-center');
    if (btnLook) {
        btnLook.addEventListener('click', () => {
            lookLocked = !lookLocked;
            btnLook.style.color = lookLocked ? 'var(--primary)' : '';
            btnLook.title = lookLocked ? 'Đang khoá nhìn thẳng (click để tắt)' : 'Khoá nhìn thẳng';
            if (lookLocked && model) {
                model.focus(model.x, model.y);
            }
        });
    }

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

    const bgs = [
        'linear-gradient(135deg, #0f0c1b 0%, #15102a 50%, #06050b 100%)',
        'linear-gradient(135deg, #1A1C29 0%, #32253F 50%, #141124 100%)',
        'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
        '#050505', '#ffffff', '#00ff00'
    ];
    let bgIdx = 0;
    document.getElementById('btn-change-bg')?.addEventListener('click', () => {
        bgIdx = (bgIdx + 1) % bgs.length;
        document.body.style.background = bgs[bgIdx];
        document.body.style.color = (bgs[bgIdx] === '#ffffff' || bgs[bgIdx] === '#00ff00') ? '#333' : 'var(--text-color)';
    });
}

// 9. Ẩn màn hình chờ
function hideLoader() {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => el.style.display = 'none', 500);
}
