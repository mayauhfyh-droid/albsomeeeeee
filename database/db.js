const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'khadamatak.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// إنشاء الاتصال بقاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات SQLite:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة البيانات SQLite بنجاح.');
        // تفعيل المفاتيح الأجنبية ونمط WAL للأداء العالي
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        initSchema();
    }
});

// تنفيذ ملف المخطط الهيكلي
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

// دوال مساعدة معتمدة على الوعود (Promise-based query wrappers)
const dbAsync = {
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

module.exports = dbAsync;
