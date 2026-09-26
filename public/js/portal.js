/**
 * Firebase Client Logic for SEED TO SUCCESS Learning Portal (Part 2)
 * Dual-Login with Firestore Access Check & Video Modal
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

    let currentMaterials = DEFAULT_MATERIALS;
    let currentMember = null;
    let lastIdentifier = "";

    // Check cached session
    const cachedMember = localStorage.getItem("seed_member_session");
    if (cachedMember) {
        try {
            const parsed = JSON.parse(cachedMember);
            verifyAccessAndLoad(parsed.id || parsed.email || parsed.phone);
        } catch (e) {
            localStorage.removeItem("seed_member_session");
        }
    } else {
        tryLiffAutoLogin();
    }

    async function tryLiffAutoLogin() {
        if (!LIFF_ID || !window.liff) return;
        try {
            await liff.init({ liffId: LIFF_ID });
            if (liff.isLoggedIn()) {
                const profile = await liff.getProfile();
                if (profile && profile.userId) {
                    performFirestoreLogin("line_user_id", profile.userId);
                }
            }
        } catch (e) {
            console.log("LIFF auto-login skipped");
        }
    }

    // ==========================================
    // 1. Login Events
    // ==========================================
    if (btnLineLogin) {
        btnLineLogin.addEventListener("click", async () => {
            if (!LIFF_ID) {
                const mockLine = prompt("ใส่ LINE User ID หรือชื่อสำหรับทดสอบ:", "LINE_DEMO_USER");
                if (mockLine) performFirestoreLogin("line_user_id", mockLine);
                return;
            }

            try {
                showLoading("กำลังเชื่อมต่อ LINE...");
                if (!window.liff) return;
                await liff.init({ liffId: LIFF_ID });
                if (!liff.isLoggedIn()) {
                    liff.login();
                } else {
                    const profile = await liff.getProfile();
                    performFirestoreLogin("line_user_id", profile.userId);
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
            lastIdentifier = val;

            if (val.includes("@")) {
                performFirestoreLogin("email", val.toLowerCase());
            } else {
                const cleanPhone = val.replace(/[^0-9]/g, "");
                performFirestoreLogin("phone", cleanPhone);
            }
        });
    }

    async function performFirestoreLogin(field, value) {
        hideError();
        showLoading("กำลังตรวจสอบสิทธิ์ใน Cloud Firestore...");

        try {
            const snapshot = await db.collection("members")
                .where(field, "==", value)
                .where("status", "==", "ACTIVE")
                .limit(1)
                .get();

            hideLoading();

            if (snapshot.empty) {
                showError("ไม่พบข้อมูลการลงทะเบียนในระบบ กรุณาลงทะเบียนเข้าร่วมโครงการก่อน");
                return;
            }

            const doc = snapshot.docs[0];
            const memberData = Object.assign({ id: doc.id }, doc.data());
            handleMemberState(memberData);

        } catch (err) {
            console.error("Firestore Login Error:", err);
            hideLoading();
            showError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        }
    }

    async function verifyAccessAndLoad(docIdOrVal) {
        try {
            let doc = null;
            if (docIdOrVal.includes("@")) {
                const snap = await db.collection("members").where("email", "==", docIdOrVal).limit(1).get();
                if (!snap.empty) doc = snap.docs[0];
            } else {
                const snap = await db.collection("members").where("phone", "==", docIdOrVal).limit(1).get();
                if (!snap.empty) doc = snap.docs[0];
            }

            if (doc && doc.exists) {
                const memberData = Object.assign({ id: doc.id }, doc.data());
                handleMemberState(memberData);
            }
        } catch (e) {
            console.warn("Failed to verify cached session");
        }
    }

    // ==========================================
    // 2. Member Access State Management
    // ==========================================
    async function handleMemberState(member) {
        currentMember = member;
        const access = member.learning_access || "PENDING";

        if (access === "APPROVED") {
            localStorage.setItem("seed_member_session", JSON.stringify({ email: member.email, phone: member.phone }));
            await loadMaterials();
            showLearningDashboard(member, currentMaterials);
        } else if (access === "PENDING") {
            showPendingScreen(member);
        } else {
            showError("คุณยังไม่ได้รับสิทธิ์เข้าถึงสื่อการเรียนรู้นี้ กรุณาติดต่อทีมงานโครงการ");
        }
    }

    async function loadMaterials() {
        try {
            const snap = await db.collection("learning_materials")
                .where("is_published", "==", 1)
                .orderBy("order_index", "asc")
                .get();

            if (!snap.empty) {
                currentMaterials = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            }
        } catch (e) {
            console.log("Using default learning materials");
        }
    }

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
        pendingRegisterDate.textContent = member.created_at ? member.created_at.substring(0, 10) : "-";

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

        document.getElementById("btnLogoutPortal").addEventListener("click", () => {
            localStorage.removeItem("seed_member_session");
            window.location.reload();
        });
    }

    if (btnRefreshStatus) {
        btnRefreshStatus.addEventListener("click", () => {
            if (currentMember) {
                performFirestoreLogin("email", currentMember.email);
            } else if (lastIdentifier) {
                if (lastIdentifier.includes("@")) {
                    performFirestoreLogin("email", lastIdentifier.toLowerCase());
                } else {
                    performFirestoreLogin("phone", lastIdentifier);
                }
            } else {
                window.location.reload();
            }
        });
    }

    // ==========================================
    // 3. Materials Rendering & Filter
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

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const cat = btn.getAttribute("data-cat");
            renderMaterials(currentMaterials, cat);
        });
    });

    function openVideoModal(url, title) {
        videoModalTitle.textContent = title;
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
});
