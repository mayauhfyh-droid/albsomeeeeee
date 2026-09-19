// =========================================================================
// منطق لوحة تحكم الإدارة (Admin Dashboard SPA Logic)
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileSidebar();
    initAdminTabs();
    loadDashboardStats();
    loadOrders();
    loadServices();
    loadPortfolio();
    loadBlogPosts();
    loadMessages();
    loadSettings();
    initGuideAccordion();
});

// 1. التحكم بالقائمة الجانبية في الهواتف والشاشات الصغيرة
function initMobileSidebar() {
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const closeBtn = document.getElementById('admin-sidebar-close');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
}

// 2. التبديل بين أقسام لوحة التحكم (Tabs)
function initAdminTabs() {
    const tabButtons = document.querySelectorAll('.sidebar-item-btn[data-tab]');
    const tabPanes = document.querySelectorAll('.admin-tab-pane');
    const pageTitle = document.getElementById('admin-page-title');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            if (!targetTab) return;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `tab-${targetTab}`) {
                    pane.classList.add('active');
                }
            });

            if (pageTitle) {
                const labelSpan = btn.querySelector('span:first-of-type') || btn.querySelector('span');
                pageTitle.textContent = labelSpan ? labelSpan.textContent.trim() : btn.textContent.trim();
            }

            // إغلاق القائمة الجانبية على الهواتف عند اختيار تبويب
            if (window.innerWidth <= 900) {
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            }

            // تحديث البيانات حسب التبويب النشط
            if (targetTab === 'overview') {
                loadDashboardStats();
                loadOrders();
            } else if (targetTab === 'orders') {
                loadOrders();
            } else if (targetTab === 'services') {
                loadServices();
            } else if (targetTab === 'portfolio') {
                loadPortfolio();
            } else if (targetTab === 'blog') {
                loadBlogPosts();
            } else if (targetTab === 'messages') {
                loadMessages();
            } else if (targetTab === 'settings') {
                loadSettings();
            }
        });
    });
}

// 3. إغلاق النوافذ المنبثقة (Modals)
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// 4. تحميل إحصائيات لوحة التحكم الحقيقية
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.success && data.stats) {
            const s = data.stats;
            const elTotal = document.getElementById('stat-total-orders');
            const elNew = document.getElementById('stat-new-orders');
            const elProgress = document.getElementById('stat-in-progress');
            const elCompleted = document.getElementById('stat-completed-orders');
            const elUnread = document.getElementById('stat-unread-messages');
            const elPortfolio = document.getElementById('stat-portfolio-count');
            const elBlog = document.getElementById('stat-blog-count');

            if (elTotal) elTotal.textContent = s.total_orders || 0;
            if (elNew) elNew.textContent = s.new_orders || 0;
            if (elProgress) elProgress.textContent = s.in_progress_orders || 0;
            if (elCompleted) elCompleted.textContent = s.completed_orders || 0;
            if (elUnread) elUnread.textContent = s.unread_messages || 0;
            if (elPortfolio) elPortfolio.textContent = s.portfolio_count || 0;
            if (elBlog) elBlog.textContent = s.blog_count || 0;

            // تحديث الشارات في القائمة الجانبية
            const newBadge = document.getElementById('badge-new-orders');
            if (newBadge) {
                newBadge.textContent = s.new_orders || 0;
                newBadge.style.display = s.new_orders > 0 ? 'inline-block' : 'none';
            }

            const msgBadge = document.getElementById('badge-unread-messages');
            if (msgBadge) {
                msgBadge.textContent = s.unread_messages || 0;
                msgBadge.style.display = s.unread_messages > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (err) {
        console.error('خطأ في تحميل الإحصائيات:', err);
    }
}

// 5. إدارة الطلبات (Orders Management)
let currentOrders = [];

async function loadOrders() {
    const tableBody = document.getElementById('orders-table-body');
    const overviewTableBody = document.getElementById('overview-orders-table-body');
    if (!tableBody && !overviewTableBody) return;

    try {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">جاري تحميل الطلبات...</td></tr>`;
        }
        const res = await fetch('/api/orders');
        const data = await res.json();

        if (data.success) {
            currentOrders = data.orders || [];
            if (tableBody) renderOrders(currentOrders);
            if (overviewTableBody) renderOverviewOrders(currentOrders.slice(0, 5));
        }
    } catch (err) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444;">تعذر تحميل الطلبات.</td></tr>`;
        }
    }
}

function renderOrders(orders) {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">لا توجد طلبات مسجلة حالياً.</td></tr>`;
        return;
    }

    tableBody.innerHTML = orders.map(order => {
        const statusClass = getStatusClass(order.status);
        const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
        const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `
            <tr>
                <td><strong>${escapeHtml(order.order_number)}</strong></td>
                <td>${escapeHtml(order.customer_name)}</td>
                <td dir="ltr" style="text-align: right;">${escapeHtml(order.customer_phone)}</td>
                <td><span style="color: #0284c7; font-weight: 600;">${escapeHtml(order.service_name)}</span></td>
                <td>${escapeHtml(order.estimated_budget || 'غير محدد')}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(order.status)}</span></td>
                <td style="font-size: 0.8rem; color: #64748b;">${dateStr}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn-icon" title="عرض وتعديل التفاصيل" onclick="openOrderModal(${order.id})">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحبًا ${order.customer_name}، بخصوص طلبك رقم (${order.order_number}) لخدمة ${order.service_name} من منصة خدماتك الرقمية:`)}" target="_blank" class="btn-icon whatsapp" title="مراسلة واتساب">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOverviewOrders(orders) {
    const overviewTableBody = document.getElementById('overview-orders-table-body');
    if (!overviewTableBody) return;

    if (orders.length === 0) {
        overviewTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #94a3b8;">لا توجد طلبات مسجلة بعد.</td></tr>`;
        return;
    }

    overviewTableBody.innerHTML = orders.map(order => {
        const statusClass = getStatusClass(order.status);
        const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        return `
            <tr>
                <td><strong>${escapeHtml(order.order_number)}</strong></td>
                <td>${escapeHtml(order.customer_name)}</td>
                <td><span style="color: #0284c7;">${escapeHtml(order.service_name)}</span></td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(order.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openOrderModal(${order.id})">عرض التفاصيل</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'جديد': return 'new';
        case 'تمت المراجعة': return 'reviewed';
        case 'قيد التنفيذ': return 'in_progress';
        case 'بانتظار معلومات من العميل': return 'waiting';
        case 'مكتمل': return 'completed';
        case 'ملغي': return 'cancelled';
        default: return 'new';
    }
}

// فلترة وبحث الطلبات
window.filterOrders = function() {
    const query = (document.getElementById('order-search-input')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('order-status-filter')?.value || 'all';

    const filtered = currentOrders.filter(order => {
        const matchesQuery = (
            (order.order_number || '').toLowerCase().includes(query) ||
            (order.customer_name || '').toLowerCase().includes(query) ||
            (order.customer_phone || '').toLowerCase().includes(query) ||
            (order.service_name || '').toLowerCase().includes(query)
        );

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderOrders(filtered);
};

// فتح نافذة تفاصيل وتعديل الطلب
let activeOrderId = null;
window.openOrderModal = function(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    activeOrderId = orderId;
    const elId = document.getElementById('modal-detail-id');
    const elName = document.getElementById('modal-detail-name');
    const elPhone = document.getElementById('modal-detail-phone');
    const elEmail = document.getElementById('modal-detail-email');
    const elService = document.getElementById('modal-detail-service');
    const elBudget = document.getElementById('modal-detail-budget');
    const elDate = document.getElementById('modal-detail-date');
    const elText = document.getElementById('modal-detail-text');

    if (elId) elId.textContent = order.order_number;
    if (elName) elName.textContent = order.customer_name;
    if (elPhone) elPhone.textContent = order.customer_phone;
    if (elEmail) elEmail.textContent = order.customer_email || 'غير متوفر';
    if (elService) elService.textContent = order.service_name;
    if (elBudget) elBudget.textContent = order.estimated_budget || 'غير محدد';
    if (elDate) elDate.textContent = order.required_date || 'غير محدد';
    if (elText) elText.textContent = order.project_details || '';
    
    // المرفقات
    const attachmentWrap = document.getElementById('modal-detail-attachments');
    if (attachmentWrap) {
        if (order.attachments) {
            try {
                const files = JSON.parse(order.attachments);
                if (Array.isArray(files) && files.length > 0) {
                    attachmentWrap.innerHTML = files.map(f => {
                        const isImg = /.(jpg|jpeg|png|webp|svg|gif)$/i.test(f);
                        if (isImg) {
                            return `
                                <div style="margin-top: 8px; padding: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
                                    <img src="${f}" alt="مرفق العميل" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 6px; display: block; margin-bottom: 6px;">
                                    <a href="${f}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">🔍 فتح أو تنزيل الصورة كاملة</a>
                                </div>
                            `;
                        }
                        return `<a href="${f}" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; margin: 4px;">📥 تحميل المستند المرفق</a>`;
                    }).join('');
                } else {
                    attachmentWrap.textContent = 'لا توجد مرفقات';
                }
            } catch(e) {
                attachmentWrap.textContent = 'لا توجد مرفقات';
            }
        } else {
            attachmentWrap.textContent = 'لا توجد مرفقات';
        }
    }

    // الحالة والملاحظات
    const statusSelect = document.getElementById('modal-order-status-select');
    const internalNotes = document.getElementById('modal-order-internal-notes');
    if (statusSelect) statusSelect.value = order.status;
    if (internalNotes) internalNotes.value = order.internal_notes || '';

    // زر الواتساب المباشر
    const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const waBtn = document.getElementById('modal-detail-wa-btn');
    if (waBtn) {
        waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحبًا ${order.customer_name}، بخصوص طلبك (${order.order_number}) لخدمة ${order.service_name}:`)}`;
    }

    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.classList.add('active');
};

// حفظ تحديثات الطلب
window.saveOrderChanges = async function() {
    if (!activeOrderId) return;

    const newStatus = document.getElementById('modal-order-status-select')?.value;
    const notes = (document.getElementById('modal-order-internal-notes')?.value || '').trim();

    try {
        const res = await fetch(`/api/orders/${activeOrderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, internal_notes: notes })
        });

        const result = await res.json();
        if (result.success) {
            alert('تم حفظ التعديلات بنجاح.');
            window.closeModal('order-detail-modal');
            loadOrders();
            loadDashboardStats();
        } else {
            alert(result.message || 'تعذر حفظ التعديلات.');
        }
    } catch (err) {
        alert('حدث خطأ أثناء الاتصال بالخادم لحفظ التعديلات.');
    }
};

// 6. إدارة الخدمات (Services)
async function loadServices() {
    const listWrap = document.getElementById('admin-services-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && Array.isArray(data.services)) {
            listWrap.innerHTML = data.services.map(s => `
                <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid #0284c7;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: #0284c7;">${escapeHtml(s.title)}</h4>
                        <span style="font-size: 0.85rem; color: #16a34a; font-weight: 700;">${escapeHtml(s.starting_price)}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #475569; margin: 0.5rem 0;">${escapeHtml(s.short_description)}</p>
                    <div style="font-size: 0.8rem; color: #64748b;">المسار: /services/${escapeHtml(s.slug)}</div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الخدمات:', e);
    }
}

// 7. إدارة معرض الأعمال (Portfolio)
async function loadPortfolio() {
    const listWrap = document.getElementById('admin-portfolio-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
            listWrap.innerHTML = data.items.map(p => `
                <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid #10b981;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.05rem;">${escapeHtml(p.title)}</h4>
                        <span class="status-badge new">${escapeHtml(p.category)}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #475569; margin: 0.4rem 0;">${escapeHtml(p.description)}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span style="font-size: 0.8rem; color: #64748b;">العميل: ${escapeHtml(p.client_name || 'عام')}</span>
                        <button class="btn-icon delete" onclick="deletePortfolioItem(${p.id})" title="حذف المشروع">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل معرض الأعمال:', e);
    }
}

window.deletePortfolioItem = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع من معرض الأعمال؟')) return;
    try {
        const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadPortfolio();
            loadDashboardStats();
        } else {
            alert(result.message || 'فشل حذف المشروع.');
        }
    } catch(e) {
        alert('خطأ في الاتصال بالخادم.');
    }
};

// 8. إدارة المدونة (Blog Posts)
async function loadBlogPosts() {
    const listWrap = document.getElementById('admin-blog-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/blog');
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
            listWrap.innerHTML = data.posts.map(b => `
                <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid #8b5cf6;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.05rem;">${escapeHtml(b.title)}</h4>
                        <span class="status-badge reviewed">${escapeHtml(b.category)}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #475569; margin: 0.4rem 0;">${escapeHtml(b.summary)}</p>
                    <div style="font-size: 0.8rem; color: #64748b;">الرابط: /blog/${escapeHtml(b.slug)}</div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل المدونة:', e);
    }
}

// 9. إدارة الإعدادات (Settings)
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings) {
            const s = data.settings;
            if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = s.whatsapp_number || '';
            if (document.getElementById('setting-site-name')) document.getElementById('setting-site-name').value = s.site_name || '';
            if (document.getElementById('setting-email')) document.getElementById('setting-email').value = s.contact_email || '';
            if (document.getElementById('setting-instagram')) document.getElementById('setting-instagram').value = s.instagram_url || '';
            if (document.getElementById('setting-telegram')) document.getElementById('setting-telegram').value = s.telegram_url || '';
            if (document.getElementById('setting-gmail-user')) document.getElementById('setting-gmail-user').value = s.gmail_user || '';
            if (document.getElementById('setting-gmail-password')) document.getElementById('setting-gmail-password').value = s.gmail_app_password || '';
        }
    } catch(e) {
        console.error('خطأ تحميل الإعدادات:', e);
    }
}

window.saveSettings = async function(e) {
    if (e) e.preventDefault();
    const settings = {
        whatsapp_number: (document.getElementById('setting-whatsapp')?.value || '').trim(),
        site_name: (document.getElementById('setting-site-name')?.value || '').trim(),
        contact_email: (document.getElementById('setting-email')?.value || '').trim(),
        instagram_url: (document.getElementById('setting-instagram')?.value || '').trim(),
        telegram_url: (document.getElementById('setting-telegram')?.value || '').trim(),
        gmail_user: (document.getElementById('setting-gmail-user')?.value || '').trim(),
        gmail_app_password: (document.getElementById('setting-gmail-password')?.value || '').trim()
    };

    try {
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        const result = await res.json();
        if (result.success) {
            alert('تم حفظ الإعدادات وتحديث بيانات التواصل وإشعارات Gmail بنجاح.');
        } else {
            alert(result.message || 'فشل حفظ الإعدادات.');
        }
    } catch (err) {
        alert('حدث خطأ أثناء حفظ الإعدادات.');
    }
};

window.testEmailConnection = async function() {
    const statusEl = document.getElementById('test-email-status');
    const btn = document.getElementById('btn-test-email');
    
    // قراءة الإعدادات
    const settings = {
        whatsapp_number: (document.getElementById('setting-whatsapp')?.value || '').trim(),
        site_name: (document.getElementById('setting-site-name')?.value || '').trim(),
        contact_email: (document.getElementById('setting-email')?.value || '').trim(),
        instagram_url: (document.getElementById('setting-instagram')?.value || '').trim(),
        telegram_url: (document.getElementById('setting-telegram')?.value || '').trim(),
        gmail_user: (document.getElementById('setting-gmail-user')?.value || '').trim(),
        gmail_app_password: (document.getElementById('setting-gmail-password')?.value || '').trim()
    };

    if (!settings.gmail_user || !settings.gmail_app_password) {
        if (statusEl) {
            statusEl.style.color = '#ef4444';
            statusEl.textContent = '❌ يرجى كتابة البريد وكلمة مرور التطبيقات (App Password) أولاً.';
        }
        return;
    }

    try {
        if (btn) btn.disabled = true;
        if (statusEl) {
            statusEl.style.color = '#0284c7';
            statusEl.textContent = '⏳ جاري الاتصال بخوادم Google وإرسال بريد تجريبي...';
        }

        // حفظ الإعدادات أولاً
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });

        // طلب الفحص
        const res = await fetch('/api/settings/test-email', { method: 'POST' });
        const result = await res.json();

        if (result.success) {
            if (statusEl) {
                statusEl.style.color = '#16a34a';
                statusEl.innerHTML = `✅ ${result.message}`;
            }
        } else {
            if (statusEl) {
                statusEl.style.color = '#ef4444';
                statusEl.innerHTML = `❌ فشل الاتصال: ${result.hint || result.message}`;
            }
        }
    } catch(err) {
        if (statusEl) {
            statusEl.style.color = '#ef4444';
            statusEl.textContent = '❌ خطأ أثناء فحص الاتصال بالخادم.';
        }
    } finally {
        if (btn) btn.disabled = false;
    }
};

// 10. تحميل رسائل التواصل (Messages)
async function loadMessages() {
    const listWrap = document.getElementById('admin-messages-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            if (data.messages.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; padding: 2rem;">لا توجد رسائل تواصل حالياً.</p>`;
                return;
            }
            listWrap.innerHTML = data.messages.map(m => `
                <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid ${m.is_read ? '#cbd5e1' : '#0284c7'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1rem;">${escapeHtml(m.name)} (${escapeHtml(m.phone)})</h4>
                        <span style="font-size: 0.75rem; color: #64748b;">${new Date(m.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: #334155; margin: 0.6rem 0; line-height: 1.6;">${escapeHtml(m.message)}</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <a href="https://wa.me/${(m.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-whatsapp btn-sm">واتساب</a>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الرسائل:', e);
    }
}

// 11. تشغيل أكورديون دليل النشر والـ SEO
function initGuideAccordion() {
    const headers = document.querySelectorAll('.guide-step-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            if (body) {
                if (body.style.display === 'block') {
                    body.style.display = 'none';
                } else {
                    body.style.display = 'block';
                }
            }
        });
    });
}

// 12. تسجيل الخروج
window.adminLogout = async function() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (e) {
        window.location.href = '/admin/login';
    }
};

// دالة مساعدة لحماية النصوص من XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
