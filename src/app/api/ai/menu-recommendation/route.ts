import { NextRequest } from "next/server";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const schema = z.object({
  message: z.string().min(1).max(500),
  menuContext: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number(),
      category: z.string(),
    })
  ).min(1).max(150),
  history: z.array(historyMessageSchema).max(10).optional(),
});

const SYSTEM_PROMPT = `Você é o Muno 🍔, assistente de pedidos de um restaurante brasileiro. É animado, usa emojis e fala português.

Sua função: analisar o cardápio e recomendar os itens mais adequados para o cliente.

REGRAS:
- Leia o nome E a descrição de cada item antes de recomendar
- Escolha 1 a 4 itens dependendo da fome/pedido
- Calibração por fome: "pouca fome" = 1 item leve | "com fome" = 1-2 itens | "faminto" = 2-3 itens | "esfomeado" = 3-4 itens (os maiores)
- Para restrições (vegano, sem glúten, sem lactose, sem carne): analise a descrição com cuidado. Se não houver item compatível, diga isso com simpatia
- Responda SOMENTE com JSON válido, sem nenhum texto fora do JSON:
{"message":"sua resposta em 1-2 frases animadas","ids":["id_real_1","id_real_2"]}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("[AI] Zod error:", JSON.stringify(parsed.error.issues));
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { message, menuContext, history = [] } = parsed.data;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "IA não configurada no servidor" }, { status: 500 });
  }

  const menuJson = JSON.stringify(
    menuContext.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
    }))
  );

  // First message includes the full menu. Follow-up messages are lightweight.
  const firstUserMessage = `Cardápio completo:\n${menuJson}\n\nPedido do cliente: ${message}`;
  const followUpMessage = message;

  const isFirstMessage = history.length === 0;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(isFirstMessage
      ? [{ role: "user", content: firstUserMessage }]
      : [
          // Inject the menu only in the first turn so history stays compact
          { role: "user", content: `Cardápio completo:\n${menuJson}\n\nPedido do cliente: ${history[0]?.content ?? message}` },
          ...history.slice(1),
          { role: "user", content: followUpMessage },
        ]),
  ];

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 400,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[AI] Groq error:", data.error?.message);
      return Response.json({ error: "Erro ao consultar a IA. Tente novamente!" }, { status: 500 });
    }

    const raw: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    let result: { message: string; ids: string[] };
    try {
      result = JSON.parse(raw);
    } catch {
      console.error("[AI] JSON parse failed. Raw:", raw);
      return Response.json({ error: "A IA retornou resposta inválida. Tente novamente!" }, { status: 500 });
    }

    return Response.json({
      text: result.message ?? "",
      ids: Array.isArray(result.ids) ? result.ids : [],
    });
  } catch (err) {
    console.error("[AI] fetch error:", err);
    return Response.json({ error: "Não consegui consultar a IA agora. Tente novamente!" }, { status: 500 });
  }
}
