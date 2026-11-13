import "dotenv/config";
import express from "express";
import { runAgentTurn } from "./ai/agent";
import type { StoredMessage } from "./conversation/store";

// Chat de prueba local: habla con el mismo motor de IA que usara el bot real
// (Claude + catalogo de Shopify en vivo), sin necesitar WhatsApp/Meta ni desplegar nada.

const PORT = Number(process.env.TEST_CHAT_PORT ?? 3200);
const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Probar agente Cleen</title>
    <style>
      body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 24px auto; padding: 0 16px; }
      h1 { font-size: 18px; }
      #chat { border: 1px solid #ddd; border-radius: 8px; padding: 12px; height: 420px; overflow-y: auto; margin-bottom: 12px; }
      .msg { margin-bottom: 10px; line-height: 1.4; }
      .user { text-align: right; }
      .user .bubble { background: #0a84ff; color: white; }
      .assistant .bubble { background: #eee; color: #111; }
      .escalado .bubble { background: #fff3cd; color: #664d03; }
      .bubble { display: inline-block; padding: 8px 12px; border-radius: 12px; max-width: 80%; white-space: pre-wrap; }
      form { display: flex; gap: 8px; }
      input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
      button { padding: 10px 16px; border-radius: 8px; border: none; background: #0a84ff; color: white; cursor: pointer; }
      button:disabled { opacity: 0.5; }
    </style>
  </head>
  <body>
    <h1>Probar el agente de Cleen (local, sin WhatsApp)</h1>
    <div id="chat"></div>
    <form id="form">
      <input id="input" placeholder="Escribe una pregunta como cliente..." autocomplete="off" />
      <button id="send">Enviar</button>
    </form>
    <script>
      const chat = document.getElementById("chat");
      const form = document.getElementById("form");
      const input = document.getElementById("input");
      const sendBtn = document.getElementById("send");
      let history = [];

      function addBubble(role, text) {
        const row = document.createElement("div");
        row.className = "msg " + role;
        const bubble = document.createElement("span");
        bubble.className = "bubble";
        bubble.textContent = text;
        row.appendChild(bubble);
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        addBubble("user", text);
        input.value = "";
        sendBtn.disabled = true;
        try {
          const resp = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, message: text }),
          });
          const data = await resp.json();
          if (data.error) {
            addBubble("assistant", "Error: " + data.error);
          } else {
            addBubble(data.escalated ? "escalado" : "assistant", data.reply + (data.escalated ? "\\n\\n[Se habria escalado a un humano aqui]" : ""));
            history.push({ role: "user", content: text, at: new Date().toISOString() });
            history.push({ role: "assistant", content: data.reply, at: new Date().toISOString() });
          }
        } catch (err) {
          addBubble("assistant", "Error: " + err);
        } finally {
          sendBtn.disabled = false;
          input.focus();
        }
      });
    </script>
  </body>
</html>`);
});

app.post("/chat", async (req, res) => {
  const { history, message } = req.body as { history: StoredMessage[]; message: string };
  try {
    const result = await runAgentTurn(history ?? [], message);
    res.json({ reply: result.replyText, escalated: result.escalated, reason: result.escalationReason });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Chat de prueba en http://localhost:${PORT}`);
});
