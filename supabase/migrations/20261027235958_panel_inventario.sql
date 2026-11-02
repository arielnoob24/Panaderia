INSERT INTO PERMISOS (PER_Nombre, PER_Descripcion) VALUES
    ('inventario.ver', 'Ver existencias, lotes por caducar y movimientos de bodega');
INSERT INTO ROLES_PERMISOS (ROL_Codigo, PER_Codigo)
SELECT r.ROL_Codigo, p.PER_Codigo FROM ROLES r, PERMISOS p
 WHERE p.PER_Nombre = 'inventario.ver' AND r.ROL_Nombre IN ('Administrador', 'Empleado');

CREATE FUNCTION FN_ADMIN_INVENTARIO(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_costos BOOLEAN;
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'inventario.ver') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    v_costos := FN_TIENE_PERMISO(p_auth, 'reportes.ver');
    RETURN jsonb_build_object(
        'costos', v_costos,
        'materiales', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'codigo',          e.MAT_Codigo,
                'nombre',          e.MAT_Nombre,
                'existencia',      e.MAT_Existencia,
                'unidad',          e.UMI_Produccion,
                'existenciaCompra', e.MAT_ExistenciaCompra,
                'unidadCompra',    e.UMI_Compra,
                'minimo',          m.MAT_StockMinimo,
                'bajoMinimo',      e.MAT_BajoMinimo,
                'valor',           CASE WHEN v_costos THEN e.MAT_Valor END)
                ORDER BY e.MAT_BajoMinimo DESC, e.MAT_Nombre), '[]')
              FROM VW_EXISTENCIAS_MATERIALES e JOIN MATERIALES m ON m.MAT_Codigo = e.MAT_Codigo
             WHERE m.MAT_Activo),
        'caducan', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'lote',      s.LMA_Codigo,
                'material',  m.MAT_Nombre,
                'unidad',    u.UMI_Abreviatura,
                'saldo',     s.LMA_Saldo,
                'caduca',    s.LMA_FechaCaducidad,
                'caducado',  s.LMA_Caducado)
                ORDER BY s.LMA_FechaCaducidad, m.MAT_Nombre), '[]')
              FROM VW_LOTES_SALDO s
              JOIN MATERIALES m ON m.MAT_Codigo = s.MAT_Codigo
              JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoProduccion
             WHERE s.LMA_Recibido AND s.LMA_Saldo > 0 AND s.LMA_FechaCaducidad <= CURRENT_DATE + 30),
        'productos', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'nombre',     x.PRO_Nombre,
                'tamano',     x.TAM_Descripcion,
                'producido',  x.PTA_Producido,
                'vendido',    x.PTA_Vendido,
                'existencia', x.PTA_Existencia,
                'costo',      CASE WHEN v_costos THEN x.PTA_CostoPromedio END,
                'precio',     x.PTA_Precio)
                ORDER BY x.PRO_Nombre, x.TAM_Descripcion), '[]')
              FROM VW_EXISTENCIAS_PRODUCTOS x
             WHERE x.PTA_Producido > 0 OR x.PTA_Vendido > 0));
END;
$$;

CREATE FUNCTION FN_ADMIN_KARDEX(p_auth UUID, p_material TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_costos BOOLEAN;
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'inventario.ver') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM MATERIALES WHERE MAT_Codigo = p_material) THEN
        RAISE EXCEPTION 'Ese material no existe.' USING ERRCODE = '22023';
    END IF;
    v_costos := FN_TIENE_PERMISO(p_auth, 'reportes.ver');
    RETURN (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'fecha',     k.KAR_Fecha,
                'tipo',      k.KAR_Tipo,
                'documento', k.KAR_Documento,
                'cantidad',  k.KAR_Cantidad,
                'saldo',     k.KAR_Saldo,
                'valor',     CASE WHEN v_costos THEN k.KAR_Valor END)
                ORDER BY k.KAR_Fecha DESC, k.KAR_Documento DESC, k.LMA_Codigo DESC), '[]')
              FROM VW_KARDEX k WHERE k.MAT_Codigo = p_material);
END;
$$;

ALTER FUNCTION FN_ADMIN_INVENTARIO(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_KARDEX(UUID, TEXT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION FN_ADMIN_INVENTARIO(UUID), FN_ADMIN_KARDEX(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_ADMIN_INVENTARIO(UUID), FN_ADMIN_KARDEX(UUID, TEXT) TO service_role;;
