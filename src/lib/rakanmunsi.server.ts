const EMEL_BOT = "rakanmunsi@e-munsi.app";
const NAMA_BOT = "RakanMunsi 🤖";
const BUCKET = "chat-media";

export type HasilJana = { dijana: boolean; sebab?: string };

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

/**
 * Jana satu hantaran RakanMunsi sehari.
 * - `paksa: false` → langkau jika sudah ada hantaran bot dalam 20 jam lepas.
 * - Sentiasa elak pengulangan: tajuk/kandungan lama dihantar ke AI sebagai senarai elak,
 *   dan hantaran yang serupa dengan hantaran sedia ada tidak akan disimpan.
 */
export async function janaPosHarianRakanMunsi(paksa = false): Promise<HasilJana> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI belum dikonfigurasikan.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Pastikan akaun bot wujud (history hantaran kekal tersimpan di bawah akaun ini).
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

  // Sejarah hantaran bot — untuk gating harian + elak ulangan.
  const { data: lama } = await supabaseAdmin
    .from("pos")
    .select("kandungan, created_at")
    .eq("user_id", botId)
    .is("induk_id", null)
    .order("created_at", { ascending: false })
    .limit(30);

  const terakhir = lama?.[0]?.created_at;
  if (!paksa && terakhir && Date.now() - new Date(terakhir).getTime() < 20 * 60 * 60 * 1000) {
    return { dijana: false, sebab: "Hantaran RakanMunsi hari ini sudah ada." };
  }

  const elak = (lama ?? [])
    .map((p) => (p.kandungan ?? "").split("\n")[0]?.replace(/^✨\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 15);

  const teksJson = await panggilAi(apiKey, {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: SISTEM },
      {
        role: "user",
        content: `Tulis tip harian hari ini (${new Date().toISOString().slice(0, 10)}) tentang satu kesalahan bahasa Melayu yang lazim.${
          elak.length ? `\n\nJANGAN ulang topik/tajuk ini:\n- ${elak.join("\n- ")}` : ""
        }`,
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

  // Cegah hantaran berulang.
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
  if ((lama ?? []).some((p) => norm(p.kandungan ?? "") === norm(kandungan))) {
    return { dijana: false, sebab: "Hantaran serupa sudah wujud." };
  }

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
}
