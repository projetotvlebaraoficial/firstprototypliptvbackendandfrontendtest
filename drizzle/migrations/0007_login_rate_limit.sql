CREATE TABLE IF NOT EXISTS public.login_attempts (
  email text PRIMARY KEY,
  fails int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.login_lock_status(_email text)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(GREATEST(0, CEIL(EXTRACT(EPOCH FROM (locked_until - now()))))::int, 0)
  FROM public.login_attempts WHERE email = lower(trim(_email))
  UNION ALL SELECT 0 LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.login_register_fail(_email text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(trim(_email)); r public.login_attempts;
BEGIN
  IF e = '' OR length(e) > 255 THEN RETURN 0; END IF;
  INSERT INTO public.login_attempts (email, fails) VALUES (e, 0) ON CONFLICT (email) DO NOTHING;
  SELECT * INTO r FROM public.login_attempts WHERE email = e FOR UPDATE;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN
    RETURN CEIL(EXTRACT(EPOCH FROM (r.locked_until - now())))::int;
  END IF;
  IF r.fails + 1 >= 4 THEN
    UPDATE public.login_attempts SET fails = 0, locked_until = now() + interval '5 minutes', updated_at = now() WHERE email = e;
    RETURN 300;
  END IF;
  UPDATE public.login_attempts SET fails = r.fails + 1, locked_until = NULL, updated_at = now() WHERE email = e;
  RETURN 0;
END; $$;

CREATE OR REPLACE FUNCTION public.login_clear()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.login_attempts WHERE email = lower(auth.jwt()->>'email');
$$;

REVOKE ALL ON FUNCTION public.login_lock_status(text), public.login_register_fail(text), public.login_clear() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_lock_status(text), public.login_register_fail(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_clear() TO authenticated;