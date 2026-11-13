import { Router, type Request, type Response } from "express";
import { timingSafeEqual, createHmac } from "crypto";
import { config } from "../config";
import type { Channel } from "../conversation/store";

export const metaWebhookRouter = Router();

export interface IncomingTextMessage {
  channel: Channel;
  externalUserId: string;
  text: string;
}

/**
 * Verificacion inicial del webhook (GET), requerida por Meta al configurar la
 * suscripcion en Meta for Developers.
 */
metaWebhookRouter.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.meta.verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

function isValidSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", config.meta.appSecret).update(rawBody).digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Normaliza el payload de WhatsApp Cloud API, Messenger y Instagram Messaging
 * (todos llegan por el mismo webhook de Meta, con forma distinta) a una lista
 * plana de mensajes de texto entrantes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessages(body: any): IncomingTextMessage[] {
  const messages: IncomingTextMessage[] = [];

  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const msg of change.value?.messages ?? []) {
          if (msg.type === "text") {
            messages.push({ channel: "whatsapp", externalUserId: msg.from, text: msg.text.body });
          }
        }
      }
    }
  } else if (body.object === "page" || body.object === "instagram") {
    const channel: Channel = body.object === "instagram" ? "instagram" : "messenger";
    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        if (event.message?.text && !event.message?.is_echo) {
          messages.push({ channel, externalUserId: event.sender.id, text: event.message.text });
        }
      }
    }
  }

  return messages;
}

export function registerWebhookHandler(
  onMessage: (message: IncomingTextMessage) => Promise<void>
) {
  metaWebhookRouter.post("/webhook", async (req: Request, res: Response) => {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !isValidSignature(rawBody, req.header("X-Hub-Signature-256"))) {
      res.sendStatus(401);
      return;
    }

    // Responder 200 de inmediato: Meta reintenta si no respondes rapido.
    res.sendStatus(200);

    const messages = extractMessages(req.body);
    for (const message of messages) {
      try {
        await onMessage(message);
      } catch (err) {
        console.error("Error procesando mensaje entrante:", err);
      }
    }
  });
}
