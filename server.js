require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const db = require('./database/db');
const { requireAuth, generateToken } = require('./middleware/auth');
const upload = require('./middleware/upload');
const { formRateLimiter, loginRateLimiter, sanitizeString, generateOrderNumber } = require('./middleware/security');
const { sendNewOrderEmail, sendContactMessageEmail, testMailConnection } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // مسموح للـ inline scripts والخطوط
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files & No-Cache for live updates
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// =========================================================================
// 1. مسارات الـ SEO والصفحات العامة (Dynamic SEO Routing)
// =========================================================================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحة فهرس الخدمات المستقلة (/services)
app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

// صفحات الخدمات المنفصلة (/services/:slug)
app.get('/services/:slug', async (req, res) => {
    try {
        const service = await db.get('SELECT * FROM services WHERE slug = ? AND is_active = 1', [req.params.slug]);
        if (!service) {
            return res.status(404).send(`
                <html dir="rtl" lang="ar">
                <head><title>الخدمة غير موجودة</title><link rel="stylesheet" href="/css/style.css"></head>
                <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;text-align:center;">
                    <h1>عذراً، هذه الخدمة غير متوفرة</h1>
                    <p>ربما تم نقل الصفحة أو تغيير الرابط.</p>
                    <a href="/services" class="btn btn-primary" style="margin-top:1rem;">استعراض كافة الخدمات</a>
                </body></html>
            `);
        }

        let template = fs.readFileSync(path.join(__dirname, 'views', 'service-detail.html'), 'utf8');
        
        // استبدال وسوم القالب ببيانات الخدمة الحقيقية
        const features = JSON.parse(service.features || '[]');
        const featuresHtml = features.map(f => `
            <li class="service-feature-item">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                <span>${f}</span>
            </li>
        `).join('');

        const serviceImages = {
            'small-business-websites': '/images/service-store.jpg',
            'graduation-websites': '/images/service-grad.jpg',
            'tawjihi-websites': '/images/service-tawjihi.jpg',
            'graduation-party-websites': '/images/service-party.jpg',
            'wedding-websites': '/images/service-wedding.jpg',
            'digital-invitations': '/images/service-cards.jpg',
            'university-projects': '/images/service-coding.jpg',
            'online-quizzes': '/images/service-quiz.jpg',
            'custom-web-development': '/images/service-custom.jpg'
        };
        const serviceImg = serviceImages[service.slug] || '/images/hero-devices.jpg';

        template = template
            .replace(/{{SERVICE_TITLE}}/g, service.title)
            .replace(/{{SERVICE_SLUG}}/g, service.slug)
            .replace(/{{SERVICE_SHORT_DESC}}/g, service.short_description)
            .replace(/{{SERVICE_FULL_DESC}}/g, service.full_description)
            .replace(/{{SERVICE_PRICE}}/g, service.starting_price)
            .replace(/{{SERVICE_FEATURES_LIST}}/g, featuresHtml)
            .replace(/{{SERVICE_IMAGE}}/g, serviceImg)
            .replace(/{{SERVICE_ICON}}/g, service.icon_svg);

        res.send(template);
    } catch (err) {
        res.status(500).send('خطأ في الخادم أثناء تحميل الخدمة.');
    }
});

// صفحة باقات الأسعار المستقلة (/pricing)
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pricing.html'));
});

// صفحة طريقة العمل ومن نحن المستقلة (/process & /about)
app.get(['/process', '/about'], (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'process.html'));
});

// صفحة طلب مشروع والتواصل المستقلة (/contact)
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// صفحة الأسئلة الشائعة المستقلة (/faq)
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'faq.html'));
});

// =========================================================================
// معاينات حية تفاعلية للمشاريع (Live Interactive Demos)
// =========================================================================

// معاينة حية: موقع تخرج وتوجيهي
app.get('/demos/graduation', (req, res) => {
    res.redirect('https://graduationnnn.netlify.app');
});

// معاينة حية: دعوة زفاف إلكترونية ملكية
app.get('/demos/wedding', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'demos', 'wedding.html'));
});

// معاينة حية: متجر إلكتروني وسلة طلبات واتساب
app.get('/demos/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'demos', 'store.html'));
});

// معاينة حية: منصة كويزات واختبارات تفاعلية
app.get('/demos/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'demos', 'quiz.html'));
});

// صفحة فهرس المدونة (/blog)
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'blog-index.html'));
});

// صفحة قراءة المقال المستقل (/blog/:slug)
app.get('/blog/:slug', async (req, res) => {
    try {
        const post = await db.get('SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1', [req.params.slug]);
        if (!post) {
            return res.status(404).send(`
                <html dir="rtl" lang="ar">
                <head><title>المقال غير موجود</title><link rel="stylesheet" href="/css/style.css"></head>
                <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;text-align:center;">
                    <h1>المقال غير موجود</h1>
                    <a href="/blog" class="btn btn-primary" style="margin-top:1rem;">العودة إلى المدونة</a>
                </body></html>
            `);
        }

        // تحديث عداد المشاهدات
        await db.run('UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?', [post.id]);

        let template = fs.readFileSync(path.join(__dirname, 'views', 'blog-detail.html'), 'utf8');

        // تحويل النص البسيط إلى فقرات HTML منسقة
        const formattedContent = post.content.split('\n\n').map(p => {
            if (p.startsWith('### ')) return `<h3>${p.replace('### ', '')}</h3>`;
            if (p.startsWith('## ')) return `<h2>${p.replace('## ', '')}</h2>`;
            if (p.startsWith('- ')) {
                const items = p.split('\n').map(li => `<li>${li.replace('- ', '')}</li>`).join('');
                return `<ul>${items}</ul>`;
            }
            if (p.startsWith('1. ')) {
                const items = p.split('\n').map(li => `<li>${li.replace(/^\d+\.\s*/, '')}</li>`).join('');
                return `<ol>${items}</ol>`;
            }
            return `<p>${p}</p>`;
        }).join('');

        const dateStr = new Date(post.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        template = template
            .replace(/{{POST_TITLE}}/g, post.title)
            .replace(/{{POST_SLUG}}/g, post.slug)
            .replace(/{{POST_SUMMARY}}/g, post.summary)
            .replace(/{{POST_CONTENT}}/g, formattedContent)
            .replace(/{{POST_CATEGORY}}/g, post.category)
            .replace(/{{POST_COVER}}/g, post.cover_image)
            .replace(/{{POST_DATE}}/g, dateStr)
            .replace(/{{POST_SEO_TITLE}}/g, post.seo_title || post.title)
            .replace(/{{POST_SEO_DESC}}/g, post.seo_description || post.summary)
            .replace(/{{POST_KEYWORDS}}/g, post.keywords || '');

        res.send(template);
    } catch (err) {
        res.status(500).send('خطأ أثناء قراءة المقال.');
    }
});

// صفحة معرض الأعمال المستقل (/portfolio)
app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'portfolio.html'));
});

// =========================================================================
// 2. محركات البحث: Sitemap.xml & Robots.txt
// =========================================================================

// توليد Sitemap.xml ديناميكي من قاعدة البيانات
app.get('/sitemap.xml', async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.get('host');
        const siteUrl = process.env.SITE_URL && process.env.SITE_URL !== 'http://localhost:3000' 
            ? process.env.SITE_URL 
            : `${protocol}://${host}`;

        const services = await db.all('SELECT slug, created_at FROM services WHERE is_active = 1');
        const posts = await db.all('SELECT slug, published_at FROM blog_posts WHERE is_published = 1');

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // الصفحات الثابتة الأساسية المستقلة
        const staticPages = [
            { url: '', priority: '1.0', changefreq: 'daily' },
            { url: '/services', priority: '0.9', changefreq: 'weekly' },
            { url: '/portfolio', priority: '0.9', changefreq: 'weekly' },
            { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
            { url: '/process', priority: '0.8', changefreq: 'monthly' },
            { url: '/contact', priority: '0.9', changefreq: 'weekly' },
            { url: '/faq', priority: '0.7', changefreq: 'monthly' },
            { url: '/blog', priority: '0.8', changefreq: 'daily' }
        ];

        staticPages.forEach(p => {
            xml += `  <url>\n    <loc>${siteUrl}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
        });

        // صفحات الخدمات الفرعية
        services.forEach(s => {
            xml += `  <url>\n    <loc>${siteUrl}/services/${s.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
        });

        // مقالات المدونة
        posts.forEach(b => {
            const date = b.published_at ? new Date(b.published_at).toISOString().split('T')[0] : '2026-01-01';
            xml += `  <url>\n    <loc>${siteUrl}/blog/${b.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('خطأ في توليد خريطة الموقع.');
    }
});

// ملف Robots.txt
app.get('/robots.txt', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host');
    const siteUrl = process.env.SITE_URL && process.env.SITE_URL !== 'http://localhost:3000' 
        ? process.env.SITE_URL 
        : `${protocol}://${host}`;

    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

// =========================================================================
// 3. مسارات لوحة تحكم الإدارة (Admin Routing)
// =========================================================================

// صفحة تسجيل دخول الأدمن
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

// لوحة التحكم الرئيسية المحمية
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

app.get('/admin/dashboard', requireAuth, (req, res) => {
    res.redirect('/admin');
});

// =========================================================================
// 4. REST APIs - المصادقة (Authentication)
// =========================================================================

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
        }

        const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة.' });
        }

        // تحديث آخر تسجيل دخول
        await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = generateToken(user);

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
        });

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح.',
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم أثناء تسجيل الدخول.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ success: true, user: req.user });
});

// =========================================================================
// 5. REST APIs - نظام الطلبات الحقيقي (Real Orders API)
// =========================================================================

// إنشاء طلب جديد من الزائر
app.post('/api/orders', formRateLimiter, upload.single('attachment'), async (req, res) => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            service_name,
            project_details,
            required_date,
            estimated_budget
        } = req.body;

        if (!customer_name || !customer_phone || !project_details) {
            return res.status(400).json({ success: false, message: 'يرجى تعبئة الحقول الأساسية: الاسم، رقم الهاتف، وتفاصيل المشروع.' });
        }

        const orderNumber = generateOrderNumber();
        const attachments = req.file ? JSON.stringify([`/uploads/${req.file.filename}`]) : JSON.stringify([]);
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // إدراج الطلب في قاعدة البيانات
        const result = await db.run(
            `INSERT INTO orders (
                order_number, customer_name, customer_phone, customer_email,
                service_name, project_details, required_date, estimated_budget,
                attachments, status, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'جديد', ?)`,
            [
                orderNumber,
                sanitizeString(customer_name),
                sanitizeString(customer_phone),
                customer_email ? sanitizeString(customer_email) : null,
                sanitizeString(service_name || 'خدمة مخصصة'),
                sanitizeString(project_details),
                required_date ? sanitizeString(required_date) : null,
                estimated_budget ? sanitizeString(estimated_budget) : null,
                attachments,
                ip
            ]
        );

        // جلب رقم الواتساب من إعدادات الموقع
        const settingRow = await db.get('SELECT value FROM settings WHERE key = ?', ['whatsapp_number']);
        const whatsappNumber = settingRow ? settingRow.value.replace(/[^0-9]/g, '') : '962790000000';

        // توليد رسالة الواتساب العربية المنسقة تلقائياً
        const messageText = `مرحبًا، أريد طلب خدمة من خدماتك الرقمية.\n\nالخدمة: ${service_name || 'خدمة مخصصة'}\nالاسم: ${customer_name}\nرقم الهاتف: ${customer_phone}\nرقم الطلب المرجعي: ${orderNumber}\n\nتفاصيل المشروع:\n${project_details}\n\nالموعد المطلوب: ${required_date || 'غير محدد'}\nالميزانية التقريبية: ${estimated_budget || 'غير محدد'}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`;

        // إرسال إشعار فوري إلى صندوق البريد (Gmail) مع كافة البيانات والمرفقات ورقم الطلب
        sendNewOrderEmail({
            order_number: orderNumber,
            customer_name: sanitizeString(customer_name),
            customer_phone: sanitizeString(customer_phone),
            customer_email: customer_email ? sanitizeString(customer_email) : '',
            service_name: sanitizeString(service_name || 'خدمة مخصصة'),
            project_details: sanitizeString(project_details),
            required_date: required_date ? sanitizeString(required_date) : '',
            estimated_budget: estimated_budget ? sanitizeString(estimated_budget) : '',
            ip_address: ip
        }, req.file).catch(err => {
            console.error('خطأ غير معطل في إرسال البريد:', err.message);
        });

        res.json({
            success: true,
            message: 'تم استلام طلبك بنجاح وسنقوم بالتواصل معك قريباً.',
            order_id: result.lastID,
            order_number: orderNumber,
            whatsapp_url: whatsappUrl
        });
    } catch (err) {
        console.error('خطأ في معالجة الطلب:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء حفظ الطلب.' });
    }
});

// استعراض الطلبات (للإدارة فقط)
app.get('/api/orders', requireAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY created_at DESC';

        const orders = await db.all(query, params);
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الطلبات.' });
    }
});

// تحديث حالة الطلب وإضافة ملاحظات داخلية (للإدارة فقط)
app.patch('/api/orders/:id', requireAuth, async (req, res) => {
    try {
        const { status, internal_notes } = req.body;
        const orderId = req.params.id;

        await db.run(
            `UPDATE orders SET status = COALESCE(?, status), internal_notes = COALESCE(?, internal_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, internal_notes, orderId]
        );

        res.json({ success: true, message: 'تم تحديث الطلب بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في تحديث الطلب.' });
    }
});

// =========================================================================
// 6. REST APIs - الخدمات وسابقة الأعمال والمدونة
// =========================================================================

// الخدمات
app.get('/api/services', async (req, res) => {
    try {
        const services = await db.all('SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC');
        res.json({ success: true, services });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الخدمات.' });
    }
});

// سابقة الأعمال
app.get('/api/portfolio', async (req, res) => {
    try {
        const items = await db.all('SELECT * FROM portfolio WHERE is_visible = 1 ORDER BY display_order ASC, created_at DESC');
        res.json({ success: true, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب سابقة الأعمال.' });
    }
});

app.post('/api/portfolio', requireAuth, upload.single('cover_image'), async (req, res) => {
    try {
        const { title, category, description, client_name, live_demo_url, tech_stack } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-');
        const coverImage = req.file ? `/uploads/${req.file.filename}` : '/assets/portfolio-project.svg';
        const techStackJson = tech_stack ? JSON.stringify(tech_stack.split(',').map(t => t.trim())) : JSON.stringify([]);

        await db.run(
            `INSERT INTO portfolio (slug, title, category, description, client_name, cover_image, live_demo_url, tech_stack)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [slug, title, category, description, client_name, coverImage, live_demo_url, techStackJson]
        );

        res.json({ success: true, message: 'تم إضافة المشروع بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في إضافة المشروع.' });
    }
});

app.delete('/api/portfolio/:id', requireAuth, async (req, res) => {
    try {
        await db.run('DELETE FROM portfolio WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'تم حذف المشروع بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في الحذف.' });
    }
});

// مقالات المدونة
app.get('/api/blog', async (req, res) => {
    try {
        const posts = await db.all('SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC');
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب المقالات.' });
    }
});

app.post('/api/blog', requireAuth, upload.single('cover_image'), async (req, res) => {
    try {
        const { title, summary, content, category, seo_title, seo_description, keywords } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-');
        const coverImage = req.file ? `/uploads/${req.file.filename}` : '/assets/blog-wedding.svg';

        await db.run(
            `INSERT INTO blog_posts (slug, title, summary, content, cover_image, category, seo_title, seo_description, keywords)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [slug, title, summary, content, coverImage, category, seo_title, seo_description, keywords]
        );

        res.json({ success: true, message: 'تم نشر المقال بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في نشر المقال.' });
    }
});

// باقات الأسعار
app.get('/api/pricing', async (req, res) => {
    try {
        const plans = await db.all('SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY display_order ASC');
        res.json({ success: true, plans });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الباقات.' });
    }
});

// الأسئلة الشائعة
app.get('/api/faq', async (req, res) => {
    try {
        const faqs = await db.all('SELECT * FROM faq WHERE is_active = 1 ORDER BY display_order ASC');
        res.json({ success: true, faqs });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الأسئلة الشائعة.' });
    }
});

// رسائل التواصل
app.post('/api/messages', formRateLimiter, async (req, res) => {
    try {
        const { name, phone, email, subject, message } = req.body;
        if (!name || !phone || !message) {
            return res.status(400).json({ success: false, message: 'يرجى إدخال الاسم، رقم الهاتف، والرسالة.' });
        }

        const ip = req.ip || req.socket.remoteAddress;
        await db.run(
            `INSERT INTO messages (name, phone, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
            [sanitizeString(name), sanitizeString(phone), email ? sanitizeString(email) : null, subject ? sanitizeString(subject) : null, sanitizeString(message), ip]
        );

        // إرسال إشعار فوري إلى البريد
        sendContactMessageEmail({
            name: sanitizeString(name),
            phone: sanitizeString(phone),
            email: email ? sanitizeString(email) : '',
            subject: subject ? sanitizeString(subject) : '',
            message: sanitizeString(message)
        }).catch(err => {
            console.error('خطأ غير معطل في إرسال بريد الرسالة:', err.message);
        });

        res.json({ success: true, message: 'تم إرسال رسالتك بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في إرسال الرسالة.' });
    }
});

app.get('/api/messages', requireAuth, async (req, res) => {
    try {
        const messages = await db.all('SELECT * FROM messages ORDER BY created_at DESC');
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الرسائل.' });
    }
});

// =========================================================================
// 7. REST APIs - الإعدادات والإحصائيات الحقيقية
// =========================================================================

// الإعدادات العامة (الآمنة للعامة)
app.get('/api/settings/public', async (req, res) => {
    try {
        const rows = await db.all('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        res.json({
            success: true,
            settings: {
                whatsapp_number: settings.whatsapp_number || '+962790000000',
                site_name: settings.site_name || 'خدماتك الرقمية',
                site_tagline: settings.site_tagline || '',
                contact_email: settings.contact_email || 'info@khadamatak.com',
                instagram_url: settings.instagram_url || '#',
                telegram_url: settings.telegram_url || '#',
                currency: settings.currency || 'دينار أردني'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الإعدادات.' });
    }
});

// الإعدادات الكاملة (للأدمن)
app.get('/api/settings', requireAuth, async (req, res) => {
    try {
        const rows = await db.all('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في جلب الإعدادات.' });
    }
});

app.put('/api/settings', requireAuth, async (req, res) => {
    try {
        const { settings } = req.body;
        if (settings && typeof settings === 'object') {
            for (const [key, value] of Object.entries(settings)) {
                await db.run(
                    `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
                    [key, value]
                );
            }
        }
        res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في حفظ الإعدادات.' });
    }
});

// فحص وتجربة إرسال بريد تجريبي
app.post('/api/settings/test-email', requireAuth, async (req, res) => {
    try {
        const result = await testMailConnection();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// إحصائيات لوحة التحكم الحقيقية من قاعدة البيانات
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const totalOrders = await db.get('SELECT COUNT(*) as count FROM orders');
        const newOrders = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'جديد'");
        const inProgress = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'قيد التنفيذ'");
        const completed = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'مكتمل'");
        const unreadMsgs = await db.get('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
        const portfolioCount = await db.get('SELECT COUNT(*) as count FROM portfolio');
        const blogCount = await db.get('SELECT COUNT(*) as count FROM blog_posts');
        const topServices = await db.all('SELECT service_name, COUNT(*) as count FROM orders GROUP BY service_name ORDER BY count DESC LIMIT 5');

        res.json({
            success: true,
            stats: {
                total_orders: totalOrders.count,
                new_orders: newOrders.count,
                in_progress_orders: inProgress.count,
                completed_orders: completed.count,
                unread_messages: unreadMsgs.count,
                portfolio_count: portfolioCount.count,
                blog_count: blogCount.count,
                top_services: topServices
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في استخراج الإحصائيات.' });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 خادم منصة "خدماتك الرقمية" يعمل بنجاح!`);
    console.log(`🌐 الموقع الرئيسي: http://localhost:${PORT}`);
    console.log(`🔐 لوحة تحكم الإدارة: http://localhost:${PORT}/admin`);
    console.log(`🗺️ خريطة الموقع: http://localhost:${PORT}/sitemap.xml`);
    console.log(`====================================================`);
});
