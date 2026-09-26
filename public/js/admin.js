/**
 * SEED TO SUCCESS - Firebase Admin Dashboard Logic
 * Direct Cloud Firestore & Firebase Auth integration
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    // DOM Elements - Auth & Modals
    const loginModal = document.getElementById("loginModal");
    const dashboardContainer = document.getElementById("dashboardContainer");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const adminEmailInput = document.getElementById("adminEmail");
    const adminPassInput = document.getElementById("adminPass");
    const loginError = document.getElementById("loginError");
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const toast = document.getElementById("toast");

    // Nav Tabs & Panes
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");

    // Members Tab Elements
    const searchInput = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");
    const btnRefresh = document.getElementById("btnRefresh");
    const btnBulkApprove = document.getElementById("btnBulkApprove");
    const btnExportCsv = document.getElementById("btnExportCsv");
    const membersTableBody = document.getElementById("membersTableBody");
    const statTotalMembers = document.getElementById("statTotalMembers");
    const statPendingLearning = document.getElementById("statPendingLearning");
    const statApprovedLearning = document.getElementById("statApprovedLearning");
    const countPendingBadge = document.getElementById("countPendingBadge");
    const accessFilterBtns = document.querySelectorAll(".btn-filter-pill");

    // Member Detail Modal
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
    const headerBrandLogo = document.getElementById("headerBrandLogo");

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

    // State Variables
    let currentAdminUser = null;
    let rawMembersList = [];
    let currentMaterialsList = [];
    let currentFieldsList = [];
    let currentAppearance = {};
    let currentFilter = "all";
    let membersUnsubscribe = null;

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
    // 2. Firebase Authentication
    // ==========================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentAdminUser = user;
            showDashboard();
        } else {
            currentAdminUser = null;
            if (membersUnsubscribe) {
                membersUnsubscribe();
                membersUnsubscribe = null;
            }
            showLogin();
        }
    });

    function showDashboard() {
        loginModal.classList.add("hidden");
        dashboardContainer.classList.remove("hidden");
        subscribeMembersRealtime();
        loadSettingsFromFirestore();
    }

    function showLogin() {
        loginModal.classList.remove("hidden");
        dashboardContainer.classList.add("hidden");
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            loginError.classList.add("hidden");

            const email = adminEmailInput.value.trim();
            const password = adminPassInput.value.trim();

            if (!email || !password) return;

            btnLogin.disabled = true;
            btnLogin.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:#fff;"></div> <span>กำลังเข้าสู่ระบบ...</span>`;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // Auth listener will handle showDashboard()
            } catch (err) {
                console.error("Firebase Login Error:", err);
                let msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
                if (err.code === "auth/user-not-found") msg = "ไม่พบบัญชีผู้ใช้นี้ในระบบ Firebase";
                else if (err.code === "auth/wrong-password") msg = "รหัสผ่านไม่ถูกต้อง";
                else if (err.code === "auth/too-many-requests") msg = "พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอสักครู่";
                else if (err.code === "auth/invalid-credential") msg = "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง";
                else if (err.message) msg = err.message;

                loginError.textContent = msg;
                loginError.classList.remove("hidden");
            } finally {
                btnLogin.disabled = false;
                btnLogin.innerHTML = `<span>เข้าสู่ระบบจัดการโครงการ</span> <i data-lucide="log-in" class="icon-sm"></i>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                await auth.signOut();
                showToast("ออกจากระบบเรียบร้อยแล้ว");
            } catch (err) {
                console.error("Logout error:", err);
            }
        });
    }

    // ==========================================
    // 3. Real-Time Members from Cloud Firestore
    // ==========================================
    function subscribeMembersRealtime() {
        membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">กำลังโหลดข้อมูล Real-time จาก Cloud Firestore...</td></tr>`;

        if (membersUnsubscribe) {
            membersUnsubscribe();
        }

        try {
            // Real-time listener for members collection
            membersUnsubscribe = db.collection("members")
                .onSnapshot((snapshot) => {
                    rawMembersList = [];
                    snapshot.forEach(doc => {
                        rawMembersList.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });

                    // Sort newest first
                    rawMembersList.sort((a, b) => {
                        const dateA = a.created_at || "";
                        const dateB = b.created_at || "";
                        return dateB.localeCompare(dateA);
                    });

                    updateMembersStats();
                    applyFilterAndRender();
                }, (err) => {
                    console.error("Firestore Members Snapshot Error:", err);
                    membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-danger">ไม่สามารถดึงข้อมูลสมาชิกได้ (${escapeHtml(err.message)})<br><small>กรุณาตรวจสอบสิทธิ์ Firestore Security Rules</small></td></tr>`;
                });
        } catch (e) {
            console.error("Failed to setup listener:", e);
        }
    }

    function updateMembersStats() {
        const total = rawMembersList.length;
        let pending = 0;
        let approved = 0;

        rawMembersList.forEach(m => {
            const access = m.learning_access || "PENDING";
            if (access === "APPROVED") approved++;
            else if (access === "PENDING") pending++;
        });

        statTotalMembers.textContent = total.toLocaleString();
        statPendingLearning.textContent = pending.toLocaleString();
        statApprovedLearning.textContent = approved.toLocaleString();
        countPendingBadge.textContent = pending.toLocaleString();
    }

    function applyFilterAndRender() {
        const searchQuery = (searchInput.value || "").trim().toLowerCase();

        let filtered = rawMembersList.filter(m => {
            const access = m.learning_access || "PENDING";
            if (currentFilter === "pending" && access !== "PENDING") return false;
            if (currentFilter === "approved" && access !== "APPROVED") return false;
            if (currentFilter === "no_access" && access !== "NO_ACCESS") return false;

            if (searchQuery) {
                const fullName = `${m.title || ''} ${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
                const code = (m.member_code || '').toLowerCase();
                const email = (m.email || '').toLowerCase();
                const phone = (m.phone || '').toLowerCase();
                const affiliation = (m.affiliation || '').toLowerCase();
                const lineName = (m.line_display_name || '').toLowerCase();

                const matched = fullName.includes(searchQuery) ||
                    code.includes(searchQuery) ||
                    email.includes(searchQuery) ||
                    phone.includes(searchQuery) ||
                    affiliation.includes(searchQuery) ||
                    lineName.includes(searchQuery);

                if (!matched) return false;
            }

            return true;
        });

        renderMembersTable(filtered);
    }

    function renderMembersTable(members) {
        if (!members || members.length === 0) {
            membersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">ไม่พบข้อมูลสมาชิกในเงื่อนไขนี้</td></tr>`;
            return;
        }

        let html = "";
        members.forEach(m => {
            const avatar = m.line_picture_url || "https://placehold.co/60x60/e2e8f0/64748b?text=SEED";
            const lineName = m.line_display_name || "ไม่ได้ระบุ";
            const fullName = `${m.title && m.title !== 'ไม่ระบุ' ? m.title + ' ' : ''}${m.first_name || ''} ${m.last_name || ''}`;
            const affiliation = m.affiliation || "นักศึกษา";
            const contactInfo = `<div>${escapeHtml(m.phone_prefix || '+66')} ${escapeHtml(m.phone || '-')}</div><small class="text-muted">${escapeHtml(m.email || '-')}</small>`;
            const regDate = m.created_at ? m.created_at.substring(0, 16).replace('T', ' ') : "-";

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
                    <td><span class="member-code-badge">${m.member_code || 'SEED-VIP'}</span></td>
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

        // Single-click Approve / Revoke handlers
        document.querySelectorAll(".btn-toggle-access").forEach(btn => {
            btn.addEventListener("click", async () => {
                const docId = btn.getAttribute("data-id");
                const targetStatus = btn.getAttribute("data-action");
                await setMemberAccessInFirestore(docId, targetStatus);
            });
        });

        // View Member Detail modal
        document.querySelectorAll(".btn-view").forEach(btn => {
            btn.addEventListener("click", () => {
                const docId = btn.getAttribute("data-id");
                const member = rawMembersList.find(item => item.id === docId);
                if (member) showMemberDetail(member);
            });
        });

        // Delete Member handler
        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", async () => {
                const docId = btn.getAttribute("data-id");
                const member = rawMembersList.find(item => item.id === docId);
                const name = member ? `${member.first_name} ${member.last_name}` : docId;
                if (confirm(`คุณต้องการลบข้อมูลสมาชิก "${name}" ออกจากระบบใช่หรือไม่?`)) {
                    await deleteMemberFromFirestore(docId);
                }
            });
        });
    }

    async function setMemberAccessInFirestore(docId, status) {
        try {
            const adminEmail = currentAdminUser ? currentAdminUser.email : "Admin";
            const updateData = {
                learning_access: status
            };
            if (status === "APPROVED") {
                updateData.approved_at = new Date().toISOString();
                updateData.approved_by = adminEmail;
            }

            await db.collection("members").doc(docId).update(updateData);

            // Audit log
            try {
                await db.collection("audit_logs").add({
                    action: "SET_ACCESS_STATUS",
                    target: docId,
                    status: status,
                    actor: adminEmail,
                    timestamp: new Date().toISOString()
                });
            } catch (ignore) {}

            showToast(status === "APPROVED" ? "อนุมัติสิทธิ์เข้าเรียนออนไลน์สำเร็จ" : "ปรับสถานะสิทธิ์เรียบร้อย");
        } catch (err) {
            console.error("Access status update error:", err);
            alert("เกิดข้อผิดพลาดในการปรับสถานะ: " + err.message);
        }
    }

    async function deleteMemberFromFirestore(docId) {
        try {
            await db.collection("members").doc(docId).delete();

            // Audit log
            try {
                await db.collection("audit_logs").add({
                    action: "DELETE_MEMBER",
                    target: docId,
                    actor: currentAdminUser ? currentAdminUser.email : "Admin",
                    timestamp: new Date().toISOString()
                });
            } catch (ignore) {}

            showToast("ลบข้อมูลสมาชิกเรียบร้อยแล้ว");
        } catch (err) {
            console.error("Delete error:", err);
            alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
        }
    }

    // Bulk Approve All Pending
    if (btnBulkApprove) {
        btnBulkApprove.addEventListener("click", async () => {
            const pendingList = rawMembersList.filter(m => (m.learning_access || "PENDING") === "PENDING");
            if (pendingList.length === 0) {
                alert("ไม่มีผู้เข้าร่วมที่รอการอนุมัติสิทธิ์ในขณะนี้");
                return;
            }

            if (confirm(`คุณต้องการอนุมัติสิทธิ์เข้าเรียนออนไลน์ (Part 2) ให้แก่ผู้ที่รอการพิจารณาทั้งหมด ${pendingList.length} คนพร้อมกันใช่หรือไม่?`)) {
                try {
                    btnBulkApprove.disabled = true;
                    btnBulkApprove.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></div> กำลังอนุมัติ...`;

                    const adminEmail = currentAdminUser ? currentAdminUser.email : "Admin";
                    const nowIso = new Date().toISOString();

                    // Firestore Batched Writes (up to 500 operations per batch)
                    const batchSize = 400;
                    for (let i = 0; i < pendingList.length; i += batchSize) {
                        const chunk = pendingList.slice(i, i + batchSize);
                        const batch = db.batch();

                        chunk.forEach(m => {
                            const ref = db.collection("members").doc(m.id);
                            batch.update(ref, {
                                learning_access: "APPROVED",
                                approved_at: nowIso,
                                approved_by: adminEmail
                            });
                        });

                        await batch.commit();
                    }

                    // Audit log
                    try {
                        await db.collection("audit_logs").add({
                            action: "BULK_APPROVE_ACCESS",
                            count: pendingList.length,
                            actor: adminEmail,
                            timestamp: nowIso
                        });
                    } catch (ignore) {}

                    showToast(`อนุมัติสิทธิ์ผู้ที่รอพิจารณาทั้งหมด ${pendingList.length} รายการเรียบร้อยแล้ว`);
                } catch (err) {
                    console.error("Bulk approve error:", err);
                    alert("เกิดข้อผิดพลาดในการอนุมัติ: " + err.message);
                } finally {
                    btnBulkApprove.disabled = false;
                    btnBulkApprove.innerHTML = `<i data-lucide="check-check" class="icon-sm"></i> <span>อนุมัติสิทธิ์ผู้ที่รอทั้งหมด</span>`;
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    // Filter Buttons (all, pending, approved, no_access)
    accessFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            accessFilterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            applyFilterAndRender();
        });
    });

    // Search Box
    let searchTimeout = null;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const val = searchInput.value.trim();
            btnClearSearch.classList.toggle("hidden", val === "");
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilterAndRender();
            }, 250);
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener("click", () => {
            searchInput.value = "";
            btnClearSearch.classList.add("hidden");
            applyFilterAndRender();
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener("click", () => {
            subscribeMembersRealtime();
            showToast("รีเฟรชข้อมูลเรียบร้อย");
        });
    }

    // Member Detail Modal
    function showMemberDetail(m) {
        const avatar = m.line_picture_url || "https://placehold.co/80x80/e2e8f0/64748b?text=SEED";
        const fullName = `${m.title && m.title !== 'ไม่ระบุ' ? m.title + ' ' : ''}${m.first_name || ''} ${m.last_name || ''}`;

        let customFieldsHtml = "";
        currentFieldsList.forEach(f => {
            if (!f.system && m[f.id] !== undefined) {
                customFieldsHtml += `<div class="detail-row"><span class="detail-lbl">${escapeHtml(f.label)}:</span><span class="detail-val">${escapeHtml(String(m[f.id]))}</span></div>`;
            }
        });

        const accessText = m.learning_access === "APPROVED"
            ? '<span style="color:#16a34a; font-weight:700;">✅ อนุมัติสิทธิ์แล้ว</span>'
            : (m.learning_access === "PENDING" ? '<span style="color:#d97706; font-weight:700;">⏳ รอการอนุมัติ</span>' : '<span style="color:#64748b;">เฉพาะร่วมสัมมนา</span>');

        detailModalBody.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <img src="${avatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" onerror="this.src='https://placehold.co/80x80/e2e8f0/64748b?text=SEED'">
                <div>
                    <h4 style="font-size:16px; font-weight:700;">${escapeHtml(fullName)}</h4>
                    <p style="color:#64748b; font-size:13px;">LINE: ${escapeHtml(m.line_display_name || '-')}</p>
                    <span class="member-code-badge" style="margin-top:4px; display:inline-block;">${m.member_code || 'SEED-VIP'}</span>
                </div>
            </div>
            <div class="detail-row"><span class="detail-lbl">สิทธิ์เข้าเรียน Part 2:</span><span class="detail-val">${accessText}</span></div>
            <div class="detail-row"><span class="detail-lbl">สถานะ / สถาบัน:</span><span class="detail-val">${escapeHtml(m.affiliation || 'นักศึกษา')}</span></div>
            ${m.student_id ? `<div class="detail-row"><span class="detail-lbl">รหัสนักศึกษา:</span><span class="detail-val">${escapeHtml(m.student_id)}</span></div>` : ''}
            <div class="detail-row"><span class="detail-lbl">เบอร์โทรศัพท์:</span><span class="detail-val">${escapeHtml(m.phone_prefix || '+66')} ${escapeHtml(m.phone || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">อีเมล:</span><span class="detail-val">${escapeHtml(m.email || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">ความสนใจ Part 2:</span><span class="detail-val">${escapeHtml(m.interest_part2 || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">LINE User ID:</span><span class="detail-val" style="font-family:monospace; font-size:11px;">${escapeHtml(m.line_user_id || '-')}</span></div>
            <div class="detail-row"><span class="detail-lbl">วันที่ลงทะเบียน:</span><span class="detail-val">${escapeHtml(m.created_at || '-')}</span></div>
            ${m.approved_at ? `<div class="detail-row"><span class="detail-lbl">วันที่อนุมัติสิทธิ์:</span><span class="detail-val">${escapeHtml(m.approved_at)} (โดย ${escapeHtml(m.approved_by || 'Admin')})</span></div>` : ''}
            ${customFieldsHtml}
        `;

        detailModal.classList.remove("hidden");
    }

    if (btnCloseDetail) {
        btnCloseDetail.addEventListener("click", () => detailModal.classList.add("hidden"));
    }

    // ==========================================
    // 4. Excel / CSV Export (Client-Side UTF-8 BOM)
    // ==========================================
    if (btnExportCsv) {
        btnExportCsv.addEventListener("click", async () => {
            if (rawMembersList.length === 0) {
                alert("ไม่มีข้อมูลสมาชิกสำหรับส่งออก");
                return;
            }

            try {
                // Log export audit
                try {
                    await db.collection("audit_logs").add({
                        action: "EXPORT_CSV_DATA",
                        actor: currentAdminUser ? currentAdminUser.email : "Admin",
                        count: rawMembersList.length,
                        timestamp: new Date().toISOString()
                    });
                } catch (ignore) {}

                // Build CSV with UTF-8 BOM so Thai characters render properly in Microsoft Excel
                let csvContent = "\ufeff";

                // Headers
                const headers = ["รหัสสมาชิก", "LINE User ID", "ชื่อใน LINE", "สิทธิ์เข้าเรียนออนไลน์ (Part 2)", "ผู้อนุมัติสิทธิ์", "วันเวลาที่อนุมัติ"];
                const fieldIds = [];

                currentFieldsList.forEach(f => {
                    headers.push(f.label || f.id);
                    fieldIds.push(f.id);
                });
                headers.push("วันที่ลงทะเบียน");

                csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(",") + "\r\n";

                // Data Rows
                rawMembersList.forEach(m => {
                    const row = [
                        m.member_code || "",
                        m.line_user_id || "",
                        m.line_display_name || "",
                        m.learning_access || "PENDING",
                        m.approved_by || "-",
                        m.approved_at || "-"
                    ];

                    fieldIds.forEach(fid => {
                        let val = "";
                        if (fid === "phone") {
                            val = `${m.phone_prefix || '+66'} ${m.phone || ''}`.trim();
                        } else if (fid === "birthday") {
                            val = m.birth_date || "";
                        } else if (fid === "pdpa_consent") {
                            val = m.pdpa_consent ? "ยินยอม" : "ไม่ยินยอม";
                        } else {
                            val = m[fid] !== undefined ? m[fid] : "";
                        }
                        row.push(val);
                    });

                    row.push(m.created_at || "");
                    csvContent += row.map(col => `"${String(col !== null && col !== undefined ? col : '').replace(/"/g, '""')}"`).join(",") + "\r\n";
                });

                // Download File
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                const dateStr = new Date().toISOString().substring(0, 10);
                a.href = url;
                a.download = `seed_to_success_members_${dateStr}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showToast(`ส่งออกข้อมูล ${rawMembersList.length} รายการเป็นไฟล์ Excel/CSV เรียบร้อย`);
            } catch (err) {
                console.error("Export Error:", err);
                alert("เกิดข้อผิดพลาดในการส่งออกไฟล์: " + err.message);
            }
        });
    }

    // ==========================================
    // 5. Learning Materials Management (Firestore)
    // ==========================================
    async function loadMaterialsFromFirestore() {
        try {
            const snap = await db.collection("learning_materials").get();
            if (snap.empty) {
                // Initialize with default materials if collection is empty
                console.log("Initializing learning materials collection with default content...");
                const batch = db.batch();
                DEFAULT_MATERIALS.forEach(mat => {
                    const ref = db.collection("learning_materials").doc();
                    batch.set(ref, mat);
                });
                await batch.commit();

                // Re-fetch
                const newSnap = await db.collection("learning_materials").get();
                currentMaterialsList = [];
                newSnap.forEach(doc => currentMaterialsList.push({ id: doc.id, ...doc.data() }));
            } else {
                currentMaterialsList = [];
                snap.forEach(doc => currentMaterialsList.push({ id: doc.id, ...doc.data() }));
            }

            currentMaterialsList.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            renderMaterialsTable(currentMaterialsList);
        } catch (err) {
            console.error("Load Materials Error:", err);
            currentMaterialsList = DEFAULT_MATERIALS;
            renderMaterialsTable(currentMaterialsList);
        }
    }

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
                            <span>เปิดดู</span>
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
                const docId = btn.getAttribute("data-id");
                if (confirm("คุณต้องการลบสื่อการเรียนรู้นี้ใช่หรือไม่?")) {
                    try {
                        await db.collection("learning_materials").doc(docId).delete();
                        showToast("ลบสื่อการเรียนรู้เรียบร้อยแล้ว");
                        await loadMaterialsFromFirestore();
                    } catch (err) {
                        alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
                    }
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
                description: document.getElementById("matDesc").value.trim(),
                order_index: currentMaterialsList.length + 1,
                is_published: 1,
                created_at: new Date().toISOString()
            };

            try {
                await db.collection("learning_materials").add(payload);
                showToast("เพิ่มสื่อการเรียนรู้ใหม่เรียบร้อยแล้ว");
                hideAddMatModal();
                await loadMaterialsFromFirestore();
            } catch (err) {
                console.error("Add material error:", err);
                alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
            }
        });
    }

    // ==========================================
    // 6. Settings & Appearance (Firestore)
    // ==========================================
    async function loadSettingsFromFirestore() {
        try {
            // Load Appearance
            const appDoc = await db.collection("settings").doc("appearance").get();
            if (appDoc.exists) {
                currentAppearance = Object.assign({}, DEFAULT_APPEARANCE, appDoc.data());
            } else {
                currentAppearance = { ...DEFAULT_APPEARANCE };
            }
            populateAppearanceForm(currentAppearance);

            // Load Form Fields
            const fieldsDoc = await db.collection("settings").doc("form_fields").get();
            if (fieldsDoc.exists && fieldsDoc.data().list) {
                currentFieldsList = fieldsDoc.data().list;
            } else {
                currentFieldsList = JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS));
            }
            renderFieldsTable(currentFieldsList);

            // Load Materials
            await loadMaterialsFromFirestore();
        } catch (err) {
            console.error("Error loading settings from Firestore:", err);
            currentAppearance = { ...DEFAULT_APPEARANCE };
            currentFieldsList = JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS));
            populateAppearanceForm(currentAppearance);
            renderFieldsTable(currentFieldsList);
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

        if (headerBrandLogo) headerBrandLogo.textContent = brand;
    }

    [appBrandName, appBrandTitle, appBrandSubtitle, appCardTier, appBtnText, appCustomBg].forEach(el => {
        if (el) el.addEventListener("input", updateLivePreview);
    });

    if (appCardTheme) {
        appCardTheme.addEventListener("change", () => {
            customGradientGroup.classList.toggle("hidden", appCardTheme.value !== "custom");
            updateLivePreview();
        });
    }

    if (appAccentColor && appAccentColorText) {
        appAccentColor.addEventListener("input", (e) => {
            appAccentColorText.value = e.target.value;
            updateLivePreview();
        });
        appAccentColorText.addEventListener("input", (e) => {
            appAccentColor.value = e.target.value;
            updateLivePreview();
        });
    }

    if (btnSaveAppearance) {
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
                btnSaveAppearance.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></div> กำลังบันทึก...`;

                await db.collection("settings").doc("appearance").set(payload, { merge: true });
                currentAppearance = payload;
                showToast("บันทึกการตั้งค่าหน้าตาโครงการเรียบร้อยแล้ว");
            } catch (err) {
                console.error("Save Appearance Error:", err);
                alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
            } finally {
                btnSaveAppearance.disabled = false;
                btnSaveAppearance.innerHTML = `<i data-lucide="save" class="icon-sm"></i> <span>บันทึกการตั้งค่าหน้าตา</span>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // ==========================================
    // 7. Form Fields Builder (Firestore)
    // ==========================================
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

    if (btnSaveFields) {
        btnSaveFields.addEventListener("click", async () => {
            try {
                btnSaveFields.disabled = true;
                btnSaveFields.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></div> กำลังบันทึก...`;

                await db.collection("settings").doc("form_fields").set({ list: currentFieldsList });
                showToast("บันทึกการตั้งค่าฟิลด์แบบฟอร์มเรียบร้อยแล้ว");
            } catch (err) {
                console.error("Save Fields Error:", err);
                alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
            } finally {
                btnSaveFields.disabled = false;
                btnSaveFields.innerHTML = `<i data-lucide="save" class="icon-sm"></i> <span>บันทึกการตั้งค่าฟิลด์</span>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    if (btnResetFields) {
        btnResetFields.addEventListener("click", async () => {
            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้นช่องกรอกข้อมูลของโครงการ SEED TO SUCCESS?")) {
                currentFieldsList = JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS));
                renderFieldsTable(currentFieldsList);
                showToast("คืนค่าฟิลด์เริ่มต้นแล้ว (กรุณากด 'บันทึกการตั้งค่าฟิลด์' เพื่อยืนยัน)");
            }
        });
    }

    // Add Field Modal
    if (btnOpenAddFieldModal) {
        btnOpenAddFieldModal.addEventListener("click", () => {
            newFieldForm.reset();
            groupNewFieldOptions.style.display = "none";
            addFieldModal.classList.remove("hidden");
        });
    }

    const hideAddFieldModal = () => addFieldModal.classList.add("hidden");
    if (btnCloseAddField) btnCloseAddField.addEventListener("click", hideAddFieldModal);
    if (btnCancelAddField) btnCancelAddField.addEventListener("click", hideAddFieldModal);

    if (newFieldType) {
        newFieldType.addEventListener("change", () => {
            groupNewFieldOptions.style.display = newFieldType.value === "select" ? "block" : "none";
        });
    }

    if (newFieldForm) {
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
    }

    // ==========================================
    // 8. Toast Helper & Escape HTML
    // ==========================================
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
});
