export function renderQrPage({ qrDataUrl, publicUrl }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Remote Mouse - QR</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #101417;
    --panel: rgba(19, 27, 33, 0.92);
    --text: #f0f4f7;
    --muted: rgba(240, 244, 247, 0.8);
    --line: rgba(255,255,255,.12);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 20px;
    font-family: system-ui, sans-serif;
    background: radial-gradient(circle at 20% 10%, #1f2e3a, var(--bg));
    color: var(--text);
  }
  .card {
    width: min(100%, 860px);
    display: grid;
    grid-template-columns: minmax(220px, 360px) minmax(0, 1fr);
    gap: 22px;
    align-items: center;
    padding: 22px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 18px 48px rgba(0,0,0,.35);
  }
  .copy h1 { margin: 0 0 10px; font-size: clamp(1.4rem, 4vw, 2rem); }
  .copy p { margin: 0 0 14px; color: var(--muted); line-height: 1.5; }
  .qr-wrap {
    display: grid;
    place-items: center;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,.04);
  }
  img { width: min(100%, 320px); height: auto; background: white; padding: 12px; border-radius: 14px; }
  code {
    display: block;
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(255,255,255,.04);
    color: var(--text);
    font-size: .92rem;
    word-break: break-word;
  }
  @media (max-width: 720px) {
    .card {
      grid-template-columns: 1fr;
      text-align: center;
      padding: 18px;
    }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="qr-wrap">
      <img src="${qrDataUrl}" alt="QR code" />
    </div>
    <div class="copy">
      <h1>Scanner pour connecter</h1>
      <p>Ouvrez cette page sur mobile ou scannez le code QR pour acceder directement a la telecommande.</p>
      <code>${publicUrl}</code>
    </div>
  </div>
</body>
</html>`;
}
