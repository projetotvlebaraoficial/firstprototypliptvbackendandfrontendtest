CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','admin_chefe'))
$$;

CREATE TABLE public.programs (
  slug text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Umbanda',
  description text NOT NULL DEFAULT '',
  rating text NOT NULL DEFAULT 'L',
  status text NOT NULL DEFAULT 'gravado',
  day text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT 'hero',
  image_url text,
  published boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read programs" ON public.programs FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff write programs" ON public.programs FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug text NOT NULL REFERENCES public.programs(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  module text NOT NULL DEFAULT 'Módulo 1',
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'video',
  video_url text,
  body text,
  duration text,
  sort integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read lessons" ON public.lessons FOR SELECT TO authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff write lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT 'Assinante',
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "active members comment" ON public.comments FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = auth.uid() AND s.status = 'ativa' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.banned)
  AND EXISTS (SELECT 1 FROM public.lessons l JOIN public.programs pr ON pr.slug = l.program_slug WHERE l.id = lesson_id AND pr.status <> 'ao-vivo')
);
CREATE POLICY "own or staff delete comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

INSERT INTO public.programs (slug, title, category, description, rating, status, day, time, duration, image, sort) VALUES
('toque-de-atabaque','Toque de Atabaque','Candomblé','Ogãs de diferentes casas mostram os ritmos, os toques e as histórias guardadas em cada instrumento.','L','ao-vivo','Hoje','19:00','60 min','p1',1),
('vozes-de-terreiro','Vozes de Terreiro','Podcasts','Conversas francas entre mulheres de axé sobre fé, família, trabalho e o cotidiano das tradições.','12','em-breve','Hoje','21:00','50 min','p2',2),
('palavra-dos-mais-velhos','Palavra dos Mais Velhos','Palestras e estudos','Babalorixás, ialorixás e pais de santo compartilham ensinamentos aprendidos ao longo de décadas.','L','em-breve','Amanhã','20:00','75 min','p3',3),
('saberes-da-jurema','Saberes da Jurema','Jurema Sagrada','Uma viagem pelo Nordeste para conhecer ervas, cantos e a memória dos mestres e mestras juremeiros.','10','gravado','Sábado','18:00','45 min','p4',4),
('roda-de-conversa','Roda de Conversa','Entrevistas e conversas','Convidados de várias tradições se encontram para debater temas atuais com respeito às diferenças.','12','gravado','Domingo','16:00','90 min','studio',5),
('umbanda-de-raiz','Umbanda de Raiz','Umbanda','A história da Umbanda contada por quem a vive: origens, linhas de trabalho e a caridade no dia a dia.','L','em-breve','Segunda','20:00','60 min','hero',6);
INSERT INTO public.lessons (program_slug, module, title, kind, body, duration, sort) VALUES
('saberes-da-jurema','Módulo 1 — Origens','Episódio 1: As raízes da Jurema','video',NULL,'45 min',1),
('saberes-da-jurema','Módulo 1 — Origens','Leitura: glossário juremeiro','texto','Material de apoio de exemplo. Edite este texto no painel administrativo.',NULL,2),
('roda-de-conversa','Temporada 1','Episódio 1: Fé e respeito','video',NULL,'90 min',1);
INSERT INTO public.site_settings (key, value) VALUES ('live_url', '');