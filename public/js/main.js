// منطق الواجهة الأمامية لمنصة خدماتك الرقمية
function bootstrapApp() {
    initSettings();
    initNavigation();
    initInquiryForm();
    initPortfolioFilter();
    initEstimator();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}

let globalSettings = {
    whatsapp_number: '+962790000000',
    site_name: 'خدماتك الرقمية'
};

// 1. جلب إعدادات الموقع وتحديث روابط الواتساب ديناميكياً
async function initSettings() {
    try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.settings) {
                globalSettings = { ...globalSettings, ...data.settings };
                updateWhatsAppLinks(globalSettings.whatsapp_number);
            }
        }
    } catch (err) {
        console.warn('تعذر جلب الإعدادات المحدثة، تم استخدام الإعدادات الافتراضية.');
    }
}

function updateWhatsAppLinks(phone) {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent('مرحبًا، أود الاستفسار عن خدمات التصميم والبرمجة من منصة خدماتك الرقمية.');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${defaultMsg}`;

    // تحديث جميع أزرار الواتساب في الموقع
    const selectors = [
        '#floating-whatsapp',
        '#floating-whatsapp-btn',
        '#footer-whatsapp-link',
        '#direct-whatsapp-link',
        '#portfolio-whatsapp-btn',
        '#faq-whatsapp-btn',
        '#drawer-whatsapp-link'
    ];

    selectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.href = selector === '#direct-whatsapp-link' ? `https://wa.me/${cleanPhone}` : whatsappUrl;
            if (selector === '#direct-whatsapp-link' && el.textContent.includes('000')) {
                el.textContent = phone;
            }
        }
    });
}

// 2. القائمة المتنقلة للموبايل (Independent Mobile Drawer)
function initNavigation() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (!mobileBtn) return;

    // التأكد من وجود القائمة الجانبية والخلفية في الصفحة
    let drawer = document.getElementById('mobile-drawer');
    let backdrop = document.getElementById('mobile-drawer-backdrop');

    if (!drawer) {
        drawer = document.createElement('aside');
        drawer.id = 'mobile-drawer';
        drawer.className = 'mobile-drawer';
        drawer.setAttribute('aria-label', 'قائمة التنقل للهاتف');
        drawer.innerHTML = `
            <div class="mobile-drawer-header">
                <a href="/" class="drawer-brand">
                    <span>خدماتك الرقمية</span>
                    <span class="brand-dot"></span>
                </a>
                <button id="mobile-drawer-close" class="mobile-drawer-close" aria-label="إغلاق القائمة">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <nav class="mobile-drawer-nav">
                <ul class="mobile-drawer-list">
                    <li><a href="/" class="mobile-drawer-link"><span class="drawer-num">01</span><span>الرئيسية</span></a></li>
                    <li><a href="/services" class="mobile-drawer-link"><span class="drawer-num">02</span><span>الخدمات الرقمية</span></a></li>
                    <li><a href="/portfolio" class="mobile-drawer-link"><span class="drawer-num">03</span><span>معرض الأعمال</span></a></li>
                    <li><a href="/pricing" class="mobile-drawer-link"><span class="drawer-num">04</span><span>خطط الأسعار</span></a></li>
                    <li><a href="/process" class="mobile-drawer-link"><span class="drawer-num">05</span><span>طريقة العمل</span></a></li>
                    <li><a href="/blog" class="mobile-drawer-link"><span class="drawer-num">06</span><span>المدونة التقنية</span></a></li>
                    <li><a href="/faq" class="mobile-drawer-link"><span class="drawer-num">07</span><span>الأسئلة الشائعة</span></a></li>
                    <li><a href="/contact" class="mobile-drawer-link"><span class="drawer-num">08</span><span>تواصل معنا</span></a></li>
                </ul>
            </nav>
            <div class="mobile-drawer-footer">
                <a href="/contact" class="btn btn-primary btn-block">ابدأ مشروعك الآن</a>
                <a href="https://wa.me/962790000000" id="drawer-whatsapp-link" class="btn btn-secondary btn-block" target="_blank" rel="noopener">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.814 3.179 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.768-5.768-5.768zm3.364 8.16c-.14.394-.81.767-1.127.813-.318.046-.731.066-2.146-.516-1.706-.702-2.796-2.457-2.881-2.57-.085-.114-.689-.916-.689-1.747 0-.831.438-1.24.594-1.409.155-.169.339-.211.452-.211.113 0 .226 0 .325.006.103.006.24.019.349.279.113.268.395.962.43 1.032.035.07.058.152.012.245-.046.093-.07.151-.14.233-.07.081-.148.181-.211.243-.07.07-.144.146-.062.287.082.141.365.602.784.974.54.481.996.63 1.137.7.141.07.225.059.31-.039.084-.099.366-.424.464-.57.099-.147.197-.122.338-.07.141.052.898.423 1.053.5.155.078.258.117.296.183.038.066.038.384-.102.778z"/></svg>
                    <span>واتساب مباشر</span>
                </a>
            </div>
        `;
        document.body.appendChild(drawer);
    }

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.className = 'mobile-drawer-backdrop';
        document.body.appendChild(backdrop);
    }

    // تمييز الرابط النشط تلقائياً
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    drawer.querySelectorAll('.mobile-drawer-link').forEach(link => {
        const linkPath = link.getAttribute('href').replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else if (currentPath !== '/' && linkPath !== '/' && currentPath.startsWith(linkPath)) {
            link.classList.add('active');
        }
    });

    const closeBtn = document.getElementById('mobile-drawer-close') || drawer.querySelector('.mobile-drawer-close');

    function openDrawer() {
        drawer.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
        mobileBtn.setAttribute('aria-expanded', 'false');
    }

    // فتح وإغلاق القائمة عبر Event Delegation لضمان الاستجابة الفورية على كل الهواتف
    document.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('#mobile-menu-btn, .mobile-menu-btn');
        if (targetBtn) {
            e.preventDefault();
            e.stopPropagation();
            openDrawer();
            return;
        }

        const targetClose = e.target.closest('#mobile-drawer-close, .mobile-drawer-close, #mobile-drawer-backdrop');
        if (targetClose) {
            e.preventDefault();
            e.stopPropagation();
            closeDrawer();
            return;
        }

        const targetLink = e.target.closest('.mobile-drawer-link, .mobile-drawer-footer a');
        if (targetLink) {
            closeDrawer();
        }
    });

    // إغلاق بمفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('active')) {
            closeDrawer();
        }
    });

    // إغلاق عند تكبير الشاشة
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && drawer.classList.contains('active')) {
            closeDrawer();
        }
    });
}

// 3. فلترة معرض الأعمال
function initPortfolioFilter() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const portfolioCards = document.querySelectorAll('.work-card');

    if (!filterTabs.length) return;

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.getAttribute('data-category');

            portfolioCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// 4. نموذج طلب المشروع (Inquiry Form) في صفحة /contact
function initInquiryForm() {
    const form = document.getElementById('inquiry-form') || document.getElementById('main-order-form');
    if (!form) return;

    const statusMsg = document.getElementById('inquiry-status-msg');
    const fileInput = document.getElementById('project_file') || document.getElementById('order-file');
    const fileChosenInfo = document.getElementById('file-chosen-info');

    if (fileInput && fileChosenInfo) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const sizeKb = Math.round(file.size / 1024);
                fileChosenInfo.style.display = 'flex';
                fileChosenInfo.innerHTML = `<span>📎 تم اختيار: <strong>${file.name}</strong> (${sizeKb} KB)</span>`;
            } else {
                fileChosenInfo.style.display = 'none';
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        const customerName = (document.getElementById('client_name') || document.getElementById('order-name'))?.value.trim();
        const customerPhone = (document.getElementById('client_phone') || document.getElementById('order-phone'))?.value.trim();
        const customerEmail = (document.getElementById('client_email') || document.getElementById('order-email'))?.value.trim() || '';
        
        const serviceSelect = document.getElementById('service_type') || document.getElementById('order-service-select');
        const serviceName = serviceSelect ? serviceSelect.value : 'طلب مخصص';
        
        const budgetRange = (document.getElementById('budget_range') || document.getElementById('order-budget'))?.value || 'غير محدد';
        const deliveryDeadline = (document.getElementById('delivery_deadline') || document.getElementById('order-date'))?.value || 'مرن';
        const projectDetails = (document.getElementById('project_details') || document.getElementById('order-details'))?.value.trim();
        const fileInput = document.getElementById('project_file') || document.getElementById('order-file');

        if (!customerName || !customerPhone || !projectDetails) {
            showToast('يرجى تعبئة جميع الحقول المطلوبة (الاسم، الهاتف، وتفاصيل المشروع)');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>جاري إرسال طلبك...</span>`;

            const formData = new FormData();
            formData.append('customer_name', customerName);
            formData.append('customer_phone', customerPhone);
            formData.append('customer_email', customerEmail);
            formData.append('service_name', serviceName);
            formData.append('project_details', projectDetails);
            formData.append('required_date', deliveryDeadline);
            formData.append('estimated_budget', budgetRange);
            
            if (fileInput && fileInput.files[0]) {
                formData.append('attachment', fileInput.files[0]);
            }

            const response = await fetch('/api/orders', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                form.reset();
                if (statusMsg) {
                    statusMsg.style.display = 'block';
                    statusMsg.style.color = '#16a34a';
                    statusMsg.innerHTML = `تم إرسال طلبك بنجاح! رقم الطلب: <strong>${result.order_number}</strong>.<br>سنتواصل معك عبر الواتساب خلال أقل من ساعتين.`;
                }
                showToast(`تم استلام طلبك بنجاح برقم (${result.order_number})!`);

                // خيار فتح واتساب مباشرة
                if (result.whatsapp_url) {
                    setTimeout(() => {
                        window.open(result.whatsapp_url, '_blank');
                    }, 1200);
                }
            } else {
                showToast(result.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة ثانية.');
            }
        } catch (err) {
            console.error(err);
            showToast('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// نافذة التنبيهات السريعة (Toast)
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;flex-direction:column;gap:0.75rem;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background:#111111;color:#ffffff;padding:0.85rem 1.4rem;font-size:0.9rem;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.15);border:1px solid #333333;display:flex;align-items:center;gap:0.6rem;transition:all 0.3s ease;';
    toast.innerHTML = `<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// 5. حاسبة تقدير تكلفة وبناء المشروع التفاعلية
function initEstimator() {
    const servicePills = document.querySelectorAll('#estimator-service-pills .pill-btn');
    const speedPills = document.querySelectorAll('#estimator-speed-pills .pill-btn');
    const addonChecks = document.querySelectorAll('.estimator-addon-check');
    const totalDisplay = document.getElementById('estimator-total-display');
    const summaryService = document.getElementById('est-summary-service');
    const summarySpeed = document.getElementById('est-summary-speed');
    const whatsappOrderBtn = document.getElementById('estimator-whatsapp-order-btn');

    if (!totalDisplay) return;

    function recalculate() {
        let basePrice = 20;
        let serviceName = 'موقع متجر / شركة صغيرة';
        let speedPrice = 0;
        let speedName = 'تسليم قياسي (3-5 أيام)';
        let addonsTotal = 0;
        let selectedAddons = [];

        // Service pill
        const activeService = document.querySelector('#estimator-service-pills .pill-btn.active');
        if (activeService) {
            basePrice = parseInt(activeService.getAttribute('data-price')) || 20;
            serviceName = activeService.getAttribute('data-name') || '';
        }

        // Speed pill
        const activeSpeed = document.querySelector('#estimator-speed-pills .pill-btn.active');
        if (activeSpeed) {
            speedPrice = parseInt(activeSpeed.getAttribute('data-price')) || 0;
            speedName = activeSpeed.getAttribute('data-speed') || '';
        }

        // Addons
        addonChecks.forEach(chk => {
            if (chk.checked) {
                const addPrice = parseInt(chk.getAttribute('data-price')) || 0;
                addonsTotal += addPrice;
                selectedAddons.push(chk.getAttribute('data-name'));
            }
        });

        const grandTotal = basePrice + speedPrice + addonsTotal;
        totalDisplay.textContent = grandTotal;
        if (summaryService) summaryService.textContent = serviceName;
        if (summarySpeed) summarySpeed.textContent = speedName;

        // تحديث رابط الطلب المباشر عبر واتساب
        if (whatsappOrderBtn && globalSettings.whatsapp_number) {
            const cleanPhone = globalSettings.whatsapp_number.replace(/[^0-9]/g, '');
            const msg = encodeURIComponent(`مرحبًا، أود طلب مشروع من خلال حاسبة التكلفة التفاعلية في الموقع:\n- نوع الخدمة: ${serviceName}\n- سرعة الإنجاز: ${speedName}\n- الإضافات المختارة: ${selectedAddons.join(' + ') || 'بدون إضافات'}\n- التقدير الإجمالي: ${grandTotal} دينار أردني.\n\nأرجو تزويدي بالخطوات التالية لبدء العمل.`);
            whatsappOrderBtn.href = `https://wa.me/${cleanPhone}?text=${msg}`;
        }
    }

    servicePills.forEach(pill => {
        pill.addEventListener('click', () => {
            servicePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            recalculate();
        });
    });

    speedPills.forEach(pill => {
        pill.addEventListener('click', () => {
            speedPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            recalculate();
        });
    });

    addonChecks.forEach(chk => {
        chk.addEventListener('change', recalculate);
    });

    recalculate();
}

// 6. حماية الكود ومنع فحص العناصر والاختصارات (Comprehensive Anti-Inspect & Protection)
(function initCodeProtection() {
    // منع القائمة المنسدلة للزر الأيمن في جميع أنحاء الموقع
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        return false;
    });

    // منع اختصارات فحص الكود والطباعة وحفظ الصفحة
    document.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        const isCtrl = e.ctrlKey || e.metaKey;

        // Ctrl+Shift+I / J / C (DevTools)
        if (isCtrl && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U (View Source)
        if (isCtrl && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }

        // Ctrl+S (Save Page)
        if (isCtrl && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            return false;
        }

        // Ctrl+P (Print Page)
        if (isCtrl && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            return false;
        }
    });

    // منع سحب الصور والعناصر لمنع حفظها عشوائياً
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
            e.preventDefault();
            return false;
        }
    });

    // كتم سجلات الكونسول في بيئة الإنتاج لحماية البيانات
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        try {
            console.log = function() {};
            console.warn = function() {};
            console.info = function() {};
            console.debug = function() {};
        } catch(e) {}
    }
})();


