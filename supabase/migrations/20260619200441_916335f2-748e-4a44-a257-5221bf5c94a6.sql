
CREATE TABLE public.site_config (
  id text PRIMARY KEY DEFAULT 'global',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_config TO anon, authenticated;
GRANT ALL ON public.site_config TO service_role;

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_config"
  ON public.site_config FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.site_config (id, config) VALUES ('global', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_config;
