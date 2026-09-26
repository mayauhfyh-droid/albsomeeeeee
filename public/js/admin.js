// =========================================================================
// منطق لوحة تحكم الإدارة الشاملة (Complete Admin Dashboard Logic)
// =========================================================================

// الذاكرة المؤقتة للبيانات
let currentOrders = [];
let currentServices = [];
let currentPortfolio = [];
let currentPricing = [];
let currentBlogPosts = [];
let currentFaqs = [];
let currentMessages = [];
let activeOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
    initMobileSidebar();
    initAdminTabs();
    loadDashboardStats();
    loadOrders();
    loadServices();
    loadPortfolio();
    loadPricing();
    loadBlogPosts();
    loadFaqs();
    loadMessages();
    loadSettings();
    loadAdminProfile();
    initGuideAccordion();
});

// 1. التحكم بالقائمة الجانبية في الهواتف
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

    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
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
                if (pane.id === ('tab-' + targetTab)) {
                    pane.classList.add('active');
                }
            });

            if (pageTitle) {
                const labelSpan = btn.querySelector('span:first-of-type') || btn.querySelector('span');
                pageTitle.textContent = labelSpan ? labelSpan.textContent.trim() : btn.textContent.trim();
            }

            // إغلاق القائمة على الهواتف والأجهزة اللوحية
            if (window.innerWidth <= 1024) {
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            }

            // تحميل بيانات التبويب
            if (targetTab === 'overview') {
                loadDashboardStats();
                loadOrders();
            } else if (targetTab === 'orders') {
                loadOrders();
            } else if (targetTab === 'services') {
                loadServices();
            } else if (targetTab === 'portfolio') {
                loadPortfolio();
            } else if (targetTab === 'pricing') {
                loadPricing();
            } else if (targetTab === 'blog') {
                loadBlogPosts();
            } else if (targetTab === 'faq') {
                loadFaqs();
            } else if (targetTab === 'messages') {
                loadMessages();
            } else if (targetTab === 'settings') {
                loadSettings();
            } else if (targetTab === 'profile') {
                loadAdminProfile();
            }
        });
    });
}

// 3. إغلاق النوافذ المنبثقة
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};

// 4. تحميل إحصائيات لوحة التحكم
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

// =========================================================================
// 5. نظام الطلبات الحقيقي (Orders Management & Export & Print)
// =========================================================================

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
                        <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحبًا ${order.customer_name}، بخصوص طلبك رقم (${order.order_number}) لخدمة ${order.service_name} من منصة البسومي لخدمات الويب:`)}" target="_blank" class="btn-icon whatsapp" title="مراسلة واتساب">
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

// تصدير الطلبات إلى ملف Excel (CSV مع UTF-8 BOM)
window.exportOrdersToCSV = function() {
    if (currentOrders.length === 0) {
        alert('لا توجد طلبات مسجلة للتصدير.');
        return;
    }

    const headers = ['رقم الطلب', 'اسم العميل', 'رقم الهاتف', 'البريد الإلكتروني', 'الخدمة المطلوبة', 'الميزانية', 'موعد التسليم', 'الحالة', 'تاريخ الطلب', 'تفاصيل المشروع', 'ملاحظات الإدارة'];
    const rows = currentOrders.map(o => [
        `"${(o.order_number || '').replace(/"/g, '""')}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${(o.customer_phone || '').replace(/"/g, '""')}"`,
        `"${(o.customer_email || '').replace(/"/g, '""')}"`,
        `"${(o.service_name || '').replace(/"/g, '""')}"`,
        `"${(o.estimated_budget || '').replace(/"/g, '""')}"`,
        `"${(o.required_date || '').replace(/"/g, '""')}"`,
        `"${(o.status || '').replace(/"/g, '""')}"`,
        `"${new Date(o.created_at).toLocaleString('ar-EG')}"`,
        `"${(o.project_details || '').replace(/"/g, '""')}"`,
        `"${(o.internal_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// فتح تفاصيل الطلب
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
                        const isImg = /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f);
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

    const statusSelect = document.getElementById('modal-order-status-select');
    const internalNotes = document.getElementById('modal-order-internal-notes');
    if (statusSelect) statusSelect.value = order.status;
    if (internalNotes) internalNotes.value = order.internal_notes || '';

    const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const waBtn = document.getElementById('modal-detail-wa-btn');
    if (waBtn) {
        waBtn.href = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent('مرحبًا ' + order.customer_name + '، بخصوص طلبك (' + order.order_number + ') لخدمة ' + order.service_name + ':');
    }

    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.classList.add('active');
};

// طباعة فاتورة الطلب
window.printOrderInvoice = function() {
    const order = currentOrders.find(o => o.id === activeOrderId);
    if (!order) return;

    document.getElementById('invoice-order-number').textContent = order.order_number;
    document.getElementById('invoice-order-date').textContent = new Date(order.created_at).toLocaleString('ar-EG');
    document.getElementById('invoice-customer-name').textContent = order.customer_name;
    document.getElementById('invoice-customer-phone').textContent = order.customer_phone;
    document.getElementById('invoice-customer-email').textContent = order.customer_email || 'غير متوفر';
    document.getElementById('invoice-service-name').textContent = order.service_name;
    document.getElementById('invoice-budget').textContent = order.estimated_budget || 'غير محدد';
    document.getElementById('invoice-delivery-date').textContent = order.required_date || 'غير محدد';
    document.getElementById('invoice-project-details').textContent = order.project_details || 'لا توجد تفاصيل إضافية.';
    document.getElementById('invoice-status').textContent = order.status;

    window.closeModal('order-detail-modal');
    const invoiceModal = document.getElementById('order-invoice-modal');
    if (invoiceModal) invoiceModal.classList.add('active');
};

// حفظ تعديلات الطلب
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
        alert('حدث خطأ أثناء حفظ التعديلات.');
    }
};

// =========================================================================
// 6. إدارة الخدمات (Services CRUD)
// =========================================================================

async function loadServices() {
    const listWrap = document.getElementById('admin-services-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && Array.isArray(data.services)) {
            currentServices = data.services;
            if (currentServices.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 2rem;">لا توجد خدمات معروضة حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentServices.map(s => {
                let featuresArr = [];
                try { featuresArr = JSON.parse(s.features); } catch(e){}
                const featuresHtml = Array.isArray(featuresArr) ? featuresArr.map(f => `<li style="font-size: 0.8rem; color: #475569;">• ${escapeHtml(f)}</li>`).join('') : '';

                return `
                    <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #0284c7;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                <h4 style="margin: 0; font-size: 1.1rem; color: #0f172a;">${escapeHtml(s.title)}</h4>
                                <span style="font-size: 0.85rem; color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 0.2rem 0.5rem; border-radius: 4px;">${escapeHtml(s.starting_price)}</span>
                            </div>
                            <p style="font-size: 0.85rem; color: #64748b; margin: 0.4rem 0 0.75rem 0; line-height: 1.5;">${escapeHtml(s.short_description)}</p>
                            <ul style="list-style: none; padding: 0; margin: 0 0 1rem 0; display: flex; flex-direction: column; gap: 0.25rem;">
                                ${featuresHtml}
                            </ul>
                        </div>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                            <button class="btn btn-secondary btn-sm" onclick="openServiceModal(${s.id})">✏️ تعديل</button>
                            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteService(${s.id})">🗑️ حذف</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الخدمات:', e);
    }
}

window.openServiceModal = function(serviceId) {
    const titleEl = document.getElementById('service-modal-title');
    const idEl = document.getElementById('service-form-id');
    const formTitle = document.getElementById('service-form-title');
    const formPrice = document.getElementById('service-form-price');
    const formShort = document.getElementById('service-form-short');
    const formFull = document.getElementById('service-form-full');
    const formFeatures = document.getElementById('service-form-features');

    if (serviceId) {
        const service = currentServices.find(s => s.id === serviceId);
        if (!service) return;
        if (titleEl) titleEl.textContent = 'تعديل الخدمة';
        if (idEl) idEl.value = service.id;
        if (formTitle) formTitle.value = service.title;
        if (formPrice) formPrice.value = service.starting_price;
        if (formShort) formShort.value = service.short_description;
        if (formFull) formFull.value = service.full_description || '';
        
        let feats = '';
        try {
            const arr = JSON.parse(service.features);
            if (Array.isArray(arr)) feats = arr.join('\n');
        } catch(e) {}
        if (formFeatures) formFeatures.value = feats;
    } else {
        if (titleEl) titleEl.textContent = 'إضافة خدمة جديدة';
        document.getElementById('service-form')?.reset();
        if (idEl) idEl.value = '';
    }

    const modal = document.getElementById('service-modal');
    if (modal) modal.classList.add('active');
};

window.saveServiceForm = async function(e) {
    if (e) e.preventDefault();
    const serviceId = document.getElementById('service-form-id')?.value;
    const title = document.getElementById('service-form-title')?.value.trim();
    const starting_price = document.getElementById('service-form-price')?.value.trim();
    const short_description = document.getElementById('service-form-short')?.value.trim();
    const full_description = document.getElementById('service-form-full')?.value.trim();
    const features = document.getElementById('service-form-features')?.value.trim();

    const payload = { title, starting_price, short_description, full_description, features };
    const method = serviceId ? 'PUT' : 'POST';
    const endpoint = serviceId ? `/api/services/${serviceId}` : '/api/services';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(serviceId ? 'تم تحديث الخدمة بنجاح.' : 'تم إضافة الخدمة بنجاح.');
            window.closeModal('service-modal');
            loadServices();
        } else {
            alert(result.message || 'فشلت العملية.');
        }
    } catch(err) {
        alert('حدث خطأ أثناء حفظ الخدمة.');
    }
};

window.deleteService = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة من الموقع؟')) return;
    try {
        const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadServices();
        } else {
            alert(result.message || 'فشل حذف الخدمة.');
        }
    } catch(e) {
        alert('خطأ أثناء الحذف.');
    }
};

// =========================================================================
// 7. إدارة معرض الأعمال (Portfolio CRUD)
// =========================================================================

async function loadPortfolio() {
    const listWrap = document.getElementById('admin-portfolio-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
            currentPortfolio = data.items;
            if (currentPortfolio.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 2rem;">لا توجد مشاريع مضافة حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentPortfolio.map(p => `
                <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #10b981;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4 style="margin: 0; font-size: 1.05rem; color: #0f172a;">${escapeHtml(p.title)}</h4>
                            <span class="status-badge new">${escapeHtml(p.category)}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0.5rem 0; line-height: 1.5;">${escapeHtml(p.description)}</p>
                        <div style="font-size: 0.8rem; color: #475569; display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>العميل: ${escapeHtml(p.client_name || 'عام')}</span>
                            ${p.live_demo_url ? `<a href="${p.live_demo_url}" target="_blank" style="color: #0284c7; text-decoration: underline;">معاينة حية ↗</a>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                        <button class="btn btn-secondary btn-sm" onclick="openPortfolioModal(${p.id})">✏️ تعديل</button>
                        <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deletePortfolioItem(${p.id})">🗑️ حذف</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل معرض الأعمال:', e);
    }
}

window.openPortfolioModal = function(projectId) {
    const titleEl = document.getElementById('portfolio-modal-title');
    const idEl = document.getElementById('portfolio-form-id');
    const fTitle = document.getElementById('portfolio-form-title');
    const fCategory = document.getElementById('portfolio-form-category');
    const fClient = document.getElementById('portfolio-form-client');
    const fImg = document.getElementById('portfolio-form-image-url');
    const fDemo = document.getElementById('portfolio-form-demo');
    const fTech = document.getElementById('portfolio-form-tech');
    const fDesc = document.getElementById('portfolio-form-desc');

    if (projectId) {
        const item = currentPortfolio.find(p => p.id === projectId);
        if (!item) return;
        if (titleEl) titleEl.textContent = 'تعديل المشروع';
        if (idEl) idEl.value = item.id;
        if (fTitle) fTitle.value = item.title;
        if (fCategory) fCategory.value = item.category;
        if (fClient) fClient.value = item.client_name || '';
        if (fImg) fImg.value = item.cover_image || '';
        if (fDemo) fDemo.value = item.live_demo_url || '';
        
        let techStr = '';
        try {
            const arr = JSON.parse(item.tech_stack);
            if (Array.isArray(arr)) techStr = arr.join(', ');
        } catch(e) {}
        if (fTech) fTech.value = techStr;
        if (fDesc) fDesc.value = item.description;
    } else {
        if (titleEl) titleEl.textContent = 'إضافة مشروع جديد';
        document.getElementById('portfolio-form')?.reset();
        if (idEl) idEl.value = '';
    }

    const modal = document.getElementById('portfolio-modal');
    if (modal) modal.classList.add('active');
};

window.savePortfolioForm = async function(e) {
    if (e) e.preventDefault();
    const projectId = document.getElementById('portfolio-form-id')?.value;
    const title = document.getElementById('portfolio-form-title')?.value.trim();
    const category = document.getElementById('portfolio-form-category')?.value;
    const client_name = document.getElementById('portfolio-form-client')?.value.trim();
    const cover_image_url = document.getElementById('portfolio-form-image-url')?.value.trim();
    const live_demo_url = document.getElementById('portfolio-form-demo')?.value.trim();
    const tech_stack = document.getElementById('portfolio-form-tech')?.value.trim();
    const description = document.getElementById('portfolio-form-desc')?.value.trim();

    const payload = { title, category, client_name, cover_image_url, live_demo_url, tech_stack, description };
    const method = projectId ? 'PUT' : 'POST';
    const endpoint = projectId ? `/api/portfolio/${projectId}` : '/api/portfolio';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(projectId ? 'تم تحديث المشروع بنجاح.' : 'تم إضافة المشروع بنجاح.');
            window.closeModal('portfolio-modal');
            loadPortfolio();
            loadDashboardStats();
        } else {
            alert(result.message || 'فشلت العملية.');
        }
    } catch(err) {
        alert('حدث خطأ أثناء حفظ المشروع.');
    }
};

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
        alert('خطأ أثناء الحذف.');
    }
};

// =========================================================================
// 8. إدارة باقات الأسعار (Pricing Plans CRUD)
// =========================================================================

async function loadPricing() {
    const listWrap = document.getElementById('admin-pricing-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
            currentPricing = data.plans;
            if (currentPricing.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 2rem;">لا توجد باقات أسعار مسجلة حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentPricing.map(plan => {
                let featuresArr = [];
                try { featuresArr = JSON.parse(plan.features); } catch(e){}
                const featuresHtml = Array.isArray(featuresArr) ? featuresArr.map(f => `<li style="font-size: 0.8rem; color: #475569;">✓ ${escapeHtml(f)}</li>`).join('') : '';

                return `
                    <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #f59e0b;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <h4 style="margin: 0; font-size: 1.1rem; color: #0f172a;">${escapeHtml(plan.name)}</h4>
                                ${plan.badge ? `<span class="status-badge waiting">${escapeHtml(plan.badge)}</span>` : ''}
                            </div>
                            <div style="font-size: 1.25rem; font-weight: 800; color: #0284c7; margin: 0.5rem 0;">${escapeHtml(plan.starting_price)} <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">/ ${escapeHtml(plan.period || 'تدفع مرة واحدة')}</span></div>
                            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem;">${escapeHtml(plan.description)}</p>
                            <ul style="list-style: none; padding: 0; margin: 0 0 1rem 0; display: flex; flex-direction: column; gap: 0.25rem;">
                                ${featuresHtml}
                            </ul>
                        </div>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                            <button class="btn btn-secondary btn-sm" onclick="openPricingModal(${plan.id})">✏️ تعديل</button>
                            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deletePricingPlan(${plan.id})">🗑️ حذف</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الباقات:', e);
    }
}

window.openPricingModal = function(planId) {
    const titleEl = document.getElementById('pricing-modal-title');
    const idEl = document.getElementById('pricing-form-id');
    const fName = document.getElementById('pricing-form-name');
    const fPrice = document.getElementById('pricing-form-price');
    const fBadge = document.getElementById('pricing-form-badge');
    const fPeriod = document.getElementById('pricing-form-period');
    const fDesc = document.getElementById('pricing-form-desc');
    const fFeatures = document.getElementById('pricing-form-features');

    if (planId) {
        const plan = currentPricing.find(p => p.id === planId);
        if (!plan) return;
        if (titleEl) titleEl.textContent = 'تعديل الباقة';
        if (idEl) idEl.value = plan.id;
        if (fName) fName.value = plan.name;
        if (fPrice) fPrice.value = plan.starting_price;
        if (fBadge) fBadge.value = plan.badge || '';
        if (fPeriod) fPeriod.value = plan.period || 'تدفع مرة واحدة';
        if (fDesc) fDesc.value = plan.description;
        
        let feats = '';
        try {
            const arr = JSON.parse(plan.features);
            if (Array.isArray(arr)) feats = arr.join('\n');
        } catch(e) {}
        if (fFeatures) fFeatures.value = feats;
    } else {
        if (titleEl) titleEl.textContent = 'إضافة باقة جديدة';
        document.getElementById('pricing-form')?.reset();
        if (idEl) idEl.value = '';
    }

    const modal = document.getElementById('pricing-modal');
    if (modal) modal.classList.add('active');
};

window.savePricingForm = async function(e) {
    if (e) e.preventDefault();
    const planId = document.getElementById('pricing-form-id')?.value;
    const name = document.getElementById('pricing-form-name')?.value.trim();
    const starting_price = document.getElementById('pricing-form-price')?.value.trim();
    const badge = document.getElementById('pricing-form-badge')?.value.trim();
    const period = document.getElementById('pricing-form-period')?.value.trim();
    const description = document.getElementById('pricing-form-desc')?.value.trim();
    const features = document.getElementById('pricing-form-features')?.value.trim();

    const payload = { name, starting_price, badge, period, description, features };
    const method = planId ? 'PUT' : 'POST';
    const endpoint = planId ? `/api/pricing/${planId}` : '/api/pricing';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(planId ? 'تم تحديث الباقة بنجاح.' : 'تم إضافة الباقة بنجاح.');
            window.closeModal('pricing-modal');
            loadPricing();
        } else {
            alert(result.message || 'فشلت العملية.');
        }
    } catch(err) {
        alert('حدث خطأ أثناء حفظ الباقة.');
    }
};

window.deletePricingPlan = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
        const res = await fetch(`/api/pricing/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadPricing();
        } else {
            alert(result.message || 'فشل حذف الباقة.');
        }
    } catch(e) {
        alert('خطأ أثناء الحذف.');
    }
};

// =========================================================================
// 9. إدارة المدونة والـ SEO (Blog CRUD)
// =========================================================================

async function loadBlogPosts() {
    const listWrap = document.getElementById('admin-blog-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/blog');
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
            currentBlogPosts = data.posts;
            if (currentBlogPosts.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 2rem;">لا توجد مقالات منشورة حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentBlogPosts.map(b => `
                <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #8b5cf6;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4 style="margin: 0; font-size: 1.05rem; color: #0f172a;">${escapeHtml(b.title)}</h4>
                            <span class="status-badge reviewed">${escapeHtml(b.category)}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0.5rem 0; line-height: 1.5;">${escapeHtml(b.summary)}</p>
                        <div style="font-size: 0.8rem; color: #0284c7; margin-bottom: 0.5rem;">الرابط: /blog/${escapeHtml(b.slug)}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                        <button class="btn btn-secondary btn-sm" onclick="openBlogModal(${b.id})">✏️ تعديل</button>
                        <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteBlogPost(${b.id})">🗑️ حذف</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل المدونة:', e);
    }
}

window.openBlogModal = function(blogId) {
    const titleEl = document.getElementById('blog-modal-title');
    const idEl = document.getElementById('blog-form-id');
    const fTitle = document.getElementById('blog-form-title');
    const fCategory = document.getElementById('blog-form-category');
    const fImg = document.getElementById('blog-form-image-url');
    const fSummary = document.getElementById('blog-form-summary');
    const fContent = document.getElementById('blog-form-content');
    const fKeywords = document.getElementById('blog-form-keywords');

    if (blogId) {
        const post = currentBlogPosts.find(b => b.id === blogId);
        if (!post) return;
        if (titleEl) titleEl.textContent = 'تعديل المقال';
        if (idEl) idEl.value = post.id;
        if (fTitle) fTitle.value = post.title;
        if (fCategory) fCategory.value = post.category;
        if (fImg) fImg.value = post.cover_image || '';
        if (fSummary) fSummary.value = post.summary;
        if (fContent) fContent.value = post.content;
        if (fKeywords) fKeywords.value = post.keywords || '';
    } else {
        if (titleEl) titleEl.textContent = 'كتابة مقال جديد';
        document.getElementById('blog-form')?.reset();
        if (idEl) idEl.value = '';
    }

    const modal = document.getElementById('blog-modal');
    if (modal) modal.classList.add('active');
};

window.saveBlogForm = async function(e) {
    if (e) e.preventDefault();
    const blogId = document.getElementById('blog-form-id')?.value;
    const title = document.getElementById('blog-form-title')?.value.trim();
    const category = document.getElementById('blog-form-category')?.value.trim();
    const cover_image_url = document.getElementById('blog-form-image-url')?.value.trim();
    const summary = document.getElementById('blog-form-summary')?.value.trim();
    const content = document.getElementById('blog-form-content')?.value.trim();
    const keywords = document.getElementById('blog-form-keywords')?.value.trim();

    const payload = { title, category, cover_image_url, summary, content, keywords };
    const method = blogId ? 'PUT' : 'POST';
    const endpoint = blogId ? `/api/blog/${blogId}` : '/api/blog';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(blogId ? 'تم تحديث المقال بنجاح.' : 'تم نشر المقال بنجاح.');
            window.closeModal('blog-modal');
            loadBlogPosts();
            loadDashboardStats();
        } else {
            alert(result.message || 'فشلت العملية.');
        }
    } catch(err) {
        alert('حدث خطأ أثناء نشر المقال.');
    }
};

window.deleteBlogPost = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
        const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadBlogPosts();
            loadDashboardStats();
        } else {
            alert(result.message || 'فشل حذف المقال.');
        }
    } catch(e) {
        alert('خطأ أثناء الحذف.');
    }
};

// =========================================================================
// 10. إدارة الأسئلة الشائعة (FAQ CRUD)
// =========================================================================

async function loadFaqs() {
    const listWrap = document.getElementById('admin-faq-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/faq');
        const data = await res.json();
        if (data.success && Array.isArray(data.faqs)) {
            currentFaqs = data.faqs;
            if (currentFaqs.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; padding: 2rem;">لا توجد أسئلة شائعة مضافة حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentFaqs.map(faq => `
                <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid #3b82f6;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.05rem; color: #0f172a;">${escapeHtml(faq.question)}</h4>
                        <span class="status-badge waiting">${escapeHtml(faq.category || 'عام')}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: #475569; margin: 0.5rem 0 0.75rem 0; line-height: 1.6;">${escapeHtml(faq.answer)}</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="openFaqModal(${faq.id})">✏️ تعديل</button>
                        <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="deleteFaq(${faq.id})">🗑️ حذف</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الأسئلة:', e);
    }
}

window.openFaqModal = function(faqId) {
    const titleEl = document.getElementById('faq-modal-title');
    const idEl = document.getElementById('faq-form-id');
    const fQuestion = document.getElementById('faq-form-question');
    const fCategory = document.getElementById('faq-form-category');
    const fAnswer = document.getElementById('faq-form-answer');

    if (faqId) {
        const faq = currentFaqs.find(f => f.id === faqId);
        if (!faq) return;
        if (titleEl) titleEl.textContent = 'تعديل السؤال الشائع';
        if (idEl) idEl.value = faq.id;
        if (fQuestion) fQuestion.value = faq.question;
        if (fCategory) fCategory.value = faq.category || 'عام';
        if (fAnswer) fAnswer.value = faq.answer;
    } else {
        if (titleEl) titleEl.textContent = 'إضافة سؤال شائع';
        document.getElementById('faq-form')?.reset();
        if (idEl) idEl.value = '';
    }

    const modal = document.getElementById('faq-modal');
    if (modal) modal.classList.add('active');
};

window.saveFaqForm = async function(e) {
    if (e) e.preventDefault();
    const faqId = document.getElementById('faq-form-id')?.value;
    const question = document.getElementById('faq-form-question')?.value.trim();
    const category = document.getElementById('faq-form-category')?.value.trim();
    const answer = document.getElementById('faq-form-answer')?.value.trim();

    const payload = { question, category, answer };
    const method = faqId ? 'PUT' : 'POST';
    const endpoint = faqId ? `/api/faq/${faqId}` : '/api/faq';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(faqId ? 'تم تحديث السؤال بنجاح.' : 'تم إضافة السؤال بنجاح.');
            window.closeModal('faq-modal');
            loadFaqs();
        } else {
            alert(result.message || 'فشلت العملية.');
        }
    } catch(err) {
        alert('حدث خطأ أثناء حفظ السؤال.');
    }
};

window.deleteFaq = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
        const res = await fetch(`/api/faq/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadFaqs();
        } else {
            alert(result.message || 'فشل حذف السؤال.');
        }
    } catch(e) {
        alert('خطأ أثناء الحذف.');
    }
};

// =========================================================================
// 11. إدارة رسائل التواصل (Messages)
// =========================================================================

async function loadMessages() {
    const listWrap = document.getElementById('admin-messages-list');
    if (!listWrap) return;

    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            currentMessages = data.messages;
            if (currentMessages.length === 0) {
                listWrap.innerHTML = `<p style="color: #64748b; text-align: center; padding: 2rem;">لا توجد رسائل تواصل حالياً.</p>`;
                return;
            }

            listWrap.innerHTML = currentMessages.map(m => {
                const cleanPhone = (m.phone || '').replace(/[^0-9]/g, '');
                return `
                    <div class="stat-card" style="display: block; margin-bottom: 1rem; border-right: 4px solid ${m.is_read ? '#cbd5e1' : '#0284c7'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 style="margin: 0; font-size: 1rem; color: #0f172a;">${escapeHtml(m.name)} (${escapeHtml(m.phone)})</h4>
                            <span style="font-size: 0.75rem; color: #64748b;">${new Date(m.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        ${m.subject ? `<div style="font-size: 0.82rem; font-weight: 700; color: #0284c7; margin-top: 0.25rem;">الموضوع: ${escapeHtml(m.subject)}</div>` : ''}
                        <p style="font-size: 0.9rem; color: #334155; margin: 0.6rem 0; line-height: 1.6;">${escapeHtml(m.message)}</p>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.5rem;">
                            ${!m.is_read ? `<button onclick="markMessageRead(${m.id})" class="btn btn-secondary btn-sm" style="font-size: 0.78rem;">✓ تحديد كمقروء</button>` : ''}
                            <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn btn-whatsapp btn-sm">واتساب</a>
                            <button onclick="deleteMessage(${m.id})" class="btn btn-secondary btn-sm" style="color: #ef4444; font-size: 0.78rem;">🗑️ حذف</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        console.error('خطأ تحميل الرسائل:', e);
    }
}

window.markMessageRead = async function(id) {
    try {
        const res = await fetch(`/api/messages/${id}/read`, { method: 'PATCH' });
        const result = await res.json();
        if (result.success) {
            loadMessages();
            loadDashboardStats();
        }
    } catch(e) {}
};

window.deleteMessage = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
        const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadMessages();
            loadDashboardStats();
        }
    } catch(e) {}
};

// =========================================================================
// 12. إدارة الإعدادات (Settings)
// =========================================================================

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
    
    const alertEl = document.getElementById('settings-save-alert');
    const submitBtn = document.getElementById('btn-save-settings');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'حفظ كافة الإعدادات';

    const settings = {
        whatsapp_number: (document.getElementById('setting-whatsapp')?.value || '').trim(),
        site_name: (document.getElementById('setting-site-name')?.value || '').trim(),
        contact_email: (document.getElementById('setting-email')?.value || '').trim(),
        instagram_url: (document.getElementById('setting-instagram')?.value || '').trim(),
        telegram_url: (document.getElementById('setting-telegram')?.value || '').trim(),
        gmail_user: (document.getElementById('setting-gmail-user')?.value || '').trim(),
        gmail_app_password: (document.getElementById('setting-gmail-password')?.value || '').trim()
    };

    if (alertEl) {
        alertEl.style.display = 'none';
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ جاري الحفظ والتحديث...';
    }

    try {
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        const result = await res.json();
        
        if (result.success) {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.style.background = '#dcfce7';
                alertEl.style.border = '1px solid #86efac';
                alertEl.style.color = '#15803d';
                alertEl.innerHTML = '✅ تم حفظ وتحديث كافة الإعدادات بنجاح في قاعدة البيانات!';
                alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.style.background = '#fee2e2';
                alertEl.style.border = '1px solid #fca5a5';
                alertEl.style.color = '#b91c1c';
                alertEl.innerHTML = `❌ ${result.message || 'فشل حفظ الإعدادات.'}`;
            }
        }
    } catch (err) {
        if (alertEl) {
            alertEl.style.display = 'block';
            alertEl.style.background = '#fee2e2';
            alertEl.style.border = '1px solid #fca5a5';
            alertEl.style.color = '#b91c1c';
            alertEl.innerHTML = '❌ حدث خطأ أثناء الاتصال بالخادم وحفظ الإعدادات.';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
};

window.testEmailConnection = async function() {
    const statusEl = document.getElementById('test-email-status');
    const btn = document.getElementById('btn-test-email');
    
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

        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });

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

// =========================================================================
// 13. الملف الشخصي والأمان (Profile & Password Change)
// =========================================================================

async function loadAdminProfile() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
            const u = data.user;
            const unameEl = document.getElementById('profile-username');
            const emailEl = document.getElementById('profile-email');
            if (unameEl) unameEl.value = u.username || '';
            if (emailEl) emailEl.value = u.email || '';
        }
    } catch(e) {}
}

window.updateAdminProfile = async function(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('profile-username')?.value.trim();
    const email = document.getElementById('profile-email')?.value.trim();
    const current_password = document.getElementById('profile-current-password')?.value.trim();
    const new_password = document.getElementById('profile-new-password')?.value.trim();
    const confirm_password = document.getElementById('profile-confirm-password')?.value.trim();

    if (new_password) {
        if (new_password.length < 6) {
            alert('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        if (new_password !== confirm_password) {
            alert('كلمة المرور وتأكيدها غير متطابقين.');
            return;
        }
        if (!current_password) {
            alert('يرجى كتابة كلمة المرور الحالية للتأكيد.');
            return;
        }
    }

    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, current_password, new_password })
        });
        const result = await res.json();
        if (result.success) {
            alert('تم تحديث الملف الشخصي وكلمة المرور بنجاح.');
            document.getElementById('profile-current-password').value = '';
            document.getElementById('profile-new-password').value = '';
            document.getElementById('profile-confirm-password').value = '';
        } else {
            alert(result.message || 'تعذر تحديث البيانات.');
        }
    } catch (err) {
        alert('حدث خطأ أثناء تحديث الملف الشخصي.');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
};

// =========================================================================
// 14. الأدوات المساعدة ودليل الـ SEO وتسجيل الخروج
// =========================================================================

function initGuideAccordion() {
    const headers = document.querySelectorAll('.guide-step-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            if (body) {
                body.style.display = body.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
}

window.adminLogout = async function() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (e) {
        window.location.href = '/';
    }
};

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
