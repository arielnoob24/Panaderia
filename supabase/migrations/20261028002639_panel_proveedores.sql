CREATE FUNCTION FN_PROVEEDOR_JSON(p_proveedor CHAR(10))
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'codigo',         v.PVD_Codigo,
        'razonSocial',    v.PVD_RazonSocial,
        'tipo',           t.TID_Nombre,
        'identificacion', v.PVD_Identificacion,
        'correo',         v.PVD_Correo,
        'telefono',       v.PVD_Telefono,
        'celular',        v.PVD_Celular,
        'direccion',      v.PVD_Direccion,
        'canton',         c.CAN_Nombre,
        'activo',         v.PVD_Activo,
        'materiales',     COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                'codigo', m.MAT_Codigo, 'nombre', m.MAT_Nombre, 'unidad', u.UMI_Abreviatura,
                                'precio', pm.PMA_PrecioReferencia, 'dias', pm.PMA_DiasEntrega) ORDER BY m.MAT_Nombre)
                            FROM PROVEEDORES_MATERIALES pm
                            JOIN MATERIALES m      ON m.MAT_Codigo = pm.MAT_Codigo
                            JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoCompra
                           WHERE pm.PVD_Codigo = v.PVD_Codigo), '[]'))
      FROM PROVEEDORES v
      JOIN TIPOS_IDENTIFICACION t ON t.TID_Codigo = v.TID_Codigo
      JOIN CANTONES c             ON c.CAN_Codigo = v.CAN_Codigo
     WHERE v.PVD_Codigo = p_proveedor;
$$;

CREATE FUNCTION FN_ADMIN_PROVEEDORES(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'compras.aprobar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'proveedores', (SELECT COALESCE(jsonb_agg(FN_PROVEEDOR_JSON(v.PVD_Codigo) ORDER BY v.PVD_RazonSocial), '[]') FROM PROVEEDORES v),
        'cantones',    (SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', CAN_Codigo, 'nombre', CAN_Nombre) ORDER BY CAN_Nombre), '[]') FROM CANTONES),
        'materiales',  (SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', m.MAT_Codigo, 'nombre', m.MAT_Nombre, 'unidad', u.UMI_Abreviatura)
                                                  ORDER BY m.MAT_Nombre), '[]')
                          FROM MATERIALES m JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoCompra WHERE m.MAT_Activo));
END;
$$;

CREATE FUNCTION FN_ADMIN_PROVEEDOR_CREAR(p_auth UUID, p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_tipo     TEXT := btrim(COALESCE(p_datos->>'tipo', ''));
    v_ident    TEXT := btrim(COALESCE(p_datos->>'identificacion', ''));
    v_razon    TEXT := btrim(COALESCE(p_datos->>'razonSocial', ''));
    v_correo   TEXT := lower(btrim(COALESCE(p_datos->>'correo', '')));
    v_telefono TEXT := NULLIF(btrim(COALESCE(p_datos->>'telefono', '')), '');
    v_celular  TEXT := NULLIF(btrim(COALESCE(p_datos->>'celular', '')), '');
    v_dir      TEXT := btrim(COALESCE(p_datos->>'direccion', ''));
    v_canton   TEXT := btrim(COALESCE(p_datos->>'canton', ''));
    v_codigo   CHAR(10);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    IF v_razon = '' OR length(v_razon) > 150 THEN
        RAISE EXCEPTION 'Escribe el nombre o razón social (hasta 150 letras).' USING ERRCODE = '22023';
    END IF;
    IF v_tipo NOT IN ('04', '05') THEN
        RAISE EXCEPTION 'Elige si factura con RUC o con cédula.' USING ERRCODE = '22023';
    END IF;
    IF NOT FN_IDENTIFICACION_VALIDA(v_tipo, v_ident) THEN
        RAISE EXCEPTION 'La cédula o el RUC no es válido.' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM PROVEEDORES WHERE TID_Codigo = v_tipo AND PVD_Identificacion = v_ident) THEN
        RAISE EXCEPTION 'Ya hay un proveedor con esa cédula o RUC.' USING ERRCODE = '22023';
    END IF;
    IF v_correo !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' OR length(v_correo) > 254 THEN
        RAISE EXCEPTION 'El correo no es válido.' USING ERRCODE = '22023';
    END IF;
    IF v_celular IS NOT NULL AND v_celular !~ '^09[0-9]{8}$' THEN
        RAISE EXCEPTION 'El celular son 10 números y empieza con 09.' USING ERRCODE = '22023';
    END IF;
    IF v_telefono IS NOT NULL AND v_telefono !~ '^0[2-7][0-9]{7}$' THEN
        RAISE EXCEPTION 'El teléfono fijo son 9 números: 0, el código de provincia (2 a 7) y 7 cifras.' USING ERRCODE = '22023';
    END IF;
    IF v_dir = '' OR length(v_dir) > 200 THEN
        RAISE EXCEPTION 'Escribe la dirección (hasta 200 letras).' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM CANTONES WHERE CAN_Codigo = v_canton) THEN
        RAISE EXCEPTION 'Elige el cantón.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO PROVEEDORES (TID_Codigo, CAN_Codigo, PVD_Identificacion, PVD_RazonSocial, PVD_Telefono, PVD_Celular, PVD_Correo, PVD_Direccion)
    VALUES (v_tipo, v_canton, v_ident, v_razon, v_telefono, v_celular, v_correo, v_dir)
    RETURNING PVD_Codigo INTO v_codigo;
    RETURN FN_PROVEEDOR_JSON(v_codigo);
END;
$$;

CREATE FUNCTION FN_ADMIN_PROVEEDOR_MATERIAL(p_auth UUID, p_proveedor TEXT, p_material TEXT, p_precio NUMERIC, p_dias INTEGER)
RETURNS JSONB
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    IF NOT EXISTS (SELECT 1 FROM PROVEEDORES WHERE PVD_Codigo = p_proveedor) THEN
        RAISE EXCEPTION 'Ese proveedor no existe.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM MATERIALES WHERE MAT_Codigo = p_material AND MAT_Activo) THEN
        RAISE EXCEPTION 'Ese material no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_precio IS NULL OR p_precio <= 0 OR p_precio >= 10000 THEN
        RAISE EXCEPTION 'El precio tiene que ser mayor que 0 y menor que 10000.' USING ERRCODE = '22023';
    END IF;
    IF p_dias IS NULL OR p_dias < 0 OR p_dias > 365 THEN
        RAISE EXCEPTION 'Los días de entrega van de 0 a 365.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO PROVEEDORES_MATERIALES (PVD_Codigo, MAT_Codigo, PMA_PrecioReferencia, PMA_DiasEntrega)
    VALUES (p_proveedor, p_material, ROUND(p_precio, 4), p_dias)
    ON CONFLICT (PVD_Codigo, MAT_Codigo) DO UPDATE
        SET PMA_PrecioReferencia = EXCLUDED.PMA_PrecioReferencia, PMA_DiasEntrega = EXCLUDED.PMA_DiasEntrega;
    RETURN FN_PROVEEDOR_JSON(p_proveedor);
END;
$$;

CREATE FUNCTION FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(p_auth UUID, p_proveedor TEXT, p_material TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    DELETE FROM PROVEEDORES_MATERIALES WHERE PVD_Codigo = p_proveedor AND MAT_Codigo = p_material;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese proveedor no vende ese material.' USING ERRCODE = '22023';
    END IF;
    RETURN FN_PROVEEDOR_JSON(p_proveedor);
END;
$$;

CREATE FUNCTION FN_ADMIN_PROVEEDOR_ACTIVO(p_auth UUID, p_proveedor TEXT, p_activo BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'compras.aprobar');
    UPDATE PROVEEDORES SET PVD_Activo = p_activo WHERE PVD_Codigo = p_proveedor;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese proveedor no existe.' USING ERRCODE = '22023';
    END IF;
    RETURN FN_PROVEEDOR_JSON(p_proveedor);
END;
$$;

ALTER FUNCTION FN_PROVEEDOR_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PROVEEDORES(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN) SET search_path = public;

REVOKE ALL ON FUNCTION FN_PROVEEDOR_JSON(CHAR), FN_ADMIN_PROVEEDORES(UUID), FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB),
    FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER), FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT),
    FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_PROVEEDOR_JSON(CHAR), FN_ADMIN_PROVEEDORES(UUID), FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB),
    FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER), FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT),
    FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN) TO service_role;;
