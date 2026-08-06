CREATE TABLE public.set_kad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tajuk text NOT NULL,
  topik text NOT NULL DEFAULT 'Umum',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.set_kad TO authenticated;
GRANT ALL ON public.set_kad TO service_role;
ALTER TABLE public.set_kad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "set_kad_baca" ON public.set_kad FOR SELECT TO authenticated USING (true);
CREATE POLICY "set_kad_cipta" ON public.set_kad FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "set_kad_padam" ON public.set_kad FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.kad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.set_kad(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soalan text NOT NULL,
  jawapan text NOT NULL,
  urutan int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kad TO authenticated;
GRANT ALL ON public.kad TO service_role;
ALTER TABLE public.kad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kad_baca" ON public.kad FOR SELECT TO authenticated USING (true);
CREATE POLICY "kad_cipta" ON public.kad FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "kad_padam" ON public.kad FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.undian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soalan text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.undian TO authenticated;
GRANT ALL ON public.undian TO service_role;
ALTER TABLE public.undian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "undian_baca" ON public.undian FOR SELECT TO authenticated USING (true);
CREATE POLICY "undian_cipta" ON public.undian FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "undian_padam" ON public.undian FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.undian_pilihan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  undian_id uuid NOT NULL REFERENCES public.undian(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teks text NOT NULL,
  urutan int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.undian_pilihan TO authenticated;
GRANT ALL ON public.undian_pilihan TO service_role;
ALTER TABLE public.undian_pilihan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "undian_pilihan_baca" ON public.undian_pilihan FOR SELECT TO authenticated USING (true);
CREATE POLICY "undian_pilihan_cipta" ON public.undian_pilihan FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "undian_pilihan_padam" ON public.undian_pilihan FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.undian_undi (
  undian_id uuid NOT NULL REFERENCES public.undian(id) ON DELETE CASCADE,
  pilihan_id uuid NOT NULL REFERENCES public.undian_pilihan(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (undian_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.undian_undi TO authenticated;
GRANT ALL ON public.undian_undi TO service_role;
ALTER TABLE public.undian_undi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "undi_baca" ON public.undian_undi FOR SELECT TO authenticated USING (true);
CREATE POLICY "undi_cipta" ON public.undian_undi FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "undi_kemas" ON public.undian_undi FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "undi_padam" ON public.undian_undi FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER set_kad_saring BEFORE INSERT OR UPDATE ON public.set_kad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER set_kad_saring ON public.set_kad;

ALTER PUBLICATION supabase_realtime ADD TABLE public.undian;
ALTER PUBLICATION supabase_realtime ADD TABLE public.undian_undi;

CREATE INDEX idx_kad_set ON public.kad(set_id);
CREATE INDEX idx_pilihan_undian ON public.undian_pilihan(undian_id);