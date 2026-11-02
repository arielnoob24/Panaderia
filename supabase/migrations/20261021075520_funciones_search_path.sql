DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS firma FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.firma);
  END LOOP;
END $$;;
