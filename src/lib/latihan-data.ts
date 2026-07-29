export type Permainan = {
  slug: string;
  nama: string;
  emoji: string;
  ringkas: string;
  url: string;
};

export const permainan: Permainan[] = [
  {
    slug: "kesalahan-bahasa-1",
    nama: "Mini Game 1",
    emoji: "🎮",
    ringkas: "Uji kefahaman anda tentang kesalahan bahasa Melayu secara interaktif.",
    url: "https://view.genially.com/6a68ab7f20983a5de1d160d9",
  },
];

export const cariPermainan = (slug: string) => permainan.find((p) => p.slug === slug);
