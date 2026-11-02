CREATE FUNCTION FN_NOMINA_JSON(p_nomina CHAR)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
               'codigo',     n.NOM_Codigo,
               'empleado',   n.EMP_Codigo,
               'nombre',     e.EMP_PrimerNombre || ' ' || e.EMP_PrimerApellido,
               'anio',       n.NOM_Anio,
               'mes',        n.NOM_Mes,
               'estado',     CASE n.NOM_Estado WHEN 'ABI' THEN 'Abierto' WHEN 'APR' THEN 'Aprobado' ELSE 'Anulado' END,
               'fechaPago',  n.NOM_FechaPago,
               'ingresos',   v.NOM_Ingresos,
               'descuentos', v.NOM_Descuentos,
               'neto',       v.NOM_Neto,
               'lineas',     (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                                     'numero', c.CNO_Numero, 'nombre', c.CNO_Nombre, 'tipo', c.CNO_Tipo,
                                     'cantidad', d.DNO_Cantidad, 'valor', d.DNO_Valor,
                                     'fija', c.CNO_Numero IN ('1000', '2000'))
                                   ORDER BY c.CNO_Tipo, c.CNO_Numero), '[]')
                                FROM DETALLES_NOMINA d JOIN CONCEPTOS_NOMINA c ON c.CNO_Codigo = d.CNO_Codigo
                               WHERE d.NOM_Codigo = n.NOM_Codigo))
      FROM NOMINAS n
      JOIN EMPLEADOS e ON e.EMP_Codigo = n.EMP_Codigo
      JOIN VW_NOMINAS v ON v.NOM_Codigo = n.NOM_Codigo
     WHERE n.NOM_Codigo = p_nomina;
$$;

CREATE FUNCTION FN_ADMIN_NOMINAS(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'nomina.aprobar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'nominas',   (SELECT COALESCE(jsonb_agg(FN_NOMINA_JSON(x.NOM_Codigo) ORDER BY x.NOM_Anio DESC, x.NOM_Mes DESC, x.NOM_Codigo DESC), '[]')
                        FROM (SELECT NOM_Codigo, NOM_Anio, NOM_Mes FROM NOMINAS
                               ORDER BY NOM_Anio DESC, NOM_Mes DESC, NOM_Codigo DESC LIMIT 60) x),
        'empleados', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                               'codigo', EMP_Codigo, 'nombre', EMP_PrimerNombre || ' ' || EMP_PrimerApellido, 'sueldo', EMP_Sueldo)
                             ORDER BY EMP_PrimerApellido, EMP_PrimerNombre), '[]')
                        FROM EMPLEADOS WHERE EMP_Activo),
        'conceptos', (SELECT COALESCE(jsonb_agg(jsonb_build_object('numero', CNO_Numero, 'nombre', CNO_Nombre, 'tipo', CNO_Tipo)
                             ORDER BY CNO_Tipo, CNO_Numero), '[]')
                        FROM CONCEPTOS_NOMINA WHERE CNO_Numero NOT IN ('1000', '2000')));
END;
$$;

CREATE FUNCTION FN_ADMIN_NOMINA_CREAR(p_auth UUID, p_empleado TEXT, p_anio INTEGER, p_mes INTEGER)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_activo BOOLEAN;
    v_nomina CHAR(10);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT EMP_Activo INTO v_activo FROM EMPLEADOS WHERE EMP_Codigo = p_empleado;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese empleado no existe.' USING ERRCODE = '22023';
    ELSIF NOT v_activo THEN
        RAISE EXCEPTION 'Ese empleado ya no está activo.' USING ERRCODE = '22023';
    END IF;
    IF p_anio IS NULL OR p_mes IS NULL OR p_mes NOT BETWEEN 1 AND 12 OR p_anio < 2000 THEN
        RAISE EXCEPTION 'Elige un mes y un año válidos.' USING ERRCODE = '22023';
    END IF;
    IF make_date(p_anio, p_mes, 1) > date_trunc('month', CURRENT_DATE)::DATE THEN
        RAISE EXCEPTION 'Ese mes todavía no llega.' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM NOMINAS WHERE EMP_Codigo = p_empleado AND NOM_Anio = p_anio AND NOM_Mes = p_mes AND NOM_Estado <> 'ANU') THEN
        RAISE EXCEPTION 'Ese empleado ya tiene su rol de ese mes.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO NOMINAS (EMP_Codigo, NOM_Anio, NOM_Mes) VALUES (p_empleado, p_anio, p_mes)
    RETURNING NOM_Codigo INTO v_nomina;
    RETURN FN_NOMINA_JSON(v_nomina);
END;
$$;

CREATE FUNCTION FN_ADMIN_NOMINA_LINEA(p_auth UUID, p_nomina TEXT, p_concepto TEXT, p_cantidad NUMERIC, p_valor NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_estado   CHAR(3);
    v_concepto CHAR(6);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_estado FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    ELSIF v_estado <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya no está abierto y no se cambia.' USING ERRCODE = '22023';
    END IF;
    SELECT CNO_Codigo INTO v_concepto FROM CONCEPTOS_NOMINA WHERE CNO_Numero = p_concepto AND CNO_Numero NOT IN ('1000', '2000');
    IF v_concepto IS NULL THEN
        RAISE EXCEPTION 'Ese concepto no se agrega a mano.' USING ERRCODE = '22023';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad <= 0 OR p_cantidad > 9999 THEN
        RAISE EXCEPTION 'La cantidad tiene que ser mayor que 0.' USING ERRCODE = '22023';
    END IF;
    IF p_valor IS NULL OR p_valor <= 0 OR p_valor > 99999999 THEN
        RAISE EXCEPTION 'El valor tiene que ser mayor que 0.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO DETALLES_NOMINA (NOM_Codigo, CNO_Codigo, DNO_Cantidad, DNO_Valor)
    VALUES (p_nomina, v_concepto, p_cantidad, ROUND(p_valor, 2))
    ON CONFLICT (NOM_Codigo, CNO_Codigo) DO UPDATE SET DNO_Cantidad = EXCLUDED.DNO_Cantidad, DNO_Valor = EXCLUDED.DNO_Valor;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

CREATE FUNCTION FN_ADMIN_NOMINA_QUITAR_LINEA(p_auth UUID, p_nomina TEXT, p_concepto TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_estado CHAR(3);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_estado FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    ELSIF v_estado <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya no está abierto y no se cambia.' USING ERRCODE = '22023';
    END IF;
    IF p_concepto IN ('1000', '2000') THEN
        RAISE EXCEPTION 'El sueldo y el aporte al IESS no se quitan.' USING ERRCODE = '22023';
    END IF;
    DELETE FROM DETALLES_NOMINA
     WHERE NOM_Codigo = p_nomina AND CNO_Codigo = (SELECT CNO_Codigo FROM CONCEPTOS_NOMINA WHERE CNO_Numero = p_concepto);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no tiene esa línea.' USING ERRCODE = '22023';
    END IF;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

CREATE FUNCTION FN_ADMIN_NOMINA_ESTADO(p_auth UUID, p_nomina TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_actual CHAR(3);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_actual FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_estado NOT IN ('Aprobado', 'Anulado') THEN
        RAISE EXCEPTION 'Un rol se aprueba o se anula.' USING ERRCODE = '22023';
    END IF;
    IF v_actual <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya está %, y ya no cambia.', CASE v_actual WHEN 'APR' THEN 'aprobado' ELSE 'anulado' END USING ERRCODE = '22023';
    END IF;
    BEGIN
        IF p_estado = 'Aprobado' THEN
            UPDATE NOMINAS SET NOM_Estado = 'APR', NOM_FechaPago = CURRENT_DATE WHERE NOM_Codigo = p_nomina;
        ELSE
            UPDATE NOMINAS SET NOM_Estado = 'ANU' WHERE NOM_Codigo = p_nomina;
        END IF;
    EXCEPTION WHEN raise_exception THEN
        RAISE EXCEPTION '%', SQLERRM USING ERRCODE = '22023';
    END;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

ALTER FUNCTION FN_NOMINA_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_NOMINAS(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC) SET search_path = public;
ALTER FUNCTION FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION FN_NOMINA_JSON(CHAR), FN_ADMIN_NOMINAS(UUID), FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER),
    FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC), FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT), FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_NOMINA_JSON(CHAR), FN_ADMIN_NOMINAS(UUID), FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER),
    FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC), FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT), FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT) TO service_role;;
