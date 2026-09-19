const rateLimit = require('express-rate-limit');

// محدد معدل الطلبات للنماذج الحساسة (منع السبام والتخمين)
const formRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 20, // حد أقصى 20 طلب لكل IP خلال 15 دقيقة
    message: {
        success: false,
        message: 'تم تجاوز الحد المسموح به من الطلبات مؤقتاً. يرجى المحاولة بعد قليل.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// محدد معدل محاولات تسجيل دخول الأدمن
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 10, // حد أقصى 10 محاولات
    message: {
        success: false,
        message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد 15 دقيقة.'
    }
});

// دالة تطهير النصوص لمنع هجمات XSS
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

// دالة توليد رقم طلب مرجعي فريد
function generateOrderNumber() {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const timeSuffix = Date.now().toString().slice(-3);
    return `ORD-${year}-${randomDigits}${timeSuffix}`;
}

module.exports = {
    formRateLimiter,
    loginRateLimiter,
    sanitizeString,
    generateOrderNumber
};
