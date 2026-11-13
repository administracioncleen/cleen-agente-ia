import { config } from "../config";
import type { Channel } from "../conversation/store";

const GRAPH_API_VERSION = "v21.0";

async function graphPost(path: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}?access_token=${config.meta.accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta Graph API (${path}) respondio ${response.status}: ${text}`);
  }
}

/** WhatsApp Cloud API usa el phone_number_id como nodo. */
async function sendWhatsapp(toUserId: string, text: string): Promise<void> {
  await graphPost(`${config.meta.whatsappPhoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: toUserId,
    type: "text",
    text: { body: text },
  });
}

/** Messenger e Instagram Messaging comparten el mismo endpoint /me/messages de la Pagina. */
async function sendMessengerOrInstagram(toUserId: string, text: string): Promise<void> {
  await graphPost("me/messages", {
    recipient: { id: toUserId },
    message: { text },
  });
}

export async function sendTextMessage(channel: Channel, toUserId: string, text: string): Promise<void> {
  if (channel === "whatsapp") {
    await sendWhatsapp(toUserId, text);
  } else {
    await sendMessengerOrInstagram(toUserId, text);
  }
}
