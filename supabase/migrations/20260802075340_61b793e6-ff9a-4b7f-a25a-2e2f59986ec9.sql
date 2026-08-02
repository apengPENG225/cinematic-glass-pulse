
CREATE TABLE public.profil (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_paparan TEXT NOT NULL DEFAULT 'Pengguna',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profil TO authenticated;
GRANT ALL ON public.profil TO service_role;
ALTER TABLE public.profil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profil_baca" ON public.profil FOR SELECT TO authenticated USING (true);
CREATE POLICY "profil_tulis" ON public.profil FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profil_kemas" ON public.profil FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.bilik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  tajuk TEXT,
  kod TEXT NOT NULL UNIQUE,
  pemilik UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bilik TO authenticated;
GRANT ALL ON public.bilik TO service_role;
ALTER TABLE public.bilik ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ahli_bilik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bilik_id UUID NOT NULL REFERENCES public.bilik(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peranan TEXT NOT NULL DEFAULT 'ahli',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bilik_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.ahli_bilik TO authenticated;
GRANT ALL ON public.ahli_bilik TO service_role;
ALTER TABLE public.ahli_bilik ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.adalah_ahli(_bilik UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ahli_bilik WHERE bilik_id = _bilik AND user_id = _user)
$$;

CREATE POLICY "bilik_baca_ahli" ON public.bilik FOR SELECT TO authenticated
  USING (public.adalah_ahli(id, auth.uid()));
CREATE POLICY "bilik_cipta" ON public.bilik FOR INSERT TO authenticated WITH CHECK (pemilik = auth.uid());
CREATE POLICY "bilik_kemas_pemilik" ON public.bilik FOR UPDATE TO authenticated USING (pemilik = auth.uid()) WITH CHECK (pemilik = auth.uid());
CREATE POLICY "bilik_padam_pemilik" ON public.bilik FOR DELETE TO authenticated USING (pemilik = auth.uid());

CREATE POLICY "ahli_baca" ON public.ahli_bilik FOR SELECT TO authenticated
  USING (public.adalah_ahli(bilik_id, auth.uid()));
CREATE POLICY "ahli_tambah_diri" ON public.ahli_bilik FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ahli_keluar" ON public.ahli_bilik FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.kata_tapis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kata TEXT NOT NULL UNIQUE,
  tahap TEXT NOT NULL DEFAULT 'lucah'
);
GRANT SELECT ON public.kata_tapis TO authenticated;
GRANT ALL ON public.kata_tapis TO service_role;
ALTER TABLE public.kata_tapis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kata_tapis_baca" ON public.kata_tapis FOR SELECT TO authenticated USING (true);

INSERT INTO public.kata_tapis (kata, tahap) VALUES
 ('pukimak','lucah'),('babi','kesat'),('anjing','kesat'),('bodoh','kesat'),('bangsat','kesat'),
 ('sial','kesat'),('celaka','kesat'),('bahlul','kesat'),('lancau','lucah'),('kimak','lucah'),
 ('cibai','lucah'),('pantat','lucah'),('konek','lucah'),('bogel','lucah'),('lucah','lucah'),
 ('porno','lucah'),('bitch','kesat'),('fuck','lucah'),('shit','kesat'),('asshole','kesat'),
 ('bastard','kesat'),('dick','lucah'),('keparat','kesat'),('haramjadah','kesat'),('setan','kesat');

CREATE OR REPLACE FUNCTION public.tapis_teks(_teks TEXT)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; hasil TEXT := COALESCE(_teks, '');
BEGIN
  FOR r IN SELECT kata FROM public.kata_tapis LOOP
    hasil := regexp_replace(hasil, '\m' || r.kata || '\M', repeat('*', length(r.kata)), 'gi');
  END LOOP;
  RETURN hasil;
END; $$;

CREATE OR REPLACE FUNCTION public.saring_kandungan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bersih TEXT;
BEGIN
  bersih := public.tapis_teks(NEW.kandungan);
  NEW.ditapis := (bersih IS DISTINCT FROM NEW.kandungan);
  NEW.kandungan := bersih;
  RETURN NEW;
END; $$;

CREATE TABLE public.mesej (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bilik_id UUID NOT NULL REFERENCES public.bilik(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kandungan TEXT NOT NULL DEFAULT '',
  imej_url TEXT,
  ditapis BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mesej_bilik_idx ON public.mesej (bilik_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.mesej TO authenticated;
GRANT ALL ON public.mesej TO service_role;
ALTER TABLE public.mesej ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mesej_baca_ahli" ON public.mesej FOR SELECT TO authenticated USING (public.adalah_ahli(bilik_id, auth.uid()));
CREATE POLICY "mesej_hantar_ahli" ON public.mesej FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.adalah_ahli(bilik_id, auth.uid()));
CREATE POLICY "mesej_padam_sendiri" ON public.mesej FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER mesej_saring BEFORE INSERT OR UPDATE ON public.mesej FOR EACH ROW EXECUTE FUNCTION public.saring_kandungan();

CREATE TABLE public.pos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  induk_id UUID REFERENCES public.pos(id) ON DELETE CASCADE,
  kandungan TEXT NOT NULL DEFAULT '',
  imej_url TEXT,
  ditapis BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pos_induk_idx ON public.pos (induk_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.pos TO authenticated;
GRANT ALL ON public.pos TO service_role;
ALTER TABLE public.pos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_baca" ON public.pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pos_cipta" ON public.pos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pos_padam_sendiri" ON public.pos FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER pos_saring BEFORE INSERT OR UPDATE ON public.pos FOR EACH ROW EXECUTE FUNCTION public.saring_kandungan();

CREATE TABLE public.suka_pos (
  pos_id UUID NOT NULL REFERENCES public.pos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pos_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.suka_pos TO authenticated;
GRANT ALL ON public.suka_pos TO service_role;
ALTER TABLE public.suka_pos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suka_baca" ON public.suka_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "suka_tambah" ON public.suka_pos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "suka_buang" ON public.suka_pos FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sertai_bilik(_kod TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Perlu log masuk'; END IF;
  SELECT id INTO _id FROM public.bilik WHERE lower(kod) = lower(trim(_kod));
  IF _id IS NULL THEN RAISE EXCEPTION 'Kod bilik tidak sah'; END IF;
  INSERT INTO public.ahli_bilik (bilik_id, user_id) VALUES (_id, auth.uid())
  ON CONFLICT (bilik_id, user_id) DO NOTHING;
  RETURN _id;
END; $$;
GRANT EXECUTE ON FUNCTION public.sertai_bilik(TEXT) TO authenticated;

ALTER TABLE public.mesej REPLICA IDENTITY FULL;
ALTER TABLE public.pos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesej;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos;

CREATE POLICY "chat_media_baca" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');
CREATE POLICY "chat_media_muatnaik" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat_media_padam" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
