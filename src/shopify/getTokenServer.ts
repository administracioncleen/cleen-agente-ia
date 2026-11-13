import "dotenv/config";
import express from "express";

// Herramienta de un solo uso: obtiene el Admin API access token de Shopify
// usando el flujo moderno de "token exchange" (las apps nuevas ya no muestran
// el token directo en la UI). Se corre aparte del bot principal porque no
// necesita Anthropic, Meta ni base de datos configurados todavia.

const PORT = Number(process.env.SHOPIFY_TOKEN_SERVER_PORT ?? 3100);
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;

if (!STORE_DOMAIN || !API_KEY || !API_SECRET) {
  console.error(
    "Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_API_KEY o SHOPIFY_API_SECRET en tu .env"
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

app.get("/shopify/install", (_req, res) => {
  res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="shopify-api-key" content="${API_KEY}" />
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  </head>
  <body style="font-family: sans-serif; padding: 24px;">
    <p id="status">Conectando con Shopify...</p>
    <pre id="token" style="white-space: pre-wrap; word-break: break-all; background: #eee; padding: 12px;"></pre>
    <script>
      (async () => {
        try {
          const timeout = (ms) =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Tiempo de espera agotado esperando a Shopify (host). Revisa que la app este incrustada en el panel de control.")), ms)
            );
          const idToken = await Promise.race([shopify.idToken(), timeout(8000)]);
          const resp = await fetch("/shopify/install/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          const data = await resp.json();
          if (data.access_token) {
            document.getElementById("status").textContent =
              "Listo. Copia este token en tu .env como SHOPIFY_ADMIN_ACCESS_TOKEN:";
            document.getElementById("token").textContent = data.access_token;
          } else {
            document.getElementById("status").textContent = "Error: " + JSON.stringify(data);
          }
        } catch (err) {
          document.getElementById("status").textContent = "Error: " + err;
        }
      })();
    </script>
  </body>
</html>`);
});

app.post("/shopify/install/exchange", async (req, res) => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken) {
    res.status(400).json({ error: "Falta idToken" });
    return;
  }

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: API_KEY,
        client_secret: API_SECRET,
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token: idToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        // Shopify rechazo los valores "offline_access_token" y "offline-access-token"
        // con "invalid_requested_token_type". Lo dejamos sin especificar: Shopify
        // devuelve un token offline (de larga duracion) por defecto.
      }),
    });

    const rawText = await response.text();
    console.log(`Shopify respondio ${response.status}:`, rawText);

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      res.status(502).json({
        error: `Shopify respondio algo que no es JSON (status ${response.status}). Ver la consola del servidor para el detalle.`,
        rawSnippet: rawText.slice(0, 300),
      });
      return;
    }

    res.status(response.ok ? 200 : 500).json(data as Record<string, unknown>);
  } catch (err) {
    console.error("Error en el intercambio de token:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Abre http://localhost:${PORT}/shopify/install (via tu tunel) desde la app instalada en Shopify Admin.`);
});
