export function renderQrPage({ qrDataUrl, publicUrl }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Remote Mouse - QR</title>
<style>
body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #111; color: #f4f4f4; }
.card { text-align: center; padding: 1.5rem; background: #1a1a1a; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
img { width: min(80vw, 360px); height: auto; background: white; padding: 10px; border-radius: 10px; }
code { display: block; margin-top: 1rem; opacity: .9; }
</style>
</head>
<body>
  <div class="card">
    <h1>Scanner pour connecter</h1>
    <img src="${qrDataUrl}" alt="QR code" />
    <code>${publicUrl}</code>
  </div>
</body>
</html>`;
}
