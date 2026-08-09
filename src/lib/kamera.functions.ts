import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  image: z.string().min(20),
  soalan: z.string().max(500).optional(),
});

export type JenisKesalahan = "Fonologi" | "Morfologi" | "Sintaksis" | "Lain-lain";

export type Kesalahan = {
  salah: string;
  betul: string;
  jenis: JenisKesalahan;
  sebab: string;
  kataKunci: string;
};

export type AnalisisBahasa = {
  teksDikesan: string;
  kesalahan: Kesalahan[];
  rumusan: string;
  mentah?: string;
};

const SYSTEM = `Anda ialah "Kamera Peka" e-MuNsi, pakar tatabahasa Bahasa Melayu (rujukan utama: Pusat Rujukan Persuratan Melayu, DBP).

Teliti imej, petik semula teks yang tertera, dan kenal pasti setiap kesalahan bahasa.
Kelaskan setiap kesalahan sebagai "Fonologi" (ejaan/sebutan), "Morfologi" (imbuhan/pembentukan kata), "Sintaksis" (struktur ayat) atau "Lain-lain".

Balas HANYA dengan objek JSON sah (tiada teks lain, tiada blok kod) dengan bentuk:
{
  "teksDikesan": "teks penuh yang dibaca daripada gambar",
  "kesalahan": [
    {
      "salah": "perkataan/frasa yang salah sahaja",
      "betul": "pembetulan yang tepat sahaja",
      "jenis": "Fonologi | Morfologi | Sintaksis | Lain-lain",
      "sebab": "penjelasan ringkas 1-2 ayat mengikut hukum tatabahasa",
      "kataKunci": "satu kata dasar/kata betul untuk dicari dalam PRPM"
    }
  ],
  "rumusan": "rumusan ringkas keseluruhan dalam Bahasa Melayu"
}

Peraturan: setiap kesalahan WAJIB ada pembetulan. "kataKunci" mesti satu perkataan sahaja (kata dasar bagi bentuk yang betul) supaya boleh dicari di PRPM. Jika tiada kesalahan, kembalikan "kesalahan": [] dan nyatakan dalam rumusan.`;

function cubaParse(teks: string): AnalisisBahasa | null {
  const bersih = teks
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const mula = bersih.indexOf("{");
  const akhir = bersih.lastIndexOf("}");
  if (mula === -1 || akhir === -1) return null;
  try {
    const raw = JSON.parse(bersih.slice(mula, akhir + 1)) as Partial<AnalisisBahasa>;
    return {
      teksDikesan: String(raw.teksDikesan ?? ""),
      rumusan: String(raw.rumusan ?? ""),
      kesalahan: Array.isArray(raw.kesalahan)
        ? raw.kesalahan.slice(0, 30).map((k) => ({
            salah: String(k?.salah ?? ""),
            betul: String(k?.betul ?? ""),
            jenis: (["Fonologi", "Morfologi", "Sintaksis"].includes(String(k?.jenis))
              ? k?.jenis
              : "Lain-lain") as JenisKesalahan,
            sebab: String(k?.sebab ?? ""),
            kataKunci: String(k?.kataKunci ?? k?.betul ?? "").split(/\s+/)[0] ?? "",
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export const scanKesalahanBahasa = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<AnalisisBahasa> => {
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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  data.soalan?.trim() ||
                  "Sila imbas kesalahan bahasa dalam gambar ini dan berikan pembetulan.",
              },
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
    const teks = json.choices?.[0]?.message?.content ?? "";
    const hasil = cubaParse(teks);
    if (hasil) return hasil;
    return {
      teksDikesan: "",
      kesalahan: [],
      rumusan: "",
      mentah: teks || "Tiada jawapan diterima.",
    };
  });
      "betul": "pembetulan yang tepat sahaja",
      "jenis": "Fonologi | Morfologi | Sintaksis | Lain-lain",
      "sebab": "penjelasan ringkas 1-2 ayat mengikut hukum tatabahasa",
      "kataKunci": "satu kata dasar/kata betul untuk dicari dalam PRPM"
    }
  ],
  "rumusan": "rumusan ringkas keseluruhan dalam Bahasa Melayu"
}

Peraturan: setiap kesalahan WAJIB ada pembetulan. "kataKunci" mesti satu perkataan sahaja (kata dasar bagi bentuk yang betul) supaya boleh dicari di PRPM. Jika tiada kesalahan, kembalikan "kesalahan": [] dan nyatakan dalam rumusan.`;

function cubaParse(teks: string): AnalisisBahasa | null {
  const bersih = teks
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const mula = bersih.indexOf("{");
  const akhir = bersih.lastIndexOf("}");
  if (mula === -1 || akhir === -1) return null;
  try {
    const raw = JSON.parse(bersih.slice(mula, akhir + 1)) as Partial<AnalisisBahasa>;
    return {
      teksDikesan: String(raw.teksDikesan ?? ""),
      rumusan: String(raw.rumusan ?? ""),
      kesalahan: Array.isArray(raw.kesalahan)
        ? raw.kesalahan.slice(0, 30).map((k) => ({
            salah: String(k?.salah ?? ""),
            betul: String(k?.betul ?? ""),
            jenis: (["Fonologi", "Morfologi", "Sintaksis"].includes(String(k?.jenis))
              ? k?.jenis
              : "Lain-lain") as JenisKesalahan,
            sebab: String(k?.sebab ?? ""),
            kataKunci: String(k?.kataKunci ?? k?.betul ?? "").split(/\s+/)[0] ?? "",
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export const scanKesalahanBahasa = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<AnalisisBahasa> => {
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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  data.soalan?.trim() ||
                  "Sila imbas kesalahan bahasa dalam gambar ini dan berikan pembetulan.",
              },
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
    const teks = json.choices?.[0]?.message?.content ?? "";
    const hasil = cubaParse(teks);
    if (hasil) return hasil;
    return {
      teksDikesan: "",
      kesalahan: [],
      rumusan: "",
      mentah: teks || "Tiada jawapan diterima.",
    };
  });
      "betul": "pembetulan yang tepat sahaja",
      "jenis": "Fonologi | Morfologi | Sintaksis | Lain-lain",
      "sebab": "penjelasan ringkas 1-2 ayat mengikut hukum tatabahasa",
      "kataKunci": "satu kata dasar/kata betul untuk dicari dalam PRPM"
    }
  ],
  "rumusan": "rumusan ringkas keseluruhan dalam Bahasa Melayu"
}

Peraturan: setiap kesalahan WAJIB ada pembetulan. "kataKunci" mesti satu perkataan sahaja (kata dasar bagi bentuk yang betul) supaya boleh dicari di PRPM. Jika tiada kesalahan, kembalikan "kesalahan": [] dan nyatakan dalam rumusan.`;

function cubaParse(teks: string): AnalisisBahasa | null {
  const bersih = teks
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const mula = bersih.indexOf("{");
  const akhir = bersih.lastIndexOf("}");
  if (mula === -1 || akhir === -1) return null;
  try {
    const raw = JSON.parse(bersih.slice(mula, akhir + 1)) as Partial<AnalisisBahasa>;
    return {
      teksDikesan: String(raw.teksDikesan ?? ""),
      rumusan: String(raw.rumusan ?? ""),
      kesalahan: Array.isArray(raw.kesalahan)
        ? raw.kesalahan.slice(0, 30).map((k) => ({
            salah: String(k?.salah ?? ""),
            betul: String(k?.betul ?? ""),
            jenis: (["Fonologi", "Morfologi", "Sintaksis"].includes(String(k?.jenis))
              ? k?.jenis
              : "Lain-lain") as JenisKesalahan,
            sebab: String(k?.sebab ?? ""),
            kataKunci: String(k?.kataKunci ?? k?.betul ?? "").split(/\s+/)[0] ?? "",
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export const scanKesalahanBahasa = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<AnalisisBahasa> => {
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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  data.soalan?.trim() ||
                  "Sila imbas kesalahan bahasa dalam gambar ini dan berikan pembetulan.",
              },
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
    const teks = json.choices?.[0]?.message?.content ?? "";
    const hasil = cubaParse(teks);
    if (hasil) return hasil;
    return {
      teksDikesan: "",
      kesalahan: [],
      rumusan: "",
      mentah: teks || "Tiada jawapan diterima.",
    };
  });
