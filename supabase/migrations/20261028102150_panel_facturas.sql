CREATE FUNCTION FN_FACTURA_JSON(p_factura CHAR)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
               'codigo',   f.FAC_Codigo,
               'numero',   f.FAC_Establecimiento || '-' || f.FAC_PuntoEmision || '-' || f.FAC_Secuencial,
               'pedido',   p.PED_Numero,
               'cliente',  c.CLI_RazonSocial,
               'ident',    c.CLI_Identificacion,
               'fecha',    f.FAC_FechaEmision,
               'total',    t.PED_Total,
               'anulada',  f.FAC_FechaAnulacion)
      FROM FACTURAS f
      JOIN PEDIDOS p ON p.PED_Codigo = f.PED_Codigo
      JOIN CLIENTES c ON c.CLI_Codigo = f.CLI_Codigo
      JOIN VW_PEDIDOS_TOTALES t ON t.PED_Codigo = f.PED_Codigo
     WHERE f.FAC_Codigo = p_factura;
$$;

CREATE FUNCTION FN_ADMIN_FACTURAS(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'facturas.anular') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'facturas', (SELECT COALESCE(jsonb_agg(FN_FACTURA_JSON(x.FAC_Codigo) ORDER BY x.FAC_FechaEmision DESC, x.FAC_Codigo DESC), '[]')
                       FROM (SELECT FAC_Codigo, FAC_FechaEmision FROM FACTURAS
                              ORDER BY FAC_FechaEmision DESC, FAC_Codigo DESC LIMIT 100) x),
        'clientes', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                               'codigo', y.CLI_Codigo, 'nombre', y.CLI_RazonSocial, 'ident', y.CLI_Identificacion,
                               'tipo', y.TID_Nombre, 'correo', y.CLI_Correo, 'telefono', y.CLI_Telefono,
                               'facturas', y.vigentes, 'facturado', y.facturado)
                             ORDER BY y.facturado DESC, y.CLI_RazonSocial), '[]')
                       FROM (SELECT c.CLI_Codigo, c.CLI_RazonSocial, c.CLI_Identificacion, ti.TID_Nombre,
                                    c.CLI_Correo, c.CLI_Telefono,
                                    count(f.FAC_Codigo) AS vigentes,
                                    COALESCE(sum(t.PED_Total), 0) AS facturado
                               FROM CLIENTES c
                               JOIN TIPOS_IDENTIFICACION ti ON ti.TID_Codigo = c.TID_Codigo
                               LEFT JOIN FACTURAS f ON f.CLI_Codigo = c.CLI_Codigo AND f.FAC_FechaAnulacion IS NULL
                               LEFT JOIN VW_PEDIDOS_TOTALES t ON t.PED_Codigo = f.PED_Codigo
                              GROUP BY c.CLI_Codigo, c.CLI_RazonSocial, c.CLI_Identificacion, ti.TID_Nombre,
                                       c.CLI_Correo, c.CLI_Telefono) y));
END;
$$;

CREATE FUNCTION FN_ADMIN_FACTURA_ANULAR(p_auth UUID, p_factura TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_anulada TIMESTAMPTZ;
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'facturas.anular');
    SELECT FAC_FechaAnulacion INTO v_anulada FROM FACTURAS WHERE FAC_Codigo = p_factura;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa factura no existe.' USING ERRCODE = '22023';
    ELSIF v_anulada IS NOT NULL THEN
        RAISE EXCEPTION 'Esa factura ya estaba anulada.' USING ERRCODE = '22023';
    END IF;
    UPDATE FACTURAS SET FAC_FechaAnulacion = now() WHERE FAC_Codigo = p_factura;
    RETURN FN_FACTURA_JSON(p_factura);
END;
$$;

ALTER FUNCTION FN_FACTURA_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_FACTURAS(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_FACTURA_ANULAR(UUID, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION FN_FACTURA_JSON(CHAR), FN_ADMIN_FACTURAS(UUID), FN_ADMIN_FACTURA_ANULAR(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_FACTURA_JSON(CHAR), FN_ADMIN_FACTURAS(UUID), FN_ADMIN_FACTURA_ANULAR(UUID, TEXT) TO service_role;;
