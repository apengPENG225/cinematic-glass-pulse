import { createServerFn } from "@tanstack/react-start";

const EMEL_BOT = "rakanmunsi@e-munsi.app";
const NAMA_BOT = "RakanMunsi 🤖";
const BUCKET = "chat-media";

type HasilJana = { dijana: boolean; sebab?: string };

const SISTEM = `Anda ialah "RakanMunsi", rakan AI rasmi platform e-MuNsi (pembelajaran Bahasa Melayu).
Tugas anda: tulis SATU hantaran pendek untuk Feed Utama pelajar — tip bahasa Melayu yang tepat dan boleh terus digunakan.

Balas HANYA objek JSON sah (tiada blok kod) dengan bentuk:
{
  "tajuk": "tajuk pendek menarik",
  "kandungan": "kapsyen 3-6 ayat gaya mesra manusia, ada contoh salah vs betul, guna emoji berpada",
  "kataKunci": "satu kata dasar Bahasa Melayu untuk rujukan PRPM",
  "promptImej": "arahan bahasa Inggeris untuk menjana infografik ringkas berkaitan tip ini"
}

Peraturan: fakta mesti mengikut tatabahasa rasmi Dewan Bahasa dan Pustaka. "kataKunci" satu perkataan sahaja.`;

function parseJson(teks: string) {
  const bersih = teks.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const a = bersih.indexOf("{");
  const b = bersih.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try {
    return JSON.parse(bersih.slice(a, b + 1)) as {
      tajuk?: string;
      kandungan?: string;
      kataKunci?: string;
      promptImej?: string;
    };
  } catch {
    return null;
  }
}

async function panggilAi(apiKey: string, body: unknown) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const teks = await res.text();
    console.error(`RakanMunsi AI error [${res.status}]: ${teks}`);
    if (res.status === 429) throw new Error("Terlalu banyak permintaan AI. Cuba sebentar lagi.");
    if (res.status === 402) throw new Error("Kredit AI telah habis.");
    throw new Error(`Permintaan AI gagal [${res.status}]`);
  }
  return (await res.json()) as {
    choices?: {
      message?: { content?: string; images?: { image_url?: { url?: string } }[] };
    }[];
  };
}

export const janaPosRakanMunsi = createServerFn({ method: "POST" }).handler(
  async (): Promise<HasilJana> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI belum dikonfigurasikan.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Hanya jana bila feed benar-benar kosong.
    const { count } = await supabaseAdmin
      .from("pos")
      .select("id", { count: "exact", head: true })
      .is("induk_id", null);
    if ((count ?? 0) > 0) return { dijana: false, sebab: "Feed sudah ada hantaran." };

    // Pastikan akaun bot wujud.
    let botId: string | null = null;
    const cipta = await supabaseAdmin.auth.admin.createUser({
      email: EMEL_BOT,
      email_confirm: true,
      user_metadata: { full_name: NAMA_BOT },
    });
    if (cipta.data?.user) {
      botId = cipta.data.user.id;
    } else {
      const senarai = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      botId = senarai.data?.users.find((u) => u.email === EMEL_BOT)?.id ?? null;
    }
    if (!botId) throw new Error("Akaun RakanMunsi tidak dapat disediakan.");
    await supabaseAdmin
      .from("profil")
      .upsert({ id: botId, nama_paparan: NAMA_BOT }, { onConflict: "id" });

    // 1. Jana kapsyen.
    const teksJson = await panggilAi(apiKey, {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SISTEM },
        {
          role: "user",
          content:
            "Feed masih kosong. Tulis hantaran pembuka yang berguna tentang satu kesalahan bahasa Melayu yang lazim.",
        },
      ],
    });
    const isi = parseJson(teksJson.choices?.[0]?.message?.content ?? "");
    if (!isi?.kandungan) throw new Error("RakanMunsi gagal menulis hantaran.");

    const kataKunci = (isi.kataKunci ?? "").split(/\s+/)[0] ?? "";
    const pautan = kataKunci
      ? `\n\n📚 Rujukan sahih: https://prpm.dbp.gov.my/cari1?keyword=${encodeURIComponent(kataKunci)}`
      : "";
    const kandungan = `${isi.tajuk ? `✨ ${isi.tajuk}\n\n` : ""}${isi.kandungan}${pautan}\n\n— RakanMunsi, rakan AI e-MuNsi`;

    // 2. Jana infografik + tera air.
    let laluan: string | null = null;
    try {
      const imejJson = await panggilAi(apiKey, {
        model: "google/gemini-3.1-flash-image",
        messages: [
          {
            role: "user",
            content: `Create a clean dark cinematic educational infographic poster (square) about this Malay language tip: ${isi.promptImej ?? isi.tajuk ?? isi.kandungan}. Use elegant serif headings, soft glassy panels, minimal cute mascot illustration, deep dark background with subtle glow. All visible text must be in Bahasa Melayu and spelled correctly. Place a small tasteful watermark text "e-MuNsi · RakanMunsi" in the bottom-right corner.`,
          },
        ],
        modalities: ["image", "text"],
      });
      const url = imejJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (url?.startsWith("data:")) {
        const base64 = url.split(",")[1] ?? "";
        const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const nama = `${botId}/rakanmunsi-${crypto.randomUUID()}.png`;
        const { error } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(nama, bin, { contentType: "image/png", upsert: false });
        if (!error) laluan = nama;
        else console.error("Muat naik imej RakanMunsi gagal:", error.message);
      }
    } catch (e) {
      console.error("Jana imej RakanMunsi gagal:", e);
    }

    const { error } = await supabaseAdmin
      .from("pos")
      .insert({ user_id: botId, kandungan, imej_url: laluan });
    if (error) throw new Error(error.message);

    return { dijana: true };
  },
);
