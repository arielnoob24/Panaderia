CREATE FUNCTION FN_EMPLEADO_JSON(p_empleado CHAR(10))
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'codigo',    e.EMP_Codigo,
        'nombre',    e.EMP_PrimerNombre || COALESCE(' ' || e.EMP_SegundoNombre, '') || ' ' || e.EMP_PrimerApellido || COALESCE(' ' || e.EMP_SegundoApellido, ''),
        'cedula',    e.EMP_Cedula,
        'cargo',     c.CAR_Nombre,
        'cargoCodigo', e.CAR_Codigo,
        'contrato',  CASE e.EMP_TipoContrato WHEN 'PER' THEN 'Permanente' WHEN 'TEM' THEN 'Temporal' WHEN 'TER' THEN 'Tercerizado' ELSE 'Servicios profesionales' END,
        'sueldo',    e.EMP_Sueldo,
        'correo',    e.EMP_Correo,
        'celular',   e.EMP_Celular,
        'ingreso',   e.EMP_FechaIngreso,
        'activo',    e.EMP_Activo,
        'cuentas',   COALESCE((SELECT jsonb_agg(jsonb_build_object('correo', u.USU_Correo, 'rol', r.ROL_Nombre, 'activa', u.USU_Activo) ORDER BY u.USU_Correo)
                                 FROM USUARIOS u JOIN ROLES r ON r.ROL_Codigo = u.ROL_Codigo
                                WHERE u.EMP_Codigo = e.EMP_Codigo), '[]'))
      FROM EMPLEADOS e JOIN CARGOS c ON c.CAR_Codigo = e.CAR_Codigo
     WHERE e.EMP_Codigo = p_empleado;
$$;

CREATE FUNCTION FN_ADMIN_EQUIPO(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'usuarios.gestionar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'empleados', (SELECT COALESCE(jsonb_agg(FN_EMPLEADO_JSON(e.EMP_Codigo) ORDER BY e.EMP_Activo DESC, e.EMP_PrimerApellido, e.EMP_PrimerNombre), '[]') FROM EMPLEADOS e),
        'cargos',    (SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', CAR_Codigo, 'nombre', CAR_Nombre) ORDER BY CAR_Nombre), '[]') FROM CARGOS),
        'cantones',  (SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', CAN_Codigo, 'nombre', CAN_Nombre) ORDER BY CAN_Nombre), '[]') FROM CANTONES));
END;
$$;

CREATE FUNCTION FN_ADMIN_EMPLEADO_CREAR(p_auth UUID, p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_cedula  TEXT := btrim(COALESCE(p_datos->>'cedula', ''));
    v_nombre1 TEXT := btrim(COALESCE(p_datos->>'primerNombre', ''));
    v_nombre2 TEXT := NULLIF(btrim(COALESCE(p_datos->>'segundoNombre', '')), '');
    v_apell1  TEXT := btrim(COALESCE(p_datos->>'primerApellido', ''));
    v_apell2  TEXT := NULLIF(btrim(COALESCE(p_datos->>'segundoApellido', '')), '');
    v_sexo    TEXT := upper(btrim(COALESCE(p_datos->>'sexo', '')));
    v_correo  TEXT := lower(btrim(COALESCE(p_datos->>'correo', '')));
    v_celular TEXT := btrim(COALESCE(p_datos->>'celular', ''));
    v_dir     TEXT := btrim(COALESCE(p_datos->>'direccion', ''));
    v_canton  TEXT := btrim(COALESCE(p_datos->>'canton', ''));
    v_cargo   TEXT := btrim(COALESCE(p_datos->>'cargo', ''));
    v_contrato TEXT := upper(btrim(COALESCE(p_datos->>'contrato', 'PER')));
    v_nace    DATE;
    v_sueldo  NUMERIC;
    v_hoy     DATE := (now() AT TIME ZONE 'America/Guayaquil')::DATE;
    v_codigo  CHAR(10);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'usuarios.gestionar');
    IF NOT FN_CEDULA_VALIDA(v_cedula) THEN
        RAISE EXCEPTION 'La cédula no es válida.' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM EMPLEADOS WHERE EMP_Cedula = v_cedula) THEN
        RAISE EXCEPTION 'Ya hay un empleado con esa cédula.' USING ERRCODE = '22023';
    END IF;
    IF v_nombre1 = '' OR v_apell1 = '' OR length(v_nombre1) > 30 OR length(v_apell1) > 30
       OR length(COALESCE(v_nombre2, '')) > 30 OR length(COALESCE(v_apell2, '')) > 30 THEN
        RAISE EXCEPTION 'Escribe el primer nombre y el primer apellido (hasta 30 letras cada uno).' USING ERRCODE = '22023';
    END IF;
    BEGIN
        v_nace := (p_datos->>'nacimiento')::DATE;
    EXCEPTION WHEN OTHERS THEN
        v_nace := NULL;
    END;
    IF v_nace IS NULL OR v_nace > v_hoy - INTERVAL '15 years' OR v_nace < v_hoy - INTERVAL '90 years' THEN
        RAISE EXCEPTION 'La fecha de nacimiento no es válida: se trabaja desde los 15 años.' USING ERRCODE = '22023';
    END IF;
    IF v_sexo NOT IN ('H', 'M') THEN
        RAISE EXCEPTION 'Elige hombre o mujer.' USING ERRCODE = '22023';
    END IF;
    IF v_correo !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' OR length(v_correo) > 254 THEN
        RAISE EXCEPTION 'El correo no es válido.' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM EMPLEADOS WHERE EMP_Correo = v_correo) THEN
        RAISE EXCEPTION 'Ya hay un empleado con ese correo.' USING ERRCODE = '22023';
    END IF;
    IF v_celular !~ '^09[0-9]{8}$' THEN
        RAISE EXCEPTION 'El celular son 10 números y empieza con 09.' USING ERRCODE = '22023';
    END IF;
    IF v_dir = '' OR length(v_dir) > 200 THEN
        RAISE EXCEPTION 'Escribe la dirección (hasta 200 letras).' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM CANTONES WHERE CAN_Codigo = v_canton) THEN
        RAISE EXCEPTION 'Elige el cantón.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM CARGOS WHERE CAR_Codigo = v_cargo) THEN
        RAISE EXCEPTION 'Elige el cargo.' USING ERRCODE = '22023';
    END IF;
    IF v_contrato NOT IN ('PER', 'TEM', 'TER', 'SPR') THEN
        RAISE EXCEPTION 'Elige el tipo de contrato.' USING ERRCODE = '22023';
    END IF;
    IF COALESCE(p_datos->>'sueldo', '') !~ '^[0-9]{1,4}([.][0-9]{1,2})?$' THEN
        RAISE EXCEPTION 'El sueldo tiene que ser mayor que 0 y menor que 10000, con hasta 2 decimales.' USING ERRCODE = '22023';
    END IF;
    v_sueldo := (p_datos->>'sueldo')::NUMERIC;
    IF v_sueldo <= 0 THEN
        RAISE EXCEPTION 'El sueldo tiene que ser mayor que 0 y menor que 10000, con hasta 2 decimales.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO EMPLEADOS (CAN_Codigo, CAR_Codigo, EMP_Cedula, EMP_PrimerApellido, EMP_SegundoApellido, EMP_PrimerNombre, EMP_SegundoNombre,
                           EMP_FechaNacimiento, EMP_Sexo, EMP_Correo, EMP_Celular, EMP_Direccion, EMP_TipoContrato, EMP_Sueldo, EMP_FechaIngreso)
    VALUES (v_canton, v_cargo, v_cedula, v_apell1, v_apell2, v_nombre1, v_nombre2,
            v_nace, v_sexo, v_correo, v_celular, v_dir, v_contrato, v_sueldo, v_hoy)
    RETURNING EMP_Codigo INTO v_codigo;
    RETURN FN_EMPLEADO_JSON(v_codigo);
END;
$$;

CREATE FUNCTION FN_ADMIN_EMPLEADO_EDITAR(p_auth UUID, p_empleado TEXT, p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_yo     CHAR(10);
    v_cargo  TEXT := NULLIF(btrim(COALESCE(p_datos->>'cargo', '')), '');
    v_sueldo NUMERIC;
    v_activo BOOLEAN;
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'usuarios.gestionar');
    SELECT EMP_Codigo INTO v_yo FROM USUARIOS WHERE USU_Codigo = v_usu;
    IF NOT EXISTS (SELECT 1 FROM EMPLEADOS WHERE EMP_Codigo = p_empleado) THEN
        RAISE EXCEPTION 'Ese empleado no existe.' USING ERRCODE = '22023';
    END IF;
    IF v_cargo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CARGOS WHERE CAR_Codigo = v_cargo) THEN
        RAISE EXCEPTION 'Elige el cargo.' USING ERRCODE = '22023';
    END IF;
    IF p_datos ? 'sueldo' THEN
        IF COALESCE(p_datos->>'sueldo', '') !~ '^[0-9]{1,4}([.][0-9]{1,2})?$' OR (p_datos->>'sueldo')::NUMERIC <= 0 THEN
            RAISE EXCEPTION 'El sueldo tiene que ser mayor que 0 y menor que 10000, con hasta 2 decimales.' USING ERRCODE = '22023';
        END IF;
        v_sueldo := (p_datos->>'sueldo')::NUMERIC;
    END IF;
    IF p_datos ? 'activo' THEN
        IF jsonb_typeof(p_datos->'activo') <> 'boolean' THEN
            RAISE EXCEPTION 'Falta si el empleado sigue activo.' USING ERRCODE = '22023';
        END IF;
        v_activo := (p_datos->>'activo')::BOOLEAN;
        IF v_activo = FALSE AND p_empleado = v_yo THEN
            RAISE EXCEPTION 'No puedes darte de baja a ti mismo.' USING ERRCODE = '22023';
        END IF;
    END IF;
    UPDATE EMPLEADOS
       SET CAR_Codigo  = COALESCE(v_cargo, CAR_Codigo),
           EMP_Sueldo  = COALESCE(v_sueldo, EMP_Sueldo),
           EMP_Activo  = COALESCE(v_activo, EMP_Activo)
     WHERE EMP_Codigo = p_empleado;
    IF v_activo = FALSE THEN
        UPDATE USUARIOS SET ROL_Codigo = (SELECT ROL_Codigo FROM ROLES WHERE ROL_Nombre = 'Cliente'), EMP_Codigo = NULL
         WHERE EMP_Codigo = p_empleado;
    END IF;
    RETURN FN_EMPLEADO_JSON(p_empleado);
END;
$$;

CREATE FUNCTION FN_ADMIN_EMPLEADO_CUENTA(p_auth UUID, p_empleado TEXT, p_correo TEXT, p_rol TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_correo TEXT := lower(btrim(COALESCE(p_correo, '')));
    v_cuenta CHAR(10);
    v_de     CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'usuarios.gestionar');
    IF NOT EXISTS (SELECT 1 FROM EMPLEADOS WHERE EMP_Codigo = p_empleado AND EMP_Activo) THEN
        RAISE EXCEPTION 'Ese empleado no existe o ya no está activo.' USING ERRCODE = '22023';
    END IF;
    IF p_rol NOT IN ('Empleado', 'Administrador') THEN
        RAISE EXCEPTION 'El acceso es de Empleado o de Administrador.' USING ERRCODE = '22023';
    END IF;
    SELECT USU_Codigo, EMP_Codigo INTO v_cuenta, v_de FROM USUARIOS WHERE USU_Correo = v_correo AND USU_Activo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No hay una cuenta con ese correo. La persona tiene que crearla primero en el sitio.' USING ERRCODE = '22023';
    END IF;
    IF v_cuenta = v_usu THEN
        RAISE EXCEPTION 'No puedes cambiar el acceso de tu propia cuenta.' USING ERRCODE = '22023';
    END IF;
    IF v_de IS NOT NULL AND v_de <> p_empleado THEN
        RAISE EXCEPTION 'Esa cuenta ya es de otro empleado.' USING ERRCODE = '22023';
    END IF;
    UPDATE USUARIOS SET ROL_Codigo = (SELECT ROL_Codigo FROM ROLES WHERE ROL_Nombre = p_rol), EMP_Codigo = p_empleado
     WHERE USU_Codigo = v_cuenta;
    RETURN FN_EMPLEADO_JSON(p_empleado);
END;
$$;

CREATE FUNCTION FN_ADMIN_EMPLEADO_QUITAR_CUENTA(p_auth UUID, p_empleado TEXT, p_correo TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_usu    CHAR(10);
    v_correo TEXT := lower(btrim(COALESCE(p_correo, '')));
    v_cuenta CHAR(10);
BEGIN
    v_usu := FN_EXIGIR_PERMISO(p_auth, 'usuarios.gestionar');
    SELECT USU_Codigo INTO v_cuenta FROM USUARIOS WHERE USU_Correo = v_correo AND EMP_Codigo = p_empleado;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa cuenta no es de ese empleado.' USING ERRCODE = '22023';
    END IF;
    IF v_cuenta = v_usu THEN
        RAISE EXCEPTION 'No puedes quitarte el acceso a ti mismo.' USING ERRCODE = '22023';
    END IF;
    UPDATE USUARIOS SET ROL_Codigo = (SELECT ROL_Codigo FROM ROLES WHERE ROL_Nombre = 'Cliente'), EMP_Codigo = NULL
     WHERE USU_Codigo = v_cuenta;
    RETURN FN_EMPLEADO_JSON(p_empleado);
END;
$$;

ALTER FUNCTION FN_EMPLEADO_JSON(CHAR) SET search_path = public;
ALTER FUNCTION FN_ADMIN_EQUIPO(UUID) SET search_path = public;
ALTER FUNCTION FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB) SET search_path = public;
ALTER FUNCTION FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT) SET search_path = public;

REVOKE ALL ON FUNCTION FN_EMPLEADO_JSON(CHAR), FN_ADMIN_EQUIPO(UUID), FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB), FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB),
    FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT), FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION FN_EMPLEADO_JSON(CHAR), FN_ADMIN_EQUIPO(UUID), FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB), FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB),
    FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT), FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT) TO service_role;;
