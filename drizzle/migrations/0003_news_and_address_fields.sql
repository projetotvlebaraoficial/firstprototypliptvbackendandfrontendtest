ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number text, ADD COLUMN IF NOT EXISTS address_complement text, ADD COLUMN IF NOT EXISTS neighborhood text;

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Umbanda',
  kind text NOT NULL DEFAULT 'novidade',
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_url text,
  author_id uuid,
  author_name text NOT NULL DEFAULT 'Equipe TV Lebara',
  author_role text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read news" ON public.news FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff write news" ON public.news FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "staff upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));