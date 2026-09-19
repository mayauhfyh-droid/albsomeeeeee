const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');

// التأكد من وجود مجلد الرفع
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد التخزين بأسماء ملفات آمنة وفريدة
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        // إزالة الحروف غير الآمنة من اسم الملف
        const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
        cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
    }
});

// فلترة أنواع الملفات المسموح برفعها
const fileFilter = (req, file, cb) => {
    // قبول كافة صيغ الصور والمستندات والملفات المضغوطة والتصاميم
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.vbs', '.msi', '.dll', '.com'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!dangerousExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('لا يمكن رفع الملفات التنفيذية لأسباب أمنية. يرجى إرفاق صور أو مستندات أو ملفات مضغوطة.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 ميغابايت كحد أقصى للملف الواحد
    },
    fileFilter: fileFilter
});

module.exports = upload;
