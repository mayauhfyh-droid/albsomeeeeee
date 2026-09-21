const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
    console.log('بدء زراعة البيانات الأولية في قاعدة البيانات...');

    try {
        // 1. حساب الإدارة
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
        if (!existingAdmin) {
            await db.run(
                `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
                ['admin', 'admin@khadamatak.com', passwordHash, 'admin']
            );
            console.log('تم إنشاء حساب الأدمن الافتراضي: admin / admin123456');
        }

        // 2. إعدادات الموقع
        const defaultSettings = [
            { key: 'site_name', value: 'خدماتك الرقمية', group_name: 'general' },
            { key: 'site_tagline', value: 'حوّل فكرتك إلى موقع إلكتروني احترافي وحلول رقمية متطورة', group_name: 'general' },
            { key: 'whatsapp_number', value: '+962791413321', group_name: 'contact' },
            { key: 'contact_email', value: 'aisaralbsomea@gmail.com', group_name: 'contact' },
            { key: 'gmail_user', value: 'aisaralbsomea@gmail.com', group_name: 'general' },
            { key: 'instagram_url', value: 'https://instagram.com/khadamatak', group_name: 'social' },
            { key: 'telegram_url', value: 'https://t.me/khadamatak', group_name: 'social' },
            { key: 'currency', value: 'دينار أردني', group_name: 'business' },
            { key: 'meta_title', value: 'خدماتك الرقمية | تصميم وبرمجة مواقع احترافية وحلول رقمية', group_name: 'seo' },
            { key: 'meta_description', value: 'وكالة متخصصة في تصميم وبرمجة مواقع المتاجر، حفلات التخرج، دعوات الزفاف الإلكترونية، مشاريع الطلاب، والحلول المخصصة بأعلى معايير الجودة والسرعة.', group_name: 'seo' }
        ];

        for (const setting of defaultSettings) {
            await db.run(
                `INSERT OR REPLACE INTO settings (key, value, group_name, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [setting.key, setting.value, setting.group_name]
            );
        }

        // 3. الخدمات (بدون إيموجي - مع أيقونات SVG دقيقة)
        const services = [
            {
                slug: 'small-business-websites',
                title: 'مواقع المتاجر والمشاريع الصغيرة',
                short_description: 'موقع احترافي وسريع لعرض منتجاتك وخدماتك وتسهيل استقبال طلبات العملاء.',
                full_description: 'نصمم ونطور مواقع ويب متكاملة مخصصة للمشاريع الناشئة والمتاجر المحلية، تتيح لك عرض الكتالوج بطريقة جذابة، وتلقي الطلبات مباشرة عبر الواتساب أو البريد، مع لوحة تحكم سهلة لإدارة المنتجات والأسعار وتوافق كامل مع الهواتف الذكية.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
                features: JSON.stringify([
                    'تصميم عصري متجاوب 100% مع الهواتف',
                    'معرض منتجات وفئات غير محدود',
                    'ربط مباشر مع طلبات الواتساب بنقرة واحدة',
                    'لوحة تحكم سهلة باللغة العربية',
                    'سرعة تحميل فائقة وتوافق مع محركات البحث'
                ]),
                starting_price: 'يبدأ من 75 دينار',
                display_order: 1
            },
            {
                slug: 'graduation-websites',
                title: 'مواقع التخرج الجامعي',
                short_description: 'موقع تخرج مميز وتفاعلي يخلد مسيرتك الجامعية بالصور والذكريات والمشاركات.',
                full_description: 'صفحة إلكترونية فخمة لتوثيق لحظة التخرج، تضم نبذة عن الخريج، معرض صور عالي الجودة للذكريات الجامعية، سجل تهاني تفاعلي يتيح للأصدقاء والعائلة كتابة مباركاتهم، وعداد تنازلي ليوم الحفل مع إمكانية مشاركة الرابط بسهولة.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>',
                features: JSON.stringify([
                    'تصميم احترافي مخصص باسم الخريج والجامعة',
                    'ألبوم صور وفيديوهات بجودة عالية',
                    'سجل تهاني ومباركات تفاعلي مع إشعار بالرسائل',
                    'موقع جغرافي للحفل مع مسار الوصول',
                    'رابط شخصي سريع للمشاركة عبر منصات التواصل'
                ]),
                starting_price: 'يبدأ من 35 دينار',
                display_order: 2
            },
            {
                slug: 'tawjihi-websites',
                title: 'مواقع وصفحات التوجيهي والطلاب',
                short_description: 'مواقع تعليمية مخصصة لتنظيم المحتوى الدراسي وحساب المعدلات واستقبال التهاني.',
                full_description: 'حلول رقمية مبتكرة لطلاب ومعلمي التوجيهي تشمل صفحات تنظيم وتلخيص المواد الدراسية، أنظمة حاسبة المعدل التفاعلية لجميع الفروع، وصفحات إعلان النتائج والاحتفال بالنجاح مع الأهل والأصدقاء.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>',
                features: JSON.stringify([
                    'حاسبة معدل تفاعلية دقيقة لجميع الفروع',
                    'تنظيم جداول المذاكرة والروابط التعليمية',
                    'صفحة إعلان ومباركة نجاح خاصة بالاسم',
                    'تصميم خفيف وسريع الفتح على شبكات الهاتف'
                ]),
                starting_price: 'يبدأ من 25 دينار',
                display_order: 3
            },
            {
                slug: 'wedding-websites',
                title: 'مواقع ودعوات الزفاف والخطوبة',
                short_description: 'دعوة زفاف إلكترونية فاخرة وتفاعلية مع تأكيد الحضور وخريطة الصالة والموقع.',
                full_description: 'بديل راقٍ وعصري للدعوات الورقية التقليدية، يتضمن تفاصيل المناسبة، موقع القاعة عبر خرائط Google، نظام تأكيد الحضور (RSVP) لمعرفة أعداد الضيوف بدقة، معرض صور الخطوبة، وميزة إضافة الموعد لتقويم الهاتف بنقرة واحدة.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>',
                features: JSON.stringify([
                    'نظام تأكيد حضور إلكتروني متقدم (RSVP)',
                    'خريطة قوقل ماب دقيقة مع التوجيه المباشر',
                    'زر إضافة الحدث للتقويم (Google / Apple Calendar)',
                    'عداد تنازلي أنيق ليوم الحفل',
                    'تخصيص كامل للألوان والتصميم والخطوط العربية الفاخرة'
                ]),
                starting_price: 'يبدأ من 40 دينار',
                display_order: 4
            },
            {
                slug: 'graduation-party-websites',
                title: 'مواقع حفلات التخرج والمناسبات',
                short_description: 'صفحة إلكترونية خاصة بإدارة فعاليات الحفل ومشاركة الصور وجدول الفعاليات.',
                full_description: 'منصة مخصصة لحفلات التخرج الفردية أو الجماعية تضم برنامج الحفل، كود QR للدخول السريع، مساحة لمشاركة صور وفيديوهات الحاضرين بشكل مباشر، وتفاصيل المكان والزمان.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>',
                features: JSON.stringify([
                    'برنامج وجدول فعاليات الحفل بالساعات',
                    'رمز استجابة سريع (QR Code) لسهولة الوصول',
                    'معرض تفاعلي لرفع ومشاركة الصور التذكارية',
                    'تنسيق متجاوب على كافة الهواتف والشاشات'
                ]),
                starting_price: 'يبدأ من 30 دينار',
                display_order: 5
            },
            {
                slug: 'digital-invitations',
                title: 'تصميم الكروت والدعوات الرقمية',
                short_description: 'بطاقات وكروت رقمية ذكية بتصاميم متحركة وثابتة لجميع المناسبات الخاصة.',
                full_description: 'تصميم بطاقات دعوة رقمية فخمة بصيغ متعددة (PDF تفاعلي بروابط قابلة للنقر، بطاقات ويب، صور متحركة MP4/WebP) للمناسبات الرسمية والشخصية كالمؤتمرات، أعياد الميلاد، والافتتاحات.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>',
                features: JSON.stringify([
                    'تصاميم بطاقات حصرية غير مكررة',
                    'أزرار تفاعلية داخل البطاقة للاتصال وتحديد الموقع',
                    'تسليم بصيغ متعددة عالية الدقة للمشاركة السريعة',
                    'تعديلات حتى الوصول للشكل النهائي المطلوب'
                ]),
                starting_price: 'يبدأ من 15 دينار',
                display_order: 6
            },
            {
                slug: 'university-projects',
                title: 'المشاريع والواجبات البرمجية',
                short_description: 'مساعدة برمجية وهندسية متقنة لتنفيذ مشاريع التخرج والمهام الأكاديمية.',
                full_description: 'تنفيذ وشرح مشاريع الويب والتطبيقات وقواعد البيانات للطلاب والدارسين بأسلوب تعليمي نظيف، كتابة كود منظم مع تعليقات توضيحية، وتقديم جلسة شرح لكيفية عمل النظام وآلية مناقشته بنجاح.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
                features: JSON.stringify([
                    'بناء أنظمة برمجية متكاملة (Full Stack / Frontend / Backend)',
                    'أكواد نظيفة وموثقة بالكامل بتعليقات عربية/إنجليزية',
                    'جلسات شرح وتوضيح لمنطق المشروع وطريقة عمله',
                    'دعم فني وتعديلات حسب متطلبات المشرف'
                ]),
                starting_price: 'يبدأ من 45 دينار',
                display_order: 7
            },
            {
                slug: 'online-quizzes',
                title: 'الكوزات والاختبارات التفاعلية',
                short_description: 'منصات اختبارات وتقييم إلكترونية تفاعلية للمراجعة والتدريب والتصحيح الفوري.',
                full_description: 'تطوير نماذج اختبارات ذكية ومحوسبة للطلاب والمدرسين والمراكز التدريبية، تحتوي على توقيت زمني، تصحيح تلقائي فوري، إظهار الشروحات والتغذية الراجعة، وتحليل أداء الطالب بدقة.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>',
                features: JSON.stringify([
                    'أنماط أسئلة متعددة (اختيار من متعدد، صح وخطأ، ملء فراغات)',
                    'مؤقت زمني وتصحيح فوري للنتيجة مع الإجابات النموذجية',
                    'إمكانية تصدير تقارير النتائج بصيغة PDF أو Excel',
                    'حماية من الغش وإعادة ترتيب الأسئلة عشوائياً'
                ]),
                starting_price: 'يبدأ من 30 دينار',
                display_order: 8
            },
            {
                slug: 'custom-web-development',
                title: 'خدمات وحلول برمجية مخصصة',
                short_description: 'تصميم وتطوير برمجيات ومواقع خاصة بالكامل تناسب فكرتك واحتياجاتك المحددة.',
                full_description: 'إذا كانت لديك فكرة تطبيق، نظام إدارة داخلي، أداة برمجية ذكية، أو موقع ذو متطلبات فريدة، نقوم بدراسة الفكرة وبنائها من الصفر وفق أحدث التقنيات وأعلى معايير الأمان وقابلية التوسع.',
                icon_svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
                features: JSON.stringify([
                    'هندسة برمجية مخصصة بالكامل وفق متطلباتك',
                    'واجهات مستخدم فريدة تعكس هويتك وتجربتك',
                    'قواعد بيانات سريعة وآمنة ومحمية',
                    'جاهزية تامة للربط مع بوابات الدفع والـ APIs الخارجية'
                ]),
                starting_price: 'اطلب عرض سعر',
                display_order: 9
            }
        ];

        for (const s of services) {
            const exists = await db.get('SELECT id FROM services WHERE slug = ?', [s.slug]);
            if (!exists) {
                await db.run(
                    `INSERT INTO services (slug, title, short_description, full_description, icon_svg, features, starting_price, display_order)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [s.slug, s.title, s.short_description, s.full_description, s.icon_svg, s.features, s.starting_price, s.display_order]
                );
            }
        }
        console.log('تمت زراعة الخدمات الـ 9 بنجاح.');

        // 4. سابقة الأعمال (Portfolio)
        const portfolioItems = [
            {
                slug: 'elegance-perfumes-store',
                title: 'متجر إليجانس للعطور الفاخرة',
                category: 'متاجر',
                description: 'موقع وتطبيق متجر لعرض وتوزيع العطور مع سلة مشتريات ديناميكية وتواصل مباشر عبر الواتساب لإتمام عمليات الشراء.',
                client_name: 'متجر إليجانس',
                cover_image: '/assets/portfolio-store.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['HTML5', 'CSS3 Modern', 'JavaScript', 'WhatsApp API']),
                is_featured: 1,
                display_order: 1
            },
            {
                slug: 'engineering-grad-2026',
                title: 'منصة تخرج دفعة هندسة البرمجيات 2026',
                category: 'تخرج',
                description: 'موقع تخرج تفاعلي يضم ملفات تعريفية للخريجين، ألبوم ذكريات وسجل تهاني حي مع خريطة قاعة الاحتفال.',
                client_name: 'كلية الملك عبد الله لتكنولوجيا المعلومات',
                cover_image: '/assets/portfolio-grad.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['Node.js', 'Express', 'Tailwind', 'Interactive Map']),
                is_featured: 1,
                display_order: 2
            },
            {
                slug: 'royal-wedding-invitation',
                title: 'دعوة زفاف إلكترونية تفاعلية (أحمد وسارة)',
                category: 'زفاف وخطوبة',
                description: 'دعوة زفاف فاخرة مع عداد تنازلي، تأكيد حضور إلكتروني (RSVP) لحظي، وموقع القاعة على قوقل ماب وإضافة للتقويم.',
                client_name: 'دعوة خاصة',
                cover_image: '/assets/portfolio-wedding.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['HTML5 Semantic', 'CSS Glassmorphism', 'RSVP System', 'Google Maps API']),
                is_featured: 1,
                display_order: 3
            },
            {
                slug: 'tawjihi-smart-hub',
                title: 'بوابة المراجعة التفاعلية لطلاب التوجيهي',
                category: 'توجيهي',
                description: 'منصة لاختبارات التوجيهي التفاعلية وحساب المعدلات التراكمية مع جدول المذاكرة الذكي.',
                client_name: 'مبادرة تعليمية',
                cover_image: '/assets/portfolio-tawjihi.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['JavaScript ES6', 'LocalStorage', 'Chart.js', 'Responsive Grid']),
                is_featured: 1,
                display_order: 4
            },
            {
                slug: 'medical-management-system',
                title: 'نظام إدارة العيادات والمواعيد البرمجي',
                category: 'مشاريع برمجية',
                description: 'مشروع ويب جامعي متكامل لإدارة سجلات المرضى والمواعيد الطبية مع لوحة تحكم وتقارير متقدمة.',
                client_name: 'مشروع تخرج جامعي',
                cover_image: '/assets/portfolio-project.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['Node.js', 'Express', 'SQLite', 'REST API']),
                is_featured: 1,
                display_order: 5
            },
            {
                slug: 'vip-digital-card',
                title: 'بطاقة دعوة ذكية VIP لمؤتمر التكنولوجيا',
                category: 'كروت ودعوات',
                description: 'بطاقة دعوة رقمية متحركة مع رمز QR فريد وتوافق تام للمشاركة عبر واتساب وتليجرام.',
                client_name: 'منتدى الأعمال الرقمي',
                cover_image: '/assets/portfolio-card.svg',
                live_demo_url: '#',
                tech_stack: JSON.stringify(['SVG Animation', 'QR Code Generator', 'CSS3']),
                is_featured: 1,
                display_order: 6
            }
        ];

        for (const p of portfolioItems) {
            const exists = await db.get('SELECT id FROM portfolio WHERE slug = ?', [p.slug]);
            if (!exists) {
                await db.run(
                    `INSERT INTO portfolio (slug, title, category, description, client_name, cover_image, live_demo_url, tech_stack, is_featured, display_order)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.slug, p.title, p.category, p.description, p.client_name, p.cover_image, p.live_demo_url, p.tech_stack, p.is_featured, p.display_order]
                );
            }
        }
        console.log('تمت زراعة سابقة الأعمال بنجاح.');

        // 5. مقالات المدونة والـ SEO
        const blogPosts = [
            {
                slug: 'complete-guide-to-digital-wedding-invitations',
                title: 'دليلك الشامل لإنشاء دعوة زفاف إلكترونية تفاعلية لعام 2026',
                summary: 'اكتشف كيف تحول دعوة زفافك إلى تجربة رقمية لا تُنسى مع ميزات تأكيد الحضور وخريطة الوصول والتقويم الذكي.',
                content: `في عصر التحول الرقمي، أصبحت دعوات الزفاف الإلكترونية الخيار الأول للأزواج الباحثين عن التميز والعملية والتوفير. لم تعد الدعوة مجرد صورة عادية ترسل عبر تطبيقات الدردشة، بل أصبحت موقع ويب مصغر وتفاعلي يعكس أناقة المناسبة.

### لماذا تختار دعوة زفاف إلكترونية؟
1. **تأكيد الحضور الذكي (RSVP):** يمكنك معرفة العدد الدقيق للحضور والاعتذارات مباشرة عبر لوحة تحكم خاصة، مما يجنبك التكاليف الزائدة في حجز القاعات والضيافة.
2. **الوصول الدقيق عبر الخريطة:** وداعاً لوصف الطريق المرهق؛ زر واحد ينقل الضيف مباشرة إلى تطبيق Google Maps مع توجيه دقيق للقاعة.
3. **الحفظ في التقويم:** يمكن للمدعوين إضافة الموعد إلى تقويم Google أو Apple بضغطة زر وتلقي تذكير تلقائي قبل موعد الحفل.
4. **ألبوم الذكريات ومشاركة الصور:** منصة لتوثيق صور الخطوبة ومشاركة مقاطع فيديو الحفل بعد انتهائه مع العائلة.

نحن في **خدماتك الرقمية** نصمم دعوات زفاف وخطوبة راقية بتصاميم عربية مخصصة متوافقة مع كافة أنواع الهواتف.`,
                cover_image: '/assets/blog-wedding.svg',
                category: 'مناسبات وزفاف',
                seo_title: 'دليلك الشامل لدعوات الزفاف الإلكترونية التفاعلية | خدماتك الرقمية',
                seo_description: 'تعرف على مميزات بطاقات ودعوات الزفاف الإلكترونية الذكية مع تأكيد الحضور وخريطة الصالة وتوفير التكاليف.',
                keywords: 'دعوة زفاف الكترونية, موقع زواج, كروت زفاف ديجيتال, بطاقة عرس تفاعلية, تصميم دعوات الاردن'
            },
            {
                slug: 'why-small-business-needs-a-website',
                title: 'كيف يساعد الموقع الإلكتروني المشاريع الصغيرة على مضاعفة المبيعات والمصداقية؟',
                summary: 'هل يكفي الاعتماد على حسابات السوشيال ميديا فقط؟ تعرف على الفوائد الحقيقية لامتلاك موقع ويب خاص بمشروعك الصغير.',
                content: `يعتمد العديد من أصحاب المشاريع الصغيرة في بداياتهم على صفحات إنستغرام وفيسبوك، ولكن سرعان ما يواجهون تحديات تنظيم الطلبات، وضياع رسائل العملاء، وصعوبة بناء هوية تجارية مستقلة وموثوقة.

### الفوائد المباشرة لامتلاك موقع لمشروعك:
- **بناء الثقة والمصداقية:** العميل يثق بالنشاط التجاري الذي يمتلك موقعاً رسمياً أكثر من الحسابات المؤقتة.
- **استقبال الطلبات 24/7:** يعمل موقعك كموظف مبيعات دائم يعرض المنتجات والأسعار والتفاصيل في أي وقت.
- **تسهيل الطلب عبر الواتساب:** إتاحة سلة تسوق ذكية تحول تفاصيل طلب العميل مباشرة إلى محادثة واتساب منسقة وجاهزة للتأكيد.
- **الظهور في نتائج بحث قوقل:** يتيح الموقع للزبائن الجدد العثور على خدماتك عند البحث في منطقتك الجغرافية.

في **خدماتك الرقمية**، نقدم باقات مخصصة تناسب ميزانيات المشاريع الناشئة وتضمن لك الانطلاق السريع.`,
                cover_image: '/assets/blog-business.svg',
                category: 'مشاريع وتجارة',
                seo_title: 'أهمية الموقع الإلكتروني للمشاريع الصغيرة | خدماتك الرقمية',
                seo_description: 'لماذا يحتاج كل مشروع ناشئ إلى موقع إلكتروني مخصص لزيادة المبيعات وبناء الثقة؟ دليلك من خدماتك الرقمية.',
                keywords: 'موقع لمشروع صغير, متجر الكتروني محلي, انشاء موقع الكتروني, تصميم مواقع تجارية'
            },
            {
                slug: 'innovative-graduation-website-ideas',
                title: 'أفكار مبتكرة لتصميم وتوثيق موقع التخرج الجامعي والاحتفال بالنجاح',
                summary: 'اجعل حفل تخرجك حدثاً استثنائياً من خلال صفحة ويب توثق ذكريات سنوات الدراسة وتجمع تهاني الأهل والأصدقاء.',
                content: `تعتبر مرحلة التخرج من أهم المحطات في حياة كل طالب، والاحتفال بها يستحق توثيقاً يبقى إلى الأبد. تصميم موقع تخرج إلكتروني يتيح لك جمع كل محطات مسيرتك الجامعية في رابط شخصي فخم يمكنك مشاركته مع الجميع.

### عناصر يجب توفرها في موقع التخرج المثالي:
- نبذة الخريج والتخصص ومرتبة الشرف.
- معرض صور عالي الجودة للسنوات الجامعية ولقطات حفل التخرج.
- سجل تهاني حي يمكن للأصدقاء والمعارف كتابة رسائلهم ومباركاتهم من خلاله.
- خريطة مكان الحفل ورابط البث المباشر إن وجد للأقارب في الخارج.

اطلب موقع تخرجك الآن من **خدماتك الرقمية** بأسرع وقت وتصاميم مذهلة.`,
                cover_image: '/assets/blog-grad.svg',
                category: 'تخرج وجامعات',
                seo_title: 'أفكار تصميم موقع تخرج جامعي احترافي | خدماتك الرقمية',
                seo_description: 'أفكار مميزة لإنشاء موقع تخرج يخلد ذكريات دراستك الجامعية وسجل التهاني التفاعلي.',
                keywords: 'موقع تخرج, تصميم صفحة تخرج, حفل تخرج جامعي, دعوة تخرج الكترونية'
            },
            {
                slug: 'digital-invitations-vs-traditional-paper',
                title: 'مقارنة تفصيلية: الدعوة الرقمية الذكية مقابل الدعوات الورقية التقليدية',
                summary: 'مقارنة شاملة من حيث التكلفة، السرعة، التأثير البيئي، وسهولة التفاعل والوصول.',
                content: `عند التحضير لمناسبة كبرى كالزفاف أو التخرج أو افتتاح مشروع، يبرز السؤال الدائم: هل نعتمد على الكروت الورقية التقليدية أم ننتقل إلى الدعوات الرقمية الحديثة؟

| وجه المقارنة | الدعوة الرقمية الذكية | الدعوة الورقية التقليدية |
| :--- | :--- | :--- |
| **التكلفة** | تدفع مرة واحدة بتكلفة منخفضة جداً | تكلفة طباعة مرتفعة تزداد مع كل ضيف |
| **سرعة التوزيع** | إرسال فوري لآلاف الأشخاص بنقرة زر | أيام وأسابيع من التوزيع اليدوي والتوصيل |
| **تأكيد الحضور (RSVP)** | نظام رقمي تلقائي يحسب الأعداد فورياً | صعوبة بالغة في حصر الحضور مسبقاً |
| **تحديد الموقع** | فتح الخريطة مباشرة في الهاتف | الاعتماد على كتابة العنوان والوصف التقريبي |
| **التعديل والإلغاء** | إمكانية تعديل أي تفاصيل في ثوانٍ | استحالة التعديل بعد بدء الطباعة |

توفر لك **خدماتك الرقمية** خيارات متميزة تجمع بين الفخامة والذكاء الرقمي.`,
                cover_image: '/assets/blog-compare.svg',
                category: 'تصميم وتقنية',
                seo_title: 'مقارنة الدعوة الرقمية والورقية | خدماتك الرقمية',
                seo_description: 'أيهما أفضل لمناسبتك: الدعوة الإلكترونية الذكية أم الورقية؟ تعرف على الفروقات والتوفير الحقيقي.',
                keywords: 'دعوات ديجيتال, كروت زواج الكترونية, مقارنة الدعوات, بطاقات الكترونية'
            }
        ];

        for (const b of blogPosts) {
            const exists = await db.get('SELECT id FROM blog_posts WHERE slug = ?', [b.slug]);
            if (!exists) {
                await db.run(
                    `INSERT INTO blog_posts (slug, title, summary, content, cover_image, category, seo_title, seo_description, keywords)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [b.slug, b.title, b.summary, b.content, b.cover_image, b.category, b.seo_title, b.seo_description, b.keywords]
                );
            }
        }
        console.log('تمت زراعة مقالات المدونة والـ SEO بنجاح.');

        // 6. باقات الأسعار
        const pricingPlans = [
            {
                name: 'الباقة الأساسية',
                slug: 'basic-plan',
                badge: 'الأكثر توفيراً',
                starting_price: 'يبدأ من 25 دينار',
                period: 'تدفع لمرة واحدة',
                description: 'مثالية للمناسبات الفردية، دعوات الزفاف، صفحات التخرج، وبطاقات التهنئة السريعة.',
                features: JSON.stringify([
                    'صفحة هبوط تفاعلية واحدة بتصميم أنيق',
                    'متجاوبة بالكامل مع جميع الهواتف والأجهزة',
                    'إضافة صورك ونصوصك وموقع القاعة/الحدث',
                    'ربط مباشر مع WhatsApp للاتصال الفوري',
                    'تعديلان مجانيان بعد المعاينة',
                    'تسليم قياسي خلال 24 - 48 ساعة'
                ]),
                is_featured: 0,
                display_order: 1
            },
            {
                name: 'الباقة الاحترافية',
                slug: 'pro-plan',
                badge: 'الأكثر طلباً واختياراً',
                starting_price: 'يبدأ من 60 دينار',
                period: 'تدفع لمرة واحدة',
                description: 'مثالية للمشاريع والمتاجر الناشئة، مواقع التخرج المتكاملة، وأنظمة الكوزات التفاعلية.',
                features: JSON.stringify([
                    'موقع متعدد الأقسام والصفحات المخصصة',
                    'تصميم حصري وفق هويتك وبدون قوالب مكررة',
                    'حركات وتأثيرات انسيابية سلسة (Smooth Animations)',
                    'نظام تأكيد حضور إلكتروني (RSVP) أو سلة طلبات',
                    'معرض صور وسجل رسائل ومشاركات تفاعلي',
                    'تهيئة أساسية لمحركات البحث (SEO)',
                    'دعم فني وتعديلات غير محدودة قبل الإطلاق'
                ]),
                is_featured: 1,
                display_order: 2
            },
            {
                name: 'الباقة المخصصة',
                slug: 'custom-plan',
                badge: 'للمشاريع المتقدمة',
                starting_price: 'اطلب عرض سعر',
                period: 'حسب حجم المشروع',
                description: 'للأنظمة البرمجية المخصصة، المتاجر الكبيرة، ومشاريع التخرج والبرمجيات الخاصة.',
                features: JSON.stringify([
                    'تطوير برمجي متكامل من الصفر (Full-Stack)',
                    'قواعد بيانات مخصصة ولوحة تحكم إدارة شاملة',
                    'جاهزية للربط مع بوابات الدفع الإلكتروني والـ APIs',
                    'جلسات شرح وتدريب على النظام وتسليم السورس كود',
                    'حماية وأمان عالي وتشفير للبيانات الحساسة',
                    'عقد صيانة ودعم فني ممتد'
                ]),
                is_featured: 0,
                display_order: 3
            }
        ];

        for (const pr of pricingPlans) {
            const exists = await db.get('SELECT id FROM pricing_plans WHERE slug = ?', [pr.slug]);
            if (!exists) {
                await db.run(
                    `INSERT INTO pricing_plans (name, slug, badge, starting_price, period, description, features, is_featured, display_order)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [pr.name, pr.slug, pr.badge, pr.starting_price, pr.period, pr.description, pr.features, pr.is_featured, pr.display_order]
                );
            }
        }
        console.log('تمت زراعة باقات الأسعار بنجاح.');

        // 7. الأسئلة الشائعة
        const faqs = [
            {
                question: 'كم يستغرق إنشاء وبرمجة الموقع أو الدعوة الإلكترونية؟',
                answer: 'تتراوح مدة التنفيذ عادة بين 24 إلى 48 ساعة للدعوات وصفحات التخرج والبطاقات، ومن 3 إلى 6 أيام عمل للمتاجر والمشاريع الصغيرة والمواقع متعددة الصفحات، وفقاً لحجم المحتوى والتفاصيل المطلوبة.',
                display_order: 1
            },
            {
                question: 'هل يمكنني طلب تصميم مخصص بالكامل يناسب ذوقي وهويتي؟',
                answer: 'بكل تأكيد. نحن لا نعتمد على قوالب جاهزة مكررة؛ نصمم ونبرمج كل موقع ليعكس ألوانك ونصوصك ومتطلباتك الخاصة بنسبة 100%.',
                display_order: 2
            },
            {
                question: 'هل يعمل الموقع بكفاءة وسرعة على كافة الهواتف الذكية؟',
                answer: 'نعم، نعتمد منهجية Mobile-First في التصميم والبرمجة، مما يضمن أن الموقع يفتح بسرعة فائقة ويتناسق تماماً مع شاشات الهواتف والتابلت والكمبيوتر.',
                display_order: 3
            },
            {
                question: 'هل يمكن تعديل الموقع أو إضافة محتوى بعد التسليم؟',
                answer: 'نعم، نوفر لك فترة تعديلات مجانية بعد التسليم للتأكد من رضاك التام، كما نوفر خيارات لوحات تحكم سهلة تمكنك من تعديل نصوصك وصورك بنفسك في أي وقت.',
                display_order: 4
            },
            {
                question: 'كيف أستطيع إرسال الصور والمعلومات والبيانات الخاصة بي؟',
                answer: 'يمكنك إرفاق ملفاتك وصورك مباشرة عبر نموذج الطلب في الموقع، أو إرسالها بسهولة عبر محادثة WhatsApp بعد تأكيد الطلب.',
                display_order: 5
            },
            {
                question: 'هل توفرون الدومين (اسم النطاق) والاستضافة السريعة؟',
                answer: 'نعم، نوفر خدمة تجهيز الاستضافة السحابية السريعة مع شهادة الأمان SSL وربط الدومين المخصص (.com أو غيره) باسمك أو باسم مشروعك بالكامل.',
                display_order: 6
            },
            {
                question: 'ما هي طرق الدفع المتاحة لتأكيد الطلب؟',
                answer: 'نوفر خيارات دفع محلية وسهلة تشمل التحويل الفوري عبر CliQ، والمحافظ الإلكترونية (Zain Cash / Orange Money)، والتحويل البنكي، أو الدفع عند استلام المعاينة.',
                display_order: 7
            },
            {
                question: 'هل يمكن إنشاء موقع إلكتروني خاص لمناسبة أو فعالية محددة؟',
                answer: 'نعم، صممنا العديد من المنصات والصفحات المخصصة لحفلات الخطوبة، المهرجانات، المسابقات، والفعاليات العائلية والطلابية مع خصائص تفاعلية حصرية.',
                display_order: 8
            }
        ];

        for (const f of faqs) {
            const exists = await db.get('SELECT id FROM faq WHERE question = ?', [f.question]);
            if (!exists) {
                await db.run(
                    `INSERT INTO faq (question, answer, display_order) VALUES (?, ?, ?)`,
                    [f.question, f.answer, f.display_order]
                );
            }
        }
        console.log('تمت زراعة الأسئلة الشائعة بنجاح.');

        console.log('اكتملت زراعة قاعدة البيانات بنجاح تام وبدون أي أخطاء.');
    } catch (err) {
        console.error('حدث خطأ أثناء زراعة البيانات:', err);
    }
}

if (require.main === module) {
    seed().then(() => {
        process.exit(0);
    });
}

module.exports = seed;
