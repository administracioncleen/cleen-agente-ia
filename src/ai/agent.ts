import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { buildSystemPrompt } from "./systemPrompt";
import { searchProducts } from "../shopify/client";
import type { StoredMessage } from "../conversation/store";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
const MODEL = "claude-haiku-5-5";

const tools: Anthropic.Tool[] = [
  {
    name: "consultar_catalogo",
    description:
      "Busca productos de Cleen en Shopify por texto libre (ej. 'filtro hepa', 'purificador rosado') y devuelve precio y stock real por variante/color. Usar siempre antes de afirmar un precio o si hay stock.",
    input_schema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Texto de busqueda del producto" },
      },
      required: ["busqueda"],
    },
  },
  {
    name: "escalar_a_humano",
    description:
      "Deja de responder automaticamente y pasa la conversacion a un agente humano. Usar en reclamos, devoluciones, producto defectuoso, cliente molesto, o cuando no haya informacion suficiente.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Motivo breve del escalamiento" },
      },
      required: ["motivo"],
    },
  },
];

export interface AgentResult {
  replyText: string;
  escalated: boolean;
  escalationReason?: string;
}

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "consultar_catalogo") {
    const products = await searchProducts(String(input.busqueda ?? ""));
    if (products.length === 0) return "No se encontraron productos con esa busqueda.";
    return JSON.stringify(products);
  }
  throw new Error(`Herramienta desconocida: ${name}`);
}

/**
 * Corre el loop de tool-use de Claude para un turno de conversacion.
 * Devuelve el texto final a enviar al cliente y si la conversacion quedo escalada.
 */
export async function runAgentTurn(
  history: StoredMessage[],
  userText: string
): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.MessageParam),
    { role: "user", content: userText },
  ];

  let escalated = false;
  let escalationReason: string | undefined;

  // Hasta 4 vueltas de tool-use por turno (consultar catalogo, escalar, etc.)
  for (let i = 0; i < 4; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      tools,
      messages,
    });

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUses.length === 0) {
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      return { replyText: textBlock?.text ?? "", escalated, escalationReason };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      if (toolUse.name === "escalar_a_humano") {
        escalated = true;
        escalationReason = String((toolUse.input as { motivo?: string }).motivo ?? "sin motivo especificado");
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: "Escalado." });
        continue;
      }

      try {
        const result = await runTool(toolUse.name, toolUse.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: `Error ejecutando la herramienta: ${(err as Error).message}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    replyText:
      "Dejame derivar tu consulta con el equipo para darte una respuesta mas precisa.",
    escalated: true,
    escalationReason: escalationReason ?? "limite de intentos del agente alcanzado",
  };
}
