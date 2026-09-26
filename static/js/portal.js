/**
 * SEED TO SUCCESS Learning Portal Client
 * Handles Dual-Login (LINE & Email/Phone), Access Gatekeeper, and Material Rendering
 */

document.addEventListener("DOMContentLoaded", async () => {
    if (window.lucide) window.lucide.createIcons();

    // DOM Elements
    const loginSection = document.getElementById("loginSection");
    const pendingSection = document.getElementById("pendingSection");
    const learningSection = document.getElementById("learningSection");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingMsg = document.getElementById("loadingMsg");
    const userHeaderArea = document.getElementById("userHeaderArea");

    // Login Elements
    const btnLineLogin = document.getElementById("btnLineLogin");
    const emailLoginForm = document.getElementById("emailLoginForm");
    const loginIdentifier = document.getElementById("loginIdentifier");
    const loginError = document.getElementById("loginError");
    const btnLoginSubmit = document.getElementById("btnLoginSubmit");

    // Pending Elements
    const pendingMemberName = document.getElementById("pendingMemberName");
    const pendingMemberCode = document.getElementById("pendingMemberCode");
    const pendingMemberEmail = document.getElementById("pendingMemberEmail");
    const pendingRegisterDate = document.getElementById("pendingRegisterDate");
    const btnRefreshStatus = document.getElementById("btnRefreshStatus");

    // Dashboard Elements
    const welcomeUserName = document.getElementById("welcomeUserName");
    const dashMemberCode = document.getElementById("dashMemberCode");
    const materialsGrid = document.getElementById("materialsGrid");
    const filterBtns = document.querySelectorAll(".filter-btn");

    // Video Modal
    const videoModal = document.getElementById("videoModal");
    const videoModalTitle = document.getElementById("videoModalTitle");
    const videoContainer = document.getElementById("videoContainer");
    const btnCloseVideo = document.getElementById("btnCloseVideo");

    let currentMaterials = [];
    let currentMember = null;
    let lastLoginIdentifier = "";

    const liffId = window.APP_CONFIG ? window.APP_CONFIG.liffId : "";

    // ==========================================
    // 1. Initial Auth Check
    // ==========================================
    async function checkCurrentSession() {
        showLoading("กำลังตรวจสอบสถานะการเข้าสู่ระบบ...");
        try {
            const res = await fetch("/api/portal/check-auth");
            const data = await res.json();
            hideLoading();

            if (data.authenticated && data.member) {
                currentMember = data.member;
                currentMaterials = data.materials || [];
                showLearningDashboard(currentMember, currentMaterials);
            } else {
                // If opened in LINE, try auto-login via LIFF
                tryLiffAutoLogin();
            }
        } catch (e) {
            hideLoading();
        }
    }

    async function tryLiffAutoLogin() {
        if (!liffId || !window.liff) return;
        try {
            await liff.init({ liffId });
            if (liff.isLoggedIn()) {
                const profile = await liff.getProfile();
                if (profile && profile.userId) {
                    performLogin({ line_user_id: profile.userId });
                }
            }
        } catch (e) {
            console.log("LIFF auto-login skipped");
        }
    }

    // ==========================================
    // 2. Login Handlers
    // ==========================================
    if (btnLineLogin) {
        btnLineLogin.addEventListener("click", async () => {
            if (!liffId) {
                // Mock LINE Login for browser testing
                const mockId = prompt("ใส่ LINE User ID หรือชื่อสำหรับทดสอบ:", "U1234567890abcdef");
                if (mockId) performLogin({ line_user_id: mockId });
                return;
            }

            try {
                showLoading("กำลังเชื่อมต่อ LINE...");
                if (!window.liff) return;
                await liff.init({ liffId });
                if (!liff.isLoggedIn()) {
                    liff.login();
                } else {
                    const profile = await liff.getProfile();
                    performLogin({ line_user_id: profile.userId });
                }
            } catch (err) {
                hideLoading();
                alert("ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาล็อกอินด้วยอีเมล");
            }
        });
    }

    if (emailLoginForm) {
        emailLoginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const val = loginIdentifier.value.trim();
            if (!val) return;

            lastLoginIdentifier = val;
            if (val.includes("@")) {
                performLogin({ email: val });
            } else {
                performLogin({ phone: val });
            }
        });
    }

    async function performLogin(credentials) {
        hideError();
        showLoading("กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...");

        try {
            const res = await fetch("/api/portal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });

            const data = await res.json();
            hideLoading();

            if (data.status === "APPROVED") {
                currentMember = data.member;
                currentMaterials = data.materials || [];
                showLearningDashboard(currentMember, currentMaterials);
            } else if (data.status === "PENDING") {
                currentMember = data.member;
                showPendingScreen(currentMember);
            } else {
                showError(data.message || "ไม่สามารถเข้าสู่ระบบได้");
            }
        } catch (err) {
            hideLoading();
            showError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    }

    // ==========================================
    // 3. UI State Transitions
    // ==========================================
    function showLearningDashboard(member, materials) {
        loginSection.classList.add("hidden");
        pendingSection.classList.add("hidden");
        learningSection.classList.remove("hidden");

        const fullName = `${member.title && member.title !== 'ไม่ระบุ' ? member.title + ' ' : ''}${member.first_name} ${member.last_name}`;
        welcomeUserName.textContent = fullName;
        dashMemberCode.textContent = member.member_code || "SEED-MEMBER";

        renderHeaderUser(member, fullName);
        renderMaterials(materials);

        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.lucide) window.lucide.createIcons();
    }

    function showPendingScreen(member) {
        loginSection.classList.add("hidden");
        learningSection.classList.add("hidden");
        pendingSection.classList.remove("hidden");

        const fullName = `${member.title && member.title !== 'ไม่ระบุ' ? member.title + ' ' : ''}${member.first_name} ${member.last_name}`;
        pendingMemberName.textContent = fullName;
        pendingMemberCode.textContent = member.member_code || "-";
        pendingMemberEmail.textContent = member.email || "-";
        pendingRegisterDate.textContent = member.created_at ? member.created_at.substring(0, 16) : "-";

        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.lucide) window.lucide.createIcons();
    }

    function renderHeaderUser(member, fullName) {
        const avatar = member.line_picture_url || "https://placehold.co/60x60/e2e8f0/64748b?text=SEED";
        userHeaderArea.innerHTML = `
            <div class="user-pill">
                <img src="${avatar}" alt="Avatar" class="user-avatar-sm" onerror="this.src='https://placehold.co/60x60/e2e8f0/64748b?text=SEED'">
                <span>${escapeHtml(fullName)}</span>
            </div>
            <button type="button" class="btn-logout-portal" id="btnLogoutPortal">ออกจากระบบ</button>
        `;

        document.getElementById("btnLogoutPortal").addEventListener("click", async () => {
            await fetch("/api/portal/logout", { method: "POST" });
            window.location.reload();
        });
    }

    if (btnRefreshStatus) {
        btnRefreshStatus.addEventListener("click", () => {
            if (lastLoginIdentifier) {
                if (lastLoginIdentifier.includes("@")) {
                    performLogin({ email: lastLoginIdentifier });
                } else {
                    performLogin({ phone: lastLoginIdentifier });
                }
            } else if (currentMember && currentMember.line_user_id) {
                performLogin({ line_user_id: currentMember.line_user_id });
            } else {
                window.location.reload();
            }
        });
    }

    // ==========================================
    // 4. Materials Rendering & Filter
    // ==========================================
    function renderMaterials(materials, filterCategory = "all") {
        materialsGrid.innerHTML = "";

        const filtered = filterCategory === "all" 
            ? materials 
            : materials.filter(m => m.category === filterCategory);

        if (filtered.length === 0) {
            materialsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">ไม่พบสื่อการเรียนรู้ในหมวดหมู่นี้</div>`;
            return;
        }

        filtered.forEach(mat => {
            const card = document.createElement("div");
            card.className = "material-card";

            const isVideo = mat.content_type === "video_youtube" || mat.category.includes("วิดีโอ");
            const isDoc = mat.content_type === "pdf_download" || mat.category.includes("เอกสาร");

            const iconName = isVideo ? "play-circle" : (isDoc ? "file-text" : "award");
            const btnText = isVideo ? "เข้าชมวิดีโอบรรยาย" : (isDoc ? "ดาวน์โหลดเอกสาร (PDF)" : "เข้าร่วมกิจกรรม");
            const btnIcon = isVideo ? "play" : (isDoc ? "download" : "external-link");

            card.innerHTML = `
                <div class="card-top-thumbnail">
                    <span class="card-cat-badge">${escapeHtml(mat.category)}</span>
                    <span class="card-duration-badge">${escapeHtml(mat.duration || '')}</span>
                    <i data-lucide="${iconName}" class="thumb-icon"></i>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(mat.title)}</h3>
                    <p class="card-desc">${escapeHtml(mat.description || '')}</p>
                    <button type="button" class="btn-card-action" data-type="${mat.content_type}" data-url="${escapeHtml(mat.content_url)}" data-title="${escapeHtml(mat.title)}">
                        <i data-lucide="${btnIcon}" class="icon-sm"></i>
                        <span>${btnText}</span>
                    </button>
                </div>
            `;

            materialsGrid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

        // Attach action handlers
        document.querySelectorAll(".btn-card-action").forEach(btn => {
            btn.addEventListener("click", () => {
                const url = btn.getAttribute("data-url");
                const type = btn.getAttribute("data-type");
                const title = btn.getAttribute("data-title");

                if (type === "video_youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
                    openVideoModal(url, title);
                } else {
                    window.open(url, "_blank");
                }
            });
        });
    }

    // Category Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const cat = btn.getAttribute("data-cat");
            renderMaterials(currentMaterials, cat);
        });
    });

    // ==========================================
    // 5. Video Modal
    // ==========================================
    function openVideoModal(url, title) {
        videoModalTitle.textContent = title;
        // Convert YouTube URL to embed if needed
        let embedUrl = url;
        if (url.includes("watch?v=")) {
            embedUrl = url.replace("watch?v=", "embed/");
        } else if (url.includes("youtu.be/")) {
            embedUrl = url.replace("youtu.be/", "www.youtube.com/embed/");
        }

        videoContainer.innerHTML = `<iframe src="${embedUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoModal.classList.remove("hidden");
    }

    function closeVideoModal() {
        videoModal.classList.add("hidden");
        videoContainer.innerHTML = "";
    }

    if (btnCloseVideo) btnCloseVideo.addEventListener("click", closeVideoModal);
    if (videoModal) {
        videoModal.addEventListener("click", (e) => {
            if (e.target === videoModal) closeVideoModal();
        });
    }

    // Helper Functions
    function showLoading(msg) {
        loadingMsg.textContent = msg || "กำลังโหลด...";
        loadingOverlay.classList.remove("hidden");
    }

    function hideLoading() {
        loadingOverlay.classList.add("hidden");
    }

    function showError(msg) {
        loginError.textContent = msg;
        loginError.classList.remove("hidden");
    }

    function hideError() {
        loginError.textContent = "";
        loginError.classList.add("hidden");
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Run Initial Check
    checkCurrentSession();
});
