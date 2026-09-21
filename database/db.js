const path = require('path');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let dbAsync;

if (databaseUrl) {
    // =========================================================================
    // وضع PostgreSQL السحابي الدائم (Cloud Database - Render / Neon / Supabase)
    // =========================================================================
    console.log('🔄 جاري الاتصال بقاعدة بيانات PostgreSQL السحابية الدائمة...');
    const { Pool } = require('pg');

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    // تهيئة الجداول في PostgreSQL
    async function initPostgresSchema() {
        try {
            const schemaSql = `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role VARCHAR(50) DEFAULT 'admin',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMPTZ
                );

                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    order_number VARCHAR(100) UNIQUE NOT NULL,
                    customer_name VARCHAR(255) NOT NULL,
                    customer_phone VARCHAR(100) NOT NULL,
                    customer_email VARCHAR(255),
                    service_id INTEGER,
                    service_name VARCHAR(255) NOT NULL,
                    project_details TEXT NOT NULL,
                    required_date VARCHAR(100),
                    estimated_budget VARCHAR(100),
                    attachments TEXT,
                    status VARCHAR(100) DEFAULT 'جديد',
                    internal_notes TEXT,
                    ip_address VARCHAR(100),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS services (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(150) UNIQUE NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    short_description TEXT NOT NULL,
                    full_description TEXT NOT NULL,
                    icon_svg TEXT NOT NULL,
                    features TEXT NOT NULL,
                    starting_price VARCHAR(100) NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS portfolio (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(150) UNIQUE NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    client_name VARCHAR(255),
                    cover_image TEXT NOT NULL,
                    gallery TEXT,
                    live_demo_url TEXT,
                    tech_stack TEXT,
                    is_featured INTEGER DEFAULT 0,
                    is_visible INTEGER DEFAULT 1,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS blog_posts (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(150) UNIQUE NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    summary TEXT NOT NULL,
                    content TEXT NOT NULL,
                    cover_image TEXT NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    seo_title VARCHAR(255),
                    seo_description TEXT,
                    keywords TEXT,
                    is_published INTEGER DEFAULT 1,
                    views_count INTEGER DEFAULT 0,
                    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS pricing_plans (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(150) UNIQUE NOT NULL,
                    badge VARCHAR(100),
                    starting_price VARCHAR(100) NOT NULL,
                    period VARCHAR(100) DEFAULT 'تدفع مرة واحدة',
                    description TEXT NOT NULL,
                    features TEXT NOT NULL,
                    is_featured INTEGER DEFAULT 0,
                    is_active INTEGER DEFAULT 1,
                    display_order INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS faq (
                    id SERIAL PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    category VARCHAR(100) DEFAULT 'عام',
                    display_order INTEGER DEFAULT 0,
                    is_active INTEGER DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(100) NOT NULL,
                    email VARCHAR(255),
                    subject VARCHAR(255),
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    ip_address VARCHAR(100),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT NOT NULL,
                    group_name VARCHAR(100) DEFAULT 'general',
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
                CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
                CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
            `;

            await pool.query(schemaSql);
            console.log('✅ تم التحقق من جداول PostgreSQL السحابية وجاهزيتها.');
            try {
                const seed = require('./seed');
                await seed();
            } catch (seedErr) {
                console.error('ملاحظة في زراعة البيانات الأولية في PostgreSQL:', seedErr.message);
            }
        } catch (err) {
            console.error('❌ خطأ في تهيئة جداول PostgreSQL:', err);
        }
    }

    initPostgresSchema();

    // تحويل استعلامات SQLite إلى صيغة PostgreSQL
    function transformQuery(sql) {
        let transformed = sql;

        // تحويل INSERT OR REPLACE الخاصة بجدول settings
        if (/INSERT\s+OR\s+REPLACE\s+INTO\s+settings/i.test(transformed)) {
            if (/group_name/i.test(transformed)) {
                transformed = transformed.replace(
                    /INSERT\s+OR\s+REPLACE\s+INTO\s+settings\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
                    'INSERT INTO settings ($1) VALUES ($2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, group_name = EXCLUDED.group_name, updated_at = CURRENT_TIMESTAMP'
                );
            } else {
                transformed = transformed.replace(
                    /INSERT\s+OR\s+REPLACE\s+INTO\s+settings\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
                    'INSERT INTO settings ($1) VALUES ($2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP'
                );
            }
        }

        // تحويل علامات الاستفهام ? إلى $1, $2, ...
        let paramIdx = 1;
        transformed = transformed.replace(/\?/g, () => '$' + (paramIdx++));

        return transformed;
    }

    dbAsync = {
        isPostgres: true,
        get: async (sql, params = []) => {
            const pgSql = transformQuery(sql);
            const res = await pool.query(pgSql, params);
            return res.rows[0] || null;
        },
        all: async (sql, params = []) => {
            const pgSql = transformQuery(sql);
            const res = await pool.query(pgSql, params);
            return res.rows || [];
        },
        run: async (sql, params = []) => {
            let pgSql = transformQuery(sql);
            // استثناء جدول settings من RETURNING id لأن مفتاحه الأساسي هو key وليس id
            if (/^\s*INSERT\s+INTO\s+(?!settings\b)/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
                pgSql += ' RETURNING id';
            }
            const res = await pool.query(pgSql, params);
            return {
                lastID: res.rows && res.rows[0] && res.rows[0].id !== undefined ? res.rows[0].id : null,
                changes: res.rowCount
            };
        },
        exec: async (sql) => {
            await pool.query(sql);
        },
        rawDb: pool
    };

} else {
    // =========================================================================
    // وضع SQLite المحلي الافتراضي (Local SQLite Database)
    // =========================================================================
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'khadamatak.db');
    const schemaPath = path.join(__dirname, 'schema.sql');

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('خطأ في الاتصال بقاعدة البيانات SQLite:', err.message);
        } else {
            console.log('تم الاتصال بقاعدة البيانات SQLite بنجاح.');
            db.run('PRAGMA foreign_keys = ON');
            db.run('PRAGMA journal_mode = WAL');
            initSchema();
        }
    });

    function initSchema() {
        try {
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                db.exec(schemaSql, async (err) => {
                    if (err) {
                        console.error('خطأ أثناء تهيئة المخطط الهيكلي:', err.message);
                    } else {
                        console.log('تم التحقق من جداول قاعدة البيانات وجاهزيتها.');
                        try {
                            const seed = require('./seed');
                            await seed();
                        } catch (seedErr) {
                            console.error('ملاحظة في زراعة البيانات الأولية:', seedErr.message);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('فشل قراءة ملف المخطط الهيكلي:', error);
        }
    }

    dbAsync = {
        isPostgres: false,
        get: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        },
        all: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
        },
        run: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            });
        },
        exec: (sql) => {
            return new Promise((resolve, reject) => {
                db.exec(sql, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        },
        rawDb: db
    };
}

module.exports = dbAsync;
