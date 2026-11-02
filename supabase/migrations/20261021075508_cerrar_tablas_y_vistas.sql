DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v') LOOP
    IF r.relkind = 'r' THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    ELSE
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', r.relname);
    END IF;
  END LOOP;
END $$;;
