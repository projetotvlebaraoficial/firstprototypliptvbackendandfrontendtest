DROP POLICY IF EXISTS "members read comments" ON public.comments;
CREATE POLICY "subscribers read comments" ON public.comments FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.user_id = auth.uid() AND s.status = 'ativa' AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
);
DROP POLICY IF EXISTS "public read settings" ON public.site_settings;
CREATE POLICY "public read live settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (key IN ('live_url','live_title','live_on') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "public read media" ON storage.objects;
CREATE POLICY "staff read media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));