import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  image: z.string().min(20),
  soalan: z.string().max(500).optional(),
});

export const scanKesalahanBahasa = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI belum dikonfigurasikan.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Anda ialah Kamera Peka e-MuNsi, pakar bahasa Melayu. Teliti imej yang dimuat naik, petik semula teks yang tertera, dan kenal pasti kesalahan bahasa. Kelaskan setiap kesalahan sebagai Fonologi (ejaan/sebutan), Morfologi (imbuhan/pembentukan kata) atau Sintaksis (struktur ayat). Jawab dalam Bahasa Melayu ringkas dengan format:\n\n**Teks dikesan**\n...\n\n**Kesalahan**\n1. Salah: ... | Betul: ... | Jenis: ... | Sebab: ...\n\n**Rumusan**\n...\n\nJika tiada kesalahan, nyatakan dengan jelas.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: data.soalan?.trim() || "Sila imbas kesalahan bahasa dalam gambar ini." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway error [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("Terlalu banyak permintaan. Cuba sebentar lagi.");
      if (response.status === 402) throw new Error("Kredit AI telah habis.");
      throw new Error(`Permintaan AI gagal [${response.status}]`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { jawapan: json.choices?.[0]?.message?.content ?? "Tiada jawapan diterima." };
  });
