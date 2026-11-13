# Agente de IA para Cleen — WhatsApp, Messenger e Instagram

MVP (Fase 1 del plan): responde preguntas frecuentes de producto, mantención, uso
y stock usando Claude + el catálogo real de Shopify, y escala a un humano todo lo
demás (reclamos, devoluciones, producto defectuoso). Arranca solo en WhatsApp; el
mismo backend ya sabe recibir Messenger e Instagram para la Fase 2.

Ver el plan completo (contexto de negocio, FAQs, puntos a confirmar, fases) en
`/Users/Andres/.claude/plans/cached-petting-shannon.md`.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa en `.env`:

- **ANTHROPIC_API_KEY**: tu API key de Anthropic (console.anthropic.com).
- **META_WEBHOOK_VERIFY_TOKEN**: cualquier string que tú elijas (lo vas a pegar también en Meta for Developers al configurar el webhook).
- **META_APP_SECRET**: en Meta for Developers → tu App → Configuración básica.
- **META_ACCESS_TOKEN**: token de acceso permanente de un *System User* de tu Business Manager, con permisos `whatsapp_business_messaging`, `pages_messaging`, `instagram_manage_messages`.
- **WHATSAPP_PHONE_NUMBER_ID**: Meta for Developers → tu App → WhatsApp → Configuración de la API.
- **SHOPIFY_STORE_DOMAIN**: tu dominio `*.myshopify.com`.
- **SHOPIFY_ADMIN_ACCESS_TOKEN**: token con permisos `read_products`, `read_locations` y `read_inventory` (y `read_orders` cuando lleguemos a Fase 2). Se obtiene corriendo `npm run shopify:token` (ver sección de abajo).
- **SHOPIFY_LOCATION_NAME**: nombre exacto de la sucursal cuyo stock usa el bot (hoy "Sucursal Shippit"). El bot solo mira esa sucursal, nunca la suma de todas.
- **DATABASE_URL**: cadena de conexión Postgres (ej. de Supabase o Neon).

## 3. Crear la tabla de conversaciones

```bash
npm run migrate
```

## 4. Levantar el servidor en desarrollo

```bash
npm run dev
```

Esto expone:
- `GET /health` — chequeo simple.
- `GET /webhook` y `POST /webhook` — endpoint que Meta debe llamar.

## 5. Exponer el servidor a internet (para que Meta pueda llamarlo)

Mientras no tengas un hosting definitivo (Railway/Render, ver el plan), para
probar en local puedes usar un túnel, por ejemplo:

```bash
npx ngrok http 3000
```

Copia la URL `https://...ngrok-free.app` que te entrega.

## 6. Configurar el webhook en Meta for Developers

1. En tu App de Meta → WhatsApp → Configuración → Webhooks.
2. URL de devolución de llamada: `https://TU-URL/webhook`.
3. Token de verificación: el mismo valor que pusiste en `META_WEBHOOK_VERIFY_TOKEN`.
4. Suscríbete al campo `messages`.
5. Repite el mismo webhook para la Página de Facebook (Messenger) e Instagram cuando quieras activar la Fase 2 — es la misma URL, solo se suscriben los campos `messages` de esos productos.

## 7. Probar

- Escríbele al número de WhatsApp Business de prueba y valida que responda.
- Prueba al menos 5 de las 20 FAQs reales (ver el plan) y compara contra lo que respondería hoy un agente humano.
- Pregunta por el color **Blanco** del purificador y confirma que el stock que da el bot coincide con el stock real en Shopify (es bajo: hay que validar que no diga "sí hay stock" sin consultarlo).
- Simula un reclamo ("llegó roto mi purificador") y confirma en los logs (`[ESCALADO] ...`) y en la tabla `conversations` (columna `status = 'escalado'`) que el bot dejó de responder.

## Pendiente antes de producción

- ~~Confirmar garantía, envío, devolución, facturación y descuentos~~ — confirmado con Cleen y ya cargado en `src/ai/knowledge.ts`.
- Credenciales de Meta (WhatsApp/Messenger/Instagram) — en revisión 24-48h con Meta.
- Definir y conectar el canal real de aviso de escalamiento (hoy solo queda en el log) en `src/server.ts`, función `handleIncomingMessage`.
- Elegir hosting definitivo (Railway/Render recomendado en el plan) y mover las variables de entorno ahí.

## Nota sobre Dropbox

Este proyecto vive dentro de una carpeta sincronizada por Dropbox. Antes de correr
`npm install` (que crea `node_modules/`, miles de archivos pequeños), conviene
excluirlo de la sincronización: clic derecho sobre la carpeta `node_modules` →
Dropbox → "Ignorar" (o mover el proyecto fuera de Dropbox a una carpeta local si
vas a trabajar el código seguido). `node_modules/`, `dist/` y `.env` ya están en
`.gitignore`.
