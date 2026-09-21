const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'khadamatak_super_secret_jwt_key_2026_secure_random_token';

// التحقق من صحة جلسة الأدمن
async function requireAuth(req, res, next) {
    try {
        let token = null;

        // التحقق من الكوكيز أولاً
        if (req.cookies && req.cookies.admin_token) {
            token = req.cookies.admin_token;
        } 
        // أو التحقق من ترويسة Authorization
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // إذا كان الطلب من المتصفح لصفحة HTML وليس استدعاء API
            if (req.accepts('html') && !req.path.startsWith('/api/')) {
                return res.status(404).sendFile(path.join(__dirname, '../views', '404.html'));
            }
            return res.status(401).json({ success: false, message: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول أولاً.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // التحقق من وجود المستخدم في قاعدة البيانات
        const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
        if (!user) {
            res.clearCookie('admin_token');
            if (req.accepts('html') && !req.path.startsWith('/api/')) {
                return res.status(404).sendFile(path.join(__dirname, '../views', '404.html'));
            }
            return res.status(401).json({ success: false, message: 'المستخدم غير موجود أو تم حذفه.' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.clearCookie('admin_token');
        if (req.accepts('html') && !req.path.startsWith('/api/')) {
            return res.status(404).sendFile(path.join(__dirname, '../views', '404.html'));
        }
        return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول.' });
    }
}

// دالة فحص مصادقة خفيفة لمعرفة ما إذا كان الزائر أدمن مسجل دخوله مسبقاً
async function checkAuthStatus(req) {
    try {
        let token = null;
        if (req.cookies && req.cookies.admin_token) {
            token = req.cookies.admin_token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return null;
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
        return user || null;
    } catch (e) {
        return null;
    }
}

// توليد توكن JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = {
    requireAuth,
    checkAuthStatus,
    generateToken
};
