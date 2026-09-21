// middleware/obfuscator.js

const BOT_USER_AGENTS = [
    'googlebot',
    'google-site-verification',
    'google-inspectiontool',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    'exabot',
    'facebot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'applebot'
];

function isSearchBot(userAgent) {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function obfuscateHtml(html, req) {
    const userAgent = req.headers['user-agent'] || '';
    
    // محركات البحث تحصل على الكود الأصلي الصافي لضمان فهرسة Google 100%
    if (isSearchBot(userAgent)) {
        return html;
    }

    // للمستخدمين والمتصفحات: تشفير الكود وإخفاء كود المصدر
    const b64 = Buffer.from(html, 'utf8').toString('base64');
    
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>جاري التحميل... — خدماتك الرقمية</title>
<style>
body{margin:0;padding:0;background:#0b0f19;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;overflow:hidden}
.loader-box{text-align:center}
.loader-spinner{width:42px;height:42px;border:3px solid rgba(255,255,255,.1);border-radius:50%;border-top-color:#38bdf8;animation:spin 0.8s ease-in-out infinite;margin:0 auto 1rem auto}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
<script>
/* 
 * -----------------------------------------------------------
 *  (C) 2026 KHADAMATAK DIGITAL AGENCY. ALL RIGHTS RESERVED.
 *  PROPRIETARY CODE - REVERSE ENGINEERING STRICTLY PROHIBITED
 * -----------------------------------------------------------
 */
(function(){
    try {
        var _kData = "${b64}";
        var _raw = atob(_kData);
        var _bytes = new Uint8Array(_raw.length);
        for (var i = 0; i < _raw.length; i++) {
            _bytes[i] = _raw.charCodeAt(i);
        }
        var _decoded = new TextDecoder('utf-8').decode(_bytes);
        document.open();
        document.write(_decoded);
        document.close();
    } catch(e) {
        document.body.innerHTML = '<div style="text-align:center;padding:2rem;color:#f87171;">حدث خطأ أثناء تحميل الصفحة. يرجى التحديث.</div>';
    }
})();
</script>
<noscript>
    <div style="text-align:center;padding:2rem;color:#fff;">
        <h2>يرجى تفعيل الجافاسكريبت (JavaScript) لمشاهدة الموقع</h2>
    </div>
</noscript>
</head>
<body>
    <div class="loader-box">
        <div class="loader-spinner"></div>
    </div>
</body>
</html>`;
}

module.exports = {
    isSearchBot,
    obfuscateHtml
};
