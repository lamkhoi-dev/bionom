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

  // Set no-cache headers to prevent TikTok WebView from caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Return a lightweight HTML page that attempts deep link first,
  // then falls back to regular URL
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="3;url=${webUrl}">
  <title>Redirecting...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 320px; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #fe2c55;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 14px; opacity: 0.7; margin-bottom: 20px; }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: #1877f2;
      color: #fff;
      text-decoration: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .btn.show { opacity: 1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Đang chuyển hướng...</p>
    <a id="fallback-btn" class="btn" href="${webUrl}">Mở ${link.label}</a>
  </div>

  <script>
    (function() {
      var webUrl = ${JSON.stringify(webUrl)};
      var deepLink = ${JSON.stringify(deepLink)};
      var intentUrl = ${JSON.stringify(intentUrl)};
      var ua = navigator.userAgent || '';
      var isAndroid = /android/i.test(ua);
      var redirected = false;

      function goWeb() {
        if (!redirected) {
          redirected = true;
          window.location.href = webUrl;
        }
      }

      // Show manual button after 2 seconds as last resort
      setTimeout(function() {
        var btn = document.getElementById('fallback-btn');
        if (btn) btn.classList.add('show');
      }, 2000);

      // Layer 1: Try deep link immediately
      if (deepLink) {
        window.location.href = deepLink;
      }

      // Layer 2: Android Intent URL fallback after 500ms
      if (isAndroid && intentUrl) {
        setTimeout(function() {
          if (!document.hidden) {
            window.location.href = intentUrl;
          }
        }, 500);
      }

      // Layer 3: Regular URL fallback after 1200ms
      setTimeout(function() {
        if (!document.hidden) {
          goWeb();
        }
      }, 1200);
    })();
  </script>
</body>
</html>`;

  res.status(200).send(html);
};
