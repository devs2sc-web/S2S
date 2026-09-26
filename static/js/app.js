/**
 * LINE LIFF Membership Client - Dynamic Fields & Theme Customization
 */

document.addEventListener("DOMContentLoaded", async () => {
    // DOM Elements
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    const registrationScreen = document.getElementById("registrationScreen");
    const memberCardScreen = document.getElementById("memberCardScreen");
    const signupForm = document.getElementById("signupForm");
    const dynamicFormFields = document.getElementById("dynamicFormFields");
    const formErrorBanner = document.getElementById("formErrorBanner");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnSubmitText = document.getElementById("btnSubmitText");
    const lineUserBadge = document.getElementById("lineUserBadge");
    const userAvatar = document.getElementById("userAvatar");
    const userDisplayName = document.getElementById("userDisplayName");
    const devModeNotice = document.getElementById("devModeNotice");

    // Hidden LINE inputs
    const inputLineUserId = document.getElementById("lineUserId");
    const inputLineDisplayName = document.getElementById("lineDisplayName");
    const inputLinePictureUrl = document.getElementById("linePictureUrl");

    // Privacy Modal
    const privacyModal = document.getElementById("privacyModal");
    const btnClosePrivacy = document.getElementById("btnClosePrivacy");
    const btnAcceptPrivacy = document.getElementById("btnAcceptPrivacy");
    const btnCloseLiff = document.getElementById("btnCloseLiff");
    const btnCloseLiffTop = document.getElementById("btnCloseLiffTop");

    if (btnClosePrivacy) btnClosePrivacy.addEventListener("click", () => privacyModal.classList.add("hidden"));
    if (btnAcceptPrivacy) btnAcceptPrivacy.addEventListener("click", () => privacyModal.classList.add("hidden"));

    const handleCloseWindow = () => {
        if (window.liff && liff.isInClient()) {
            liff.closeWindow();
        } else {
            alert("ท่านสามารถปิดหน้านี้ หรือกดปิดเบราว์เซอร์ได้");
        }
    };
    if (btnCloseLiff) btnCloseLiff.addEventListener("click", handleCloseWindow);
    if (btnCloseLiffTop) btnCloseLiffTop.addEventListener("click", handleCloseWindow);

    let configData = null;
    let formFields = [];
    let appearance = {};

    const CARD_THEME_GRADIENTS = {
        luxury_black: "linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 50%, #111111 100%)",
        luxury_gold: "linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #8b6508 100%)",
        deep_navy: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)",
        emerald: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)",
        ruby: "linear-gradient(135deg, #881337 0%, #be123c 50%, #4c0519 100%)"
    };

    // ==========================================
    // 1. Fetch Config & Settings
    // ==========================================
    try {
        const res = await fetch("/api/config");
        configData = await res.json();
        appearance = configData.appearance || {};
        formFields = configData.fields || [];

        applyAppearance(appearance);
        renderDynamicForm(formFields);
    } catch (e) {
        console.error("Failed to fetch config:", e);
    }

    // ==========================================
    // 2. Apply Custom Appearance
    // ==========================================
    function applyAppearance(app) {
        const brand = app.brand_name || "MEMBER";
        document.title = `${brand} - สมาชิก LINE Official`;

        // Logo / Title
        const logoContainer = document.getElementById("brandLogoContainer");
        if (app.logo_url && app.logo_url.trim() !== "") {
            logoContainer.innerHTML = `<img src="${escapeHtml(app.logo_url)}" alt="${escapeHtml(brand)}" style="max-height:60px; max-width:200px; margin:0 auto 12px; display:block;">`;
        } else {
            logoContainer.innerHTML = `<h1 class="brand-title" id="displayBrandName">${escapeHtml(brand)}</h1>`;
        }

        const titleEl = document.getElementById("displayBrandTitle");
        if (titleEl) titleEl.textContent = app.brand_title || "";

        const subEl = document.getElementById("displayBrandSubtitle");
        if (subEl) subEl.textContent = app.brand_subtitle || "";

        const noticeEl = document.getElementById("displayNoticeText");
        if (noticeEl) noticeEl.textContent = app.notice_text || "";

        const footerBrand = document.getElementById("footerBrandName");
        if (footerBrand) footerBrand.textContent = brand;

        if (btnSubmitText) btnSubmitText.textContent = app.btn_text || "ยืนยันการลงทะเบียน";

        // Accent Color
        if (app.accent_color) {
            btnSubmit.style.backgroundColor = app.accent_color;
        }

        // Digital Card Appearance
        const cardBrand = document.getElementById("cardBrandName");
        if (cardBrand) cardBrand.textContent = brand;

        const cardTier = document.getElementById("cardTierBadge");
        if (cardTier) cardTier.textContent = app.card_tier || "VIP MEMBER";

        const cardElem = document.getElementById("digitalMemberCard");
        if (cardElem) {
            if (app.card_theme === "custom" && app.card_custom_bg) {
                cardElem.style.background = app.card_custom_bg;
            } else if (app.card_theme && CARD_THEME_GRADIENTS[app.card_theme]) {
                cardElem.style.background = CARD_THEME_GRADIENTS[app.card_theme];
            }
        }
    }

    // ==========================================
    // 3. Render Dynamic Form Fields
    // ==========================================
    function renderDynamicForm(fields) {
        if (!dynamicFormFields) return;
        dynamicFormFields.innerHTML = "";

        fields.forEach(f => {
            if (f.enabled === false) return; // Skip disabled fields

            const isRequired = !!f.required;
            const reqStar = isRequired ? '<span class="required">*</span>' : '';
            const fieldId = f.id;
            const label = escapeHtml(f.label || fieldId);
            const placeholder = escapeHtml(f.placeholder || "");

            const formGroup = document.createElement("div");
            formGroup.className = "form-group";
            formGroup.setAttribute("data-field-id", fieldId);

            if (f.type === "birthday") {
                formGroup.innerHTML = `
                    <label class="form-label">${label} ${reqStar}</label>
                    <div class="birthday-grid">
                        <div class="select-wrapper">
                            <select id="birthDay" name="birth_day" class="form-select">
                                <option value="">วัน</option>
                            </select>
                            <i data-lucide="chevron-down" class="select-arrow"></i>
                        </div>
                        <div class="select-wrapper">
                            <select id="birthMonth" name="birth_month" class="form-select">
                                <option value="">เดือน</option>
                                <option value="1">มกราคม</option>
                                <option value="2">กุมภาพันธ์</option>
                                <option value="3">มีนาคม</option>
                                <option value="4">เมษายน</option>
                                <option value="5">พฤษภาคม</option>
                                <option value="6">มิถุนายน</option>
                                <option value="7">กรกฎาคม</option>
                                <option value="8">สิงหาคม</option>
                                <option value="9">กันยายน</option>
                                <option value="10">ตุลาคม</option>
                                <option value="11">พฤศจิกายน</option>
                                <option value="12">ธันวาคม</option>
                            </select>
                            <i data-lucide="chevron-down" class="select-arrow"></i>
                        </div>
                        <div class="select-wrapper">
                            <select id="birthYear" name="birth_year" class="form-select">
                                <option value="">ปี (พ.ศ.)</option>
                            </select>
                            <i data-lucide="chevron-down" class="select-arrow"></i>
                        </div>
                    </div>
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            } else if (f.type === "tel" || fieldId === "phone") {
                formGroup.innerHTML = `
                    <label class="form-label" for="${fieldId}">${label} ${reqStar}</label>
                    <div class="phone-input-group">
                        <div class="phone-prefix-badge">
                            <span>+66</span>
                            <input type="hidden" name="phone_prefix" value="+66">
                        </div>
                        <input type="tel" id="${fieldId}" name="${fieldId}" class="form-input phone-field" placeholder="${placeholder || '900123456'}" maxlength="10">
                    </div>
                    <span class="input-hint">เช่น 0812345678 หรือ 812345678</span>
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            } else if (f.type === "select") {
                const options = Array.isArray(f.options) ? f.options : [];
                let optsHtml = "";
                options.forEach(opt => {
                    optsHtml += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
                });
                formGroup.innerHTML = `
                    <label class="form-label" for="${fieldId}">${label} ${reqStar}</label>
                    <div class="select-wrapper">
                        <select id="${fieldId}" name="${fieldId}" class="form-select">
                            ${optsHtml}
                        </select>
                        <i data-lucide="chevron-down" class="select-arrow"></i>
                    </div>
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            } else if (f.type === "textarea") {
                formGroup.innerHTML = `
                    <label class="form-label" for="${fieldId}">${label} ${reqStar}</label>
                    <textarea id="${fieldId}" name="${fieldId}" class="form-input" rows="3" placeholder="${placeholder}"></textarea>
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            } else if (f.type === "pdpa") {
                formGroup.className = "consent-group";
                formGroup.innerHTML = `
                    <label class="custom-checkbox">
                        <input type="checkbox" id="${fieldId}" name="${fieldId}" checked>
                        <span class="checkmark"></span>
                        <span class="consent-text">
                            ฉันได้อ่านและยอมรับ <a href="#privacyPolicy" class="link" id="linkPrivacy">นโยบายความเป็นส่วนตัว (Privacy Policy)</a> และยินยอมให้จัดเก็บข้อมูลเพื่อรับบริการและสิทธิประโยชน์
                        </span>
                    </label>
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            } else {
                // Default text, number, email, date
                const inputType = f.type || "text";
                formGroup.innerHTML = `
                    <label class="form-label" for="${fieldId}">${label} ${reqStar}</label>
                    <input type="${inputType}" id="${fieldId}" name="${fieldId}" class="form-input" placeholder="${placeholder}">
                    <span class="error-msg" id="err_${fieldId}"></span>
                `;
            }

            dynamicFormFields.appendChild(formGroup);
        });

        // Initialize birthday options if birthday field exists
        initBirthdayDropdowns();

        // Bind Privacy Modal link
        const linkPrivacy = document.getElementById("linkPrivacy");
        if (linkPrivacy && privacyModal) {
            linkPrivacy.addEventListener("click", (e) => {
                e.preventDefault();
                privacyModal.classList.remove("hidden");
            });
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function initBirthdayDropdowns() {
        const daySelect = document.getElementById("birthDay");
        const yearSelect = document.getElementById("birthYear");

        if (daySelect && daySelect.options.length <= 1) {
            for (let i = 1; i <= 31; i++) {
                const opt = document.createElement("option");
                opt.value = i.toString();
                opt.textContent = i.toString();
                daySelect.appendChild(opt);
            }
        }

        if (yearSelect && yearSelect.options.length <= 1) {
            const currentYearAD = new Date().getFullYear();
            for (let ad = currentYearAD - 12; ad >= currentYearAD - 95; ad--) {
                const be = ad + 543;
                const opt = document.createElement("option");
                opt.value = ad.toString();
                opt.textContent = `${be} (${ad})`;
                yearSelect.appendChild(opt);
            }
        }
    }

    // ==========================================
    // 4. LINE LIFF Integration
    // ==========================================
    const liffId = configData && configData.liff_id ? configData.liff_id : (window.APP_CONFIG ? window.APP_CONFIG.liffId : "");

    async function initLiff() {
        if (!liffId || liffId.trim() === "") {
            console.warn("⚠️ No LIFF ID specified in config. Running in Browser/Demo Mode.");
            hideLoading();
            setupDemoMode();
            return;
        }

        try {
            loadingText.textContent = "กำลังเชื่อมต่อกับ LINE...";
            await liff.init({ liffId: liffId });

            if (!liff.isLoggedIn()) {
                loadingText.textContent = "กำลังพาคุณเข้าสู่ระบบ LINE...";
                liff.login();
                return;
            }

            // Get profile
            const profile = await liff.getProfile();
            const userId = profile.userId;
            const displayName = profile.displayName;
            const pictureUrl = profile.pictureUrl || "";

            inputLineUserId.value = userId;
            inputLineDisplayName.value = displayName;
            inputLinePictureUrl.value = pictureUrl;

            if (lineUserBadge) {
                userDisplayName.textContent = displayName;
                if (pictureUrl) userAvatar.src = pictureUrl;
                lineUserBadge.classList.remove("hidden");
            }

            // Check if already registered
            loadingText.textContent = "กำลังตรวจสอบสถานะสมาชิก...";
            const checkRes = await fetch(`/api/check-member?line_user_id=${encodeURIComponent(userId)}`);
            const checkData = await checkRes.json();

            if (checkData.exists && checkData.member) {
                showMemberCard(checkData.member);
            } else {
                guessNameFromDisplayName(displayName);
            }

            hideLoading();
        } catch (err) {
            console.error("LIFF Init Error:", err);
            hideLoading();
            setupDemoMode("ไม่สามารถเชื่อมต่อ LINE LIFF ได้ (ทำงานในโหมดทดสอบ)");
        }
    }

    function setupDemoMode(customMsg) {
        if (devModeNotice) {
            devModeNotice.innerHTML = `<small>🛠️ ${customMsg || "โหมดทดสอบผ่านเว็บเบราว์เซอร์ (สามารถจำลองการลงทะเบียนได้ทันที)"}</small>`;
        }
        if (!inputLineUserId.value) {
            inputLineUserId.value = "DEMO_LINE_" + Math.random().toString(36).substring(2, 9).toUpperCase();
            inputLineDisplayName.value = "สมาชิกทดสอบ";
        }
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
    }

    function guessNameFromDisplayName(displayName) {
        if (!displayName) return;
        const parts = displayName.trim().split(" ");
        const firstNameInput = document.getElementById("first_name");
        const lastNameInput = document.getElementById("last_name");
        if (parts.length >= 2) {
            if (firstNameInput && !firstNameInput.value) firstNameInput.value = parts[0];
            if (lastNameInput && !lastNameInput.value) lastNameInput.value = parts.slice(1).join(" ");
        } else if (parts.length === 1 && firstNameInput && !firstNameInput.value) {
            firstNameInput.value = parts[0];
        }
    }

    // ==========================================
    // 5. Dynamic Form Validation & Submit
    // ==========================================
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        let hasError = false;
        const payload = {
            line_user_id: inputLineUserId.value,
            line_display_name: inputLineDisplayName.value,
            line_picture_url: inputLinePictureUrl.value
        };

        // Iterate through all enabled form fields
        for (const f of formFields) {
            if (f.enabled === false) continue;
            const fid = f.id;
            const isReq = !!f.required;

            if (fid === "birthday") {
                const day = document.getElementById("birthDay") ? document.getElementById("birthDay").value : "";
                const month = document.getElementById("birthMonth") ? document.getElementById("birthMonth").value : "";
                const year = document.getElementById("birthYear") ? document.getElementById("birthYear").value : "";
                payload.birth_day = day;
                payload.birth_month = month;
                payload.birth_year = year;

                if (isReq && (!day || !month || !year)) {
                    showError("err_birthday", `กรุณาระบุ ${f.label || 'วันเกิด'} ให้ครบถ้วน`);
                    hasError = true;
                }
            } else if (fid === "pdpa_consent") {
                const checked = document.getElementById(fid) ? document.getElementById(fid).checked : false;
                payload.pdpa_consent = checked;
                if (isReq && !checked) {
                    showError(`err_${fid}`, `กรุณายินยอมเงื่อนไข ${f.label || 'PDPA'}`);
                    hasError = true;
                }
            } else if (fid === "phone") {
                const phoneInput = document.getElementById(fid);
                const rawVal = phoneInput ? phoneInput.value.trim() : "";
                const cleanPhone = rawVal.replace(/[^0-9]/g, "");
                payload.phone = cleanPhone;
                payload.phone_prefix = "+66";

                if (isReq && (!cleanPhone || cleanPhone.length < 9)) {
                    showError("err_phone", "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
                    hasError = true;
                }
            } else {
                const inputEl = document.getElementById(fid);
                const val = inputEl ? inputEl.value.trim() : "";
                payload[fid] = val;

                if (isReq && !val) {
                    showError(`err_${fid}`, `กรุณากรอกข้อมูล: ${f.label || fid}`);
                    hasError = true;
                }

                if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    showError(`err_${fid}`, "รูปแบบอีเมลไม่ถูกต้อง");
                    hasError = true;
                }
            }
        }

        if (hasError) {
            showBannerError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง");
            return;
        }

        // Submit to API
        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px;border-top-color:#fff;"></div> กำลังบันทึกข้อมูล...`;

            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                showBannerError(data.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<span>${appearance.btn_text || 'ยืนยันการลงทะเบียน'}</span> <i data-lucide="arrow-right" class="btn-icon"></i>`;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            showMemberCard(data.member);

        } catch (err) {
            console.error("Submission error:", err);
            showBannerError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<span>${appearance.btn_text || 'ยืนยันการลงทะเบียน'}</span> <i data-lucide="arrow-right" class="btn-icon"></i>`;
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // ==========================================
    // 6. Digital Member Card Display
    // ==========================================
    function showMemberCard(member) {
        registrationScreen.classList.add("hidden");
        memberCardScreen.classList.remove("hidden");

        const brand = appearance.brand_name || "MEMBER";
        const fullName = `${member.title && member.title !== 'ไม่ระบุ' ? member.title + ' ' : ''}${member.first_name} ${member.last_name}`;
        
        document.getElementById("cardMemberName").textContent = fullName;
        document.getElementById("cardMemberCode").textContent = member.member_code || "MBR-VIP";

        let phoneFormatted = member.phone;
        if (phoneFormatted && phoneFormatted.length === 10) {
            phoneFormatted = phoneFormatted.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        } else if (phoneFormatted && phoneFormatted.length === 9) {
            phoneFormatted = phoneFormatted.replace(/(\d{2})(\d{3})(\d{4})/, "0$1-$2-$3");
        }
        document.getElementById("cardMemberPhone").textContent = phoneFormatted || "-";

        const regDate = member.created_at ? member.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10);
        document.getElementById("cardRegisterDate").textContent = regDate;

        const qrContainer = document.getElementById("memberQrCode");
        qrContainer.innerHTML = "";
        if (window.QRCode) {
            new QRCode(qrContainer, {
                text: JSON.stringify({
                    code: member.member_code,
                    phone: member.phone,
                    name: fullName
                }),
                width: 140,
                height: 140,
                colorDark: "#111111",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.lucide) window.lucide.createIcons();
    }

    function showError(elementId, msg) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = msg;
            el.classList.add("visible");
        }
    }

    function clearErrors() {
        document.querySelectorAll(".error-msg").forEach(el => {
            el.textContent = "";
            el.classList.remove("visible");
        });
        if (formErrorBanner) {
            formErrorBanner.textContent = "";
            formErrorBanner.classList.add("hidden");
        }
    }

    function showBannerError(msg) {
        if (formErrorBanner) {
            formErrorBanner.textContent = msg;
            formErrorBanner.classList.remove("hidden");
            formErrorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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

    // Start LIFF
    initLiff();
});
