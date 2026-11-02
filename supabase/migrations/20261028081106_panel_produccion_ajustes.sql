INSERT INTO PERMISOS (PER_Nombre, PER_Descripcion) VALUES
    ('inventario.reportar', 'Reportar un faltante o sobrante de inventario (lo aprueba otra persona)');
INSERT INTO ROLES_PERMISOS (ROL_Codigo, PER_Codigo)
SELECT r.ROL_Codigo, p.PER_Codigo
  FROM ROLES r, PERMISOS p
 WHERE r.ROL_Nombre IN ('Administrador', 'Empleado') AND p.PER_Nombre = 'inventario.reportar';

CREATE FUNCTION FN_ADMIN_PRODUCCION(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_costos BOOLEAN;
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'produccion.registrar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    v_costos := FN_TIENE_PERMISO(p_auth, 'reportes.ver');
    RETURN jsonb_build_object(
        'costos', v_costos,
        'ordenes', (SELECT COALESCE(jsonb_agg(x.j ORDER BY x.f DESC), '[]')
              FROM (SELECT o.ORP_Fecha AS f, jsonb_build_object(
                        'codigo',   o.ORP_Codigo,
                        'fecha',    o.ORP_Fecha,
                        'producto', p.PRO_Nombre,
                        'tamano',   t.TAM_Descripcion,
                        'cantidad', o.ORP_Cantidad,
                        'estado',   CASE o.ORP_Estado WHEN 'ABI' THEN 'Abierta' WHEN 'APR' THEN 'Producida' ELSE 'Anulada' END,
                        'hizo',     e.EMP_PrimerNombre || ' ' || e.EMP_PrimerApellido,
                        'costoTotal',    CASE WHEN v_costos THEN c.ORP_CostoTotal END,
                        'costoUnitario', CASE WHEN v_costos THEN c.ORP_CostoUnitario END) AS j
                      FROM ORDENES_PRODUCCION o
                      JOIN PRODUCTOS p  ON p.PRO_Codigo = o.PRO_Codigo
                      JOIN TAMANOS t    ON t.TAM_Codigo = o.TAM_Codigo
                      JOIN EMPLEADOS e  ON e.EMP_Codigo = o.EMP_Codigo
                      LEFT JOIN VW_COSTO_PRODUCCION c ON c.ORP_Codigo = o.ORP_Codigo
                     ORDER BY o.ORP_Fecha DESC LIMIT 50) x),
        'productos', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'producto', x.PRO_Codigo, 'tamano', x.TAM_Codigo,
                        'nombre', x.PRO_Nombre || CASE WHEN x.TAM_Descripcion = 'Único' THEN '' ELSE ' ' || x.TAM_Descripcion END)
                        ORDER BY x.PRO_Nombre, x.TAM_Codigo), '[]')
              FROM (SELECT DISTINCT r.PRO_Codigo, r.TAM_Codigo, p.PRO_Nombre, t.TAM_Descripcion
                      FROM RECETAS r
                      JOIN PRODUCTOS p ON p.PRO_Codigo = r.PRO_Codigo
                      JOIN TAMANOS t   ON t.TAM_Codigo = r.TAM_Codigo) x));
END;
$$;

CREATE FUNCTION FN_ADMIN_PRODUCCION_REGISTRAR(p_auth UUID, p_producto TEXT, p_tamano TEXT, p_cantidad INTEGER)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu   CHAR(10);
    v_emp   CHAR(10);
    v_orden CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'produccion.registrar');
    SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
    IF v_emp IS NULL THEN
        RAISE EXCEPTION 'Tu cuenta no está ligada a un empleado, y registrar una tanda lo necesita.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM RECETAS WHERE PRO_Codigo = p_producto AND TAM_Codigo = p_tamano) THEN
        RAISE EXCEPTION 'Ese producto no tiene receta.' USING ERRCODE = '22023';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad < 1 OR p_cantidad > 9999 THEN
        RAISE EXCEPTION 'La cantidad va de 1 a 9999.' USING ERRCODE = '22023';
    END IF;
    BEGIN
        INSERT INTO ORDENES_PRODUCCION (PRO_Codigo, TAM_Codigo, EMP_Codigo, ORP_Cantidad)
        VALUES (p_producto, p_tamano, v_emp, p_cantidad)
        RETURNING ORP_Codigo INTO v_orden;
        UPDATE ORDENES_PRODUCCION SET ORP_Estado = 'APR' WHERE ORP_Codigo = v_orden;
    EXCEPTION WHEN raise_exception THEN
        RAISE EXCEPTION '%', SQLERRM USING ERRCODE = '22023';
    END;
    RETURN jsonb_build_object('codigo', v_orden);
END;
$$;

CREATE FUNCTION FN_AJUSTE_JSON(p_ajuste CHAR(10), p_costos BOOLEAN)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'codigo',  a.AJU_Codigo,
        'fecha',   a.AJU_Fecha,
        'motivo',  a.AJU_Motivo,
        'estado',  CASE a.AJU_Estado WHEN 'ABI' THEN 'Abierto' WHEN 'APR' THEN 'Aprobado' ELSE 'Anulado' END,
        'hizo',    e.EMP_PrimerNombre || ' ' || e.EMP_PrimerApellido,
        'autorizo', CASE WHEN z.EMP_Codigo IS NULL THEN NULL ELSE z.EMP_PrimerNombre || ' ' || z.EMP_PrimerApellido END,
        'lineas',  COALESCE((SELECT jsonb_agg(jsonb_build_object(
                        'lote', d.LMA_Codigo, 'material', m.MAT_Nombre, 'unidad', u.UMI_Abreviatura,
                        'cantidad', d.DAJ_Cantidad,
                        'valor', CASE WHEN p_costos THEN ROUND(d.DAJ_Cantidad * l.LMA_CostoUnitario, 2) END) ORDER BY m.MAT_Nombre)
                      FROM DETALLES_AJUSTE d
                      JOIN LOTES_MATERIAL l  ON l.LMA_Codigo = d.LMA_Codigo
                      JOIN MATERIALES m      ON m.MAT_Codigo = l.MAT_Codigo
                      JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoProduccion
                     WHERE d.AJU_Codigo = a.AJU_Codigo), '[]'))
      FROM AJUSTES_INVENTARIO a
      JOIN EMPLEADOS e ON e.EMP_Codigo = a.EMP_Codigo
      LEFT JOIN EMPLEADOS z ON z.EMP_Codigo = a.EMP_CodigoAutoriza
     WHERE a.AJU_Codigo = p_ajuste;
$$;

CREATE FUNCTION FN_ADMIN_AJUSTES(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_costos BOOLEAN;
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'inventario.reportar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    v_costos := FN_TIENE_PERMISO(p_auth, 'reportes.ver');
    RETURN jsonb_build_object(
        'costos', v_costos,
        'ajustes', (SELECT COALESCE(jsonb_agg(FN_AJUSTE_JSON(x.AJU_Codigo, v_costos) ORDER BY x.AJU_Fecha DESC), '[]')
                      FROM (SELECT AJU_Codigo, AJU_Fecha FROM AJUSTES_INVENTARIO ORDER BY AJU_Fecha DESC LIMIT 100) x),
        'lotes', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'codigo', s.LMA_Codigo, 'material', m.MAT_Nombre, 'unidad', u.UMI_Abreviatura,
                        'saldo', s.LMA_Saldo, 'caduca', s.LMA_FechaCaducidad) ORDER BY m.MAT_Nombre, s.LMA_FechaIngreso), '[]')
                    FROM VW_LOTES_SALDO s
                    JOIN MATERIALES m      ON m.MAT_Codigo = s.MAT_Codigo
                    JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoProduccion
                   WHERE s.LMA_Recibido AND s.LMA_Saldo > 0));
END;
$$;

CREATE FUNCTION FN_ADMIN_AJUSTE_CREAR(p_auth UUID, p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_emp    CHAR(10);
    v_motivo TEXT := btrim(COALESCE(p_datos->>'motivo', ''));
    v_lineas JSONB := p_datos->'lineas';
    v_l      JSONB;
    v_lote   TEXT;
    v_cant   NUMERIC;
    v_saldo  NUMERIC;
    v_nombre TEXT;
    v_vistos TEXT[] := '{}';
    v_ajuste CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'inventario.reportar');
    SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
    IF v_emp IS NULL THEN
        RAISE EXCEPTION 'Tu cuenta no está ligada a un empleado, y un ajuste lo necesita.' USING ERRCODE = '22023';
    END IF;
    IF v_motivo = '' OR length(v_motivo) > 150 THEN
        RAISE EXCEPTION 'Escribe el motivo (hasta 150 letras).' USING ERRCODE = '22023';
    END IF;
    IF v_lineas IS NULL OR jsonb_typeof(v_lineas) <> 'array' OR jsonb_array_length(v_lineas) = 0 THEN
        RAISE EXCEPTION 'Agrega al menos un lote al ajuste.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO AJUSTES_INVENTARIO (EMP_Codigo, AJU_Motivo) VALUES (v_emp, v_motivo) RETURNING AJU_Codigo INTO v_ajuste;

    FOR v_l IN SELECT jsonb_array_elements(v_lineas) LOOP
        v_lote := btrim(COALESCE(v_l->>'lote', ''));
        SELECT s.LMA_Saldo, m.MAT_Nombre INTO v_saldo, v_nombre
          FROM VW_LOTES_SALDO s JOIN MATERIALES m ON m.MAT_Codigo = s.MAT_Codigo
         WHERE s.LMA_Codigo = v_lote AND s.LMA_Recibido;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Uno de los lotes no existe.' USING ERRCODE = '22023';
        END IF;
        IF v_lote = ANY (v_vistos) THEN
            RAISE EXCEPTION 'El lote de % está dos veces.', v_nombre USING ERRCODE = '22023';
        END IF;
        v_vistos := v_vistos || v_lote;
        IF COALESCE(v_l->>'cantidad', '') !~ '^-?[0-9]{1,8}([.][0-9]{1,3})?$' OR (v_l->>'cantidad')::NUMERIC = 0 THEN
            RAISE EXCEPTION 'La cantidad de % tiene que ser distinta de 0 (hasta 3 decimales).', v_nombre USING ERRCODE = '22023';
        END IF;
        v_cant := (v_l->>'cantidad')::NUMERIC;
        IF v_saldo + v_cant < 0 THEN
            RAISE EXCEPTION 'Del lote de % solo quedan % y quieres sacar %.', v_nombre, v_saldo, -v_cant USING ERRCODE = '22023';
        END IF;
        INSERT INTO DETALLES_AJUSTE (AJU_Codigo, LMA_Codigo, DAJ_Cantidad) VALUES (v_ajuste, v_lote, v_cant);
    END LOOP;
    RETURN FN_AJUSTE_JSON(v_ajuste, FN_TIENE_PERMISO(p_auth, 'reportes.ver'));
END;
$$;

CREATE FUNCTION FN_ADMIN_AJUSTE_ESTADO(p_auth UUID, p_ajuste TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_emp    CHAR(10);
    v_actual CHAR(3);
    v_hizo   CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'inventario.reportar');
    SELECT EMP_Codigo INTO v_emp FROM USUARIOS WHERE USU_Codigo = v_usu;
    SELECT AJU_Estado, EMP_Codigo INTO v_actual, v_hizo FROM AJUSTES_INVENTARIO WHERE AJU_Codigo = p_ajuste FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese ajuste no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_estado NOT IN ('Aprobado', 'Anulado') THEN
        RAISE EXCEPTION 'Un ajuste se aprueba o se anula.' USING ERRCODE = '22023';
    END IF;
    IF v_actual <> 'ABI' THEN
        RAISE EXCEPTION 'Ese ajuste ya está %, y ya no cambia.', CASE v_actual WHEN 'APR' THEN 'aprobado' ELSE 'anulado' END USING ERRCODE = '22023';
    END IF;
    IF p_estado = 'Aprobado' THEN
        IF NOT FN_TIENE_PERMISO(p_auth, 'inventario.ajustar') THEN
            RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
        END IF;
        IF v_emp IS NULL OR v_emp = v_hizo THEN
            RAISE EXCEPTION 'Otra persona tiene que aprobar este ajuste: no se aprueba el propio.' USING ERRCODE = '22023';
        END IF;
        BEGIN
            UPDATE AJUSTES_INVENTARIO SET AJU_Estado = 'APR', EMP_CodigoAutoriza = v_emp WHERE AJU_Codigo = p_ajuste;
        EXCEPTION WHEN raise_exception THEN
            RAISE EXCEPTION '%', SQLERRM USING ERRCODE = '22023';
        END;
    ELSE
        IF v_emp IS DISTINCT FROM v_hizo AND NOT FN_TIENE_PERMISO(p_auth, 'inventario.ajustar') THEN
            RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
        END IF;
        UPDATE AJUSTES_INVENTARIO SET AJU_Estado = 'ANU' WHERE AJU_Codigo = p_ajuste;
    END IF;
    RETURN FN_AJUSTE_JSON(p_ajuste, FN_TIENE_PERMISO(p_auth, 'reportes.ver'));
END;
$$;

ALTER FUNCTION FN_ADMIN_PRODUCCION(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER) SET search_path = public;
ALTER FUNCTION FN_AJUSTE_JSON(CHAR, BOOLEAN) SET search_path = public;
ALTER FUNCTION FN_ADMIN_AJUSTES(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_AJUSTE_CREAR(UUID, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT) SET search_path = public;

REVOKE ALL ON FUNCTION FN_ADMIN_PRODUCCION(UUID), FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER),
    FN_AJUSTE_JSON(CHAR, BOOLEAN), FN_ADMIN_AJUSTES(UUID), FN_ADMIN_AJUSTE_CREAR(UUID, JSONB), FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_ADMIN_PRODUCCION(UUID), FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER),
    FN_AJUSTE_JSON(CHAR, BOOLEAN), FN_ADMIN_AJUSTES(UUID), FN_ADMIN_AJUSTE_CREAR(UUID, JSONB), FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT)
    TO service_role;;
