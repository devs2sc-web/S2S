/**
 * Admin Dashboard Logic - SEED TO SUCCESS
 * Handles Members List, Learning Access Control (Part 2), Materials Manager, Appearance & Form Builder
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    // DOM Elements
    const loginModal = document.getElementById("loginModal");
    const dashboardContainer = document.getElementById("dashboardContainer");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const loginError = document.getElementById("loginError");
    const btnLogout = document.getElementById("btnLogout");
    const toast = document.getElementById("toast");

    // Tab buttons & panes
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");

    // Members Tab Elements
    const searchInput = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");
    const btnRefresh = document.getElementById("btnRefresh");
    const btnBulkApprove = document.getElementById("btnBulkApprove");
    const membersTableBody = document.getElementById("membersTableBody");
    const statTotalMembers = document.getElementById("statTotalMembers");
    const statPendingLearning = document.getElementById("statPendingLearning");
    const statApprovedLearning = document.getElementById("statApprovedLearning");
    const statTodayMembers = document.getElementById("statTodayMembers");
    const countPendingBadge = document.getElementById("countPendingBadge");
    const accessFilterBtns = document.querySelectorAll(".btn-filter-pill");

    // Modals
    const detailModal = document.getElementById("detailModal");
    const detailModalBody = document.getElementById("detailModalBody");
    const btnCloseDetail = document.getElementById("btnCloseDetail");

    // Materials Tab Elements
    const materialsTableBody = document.getElementById("materialsTableBody");
    const btnOpenAddMaterialModal = document.getElementById("btnOpenAddMaterialModal");
    const addMaterialModal = document.getElementById("addMaterialModal");
    const btnCloseAddMaterial = document.getElementById("btnCloseAddMaterial");
    const btnCancelAddMaterial = document.getElementById("btnCancelAddMaterial");
    const newMaterialForm = document.getElementById("newMaterialForm");

    // Appearance Tab Elements
    const appBrandName = document.getElementById("appBrandName");
    const appLogoUrl = document.getElementById("appLogoUrl");
    const appBrandTitle = document.getElementById("appBrandTitle");
    const appBrandSubtitle = document.getElementById("appBrandSubtitle");
    const appNoticeText = document.getElementById("appNoticeText");
    const appBtnText = document.getElementById("appBtnText");
    const appCardTier = document.getElementById("appCardTier");
    const appCardTheme = document.getElementById("appCardTheme");
    const appCustomBg = document.getElementById("appCustomBg");
    const customGradientGroup = document.getElementById("customGradientGroup");
    const appAccentColor = document.getElementById("appAccentColor");
    const appAccentColorText = document.getElementById("appAccentColorText");
    const btnSaveAppearance = document.getElementById("btnSaveAppearance");

    // Preview Elements
    const prevBrandName = document.getElementById("prevBrandName");
    const prevBrandTitle = document.getElementById("prevBrandTitle");
    const prevBrandSubtitle = document.getElementById("prevBrandSubtitle");
    const prevCard = document.getElementById("prevCard");
    const prevCardBrand = document.getElementById("prevCardBrand");
    const prevCardTier = document.getElementById("prevCardTier");
    const prevBtn = document.getElementById("prevBtn");

    // Fields Tab Elements
    const fieldsTableBody = document.getElementById("fieldsTableBody");
    const btnSaveFields = document.getElementById("btnSaveFields");
    const btnResetFields = document.getElementById("btnResetFields");
    const btnOpenAddFieldModal = document.getElementById("btnOpenAddFieldModal");
    const addFieldModal = document.getElementById("addFieldModal");
    const btnCloseAddField = document.getElementById("btnCloseAddField");
    const btnCancelAddField = document.getElementById("btnCancelAddField");
    const newFieldForm = document.getElementById("newFieldForm");
    const newFieldType = document.getElementById("newFieldType");
    const groupNewFieldOptions = document.getElementById("groupNewFieldOptions");

    let currentMembersList = [];
    let currentMaterialsList = [];
    let currentFieldsList = [];
    let currentAppearance = {};
    let currentFilter = "all";

    const CARD_THEME_GRADIENTS = {
        deep_navy: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)",
        luxury_black: "linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 50%, #111111 100%)",
        luxury_gold: "linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #8b6508 100%)",
        emerald: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)",
        ruby: "linear-gradient(135deg, #881337 0%, #be123c 50%, #4c0519 100%)"
    };

    // ==========================================
    // 1. Tab Switching
    // ==========================================
    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");
            navTabs.forEach(t => t.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add("active");

            if (targetId === "tabAppearance") {
                updateLivePreview();
            } else if (targetId === "tabMaterials") {
                renderMaterialsTable(currentMaterialsList);
            }
        });
    });

    // ==========================================
    // 2. Authentication
    // ==========================================
    async function checkAuth() {
        try {
            const res = await fetch("/api/admin/check-auth");
            const data = await res.json();
            if (data.authenticated) {
                showDashboard();
            } else {
                showLogin();
            }
        } catch (e) {
            showLogin();
        }
    }

    function showDashboard() {
        loginModal.classList.add("hidden");
        dashboardContainer.classList.remove("hidden");
        loadMembers();
        loadSettings();
    }

    function showLogin() {
        loginModal.classList.remove("hidden");
        dashboardContainer.classList.add("hidden");
    }

    adminLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.classList.add("hidden");

        const username = document.getElementById("adminUser").value.trim();
        const password = document.getElementById("adminPass").value.trim();

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (data.success) {
                showDashboard();
            } else {
                loginError.textContent = data.error || "เข้าสู่ระบบไม่สำเร็จ";
                loginError.classList.remove("hidden");
            }
        } catch (err) {
            loginError.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
            loginError.classList.remove("hidden");
        }
    });

    btnLogout.addEventListener("click", async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.reload();
    });

    // ==========================================
    // 3. Members Management & Access Control
    // ==========================================
    async function loadMembers(query = "") {
        membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">กำลังโหลดข้อมูล...</td></tr>`;

        try {
            let url = `/api/admin/members?filter=${encodeURIComponent(currentFilter)}`;
            if (query) url += `&search=${encodeURIComponent(query)}`;

            const res = await fetch(url);
            if (res.status === 401) {
                showLogin();
                return;
            }

            const data = await res.json();
            currentMembersList = data.members || [];

            // Update stats
            if (data.stats) {
                statTotalMembers.textContent = data.stats.total_members.toLocaleString();
                statTodayMembers.textContent = data.stats.today_members.toLocaleString();
                statPendingLearning.textContent = data.stats.pending_learning.toLocaleString();
                statApprovedLearning.textContent = data.stats.approved_learning.toLocaleString();
                countPendingBadge.textContent = data.stats.pending_learning.toLocaleString();
            }

            renderMembersTable(currentMembersList);
        } catch (err) {
            membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">เกิดข้อผิดพลาดในการดึงข้อมูล</td></tr>`;
        }
    }

    function renderMembersTable(members) {
        if (!members || members.length === 0) {
            membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">ไม่พบข้อมูลสมาชิกในหมวดนี้</td></tr>`;
            return;
        }

        let html = "";
        members.forEach(m => {
            const avatar = m.line_picture_url || "https://placehold.co/60x60/e2e8f0/64748b?text=SEED";
            const lineName = m.line_display_name || "ไม่ได้ระบุ";
            const fullName = `${m.title && m.title !== 'ไม่ระบุ' ? m.title + ' ' : ''}${m.first_name} ${m.last_name}`;
            const affiliation = m.affiliation || "นักศึกษา";
            const contactInfo = `<div>${escapeHtml(m.phone_prefix || '+66')} ${escapeHtml(m.phone)}</div><small class="text-muted">${escapeHtml(m.email || '-')}</small>`;
            const regDate = m.created_at ? m.created_at.substring(0, 16) : "-";

            // Access Status Badge & Action
            const accessStatus = m.learning_access || "PENDING";
            let accessBadge = "";
            let accessActionBtn = "";

            if (accessStatus === "APPROVED") {
                accessBadge = `<span class="badge-access badge-approved"><i data-lucide="check-circle-2" style="width:12px;height:12px;"></i> อนุมัติสิทธิ์แล้ว</span>`;
                accessActionBtn = `<button type="button" class="btn-toggle-access btn-revoke" data-id="${m.id}" data-action="PENDING" title="คลิกเพื่อยกเลิกสิทธิ์">ปิดสิทธิ์</button>`;
            } else if (accessStatus === "PENDING") {
                accessBadge = `<span class="badge-access badge-pending"><i data-lucide="clock" style="width:12px;height:12px;"></i> รอการอนุมัติ</span>`;
                accessActionBtn = `<button type="button" class="btn-toggle-access btn-grant" data-id="${m.id}" data-action="APPROVED" title="คลิกเพื่อเปิดสิทธิ์เรียนออนไลน์ทันที">✓ อนุมัติสิทธิ์</button>`;
            } else {
                accessBadge = `<span class="badge-access badge-none">เฉพาะร่วมสัมมนา</span>`;
                accessActionBtn = `<button type="button" class="btn-toggle-access btn-grant" data-id="${m.id}" data-action="APPROVED" title="คลิกเพื่อเปิดสิทธิ์เรียนออนไลน์">เปิดสิทธิ์</button>`;
            }

            html += `
                <tr>
                    <td><span class="member-code-badge">${m.member_code || 'SEED-' + m.id}</span></td>
                    <td>
                        <div class="line-cell">
                            <img src="${avatar}" alt="Avatar" class="line-avatar" onerror="this.src='https://placehold.co/60x60/e2e8f0/64748b?text=SEED'">
                            <span class="line-name">${escapeHtml(lineName)}</span>
                        </div>
                    </td>
                    <td>
                        <strong>${escapeHtml(fullName)}</strong>
                        ${m.student_id ? `<br><small class="text-muted">รหัส: ${escapeHtml(m.student_id)}</small>` : ''}
                    </td>
                    <td><span style="font-size:12.5px; color:#475569;">${escapeHtml(affiliation)}</span></td>
                    <td>${contactInfo}</td>
                    <td style="text-align: center;">
                        <div class="access-cell">
                            ${accessBadge}
                            ${accessActionBtn}
                        </div>
                    </td>
                    <td><small class="text-muted">${regDate}</small></td>
                    <td>
                        <div class="action-btns">
                            <button type="button" class="btn-icon-table btn-view" title="ดูรายละเอียด" data-id="${m.id}">
                                <i data-lucide="eye" class="icon-sm"></i>
                            </button>
                            <button type="button" class="btn-icon-table btn-delete" title="ลบข้อมูล" data-id="${m.id}">
                                <i data-lucide="trash-2" class="icon-sm"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        membersTableBody.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Attach action handlers
        document.querySelectorAll(".btn-toggle-access").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = parseInt(btn.getAttribute("data-id"));
                const targetStatus = btn.getAttribute("data-action");
                await setMemberAccess(id, targetStatus);
            });
        });

        document.querySelectorAll(".btn-view").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.getAttribute("data-id"));
                const member = currentMembersList.find(item => item.id === id);
                if (member) showMemberDetail(member);
            });
        });

        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = parseInt(btn.getAttribute("data-id"));
                if (confirm(`คุณต้องการลบข้อมูลสมาชิกรายนี้ใช่หรือไม่?`)) {
                    await deleteMember(id);
                }
            });
        });
    }

    async function setMemberAccess(id, status) {
        try {
            const res = await fetch(`/api/admin/members/${id}/access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message);
                loadMembers(searchInput.value.trim());
            } else {
                alert(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์");
            }
        } catch (e) {
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        }
    }

    // Bulk Approve
    btnBulkApprove.addEventListener("click", async () => {
        if (confirm("คุณต้องการอนุมัติสิทธิ์เข้าเรียนออนไลน์ (Part 2) ให้แก่ผู้ที่รอการพิจารณาทั้งหมดพร้อมกันใช่หรือไม่?")) {
            try {
                btnBulkApprove.disabled = true;
                const res = await fetch("/api/admin/members/bulk-approve", { method: "POST" });
                const data = await res.json();
                btnBulkApprove.disabled = false;

                if (data.success) {
                    showToast(data.message);
                    loadMembers(searchInput.value.trim());
                } else {
                    alert(data.error || "เกิดข้อผิดพลาด");
                }
            } catch (e) {
                btnBulkApprove.disabled = false;
                alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
            }
        }
    });

    // Access Filter Tabs
    accessFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            accessFilterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            loadMembers(searchInput.value.trim());
        });
    });

    async function deleteMember(id) {
        try {
            const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("ลบข้อมูลสมาชิกเรียบร้อย");
                loadMembers(searchInput.value.trim());
            } else {
                alert(data.error || "เกิดข้อผิดพลาดในการลบ");
            }
        } catch (e) {
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        }
    }

    function showMemberDetail(m) {
        const avatar = m.line_picture_url || "https://placehold.co/80x80/e2e8f0/64748b?text=SEED";
        const fullName = `${m.title && m.title !== 'ไม่ระบุ' ? m.title + ' ' : ''}${m.first_name} ${m.last_name}`;

        let customFieldsHtml = "";
        const customData = m.custom_data || {};
        if (Object.keys(customData).length > 0) {
            customFieldsHtml += `<div style="margin-top:16px; font-weight:700; font-size:13px; color:#475569; border-top:1px solid #e2e8f0; padding-top:12px;">ข้อมูลเพิ่มเติม:</div>`;
            for (const [k, v] of Object.entries(customData)) {
                const fSetting = currentFieldsList.find(f => f.id === k);
                const label = fSetting ? fSetting.label : k;
                customFieldsHtml += `<div class="detail-row"><span class="detail-lbl">${escapeHtml(label)}:</span><span class="detail-val">${escapeHtml(String(v))}</span></div>`;
            }
        }

        const accessText = m.learning_access === "APPROVED" 
            ? '<span style="color:#16a34a; font-weight:700;">✅ อนุมัติสิทธิ์แล้ว</span>'
            : (m.learning_access === "PENDING" ? '<span style="color:#d97706; font-weight:700;">⏳ รอการอนุมัติ</span>' : '<span style="color:#64748b;">เฉพาะร่วมสัมมนา</span>');

        detailModalBody.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <img src="${avatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" onerror="this.src='https://placehold.co/80x80/e2e8f0/64748b?text=SEED'">
                <div>
                    <h4 style="font-size:16px; font-weight:700;">${escapeHtml(fullName)}</h4>
                    <p style="color:#64748b; font-size:13px;">LINE: ${escapeHtml(m.line_display_name || '-')}</p>
                    <span class="member-code-badge" style="margin-top:4px; display:inline-block;">${m.member_code}</span>
                </div>
            </div>
            <div class="detail-row"><span class="detail-lbl">สิทธิ์เข้าเรียน Part 2:</span><span class="detail-val">${accessText}</span></div>
            <div class="detail-row"><span class="detail-lbl">สถานะ / สถาบัน:</span><span class="detail-val">${escapeHtml(m.affiliation || 'นักศึกษา')}</span></div>
            ${m.student_id ? `<div class="detail-row"><span class="detail-lbl">รหัสนักศึกษา:</span><span class="detail-val">${escapeHtml(m.student_id)}</span></div>` : ''}
            <div class="detail-row"><span class="detail-lbl">เบอร์โทรศัพท์:</span><span class="detail-val">${escapeHtml(m.phone_prefix || '+66')} ${escapeHtml(m.phone)}</span></div>
            <div class="detail-row"><span class="detail-lbl">อีเมล:</span><span class="detail-val">${escapeHtml(m.email || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">ความสนใจ Part 2:</span><span class="detail-val">${escapeHtml(m.interest_part2 || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">LINE User ID:</span><span class="detail-val" style="font-family:monospace; font-size:11px;">${escapeHtml(m.line_user_id || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">วันที่ลงทะเบียน:</span><span class="detail-val">${escapeHtml(m.created_at || '-')}</span></div>
            ${m.approved_at ? `<div class="detail-row"><span class="detail-lbl">วันที่อนุมัติสิทธิ์:</span><span class="detail-val">${escapeHtml(m.approved_at)} (โดย ${escapeHtml(m.approved_by || 'Admin')})</span></div>` : ''}
            ${customFieldsHtml}
        `;

        detailModal.classList.remove("hidden");
    }

    if (btnCloseDetail) btnCloseDetail.addEventListener("click", () => detailModal.classList.add("hidden"));

    // Search
    let searchTimeout = null;
    searchInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        btnClearSearch.classList.toggle("hidden", val === "");
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadMembers(val);
        }, 300);
    });

    btnClearSearch.addEventListener("click", () => {
        searchInput.value = "";
        btnClearSearch.classList.add("hidden");
        loadMembers("");
    });

    btnRefresh.addEventListener("click", () => {
        loadMembers(searchInput.value.trim());
    });

    // ==========================================
    // 4. Learning Materials Tab Management
    // ==========================================
    function renderMaterialsTable(materials) {
        if (!materials || materials.length === 0) {
            materialsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-muted">ยังไม่มีรายการสื่อการเรียนรู้</td></tr>`;
            return;
        }

        let html = "";
        materials.forEach((mat, idx) => {
            html += `
                <tr>
                    <td style="text-align: center; font-weight:600;">${idx + 1}</td>
                    <td><span class="badge-role" style="background:#eff6ff; color:#2563eb; border-color:#bfdbfe;">${escapeHtml(mat.category)}</span></td>
                    <td><strong>${escapeHtml(mat.title)}</strong></td>
                    <td><small class="text-muted">${escapeHtml(mat.description || '-')}</small></td>
                    <td>${escapeHtml(mat.duration || '-')}</td>
                    <td style="text-align: center;">
                        <a href="${escapeHtml(mat.content_url)}" target="_blank" class="btn-secondary-sm" style="display:inline-flex;">
                            <i data-lucide="external-link" class="icon-sm"></i>
                            <span>เปิดลิงก์</span>
                        </a>
                    </td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-icon-table btn-delete-mat" data-id="${mat.id}" title="ลบรายการนี้">
                            <i data-lucide="trash-2" class="icon-sm"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        materialsTableBody.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        document.querySelectorAll(".btn-delete-mat").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = parseInt(btn.getAttribute("data-id"));
                if (confirm("คุณต้องการลบสื่อการเรียนรู้นี้ใช่หรือไม่?")) {
                    await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
                    showToast("ลบสื่อการเรียนรู้เรียบร้อย");
                    loadSettings();
                }
            });
        });
    }

    if (btnOpenAddMaterialModal) {
        btnOpenAddMaterialModal.addEventListener("click", () => {
            newMaterialForm.reset();
            addMaterialModal.classList.remove("hidden");
        });
    }

    const hideAddMatModal = () => addMaterialModal.classList.add("hidden");
    if (btnCloseAddMaterial) btnCloseAddMaterial.addEventListener("click", hideAddMatModal);
    if (btnCancelAddMaterial) btnCancelAddMaterial.addEventListener("click", hideAddMatModal);

    if (newMaterialForm) {
        newMaterialForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById("matTitle").value.trim(),
                category: document.getElementById("matCategory").value,
                content_type: document.getElementById("matContentType").value,
                content_url: document.getElementById("matUrl").value.trim(),
                duration: document.getElementById("matDuration").value.trim(),
                description: document.getElementById("matDesc").value.trim()
            };

            try {
                const res = await fetch("/api/admin/materials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    showToast("เพิ่มสื่อการเรียนรู้ใหม่เรียบร้อยแล้ว");
                    hideAddMatModal();
                    loadSettings();
                } else {
                    alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
                }
            } catch (err) {
                alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
            }
        });
    }

    // ==========================================
    // 5. Settings, Appearance & Form Builder
    // ==========================================
    async function loadSettings() {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.status === 401) {
                showLogin();
                return;
            }
            const data = await res.json();
            currentAppearance = data.appearance || {};
            currentFieldsList = data.fields || [];
            currentMaterialsList = data.materials || [];

            populateAppearanceForm(currentAppearance);
            renderFieldsTable(currentFieldsList);
            renderMaterialsTable(currentMaterialsList);
        } catch (err) {
            console.error("Failed to load settings:", err);
        }
    }

    function populateAppearanceForm(app) {
        appBrandName.value = app.brand_name || "";
        appLogoUrl.value = app.logo_url || "";
        appBrandTitle.value = app.brand_title || "";
        appBrandSubtitle.value = app.brand_subtitle || "";
        appNoticeText.value = app.notice_text || "";
        appBtnText.value = app.btn_text || "ลงทะเบียนเข้าร่วมโครงการ";
        appCardTier.value = app.card_tier || "SEED MEMBER";
        appCardTheme.value = app.card_theme || "deep_navy";
        appCustomBg.value = app.card_custom_bg || "";
        appAccentColor.value = app.accent_color || "#c53030";
        appAccentColorText.value = app.accent_color || "#c53030";

        customGradientGroup.classList.toggle("hidden", app.card_theme !== "custom");
        updateLivePreview();
    }

    function updateLivePreview() {
        const brand = appBrandName.value.trim() || "SEED TO SUCCESS";
        prevBrandName.textContent = brand;
        prevCardBrand.textContent = brand;
        prevBrandTitle.textContent = appBrandTitle.value.trim() || "โครงการ SEED TO SUCCESS";
        prevBrandSubtitle.textContent = appBrandSubtitle.value.trim() || "";
        prevCardTier.textContent = appCardTier.value.trim() || "MEMBER";
        prevBtn.textContent = appBtnText.value.trim() || "ลงทะเบียนเข้าร่วมโครงการ";
        prevBtn.style.backgroundColor = appAccentColor.value;

        const theme = appCardTheme.value;
        if (theme === "custom") {
            prevCard.style.background = appCustomBg.value || "#0f172a";
        } else {
            prevCard.style.background = CARD_THEME_GRADIENTS[theme] || CARD_THEME_GRADIENTS.deep_navy;
        }

        const headerLogo = document.getElementById("headerBrandLogo");
        if (headerLogo) headerLogo.textContent = brand;
    }

    [appBrandName, appBrandTitle, appBrandSubtitle, appCardTier, appBtnText, appCustomBg].forEach(el => {
        el.addEventListener("input", updateLivePreview);
    });

    appCardTheme.addEventListener("change", () => {
        customGradientGroup.classList.toggle("hidden", appCardTheme.value !== "custom");
        updateLivePreview();
    });

    appAccentColor.addEventListener("input", (e) => {
        appAccentColorText.value = e.target.value;
        updateLivePreview();
    });

    appAccentColorText.addEventListener("input", (e) => {
        appAccentColor.value = e.target.value;
        updateLivePreview();
    });

    btnSaveAppearance.addEventListener("click", async () => {
        const payload = {
            brand_name: appBrandName.value.trim(),
            logo_url: appLogoUrl.value.trim(),
            brand_title: appBrandTitle.value.trim(),
            brand_subtitle: appBrandSubtitle.value.trim(),
            notice_text: appNoticeText.value.trim(),
            btn_text: appBtnText.value.trim(),
            card_tier: appCardTier.value.trim(),
            card_theme: appCardTheme.value,
            card_custom_bg: appCustomBg.value.trim(),
            accent_color: appAccentColor.value
        };

        try {
            btnSaveAppearance.disabled = true;
            const res = await fetch("/api/admin/settings/appearance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            btnSaveAppearance.disabled = false;

            if (data.success) {
                showToast("บันทึกการตั้งค่าหน้าตาโครงการเรียบร้อยแล้ว");
                currentAppearance = data.appearance;
            } else {
                alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (e) {
            btnSaveAppearance.disabled = false;
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        }
    });

    // Form Fields Builder
    function renderFieldsTable(fields) {
        if (!fields || fields.length === 0) {
            fieldsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-muted">ไม่พบข้อมูลฟิลด์</td></tr>`;
            return;
        }

        let html = "";
        fields.forEach((f, idx) => {
            const isSystem = !!f.system;
            const isChecked = f.enabled !== false;
            const isReq = !!f.required;
            const typeLabel = getTypeLabel(f.type);
            const isSelect = f.type === "select";
            const optionsStr = isSelect && Array.isArray(f.options) ? f.options.join(", ") : "";

            html += `
                <tr data-index="${idx}">
                    <td style="text-align: center;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="field-toggle-enabled" data-idx="${idx}" ${isChecked ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td>
                        <span class="member-code-badge" style="font-size:12px;">${escapeHtml(f.id)}</span>
                        ${isSystem ? '<small style="display:block; color:#94a3b8; font-size:10px;">ระบบ</small>' : ''}
                    </td>
                    <td>
                        <input type="text" class="form-input field-label-input" data-idx="${idx}" value="${escapeHtml(f.label || '')}">
                    </td>
                    <td>
                        <span style="font-size:12px; font-weight:500; color:#475569;">${typeLabel}</span>
                    </td>
                    <td>
                        ${isSelect ? `
                            <textarea class="form-input field-options-input" data-idx="${idx}" rows="2" style="font-size:12px; line-height:1.4;" placeholder="ตัวเลือกแต่ละข้อ คั่นด้วยเครื่องหมายจุลภาค (,)">${escapeHtml(optionsStr)}</textarea>
                        ` : `
                            <input type="text" class="form-input field-placeholder-input" data-idx="${idx}" value="${escapeHtml(f.placeholder || '')}" placeholder="ตัวอย่างที่แสดงในช่อง">
                        `}
                    </td>
                    <td style="text-align: center;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="field-toggle-required" data-idx="${idx}" ${isReq ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td style="text-align: center;">
                        ${!isSystem ? `
                            <button type="button" class="btn-icon-table btn-delete-field" data-idx="${idx}" title="ลบช่องนี้">
                                <i data-lucide="trash-2" class="icon-sm"></i>
                            </button>
                        ` : `
                            <span style="color:#cbd5e1; font-size:11px;">-</span>
                        `}
                    </td>
                </tr>
            `;
        });

        fieldsTableBody.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        document.querySelectorAll(".field-toggle-enabled").forEach(chk => {
            chk.addEventListener("change", (e) => {
                const idx = parseInt(e.target.getAttribute("data-idx"));
                currentFieldsList[idx].enabled = e.target.checked;
            });
        });

        document.querySelectorAll(".field-toggle-required").forEach(chk => {
            chk.addEventListener("change", (e) => {
                const idx = parseInt(e.target.getAttribute("data-idx"));
                currentFieldsList[idx].required = e.target.checked;
            });
        });

        document.querySelectorAll(".field-label-input").forEach(inp => {
            inp.addEventListener("input", (e) => {
                const idx = parseInt(e.target.getAttribute("data-idx"));
                currentFieldsList[idx].label = e.target.value.trim();
            });
        });

        document.querySelectorAll(".field-placeholder-input").forEach(inp => {
            inp.addEventListener("input", (e) => {
                const idx = parseInt(e.target.getAttribute("data-idx"));
                currentFieldsList[idx].placeholder = e.target.value;
            });
        });

        document.querySelectorAll(".field-options-input").forEach(inp => {
            inp.addEventListener("input", (e) => {
                const idx = parseInt(e.target.getAttribute("data-idx"));
                const opts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                currentFieldsList[idx].options = opts;
            });
        });

        document.querySelectorAll(".btn-delete-field").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-idx"));
                if (confirm(`คุณต้องการลบช่อง "${currentFieldsList[idx].label || currentFieldsList[idx].id}" ใช่หรือไม่?`)) {
                    currentFieldsList.splice(idx, 1);
                    renderFieldsTable(currentFieldsList);
                }
            });
        });
    }

    function getTypeLabel(type) {
        const map = {
            text: "ข้อความสั้น",
            textarea: "ข้อความยาว",
            number: "ตัวเลข",
            tel: "เบอร์โทรศัพท์",
            email: "อีเมล",
            select: "Dropdown",
            birthday: "วันเกิด 3 ช่อง",
            date: "วันที่",
            pdpa: "ยินยอม PDPA"
        };
        return map[type] || type;
    }

    btnSaveFields.addEventListener("click", async () => {
        try {
            btnSaveFields.disabled = true;
            const res = await fetch("/api/admin/settings/fields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentFieldsList)
            });
            const data = await res.json();
            btnSaveFields.disabled = false;

            if (data.success) {
                showToast("บันทึกการตั้งค่าฟิลด์แบบฟอร์มเรียบร้อยแล้ว");
                currentFieldsList = data.fields;
                renderFieldsTable(currentFieldsList);
            } else {
                alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (e) {
            btnSaveFields.disabled = false;
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        }
    });

    btnResetFields.addEventListener("click", async () => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้นโครงการ SEED TO SUCCESS?")) {
            const res = await fetch("/api/admin/settings/reset", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                showToast("คืนค่าเริ่มต้นทั้งหมดเรียบร้อยแล้ว");
                loadSettings();
            }
        }
    });

    // Add Field Modal
    btnOpenAddFieldModal.addEventListener("click", () => {
        newFieldForm.reset();
        groupNewFieldOptions.style.display = "none";
        addFieldModal.classList.remove("hidden");
    });

    const hideAddFieldModal = () => addFieldModal.classList.add("hidden");
    if (btnCloseAddField) btnCloseAddField.addEventListener("click", hideAddFieldModal);
    if (btnCancelAddField) btnCancelAddField.addEventListener("click", hideAddFieldModal);

    newFieldType.addEventListener("change", () => {
        groupNewFieldOptions.style.display = newFieldType.value === "select" ? "block" : "none";
    });

    newFieldForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("newFieldId").value.trim().toLowerCase();
        const label = document.getElementById("newFieldLabel").value.trim();
        const type = newFieldType.value;
        const placeholder = document.getElementById("newFieldPlaceholder").value.trim();
        const required = document.getElementById("newFieldRequired").checked;
        const optionsRaw = document.getElementById("newFieldOptions").value.trim();

        if (currentFieldsList.some(f => f.id === id)) {
            alert(`รหัสฟิลด์ "${id}" มีอยู่แล้ว กรุณาใช้ชื่ออื่น`);
            return;
        }

        const newField = {
            id: id,
            label: label,
            type: type,
            placeholder: placeholder,
            required: required,
            enabled: true,
            system: false
        };

        if (type === "select") {
            newField.options = optionsRaw ? optionsRaw.split(",").map(s => s.trim()).filter(Boolean) : ["ตัวเลือก 1", "ตัวเลือก 2"];
        }

        currentFieldsList.push(newField);
        renderFieldsTable(currentFieldsList);
        hideAddFieldModal();
        showToast(`เพิ่มช่อง "${label}" เรียบร้อยแล้ว (อย่าลืมกด "บันทึกการตั้งค่าฟิลด์")`);
    });

    // Toast
    let toastTimeout = null;
    function showToast(msg) {
        if (!toast) return;
        toast.innerHTML = `<i data-lucide="check-circle" style="width:18px;height:18px;color:#10b981;"></i> <span>${escapeHtml(msg)}</span>`;
        toast.classList.remove("hidden");
        if (window.lucide) window.lucide.createIcons();

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add("hidden");
        }, 3000);
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

    // Start
    checkAuth();
});
