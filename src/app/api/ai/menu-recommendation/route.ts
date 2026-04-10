import { NextRequest } from "next/server";
import { z } from "zod";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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
});

const SYSTEM_PROMPT = `Você é o Muno 🍔, assistente de pedidos de um restaurante. Fala português brasileiro, é animado e usa emojis.

Sua única função: analisar o cardápio e recomendar os itens mais adequados para o cliente.

REGRAS:
- Leia o nome E a descrição de cada item do cardápio antes de recomendar
- Escolha 1 a 4 itens dependendo da fome/pedido do cliente
- Para restrições alimentares (vegano, vegetariano, sem glúten, sem lactose, sem carne), analise cuidadosamente a descrição dos itens antes de recomendar. Se não houver item compatível, diga isso.
- Responda SOMENTE com JSON válido neste formato exato (sem markdown, sem texto fora do JSON):
{"message":"sua resposta animada em 1-2 frases","ids":["id_do_item_1","id_do_item_2"]}

EXEMPLOS de calibração por fome:
- Pouca fome / lanche rápido → 1 item leve
- Com fome / fome normal → 1-2 itens
- Faminto → 2-3 itens
- Esfomeado / morrendo de fome → 3-4 itens (os maiores e mais reforçados)`;

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

  const { message, menuContext } = parsed.data;
  const apiKey = process.env.GEMINI_API_KEY;

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

  const userMessage = `Cardápio completo:\n${menuJson}\n\nPedido do cliente: ${message}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[AI] Gemini error:", data.error?.code, data.error?.message);
      return Response.json({ error: "Erro ao consultar a IA. Tente novamente!" }, { status: 500 });
    }

    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    // Remove markdown code fences if present
    const clean = raw.replace(/^```json\n?|^```\n?|```$/gm, "").trim();

    let parsed2: { message: string; ids: string[] };
    try {
      parsed2 = JSON.parse(clean);
    } catch {
      console.error("[AI] JSON parse failed. Raw response:", raw);
      return Response.json({ error: "A IA retornou uma resposta inválida. Tente novamente!" }, { status: 500 });
    }

    return Response.json({
      text: parsed2.message ?? "",
      ids: Array.isArray(parsed2.ids) ? parsed2.ids : [],
    });
  } catch (err) {
    console.error("[AI] fetch error:", err);
    return Response.json({ error: "Não consegui consultar a IA agora. Tente novamente!" }, { status: 500 });
  }
}
