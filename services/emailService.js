const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');

/**
 * تنظيف وتصحيح عنوان البريد الإلكتروني الشائع
 */
function cleanEmail(email) {
    if (!email) return '';
    let e = email.trim().toLowerCase();
    // تصحيح الأخطاء الإملائية الشائعة في اسم النطاق
    e = e.replace(/@gamil\.com$/i, '@gmail.com');
    e = e.replace(/@gmial\.com$/i, '@gmail.com');
    e = e.replace(/@gmai\.com$/i, '@gmail.com');
    return e;
}

/**
 * تنظيف كلمة مرور التطبيقات من المسافات
 */
function cleanPassword(pass) {
    if (!pass) return '';
    // إزالة المسافات التي ينسخها المستخدمون أحياناً من Google App Password
    return pass.replace(/\s+/g, '').trim();
}

/**
 * الحصول على إعدادات البريد من متغيرات البيئة أو قاعدة البيانات
 */
async function getMailConfig() {
    let gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || '';
    let gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
    let notifEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '';
    let smtpHost = process.env.SMTP_HOST || '';
    let smtpPort = process.env.SMTP_PORT || '465';

    try {
        const rows = await db.all('SELECT key, value FROM settings WHERE key IN ("gmail_user", "gmail_app_password", "notification_email", "contact_email")');
        rows.forEach(r => {
            if (r.key === 'gmail_user' && !gmailUser) gmailUser = r.value;
            if (r.key === 'gmail_app_password' && !gmailPass) gmailPass = r.value;
            if (r.key === 'notification_email' && !notifEmail) notifEmail = r.value;
            if (r.key === 'contact_email' && !notifEmail) notifEmail = r.value;
        });
    } catch(e) {}

    gmailUser = cleanEmail(gmailUser);
    gmailPass = cleanPassword(gmailPass);
    notifEmail = cleanEmail(notifEmail) || gmailUser || 'info@khadamatak.com';

    return {
        gmailUser,
        gmailPass,
        notifEmail,
        smtpHost: smtpHost.trim(),
        smtpPort: parseInt(smtpPort)
    };
}

/**
 * إعداد ناقل البريد الإلكتروني (Transporter)
 */
async function createTransporter() {
    const config = await getMailConfig();

    if (!config.gmailUser || !config.gmailPass) {
        return { transporter: null, config };
    }

    // إذا تم تحديد مضيف مخصص
    if (config.smtpHost) {
        return {
            transporter: nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: { user: config.gmailUser, pass: config.gmailPass }
            }),
            config
        };
    }

    // الإعداد المباشر لـ Gmail
    return {
        transporter: nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.gmailUser,
                pass: config.gmailPass // كلمة مرور التطبيقات من Google (16 حرفاً)
            }
        }),
        config
    };
}

/**
 * فحص الاتصال وإرسال بريد تجريبي
 */
async function testMailConnection() {
    const { transporter, config } = await createTransporter();

    if (!config.gmailUser || !config.gmailPass) {
        return {
            success: false,
            message: 'يرجى إدخال البريد الإلكتروني وكلمة مرور التطبيقات (App Password) أولاً.'
        };
    }

    if (!transporter) {
        return {
            success: false,
            message: 'تعذر إنشاء اتصال البريد الإلكتروني.'
        };
    }

    try {
        await transporter.verify();
        
        // إرسال رسالة تجريبية
        const info = await transporter.sendMail({
            from: `"خدماتك الرقمية" <${config.gmailUser}>`,
            to: config.notifEmail || config.gmailUser,
            subject: '🎉 نجاح ربط إشعارات Gmail مع موقع خدماتك الرقمية',
            html: `
                <div dir="rtl" style="font-family: sans-serif; padding: 20px; background: #f8fafc; color: #1e293b;">
                    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #16a34a; margin-top: 0;">✅ تم الاتصال بنجاح!</h2>
                        <p>تهانينا، تم ربط بريدك الإلكتروني بنظام الموقع بنجاح تام.</p>
                        <p>من الآن فصاعداً، ستصلك كافة الطلبات الجديدة مع رقم الطلب ورقم الهاتف والمرفقات مباشرة إلى هذا البريد.</p>
                        <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px; color: #475569;">
                            توقيت الفحص: ${new Date().toLocaleString('ar-JO')}
                        </div>
                    </div>
                </div>
            `
        });

        return {
            success: true,
            message: `تم التحقق بنجاح وإرسال بريد تجريبي إلى ${config.notifEmail || config.gmailUser}!`,
            messageId: info.messageId
        };
    } catch (err) {
        let hint = '';
        if (err.message.includes('535') || err.code === 'EAUTH') {
            hint = 'خطأ في كلمة المرور (Bad Credentials). يجب استخدام "كلمة مرور التطبيقات (Google App Password)" المكونة من 16 حرفاً، وليس كلمة سر الحساب العادية.';
        }
        return {
            success: false,
            message: err.message,
            hint: hint
        };
    }
}

/**
 * إرسال إشعار بطلب جديد مع كافة التفاصيل والمرفقات
 * @param {Object} order
 * @param {Object} [uploadedFile]
 */
async function sendNewOrderEmail(order, uploadedFile = null) {
    const { transporter, config } = await createTransporter();
    const recipientEmail = config.notifEmail || config.gmailUser || 'info@khadamatak.com';
    const siteName = process.env.SITE_NAME || 'خدماتك الرقمية';
    const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    const orderDate = new Date().toLocaleString('ar-JO', {
        timeZone: 'Asia/Amman',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const emailSubject = `🚨 طلب جديد: [${order.order_number}] — ${order.service_name || 'طلب مخصص'} من ${order.customer_name}`;

    // إعداد المرفقات إن وجدت
    const mailAttachments = [];
    let attachmentNoteHtml = '<p style="color: #64748b; font-size: 13px;">لا يوجد ملف مرفق مع هذا الطلب.</p>';

    if (uploadedFile && uploadedFile.path && fs.existsSync(uploadedFile.path)) {
        mailAttachments.push({
            filename: uploadedFile.originalname || path.basename(uploadedFile.path),
            path: uploadedFile.path
        });
        attachmentNoteHtml = `
            <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-right: 4px solid #0284c7; margin-top: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">📎</span>
                    <div>
                        <strong style="color: #0f172a; font-size: 14px;">تم إرفاق الملف/الصورة مباشرة في هذه الرسالة:</strong>
                        <div style="color: #475569; font-size: 12px; margin-top: 3px;">
                            ${uploadedFile.originalname} — الحجم: ${Math.round(uploadedFile.size / 1024)} KB
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
            .header { background: #09090b; color: #ffffff; padding: 25px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
            .header p { margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; }
            .badge-order { display: inline-block; background: #22c55e; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-top: 12px; letter-spacing: 0.5px; }
            .body { padding: 30px; }
            .section-title { font-size: 15px; font-weight: 800; color: #09090b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin: 24px 0 16px 0; }
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .info-grid td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .info-label { font-weight: 700; color: #64748b; width: 35%; background: #f8fafc; }
            .info-value { color: #0f172a; font-weight: 600; }
            .details-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; font-size: 14px; white-space: pre-wrap; color: #18181b; line-height: 1.7; }
            .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; text-align: center; }
            .btn-whatsapp { background: #25D366; color: #ffffff !important; margin-left: 8px; }
            .btn-admin { background: #09090b; color: #ffffff !important; }
            .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${siteName} — إشعار طلب جديد</h1>
                <p>وصلك طلب جديد عبر الموقع الإلكتروني</p>
                <div class="badge-order">رقم الطلب: ${order.order_number}</div>
            </div>
            
            <div class="body">
                <div class="section-title">👤 بيانات العميل والتواصل</div>
                <table class="info-grid">
                    <tr>
                        <td class="info-label">اسم العميل</td>
                        <td class="info-value" style="font-size: 15px; font-weight: 800;">${order.customer_name}</td>
                    </tr>
                    <tr>
                        <td class="info-label">رقم الهاتف / WhatsApp</td>
                        <td class="info-value">
                            <a href="tel:${order.customer_phone}" style="color: #0284c7; text-decoration: none; font-weight: 700; font-size: 15px;">${order.customer_phone}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">البريد الإلكتروني</td>
                        <td class="info-value">${order.customer_email || '<span style="color:#94a3b8;">غير مدخل</span>'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">تاريخ وتوقيت الطلب</td>
                        <td class="info-value">${orderDate}</td>
                    </tr>
                </table>

                <div class="section-title">📦 تفاصيل ومواصفات الطلب</div>
                <table class="info-grid">
                    <tr>
                        <td class="info-label">نوع الخدمة</td>
                        <td class="info-value" style="color: #0284c7; font-size: 15px;">${order.service_name || 'خدمة مخصصة'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">الميزانية المقدرة</td>
                        <td class="info-value" style="color: #16a34a; font-weight: 800;">${order.estimated_budget || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">الموعد المستهدف للتسليم</td>
                        <td class="info-value">${order.required_date || 'مرن / حسب الاتفاق'}</td>
                    </tr>
                </table>

                <div class="section-title">📝 شرح ومتطلبات المشروع كاملة</div>
                <div class="details-box">${order.project_details}</div>

                <div class="section-title">📎 المرفقات والصور المرفوعة</div>
                ${attachmentNoteHtml}

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${whatsappUrl}" class="btn btn-whatsapp" target="_blank">
                        💬 محادثة العميل مباشرة عبر WhatsApp
                    </a>
                    <a href="${process.env.SITE_URL || 'http://localhost:3000'}${process.env.ADMIN_PATH || '/admin-panel-secret'}" class="btn btn-admin" target="_blank">
                        ⚙️ فتح لوحة تحكم الإدارة
                    </a>
                </div>
            </div>

            <div class="footer">
                تم إنشاء هذا الإشعار الآلي من منصة <strong>${siteName}</strong>.<br>
                عنوان IP المرسل: ${order.ip_address || 'غير محدد'}
            </div>
        </div>
    </body>
    </html>
    `;

    if (!transporter) {
        console.log('\n=============================================================');
        console.log('📬 [تنبيه البريد الإلكتروني]: تم استلام طلب جديد رقم:', order.order_number);
        console.log('👤 العميل:', order.customer_name, '— هاتف:', order.customer_phone);
        console.log('📌 الخدمة:', order.service_name, '— الميزانية:', order.estimated_budget);
        console.log('📝 تفاصيل المشروع:\n', order.project_details);
        if (uploadedFile) console.log('📎 الملف المرفق:', uploadedFile.originalname, '->', uploadedFile.path);
        console.log('💡 ملاحظة لربط Gmail: قم بإضافة GMAIL_USER و GMAIL_APP_PASSWORD في ملف .env لإرسال الإشعارات والمرفقات فورياً إلى بريدك.');
        console.log('=============================================================\n');
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${siteName}" <${config.gmailUser}>`,
            to: recipientEmail,
            subject: emailSubject,
            html: htmlContent,
            attachments: mailAttachments
        });

        console.log(`✅ [Gmail] تم إرسال إشعار الطلب (${order.order_number}) بنجاح إلى: ${recipientEmail} (MessageID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ [Gmail Error] فشل إرسال البريد الإلكتروني:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * إرسال إشعار بالرسائل العامة الواردة
 * @param {Object} msg
 */
async function sendContactMessageEmail(msg) {
    const { transporter, config } = await createTransporter();
    const recipientEmail = config.notifEmail || config.gmailUser || 'info@khadamatak.com';
    const siteName = process.env.SITE_NAME || 'خدماتك الرقمية';
    const cleanPhone = (msg.phone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;

    const emailSubject = `✉️ رسالة استفسار جديدة من: ${msg.name} [${msg.subject || 'بدون عنوان'}]`;

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
            .header { background: #09090b; color: #ffffff; padding: 20px 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; }
            .body { padding: 25px; }
            .info-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
            .details-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; font-size: 14px; white-space: pre-wrap; color: #18181b; }
            .btn-whatsapp { display: inline-block; background: #25D366; color: #ffffff !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${siteName} — رسالة استفسار جديدة</h1>
            </div>
            <div class="body">
                <div class="info-box">
                    <p><strong>الاسم:</strong> ${msg.name}</p>
                    <p><strong>رقم الهاتف:</strong> <a href="tel:${msg.phone}">${msg.phone}</a></p>
                    <p><strong>البريد:</strong> ${msg.email || 'غير مدخل'}</p>
                    <p><strong>الموضوع:</strong> ${msg.subject || 'عام'}</p>
                </div>
                <h3>نص الرسالة:</h3>
                <div class="details-box">${msg.message}</div>
                <div style="text-align: center;">
                    <a href="${whatsappUrl}" class="btn-whatsapp" target="_blank">💬 رد عبر WhatsApp</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    if (!transporter) {
        console.log('📬 [تنبيه استفسار جديد]: من', msg.name, '— هاتف:', msg.phone, '— رسالة:', msg.message);
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${siteName}" <${config.gmailUser}>`,
            to: recipientEmail,
            subject: emailSubject,
            html: htmlContent
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ [Gmail Error]:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendNewOrderEmail,
    sendContactMessageEmail,
    testMailConnection
};
