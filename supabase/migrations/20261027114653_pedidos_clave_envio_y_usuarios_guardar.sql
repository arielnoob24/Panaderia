ALTER TABLE PEDIDOS ADD COLUMN PED_ClaveEnvio UUID;
ALTER TABLE PEDIDOS ADD CONSTRAINT UQ_PEDIDOS_ClaveEnvio UNIQUE (PED_ClaveEnvio);

CREATE OR REPLACE FUNCTION FN_PEDIDOS_REGISTRAR(p_auth UUID, p_pedido JSONB)
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
    v_clave      UUID    := CASE WHEN p_pedido ->> 'clave' ~* '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'
                                 THEN (p_pedido ->> 'clave')::UUID END;
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

    SELECT PED_Codigo INTO v_pedido FROM PEDIDOS WHERE PED_ClaveEnvio = v_clave AND USU_Codigo = v_usuario;
    IF FOUND THEN
        RETURN FN_PEDIDOS_JSON(v_pedido);
    END IF;

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

    INSERT INTO PEDIDOS (USU_Codigo, TEN_Codigo, DIR_Codigo, EPE_Codigo, PED_Numero, PED_Observacion, PED_ClaveEnvio)
    VALUES (v_usuario,
            (SELECT TEN_Codigo FROM TIPOS_ENTREGA WHERE TEN_PideDireccion = v_domicilio ORDER BY TEN_Codigo LIMIT 1),
            v_direccion,
            (SELECT EPE_Codigo FROM ESTADOS_PEDIDO
              WHERE EPE_Nombre = CASE WHEN v_tarjeta THEN 'Pagado' ELSE 'Pendiente de pago' END),
            v_numero,
            CASE WHEN v_domicilio THEN NULLIF(left(btrim(COALESCE(p_pedido ->> 'notas', '')), 250), '') END,
            v_clave)
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

CREATE FUNCTION FN_USUARIOS_GUARDAR(p_auth UUID, p_correo TEXT, p_nombres TEXT, p_apellidos TEXT, p_celular TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_codigo CHAR(10);
BEGIN
    SELECT USU_Codigo INTO v_codigo FROM USUARIOS WHERE USU_CodigoAuth = p_auth;
    IF FOUND THEN
        PERFORM set_config('app.usuario', v_codigo, TRUE);
        UPDATE USUARIOS
           SET USU_Nombres = p_nombres, USU_Apellidos = p_apellidos, USU_Celular = p_celular
         WHERE USU_Codigo = v_codigo;
    ELSE
        v_codigo := 'USU' || LPAD(nextval('SEQ_USUARIOS')::TEXT, 7, '0');
        PERFORM set_config('app.usuario', v_codigo, TRUE);
        INSERT INTO USUARIOS (USU_Codigo, ROL_Codigo, USU_Nombres, USU_Apellidos, USU_Correo, USU_Celular, USU_CodigoAuth)
        SELECT v_codigo, ROL_Codigo, p_nombres, p_apellidos, lower(p_correo), p_celular, p_auth
          FROM ROLES WHERE ROL_Nombre = 'Cliente';
    END IF;
    RETURN (SELECT jsonb_build_object('usu_codigo', USU_Codigo, 'usu_nombres', USU_Nombres,
                                      'usu_apellidos', USU_Apellidos, 'usu_correo', USU_Correo,
                                      'usu_celular', USU_Celular)
              FROM USUARIOS WHERE USU_Codigo = v_codigo);
END;
$$;

ALTER FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB) SET search_path = public;
ALTER FUNCTION FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;;
