CREATE OR REPLACE FUNCTION FN_AUDITORIAS_REGISTRAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_antes   JSONB;
    v_despues JSONB;
    v_clave   TEXT;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        v_antes := to_jsonb(OLD);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        v_despues := to_jsonb(NEW);
    END IF;
    IF TG_OP = 'UPDATE' AND to_jsonb(OLD) = to_jsonb(NEW) THEN
        RETURN NULL;
    END IF;
    SELECT string_agg(COALESCE(v_despues, v_antes) ->> c.columna, '|' ORDER BY c.n)
      INTO v_clave
      FROM unnest(TG_ARGV) WITH ORDINALITY AS c (columna, n);
    INSERT INTO AUDITORIAS (USU_Codigo, AUD_Tabla, AUD_Operacion, AUD_Clave, AUD_Antes, AUD_Despues)
    VALUES (NULLIF(current_setting('app.usuario', TRUE), ''), upper(TG_TABLE_NAME),
            left(TG_OP, 1), v_clave, v_antes, v_despues);
    RETURN NULL;
END;
$$;
ALTER FUNCTION FN_AUDITORIAS_REGISTRAR() SET search_path = public;;
