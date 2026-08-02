
REVOKE ALL ON FUNCTION public.adalah_ahli(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tapis_teks(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.saring_kandungan() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sertai_bilik(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sertai_bilik(TEXT) TO authenticated;
