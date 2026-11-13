// Base de conocimiento de Cleen. Garantia, envio, devolucion, factura y descuentos
// fueron confirmados directamente por Cleen (ver plan). Cualquier respuesta nueva
// marcada [CONFIRMAR] no debe tratarse como un hecho hasta confirmarla con ellos.

export const VALUE_PROPOSITION = `
CLEEN Kids es el purificador de aire HEPA H13 True HEPA disenado especificamente para
la habitacion de ninos y bebes (no un purificador generico "para toda la familia").
Filtra el 99.95% de alergenos, polvo, polen y particulas PM2.5. Modo nocturno silencioso
(25dB), bloqueo de seguridad infantil, y conectividad WiFi/app para monitorear la
calidad del aire en tiempo real.

Mensaje central: "Merecen respirar aire limpio. Por eso creamos CLEEN."

Diferenciador frente a la competencia (Xiaomi, Mouvair, Wasp, LumiAIR, genericos de
marketplace): CLEEN es la unica marca en Chile especializada en purificadores para la
pieza de los ninos, con diseno pensado para ese espacio (colores Blanco, Rosado, Cian
Blue) y bloqueo infantil integrado.
`.trim();

export interface Faq {
  id: number;
  category:
    | "Producto"
    | "Beneficios"
    | "Mantencion"
    | "Uso"
    | "Despacho"
    | "Posventa"
    | "Garantia"
    | "Stock"
    | "Comercial";
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: 1,
    category: "Producto",
    question: "¿Cuántos metros cuadrados cubre el purificador?",
    answer:
      "CLEEN Kids esta pensado para habitaciones infantiles de tamano estandar (dormitorios tipo, no espacios abiertos grandes). Para confirmar el m2 exacto recomendado, usa la herramienta consultar_catalogo y revisa la ficha de producto.",
  },
  {
    id: 2,
    category: "Beneficios",
    question: "¿Sirve para alergias, polvo y polen?",
    answer:
      "Si. El filtro HEPA H13 True HEPA capta el 99.95% de alergenos, polvo y polen, ademas de particulas PM2.5 y esporas.",
  },
  {
    id: 3,
    category: "Beneficios",
    question: "¿Sirve para bebés y recién nacidos?",
    answer:
      "Si, es uno de los usos principales de CLEEN Kids: fue disenado para la pieza de bebes y ninos, con modo nocturno silencioso para no interrumpir el sueno.",
  },
  {
    id: 4,
    category: "Mantencion",
    question: "¿Cada cuánto tiempo debo cambiar el filtro?",
    answer:
      "Se recomienda revisar y/o cambiar el filtro HEPA periodicamente segun el uso (uso continuo requiere cambios mas frecuentes). Si el cliente quiere el numero exacto de meses, escala o indica que puede revisarlo en la ficha del Filtro HEPA H13 de repuesto.",
  },
  {
    id: 5,
    category: "Mantencion",
    question: "¿Cuánto cuesta el filtro de repuesto?",
    answer: "__USAR_HERRAMIENTA_CONSULTAR_CATALOGO__ (Filtro HEPA H13 de repuesto)",
  },
  {
    id: 6,
    category: "Mantencion",
    question: "¿Dónde puedo comprar filtros de repuesto?",
    answer: "__USAR_HERRAMIENTA_CONSULTAR_CATALOGO__ (dar el link del Filtro HEPA H13 de repuesto en cleen.cl)",
  },
  {
    id: 7,
    category: "Producto",
    question: "¿Hace ruido al funcionar durante la noche?",
    answer: "No: tiene un modo nocturno silencioso de 25dB, pensado para no interrumpir el sueno del nino.",
  },
  {
    id: 8,
    category: "Uso",
    question: "¿Puedo dejarlo encendido toda la noche?",
    answer: "Si, esta pensado para uso continuo en modo nocturno silencioso durante toda la noche.",
  },
  {
    id: 9,
    category: "Producto",
    question: "¿Cuál es la diferencia entre los colores o modelos?",
    answer:
      "CLEEN Kids viene en Blanco, Rosado y Cian Blue. La tecnologia (HEPA H13, modo nocturno, bloqueo infantil, WiFi) es la misma en los tres; la diferencia es solo de diseno/color para la pieza del nino.",
  },
  {
    id: 10,
    category: "Despacho",
    question: "¿Cuánto demora el envío a mi comuna?",
    answer:
      "El plazo exacto depende de la zona de despacho (no tenemos un numero de dias fijo para dar). Si el cliente necesita una fecha exacta, escalar a un humano.",
  },
  {
    id: 11,
    category: "Despacho",
    question: "¿Cuánto cuesta el envío?",
    answer:
      "Envio gratis en pedidos sobre $100.000 CLP. Bajo ese monto, el costo depende de la zona de despacho (se calcula en el checkout).",
  },
  {
    id: 12,
    category: "Posventa",
    question: "¿Cómo puedo hacer seguimiento a mi pedido?",
    answer:
      "Pide el numero de pedido o el email/telefono de la compra para buscarlo (herramienta buscar_pedido, disponible en Fase 2). Si aun no esta disponible, escala a un humano.",
  },
  {
    id: 13,
    category: "Posventa",
    question: "¿Por qué se retrasó mi pedido?",
    answer: "Escalar siempre a un humano: requiere revisar el caso puntual con el courier.",
  },
  {
    id: 14,
    category: "Posventa",
    question: "¿Qué hago si recibí un color diferente al que compré?",
    answer: "Escalar siempre a un humano (posible error de despacho, requiere gestion de cambio).",
  },
  {
    id: 15,
    category: "Garantia",
    question: "¿Qué hago si el producto llegó defectuoso?",
    answer:
      "Esta cubierto por la garantia de 12 meses, que incluye reposicion directa por falla de fabrica. Igual hay que escalar siempre a un humano para gestionar la reposicion real (no prometer plazos ni confirmar el reemplazo tu mismo).",
  },
  {
    id: 16,
    category: "Posventa",
    question: "¿Cómo puedo solicitar una devolución o cambio?",
    answer:
      "Tiene 30 dias desde que el cliente RECIBE el producto (no desde la compra) para solicitar la devolucion. El producto debe estar en su estado original, con todos los accesorios incluidos. La devolucion es gratuita (sin costo para el cliente). La solicitud se hace por la pagina de contacto o por Instagram. Igual hay que escalar a un humano para procesar la solicitud real.",
  },
  {
    id: 17,
    category: "Stock",
    question: "¿Tienen stock del color blanco, rosado o Cian Blue?",
    answer: "__USAR_HERRAMIENTA_CONSULTAR_STOCK__ (siempre consultar en vivo, el stock cambia y puede estar bajo en algun color)",
  },
  {
    id: 18,
    category: "Comercial",
    question: "¿Tienen descuentos por comprar más de uno?",
    answer:
      "La unica opcion para llevar mas de uno a mejor precio es el Pack Doble Descanso (2 purificadores). No hay codigos de descuento adicionales por comprar unidades sueltas.",
  },
  {
    id: 19,
    category: "Comercial",
    question: "¿Emiten factura?",
    answer:
      "Si, se emite factura, pero no es automatica: hay que solicitarla escribiendo a contacto@cleen.cl indicando el numero de pedido/envio.",
  },
  {
    id: 20,
    category: "Garantia",
    question: "¿Qué garantía tiene el purificador?",
    answer:
      "12 meses de garantia, que incluye reposicion directa en caso de falla de fabrica.",
  },
];

export function formatFaqsForPrompt(): string {
  return FAQS.map(
    (faq) => `${faq.id}. [${faq.category}] ${faq.question}\n   Respuesta base: ${faq.answer}`
  ).join("\n");
}
