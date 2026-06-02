-- Admin unit perlu membaca semua jabatan (position_references) saat memilih
-- jabatan di unit tujuan mutasi lintas unit kerja.
-- Data ini bersifat referensi/master (read-only untuk admin_unit).

DROP POLICY IF EXISTS "Admin unit can view own department positions" ON public.position_references;

CREATE POLICY "Admin unit can view all position references"
ON public.position_references FOR SELECT
USING (public.has_role(auth.uid(), 'admin_unit'));
