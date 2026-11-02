CREATE FUNCTION FN_ORDEN_JSON(p_orden CHAR(10))
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'codigo',          o.OCO_Codigo,
        'proveedorCodigo', o.PVD_Codigo,
        'proveedor',       t.PVD_RazonSocial,
        'fecha',           o.OCO_Fecha,
        'entrega',         o.OCO_FechaEntrega,
        'estado',          CASE o.OCO_Estado WHEN 'ABI' THEN 'Abierta' WHEN 'APR' THEN 'Aprobada' ELSE 'Anulada' END,
        'observacion',     o.OCO_Observacion,
        'subtotal',        t.OCO_Subtotal,
        'iva',             t.OCO_Iva,
        'total',           t.OCO_Total,
        'recepcion',       (SELECT jsonb_build_object('codigo', r.RCP_Codigo,
                                   'estado', CASE r.RCP_Estado WHEN 'PEN' THEN 'Pendiente' WHEN 'REC' THEN 'Recibida' ELSE 'Cancelada' END)
                              FROM RECEPCIONES r WHERE r.OCO_Codigo = o.OCO_Codigo
                             ORDER BY r.RCP_Fecha DESC LIMIT 1),
        'lineas',          COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                'codigo', d.MAT_Codigo, 'nombre', m.MAT_Nombre, 'unidad', rc.UMI_Compra,
                                'cantidad', d.DOC_Cantidad, 'precio', d.DOC_PrecioUnitario, 'iva', d.DOC_PorcentajeIva,
                                'recibido', rc.DOC_Recibido) ORDER BY m.MAT_Nombre)
                              FROM DETALLES_ORDEN_COMPRA d
                              JOIN MATERIALES m ON m.MAT_Codigo = d.MAT_Codigo
                              JOIN VW_ORDENES_COMPRA_RECIBIDO rc ON rc.OCO_Codigo = d.OCO_Codigo AND rc.MAT_Codigo = d.MAT_Codigo
                             WHERE d.OCO_Codigo = o.OCO_Codigo), '[]'))
      FROM ORDENES_COMPRA o
      JOIN VW_ORDENES_COMPRA_TOTALES t ON t.OCO_Codigo = o.OCO_Codigo
     WHERE o.OCO_Codigo = p_orden;
$$;

CREATE FUNCTION FN_ADMIN_ORDENES(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'compras.aprobar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN (SELECT COALESCE(jsonb_agg(FN_ORDEN_JSON(x.OCO_Codigo) ORDER BY x.OCO_Fecha DESC), '[]')
              FROM (SELECT OCO_Codigo, OCO_Fecha FROM ORDENES_COMPRA ORDER BY OCO_Fecha DESC LIMIT 100) x);
END;
$$;

CREATE FUNCTION FN_ADMIN_ORDEN_CREAR(p_auth UUID, p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu     CHAR(10);
    v_emp     CHAR(10);
    v_prov    TEXT := btrim(COALESCE(p_datos->>'proveedor', ''));
    v_obs     TEXT := NULLIF(btrim(COALESCE(p_datos->>'observacion', '')), '');
    v_entrega DATE;
    v_hoy     DATE := (now() AT TIME ZONE 'America/Guayaquil')::DATE;
    v_lineas  JSONB := p_datos->'lineas';
    v_l       JSONB;
    v_mat     TEXT;
    v_nombre  TEXT;
    v_vistos  TEXT[] := '{}';
    v_orden   CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
    IF v_emp IS NULL THEN
        RAISE EXCEPTION 'Tu cuenta no está ligada a un empleado, y una orden de compra lo necesita.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM PROVEEDORES WHERE PVD_Codigo = v_prov AND PVD_Activo) THEN
        RAISE EXCEPTION 'Elige un proveedor activo.' USING ERRCODE = '22023';
    END IF;
    BEGIN
        v_entrega := (p_datos->>'entrega')::DATE;
    EXCEPTION WHEN OTHERS THEN
        v_entrega := NULL;
    END;
    IF v_entrega IS NULL OR v_entrega < v_hoy OR v_entrega > v_hoy + 365 THEN
        RAISE EXCEPTION 'La fecha de entrega va de hoy a un año.' USING ERRCODE = '22023';
    END IF;
    IF v_obs IS NOT NULL AND length(v_obs) > 250 THEN
        RAISE EXCEPTION 'La observación llega a 250 letras.' USING ERRCODE = '22023';
    END IF;
    IF v_lineas IS NULL OR jsonb_typeof(v_lineas) <> 'array' OR jsonb_array_length(v_lineas) = 0 THEN
        RAISE EXCEPTION 'Agrega al menos un material a la orden.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO ORDENES_COMPRA (PVD_Codigo, EMP_Codigo, OCO_FechaEntrega, OCO_Observacion)
    VALUES (v_prov, v_emp, v_entrega, v_obs)
    RETURNING OCO_Codigo INTO v_orden;

    FOR v_l IN SELECT jsonb_array_elements(v_lineas) LOOP
        v_mat := btrim(COALESCE(v_l->>'material', ''));
        SELECT MAT_Nombre INTO v_nombre FROM MATERIALES WHERE MAT_Codigo = v_mat;
        IF v_nombre IS NULL OR NOT EXISTS (SELECT 1 FROM PROVEEDORES_MATERIALES WHERE PVD_Codigo = v_prov AND MAT_Codigo = v_mat) THEN
            RAISE EXCEPTION 'Ese proveedor no vende uno de los materiales.' USING ERRCODE = '22023';
        END IF;
        IF v_mat = ANY (v_vistos) THEN
            RAISE EXCEPTION '% está dos veces en la orden.', v_nombre USING ERRCODE = '22023';
        END IF;
        v_vistos := v_vistos || v_mat;
        IF COALESCE(v_l->>'cantidad', '') !~ '^[0-9]{1,6}([.][0-9]{1,2})?$' OR (v_l->>'cantidad')::NUMERIC <= 0 THEN
            RAISE EXCEPTION 'La cantidad de % tiene que ser mayor que 0 (hasta 2 decimales).', v_nombre USING ERRCODE = '22023';
        END IF;
        INSERT INTO DETALLES_ORDEN_COMPRA (OCO_Codigo, MAT_Codigo, DOC_Cantidad)
        VALUES (v_orden, v_mat, (v_l->>'cantidad')::NUMERIC);
    END LOOP;
    RETURN FN_ORDEN_JSON(v_orden);
END;
$$;

CREATE FUNCTION FN_ADMIN_ORDEN_ESTADO(p_auth UUID, p_orden TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_actual CHAR(3);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    SELECT OCO_Estado INTO v_actual FROM ORDENES_COMPRA WHERE OCO_Codigo = p_orden FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa orden no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_estado NOT IN ('Aprobada', 'Anulada') THEN
        RAISE EXCEPTION 'Una orden se aprueba o se anula.' USING ERRCODE = '22023';
    END IF;
    IF v_actual <> 'ABI' THEN
        RAISE EXCEPTION 'Esa orden ya está %, y ya no cambia.', CASE v_actual WHEN 'APR' THEN 'aprobada' ELSE 'anulada' END USING ERRCODE = '22023';
    END IF;
    IF p_estado = 'Aprobada' AND NOT EXISTS (SELECT 1 FROM DETALLES_ORDEN_COMPRA WHERE OCO_Codigo = p_orden) THEN
        RAISE EXCEPTION 'La orden no tiene materiales.' USING ERRCODE = '22023';
    END IF;
    UPDATE ORDENES_COMPRA SET OCO_Estado = CASE p_estado WHEN 'Aprobada' THEN 'APR' ELSE 'ANU' END WHERE OCO_Codigo = p_orden;
    RETURN FN_ORDEN_JSON(p_orden);
END;
$$;

CREATE FUNCTION FN_ADMIN_RECEPCIONES(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'bodega.recibir') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'pendientes', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'codigo', r.RCP_Codigo, 'orden', r.OCO_Codigo, 'proveedor', pv.PVD_RazonSocial, 'entrega', o.OCO_FechaEntrega,
                'lineas', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'codigo', d.MAT_Codigo, 'nombre', rc.MAT_Nombre, 'unidad', rc.UMI_Compra,
                        'pedido', rc.DOC_Pedido, 'falta', rc.DOC_Diferencia,
                        'perecible', m.MAT_Perecible, 'diasVida', m.MAT_DiasVidaUtil) ORDER BY rc.MAT_Nombre), '[]')
                      FROM DETALLES_ORDEN_COMPRA d
                      JOIN VW_ORDENES_COMPRA_RECIBIDO rc ON rc.OCO_Codigo = d.OCO_Codigo AND rc.MAT_Codigo = d.MAT_Codigo
                      JOIN MATERIALES m ON m.MAT_Codigo = d.MAT_Codigo
                     WHERE d.OCO_Codigo = r.OCO_Codigo AND rc.DOC_Diferencia > 0)
            ) ORDER BY o.OCO_FechaEntrega, r.RCP_Codigo), '[]')
              FROM RECEPCIONES r
              JOIN ORDENES_COMPRA o ON o.OCO_Codigo = r.OCO_Codigo
              JOIN PROVEEDORES pv   ON pv.PVD_Codigo = o.PVD_Codigo
             WHERE r.RCP_Estado = 'PEN'),
        'recibidas', (SELECT COALESCE(jsonb_agg(x.j ORDER BY x.f DESC), '[]')
              FROM (SELECT r.RCP_Fecha AS f, jsonb_build_object(
                        'codigo', r.RCP_Codigo, 'orden', r.OCO_Codigo, 'proveedor', pv.PVD_RazonSocial,
                        'fecha', r.RCP_Fecha, 'observacion', r.RCP_Observacion,
                        'lotes', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                                'lote', l.LMA_Codigo, 'nombre', m.MAT_Nombre, 'unidad', u.UMI_Abreviatura,
                                'cantidad', l.LMA_CantidadRecibida, 'caduca', l.LMA_FechaCaducidad) ORDER BY m.MAT_Nombre), '[]')
                              FROM LOTES_MATERIAL l
                              JOIN MATERIALES m ON m.MAT_Codigo = l.MAT_Codigo
                              JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoCompra
                             WHERE l.RCP_Codigo = r.RCP_Codigo)) AS j
                      FROM RECEPCIONES r
                      JOIN ORDENES_COMPRA o ON o.OCO_Codigo = r.OCO_Codigo
                      JOIN PROVEEDORES pv   ON pv.PVD_Codigo = o.PVD_Codigo
                     WHERE r.RCP_Estado = 'REC' ORDER BY r.RCP_Fecha DESC LIMIT 20) x));
END;
$$;

CREATE FUNCTION FN_ADMIN_RECEPCION_CONFIRMAR(p_auth UUID, p_recepcion TEXT, p_lineas JSONB, p_observacion TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_emp    CHAR(10);
    v_orden  CHAR(10);
    v_estado CHAR(3);
    v_obs    TEXT := NULLIF(btrim(COALESCE(p_observacion, '')), '');
    v_hoy    DATE := (now() AT TIME ZONE 'America/Guayaquil')::DATE;
    v_l      JSONB;
    v_mat    TEXT;
    v_nombre TEXT;
    v_falta  NUMERIC;
    v_cant   NUMERIC;
    v_cad    DATE;
    v_per    BOOLEAN;
    v_dias   SMALLINT;
    v_vistos TEXT[] := '{}';
    v_hay    INTEGER := 0;
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'bodega.recibir');
    SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
    IF v_emp IS NULL THEN
        RAISE EXCEPTION 'Tu cuenta no está ligada a un empleado, y recibir una compra lo necesita.' USING ERRCODE = '22023';
    END IF;
    SELECT OCO_Codigo, RCP_Estado INTO v_orden, v_estado FROM RECEPCIONES WHERE RCP_Codigo = p_recepcion FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa recepción no existe.' USING ERRCODE = '22023';
    END IF;
    IF v_estado <> 'PEN' THEN
        RAISE EXCEPTION 'Esa recepción ya no está pendiente.' USING ERRCODE = '22023';
    END IF;
    IF v_obs IS NOT NULL AND length(v_obs) > 250 THEN
        RAISE EXCEPTION 'El motivo llega a 250 letras.' USING ERRCODE = '22023';
    END IF;
    IF p_lineas IS NULL OR jsonb_typeof(p_lineas) <> 'array' THEN
        RAISE EXCEPTION 'Faltan las cantidades recibidas.' USING ERRCODE = '22023';
    END IF;

    FOR v_l IN SELECT jsonb_array_elements(p_lineas) LOOP
        v_mat := btrim(COALESCE(v_l->>'material', ''));
        SELECT rc.MAT_Nombre, rc.DOC_Diferencia, m.MAT_Perecible, m.MAT_DiasVidaUtil
          INTO v_nombre, v_falta, v_per, v_dias
          FROM VW_ORDENES_COMPRA_RECIBIDO rc JOIN MATERIALES m ON m.MAT_Codigo = rc.MAT_Codigo
         WHERE rc.OCO_Codigo = v_orden AND rc.MAT_Codigo = v_mat;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'La orden no pidió uno de los materiales.' USING ERRCODE = '22023';
        END IF;
        IF v_mat = ANY (v_vistos) THEN
            RAISE EXCEPTION '% está dos veces.', v_nombre USING ERRCODE = '22023';
        END IF;
        v_vistos := v_vistos || v_mat;
        IF COALESCE(v_l->>'cantidad', '0') !~ '^[0-9]{1,6}([.][0-9]{1,2})?$' THEN
            RAISE EXCEPTION 'La cantidad de % no es válida (hasta 2 decimales).', v_nombre USING ERRCODE = '22023';
        END IF;
        v_cant := (v_l->>'cantidad')::NUMERIC;
        CONTINUE WHEN v_cant = 0;
        IF v_cant > v_falta THEN
            RAISE EXCEPTION 'De % no puede llegar más de lo que falta (%).', v_nombre, v_falta USING ERRCODE = '22023';
        END IF;
        BEGIN
            v_cad := NULLIF(btrim(COALESCE(v_l->>'caducidad', '')), '')::DATE;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'La fecha de caducidad de % no es válida.', v_nombre USING ERRCODE = '22023';
        END;
        IF v_cad IS NOT NULL AND v_cad < v_hoy THEN
            RAISE EXCEPTION 'La caducidad de % ya pasó.', v_nombre USING ERRCODE = '22023';
        END IF;
        IF v_per AND v_cad IS NULL AND v_dias IS NULL THEN
            RAISE EXCEPTION '% es perecible: pon su fecha de caducidad.', v_nombre USING ERRCODE = '22023';
        END IF;
        INSERT INTO LOTES_MATERIAL (MAT_Codigo, RCP_Codigo, OCO_Codigo, LMA_FechaCaducidad, LMA_CantidadRecibida)
        VALUES (v_mat, p_recepcion, v_orden, v_cad, v_cant);
        v_hay := v_hay + 1;
    END LOOP;

    IF v_hay = 0 THEN
        RAISE EXCEPTION 'Pon cuánto llegó de al menos un material.' USING ERRCODE = '22023';
    END IF;
    IF v_obs IS NULL AND EXISTS (
        SELECT 1 FROM DETALLES_ORDEN_COMPRA d
         WHERE d.OCO_Codigo = v_orden
           AND d.DOC_Cantidad > COALESCE((SELECT SUM(l.LMA_CantidadRecibida) FROM LOTES_MATERIAL l
                                           WHERE l.OCO_Codigo = d.OCO_Codigo AND l.MAT_Codigo = d.MAT_Codigo), 0)) THEN
        RAISE EXCEPTION 'Llegó menos de lo pedido: escribe el motivo.' USING ERRCODE = '22023';
    END IF;
    UPDATE RECEPCIONES SET EMP_Codigo = v_emp, RCP_Estado = 'REC', RCP_Fecha = now(), RCP_Observacion = v_obs
     WHERE RCP_Codigo = p_recepcion;
    RETURN jsonb_build_object('codigo', p_recepcion, 'orden', v_orden, 'lotes', v_hay);
END;
$$;

ALTER FUNCTION FN_ORDEN_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_ORDENES(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_ORDEN_CREAR(UUID, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_RECEPCIONES(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT) SET search_path = public;

REVOKE ALL ON FUNCTION FN_ORDEN_JSON(CHAR), FN_ADMIN_ORDENES(UUID), FN_ADMIN_ORDEN_CREAR(UUID, JSONB), FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT),
    FN_ADMIN_RECEPCIONES(UUID), FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_ORDEN_JSON(CHAR), FN_ADMIN_ORDENES(UUID), FN_ADMIN_ORDEN_CREAR(UUID, JSONB), FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT),
    FN_ADMIN_RECEPCIONES(UUID), FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT) TO service_role;;
