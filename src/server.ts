import express, { type Request } from "express";
import { config } from "./config";
import { metaWebhookRouter, registerWebhookHandler, type IncomingTextMessage } from "./meta/webhook";
import { sendTextMessage } from "./meta/send";
import { runAgentTurn } from "./ai/agent";
import {
  getOrCreateConversation,
  appendMessage,
  escalateConversation,
} from "./conversation/store";
import { testChatRouter } from "./testChatRouter";

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);

async function handleIncomingMessage(message: IncomingTextMessage): Promise<void> {
  const conversation = await getOrCreateConversation(message.channel, message.externalUserId);

  await appendMessage(conversation.id, {
    role: "user",
    content: message.text,
    at: new Date().toISOString(),
  });

  if (conversation.status === "escalado") {
    // Ya esta siendo atendida por un humano: el bot no vuelve a responder.
    return;
  }

  const result = await runAgentTurn(conversation.messages, message.text);

  if (result.replyText) {
    await sendTextMessage(message.channel, message.externalUserId, result.replyText);
    await appendMessage(conversation.id, {
      role: "assistant",
      content: result.replyText,
      at: new Date().toISOString(),
    });
  }

  if (result.escalated) {
    await escalateConversation(conversation.id, result.escalationReason ?? "sin motivo");
    console.log(
      `[ESCALADO] canal=${message.channel} usuario=${message.externalUserId} motivo="${result.escalationReason}"`
    );
    // TODO Fase 1: enviar el aviso real al equipo (WhatsApp interno, email o Slack)
    // usando config.escalationNotifyWhatsappNumber.
  }
}

registerWebhookHandler(handleIncomingMessage);
app.use(metaWebhookRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Chat de prueba publico, para probar el bot sin WhatsApp (ver testChatRouter.ts).
// No expone secretos; solo conversa usando el mismo motor del bot real.
app.use("/test", testChatRouter);

app.listen(config.port, () => {
  console.log(`Agente de Cleen escuchando en el puerto ${config.port}`);
});
