CREATE FUNCTION FN_TIENE_PERMISO(p_auth UUID, p_permiso TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1
          FROM USUARIOS u
          JOIN ROLES_PERMISOS rp ON rp.ROL_Codigo = u.ROL_Codigo
          JOIN PERMISOS p        ON p.PER_Codigo = rp.PER_Codigo
         WHERE u.USU_CodigoAuth = p_auth AND u.USU_Activo AND p.PER_Nombre = p_permiso);
$$;

CREATE FUNCTION FN_EXIGIR_PERMISO(p_auth UUID, p_permiso TEXT)
RETURNS CHAR(10)
LANGUAGE plpgsql AS $$
DECLARE
    v_usuario CHAR(10);
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, p_permiso) THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    SELECT USU_Codigo INTO v_usuario FROM USUARIOS WHERE USU_CodigoAuth = p_auth;
    PERFORM set_config('app.usuario', v_usuario, TRUE);
    RETURN v_usuario;
END;
$$;

CREATE FUNCTION FN_ADMIN_YO(p_auth UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'rol',      r.ROL_Nombre,
        'permisos', COALESCE((SELECT jsonb_agg(p.PER_Nombre ORDER BY p.PER_Nombre)
                                FROM ROLES_PERMISOS rp JOIN PERMISOS p ON p.PER_Codigo = rp.PER_Codigo
                               WHERE rp.ROL_Codigo = u.ROL_Codigo), '[]'))
      FROM USUARIOS u JOIN ROLES r ON r.ROL_Codigo = u.ROL_Codigo
     WHERE u.USU_CodigoAuth = p_auth AND u.USU_Activo;
$$;

CREATE FUNCTION FN_ADMIN_PEDIDOS(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'pedidos.ver_todos') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN (SELECT COALESCE(jsonb_agg(FN_PEDIDOS_JSON(x.PED_Codigo)
                || jsonb_build_object('cliente', x.nombre, 'celular', x.USU_Celular)
                ORDER BY x.PED_Fecha DESC, x.PED_Codigo DESC), '[]')
              FROM (SELECT p.PED_Codigo, p.PED_Fecha, u.USU_Celular,
                           u.USU_Nombres || ' ' || u.USU_Apellidos AS nombre
                      FROM PEDIDOS p JOIN USUARIOS u ON u.USU_Codigo = p.USU_Codigo
                     ORDER BY p.PED_Fecha DESC, p.PED_Codigo DESC LIMIT 100) x);
END;
$$;

CREATE FUNCTION FN_ADMIN_PEDIDO_ESTADO(p_auth UUID, p_numero TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_pedido   CHAR(10);
    v_domicilio BOOLEAN;
    v_actual   TEXT;
    v_nuevo    CHAR(6);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'pedidos.cambiar_estado');
    SELECT p.PED_Codigo, p.DIR_Codigo IS NOT NULL, e.EPE_Nombre
      INTO v_pedido, v_domicilio, v_actual
      FROM PEDIDOS p JOIN ESTADOS_PEDIDO e ON e.EPE_Codigo = p.EPE_Codigo
     WHERE p.PED_Numero = p_numero;
    IF v_pedido IS NULL THEN
        RAISE EXCEPTION 'Ese pedido no existe.' USING ERRCODE = '22023';
    END IF;
    SELECT EPE_Codigo INTO v_nuevo FROM ESTADOS_PEDIDO WHERE EPE_Nombre = p_estado;
    IF v_nuevo IS NULL THEN
        RAISE EXCEPTION 'Ese estado no existe.' USING ERRCODE = '22023';
    END IF;
    IF v_actual IN ('Entregado', 'Cancelado') THEN
        RAISE EXCEPTION 'Un pedido % ya no cambia.', lower(v_actual) USING ERRCODE = '22023';
    END IF;
    IF p_estado = 'Listo para retirar' AND v_domicilio THEN
        RAISE EXCEPTION 'Un pedido a domicilio no se retira: va "En camino".' USING ERRCODE = '22023';
    END IF;
    IF p_estado = 'En camino' AND NOT v_domicilio THEN
        RAISE EXCEPTION 'Un pedido para retirar no va "En camino": va "Listo para retirar".' USING ERRCODE = '22023';
    END IF;
    UPDATE PEDIDOS SET EPE_Codigo = v_nuevo WHERE PED_Codigo = v_pedido;
    RETURN FN_PEDIDOS_JSON(v_pedido);
END;
$$;

CREATE FUNCTION FN_ADMIN_PRODUCTOS(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'productos.gestionar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'codigo',     p.PRO_Codigo,
                'nombre',     p.PRO_Nombre,
                'categoria',  c.CAT_Nombre,
                'disponible', p.PRO_Disponible,
                'destacado',  p.PRO_Destacado,
                'tamanos',    (SELECT jsonb_agg(jsonb_build_object(
                                      'codigo', t.TAM_Codigo, 'nombre', t.TAM_Descripcion, 'precio', pt.PTA_Precio)
                                      ORDER BY pt.PTA_Orden)
                                 FROM PRODUCTOS_TAMANOS pt JOIN TAMANOS t ON t.TAM_Codigo = pt.TAM_Codigo
                                WHERE pt.PRO_Codigo = p.PRO_Codigo))
                ORDER BY p.PRO_Codigo), '[]')
              FROM PRODUCTOS p JOIN CATEGORIAS c ON c.CAT_Codigo = p.CAT_Codigo);
END;
$$;

CREATE FUNCTION FN_ADMIN_PRODUCTO_GUARDAR(p_auth UUID, p_codigo TEXT, p_disponible BOOLEAN, p_destacado BOOLEAN, p_precios JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_tamano TEXT;
    v_precio NUMERIC;
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'productos.gestionar');
    UPDATE PRODUCTOS SET PRO_Disponible = p_disponible, PRO_Destacado = p_destacado
     WHERE PRO_Codigo = p_codigo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese producto no existe.' USING ERRCODE = '22023';
    END IF;
    FOR v_tamano, v_precio IN SELECT key, value::NUMERIC FROM jsonb_each_text(COALESCE(p_precios, '{}')) LOOP
        IF v_precio IS NULL OR v_precio <= 0 OR v_precio > 999 THEN
            RAISE EXCEPTION 'El precio tiene que ser mayor que 0 y menor que 1000.' USING ERRCODE = '22023';
        END IF;
        UPDATE PRODUCTOS_TAMANOS SET PTA_Precio = ROUND(v_precio, 2)
         WHERE PRO_Codigo = p_codigo AND TAM_Codigo = v_tamano;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ese tamaño no es de este producto.' USING ERRCODE = '22023';
        END IF;
    END LOOP;
    RETURN (SELECT x FROM jsonb_array_elements(FN_ADMIN_PRODUCTOS(p_auth)) x WHERE x->>'codigo' = p_codigo);
END;
$$;

CREATE FUNCTION FN_ADMIN_RESUMEN(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_hoy DATE := (now() AT TIME ZONE 'America/Guayaquil')::DATE;
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'reportes.ver') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'hoy', (SELECT jsonb_build_object('pedidos', count(*), 'ventas', COALESCE(sum(t.PED_Total), 0))
                  FROM VW_PEDIDOS_TOTALES t
                 WHERE t.EPE_Nombre <> 'Cancelado'
                   AND (t.PED_Fecha AT TIME ZONE 'America/Guayaquil')::DATE = v_hoy),
        'mes',  (SELECT jsonb_build_object('pedidos', count(*), 'ventas', COALESCE(sum(t.PED_Total), 0))
                  FROM VW_PEDIDOS_TOTALES t
                 WHERE t.EPE_Nombre <> 'Cancelado'
                   AND date_trunc('month', t.PED_Fecha AT TIME ZONE 'America/Guayaquil') = date_trunc('month', v_hoy)),
        'pendientes', (SELECT count(*) FROM VW_PEDIDOS_TOTALES t
                        WHERE t.EPE_Nombre NOT IN ('Entregado', 'Cancelado')),
        'masVendidos', (SELECT COALESCE(jsonb_agg(jsonb_build_object('nombre', m.nombre, 'unidades', m.unidades)
                                                  ORDER BY m.unidades DESC, m.nombre), '[]')
                          FROM (SELECT pr.PRO_Nombre AS nombre, sum(d.DPE_Cantidad) AS unidades
                                  FROM DETALLES_PEDIDO d
                                  JOIN PEDIDOS p     ON p.PED_Codigo = d.PED_Codigo
                                  JOIN ESTADOS_PEDIDO e ON e.EPE_Codigo = p.EPE_Codigo
                                  JOIN PRODUCTOS pr  ON pr.PRO_Codigo = d.PRO_Codigo
                                 WHERE e.EPE_Nombre <> 'Cancelado' AND p.PED_Fecha >= now() - interval '30 days'
                                 GROUP BY pr.PRO_Nombre
                                 ORDER BY sum(d.DPE_Cantidad) DESC, pr.PRO_Nombre LIMIT 5) m));
END;
$$;

ALTER FUNCTION FN_TIENE_PERMISO(UUID, TEXT) SET search_path = public;
ALTER FUNCTION FN_EXIGIR_PERMISO(UUID, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_YO(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PEDIDOS(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PRODUCTOS(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_RESUMEN(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION FN_TIENE_PERMISO(UUID, TEXT), FN_EXIGIR_PERMISO(UUID, TEXT), FN_ADMIN_YO(UUID), FN_ADMIN_PEDIDOS(UUID), FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT), FN_ADMIN_PRODUCTOS(UUID), FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB), FN_ADMIN_RESUMEN(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_TIENE_PERMISO(UUID, TEXT), FN_EXIGIR_PERMISO(UUID, TEXT), FN_ADMIN_YO(UUID), FN_ADMIN_PEDIDOS(UUID), FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT), FN_ADMIN_PRODUCTOS(UUID), FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB), FN_ADMIN_RESUMEN(UUID) TO service_role;;
