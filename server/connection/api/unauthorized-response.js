function getUnauthorizedPageHtml() {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Acces expire</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #101417;
      --panel: rgba(19, 27, 33, 0.92);
      --fg: #f0f4f7;
      --muted: rgba(240, 244, 247, 0.78);
      --accent: #4bd4ff;
      --danger: #ff8f8f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: radial-gradient(circle at 20% 10%, #1f2e3a, var(--bg));
      color: var(--fg);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    main {
      width: min(100%, 460px);
      padding: 28px 24px;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: var(--panel);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
    }
    .eyebrow {
      margin: 0 0 12px;
      color: var(--danger);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(1.6rem, 5vw, 2rem);
      line-height: 1.1;
    }
    p {
      margin: 0 0 12px;
      color: var(--muted);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main>
    <h1>Connexion expiree</h1>
    <p>Rescannez le code QR du serveur.</p>
  </main>
</body>
</html>`;
}

export function sendUnauthorizedResponse(req, res) {
  if (typeof req?.accepts === 'function' && req.accepts('html')) {
    res.status(401).type('text/html').send(getUnauthorizedPageHtml());
    return;
  }

  res.status(401).type('text/plain').send('Unauthorized');
}
