CREATE FUNCTION FN_ASIENTO_JSON(p_asiento CHAR)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
               'codigo',      a.ASI_Codigo,
               'fecha',       a.ASI_Fecha,
               'descripcion', a.ASI_Descripcion,
               'origen',      CASE a.ASI_Origen WHEN 'MAN' THEN 'Manual' WHEN 'COM' THEN 'Compras' WHEN 'INV' THEN 'Inventario'
                                                WHEN 'PRO' THEN 'Producción' WHEN 'VEN' THEN 'Ventas' ELSE 'Nómina' END,
               'estado',      CASE a.ASI_Estado WHEN 'ABI' THEN 'Abierto' WHEN 'PEN' THEN 'Pendiente' WHEN 'APR' THEN 'Aprobado'
                                                WHEN 'ANU' THEN 'Anulado' ELSE 'Con error' END,
               'debe',        v.ASI_Debe,
               'haber',       v.ASI_Haber,
               'cuadra',      v.ASI_Cuadra AND v.ASI_Debe > 0,
               'aprobo',      (SELECT e.EMP_PrimerNombre || ' ' || e.EMP_PrimerApellido FROM EMPLEADOS e WHERE e.EMP_Codigo = a.EMP_Codigo),
               'lineas',      (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                                     'cuenta', c.CUE_Numero, 'nombre', c.CUE_Nombre, 'debe', d.DAS_Debe, 'haber', d.DAS_Haber)
                                   ORDER BY c.CUE_Numero), '[]')
                                FROM DETALLES_ASIENTO d JOIN CUENTAS_CONTABLES c ON c.CUE_Codigo = d.CUE_Codigo
                               WHERE d.ASI_Codigo = a.ASI_Codigo))
      FROM ASIENTOS a
      JOIN VW_ASIENTOS v ON v.ASI_Codigo = a.ASI_Codigo
     WHERE a.ASI_Codigo = p_asiento;
$$;

CREATE FUNCTION FN_ADMIN_CONTABILIDAD(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'contabilidad.aprobar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'asientos', (SELECT COALESCE(jsonb_agg(FN_ASIENTO_JSON(x.ASI_Codigo) ORDER BY x.ASI_Fecha DESC, x.ASI_Codigo DESC), '[]')
                       FROM (SELECT ASI_Codigo, ASI_Fecha FROM ASIENTOS
                              ORDER BY ASI_Fecha DESC, ASI_Codigo DESC LIMIT 200) x),
        'porAprobar', (SELECT count(*)::INT FROM ASIENTOS WHERE ASI_Estado IN ('ABI', 'PEN', 'ERR')),
        'saldos',   (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                               'cuenta', CUE_Numero, 'nombre', CUE_Nombre, 'debe', CUE_Debe, 'haber', CUE_Haber, 'saldo', CUE_Saldo)
                             ORDER BY CUE_Numero), '[]')
                       FROM VW_SALDOS_CUENTAS WHERE CUE_Debe <> 0 OR CUE_Haber <> 0));
END;
$$;

CREATE FUNCTION FN_ADMIN_ASIENTO_ESTADO(p_auth UUID, p_asiento TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_emp    CHAR(10);
    v_actual CHAR(3);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'contabilidad.aprobar');
    SELECT ASI_Estado INTO v_actual FROM ASIENTOS WHERE ASI_Codigo = p_asiento FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese asiento no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_estado NOT IN ('Aprobado', 'Anulado') THEN
        RAISE EXCEPTION 'Un asiento se aprueba o se anula.' USING ERRCODE = '22023';
    END IF;
    IF v_actual NOT IN ('ABI', 'PEN', 'ERR') THEN
        RAISE EXCEPTION 'Ese asiento ya está %, y ya no cambia.', CASE v_actual WHEN 'APR' THEN 'aprobado' ELSE 'anulado' END USING ERRCODE = '22023';
    END IF;
    IF p_estado = 'Aprobado' THEN
        SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
        IF v_emp IS NULL THEN
            RAISE EXCEPTION 'Tu cuenta no está ligada a un empleado, y el contador que aprueba tiene que serlo.' USING ERRCODE = '22023';
        END IF;
        UPDATE ASIENTOS SET ASI_Estado = 'APR', EMP_Codigo = v_emp WHERE ASI_Codigo = p_asiento;
    ELSE
        UPDATE ASIENTOS SET ASI_Estado = 'ANU' WHERE ASI_Codigo = p_asiento;
    END IF;
    RETURN FN_ASIENTO_JSON(p_asiento);
END;
$$;

ALTER FUNCTION FN_ASIENTO_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_CONTABILIDAD(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION FN_ASIENTO_JSON(CHAR), FN_ADMIN_CONTABILIDAD(UUID), FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_ASIENTO_JSON(CHAR), FN_ADMIN_CONTABILIDAD(UUID), FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT) TO service_role;;
