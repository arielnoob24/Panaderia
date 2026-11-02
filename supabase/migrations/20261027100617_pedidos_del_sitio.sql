CREATE FUNCTION FN_PEDIDOS_JSON(p_pedido CHAR(10))
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'numero',    p.PED_Numero,
        'fecha',     p.PED_Fecha,
        'estado',    t.EPE_Nombre,
        'modo',      CASE WHEN p.DIR_Codigo IS NULL THEN 'retiro' ELSE 'domicilio' END,
        'direccion', COALESCE(concat_ws(' · ', d.DIR_CallePrincipal, d.DIR_Referencia), ''),
        'metodo',    CASE WHEN m.MPA_UsaTarjeta THEN 'Tarjeta terminada en ' || g.PAG_UltimosDigitos
                          WHEN p.DIR_Codigo IS NULL THEN 'Efectivo al retirar'
                          ELSE 'Efectivo al recibir' END,
        'subtotal',  t.PED_Total - t.PED_CostoEnvio,
        'envio',     t.PED_CostoEnvio,
        'total',     t.PED_Total,
        'lineas',    (SELECT jsonb_agg(jsonb_build_object(
                                 'nombre',   pr.PRO_Nombre
                                             || CASE WHEN ta.TAM_Descripcion = 'Único' THEN '' ELSE ' ' || ta.TAM_Descripcion END,
                                 'precio',   dp.DPE_PrecioUnitario,
                                 'cantidad', dp.DPE_Cantidad)
                             ORDER BY dp.PRO_Codigo, dp.TAM_Codigo)
                        FROM DETALLES_PEDIDO dp
                        JOIN PRODUCTOS pr ON pr.PRO_Codigo = dp.PRO_Codigo
                        JOIN TAMANOS ta   ON ta.TAM_Codigo = dp.TAM_Codigo
                       WHERE dp.PED_Codigo = p.PED_Codigo))
      FROM PEDIDOS p
      JOIN VW_PEDIDOS_TOTALES t ON t.PED_Codigo = p.PED_Codigo
      LEFT JOIN DIRECCIONES d   ON d.DIR_Codigo = p.DIR_Codigo
      LEFT JOIN LATERAL (SELECT * FROM PAGOS x WHERE x.PED_Codigo = p.PED_Codigo
                          ORDER BY x.PAG_Codigo DESC LIMIT 1) g ON TRUE
      LEFT JOIN METODOS_PAGO m  ON m.MPA_Codigo = g.MPA_Codigo
     WHERE p.PED_Codigo = p_pedido;
$$;

CREATE FUNCTION FN_PEDIDOS_DE(p_auth UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(jsonb_agg(FN_PEDIDOS_JSON(p.PED_Codigo) ORDER BY p.PED_Fecha DESC, p.PED_Codigo DESC), '[]')
      FROM PEDIDOS p
      JOIN USUARIOS u ON u.USU_Codigo = p.USU_Codigo
     WHERE u.USU_CodigoAuth = p_auth;
$$;

CREATE FUNCTION FN_PEDIDOS_REGISTRAR(p_auth UUID, p_pedido JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usuario    CHAR(10);
    v_domicilio  BOOLEAN := p_pedido ->> 'modo' = 'domicilio';
    v_tarjeta    BOOLEAN := p_pedido ->> 'metodo' = 'tarjeta';
    v_calle      TEXT    := btrim(COALESCE(p_pedido ->> 'direccion', ''));
    v_referencia TEXT    := NULLIF(concat_ws(' · ', NULLIF(btrim(p_pedido ->> 'piso'), ''),
                                                    NULLIF(btrim(p_pedido ->> 'referencia'), '')), '');
    v_ultimos    TEXT    := right(regexp_replace(COALESCE(p_pedido ->> 'ultimos', ''), '\D', '', 'g'), 4);
    v_factura    JSONB   := COALESCE(p_pedido -> 'factura', '{}');
    v_ident      TEXT    := regexp_replace(COALESCE(v_factura ->> 'ident', ''), '\D', '', 'g');
    v_correo     TEXT    := lower(btrim(COALESCE(v_factura ->> 'correo', '')));
    v_direccion  CHAR(10);
    v_pedido     CHAR(10);
    v_numero     CHAR(7);
    v_cliente    CHAR(10);
    v_linea      JSONB;
    v_nombre     TEXT;
    v_cantidad   INTEGER;
    v_pro        CHAR(6);
    v_tam        CHAR(6);
    v_total      NUMERIC(10,2);
BEGIN
    SELECT USU_Codigo INTO v_usuario FROM USUARIOS WHERE USU_CodigoAuth = p_auth AND USU_Activo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tu cuenta todavía no tiene datos. Entra a Mis datos y guárdalos.' USING ERRCODE = '22023';
    END IF;
    PERFORM set_config('app.usuario', v_usuario, TRUE);

    IF jsonb_typeof(p_pedido -> 'lineas') IS DISTINCT FROM 'array' OR jsonb_array_length(p_pedido -> 'lineas') = 0 THEN
        RAISE EXCEPTION 'Tu canasta está vacía.' USING ERRCODE = '22023';
    END IF;
    IF v_tarjeta AND v_ultimos !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'Faltan los números de la tarjeta.' USING ERRCODE = '22023';
    END IF;

    IF v_domicilio THEN
        IF v_calle = '' THEN
            RAISE EXCEPTION 'Escribe la dirección para poder llevarlo.' USING ERRCODE = '22023';
        ELSIF length(v_calle) > 80 OR length(COALESCE(v_referencia, '')) > 150 THEN
            RAISE EXCEPTION 'La dirección es demasiado larga.' USING ERRCODE = '22023';
        END IF;
        SELECT DIR_Codigo INTO v_direccion
          FROM DIRECCIONES
         WHERE USU_Codigo = v_usuario AND DIR_CallePrincipal = v_calle
           AND DIR_Referencia IS NOT DISTINCT FROM v_referencia
         LIMIT 1;
        IF NOT FOUND THEN
            INSERT INTO DIRECCIONES (USU_Codigo, CAN_Codigo, DIR_Alias, DIR_CallePrincipal, DIR_Referencia)
            VALUES (v_usuario, '1501',
                    'Entrega ' || (SELECT count(*) + 1 FROM DIRECCIONES WHERE USU_Codigo = v_usuario),
                    v_calle, v_referencia)
            RETURNING DIR_Codigo INTO v_direccion;
        END IF;
    END IF;

    LOOP
        v_numero := 'ET-' || (SELECT string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::INTEGER, 1), '')
                                FROM generate_series(1, 4));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM PEDIDOS WHERE PED_Numero = v_numero);
    END LOOP;

    INSERT INTO PEDIDOS (USU_Codigo, TEN_Codigo, DIR_Codigo, EPE_Codigo, PED_Numero, PED_Observacion)
    VALUES (v_usuario,
            (SELECT TEN_Codigo FROM TIPOS_ENTREGA WHERE TEN_PideDireccion = v_domicilio ORDER BY TEN_Codigo LIMIT 1),
            v_direccion,
            (SELECT EPE_Codigo FROM ESTADOS_PEDIDO
              WHERE EPE_Nombre = CASE WHEN v_tarjeta THEN 'Pagado' ELSE 'Pendiente de pago' END),
            v_numero,
            CASE WHEN v_domicilio THEN NULLIF(left(btrim(COALESCE(p_pedido ->> 'notas', '')), 250), '') END)
    RETURNING PED_Codigo INTO v_pedido;

    FOR v_linea IN SELECT * FROM jsonb_array_elements(p_pedido -> 'lineas') LOOP
        v_nombre := btrim(COALESCE(v_linea ->> 'nombre', ''));
        v_cantidad := CASE WHEN v_linea ->> 'cantidad' ~ '^[0-9]{1,3}$' THEN (v_linea ->> 'cantidad')::INTEGER END;
        IF v_cantidad IS NULL OR v_cantidad NOT BETWEEN 1 AND 100 THEN
            RAISE EXCEPTION 'De % se pueden pedir de 1 a 100.', v_nombre USING ERRCODE = '22023';
        END IF;
        SELECT pt.PRO_Codigo, pt.TAM_Codigo INTO v_pro, v_tam
          FROM PRODUCTOS_TAMANOS pt
          JOIN PRODUCTOS p ON p.PRO_Codigo = pt.PRO_Codigo
          JOIN TAMANOS t   ON t.TAM_Codigo = pt.TAM_Codigo
         WHERE p.PRO_Disponible
           AND lower(p.PRO_Nombre || CASE WHEN t.TAM_Descripcion = 'Único' THEN '' ELSE ' ' || t.TAM_Descripcion END) = lower(v_nombre);
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ya no tenemos %. Quítalo de la canasta para seguir.', v_nombre USING ERRCODE = '22023';
        END IF;
        INSERT INTO DETALLES_PEDIDO (PED_Codigo, PRO_Codigo, TAM_Codigo, DPE_Cantidad)
        VALUES (v_pedido, v_pro, v_tam, v_cantidad);
    END LOOP;

    SELECT PED_Total INTO v_total FROM VW_PEDIDOS_TOTALES WHERE PED_Codigo = v_pedido;
    INSERT INTO PAGOS (PED_Codigo, MPA_Codigo, PAG_Monto, PAG_Aprobado, PAG_UltimosDigitos, PAG_Autorizacion)
    VALUES (v_pedido,
            (SELECT MPA_Codigo FROM METODOS_PAGO
              WHERE MPA_Nombre = CASE WHEN v_tarjeta THEN 'Tarjeta de crédito' ELSE 'Efectivo' END),
            v_total, v_tarjeta,
            CASE WHEN v_tarjeta THEN v_ultimos END,
            CASE WHEN v_tarjeta THEN 'SIMULADO' END);

    IF (v_factura ->> 'aOtro')::BOOLEAN IS TRUE THEN
        IF btrim(COALESCE(v_factura ->> 'nombre', '')) = '' THEN
            RAISE EXCEPTION 'Escribe a nombre de quién va la factura.' USING ERRCODE = '22023';
        ELSIF NOT FN_IDENTIFICACION_VALIDA(CASE WHEN length(v_ident) = 13 THEN '04' ELSE '05' END, v_ident) THEN
            RAISE EXCEPTION 'La cédula o el RUC de la factura no es válido.' USING ERRCODE = '22023';
        END IF;
        INSERT INTO CLIENTES (TID_Codigo, CLI_Identificacion, CLI_RazonSocial, CLI_Correo, CLI_Direccion)
        VALUES (CASE WHEN length(v_ident) = 13 THEN '04' ELSE '05' END, v_ident,
                left(btrim(v_factura ->> 'nombre'), 150),
                CASE WHEN v_correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN v_correo END,
                NULLIF(left(btrim(COALESCE(v_factura ->> 'direccion', '')), 200), ''))
        ON CONFLICT (TID_Codigo, CLI_Identificacion) DO UPDATE
           SET CLI_RazonSocial = EXCLUDED.CLI_RazonSocial,
               CLI_Correo      = COALESCE(EXCLUDED.CLI_Correo, CLIENTES.CLI_Correo),
               CLI_Direccion   = COALESCE(EXCLUDED.CLI_Direccion, CLIENTES.CLI_Direccion)
        RETURNING CLI_Codigo INTO v_cliente;
    ELSE
        SELECT CLI_Codigo INTO v_cliente FROM CLIENTES WHERE TID_Codigo = '07' ORDER BY CLI_Codigo LIMIT 1;
    END IF;
    INSERT INTO FACTURAS (PED_Codigo, CLI_Codigo) VALUES (v_pedido, v_cliente);

    RETURN FN_PEDIDOS_JSON(v_pedido);
END;
$$;

ALTER FUNCTION FN_PEDIDOS_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_PEDIDOS_DE(UUID) SET search_path = public;
ALTER FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB) SET search_path = public;

REVOKE EXECUTE ON FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB), FN_PEDIDOS_DE(UUID), FN_PEDIDOS_JSON(CHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB), FN_PEDIDOS_DE(UUID), FN_PEDIDOS_JSON(CHAR) TO service_role;;
