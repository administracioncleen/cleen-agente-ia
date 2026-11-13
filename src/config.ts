import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} (revisa tu .env)`);
  }
  return value;
}

// Las credenciales de Meta llegan en Fase 2 del plan (en revision 24-48h con Meta).
// Mientras tanto el servidor arranca igual, pero el webhook va a rechazar cualquier
// llamada real hasta que esto este completo (ver meta/webhook.ts).
function pendingMeta(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] ${name} todavia no esta configurado (pendiente de Meta).`);
    return "";
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),

  anthropicApiKey: required("ANTHROPIC_API_KEY"),

  meta: {
    verifyToken: pendingMeta("META_WEBHOOK_VERIFY_TOKEN"),
    appSecret: pendingMeta("META_APP_SECRET"),
    accessToken: pendingMeta("META_ACCESS_TOKEN"),
    whatsappPhoneNumberId: pendingMeta("WHATSAPP_PHONE_NUMBER_ID"),
    pageId: process.env.META_PAGE_ID ?? "",
  },

  shopify: {
    storeDomain: required("SHOPIFY_STORE_DOMAIN"),
    adminAccessToken: required("SHOPIFY_ADMIN_ACCESS_TOKEN"),
    publicStoreUrl: process.env.SHOPIFY_PUBLIC_STORE_URL ?? "https://cleen.cl",
    // El stock que usa el bot es solo el de esta sucursal (no la suma de todas).
    locationName: process.env.SHOPIFY_LOCATION_NAME ?? "Sucursal Shippit",
  },

  databaseUrl: required("DATABASE_URL"),

  escalationNotifyWhatsappNumber: process.env.ESCALATION_NOTIFY_WHATSAPP_NUMBER ?? "",
};
