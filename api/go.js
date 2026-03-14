const config = require('../config.json');

module.exports = (req, res) => {
  const target = req.query.t;

  if (!target || !config.links[target]) {
    res.status(404).send('Link not found');
    return;
  }

  const link = config.links[target];
  const webUrl = link.url;
  const deepLink = link.deepLink || '';
  const intentUrl = link.intentUrl || '';

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Lightweight redirect page
  // - In TikTok WebView: DON'T attempt deep links (causes error), just go to web URL
  // - In system browser: attempt deep link first, fallback to web URL
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting...</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:20px}
    .c{max-width:320px}
    .spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.2);border-top-color:#fe2c55;border-radius:50%;animation:s .8s linear infinite;margin:0 auto 16px}
    @keyframes s{to{transform:rotate(360deg)}}
    p{font-size:14px;opacity:.7}
  </style>
</head>
<body>
  <div class="c">
    <div class="spinner"></div>
    <p>Đang chuyển hướng...</p>
  </div>
  <script>
  (function(){
    var web = ${JSON.stringify(webUrl)};
    var deep = ${JSON.stringify(deepLink)};
    var intent = ${JSON.stringify(intentUrl)};
    var ua = navigator.userAgent || '';
    var isAndroid = /android/i.test(ua);
    var isTikTok = /musical_ly|tiktok|bytedance/i.test(ua);
    var isWebView = /(WebView)|(iPhone|iPod|iPad)(?!.*Safari\\/)|(Android.*wv\\))/i.test(ua);
    var done = false;

    function go(url) {
      if (!done) { done = true; window.location.replace(url); }
    }

    // In TikTok WebView: deep links are BLOCKED (causes "cannot complete action")
    // So just redirect to the web URL directly
    if (isTikTok || isWebView) {
      go(web);
      return;
    }

    // In system browser: try deep link first, then fallback to web
    if (deep) {
      window.location.href = deep;
    }
    if (isAndroid && intent) {
      setTimeout(function() {
        if (!document.hidden) window.location.href = intent;
      }, 500);
    }
    setTimeout(function() {
      if (!document.hidden) go(web);
    }, 1200);
  })();
  </script>
</body>
</html>`;

  res.status(200).send(html);
};
