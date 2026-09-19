-- مخطط قاعدة بيانات منصة خدماتك الرقمية (SQLite Schema)

-- جدول المستخدمين والإدارة
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- جدول طلبات العملاء الحقيقية
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id INTEGER,
    service_name TEXT NOT NULL,
    project_details TEXT NOT NULL,
    required_date TEXT,
    estimated_budget TEXT,
    attachments TEXT, -- JSON array of files
    status TEXT DEFAULT 'جديد', -- جديد, تمت المراجعة, قيد التنفيذ, بانتظار معلومات من العميل, مكتمل, ملغي
    internal_notes TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الخدمات الرقمية
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    icon_svg TEXT NOT NULL,
    features TEXT NOT NULL, -- JSON array
    starting_price TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول سابقة الأعمال (Portfolio)
CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    client_name TEXT,
    cover_image TEXT NOT NULL,
    gallery TEXT, -- JSON array
    live_demo_url TEXT,
    tech_stack TEXT, -- JSON array
    is_featured INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول مقالات المدونة والـ SEO
CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    category TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    keywords TEXT,
    is_published INTEGER DEFAULT 1,
    views_count INTEGER DEFAULT 0,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول باقات الأسعار
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    badge TEXT,
    starting_price TEXT NOT NULL,
    period TEXT DEFAULT 'تدفع مرة واحدة',
    description TEXT NOT NULL,
    features TEXT NOT NULL, -- JSON array
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0
);

-- جدول الأسئلة الشائعة
CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- جدول رسائل التواصل المباشر
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول إعدادات الموقع القابلة للإدارة
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    group_name TEXT DEFAULT 'general',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول سجل المدفوعات المستقبلي
CREATE TABLE IF NOT EXISTS payments_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    gateway TEXT,
    transaction_id TEXT,
    amount REAL,
    currency TEXT DEFAULT 'JOD',
    status TEXT DEFAULT 'pending',
    payload_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- فهارس لتحسين سرعة الاستعلامات والبحث
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio(category);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
