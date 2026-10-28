/* =============================================================================
   BD_EL_TRADICIONAL
   Base de datos de la panadería y pastelería El Tradicional (Tena, Ecuador)
   Motor: PostgreSQL 14 o superior
   =============================================================================

   Convenciones
   - Tablas en plural y mayúsculas: PRODUCTOS. Atributos con prefijo de 3 letras
     de su tabla: PRO_Nombre. La llave primaria de cada tabla fuerte es su
     código: PRO_Codigo.
   - Una llave foránea conserva el nombre de la llave que referencia: en
     PRODUCTOS, la categoría es CAT_Codigo. Si una tabla apunta dos veces a
     la misma, la que se repite agrega su papel: en MATERIALES,
     UMI_CodigoCompra y UMI_CodigoProduccion.
   - Los códigos son texto con prefijo y los pone la base sola con una
     secuencia: 'PRO001', 'PED0000001'. Tres excepciones usan el código
     oficial, porque ya existe y otros datos dependen de él:
       PROVINCIAS            código INEC de 2 dígitos ('15' = Napo; es el
                             mismo que abre la cédula)
       CANTONES              código INEC de 4 dígitos ('1501' = Tena)
       TIPOS_IDENTIFICACION  código del SRI ('05' = cédula)
   - PostgreSQL guarda en minúsculas los nombres escritos sin comillas: aquí se
     escriben en mayúsculas para leerlos mejor, pero en pgAdmin salen como
     productos y pro_nombre. Se consultan igual con cualquiera de las dos.

   Reglas del modelo
   - Sin relaciones N:N: cada una se resuelve con una entidad débil cuya llave
     primaria es la unión de las llaves de las dos fuertes.
   - Sin relaciones 1:1 y sin herencia.
   - Todas las tablas tienen al menos una relación y forman un solo grupo.
   - En 3FN: los datos que se pueden calcular (totales, IVA de un pedido, si
     el correo está verificado) salen de las vistas del final, no se guardan.
     El precio y el porcentaje de IVA de cada línea del pedido sí se guardan:
     son los de ese día, y el catálogo puede cambiar después.

   - Los documentos (orden de compra, recepción, ajuste, orden de producción,
     rol de pagos y asiento) pasan por estados: ABI abierto, PEN pendiente,
     APR aprobado, ANU anulado, REC recibido, CAN cancelado, ERR error. El
     estado va en la cabecera y las líneas lo siguen: aprobado o anulado, ni
     el documento ni sus líneas se pueden cambiar.

   Grupos (50 tablas)
   1. Autenticación y autorización: ROLES, PERMISOS, ROLES_PERMISOS (débil),
      USUARIOS, VERIFICACIONES, ACCESOS (log), AUDITORIAS (log)
   2. Ubicación: PROVINCIAS, CANTONES, DIRECCIONES
   3. Catálogo: CATEGORIAS, ETIQUETAS, TARIFAS_IVA, PRODUCTOS, TAMANOS,
      PRODUCTOS_TAMANOS (débil), ALERGENOS, PRODUCTOS_ALERGENOS (débil)
   4. Pedidos: TIPOS_ENTREGA, ESTADOS_PEDIDO, PEDIDOS, DETALLES_PEDIDO (débil)
   5. Facturación y pagos: TIPOS_IDENTIFICACION, CLIENTES, FACTURAS,
      METODOS_PAGO, PAGOS
   6. Talento humano: CARGOS, EMPLEADOS
   7. Materiales y recetas: UNIDADES_MEDIDA, METODOS_COSTEO, TIPOS_MATERIAL,
      MATERIALES, RECETAS (débil)
   8. Compras: PROVEEDORES, PROVEEDORES_MATERIALES (débil), ORDENES_COMPRA,
      DETALLES_ORDEN_COMPRA (débil), RECEPCIONES, LOTES_MATERIAL
   9. Inventario y producción: AJUSTES_INVENTARIO, DETALLES_AJUSTE (débil),
      ORDENES_PRODUCCION, CONSUMOS_PRODUCCION (débil)
   10. Contabilidad: CUENTAS_CONTABLES, ASIENTOS, DETALLES_ASIENTO (débil)
   11. Nómina: CONCEPTOS_NOMINA, NOMINAS, DETALLES_NOMINA (débil)

   Relaciones (todas 1:N; "A 1:N B" = un A tiene muchos B)
   ROLES 1:N USUARIOS                      ROLES 1:N ROLES_PERMISOS
   PERMISOS 1:N ROLES_PERMISOS             USUARIOS 1:N VERIFICACIONES
   USUARIOS 1:N DIRECCIONES                USUARIOS 1:N PEDIDOS
   USUARIOS 1:N ACCESOS                    USUARIOS 1:N AUDITORIAS
   PROVINCIAS 1:N CANTONES                 CANTONES 1:N DIRECCIONES
   DIRECCIONES 1:N PEDIDOS                 CATEGORIAS 1:N PRODUCTOS
   ETIQUETAS 1:N PRODUCTOS                 TARIFAS_IVA 1:N PRODUCTOS
   PRODUCTOS 1:N PRODUCTOS_TAMANOS         TAMANOS 1:N PRODUCTOS_TAMANOS
   PRODUCTOS 1:N PRODUCTOS_ALERGENOS       ALERGENOS 1:N PRODUCTOS_ALERGENOS
   PRODUCTOS_TAMANOS 1:N DETALLES_PEDIDO   PEDIDOS 1:N DETALLES_PEDIDO
   TIPOS_ENTREGA 1:N PEDIDOS               ESTADOS_PEDIDO 1:N PEDIDOS
   PEDIDOS 1:N FACTURAS                    CLIENTES 1:N FACTURAS
   TIPOS_IDENTIFICACION 1:N CLIENTES       PEDIDOS 1:N PAGOS
   METODOS_PAGO 1:N PAGOS
   CARGOS 1:N EMPLEADOS                    CANTONES 1:N EMPLEADOS
   EMPLEADOS 1:N USUARIOS (opcional)
   UNIDADES_MEDIDA 1:N MATERIALES (x2)     METODOS_COSTEO 1:N MATERIALES
   TIPOS_MATERIAL 1:N MATERIALES           TARIFAS_IVA 1:N MATERIALES
   PRODUCTOS_TAMANOS 1:N RECETAS           MATERIALES 1:N RECETAS
   TIPOS_IDENTIFICACION 1:N PROVEEDORES    CANTONES 1:N PROVEEDORES
   PROVEEDORES 1:N PROVEEDORES_MATERIALES  MATERIALES 1:N PROVEEDORES_MATERIALES
   PROVEEDORES 1:N ORDENES_COMPRA          EMPLEADOS 1:N ORDENES_COMPRA
   ORDENES_COMPRA 1:N DETALLES_ORDEN_COMPRA MATERIALES 1:N DETALLES_ORDEN_COMPRA
   ORDENES_COMPRA 1:N RECEPCIONES          EMPLEADOS 1:N RECEPCIONES
   MATERIALES 1:N LOTES_MATERIAL           RECEPCIONES 1:N LOTES_MATERIAL
   DETALLES_ORDEN_COMPRA 1:N LOTES_MATERIAL EMPLEADOS 1:N AJUSTES_INVENTARIO (x2)
   AJUSTES_INVENTARIO 1:N DETALLES_AJUSTE  LOTES_MATERIAL 1:N DETALLES_AJUSTE
   PRODUCTOS_TAMANOS 1:N ORDENES_PRODUCCION EMPLEADOS 1:N ORDENES_PRODUCCION
   ORDENES_PRODUCCION 1:N CONSUMOS_PRODUCCION LOTES_MATERIAL 1:N CONSUMOS_PRODUCCION
   EMPLEADOS 1:N ASIENTOS                  ASIENTOS 1:N DETALLES_ASIENTO
   CUENTAS_CONTABLES 1:N DETALLES_ASIENTO  CUENTAS_CONTABLES 1:N CONCEPTOS_NOMINA
   EMPLEADOS 1:N NOMINAS                   NOMINAS 1:N DETALLES_NOMINA
   CONCEPTOS_NOMINA 1:N DETALLES_NOMINA

   Lo que el profesor pidió y dónde está
   - Unidad de compra y de producción: MATERIALES (UMI_CodigoCompra,
     UMI_CodigoProduccion y MAT_FactorConversion: 1 qq = 45359,2 g).
   - Materiales distintos de productos: MATERIALES es lo que se compra;
     PRODUCTOS, lo que se vende. Las bebidas que se revenden son materiales
     con una receta de 1 unidad.
   - Recetas: RECETAS, por producto y tamaño.
   - Perecibles por lote: LOTES_MATERIAL, con fecha de ingreso y caducidad,
     cantidad inicial y costo unitario. El saldo se calcula (VW_LOTES_SALDO).
   - FEFO, FIFO, LIFO y costo promedio: METODOS_COSTEO, uno por material. El
     kardex es VW_KARDEX: se arma con lotes, ajustes y consumos, que ya están
     guardados, en vez de copiarlos a otra tabla.
   - Producción: ORDENES_PRODUCCION y CONSUMOS_PRODUCCION (qué lote se usó).

   Un pedido puede tener varias facturas porque una factura anulada se vuelve
   a emitir; solo una puede estar vigente a la vez (índice UX_FACTURAS_Vigente).
   ========================================================================== */


/* -----------------------------------------------------------------------------
   Paso 1. Crear la base. Se ejecuta conectado a la base "postgres".
   En pgAdmin: ejecutar estas dos sentencias, abrir otra ventana de consultas
   sobre BD_EL_TRADICIONAL y ejecutar desde el paso 2. En psql, \connect
   cambia de base solo.
   -------------------------------------------------------------------------- */

-- DROP DATABASE IF EXISTS BD_EL_TRADICIONAL;   -- borra todo: solo para empezar de cero
CREATE DATABASE BD_EL_TRADICIONAL ENCODING 'UTF8' TEMPLATE template0;
ALTER DATABASE BD_EL_TRADICIONAL SET timezone TO 'America/Guayaquil';

\connect bd_el_tradicional


/* -----------------------------------------------------------------------------
   Paso 2. Tablas, reglas, vistas y datos iniciales.
   Va en una transacción: si algo falla, no queda nada a medias.
   -------------------------------------------------------------------------- */

BEGIN;


/* =============================================================================
   Funciones de validación (contexto ecuatoriano)
   ========================================================================== */

-- Cédula: 10 dígitos, provincia 01-24, tercer dígito menor que 6 y dígito
-- verificador por módulo 10 (la misma regla que usa el registro civil).
CREATE FUNCTION FN_CEDULA_VALIDA(p_cedula TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_suma   INTEGER := 0;
    v_digito INTEGER;
BEGIN
    IF p_cedula IS NULL OR p_cedula !~ '^[0-9]{10}$' THEN
        RETURN FALSE;
    END IF;
    IF SUBSTRING(p_cedula, 1, 2)::INTEGER NOT BETWEEN 1 AND 24
       OR SUBSTRING(p_cedula, 3, 1)::INTEGER > 5 THEN
        RETURN FALSE;
    END IF;
    FOR i IN 1..9 LOOP
        v_digito := SUBSTRING(p_cedula, i, 1)::INTEGER * (2 - (i + 1) % 2);
        IF v_digito > 9 THEN
            v_digito := v_digito - 9;
        END IF;
        v_suma := v_suma + v_digito;
    END LOOP;
    RETURN (10 - v_suma % 10) % 10 = SUBSTRING(p_cedula, 10, 1)::INTEGER;
END;
$$;

-- RUC: 13 dígitos, provincia 01-24 y establecimiento distinto de 000. El de
-- persona natural es su cédula más el establecimiento, así que se revisa la
-- cédula. El de sociedades (tercer dígito 9) y entidades públicas (6) no se
-- revisa por módulo 11: el SRI ya emite RUC que no lo cumplen.
CREATE FUNCTION FN_RUC_VALIDO(p_ruc TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_tercero INTEGER;
BEGIN
    IF p_ruc IS NULL OR p_ruc !~ '^[0-9]{13}$' OR RIGHT(p_ruc, 3) = '000' THEN
        RETURN FALSE;
    END IF;
    IF SUBSTRING(p_ruc, 1, 2)::INTEGER NOT BETWEEN 1 AND 24 THEN
        RETURN FALSE;
    END IF;
    v_tercero := SUBSTRING(p_ruc, 3, 1)::INTEGER;
    IF v_tercero < 6 THEN
        RETURN FN_CEDULA_VALIDA(LEFT(p_ruc, 10));
    END IF;
    RETURN v_tercero IN (6, 9);
END;
$$;

-- Revisa el número según el tipo de identificación del SRI:
-- 04 RUC, 05 cédula, 06 pasaporte, 07 consumidor final (siempre 13 nueves).
CREATE FUNCTION FN_IDENTIFICACION_VALIDA(p_tipo TEXT, p_numero TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE p_tipo
        WHEN '04' THEN FN_RUC_VALIDO(p_numero)
        WHEN '05' THEN FN_CEDULA_VALIDA(p_numero)
        WHEN '06' THEN p_numero ~ '^[A-Z0-9]{5,20}$'
        WHEN '07' THEN p_numero = '9999999999999'
        ELSE FALSE
    END;
$$;


/* =============================================================================
   Grupo 1. Autenticación y autorización
   ========================================================================== */

CREATE SEQUENCE SEQ_ROLES MAXVALUE 999;
CREATE TABLE ROLES (
    ROL_Codigo      CHAR(6)      NOT NULL DEFAULT 'ROL' || LPAD(nextval('SEQ_ROLES')::TEXT, 3, '0'),
    ROL_Nombre      VARCHAR(30)  NOT NULL,
    ROL_Descripcion VARCHAR(150),
    CONSTRAINT PK_ROLES PRIMARY KEY (ROL_Codigo),
    CONSTRAINT UQ_ROLES_Nombre UNIQUE (ROL_Nombre),
    CONSTRAINT CK_ROLES_Codigo CHECK (ROL_Codigo ~ '^ROL[0-9]{3}$')
);
ALTER SEQUENCE SEQ_ROLES OWNED BY ROLES.ROL_Codigo;

CREATE SEQUENCE SEQ_PERMISOS MAXVALUE 999;
CREATE TABLE PERMISOS (
    PER_Codigo      CHAR(6)      NOT NULL DEFAULT 'PER' || LPAD(nextval('SEQ_PERMISOS')::TEXT, 3, '0'),
    PER_Nombre      VARCHAR(50)  NOT NULL,   -- recurso.accion, p. ej. 'pedidos.crear'
    PER_Descripcion VARCHAR(150),
    CONSTRAINT PK_PERMISOS PRIMARY KEY (PER_Codigo),
    CONSTRAINT UQ_PERMISOS_Nombre UNIQUE (PER_Nombre),
    CONSTRAINT CK_PERMISOS_Codigo CHECK (PER_Codigo ~ '^PER[0-9]{3}$'),
    CONSTRAINT CK_PERMISOS_Nombre CHECK (PER_Nombre ~ '^[a-z_]+\.[a-z_]+$')
);
ALTER SEQUENCE SEQ_PERMISOS OWNED BY PERMISOS.PER_Codigo;

-- Débil: resuelve ROLES N:N PERMISOS.
CREATE TABLE ROLES_PERMISOS (
    ROL_Codigo          CHAR(6)     NOT NULL,
    PER_Codigo          CHAR(6)     NOT NULL,
    RPE_FechaAsignacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT PK_ROLES_PERMISOS PRIMARY KEY (ROL_Codigo, PER_Codigo),
    CONSTRAINT FK_ROLES_PERMISOS_ROLES FOREIGN KEY (ROL_Codigo)
        REFERENCES ROLES (ROL_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_ROLES_PERMISOS_PERMISOS FOREIGN KEY (PER_Codigo)
        REFERENCES PERMISOS (PER_Codigo) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IX_ROLES_PERMISOS_Permiso ON ROLES_PERMISOS (PER_Codigo);

-- La contraseña no está en esta base: la guarda Supabase Auth (auth.users),
-- que también verifica el correo. USU_CodigoAuth es el id de la cuenta allí;
-- su llave foránea se crea al final, solo si la base es la de Supabase.
-- EMP_Codigo dice de qué empleado es la cuenta (vacío si es de un cliente).
-- Un empleado puede tener varias: la de trabajo, una personal, o una nueva si
-- la vieja se desactiva. Su llave foránea se crea después de EMPLEADOS.
CREATE SEQUENCE SEQ_USUARIOS MAXVALUE 9999999;
CREATE TABLE USUARIOS (
    USU_Codigo         CHAR(10)     NOT NULL DEFAULT 'USU' || LPAD(nextval('SEQ_USUARIOS')::TEXT, 7, '0'),
    ROL_Codigo         CHAR(6)      NOT NULL,
    EMP_Codigo         CHAR(10),
    USU_Nombres        VARCHAR(60)  NOT NULL,
    USU_Apellidos      VARCHAR(60)  NOT NULL,
    USU_Correo         VARCHAR(254) NOT NULL,
    USU_Celular        CHAR(10)     NOT NULL,   -- formato nacional: 09XXXXXXXX
    USU_CodigoAuth     UUID         NOT NULL,   -- el id en Supabase Auth
    USU_Activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    USU_FechaRegistro  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT PK_USUARIOS PRIMARY KEY (USU_Codigo),
    CONSTRAINT UQ_USUARIOS_Correo UNIQUE (USU_Correo),
    CONSTRAINT UQ_USUARIOS_CodigoAuth UNIQUE (USU_CodigoAuth),
    CONSTRAINT FK_USUARIOS_ROLES FOREIGN KEY (ROL_Codigo)
        REFERENCES ROLES (ROL_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_USUARIOS_Codigo CHECK (USU_Codigo ~ '^USU[0-9]{7}$'),
    CONSTRAINT CK_USUARIOS_Nombres CHECK (btrim(USU_Nombres) <> ''),
    CONSTRAINT CK_USUARIOS_Apellidos CHECK (btrim(USU_Apellidos) <> ''),
    -- En minúsculas, para que Ana@x.com y ana@x.com no sean dos cuentas.
    CONSTRAINT CK_USUARIOS_Correo CHECK (
        USU_Correo = lower(USU_Correo)
        AND USU_Correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    CONSTRAINT CK_USUARIOS_Celular CHECK (USU_Celular ~ '^09[0-9]{8}$')
);
ALTER SEQUENCE SEQ_USUARIOS OWNED BY USUARIOS.USU_Codigo;
CREATE INDEX IX_USUARIOS_Rol ON USUARIOS (ROL_Codigo);

-- Códigos de 6 cifras que se mandan por correo para verificar la cuenta.
-- El correo está verificado si alguno de sus códigos se usó (VW_USUARIOS).
CREATE SEQUENCE SEQ_VERIFICACIONES MAXVALUE 9999999;
CREATE TABLE VERIFICACIONES (
    VER_Codigo      CHAR(10)    NOT NULL DEFAULT 'VER' || LPAD(nextval('SEQ_VERIFICACIONES')::TEXT, 7, '0'),
    USU_Codigo      CHAR(10)    NOT NULL,
    VER_Clave       CHAR(6)     NOT NULL,
    VER_FechaEnvio  TIMESTAMPTZ NOT NULL DEFAULT now(),
    VER_FechaExpira TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
    VER_FechaUso    TIMESTAMPTZ,
    VER_Intentos    SMALLINT    NOT NULL DEFAULT 0,
    CONSTRAINT PK_VERIFICACIONES PRIMARY KEY (VER_Codigo),
    CONSTRAINT FK_VERIFICACIONES_USUARIOS FOREIGN KEY (USU_Codigo)
        REFERENCES USUARIOS (USU_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT CK_VERIFICACIONES_Codigo CHECK (VER_Codigo ~ '^VER[0-9]{7}$'),
    CONSTRAINT CK_VERIFICACIONES_Clave CHECK (VER_Clave ~ '^[0-9]{6}$'),
    CONSTRAINT CK_VERIFICACIONES_Expira CHECK (VER_FechaExpira > VER_FechaEnvio),
    CONSTRAINT CK_VERIFICACIONES_Uso CHECK (
        VER_FechaUso IS NULL OR VER_FechaUso BETWEEN VER_FechaEnvio AND VER_FechaExpira),
    CONSTRAINT CK_VERIFICACIONES_Intentos CHECK (VER_Intentos BETWEEN 0 AND 5)
);
ALTER SEQUENCE SEQ_VERIFICACIONES OWNED BY VERIFICACIONES.VER_Codigo;
CREATE INDEX IX_VERIFICACIONES_Usuario ON VERIFICACIONES (USU_Codigo);

-- Log de inicios de sesión: cada intento, salga bien o mal. Solo se anotan
-- los de cuentas que existen. Con 5 fallos seguidos en 15 minutos la cuenta
-- se bloquea: el siguiente intento, aunque la clave esté bien, queda como BLO
-- (TG_ACCESOS_BLOQUEO). Es un registro: no se cambia ni se borra.
CREATE SEQUENCE SEQ_ACCESOS MAXVALUE 999999999;
CREATE TABLE ACCESOS (
    ACC_Codigo  CHAR(12)    NOT NULL DEFAULT 'ACC' || LPAD(nextval('SEQ_ACCESOS')::TEXT, 9, '0'),
    USU_Codigo  CHAR(10)    NOT NULL,
    ACC_Fecha   TIMESTAMPTZ NOT NULL DEFAULT now(),
    ACC_Exitoso BOOLEAN     NOT NULL,
    -- Por qué falló: CLA clave incorrecta, NVE correo sin verificar,
    -- INA cuenta inactiva, BLO cuenta bloqueada por intentos
    ACC_Motivo  CHAR(3),
    CONSTRAINT PK_ACCESOS PRIMARY KEY (ACC_Codigo),
    CONSTRAINT FK_ACCESOS_USUARIOS FOREIGN KEY (USU_Codigo)
        REFERENCES USUARIOS (USU_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_ACCESOS_Codigo CHECK (ACC_Codigo ~ '^ACC[0-9]{9}$'),
    CONSTRAINT CK_ACCESOS_Motivo CHECK (ACC_Motivo IN ('CLA', 'NVE', 'INA', 'BLO')),
    CONSTRAINT CK_ACCESOS_Resultado CHECK (ACC_Exitoso = (ACC_Motivo IS NULL))
);
ALTER SEQUENCE SEQ_ACCESOS OWNED BY ACCESOS.ACC_Codigo;
CREATE INDEX IX_ACCESOS_Usuario ON ACCESOS (USU_Codigo, ACC_Fecha);

-- Log de cambios: quién creó, cambió o borró algo importante y cómo estaba
-- la fila antes y después. Lo llena solo TG_<TABLA>_AUDITORIA. La foto de
-- la fila en JSON es historia (como el precio del día en el pedido), no un
-- dato repetido. Quién lo hizo sale de la variable app.usuario de la
-- conexión; si no se dio (carga inicial, editor SQL), queda vacío. Es un
-- registro: no se cambia ni se borra.
CREATE SEQUENCE SEQ_AUDITORIAS MAXVALUE 999999999;
CREATE TABLE AUDITORIAS (
    AUD_Codigo    CHAR(12)    NOT NULL DEFAULT 'AUD' || LPAD(nextval('SEQ_AUDITORIAS')::TEXT, 9, '0'),
    USU_Codigo    CHAR(10),
    AUD_Fecha     TIMESTAMPTZ NOT NULL DEFAULT now(),
    AUD_Tabla     VARCHAR(40) NOT NULL,
    AUD_Operacion CHAR(1)     NOT NULL,   -- I creó, U cambió, D borró
    AUD_Clave     VARCHAR(60) NOT NULL,   -- la llave de la fila; si es compuesta, unida con |
    AUD_Antes     JSONB,
    AUD_Despues   JSONB,
    CONSTRAINT PK_AUDITORIAS PRIMARY KEY (AUD_Codigo),
    CONSTRAINT FK_AUDITORIAS_USUARIOS FOREIGN KEY (USU_Codigo)
        REFERENCES USUARIOS (USU_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_AUDITORIAS_Codigo CHECK (AUD_Codigo ~ '^AUD[0-9]{9}$'),
    CONSTRAINT CK_AUDITORIAS_Operacion CHECK (AUD_Operacion IN ('I', 'U', 'D')),
    CONSTRAINT CK_AUDITORIAS_Filas CHECK (
        (AUD_Operacion = 'I' AND AUD_Antes IS NULL AND AUD_Despues IS NOT NULL)
        OR (AUD_Operacion = 'U' AND AUD_Antes IS NOT NULL AND AUD_Despues IS NOT NULL)
        OR (AUD_Operacion = 'D' AND AUD_Antes IS NOT NULL AND AUD_Despues IS NULL))
);
ALTER SEQUENCE SEQ_AUDITORIAS OWNED BY AUDITORIAS.AUD_Codigo;
CREATE INDEX IX_AUDITORIAS_Usuario ON AUDITORIAS (USU_Codigo);
CREATE INDEX IX_AUDITORIAS_Fila ON AUDITORIAS (AUD_Tabla, AUD_Clave);


/* =============================================================================
   Grupo 2. Ubicación
   ========================================================================== */

CREATE TABLE PROVINCIAS (
    PRV_Codigo CHAR(2)     NOT NULL,   -- código INEC
    PRV_Nombre VARCHAR(40) NOT NULL,
    CONSTRAINT PK_PROVINCIAS PRIMARY KEY (PRV_Codigo),
    CONSTRAINT UQ_PROVINCIAS_Nombre UNIQUE (PRV_Nombre),
    CONSTRAINT CK_PROVINCIAS_Codigo CHECK (PRV_Codigo ~ '^(0[1-9]|1[0-9]|2[0-4])$')
);

CREATE TABLE CANTONES (
    CAN_Codigo CHAR(4)     NOT NULL,   -- código INEC: provincia + 2 dígitos
    PRV_Codigo CHAR(2)     NOT NULL,
    CAN_Nombre VARCHAR(60) NOT NULL,
    CONSTRAINT PK_CANTONES PRIMARY KEY (CAN_Codigo),
    CONSTRAINT UQ_CANTONES_Nombre UNIQUE (PRV_Codigo, CAN_Nombre),
    CONSTRAINT FK_CANTONES_PROVINCIAS FOREIGN KEY (PRV_Codigo)
        REFERENCES PROVINCIAS (PRV_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_CANTONES_Codigo CHECK (
        CAN_Codigo ~ '^[0-9]{4}$' AND LEFT(CAN_Codigo, 2) = PRV_Codigo)
);

-- Direcciones de entrega que guarda cada usuario ("Casa", "Trabajo").
CREATE SEQUENCE SEQ_DIRECCIONES MAXVALUE 9999999;
CREATE TABLE DIRECCIONES (
    DIR_Codigo          CHAR(10)     NOT NULL DEFAULT 'DIR' || LPAD(nextval('SEQ_DIRECCIONES')::TEXT, 7, '0'),
    USU_Codigo          CHAR(10)     NOT NULL,
    CAN_Codigo          CHAR(4)      NOT NULL,
    DIR_Alias           VARCHAR(30)  NOT NULL DEFAULT 'Casa',
    DIR_CallePrincipal  VARCHAR(80)  NOT NULL,
    DIR_CalleSecundaria VARCHAR(80),
    DIR_Numeracion      VARCHAR(10),            -- 'N12-34', 'S/N'
    DIR_Referencia      VARCHAR(150),           -- 'frente al parque'
    CONSTRAINT PK_DIRECCIONES PRIMARY KEY (DIR_Codigo),
    -- La usa PEDIDOS para exigir que la dirección sea del mismo usuario.
    CONSTRAINT UQ_DIRECCIONES_Usuario UNIQUE (DIR_Codigo, USU_Codigo),
    CONSTRAINT UQ_DIRECCIONES_Alias UNIQUE (USU_Codigo, DIR_Alias),
    CONSTRAINT FK_DIRECCIONES_USUARIOS FOREIGN KEY (USU_Codigo)
        REFERENCES USUARIOS (USU_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_DIRECCIONES_CANTONES FOREIGN KEY (CAN_Codigo)
        REFERENCES CANTONES (CAN_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DIRECCIONES_Codigo CHECK (DIR_Codigo ~ '^DIR[0-9]{7}$'),
    CONSTRAINT CK_DIRECCIONES_CallePrincipal CHECK (btrim(DIR_CallePrincipal) <> '')
);
ALTER SEQUENCE SEQ_DIRECCIONES OWNED BY DIRECCIONES.DIR_Codigo;
CREATE INDEX IX_DIRECCIONES_Canton ON DIRECCIONES (CAN_Codigo);


/* =============================================================================
   Grupo 3. Catálogo
   ========================================================================== */

CREATE SEQUENCE SEQ_CATEGORIAS MAXVALUE 999;
CREATE TABLE CATEGORIAS (
    CAT_Codigo CHAR(6)     NOT NULL DEFAULT 'CAT' || LPAD(nextval('SEQ_CATEGORIAS')::TEXT, 3, '0'),
    CAT_Nombre VARCHAR(40) NOT NULL,   -- lo que se lee: 'Bebidas frías'
    CAT_Slug   VARCHAR(40) NOT NULL,   -- lo que usa el sitio: 'bebidas-frias'
    CONSTRAINT PK_CATEGORIAS PRIMARY KEY (CAT_Codigo),
    CONSTRAINT UQ_CATEGORIAS_Nombre UNIQUE (CAT_Nombre),
    CONSTRAINT UQ_CATEGORIAS_Slug UNIQUE (CAT_Slug),
    CONSTRAINT CK_CATEGORIAS_Codigo CHECK (CAT_Codigo ~ '^CAT[0-9]{3}$'),
    CONSTRAINT CK_CATEGORIAS_Slug CHECK (CAT_Slug ~ '^[a-z]+(-[a-z]+)*$')
);
ALTER SEQUENCE SEQ_CATEGORIAS OWNED BY CATEGORIAS.CAT_Codigo;

-- El sello redondo de la ficha ("De la casa").
CREATE SEQUENCE SEQ_ETIQUETAS MAXVALUE 999;
CREATE TABLE ETIQUETAS (
    ETI_Codigo CHAR(6)     NOT NULL DEFAULT 'ETI' || LPAD(nextval('SEQ_ETIQUETAS')::TEXT, 3, '0'),
    ETI_Texto  VARCHAR(30) NOT NULL,
    ETI_Color  VARCHAR(10) NOT NULL,
    CONSTRAINT PK_ETIQUETAS PRIMARY KEY (ETI_Codigo),
    CONSTRAINT UQ_ETIQUETAS_Texto UNIQUE (ETI_Texto),
    CONSTRAINT CK_ETIQUETAS_Codigo CHECK (ETI_Codigo ~ '^ETI[0-9]{3}$'),
    CONSTRAINT CK_ETIQUETAS_Color CHECK (ETI_Color IN ('green', 'yellow'))
);
ALTER SEQUENCE SEQ_ETIQUETAS OWNED BY ETIQUETAS.ETI_Codigo;

-- Tarifas de IVA con su código del SRI. El pan va con tarifa 0%.
CREATE SEQUENCE SEQ_TARIFAS_IVA MAXVALUE 999;
CREATE TABLE TARIFAS_IVA (
    TIV_Codigo      CHAR(6)      NOT NULL DEFAULT 'TIV' || LPAD(nextval('SEQ_TARIFAS_IVA')::TEXT, 3, '0'),
    TIV_CodigoSri   VARCHAR(2)   NOT NULL,
    TIV_Descripcion VARCHAR(30)  NOT NULL,
    TIV_Porcentaje  NUMERIC(5,2) NOT NULL,
    CONSTRAINT PK_TARIFAS_IVA PRIMARY KEY (TIV_Codigo),
    CONSTRAINT UQ_TARIFAS_IVA_CodigoSri UNIQUE (TIV_CodigoSri),
    CONSTRAINT CK_TARIFAS_IVA_Codigo CHECK (TIV_Codigo ~ '^TIV[0-9]{3}$'),
    CONSTRAINT CK_TARIFAS_IVA_Porcentaje CHECK (TIV_Porcentaje BETWEEN 0 AND 100)
);
ALTER SEQUENCE SEQ_TARIFAS_IVA OWNED BY TARIFAS_IVA.TIV_Codigo;

-- El precio no está aquí: depende del tamaño (PRODUCTOS_TAMANOS).
CREATE SEQUENCE SEQ_PRODUCTOS MAXVALUE 999;
CREATE TABLE PRODUCTOS (
    PRO_Codigo           CHAR(6)      NOT NULL DEFAULT 'PRO' || LPAD(nextval('SEQ_PRODUCTOS')::TEXT, 3, '0'),
    CAT_Codigo           CHAR(6)      NOT NULL,
    ETI_Codigo           CHAR(6),               -- sin sello: NULL
    TIV_Codigo           CHAR(6)      NOT NULL,
    PRO_Nombre           VARCHAR(80)  NOT NULL,
    PRO_Descripcion      VARCHAR(300),
    PRO_Foto             VARCHAR(150) NOT NULL, -- ruta sin ancho ni extensión
    PRO_TextoAlternativo VARCHAR(200) NOT NULL, -- el alt de la foto
    PRO_Disponible       BOOLEAN      NOT NULL DEFAULT TRUE,
    PRO_Destacado        BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT PK_PRODUCTOS PRIMARY KEY (PRO_Codigo),
    CONSTRAINT UQ_PRODUCTOS_Nombre UNIQUE (PRO_Nombre),
    CONSTRAINT FK_PRODUCTOS_CATEGORIAS FOREIGN KEY (CAT_Codigo)
        REFERENCES CATEGORIAS (CAT_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PRODUCTOS_ETIQUETAS FOREIGN KEY (ETI_Codigo)
        REFERENCES ETIQUETAS (ETI_Codigo) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT FK_PRODUCTOS_TARIFAS_IVA FOREIGN KEY (TIV_Codigo)
        REFERENCES TARIFAS_IVA (TIV_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_PRODUCTOS_Codigo CHECK (PRO_Codigo ~ '^PRO[0-9]{3}$'),
    CONSTRAINT CK_PRODUCTOS_Nombre CHECK (btrim(PRO_Nombre) <> ''),
    CONSTRAINT CK_PRODUCTOS_Foto CHECK (PRO_Foto ~ '^assets/img/productos/[a-z0-9-]+$')
);
ALTER SEQUENCE SEQ_PRODUCTOS OWNED BY PRODUCTOS.PRO_Codigo;
CREATE INDEX IX_PRODUCTOS_Categoria ON PRODUCTOS (CAT_Codigo);

-- 'Único' para los productos que se venden en un solo tamaño.
CREATE SEQUENCE SEQ_TAMANOS MAXVALUE 999;
CREATE TABLE TAMANOS (
    TAM_Codigo      CHAR(6)     NOT NULL DEFAULT 'TAM' || LPAD(nextval('SEQ_TAMANOS')::TEXT, 3, '0'),
    TAM_Descripcion VARCHAR(20) NOT NULL,
    CONSTRAINT PK_TAMANOS PRIMARY KEY (TAM_Codigo),
    CONSTRAINT UQ_TAMANOS_Descripcion UNIQUE (TAM_Descripcion),
    CONSTRAINT CK_TAMANOS_Codigo CHECK (TAM_Codigo ~ '^TAM[0-9]{3}$')
);
ALTER SEQUENCE SEQ_TAMANOS OWNED BY TAMANOS.TAM_Codigo;

-- Débil: resuelve PRODUCTOS N:N TAMANOS. El precio es el de venta al
-- público, con IVA incluido, igual que en el sitio.
CREATE TABLE PRODUCTOS_TAMANOS (
    PRO_Codigo CHAR(6)      NOT NULL,
    TAM_Codigo CHAR(6)      NOT NULL,
    PTA_Precio NUMERIC(8,2) NOT NULL,
    PTA_Orden  SMALLINT     NOT NULL DEFAULT 1,   -- el 1 es el que sale primero
    CONSTRAINT PK_PRODUCTOS_TAMANOS PRIMARY KEY (PRO_Codigo, TAM_Codigo),
    CONSTRAINT UQ_PRODUCTOS_TAMANOS_Orden UNIQUE (PRO_Codigo, PTA_Orden),
    CONSTRAINT FK_PRODUCTOS_TAMANOS_PRODUCTOS FOREIGN KEY (PRO_Codigo)
        REFERENCES PRODUCTOS (PRO_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PRODUCTOS_TAMANOS_TAMANOS FOREIGN KEY (TAM_Codigo)
        REFERENCES TAMANOS (TAM_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_PRODUCTOS_TAMANOS_Precio CHECK (PTA_Precio > 0),
    CONSTRAINT CK_PRODUCTOS_TAMANOS_Orden CHECK (PTA_Orden > 0)
);
CREATE INDEX IX_PRODUCTOS_TAMANOS_Tamano ON PRODUCTOS_TAMANOS (TAM_Codigo);

CREATE SEQUENCE SEQ_ALERGENOS MAXVALUE 999;
CREATE TABLE ALERGENOS (
    ALE_Codigo CHAR(6)     NOT NULL DEFAULT 'ALE' || LPAD(nextval('SEQ_ALERGENOS')::TEXT, 3, '0'),
    ALE_Nombre VARCHAR(40) NOT NULL,
    CONSTRAINT PK_ALERGENOS PRIMARY KEY (ALE_Codigo),
    CONSTRAINT UQ_ALERGENOS_Nombre UNIQUE (ALE_Nombre),
    CONSTRAINT CK_ALERGENOS_Codigo CHECK (ALE_Codigo ~ '^ALE[0-9]{3}$')
);
ALTER SEQUENCE SEQ_ALERGENOS OWNED BY ALERGENOS.ALE_Codigo;

-- Débil: resuelve PRODUCTOS N:N ALERGENOS. PAL_Trazas = TRUE cuando no es
-- ingrediente pero "puede contener trazas".
CREATE TABLE PRODUCTOS_ALERGENOS (
    PRO_Codigo CHAR(6) NOT NULL,
    ALE_Codigo CHAR(6) NOT NULL,
    PAL_Trazas BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT PK_PRODUCTOS_ALERGENOS PRIMARY KEY (PRO_Codigo, ALE_Codigo),
    CONSTRAINT FK_PRODUCTOS_ALERGENOS_PRODUCTOS FOREIGN KEY (PRO_Codigo)
        REFERENCES PRODUCTOS (PRO_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PRODUCTOS_ALERGENOS_ALERGENOS FOREIGN KEY (ALE_Codigo)
        REFERENCES ALERGENOS (ALE_Codigo) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IX_PRODUCTOS_ALERGENOS_Alergeno ON PRODUCTOS_ALERGENOS (ALE_Codigo);


/* =============================================================================
   Grupo 4. Pedidos
   ========================================================================== */

CREATE SEQUENCE SEQ_TIPOS_ENTREGA MAXVALUE 999;
CREATE TABLE TIPOS_ENTREGA (
    TEN_Codigo        CHAR(6)      NOT NULL DEFAULT 'TEN' || LPAD(nextval('SEQ_TIPOS_ENTREGA')::TEXT, 3, '0'),
    TEN_Nombre        VARCHAR(30)  NOT NULL,
    TEN_Costo         NUMERIC(6,2) NOT NULL DEFAULT 0,
    TEN_PideDireccion BOOLEAN      NOT NULL,
    CONSTRAINT PK_TIPOS_ENTREGA PRIMARY KEY (TEN_Codigo),
    CONSTRAINT UQ_TIPOS_ENTREGA_Nombre UNIQUE (TEN_Nombre),
    CONSTRAINT CK_TIPOS_ENTREGA_Codigo CHECK (TEN_Codigo ~ '^TEN[0-9]{3}$'),
    CONSTRAINT CK_TIPOS_ENTREGA_Costo CHECK (TEN_Costo >= 0)
);
ALTER SEQUENCE SEQ_TIPOS_ENTREGA OWNED BY TIPOS_ENTREGA.TEN_Codigo;

CREATE SEQUENCE SEQ_ESTADOS_PEDIDO MAXVALUE 999;
CREATE TABLE ESTADOS_PEDIDO (
    EPE_Codigo CHAR(6)     NOT NULL DEFAULT 'EPE' || LPAD(nextval('SEQ_ESTADOS_PEDIDO')::TEXT, 3, '0'),
    EPE_Nombre VARCHAR(30) NOT NULL,
    EPE_Orden  SMALLINT    NOT NULL,   -- orden en que avanza un pedido
    CONSTRAINT PK_ESTADOS_PEDIDO PRIMARY KEY (EPE_Codigo),
    CONSTRAINT UQ_ESTADOS_PEDIDO_Nombre UNIQUE (EPE_Nombre),
    CONSTRAINT UQ_ESTADOS_PEDIDO_Orden UNIQUE (EPE_Orden),
    CONSTRAINT CK_ESTADOS_PEDIDO_Codigo CHECK (EPE_Codigo ~ '^EPE[0-9]{3}$')
);
ALTER SEQUENCE SEQ_ESTADOS_PEDIDO OWNED BY ESTADOS_PEDIDO.EPE_Codigo;

-- PED_Numero es el que ve el cliente: ET- y 4 caracteres sin 0, 1, I ni O,
-- que se confunden. PED_CostoEnvio es el del día del pedido; si no se manda,
-- lo copia TG_PEDIDOS_ENTREGA desde TIPOS_ENTREGA. PED_ClaveEnvio la pone
-- la página en cada intento de pagar: si la respuesta se pierde y lo vuelve
-- a mandar, FN_PEDIDOS_REGISTRAR devuelve el que ya hizo en vez de otro.
CREATE SEQUENCE SEQ_PEDIDOS MAXVALUE 9999999;
CREATE TABLE PEDIDOS (
    PED_Codigo      CHAR(10)     NOT NULL DEFAULT 'PED' || LPAD(nextval('SEQ_PEDIDOS')::TEXT, 7, '0'),
    USU_Codigo      CHAR(10)     NOT NULL,
    TEN_Codigo      CHAR(6)      NOT NULL,
    DIR_Codigo      CHAR(10),                -- solo si la entrega es a domicilio
    EPE_Codigo      CHAR(6)      NOT NULL,
    PED_Numero      CHAR(7)      NOT NULL,
    PED_Fecha       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PED_CostoEnvio  NUMERIC(6,2) NOT NULL,
    PED_Observacion VARCHAR(250),
    PED_ClaveEnvio  UUID,
    CONSTRAINT PK_PEDIDOS PRIMARY KEY (PED_Codigo),
    CONSTRAINT UQ_PEDIDOS_Numero UNIQUE (PED_Numero),
    CONSTRAINT UQ_PEDIDOS_ClaveEnvio UNIQUE (PED_ClaveEnvio),
    CONSTRAINT FK_PEDIDOS_USUARIOS FOREIGN KEY (USU_Codigo)
        REFERENCES USUARIOS (USU_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PEDIDOS_TIPOS_ENTREGA FOREIGN KEY (TEN_Codigo)
        REFERENCES TIPOS_ENTREGA (TEN_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Con el usuario en la llave, la dirección tiene que ser de quien pide.
    CONSTRAINT FK_PEDIDOS_DIRECCIONES FOREIGN KEY (DIR_Codigo, USU_Codigo)
        REFERENCES DIRECCIONES (DIR_Codigo, USU_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PEDIDOS_ESTADOS_PEDIDO FOREIGN KEY (EPE_Codigo)
        REFERENCES ESTADOS_PEDIDO (EPE_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_PEDIDOS_Codigo CHECK (PED_Codigo ~ '^PED[0-9]{7}$'),
    CONSTRAINT CK_PEDIDOS_Numero CHECK (PED_Numero ~ '^ET-[2-9A-HJ-NP-Z]{4}$'),
    CONSTRAINT CK_PEDIDOS_CostoEnvio CHECK (PED_CostoEnvio >= 0)
);
ALTER SEQUENCE SEQ_PEDIDOS OWNED BY PEDIDOS.PED_Codigo;
CREATE INDEX IX_PEDIDOS_Usuario ON PEDIDOS (USU_Codigo, PED_Fecha DESC);
CREATE INDEX IX_PEDIDOS_Direccion ON PEDIDOS (DIR_Codigo);
CREATE INDEX IX_PEDIDOS_Estado ON PEDIDOS (EPE_Codigo);

-- Débil: resuelve PEDIDOS N:N PRODUCTOS_TAMANOS (lo que se vende es un
-- producto en un tamaño). Precio e IVA son los del día; si no se mandan, los
-- copia TG_DETALLES_PEDIDO_PRECIO desde el catálogo. Máximo 100 por línea,
-- como en la canasta del sitio.
CREATE TABLE DETALLES_PEDIDO (
    PED_Codigo         CHAR(10)     NOT NULL,
    PRO_Codigo         CHAR(6)      NOT NULL,
    TAM_Codigo         CHAR(6)      NOT NULL,
    DPE_Cantidad       SMALLINT     NOT NULL,
    DPE_PrecioUnitario NUMERIC(8,2) NOT NULL,
    DPE_PorcentajeIva  NUMERIC(5,2) NOT NULL,
    CONSTRAINT PK_DETALLES_PEDIDO PRIMARY KEY (PED_Codigo, PRO_Codigo, TAM_Codigo),
    CONSTRAINT FK_DETALLES_PEDIDO_PEDIDOS FOREIGN KEY (PED_Codigo)
        REFERENCES PEDIDOS (PED_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_DETALLES_PEDIDO_PRODUCTOS_TAMANOS FOREIGN KEY (PRO_Codigo, TAM_Codigo)
        REFERENCES PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DETALLES_PEDIDO_Cantidad CHECK (DPE_Cantidad BETWEEN 1 AND 100),
    CONSTRAINT CK_DETALLES_PEDIDO_Precio CHECK (DPE_PrecioUnitario > 0),
    CONSTRAINT CK_DETALLES_PEDIDO_Iva CHECK (DPE_PorcentajeIva BETWEEN 0 AND 100)
);
CREATE INDEX IX_DETALLES_PEDIDO_Producto ON DETALLES_PEDIDO (PRO_Codigo, TAM_Codigo);


/* =============================================================================
   Grupo 5. Facturación y pagos
   ========================================================================== */

CREATE TABLE TIPOS_IDENTIFICACION (
    TID_Codigo CHAR(2)     NOT NULL,   -- código del SRI
    TID_Nombre VARCHAR(30) NOT NULL,
    CONSTRAINT PK_TIPOS_IDENTIFICACION PRIMARY KEY (TID_Codigo),
    CONSTRAINT UQ_TIPOS_IDENTIFICACION_Nombre UNIQUE (TID_Nombre),
    CONSTRAINT CK_TIPOS_IDENTIFICACION_Codigo CHECK (TID_Codigo IN ('04', '05', '06', '07'))
);

-- A quién se factura: el mismo usuario u otra persona o empresa.
CREATE SEQUENCE SEQ_CLIENTES MAXVALUE 9999999;
CREATE TABLE CLIENTES (
    CLI_Codigo         CHAR(10)     NOT NULL DEFAULT 'CLI' || LPAD(nextval('SEQ_CLIENTES')::TEXT, 7, '0'),
    TID_Codigo         CHAR(2)      NOT NULL,
    CLI_Identificacion VARCHAR(20)  NOT NULL,
    CLI_RazonSocial    VARCHAR(150) NOT NULL,   -- nombres y apellidos, o la empresa
    CLI_Correo         VARCHAR(254),
    CLI_Telefono       VARCHAR(10),
    CLI_Direccion      VARCHAR(200),
    CONSTRAINT PK_CLIENTES PRIMARY KEY (CLI_Codigo),
    CONSTRAINT UQ_CLIENTES_Identificacion UNIQUE (TID_Codigo, CLI_Identificacion),
    CONSTRAINT FK_CLIENTES_TIPOS_IDENTIFICACION FOREIGN KEY (TID_Codigo)
        REFERENCES TIPOS_IDENTIFICACION (TID_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_CLIENTES_Codigo CHECK (CLI_Codigo ~ '^CLI[0-9]{7}$'),
    CONSTRAINT CK_CLIENTES_Identificacion CHECK (FN_IDENTIFICACION_VALIDA(TID_Codigo, CLI_Identificacion)),
    CONSTRAINT CK_CLIENTES_RazonSocial CHECK (btrim(CLI_RazonSocial) <> ''),
    CONSTRAINT CK_CLIENTES_Correo CHECK (
        CLI_Correo = lower(CLI_Correo)
        AND CLI_Correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    -- Celular 09XXXXXXXX o fijo con código de provincia 0XXXXXXXX.
    CONSTRAINT CK_CLIENTES_Telefono CHECK (CLI_Telefono ~ '^(09[0-9]{8}|0[2-7][0-9]{7})$')
);
ALTER SEQUENCE SEQ_CLIENTES OWNED BY CLIENTES.CLI_Codigo;

-- Número de factura del SRI: establecimiento-punto de emisión-secuencial
-- (001-001-000000123). El secuencial lo pone TG_FACTURAS_SECUENCIAL.
-- La clave de acceso de 49 dígitos llega al autorizarla.
-- Una factura sin fecha de anulación está vigente.
CREATE SEQUENCE SEQ_FACTURAS MAXVALUE 9999999;
CREATE TABLE FACTURAS (
    FAC_Codigo          CHAR(10)    NOT NULL DEFAULT 'FAC' || LPAD(nextval('SEQ_FACTURAS')::TEXT, 7, '0'),
    PED_Codigo          CHAR(10)    NOT NULL,
    CLI_Codigo          CHAR(10)    NOT NULL,
    FAC_Establecimiento CHAR(3)     NOT NULL DEFAULT '001',
    FAC_PuntoEmision    CHAR(3)     NOT NULL DEFAULT '001',
    FAC_Secuencial      CHAR(9)     NOT NULL,
    FAC_ClaveAcceso     CHAR(49),
    FAC_FechaEmision    TIMESTAMPTZ NOT NULL DEFAULT now(),
    FAC_FechaAnulacion  TIMESTAMPTZ,
    CONSTRAINT PK_FACTURAS PRIMARY KEY (FAC_Codigo),
    CONSTRAINT UQ_FACTURAS_Numero UNIQUE (FAC_Establecimiento, FAC_PuntoEmision, FAC_Secuencial),
    CONSTRAINT UQ_FACTURAS_ClaveAcceso UNIQUE (FAC_ClaveAcceso),
    CONSTRAINT FK_FACTURAS_PEDIDOS FOREIGN KEY (PED_Codigo)
        REFERENCES PEDIDOS (PED_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_FACTURAS_CLIENTES FOREIGN KEY (CLI_Codigo)
        REFERENCES CLIENTES (CLI_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_FACTURAS_Codigo CHECK (FAC_Codigo ~ '^FAC[0-9]{7}$'),
    CONSTRAINT CK_FACTURAS_Establecimiento CHECK (FAC_Establecimiento ~ '^[0-9]{3}$' AND FAC_Establecimiento <> '000'),
    CONSTRAINT CK_FACTURAS_PuntoEmision CHECK (FAC_PuntoEmision ~ '^[0-9]{3}$' AND FAC_PuntoEmision <> '000'),
    CONSTRAINT CK_FACTURAS_Secuencial CHECK (FAC_Secuencial ~ '^[0-9]{9}$'),
    CONSTRAINT CK_FACTURAS_ClaveAcceso CHECK (FAC_ClaveAcceso ~ '^[0-9]{49}$'),
    CONSTRAINT CK_FACTURAS_Anulacion CHECK (FAC_FechaAnulacion IS NULL OR FAC_FechaAnulacion >= FAC_FechaEmision)
);
ALTER SEQUENCE SEQ_FACTURAS OWNED BY FACTURAS.FAC_Codigo;
CREATE UNIQUE INDEX UX_FACTURAS_Vigente ON FACTURAS (PED_Codigo) WHERE FAC_FechaAnulacion IS NULL;
CREATE INDEX IX_FACTURAS_Cliente ON FACTURAS (CLI_Codigo);

-- Formas de pago con su código del SRI.
CREATE SEQUENCE SEQ_METODOS_PAGO MAXVALUE 999;
CREATE TABLE METODOS_PAGO (
    MPA_Codigo     CHAR(6)     NOT NULL DEFAULT 'MPA' || LPAD(nextval('SEQ_METODOS_PAGO')::TEXT, 3, '0'),
    MPA_Nombre     VARCHAR(30) NOT NULL,
    MPA_CodigoSri  CHAR(2)     NOT NULL,
    MPA_UsaTarjeta BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT PK_METODOS_PAGO PRIMARY KEY (MPA_Codigo),
    CONSTRAINT UQ_METODOS_PAGO_Nombre UNIQUE (MPA_Nombre),
    CONSTRAINT CK_METODOS_PAGO_Codigo CHECK (MPA_Codigo ~ '^MPA[0-9]{3}$'),
    CONSTRAINT CK_METODOS_PAGO_CodigoSri CHECK (MPA_CodigoSri ~ '^[0-9]{2}$')
);
ALTER SEQUENCE SEQ_METODOS_PAGO OWNED BY METODOS_PAGO.MPA_Codigo;

-- De la tarjeta solo se guardan los 4 últimos dígitos y la autorización del
-- banco: el número completo, la fecha y el CVV nunca se guardan.
CREATE SEQUENCE SEQ_PAGOS MAXVALUE 9999999;
CREATE TABLE PAGOS (
    PAG_Codigo         CHAR(10)      NOT NULL DEFAULT 'PAG' || LPAD(nextval('SEQ_PAGOS')::TEXT, 7, '0'),
    PED_Codigo         CHAR(10)      NOT NULL,
    MPA_Codigo         CHAR(6)       NOT NULL,
    PAG_Monto          NUMERIC(10,2) NOT NULL,
    PAG_Fecha          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PAG_Aprobado       BOOLEAN       NOT NULL DEFAULT FALSE,
    PAG_UltimosDigitos CHAR(4),
    PAG_Autorizacion   VARCHAR(20),
    CONSTRAINT PK_PAGOS PRIMARY KEY (PAG_Codigo),
    CONSTRAINT FK_PAGOS_PEDIDOS FOREIGN KEY (PED_Codigo)
        REFERENCES PEDIDOS (PED_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PAGOS_METODOS_PAGO FOREIGN KEY (MPA_Codigo)
        REFERENCES METODOS_PAGO (MPA_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_PAGOS_Codigo CHECK (PAG_Codigo ~ '^PAG[0-9]{7}$'),
    CONSTRAINT CK_PAGOS_Monto CHECK (PAG_Monto > 0),
    CONSTRAINT CK_PAGOS_UltimosDigitos CHECK (PAG_UltimosDigitos ~ '^[0-9]{4}$')
);
ALTER SEQUENCE SEQ_PAGOS OWNED BY PAGOS.PAG_Codigo;
CREATE INDEX IX_PAGOS_Pedido ON PAGOS (PED_Codigo);
CREATE INDEX IX_PAGOS_Metodo ON PAGOS (MPA_Codigo);


/* =============================================================================
   Grupo 6. Talento humano
   ========================================================================== */

-- Es una sola tienda: no hay departamentos, y el cargo dice qué hace cada uno.
CREATE SEQUENCE SEQ_CARGOS MAXVALUE 999;
CREATE TABLE CARGOS (
    CAR_Codigo    CHAR(6)      NOT NULL DEFAULT 'CAR' || LPAD(nextval('SEQ_CARGOS')::TEXT, 3, '0'),
    CAR_Nombre    VARCHAR(40)  NOT NULL,
    CAR_Funciones VARCHAR(250),
    CONSTRAINT PK_CARGOS PRIMARY KEY (CAR_Codigo),
    CONSTRAINT UQ_CARGOS_Nombre UNIQUE (CAR_Nombre),
    CONSTRAINT CK_CARGOS_Codigo CHECK (CAR_Codigo ~ '^CAR[0-9]{3}$')
);
ALTER SEQUENCE SEQ_CARGOS OWNED BY CARGOS.CAR_Codigo;

-- Se guardan aunque dejen la empresa (EMP_Activo), por su historia. El cargo
-- y el sueldo son los de hoy: si cambian, se actualizan, y lo que se pagó
-- antes queda en los roles de pago (DETALLES_NOMINA).
CREATE SEQUENCE SEQ_EMPLEADOS MAXVALUE 9999999;
CREATE TABLE EMPLEADOS (
    EMP_Codigo          CHAR(10)     NOT NULL DEFAULT 'EMP' || LPAD(nextval('SEQ_EMPLEADOS')::TEXT, 7, '0'),
    CAN_Codigo          CHAR(4)      NOT NULL,   -- donde vive
    CAR_Codigo          CHAR(6)      NOT NULL,
    EMP_Cedula        CHAR(10)     NOT NULL,
    EMP_PrimerApellido  VARCHAR(30)  NOT NULL,
    EMP_SegundoApellido VARCHAR(30),
    EMP_PrimerNombre    VARCHAR(30)  NOT NULL,
    EMP_SegundoNombre   VARCHAR(30),
    EMP_FechaNacimiento DATE         NOT NULL,
    EMP_Sexo            CHAR(1)      NOT NULL,   -- H hombre, M mujer
    EMP_TipoSangre      VARCHAR(3),
    EMP_Correo          VARCHAR(254) NOT NULL,
    EMP_Celular         CHAR(10)     NOT NULL,
    EMP_Direccion       VARCHAR(200) NOT NULL,
    EMP_Foto            VARCHAR(150),
    -- PER permanente, TEM temporal, TER tercerizado, SPR servicios profesionales
    EMP_TipoContrato    CHAR(3)      NOT NULL DEFAULT 'PER',
    EMP_Sueldo          NUMERIC(8,2) NOT NULL,
    EMP_Banco          VARCHAR(40),
    EMP_CuentaBancaria  VARCHAR(20),
    EMP_FechaIngreso    DATE         NOT NULL DEFAULT CURRENT_DATE,
    EMP_Activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_EMPLEADOS PRIMARY KEY (EMP_Codigo),
    CONSTRAINT UQ_EMPLEADOS_Cedula UNIQUE (EMP_Cedula),
    CONSTRAINT UQ_EMPLEADOS_Correo UNIQUE (EMP_Correo),
    CONSTRAINT FK_EMPLEADOS_CANTONES FOREIGN KEY (CAN_Codigo)
        REFERENCES CANTONES (CAN_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_EMPLEADOS_CARGOS FOREIGN KEY (CAR_Codigo)
        REFERENCES CARGOS (CAR_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_EMPLEADOS_Codigo CHECK (EMP_Codigo ~ '^EMP[0-9]{7}$'),
    CONSTRAINT CK_EMPLEADOS_Cedula CHECK (FN_CEDULA_VALIDA(EMP_Cedula)),
    CONSTRAINT CK_EMPLEADOS_Nombres CHECK (btrim(EMP_PrimerApellido) <> '' AND btrim(EMP_PrimerNombre) <> ''),
    CONSTRAINT CK_EMPLEADOS_Sexo CHECK (EMP_Sexo IN ('H', 'M')),
    CONSTRAINT CK_EMPLEADOS_TipoSangre CHECK (EMP_TipoSangre IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    CONSTRAINT CK_EMPLEADOS_Correo CHECK (
        EMP_Correo = lower(EMP_Correo)
        AND EMP_Correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    CONSTRAINT CK_EMPLEADOS_Celular CHECK (EMP_Celular ~ '^09[0-9]{8}$'),
    CONSTRAINT CK_EMPLEADOS_TipoContrato CHECK (EMP_TipoContrato IN ('PER', 'TEM', 'TER', 'SPR')),
    CONSTRAINT CK_EMPLEADOS_Sueldo CHECK (EMP_Sueldo > 0),
    CONSTRAINT CK_EMPLEADOS_Cuenta CHECK (
        (EMP_Banco IS NULL) = (EMP_CuentaBancaria IS NULL)
        AND EMP_CuentaBancaria ~ '^[0-9]{6,20}$'),
    -- En Ecuador se puede trabajar desde los 15 años.
    CONSTRAINT CK_EMPLEADOS_Edad CHECK (EMP_FechaIngreso >= EMP_FechaNacimiento + INTERVAL '15 years')
);
ALTER SEQUENCE SEQ_EMPLEADOS OWNED BY EMPLEADOS.EMP_Codigo;
CREATE INDEX IX_EMPLEADOS_Canton ON EMPLEADOS (CAN_Codigo);
CREATE INDEX IX_EMPLEADOS_Cargo ON EMPLEADOS (CAR_Codigo);

ALTER TABLE USUARIOS ADD CONSTRAINT FK_USUARIOS_EMPLEADOS FOREIGN KEY (EMP_Codigo)
    REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX IX_USUARIOS_Empleado ON USUARIOS (EMP_Codigo);


/* =============================================================================
   Grupo 7. Materiales y recetas
   ========================================================================== */

CREATE SEQUENCE SEQ_UNIDADES_MEDIDA MAXVALUE 999;
CREATE TABLE UNIDADES_MEDIDA (
    UMI_Codigo      CHAR(6)     NOT NULL DEFAULT 'UMI' || LPAD(nextval('SEQ_UNIDADES_MEDIDA')::TEXT, 3, '0'),
    UMI_Nombre      VARCHAR(30) NOT NULL,
    UMI_Abreviatura VARCHAR(10) NOT NULL,
    CONSTRAINT PK_UNIDADES_MEDIDA PRIMARY KEY (UMI_Codigo),
    CONSTRAINT UQ_UNIDADES_MEDIDA_Nombre UNIQUE (UMI_Nombre),
    CONSTRAINT UQ_UNIDADES_MEDIDA_Abreviatura UNIQUE (UMI_Abreviatura),
    CONSTRAINT CK_UNIDADES_MEDIDA_Codigo CHECK (UMI_Codigo ~ '^UMI[0-9]{3}$')
);
ALTER SEQUENCE SEQ_UNIDADES_MEDIDA OWNED BY UNIDADES_MEDIDA.UMI_Codigo;

-- De qué lote se saca al producir y a qué costo:
--   FEFO  primero el que caduca antes (lo normal en perecibles)
--   FIFO  primero el que entró antes
--   LIFO  primero el que entró último
--   PROM  en orden de entrada, al costo promedio ponderado de los lotes con saldo
CREATE SEQUENCE SEQ_METODOS_COSTEO MAXVALUE 999;
CREATE TABLE METODOS_COSTEO (
    MCO_Codigo CHAR(6)     NOT NULL DEFAULT 'MCO' || LPAD(nextval('SEQ_METODOS_COSTEO')::TEXT, 3, '0'),
    MCO_Sigla  VARCHAR(4)  NOT NULL,
    MCO_Nombre VARCHAR(60) NOT NULL,
    CONSTRAINT PK_METODOS_COSTEO PRIMARY KEY (MCO_Codigo),
    CONSTRAINT UQ_METODOS_COSTEO_Sigla UNIQUE (MCO_Sigla),
    CONSTRAINT CK_METODOS_COSTEO_Codigo CHECK (MCO_Codigo ~ '^MCO[0-9]{3}$'),
    CONSTRAINT CK_METODOS_COSTEO_Sigla CHECK (MCO_Sigla IN ('FEFO', 'FIFO', 'LIFO', 'PROM'))
);
ALTER SEQUENCE SEQ_METODOS_COSTEO OWNED BY METODOS_COSTEO.MCO_Codigo;

CREATE SEQUENCE SEQ_TIPOS_MATERIAL MAXVALUE 999;
CREATE TABLE TIPOS_MATERIAL (
    TMA_Codigo CHAR(6)     NOT NULL DEFAULT 'TMA' || LPAD(nextval('SEQ_TIPOS_MATERIAL')::TEXT, 3, '0'),
    TMA_Nombre VARCHAR(40) NOT NULL,
    CONSTRAINT PK_TIPOS_MATERIAL PRIMARY KEY (TMA_Codigo),
    CONSTRAINT UQ_TIPOS_MATERIAL_Nombre UNIQUE (TMA_Nombre),
    CONSTRAINT CK_TIPOS_MATERIAL_Codigo CHECK (TMA_Codigo ~ '^TMA[0-9]{3}$')
);
ALTER SEQUENCE SEQ_TIPOS_MATERIAL OWNED BY TIPOS_MATERIAL.TMA_Codigo;

-- Materia prima e insumos: lo que se compra. Se compra en una unidad (el
-- quintal) y la receta lo pide en otra (gramos): MAT_FactorConversion dice
-- cuántas unidades de producción trae una de compra (1 qq = 45359,2 g). Lotes,
-- recetas, consumos y ajustes van siempre en la unidad de producción.
-- Las bebidas que se revenden también son materiales, con receta de 1 unidad.
CREATE SEQUENCE SEQ_MATERIALES MAXVALUE 999;
CREATE TABLE MATERIALES (
    MAT_Codigo           CHAR(6)       NOT NULL DEFAULT 'MAT' || LPAD(nextval('SEQ_MATERIALES')::TEXT, 3, '0'),
    TMA_Codigo           CHAR(6)       NOT NULL,
    MCO_Codigo           CHAR(6)       NOT NULL,
    TIV_Codigo           CHAR(6)       NOT NULL,   -- el IVA con que se compra
    UMI_CodigoCompra     CHAR(6)       NOT NULL,
    UMI_CodigoProduccion CHAR(6)       NOT NULL,
    MAT_Nombre           VARCHAR(60)   NOT NULL,
    MAT_FactorConversion NUMERIC(12,4) NOT NULL,
    MAT_Perecible        BOOLEAN       NOT NULL DEFAULT FALSE,
    MAT_DiasVidaUtil     SMALLINT,                 -- caducidad de un lote si no se indica
    MAT_StockMinimo      NUMERIC(14,3) NOT NULL DEFAULT 0,
    MAT_CodigoBarras     VARCHAR(14),
    MAT_Activo           BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_MATERIALES PRIMARY KEY (MAT_Codigo),
    CONSTRAINT UQ_MATERIALES_Nombre UNIQUE (MAT_Nombre),
    CONSTRAINT UQ_MATERIALES_CodigoBarras UNIQUE (MAT_CodigoBarras),
    CONSTRAINT FK_MATERIALES_TIPOS_MATERIAL FOREIGN KEY (TMA_Codigo)
        REFERENCES TIPOS_MATERIAL (TMA_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_MATERIALES_METODOS_COSTEO FOREIGN KEY (MCO_Codigo)
        REFERENCES METODOS_COSTEO (MCO_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_MATERIALES_TARIFAS_IVA FOREIGN KEY (TIV_Codigo)
        REFERENCES TARIFAS_IVA (TIV_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_MATERIALES_UNIDAD_COMPRA FOREIGN KEY (UMI_CodigoCompra)
        REFERENCES UNIDADES_MEDIDA (UMI_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_MATERIALES_UNIDAD_PRODUCCION FOREIGN KEY (UMI_CodigoProduccion)
        REFERENCES UNIDADES_MEDIDA (UMI_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_MATERIALES_Codigo CHECK (MAT_Codigo ~ '^MAT[0-9]{3}$'),
    CONSTRAINT CK_MATERIALES_Nombre CHECK (btrim(MAT_Nombre) <> ''),
    CONSTRAINT CK_MATERIALES_Factor CHECK (MAT_FactorConversion > 0),
    CONSTRAINT CK_MATERIALES_VidaUtil CHECK (MAT_DiasVidaUtil IS NULL OR (MAT_Perecible AND MAT_DiasVidaUtil > 0)),
    CONSTRAINT CK_MATERIALES_StockMinimo CHECK (MAT_StockMinimo >= 0),
    CONSTRAINT CK_MATERIALES_CodigoBarras CHECK (MAT_CodigoBarras ~ '^[0-9]{8,14}$')
);
ALTER SEQUENCE SEQ_MATERIALES OWNED BY MATERIALES.MAT_Codigo;
CREATE INDEX IX_MATERIALES_Tipo ON MATERIALES (TMA_Codigo);

-- Débil: resuelve PRODUCTOS_TAMANOS N:N MATERIALES. Va por tamaño y no por
-- producto porque una Avena polaca de 500 ml lleva más leche que la de 300 ml.
-- RCT_Cantidad es lo que lleva UNA unidad del producto, en la unidad de
-- producción del material.
CREATE TABLE RECETAS (
    PRO_Codigo   CHAR(6)       NOT NULL,
    TAM_Codigo   CHAR(6)       NOT NULL,
    MAT_Codigo   CHAR(6)       NOT NULL,
    RCT_Cantidad NUMERIC(12,3) NOT NULL,
    CONSTRAINT PK_RECETAS PRIMARY KEY (PRO_Codigo, TAM_Codigo, MAT_Codigo),
    CONSTRAINT FK_RECETAS_PRODUCTOS_TAMANOS FOREIGN KEY (PRO_Codigo, TAM_Codigo)
        REFERENCES PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_RECETAS_MATERIALES FOREIGN KEY (MAT_Codigo)
        REFERENCES MATERIALES (MAT_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_RECETAS_Cantidad CHECK (RCT_Cantidad > 0)
);
CREATE INDEX IX_RECETAS_Material ON RECETAS (MAT_Codigo);


/* =============================================================================
   Grupo 8. Compras
   ========================================================================== */

-- Se guardan aunque queden inactivos, por el historial de compras. Si es
-- persona natural o jurídica sale del RUC (VW_PROVEEDORES).
CREATE SEQUENCE SEQ_PROVEEDORES MAXVALUE 9999999;
CREATE TABLE PROVEEDORES (
    PVD_Codigo         CHAR(10)     NOT NULL DEFAULT 'PVD' || LPAD(nextval('SEQ_PROVEEDORES')::TEXT, 7, '0'),
    TID_Codigo         CHAR(2)      NOT NULL,
    CAN_Codigo         CHAR(4)      NOT NULL,
    PVD_Identificacion VARCHAR(13)  NOT NULL,
    PVD_RazonSocial    VARCHAR(150) NOT NULL,
    PVD_Telefono       VARCHAR(10),
    PVD_Celular        CHAR(10),
    PVD_Correo         VARCHAR(254) NOT NULL,
    PVD_Direccion      VARCHAR(200) NOT NULL,
    PVD_Activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_PROVEEDORES PRIMARY KEY (PVD_Codigo),
    CONSTRAINT UQ_PROVEEDORES_Identificacion UNIQUE (TID_Codigo, PVD_Identificacion),
    CONSTRAINT FK_PROVEEDORES_TIPOS_IDENTIFICACION FOREIGN KEY (TID_Codigo)
        REFERENCES TIPOS_IDENTIFICACION (TID_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PROVEEDORES_CANTONES FOREIGN KEY (CAN_Codigo)
        REFERENCES CANTONES (CAN_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_PROVEEDORES_Codigo CHECK (PVD_Codigo ~ '^PVD[0-9]{7}$'),
    -- Un proveedor factura con RUC o, si es una persona, con su cédula.
    CONSTRAINT CK_PROVEEDORES_TipoIdentificacion CHECK (TID_Codigo IN ('04', '05')),
    CONSTRAINT CK_PROVEEDORES_Identificacion CHECK (FN_IDENTIFICACION_VALIDA(TID_Codigo, PVD_Identificacion)),
    CONSTRAINT CK_PROVEEDORES_RazonSocial CHECK (btrim(PVD_RazonSocial) <> ''),
    CONSTRAINT CK_PROVEEDORES_Telefono CHECK (PVD_Telefono ~ '^0[2-7][0-9]{7}$'),
    CONSTRAINT CK_PROVEEDORES_Celular CHECK (PVD_Celular ~ '^09[0-9]{8}$'),
    CONSTRAINT CK_PROVEEDORES_Correo CHECK (
        PVD_Correo = lower(PVD_Correo)
        AND PVD_Correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$')
);
ALTER SEQUENCE SEQ_PROVEEDORES OWNED BY PROVEEDORES.PVD_Codigo;
CREATE INDEX IX_PROVEEDORES_Canton ON PROVEEDORES (CAN_Codigo);

-- Débil: resuelve PROVEEDORES N:N MATERIALES (qué vende cada proveedor y a
-- cuánto, por unidad de compra y sin IVA). Una orden de compra solo puede
-- pedir lo que su proveedor vende.
CREATE TABLE PROVEEDORES_MATERIALES (
    PVD_Codigo           CHAR(10)      NOT NULL,
    MAT_Codigo           CHAR(6)       NOT NULL,
    PMA_PrecioReferencia NUMERIC(10,4) NOT NULL,
    PMA_DiasEntrega      SMALLINT      NOT NULL DEFAULT 1,
    CONSTRAINT PK_PROVEEDORES_MATERIALES PRIMARY KEY (PVD_Codigo, MAT_Codigo),
    CONSTRAINT FK_PROVEEDORES_MATERIALES_PROVEEDORES FOREIGN KEY (PVD_Codigo)
        REFERENCES PROVEEDORES (PVD_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PROVEEDORES_MATERIALES_MATERIALES FOREIGN KEY (MAT_Codigo)
        REFERENCES MATERIALES (MAT_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT CK_PROVEEDORES_MATERIALES_Precio CHECK (PMA_PrecioReferencia > 0),
    CONSTRAINT CK_PROVEEDORES_MATERIALES_Dias CHECK (PMA_DiasEntrega >= 0)
);
CREATE INDEX IX_PROVEEDORES_MATERIALES_Material ON PROVEEDORES_MATERIALES (MAT_Codigo);

-- ABI abierta -> APR aprobada (crea la recepción pendiente y el asiento) o
-- ANU anulada. Subtotal, IVA y total salen de VW_ORDENES_COMPRA_TOTALES.
CREATE SEQUENCE SEQ_ORDENES_COMPRA MAXVALUE 9999999;
CREATE TABLE ORDENES_COMPRA (
    OCO_Codigo       CHAR(10)     NOT NULL DEFAULT 'OCO' || LPAD(nextval('SEQ_ORDENES_COMPRA')::TEXT, 7, '0'),
    PVD_Codigo       CHAR(10)     NOT NULL,
    EMP_Codigo       CHAR(10)     NOT NULL,   -- quien la genera
    OCO_Fecha        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    OCO_FechaEntrega DATE         NOT NULL,
    OCO_Estado       CHAR(3)      NOT NULL DEFAULT 'ABI',
    OCO_Observacion  VARCHAR(250),
    CONSTRAINT PK_ORDENES_COMPRA PRIMARY KEY (OCO_Codigo),
    CONSTRAINT FK_ORDENES_COMPRA_PROVEEDORES FOREIGN KEY (PVD_Codigo)
        REFERENCES PROVEEDORES (PVD_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_ORDENES_COMPRA_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_ORDENES_COMPRA_Codigo CHECK (OCO_Codigo ~ '^OCO[0-9]{7}$'),
    CONSTRAINT CK_ORDENES_COMPRA_Estado CHECK (OCO_Estado IN ('ABI', 'APR', 'ANU')),
    CONSTRAINT CK_ORDENES_COMPRA_Entrega CHECK (
        OCO_FechaEntrega >= (OCO_Fecha AT TIME ZONE 'America/Guayaquil')::DATE)
);
ALTER SEQUENCE SEQ_ORDENES_COMPRA OWNED BY ORDENES_COMPRA.OCO_Codigo;
CREATE INDEX IX_ORDENES_COMPRA_Proveedor ON ORDENES_COMPRA (PVD_Codigo, OCO_Fecha DESC);
CREATE INDEX IX_ORDENES_COMPRA_Empleado ON ORDENES_COMPRA (EMP_Codigo);

-- Débil: resuelve ORDENES_COMPRA N:N MATERIALES. Cantidad y precio en la
-- unidad de compra; precio sin IVA. Precio e IVA son los del día: si no se
-- mandan, TG_DETALLES_ORDEN_COMPRA_MATERIAL copia el precio del proveedor y
-- el IVA del material.
CREATE TABLE DETALLES_ORDEN_COMPRA (
    OCO_Codigo         CHAR(10)      NOT NULL,
    MAT_Codigo         CHAR(6)       NOT NULL,
    DOC_Cantidad       NUMERIC(10,2) NOT NULL,
    DOC_PrecioUnitario NUMERIC(10,4) NOT NULL,
    DOC_PorcentajeIva  NUMERIC(5,2)  NOT NULL,
    CONSTRAINT PK_DETALLES_ORDEN_COMPRA PRIMARY KEY (OCO_Codigo, MAT_Codigo),
    CONSTRAINT FK_DETALLES_ORDEN_COMPRA_ORDENES_COMPRA FOREIGN KEY (OCO_Codigo)
        REFERENCES ORDENES_COMPRA (OCO_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_DETALLES_ORDEN_COMPRA_MATERIALES FOREIGN KEY (MAT_Codigo)
        REFERENCES MATERIALES (MAT_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DETALLES_ORDEN_COMPRA_Cantidad CHECK (DOC_Cantidad > 0),
    CONSTRAINT CK_DETALLES_ORDEN_COMPRA_Precio CHECK (DOC_PrecioUnitario > 0),
    CONSTRAINT CK_DETALLES_ORDEN_COMPRA_Iva CHECK (DOC_PorcentajeIva BETWEEN 0 AND 100)
);
CREATE INDEX IX_DETALLES_ORDEN_COMPRA_Material ON DETALLES_ORDEN_COMPRA (MAT_Codigo);

-- PEN pendiente (la crea la aprobación de la orden) -> REC recibida o CAN
-- cancelada. Una orden puede llegar en varias recepciones. Lo que llega son
-- sus lotes (LOTES_MATERIAL); lo pedido contra lo recibido está en
-- VW_ORDENES_COMPRA_RECIBIDO. El bodeguero no ve precios.
CREATE SEQUENCE SEQ_RECEPCIONES MAXVALUE 9999999;
CREATE TABLE RECEPCIONES (
    RCP_Codigo      CHAR(10)     NOT NULL DEFAULT 'RCP' || LPAD(nextval('SEQ_RECEPCIONES')::TEXT, 7, '0'),
    OCO_Codigo      CHAR(10)     NOT NULL,
    EMP_Codigo      CHAR(10),                -- el bodeguero que recibe
    RCP_Fecha       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    RCP_Estado      CHAR(3)      NOT NULL DEFAULT 'PEN',
    RCP_Observacion VARCHAR(250),            -- el motivo de una diferencia
    CONSTRAINT PK_RECEPCIONES PRIMARY KEY (RCP_Codigo),
    -- La usa LOTES_MATERIAL para exigir que el lote sea de esa misma orden.
    CONSTRAINT UQ_RECEPCIONES_Orden UNIQUE (RCP_Codigo, OCO_Codigo),
    CONSTRAINT FK_RECEPCIONES_ORDENES_COMPRA FOREIGN KEY (OCO_Codigo)
        REFERENCES ORDENES_COMPRA (OCO_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_RECEPCIONES_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_RECEPCIONES_Codigo CHECK (RCP_Codigo ~ '^RCP[0-9]{7}$'),
    CONSTRAINT CK_RECEPCIONES_Estado CHECK (RCP_Estado IN ('PEN', 'REC', 'CAN')),
    CONSTRAINT CK_RECEPCIONES_Responsable CHECK (RCP_Estado <> 'REC' OR EMP_Codigo IS NOT NULL)
);
ALTER SEQUENCE SEQ_RECEPCIONES OWNED BY RECEPCIONES.RCP_Codigo;
CREATE INDEX IX_RECEPCIONES_Orden ON RECEPCIONES (OCO_Codigo);

-- Cada lote es una entrada de un material: lo que llegó en una recepción o,
-- sin recepción, el inventario inicial. La cantidad va en las dos unidades y
-- el costo es por unidad de producción y sin IVA; los dos son los del día en
-- que entró (el factor y el precio pueden cambiar después). Si no se mandan,
-- TG_LOTES_MATERIAL_INGRESO los calcula, y pone la caducidad de un perecible.
-- El saldo no se guarda: es la cantidad inicial más los ajustes menos los
-- consumos (VW_LOTES_SALDO).
CREATE SEQUENCE SEQ_LOTES_MATERIAL MAXVALUE 9999999;
CREATE TABLE LOTES_MATERIAL (
    LMA_Codigo           CHAR(10)      NOT NULL DEFAULT 'LMA' || LPAD(nextval('SEQ_LOTES_MATERIAL')::TEXT, 7, '0'),
    MAT_Codigo           CHAR(6)       NOT NULL,
    RCP_Codigo           CHAR(10),
    OCO_Codigo           CHAR(10),
    LMA_FechaIngreso     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    LMA_FechaCaducidad   DATE,
    LMA_CantidadRecibida NUMERIC(10,2) NOT NULL,   -- en unidad de compra
    LMA_CantidadInicial  NUMERIC(14,3) NOT NULL,   -- en unidad de producción
    LMA_CostoUnitario    NUMERIC(18,10) NOT NULL,
    CONSTRAINT PK_LOTES_MATERIAL PRIMARY KEY (LMA_Codigo),
    CONSTRAINT FK_LOTES_MATERIAL_MATERIALES FOREIGN KEY (MAT_Codigo)
        REFERENCES MATERIALES (MAT_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Con el material en la llave, solo llega lo que la orden pidió.
    CONSTRAINT FK_LOTES_MATERIAL_DETALLES_ORDEN_COMPRA FOREIGN KEY (OCO_Codigo, MAT_Codigo)
        REFERENCES DETALLES_ORDEN_COMPRA (OCO_Codigo, MAT_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_LOTES_MATERIAL_RECEPCIONES FOREIGN KEY (RCP_Codigo, OCO_Codigo)
        REFERENCES RECEPCIONES (RCP_Codigo, OCO_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_LOTES_MATERIAL_Codigo CHECK (LMA_Codigo ~ '^LMA[0-9]{7}$'),
    CONSTRAINT CK_LOTES_MATERIAL_Origen CHECK ((RCP_Codigo IS NULL) = (OCO_Codigo IS NULL)),
    CONSTRAINT CK_LOTES_MATERIAL_Cantidades CHECK (LMA_CantidadRecibida > 0 AND LMA_CantidadInicial > 0),
    CONSTRAINT CK_LOTES_MATERIAL_Costo CHECK (LMA_CostoUnitario >= 0),
    CONSTRAINT CK_LOTES_MATERIAL_Caducidad CHECK (
        LMA_FechaCaducidad >= (LMA_FechaIngreso AT TIME ZONE 'America/Guayaquil')::DATE)
);
ALTER SEQUENCE SEQ_LOTES_MATERIAL OWNED BY LOTES_MATERIAL.LMA_Codigo;
CREATE INDEX IX_LOTES_MATERIAL_Material ON LOTES_MATERIAL (MAT_Codigo, LMA_FechaIngreso);
CREATE INDEX IX_LOTES_MATERIAL_Recepcion ON LOTES_MATERIAL (RCP_Codigo);
CREATE INDEX IX_LOTES_MATERIAL_Orden ON LOTES_MATERIAL (OCO_Codigo, MAT_Codigo);


/* =============================================================================
   Grupo 9. Inventario y producción
   ========================================================================== */

-- Corrige el inventario en libros para que cuadre con el físico (daño,
-- caducidad, error de conteo). Lo aprueba alguien distinto de quien lo hace.
-- ABI abierto -> APR aprobado (crea el asiento) o ANU anulado.
CREATE SEQUENCE SEQ_AJUSTES_INVENTARIO MAXVALUE 9999999;
CREATE TABLE AJUSTES_INVENTARIO (
    AJU_Codigo         CHAR(10)     NOT NULL DEFAULT 'AJU' || LPAD(nextval('SEQ_AJUSTES_INVENTARIO')::TEXT, 7, '0'),
    EMP_Codigo         CHAR(10)     NOT NULL,   -- quien lo hace
    EMP_CodigoAutoriza CHAR(10),                -- quien lo aprueba
    AJU_Fecha          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    AJU_Motivo         VARCHAR(150) NOT NULL,
    AJU_Estado         CHAR(3)      NOT NULL DEFAULT 'ABI',
    CONSTRAINT PK_AJUSTES_INVENTARIO PRIMARY KEY (AJU_Codigo),
    CONSTRAINT FK_AJUSTES_INVENTARIO_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_AJUSTES_INVENTARIO_AUTORIZA FOREIGN KEY (EMP_CodigoAutoriza)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_AJUSTES_INVENTARIO_Codigo CHECK (AJU_Codigo ~ '^AJU[0-9]{7}$'),
    CONSTRAINT CK_AJUSTES_INVENTARIO_Motivo CHECK (btrim(AJU_Motivo) <> ''),
    CONSTRAINT CK_AJUSTES_INVENTARIO_Estado CHECK (AJU_Estado IN ('ABI', 'APR', 'ANU')),
    CONSTRAINT CK_AJUSTES_INVENTARIO_Autoriza CHECK (AJU_Estado <> 'APR' OR EMP_CodigoAutoriza IS NOT NULL),
    CONSTRAINT CK_AJUSTES_INVENTARIO_Distinto CHECK (EMP_CodigoAutoriza <> EMP_Codigo)
);
ALTER SEQUENCE SEQ_AJUSTES_INVENTARIO OWNED BY AJUSTES_INVENTARIO.AJU_Codigo;
CREATE INDEX IX_AJUSTES_INVENTARIO_Empleado ON AJUSTES_INVENTARIO (EMP_Codigo);
CREATE INDEX IX_AJUSTES_INVENTARIO_Autoriza ON AJUSTES_INVENTARIO (EMP_CodigoAutoriza);

-- Débil: resuelve AJUSTES_INVENTARIO N:N LOTES_MATERIAL. Se ajusta un lote
-- porque cada uno tiene su costo y su caducidad. Cantidad en unidad de
-- producción: negativa si falta (pérdida), positiva si sobra.
CREATE TABLE DETALLES_AJUSTE (
    AJU_Codigo   CHAR(10)      NOT NULL,
    LMA_Codigo   CHAR(10)      NOT NULL,
    DAJ_Cantidad NUMERIC(14,3) NOT NULL,
    CONSTRAINT PK_DETALLES_AJUSTE PRIMARY KEY (AJU_Codigo, LMA_Codigo),
    CONSTRAINT FK_DETALLES_AJUSTE_AJUSTES_INVENTARIO FOREIGN KEY (AJU_Codigo)
        REFERENCES AJUSTES_INVENTARIO (AJU_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_DETALLES_AJUSTE_LOTES_MATERIAL FOREIGN KEY (LMA_Codigo)
        REFERENCES LOTES_MATERIAL (LMA_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DETALLES_AJUSTE_Cantidad CHECK (DAJ_Cantidad <> 0)
);
CREATE INDEX IX_DETALLES_AJUSTE_Lote ON DETALLES_AJUSTE (LMA_Codigo);

-- Una tanda: cuántas unidades de un producto en un tamaño se hicieron.
-- ABI abierta -> APR producida: descuenta de los lotes lo que pide la receta,
-- según el método de cada material (CONSUMOS_PRODUCCION), y crea el asiento.
-- ABI -> ANU anulada.
CREATE SEQUENCE SEQ_ORDENES_PRODUCCION MAXVALUE 9999999;
CREATE TABLE ORDENES_PRODUCCION (
    ORP_Codigo   CHAR(10)    NOT NULL DEFAULT 'ORP' || LPAD(nextval('SEQ_ORDENES_PRODUCCION')::TEXT, 7, '0'),
    PRO_Codigo   CHAR(6)     NOT NULL,
    TAM_Codigo   CHAR(6)     NOT NULL,
    EMP_Codigo   CHAR(10)    NOT NULL,   -- quien hornea o prepara
    ORP_Fecha    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ORP_Cantidad INTEGER     NOT NULL,
    ORP_Estado   CHAR(3)     NOT NULL DEFAULT 'ABI',
    CONSTRAINT PK_ORDENES_PRODUCCION PRIMARY KEY (ORP_Codigo),
    CONSTRAINT FK_ORDENES_PRODUCCION_PRODUCTOS_TAMANOS FOREIGN KEY (PRO_Codigo, TAM_Codigo)
        REFERENCES PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_ORDENES_PRODUCCION_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_ORDENES_PRODUCCION_Codigo CHECK (ORP_Codigo ~ '^ORP[0-9]{7}$'),
    CONSTRAINT CK_ORDENES_PRODUCCION_Cantidad CHECK (ORP_Cantidad > 0),
    CONSTRAINT CK_ORDENES_PRODUCCION_Estado CHECK (ORP_Estado IN ('ABI', 'APR', 'ANU'))
);
ALTER SEQUENCE SEQ_ORDENES_PRODUCCION OWNED BY ORDENES_PRODUCCION.ORP_Codigo;
CREATE INDEX IX_ORDENES_PRODUCCION_Producto ON ORDENES_PRODUCCION (PRO_Codigo, TAM_Codigo);
CREATE INDEX IX_ORDENES_PRODUCCION_Empleado ON ORDENES_PRODUCCION (EMP_Codigo);

-- Débil: resuelve ORDENES_PRODUCCION N:N LOTES_MATERIAL: de qué lote salió
-- cada material de la tanda (la trazabilidad de un perecible). La llena la
-- base al aprobar la orden. El costo es el del lote, o el promedio si el
-- material usa PROM.
CREATE TABLE CONSUMOS_PRODUCCION (
    ORP_Codigo        CHAR(10)      NOT NULL,
    LMA_Codigo        CHAR(10)      NOT NULL,
    CPR_Cantidad      NUMERIC(14,3) NOT NULL,
    CPR_CostoUnitario NUMERIC(18,10) NOT NULL,
    CONSTRAINT PK_CONSUMOS_PRODUCCION PRIMARY KEY (ORP_Codigo, LMA_Codigo),
    CONSTRAINT FK_CONSUMOS_PRODUCCION_ORDENES_PRODUCCION FOREIGN KEY (ORP_Codigo)
        REFERENCES ORDENES_PRODUCCION (ORP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_CONSUMOS_PRODUCCION_LOTES_MATERIAL FOREIGN KEY (LMA_Codigo)
        REFERENCES LOTES_MATERIAL (LMA_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_CONSUMOS_PRODUCCION_Cantidad CHECK (CPR_Cantidad > 0),
    CONSTRAINT CK_CONSUMOS_PRODUCCION_Costo CHECK (CPR_CostoUnitario >= 0)
);
CREATE INDEX IX_CONSUMOS_PRODUCCION_Lote ON CONSUMOS_PRODUCCION (LMA_Codigo);


/* =============================================================================
   Grupo 10. Contabilidad
   ========================================================================== */

-- El plan de cuentas. CUE_Numero es el código contable (1.1.01.01); la cuenta
-- madre es el número sin su último tramo, así que no se guarda aparte. Las MAY
-- (mayor) agrupan; solo las DET (detalle) reciben valores en un asiento.
CREATE SEQUENCE SEQ_CUENTAS_CONTABLES MAXVALUE 999;
CREATE TABLE CUENTAS_CONTABLES (
    CUE_Codigo CHAR(6)     NOT NULL DEFAULT 'CUE' || LPAD(nextval('SEQ_CUENTAS_CONTABLES')::TEXT, 3, '0'),
    CUE_Numero VARCHAR(20) NOT NULL,
    CUE_Nombre VARCHAR(80) NOT NULL,
    CUE_Tipo   CHAR(3)     NOT NULL,
    CUE_Activa BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_CUENTAS_CONTABLES PRIMARY KEY (CUE_Codigo),
    CONSTRAINT UQ_CUENTAS_CONTABLES_Numero UNIQUE (CUE_Numero),
    CONSTRAINT CK_CUENTAS_CONTABLES_Codigo CHECK (CUE_Codigo ~ '^CUE[0-9]{3}$'),
    -- 1 activo, 2 pasivo, 3 patrimonio, 4 ingresos, 5 costos y gastos, 6 de orden
    CONSTRAINT CK_CUENTAS_CONTABLES_Numero CHECK (CUE_Numero ~ '^[1-6](\.[0-9]{1,2})*$'),
    CONSTRAINT CK_CUENTAS_CONTABLES_Tipo CHECK (CUE_Tipo IN ('MAY', 'DET'))
);
ALTER SEQUENCE SEQ_CUENTAS_CONTABLES OWNED BY CUENTAS_CONTABLES.CUE_Codigo;

-- ABI abierto: lo hace a mano el contador (ASI_Origen MAN)
-- PEN pendiente: lo generó otro módulo al aprobar un documento
-- APR aprobado: solo si el DEBE suma lo mismo que el HABER; si no, queda ERR
-- ANU anulado
-- ASI_Origen dice qué módulo lo generó (COM compras, INV inventario, PRO
-- producción, VEN ventas, NOM nómina) y ASI_Referencia el código del
-- documento que lo generó.
CREATE SEQUENCE SEQ_ASIENTOS MAXVALUE 9999999;
CREATE TABLE ASIENTOS (
    ASI_Codigo      CHAR(10)     NOT NULL DEFAULT 'ASI' || LPAD(nextval('SEQ_ASIENTOS')::TEXT, 7, '0'),
    EMP_Codigo      CHAR(10),                 -- el contador que lo aprueba
    ASI_Fecha       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ASI_Descripcion VARCHAR(150) NOT NULL,
    ASI_Origen      CHAR(3)      NOT NULL DEFAULT 'MAN',
    ASI_Referencia  CHAR(10),
    ASI_Estado      CHAR(3)      NOT NULL DEFAULT 'ABI',
    CONSTRAINT PK_ASIENTOS PRIMARY KEY (ASI_Codigo),
    CONSTRAINT FK_ASIENTOS_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_ASIENTOS_Codigo CHECK (ASI_Codigo ~ '^ASI[0-9]{7}$'),
    CONSTRAINT CK_ASIENTOS_Descripcion CHECK (btrim(ASI_Descripcion) <> ''),
    CONSTRAINT CK_ASIENTOS_Origen CHECK (ASI_Origen IN ('MAN', 'COM', 'INV', 'PRO', 'VEN', 'NOM')),
    CONSTRAINT CK_ASIENTOS_Referencia CHECK ((ASI_Origen = 'MAN') = (ASI_Referencia IS NULL)),
    CONSTRAINT CK_ASIENTOS_Estado CHECK (ASI_Estado IN ('ABI', 'PEN', 'APR', 'ANU', 'ERR')),
    CONSTRAINT CK_ASIENTOS_Aprobado CHECK (ASI_Estado <> 'APR' OR EMP_Codigo IS NOT NULL)
);
ALTER SEQUENCE SEQ_ASIENTOS OWNED BY ASIENTOS.ASI_Codigo;
CREATE INDEX IX_ASIENTOS_Referencia ON ASIENTOS (ASI_Origen, ASI_Referencia);
CREATE INDEX IX_ASIENTOS_Empleado ON ASIENTOS (EMP_Codigo);

-- Débil: resuelve ASIENTOS N:N CUENTAS_CONTABLES. Cada línea va al DEBE o al
-- HABER, nunca a los dos.
CREATE TABLE DETALLES_ASIENTO (
    ASI_Codigo CHAR(10)      NOT NULL,
    CUE_Codigo CHAR(6)       NOT NULL,
    DAS_Debe   NUMERIC(12,2) NOT NULL DEFAULT 0,
    DAS_Haber  NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT PK_DETALLES_ASIENTO PRIMARY KEY (ASI_Codigo, CUE_Codigo),
    CONSTRAINT FK_DETALLES_ASIENTO_ASIENTOS FOREIGN KEY (ASI_Codigo)
        REFERENCES ASIENTOS (ASI_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_DETALLES_ASIENTO_CUENTAS_CONTABLES FOREIGN KEY (CUE_Codigo)
        REFERENCES CUENTAS_CONTABLES (CUE_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DETALLES_ASIENTO_Valores CHECK (
        DAS_Debe >= 0 AND DAS_Haber >= 0 AND (DAS_Debe = 0) <> (DAS_Haber = 0))
);
CREATE INDEX IX_DETALLES_ASIENTO_Cuenta ON DETALLES_ASIENTO (CUE_Codigo);


/* =============================================================================
   Grupo 11. Nómina
   ========================================================================== */

-- Ingresos (ING) y descuentos (DES) del rol de pagos, cada uno con la cuenta
-- contable donde se registra. CNO_Numero es el del rol impreso (1000 sueldo).
CREATE SEQUENCE SEQ_CONCEPTOS_NOMINA MAXVALUE 999;
CREATE TABLE CONCEPTOS_NOMINA (
    CNO_Codigo CHAR(6)     NOT NULL DEFAULT 'CNO' || LPAD(nextval('SEQ_CONCEPTOS_NOMINA')::TEXT, 3, '0'),
    CUE_Codigo CHAR(6)     NOT NULL,
    CNO_Numero CHAR(4)     NOT NULL,
    CNO_Nombre VARCHAR(60) NOT NULL,
    CNO_Tipo   CHAR(3)     NOT NULL,
    CONSTRAINT PK_CONCEPTOS_NOMINA PRIMARY KEY (CNO_Codigo),
    CONSTRAINT UQ_CONCEPTOS_NOMINA_Numero UNIQUE (CNO_Numero),
    CONSTRAINT UQ_CONCEPTOS_NOMINA_Nombre UNIQUE (CNO_Nombre),
    CONSTRAINT FK_CONCEPTOS_NOMINA_CUENTAS_CONTABLES FOREIGN KEY (CUE_Codigo)
        REFERENCES CUENTAS_CONTABLES (CUE_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_CONCEPTOS_NOMINA_Codigo CHECK (CNO_Codigo ~ '^CNO[0-9]{3}$'),
    CONSTRAINT CK_CONCEPTOS_NOMINA_Numero CHECK (CNO_Numero ~ '^[0-9]{4}$'),
    CONSTRAINT CK_CONCEPTOS_NOMINA_Tipo CHECK (CNO_Tipo IN ('ING', 'DES'))
);
ALTER SEQUENCE SEQ_CONCEPTOS_NOMINA OWNED BY CONCEPTOS_NOMINA.CNO_Codigo;

-- El rol de pagos de un empleado en un mes. Al crearlo, TG_NOMINAS_INICIAR le
-- pone el sueldo de hoy del empleado y el aporte personal al IESS (9,45 %); lo
-- demás se agrega a mano. ABI -> APR (crea el asiento) o ANU. Ingresos,
-- descuentos y neto salen de VW_NOMINAS.
CREATE SEQUENCE SEQ_NOMINAS MAXVALUE 9999999;
CREATE TABLE NOMINAS (
    NOM_Codigo    CHAR(10) NOT NULL DEFAULT 'NOM' || LPAD(nextval('SEQ_NOMINAS')::TEXT, 7, '0'),
    EMP_Codigo    CHAR(10) NOT NULL,
    NOM_Anio      SMALLINT NOT NULL,
    NOM_Mes       SMALLINT NOT NULL,
    NOM_FechaPago DATE,
    NOM_Estado    CHAR(3)  NOT NULL DEFAULT 'ABI',
    CONSTRAINT PK_NOMINAS PRIMARY KEY (NOM_Codigo),
    CONSTRAINT FK_NOMINAS_EMPLEADOS FOREIGN KEY (EMP_Codigo)
        REFERENCES EMPLEADOS (EMP_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_NOMINAS_Codigo CHECK (NOM_Codigo ~ '^NOM[0-9]{7}$'),
    CONSTRAINT CK_NOMINAS_Periodo CHECK (NOM_Anio BETWEEN 2000 AND 2100 AND NOM_Mes BETWEEN 1 AND 12),
    CONSTRAINT CK_NOMINAS_Estado CHECK (NOM_Estado IN ('ABI', 'APR', 'ANU'))
);
ALTER SEQUENCE SEQ_NOMINAS OWNED BY NOMINAS.NOM_Codigo;
-- Un solo rol por empleado y mes, sin contar los anulados.
CREATE UNIQUE INDEX UX_NOMINAS_Mes ON NOMINAS (EMP_Codigo, NOM_Anio, NOM_Mes) WHERE NOM_Estado <> 'ANU';

-- Débil: resuelve NOMINAS N:N CONCEPTOS_NOMINA. DNO_Cantidad son días u
-- horas (30 días de sueldo, 5 horas extra).
CREATE TABLE DETALLES_NOMINA (
    NOM_Codigo   CHAR(10)      NOT NULL,
    CNO_Codigo   CHAR(6)       NOT NULL,
    DNO_Cantidad NUMERIC(6,2)  NOT NULL DEFAULT 1,
    DNO_Valor    NUMERIC(10,2) NOT NULL,
    CONSTRAINT PK_DETALLES_NOMINA PRIMARY KEY (NOM_Codigo, CNO_Codigo),
    CONSTRAINT FK_DETALLES_NOMINA_NOMINAS FOREIGN KEY (NOM_Codigo)
        REFERENCES NOMINAS (NOM_Codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_DETALLES_NOMINA_CONCEPTOS_NOMINA FOREIGN KEY (CNO_Codigo)
        REFERENCES CONCEPTOS_NOMINA (CNO_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_DETALLES_NOMINA_Cantidad CHECK (DNO_Cantidad > 0),
    CONSTRAINT CK_DETALLES_NOMINA_Valor CHECK (DNO_Valor > 0)
);
CREATE INDEX IX_DETALLES_NOMINA_Concepto ON DETALLES_NOMINA (CNO_Codigo);


/* =============================================================================
   Reglas que cruzan tablas (un CHECK no puede mirar otra tabla)
   ========================================================================== */

-- A domicilio exige dirección y el retiro no la lleva. Si no se manda el
-- costo de envío, se copia el del tipo de entrega.
CREATE FUNCTION FN_PEDIDOS_ENTREGA()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_pide_direccion BOOLEAN;
    v_costo          NUMERIC(6,2);
BEGIN
    SELECT TEN_PideDireccion, TEN_Costo
      INTO v_pide_direccion, v_costo
      FROM TIPOS_ENTREGA
     WHERE TEN_Codigo = NEW.TEN_Codigo;

    IF v_pide_direccion AND NEW.DIR_Codigo IS NULL THEN
        RAISE EXCEPTION 'El pedido % es a domicilio y no tiene dirección', NEW.PED_Numero;
    ELSIF NOT v_pide_direccion AND NEW.DIR_Codigo IS NOT NULL THEN
        RAISE EXCEPTION 'El pedido % se retira en el local y no lleva dirección', NEW.PED_Numero;
    END IF;

    IF NEW.PED_CostoEnvio IS NULL THEN
        NEW.PED_CostoEnvio := v_costo;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_PEDIDOS_ENTREGA
BEFORE INSERT OR UPDATE OF TEN_Codigo, DIR_Codigo ON PEDIDOS
FOR EACH ROW EXECUTE FUNCTION FN_PEDIDOS_ENTREGA();

-- Un producto agotado no se puede pedir. Si no se mandan precio o IVA, se
-- copian del catálogo de ese momento.
CREATE FUNCTION FN_DETALLES_PEDIDO_PRECIO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_disponible BOOLEAN;
    v_precio     NUMERIC(8,2);
    v_iva        NUMERIC(5,2);
BEGIN
    SELECT p.PRO_Disponible, pt.PTA_Precio, t.TIV_Porcentaje
      INTO v_disponible, v_precio, v_iva
      FROM PRODUCTOS_TAMANOS pt
      JOIN PRODUCTOS p   ON p.PRO_Codigo = pt.PRO_Codigo
      JOIN TARIFAS_IVA t ON t.TIV_Codigo = p.TIV_Codigo
     WHERE pt.PRO_Codigo = NEW.PRO_Codigo
       AND pt.TAM_Codigo = NEW.TAM_Codigo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto % no se vende en el tamaño %', NEW.PRO_Codigo, NEW.TAM_Codigo;
    ELSIF NOT v_disponible THEN
        RAISE EXCEPTION 'El producto % está agotado', NEW.PRO_Codigo;
    END IF;

    NEW.DPE_PrecioUnitario := COALESCE(NEW.DPE_PrecioUnitario, v_precio);
    NEW.DPE_PorcentajeIva  := COALESCE(NEW.DPE_PorcentajeIva, v_iva);
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_DETALLES_PEDIDO_PRECIO
BEFORE INSERT ON DETALLES_PEDIDO
FOR EACH ROW EXECUTE FUNCTION FN_DETALLES_PEDIDO_PRECIO();

-- El SRI pide secuenciales sin saltos. Una secuencia deja un hueco cada vez
-- que un INSERT falla, así que se toma el mayor + 1 de ese establecimiento y
-- punto de emisión. El candado evita que dos facturas a la vez saquen el
-- mismo número, y se suelta al terminar la transacción.
CREATE FUNCTION FN_FACTURAS_SECUENCIAL()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.FAC_Secuencial IS NULL THEN
        PERFORM pg_advisory_xact_lock(hashtext('FACTURAS' || NEW.FAC_Establecimiento || NEW.FAC_PuntoEmision));
        SELECT LPAD((COALESCE(MAX(FAC_Secuencial::INTEGER), 0) + 1)::TEXT, 9, '0')
          INTO NEW.FAC_Secuencial
          FROM FACTURAS
         WHERE FAC_Establecimiento = NEW.FAC_Establecimiento
           AND FAC_PuntoEmision    = NEW.FAC_PuntoEmision;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_FACTURAS_SECUENCIAL
BEFORE INSERT ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION FN_FACTURAS_SECUENCIAL();


/* -----------------------------------------------------------------------------
   Estados de los documentos
   -------------------------------------------------------------------------- */

-- Un documento aprobado o anulado ya no se cambia ni se borra. TG_ARGV[0] es
-- la columna del estado y TG_ARGV[1] los estados en que todavía se puede
-- tocar ('ABI'; 'PEN' en recepciones; 'ABI,PEN,ERR' en asientos). Al crearlo
-- tiene que estar en uno de esos.
CREATE FUNCTION FN_DOCUMENTO_ABIERTO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_abiertos TEXT[] := string_to_array(TG_ARGV[1], ',');
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE')
       AND NOT ((to_jsonb(OLD) ->> TG_ARGV[0]) = ANY (v_abiertos)) THEN
        RAISE EXCEPTION 'En % ya no se puede cambiar un documento en estado %',
            TG_TABLE_NAME, to_jsonb(OLD) ->> TG_ARGV[0];
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    IF TG_OP = 'INSERT' AND NOT ((to_jsonb(NEW) ->> TG_ARGV[0]) = ANY (v_abiertos)) THEN
        RAISE EXCEPTION 'En % un documento nuevo empieza en estado %', TG_TABLE_NAME, TG_ARGV[1];
    END IF;
    RETURN NEW;
END;
$$;

-- Las líneas de un documento solo se tocan mientras su cabecera está abierta.
-- TG_ARGV: tabla de la cabecera, su llave, su columna de estado y los
-- estados abiertos.
CREATE FUNCTION FN_LINEA_ABIERTA()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_fila   JSONB;
    v_estado TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_fila := to_jsonb(OLD);
    ELSE
        v_fila := to_jsonb(NEW);
    END IF;
    EXECUTE format('SELECT %I FROM %I WHERE %I = $1', TG_ARGV[2], TG_ARGV[0], TG_ARGV[1])
       INTO v_estado
      USING v_fila ->> TG_ARGV[1];
    IF v_estado IS NOT NULL AND NOT (v_estado = ANY (string_to_array(TG_ARGV[3], ','))) THEN
        RAISE EXCEPTION 'El documento % está en estado % y ya no se le pueden cambiar las líneas',
            v_fila ->> TG_ARGV[1], v_estado;
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_ORDENES_COMPRA_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON ORDENES_COMPRA
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('oco_estado', 'ABI');
CREATE TRIGGER TG_RECEPCIONES_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON RECEPCIONES
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('rcp_estado', 'PEN');
CREATE TRIGGER TG_AJUSTES_INVENTARIO_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON AJUSTES_INVENTARIO
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('aju_estado', 'ABI');
CREATE TRIGGER TG_ORDENES_PRODUCCION_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON ORDENES_PRODUCCION
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('orp_estado', 'ABI');
CREATE TRIGGER TG_ASIENTOS_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON ASIENTOS
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('asi_estado', 'ABI,PEN,ERR');
CREATE TRIGGER TG_NOMINAS_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON NOMINAS
FOR EACH ROW EXECUTE FUNCTION FN_DOCUMENTO_ABIERTO('nom_estado', 'ABI');

CREATE TRIGGER TG_DETALLES_ORDEN_COMPRA_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON DETALLES_ORDEN_COMPRA
FOR EACH ROW EXECUTE FUNCTION FN_LINEA_ABIERTA('ordenes_compra', 'oco_codigo', 'oco_estado', 'ABI');
CREATE TRIGGER TG_LOTES_MATERIAL_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON LOTES_MATERIAL
FOR EACH ROW EXECUTE FUNCTION FN_LINEA_ABIERTA('recepciones', 'rcp_codigo', 'rcp_estado', 'PEN');
CREATE TRIGGER TG_DETALLES_AJUSTE_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON DETALLES_AJUSTE
FOR EACH ROW EXECUTE FUNCTION FN_LINEA_ABIERTA('ajustes_inventario', 'aju_codigo', 'aju_estado', 'ABI');
CREATE TRIGGER TG_DETALLES_ASIENTO_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON DETALLES_ASIENTO
FOR EACH ROW EXECUTE FUNCTION FN_LINEA_ABIERTA('asientos', 'asi_codigo', 'asi_estado', 'ABI,PEN,ERR');
CREATE TRIGGER TG_DETALLES_NOMINA_ABIERTO BEFORE INSERT OR UPDATE OR DELETE ON DETALLES_NOMINA
FOR EACH ROW EXECUTE FUNCTION FN_LINEA_ABIERTA('nominas', 'nom_codigo', 'nom_estado', 'ABI');


/* -----------------------------------------------------------------------------
   Asientos que generan los otros módulos
   -------------------------------------------------------------------------- */

-- Crea la cabecera de un asiento pendiente y devuelve su código.
CREATE FUNCTION FN_ASIENTO_NUEVO(p_origen TEXT, p_referencia TEXT, p_descripcion TEXT)
RETURNS CHAR(10)
LANGUAGE plpgsql AS $$
DECLARE
    v_codigo CHAR(10);
BEGIN
    INSERT INTO ASIENTOS (ASI_Origen, ASI_Referencia, ASI_Descripcion, ASI_Estado)
    VALUES (p_origen, p_referencia, LEFT(p_descripcion, 150), 'PEN')
    RETURNING ASI_Codigo INTO v_codigo;
    RETURN v_codigo;
END;
$$;

-- Suma un valor al DEBE o al HABER de una cuenta (por su número contable).
-- Si la cuenta ya está en el asiento, se compensa con lo que ya tenía; un
-- valor 0 no deja línea.
CREATE FUNCTION FN_ASIENTO_LINEA(p_asiento TEXT, p_numero TEXT, p_debe NUMERIC, p_haber NUMERIC)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_cuenta CHAR(6);
    v_neto   NUMERIC(12,2) := ROUND(COALESCE(p_debe, 0) - COALESCE(p_haber, 0), 2);
    v_debe   NUMERIC(12,2);
    v_haber  NUMERIC(12,2);
BEGIN
    SELECT CUE_Codigo INTO v_cuenta FROM CUENTAS_CONTABLES WHERE CUE_Numero = p_numero;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la cuenta contable %', p_numero;
    END IF;
    SELECT DAS_Debe, DAS_Haber INTO v_debe, v_haber
      FROM DETALLES_ASIENTO
     WHERE ASI_Codigo = p_asiento AND CUE_Codigo = v_cuenta;
    IF FOUND THEN
        v_neto := v_neto + v_debe - v_haber;
        DELETE FROM DETALLES_ASIENTO WHERE ASI_Codigo = p_asiento AND CUE_Codigo = v_cuenta;
    END IF;
    IF v_neto <> 0 THEN
        INSERT INTO DETALLES_ASIENTO (ASI_Codigo, CUE_Codigo, DAS_Debe, DAS_Haber)
        VALUES (p_asiento, v_cuenta, GREATEST(v_neto, 0), GREATEST(-v_neto, 0));
    END IF;
END;
$$;

-- Solo las cuentas de detalle activas reciben valores.
CREATE FUNCTION FN_DETALLES_ASIENTO_CUENTA()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM CUENTAS_CONTABLES
                    WHERE CUE_Codigo = NEW.CUE_Codigo AND CUE_Tipo = 'DET' AND CUE_Activa) THEN
        RAISE EXCEPTION 'La cuenta % no es de detalle o está inactiva', NEW.CUE_Codigo;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_DETALLES_ASIENTO_CUENTA
BEFORE INSERT OR UPDATE OF CUE_Codigo ON DETALLES_ASIENTO
FOR EACH ROW EXECUTE FUNCTION FN_DETALLES_ASIENTO_CUENTA();

-- La cuenta madre (el número sin su último tramo) tiene que existir y ser MAY.
CREATE FUNCTION FN_CUENTAS_CONTABLES_MADRE()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.CUE_Numero LIKE '%.%' AND NOT EXISTS (
        SELECT 1 FROM CUENTAS_CONTABLES
         WHERE CUE_Numero = regexp_replace(NEW.CUE_Numero, '\.[0-9]+$', '')
           AND CUE_Tipo = 'MAY') THEN
        RAISE EXCEPTION 'La cuenta % no tiene una cuenta madre de tipo MAY', NEW.CUE_Numero;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_CUENTAS_CONTABLES_MADRE
BEFORE INSERT OR UPDATE OF CUE_Numero ON CUENTAS_CONTABLES
FOR EACH ROW EXECUTE FUNCTION FN_CUENTAS_CONTABLES_MADRE();

-- Un asiento se aprueba solo si cuadra: DEBE igual a HABER y distinto de 0.
-- Si no cuadra, el cambio no se rechaza: queda en ERR para que el contador
-- lo corrija y lo vuelva a aprobar.
CREATE FUNCTION FN_ASIENTOS_CUADRE()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_debe  NUMERIC(14,2);
    v_haber NUMERIC(14,2);
BEGIN
    IF NEW.ASI_Estado = 'APR' THEN
        SELECT COALESCE(SUM(DAS_Debe), 0), COALESCE(SUM(DAS_Haber), 0)
          INTO v_debe, v_haber
          FROM DETALLES_ASIENTO
         WHERE ASI_Codigo = NEW.ASI_Codigo;
        IF v_debe = 0 OR v_debe <> v_haber THEN
            NEW.ASI_Estado := 'ERR';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_ASIENTOS_CUADRE
BEFORE UPDATE OF ASI_Estado ON ASIENTOS
FOR EACH ROW EXECUTE FUNCTION FN_ASIENTOS_CUADRE();


/* -----------------------------------------------------------------------------
   Compras
   -------------------------------------------------------------------------- */

-- Una orden solo pide lo que su proveedor vende. Si no se mandan precio o
-- IVA, se copian del proveedor y del material.
CREATE FUNCTION FN_DETALLES_ORDEN_COMPRA_MATERIAL()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_precio NUMERIC(10,4);
BEGIN
    SELECT pm.PMA_PrecioReferencia INTO v_precio
      FROM ORDENES_COMPRA o
      JOIN PROVEEDORES_MATERIALES pm ON pm.PVD_Codigo = o.PVD_Codigo
     WHERE o.OCO_Codigo = NEW.OCO_Codigo
       AND pm.MAT_Codigo = NEW.MAT_Codigo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El proveedor de la orden % no vende el material %', NEW.OCO_Codigo, NEW.MAT_Codigo;
    END IF;
    NEW.DOC_PrecioUnitario := COALESCE(NEW.DOC_PrecioUnitario, v_precio);
    IF NEW.DOC_PorcentajeIva IS NULL THEN
        SELECT t.TIV_Porcentaje INTO NEW.DOC_PorcentajeIva
          FROM MATERIALES m
          JOIN TARIFAS_IVA t ON t.TIV_Codigo = m.TIV_Codigo
         WHERE m.MAT_Codigo = NEW.MAT_Codigo;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_DETALLES_ORDEN_COMPRA_MATERIAL
BEFORE INSERT OR UPDATE OF MAT_Codigo ON DETALLES_ORDEN_COMPRA
FOR EACH ROW EXECUTE FUNCTION FN_DETALLES_ORDEN_COMPRA_MATERIAL();

-- Aprobar una orden crea su recepción pendiente para bodega y el asiento
-- pendiente para contabilidad: inventario e IVA pagado al DEBE, proveedores
-- al HABER.
CREATE FUNCTION FN_ORDENES_COMPRA_APROBAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_subtotal NUMERIC(12,2);
    v_iva      NUMERIC(12,2);
    v_asiento  CHAR(10);
BEGIN
    IF NEW.OCO_Estado <> 'APR' OR OLD.OCO_Estado = 'APR' THEN
        RETURN NULL;
    END IF;
    SELECT OCO_Subtotal, OCO_Iva INTO v_subtotal, v_iva
      FROM VW_ORDENES_COMPRA_TOTALES
     WHERE OCO_Codigo = NEW.OCO_Codigo;
    IF v_subtotal = 0 THEN
        RAISE EXCEPTION 'La orden de compra % no tiene materiales', NEW.OCO_Codigo;
    END IF;

    INSERT INTO RECEPCIONES (OCO_Codigo) VALUES (NEW.OCO_Codigo);

    v_asiento := FN_ASIENTO_NUEVO('COM', NEW.OCO_Codigo, 'Compra de materiales, orden ' || NEW.OCO_Codigo);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.03.01', v_subtotal, 0);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.04.01', v_iva, 0);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '2.1.01.01', 0, v_subtotal + v_iva);
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_ORDENES_COMPRA_APROBAR
AFTER UPDATE OF OCO_Estado ON ORDENES_COMPRA
FOR EACH ROW EXECUTE FUNCTION FN_ORDENES_COMPRA_APROBAR();

-- Solo se recibe lo de una orden aprobada, en una fecha que no sea anterior
-- a la orden, y para darla por recibida tiene que haber llegado algo.
CREATE FUNCTION FN_RECEPCIONES_REVISAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_estado CHAR(3);
    v_fecha  TIMESTAMPTZ;
BEGIN
    SELECT OCO_Estado, OCO_Fecha INTO v_estado, v_fecha
      FROM ORDENES_COMPRA
     WHERE OCO_Codigo = NEW.OCO_Codigo;
    IF v_estado <> 'APR' THEN
        RAISE EXCEPTION 'La orden de compra % no está aprobada', NEW.OCO_Codigo;
    ELSIF NEW.RCP_Fecha < v_fecha THEN
        RAISE EXCEPTION 'La recepción no puede ser anterior a la orden de compra %', NEW.OCO_Codigo;
    ELSIF NEW.RCP_Estado = 'REC'
          AND NOT EXISTS (SELECT 1 FROM LOTES_MATERIAL WHERE RCP_Codigo = NEW.RCP_Codigo) THEN
        RAISE EXCEPTION 'La recepción % no tiene nada recibido', NEW.RCP_Codigo;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_RECEPCIONES_REVISAR
BEFORE INSERT OR UPDATE ON RECEPCIONES
FOR EACH ROW EXECUTE FUNCTION FN_RECEPCIONES_REVISAR();

-- Al entrar un lote: la cantidad en unidad de producción sale del factor del
-- material; el costo por unidad de producción, del precio de la orden; y un
-- perecible sin caducidad toma la de su vida útil.
CREATE FUNCTION FN_LOTES_MATERIAL_INGRESO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_factor    NUMERIC(12,4);
    v_perecible BOOLEAN;
    v_dias      SMALLINT;
    v_precio    NUMERIC(10,4);
BEGIN
    SELECT MAT_FactorConversion, MAT_Perecible, MAT_DiasVidaUtil
      INTO v_factor, v_perecible, v_dias
      FROM MATERIALES
     WHERE MAT_Codigo = NEW.MAT_Codigo;

    NEW.LMA_CantidadInicial := COALESCE(NEW.LMA_CantidadInicial, NEW.LMA_CantidadRecibida * v_factor);

    IF NEW.LMA_CostoUnitario IS NULL AND NEW.OCO_Codigo IS NOT NULL THEN
        SELECT DOC_PrecioUnitario INTO v_precio
          FROM DETALLES_ORDEN_COMPRA
         WHERE OCO_Codigo = NEW.OCO_Codigo AND MAT_Codigo = NEW.MAT_Codigo;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'La orden % no pidió el material %', NEW.OCO_Codigo, NEW.MAT_Codigo;
        END IF;
        NEW.LMA_CostoUnitario := v_precio / v_factor;
    END IF;

    IF v_perecible AND NEW.LMA_FechaCaducidad IS NULL THEN
        IF v_dias IS NULL THEN
            RAISE EXCEPTION 'El material % es perecible: el lote necesita fecha de caducidad', NEW.MAT_Codigo;
        END IF;
        NEW.LMA_FechaCaducidad := (NEW.LMA_FechaIngreso AT TIME ZONE 'America/Guayaquil')::DATE + v_dias;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_LOTES_MATERIAL_INGRESO
BEFORE INSERT ON LOTES_MATERIAL
FOR EACH ROW EXECUTE FUNCTION FN_LOTES_MATERIAL_INGRESO();


/* -----------------------------------------------------------------------------
   Inventario y producción
   -------------------------------------------------------------------------- */

-- Aprobar un ajuste revisa que ningún lote quede con saldo negativo y crea el
-- asiento: lo que falta va a pérdida y lo que sobra a sobrantes, al costo de
-- cada lote.
CREATE FUNCTION FN_AJUSTES_INVENTARIO_APROBAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_lote     CHAR(10);
    v_perdida  NUMERIC(12,2);
    v_sobrante NUMERIC(12,2);
    v_asiento  CHAR(10);
BEGIN
    IF NEW.AJU_Estado <> 'APR' OR OLD.AJU_Estado = 'APR' THEN
        RETURN NULL;
    END IF;
    SELECT d.LMA_Codigo INTO v_lote
      FROM DETALLES_AJUSTE d
      JOIN VW_LOTES_SALDO s ON s.LMA_Codigo = d.LMA_Codigo
     WHERE d.AJU_Codigo = NEW.AJU_Codigo
       AND s.LMA_Saldo < 0
     LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'El ajuste % deja el lote % con saldo negativo', NEW.AJU_Codigo, v_lote;
    END IF;

    SELECT ROUND(SUM(-d.DAJ_Cantidad * l.LMA_CostoUnitario) FILTER (WHERE d.DAJ_Cantidad < 0), 2),
           ROUND(SUM(d.DAJ_Cantidad * l.LMA_CostoUnitario) FILTER (WHERE d.DAJ_Cantidad > 0), 2)
      INTO v_perdida, v_sobrante
      FROM DETALLES_AJUSTE d
      JOIN LOTES_MATERIAL l ON l.LMA_Codigo = d.LMA_Codigo
     WHERE d.AJU_Codigo = NEW.AJU_Codigo;
    IF v_perdida IS NULL AND v_sobrante IS NULL THEN
        RAISE EXCEPTION 'El ajuste % no tiene lotes', NEW.AJU_Codigo;
    END IF;

    v_asiento := FN_ASIENTO_NUEVO('INV', NEW.AJU_Codigo, 'Ajuste de inventario: ' || NEW.AJU_Motivo);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '5.2.04', v_perdida, 0);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.03.01', v_sobrante, v_perdida);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '4.1.02', 0, v_sobrante);
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_AJUSTES_INVENTARIO_APROBAR
AFTER UPDATE OF AJU_Estado ON AJUSTES_INVENTARIO
FOR EACH ROW EXECUTE FUNCTION FN_AJUSTES_INVENTARIO_APROBAR();

-- Aprobar una orden de producción descuenta de los lotes lo que pide la
-- receta. Para cada material se recorren sus lotes recibidos, con saldo y sin
-- caducar, en el orden de su método:
--   FEFO  la caducidad más cercana primero
--   FIFO  el ingreso más antiguo primero
--   LIFO  el ingreso más reciente primero
--   PROM  como FIFO, pero al costo promedio ponderado de esos lotes
-- Cada lote usado queda en CONSUMOS_PRODUCCION. Si no alcanza, no se aprueba.
-- Después crea el asiento: productos terminados al DEBE, materia prima al HABER.
CREATE FUNCTION FN_ORDENES_PRODUCCION_APROBAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_receta   RECORD;
    v_lote     RECORD;
    v_falta    NUMERIC(14,3);
    v_toma     NUMERIC(14,3);
    v_promedio NUMERIC(18,10);
    v_costo    NUMERIC(12,2);
    v_asiento  CHAR(10);
BEGIN
    IF NEW.ORP_Estado <> 'APR' OR OLD.ORP_Estado = 'APR' THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM RECETAS
                    WHERE PRO_Codigo = NEW.PRO_Codigo AND TAM_Codigo = NEW.TAM_Codigo) THEN
        RAISE EXCEPTION 'El producto % en el tamaño % no tiene receta', NEW.PRO_Codigo, NEW.TAM_Codigo;
    END IF;

    FOR v_receta IN
        SELECT r.MAT_Codigo, m.MAT_Nombre, mc.MCO_Sigla, u.UMI_Abreviatura,
               r.RCT_Cantidad * NEW.ORP_Cantidad AS necesita
          FROM RECETAS r
          JOIN MATERIALES m      ON m.MAT_Codigo = r.MAT_Codigo
          JOIN METODOS_COSTEO mc ON mc.MCO_Codigo = m.MCO_Codigo
          JOIN UNIDADES_MEDIDA u ON u.UMI_Codigo = m.UMI_CodigoProduccion
         WHERE r.PRO_Codigo = NEW.PRO_Codigo
           AND r.TAM_Codigo = NEW.TAM_Codigo
    LOOP
        v_falta := v_receta.necesita;
        v_promedio := NULL;
        IF v_receta.MCO_Sigla = 'PROM' THEN
            SELECT SUM(LMA_Saldo * LMA_CostoUnitario) / NULLIF(SUM(LMA_Saldo), 0)
              INTO v_promedio
              FROM VW_LOTES_SALDO
             WHERE MAT_Codigo = v_receta.MAT_Codigo
               AND LMA_Disponible;
        END IF;

        FOR v_lote IN
            SELECT LMA_Codigo, LMA_Saldo, LMA_CostoUnitario
              FROM VW_LOTES_SALDO
             WHERE MAT_Codigo = v_receta.MAT_Codigo
               AND LMA_Disponible
             ORDER BY CASE WHEN v_receta.MCO_Sigla = 'FEFO' THEN LMA_FechaCaducidad END ASC NULLS LAST,
                      CASE WHEN v_receta.MCO_Sigla = 'LIFO' THEN LMA_FechaIngreso END DESC,
                      LMA_FechaIngreso,
                      LMA_Codigo
        LOOP
            EXIT WHEN v_falta <= 0;
            v_toma := LEAST(v_lote.LMA_Saldo, v_falta);
            INSERT INTO CONSUMOS_PRODUCCION (ORP_Codigo, LMA_Codigo, CPR_Cantidad, CPR_CostoUnitario)
            VALUES (NEW.ORP_Codigo, v_lote.LMA_Codigo, v_toma, COALESCE(v_promedio, v_lote.LMA_CostoUnitario));
            v_falta := v_falta - v_toma;
        END LOOP;

        IF v_falta > 0 THEN
            RAISE EXCEPTION 'No alcanza %: faltan % %', v_receta.MAT_Nombre, v_falta, v_receta.UMI_Abreviatura;
        END IF;
    END LOOP;

    SELECT ROUND(SUM(CPR_Cantidad * CPR_CostoUnitario), 2) INTO v_costo
      FROM CONSUMOS_PRODUCCION
     WHERE ORP_Codigo = NEW.ORP_Codigo;
    v_asiento := FN_ASIENTO_NUEVO('PRO', NEW.ORP_Codigo, 'Producción, orden ' || NEW.ORP_Codigo);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.03.02', v_costo, 0);
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.03.01', 0, v_costo);
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_ORDENES_PRODUCCION_APROBAR
AFTER UPDATE OF ORP_Estado ON ORDENES_PRODUCCION
FOR EACH ROW EXECUTE FUNCTION FN_ORDENES_PRODUCCION_APROBAR();


/* -----------------------------------------------------------------------------
   Ventas y nómina
   -------------------------------------------------------------------------- */

-- Facturar crea el asiento de la venta: caja al DEBE; ventas (con el envío)
-- e IVA cobrado al HABER. Si esos productos tienen costo de producción, suma
-- el costo de ventas contra productos terminados. Anular la factura crea el
-- asiento contrario.
CREATE FUNCTION FN_FACTURAS_ASIENTO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_total   RECORD;
    v_costo   NUMERIC(12,2);
    v_origen  CHAR(10);
    v_asiento CHAR(10);
    v_numero  TEXT := NEW.FAC_Establecimiento || '-' || NEW.FAC_PuntoEmision || '-' || NEW.FAC_Secuencial;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT * INTO v_total FROM VW_PEDIDOS_TOTALES WHERE PED_Codigo = NEW.PED_Codigo;
        SELECT ROUND(SUM(d.DPE_Cantidad * e.PTA_CostoPromedio), 2) INTO v_costo
          FROM DETALLES_PEDIDO d
          JOIN VW_EXISTENCIAS_PRODUCTOS e ON e.PRO_Codigo = d.PRO_Codigo AND e.TAM_Codigo = d.TAM_Codigo
         WHERE d.PED_Codigo = NEW.PED_Codigo;

        v_asiento := FN_ASIENTO_NUEVO('VEN', NEW.FAC_Codigo, 'Venta, factura ' || v_numero);
        PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.01.01', v_total.PED_Total, 0);
        PERFORM FN_ASIENTO_LINEA(v_asiento, '4.1.01', 0,
            v_total.PED_Subtotal0 + v_total.PED_SubtotalGravado + v_total.PED_CostoEnvio);
        PERFORM FN_ASIENTO_LINEA(v_asiento, '2.1.02.01', 0, v_total.PED_Iva);
        PERFORM FN_ASIENTO_LINEA(v_asiento, '5.1.01', v_costo, 0);
        PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.03.02', 0, v_costo);
    ELSIF OLD.FAC_FechaAnulacion IS NULL AND NEW.FAC_FechaAnulacion IS NOT NULL THEN
        SELECT ASI_Codigo INTO v_origen
          FROM ASIENTOS
         WHERE ASI_Origen = 'VEN' AND ASI_Referencia = NEW.FAC_Codigo
         ORDER BY ASI_Codigo
         LIMIT 1;
        v_asiento := FN_ASIENTO_NUEVO('VEN', NEW.FAC_Codigo, 'Anulación de la factura ' || v_numero);
        INSERT INTO DETALLES_ASIENTO (ASI_Codigo, CUE_Codigo, DAS_Debe, DAS_Haber)
        SELECT v_asiento, CUE_Codigo, DAS_Haber, DAS_Debe
          FROM DETALLES_ASIENTO
         WHERE ASI_Codigo = v_origen;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_FACTURAS_ASIENTO
AFTER INSERT OR UPDATE OF FAC_FechaAnulacion ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION FN_FACTURAS_ASIENTO();

-- Un rol nuevo empieza con 30 días del sueldo de hoy del empleado y el aporte
-- personal al IESS (9,45 % del sueldo).
CREATE FUNCTION FN_NOMINAS_INICIAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_sueldo NUMERIC(8,2);
BEGIN
    SELECT EMP_Sueldo INTO v_sueldo FROM EMPLEADOS WHERE EMP_Codigo = NEW.EMP_Codigo;
    INSERT INTO DETALLES_NOMINA (NOM_Codigo, CNO_Codigo, DNO_Cantidad, DNO_Valor)
    SELECT NEW.NOM_Codigo, c.CNO_Codigo, v.cantidad, v.valor
      FROM (VALUES ('1000', 30, v_sueldo),
                   ('2000', 1,  ROUND(v_sueldo * 0.0945, 2))) AS v (numero, cantidad, valor)
      JOIN CONCEPTOS_NOMINA c ON c.CNO_Numero = v.numero;
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_NOMINAS_INICIAR
AFTER INSERT ON NOMINAS
FOR EACH ROW EXECUTE FUNCTION FN_NOMINAS_INICIAR();

-- Aprobar el rol crea su asiento: cada ingreso al DEBE de su cuenta de gasto,
-- cada descuento al HABER de su cuenta, y el neto al HABER de bancos.
CREATE FUNCTION FN_NOMINAS_APROBAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_linea   RECORD;
    v_neto    NUMERIC(12,2) := 0;
    v_asiento CHAR(10);
BEGIN
    IF NEW.NOM_Estado <> 'APR' OR OLD.NOM_Estado = 'APR' THEN
        RETURN NULL;
    END IF;
    v_asiento := FN_ASIENTO_NUEVO('NOM', NEW.NOM_Codigo,
        format('Rol de pagos %s/%s del empleado %s', NEW.NOM_Mes, NEW.NOM_Anio, NEW.EMP_Codigo));
    FOR v_linea IN
        SELECT cu.CUE_Numero, c.CNO_Tipo, d.DNO_Valor
          FROM DETALLES_NOMINA d
          JOIN CONCEPTOS_NOMINA c   ON c.CNO_Codigo = d.CNO_Codigo
          JOIN CUENTAS_CONTABLES cu ON cu.CUE_Codigo = c.CUE_Codigo
         WHERE d.NOM_Codigo = NEW.NOM_Codigo
    LOOP
        IF v_linea.CNO_Tipo = 'ING' THEN
            PERFORM FN_ASIENTO_LINEA(v_asiento, v_linea.CUE_Numero, v_linea.DNO_Valor, 0);
            v_neto := v_neto + v_linea.DNO_Valor;
        ELSE
            PERFORM FN_ASIENTO_LINEA(v_asiento, v_linea.CUE_Numero, 0, v_linea.DNO_Valor);
            v_neto := v_neto - v_linea.DNO_Valor;
        END IF;
    END LOOP;
    IF v_neto < 0 THEN
        RAISE EXCEPTION 'En el rol % los descuentos superan a los ingresos', NEW.NOM_Codigo;
    END IF;
    PERFORM FN_ASIENTO_LINEA(v_asiento, '1.1.01.02', 0, v_neto);
    RETURN NULL;
END;
$$;

CREATE TRIGGER TG_NOMINAS_APROBAR
AFTER UPDATE OF NOM_Estado ON NOMINAS
FOR EACH ROW EXECUTE FUNCTION FN_NOMINAS_APROBAR();


/* -----------------------------------------------------------------------------
   Logs: accesos y auditoría
   -------------------------------------------------------------------------- */

-- Una cuenta está bloqueada si desde su último acceso bueno lleva 5 fallos y
-- todos en los últimos 15 minutos. La usan TG_ACCESOS_BLOQUEO y VW_USUARIOS.
-- "Desde" se mide por el código (sale de la secuencia, en orden), porque dos
-- intentos pueden caer en la misma hora exacta.
CREATE FUNCTION FN_USUARIO_BLOQUEADO(p_usuario CHAR(10))
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
    SELECT count(*) >= 5
      FROM ACCESOS a
     WHERE a.USU_Codigo = p_usuario
       AND NOT a.ACC_Exitoso
       AND a.ACC_Fecha > now() - INTERVAL '15 minutes'
       AND a.ACC_Codigo > COALESCE((SELECT max(b.ACC_Codigo) FROM ACCESOS b
                                     WHERE b.USU_Codigo = p_usuario AND b.ACC_Exitoso),
                                   '');
$$;

CREATE FUNCTION FN_ACCESOS_BLOQUEO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.ACC_Exitoso AND FN_USUARIO_BLOQUEADO(NEW.USU_Codigo) THEN
        NEW.ACC_Exitoso := FALSE;
        NEW.ACC_Motivo := 'BLO';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TG_ACCESOS_BLOQUEO
BEFORE INSERT ON ACCESOS
FOR EACH ROW EXECUTE FUNCTION FN_ACCESOS_BLOQUEO();

-- Los logs solo crecen: lo anotado no se cambia ni se borra.
CREATE FUNCTION FN_REGISTRO_FIJO()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% es un registro: lo anotado no se cambia ni se borra', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER TG_ACCESOS_FIJO BEFORE UPDATE OR DELETE ON ACCESOS
FOR EACH ROW EXECUTE FUNCTION FN_REGISTRO_FIJO();
CREATE TRIGGER TG_AUDITORIAS_FIJO BEFORE UPDATE OR DELETE ON AUDITORIAS
FOR EACH ROW EXECUTE FUNCTION FN_REGISTRO_FIJO();

-- Anota en AUDITORIAS un cambio de la tabla que lo llama. TG_ARGV son las
-- columnas de su llave.
CREATE FUNCTION FN_AUDITORIAS_REGISTRAR()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_antes   JSONB;
    v_despues JSONB;
    v_clave   TEXT;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        v_antes := to_jsonb(OLD);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        v_despues := to_jsonb(NEW);
    END IF;
    IF TG_OP = 'UPDATE' AND to_jsonb(OLD) = to_jsonb(NEW) THEN
        RETURN NULL;
    END IF;
    SELECT string_agg(COALESCE(v_despues, v_antes) ->> c.columna, '|' ORDER BY c.n)
      INTO v_clave
      FROM unnest(TG_ARGV) WITH ORDINALITY AS c (columna, n);
    INSERT INTO AUDITORIAS (USU_Codigo, AUD_Tabla, AUD_Operacion, AUD_Clave, AUD_Antes, AUD_Despues)
    VALUES (NULLIF(current_setting('app.usuario', TRUE), ''), upper(TG_TABLE_NAME),
            left(TG_OP, 1), v_clave, v_antes, v_despues);
    RETURN NULL;
END;
$$;

-- Lo que se audita: cuentas y permisos, precios y catálogo, personal,
-- proveedores, y los documentos que mueven dinero o inventario.
CREATE TRIGGER TG_USUARIOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON USUARIOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('usu_codigo');
CREATE TRIGGER TG_ROLES_PERMISOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON ROLES_PERMISOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('rol_codigo', 'per_codigo');
CREATE TRIGGER TG_PRODUCTOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON PRODUCTOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('pro_codigo');
CREATE TRIGGER TG_PRODUCTOS_TAMANOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON PRODUCTOS_TAMANOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('pro_codigo', 'tam_codigo');
CREATE TRIGGER TG_RECETAS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON RECETAS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('pro_codigo', 'tam_codigo', 'mat_codigo');
CREATE TRIGGER TG_MATERIALES_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON MATERIALES
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('mat_codigo');
CREATE TRIGGER TG_EMPLEADOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON EMPLEADOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('emp_codigo');
CREATE TRIGGER TG_PROVEEDORES_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON PROVEEDORES
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('pvd_codigo');
CREATE TRIGGER TG_FACTURAS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('fac_codigo');
CREATE TRIGGER TG_PAGOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON PAGOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('pag_codigo');
CREATE TRIGGER TG_ORDENES_COMPRA_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON ORDENES_COMPRA
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('oco_codigo');
CREATE TRIGGER TG_AJUSTES_INVENTARIO_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON AJUSTES_INVENTARIO
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('aju_codigo');
CREATE TRIGGER TG_ORDENES_PRODUCCION_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON ORDENES_PRODUCCION
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('orp_codigo');
CREATE TRIGGER TG_CUENTAS_CONTABLES_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON CUENTAS_CONTABLES
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('cue_codigo');
CREATE TRIGGER TG_ASIENTOS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON ASIENTOS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('asi_codigo');
CREATE TRIGGER TG_NOMINAS_AUDITORIA AFTER INSERT OR UPDATE OR DELETE ON NOMINAS
FOR EACH ROW EXECUTE FUNCTION FN_AUDITORIAS_REGISTRAR('nom_codigo');


/* =============================================================================
   Vistas: lo que se calcula no se guarda
   ========================================================================== */

-- Usuarios con su rol, si ya verificaron el correo, si están bloqueados y su
-- último acceso.
CREATE VIEW VW_USUARIOS AS
SELECT u.USU_Codigo,
       u.USU_Nombres,
       u.USU_Apellidos,
       u.USU_Correo,
       u.USU_Celular,
       r.ROL_Nombre,
       u.USU_Activo,
       EXISTS (SELECT 1
                 FROM VERIFICACIONES v
                WHERE v.USU_Codigo = u.USU_Codigo
                  AND v.VER_FechaUso IS NOT NULL) AS USU_CorreoVerificado,
       FN_USUARIO_BLOQUEADO(u.USU_Codigo) AS USU_Bloqueado,
       (SELECT max(a.ACC_Fecha) FROM ACCESOS a
         WHERE a.USU_Codigo = u.USU_Codigo AND a.ACC_Exitoso) AS USU_UltimoAcceso
  FROM USUARIOS u
  JOIN ROLES r ON r.ROL_Codigo = u.ROL_Codigo;

-- Totales de cada pedido como los pide el SRI. Los precios traen el IVA
-- incluido, así que la base de cada línea es precio / (1 + IVA).
CREATE VIEW VW_PEDIDOS_TOTALES AS
WITH lineas AS (
    SELECT d.PED_Codigo,
           d.DPE_PorcentajeIva,
           d.DPE_Cantidad * d.DPE_PrecioUnitario AS total_linea,
           ROUND(d.DPE_Cantidad * d.DPE_PrecioUnitario / (1 + d.DPE_PorcentajeIva / 100), 2) AS base_linea
      FROM DETALLES_PEDIDO d
),
productos AS (
    SELECT PED_Codigo,
           SUM(base_linea) FILTER (WHERE DPE_PorcentajeIva = 0) AS subtotal_0,
           SUM(base_linea) FILTER (WHERE DPE_PorcentajeIva > 0) AS subtotal_gravado,
           SUM(total_linea - base_linea)                         AS iva,
           SUM(total_linea)                                      AS total_productos
      FROM lineas
     GROUP BY PED_Codigo
),
pagado AS (
    SELECT PED_Codigo, SUM(PAG_Monto) AS monto
      FROM PAGOS
     WHERE PAG_Aprobado
     GROUP BY PED_Codigo
)
SELECT p.PED_Codigo,
       p.PED_Numero,
       p.PED_Fecha,
       e.EPE_Nombre,
       COALESCE(pr.subtotal_0, 0)                         AS PED_Subtotal0,
       COALESCE(pr.subtotal_gravado, 0)                   AS PED_SubtotalGravado,
       COALESCE(pr.iva, 0)                                AS PED_Iva,
       p.PED_CostoEnvio,
       COALESCE(pr.total_productos, 0) + p.PED_CostoEnvio AS PED_Total,
       COALESCE(pg.monto, 0)                              AS PED_Pagado
  FROM PEDIDOS p
  JOIN ESTADOS_PEDIDO e ON e.EPE_Codigo = p.EPE_Codigo
  LEFT JOIN productos pr ON pr.PED_Codigo = p.PED_Codigo
  LEFT JOIN pagado pg    ON pg.PED_Codigo = p.PED_Codigo;

-- El catálogo como lo usa el sitio: una fila por producto y tamaño.
CREATE VIEW VW_CATALOGO AS
SELECT p.PRO_Codigo,
       p.PRO_Nombre,
       c.CAT_Slug,
       t.TAM_Descripcion,
       pt.PTA_Orden,
       pt.PTA_Precio,
       i.TIV_Porcentaje,
       e.ETI_Texto,
       e.ETI_Color,
       p.PRO_Foto,
       p.PRO_TextoAlternativo,
       p.PRO_Disponible,
       p.PRO_Destacado
  FROM PRODUCTOS p
  JOIN CATEGORIAS c         ON c.CAT_Codigo = p.CAT_Codigo
  JOIN TARIFAS_IVA i        ON i.TIV_Codigo = p.TIV_Codigo
  JOIN PRODUCTOS_TAMANOS pt ON pt.PRO_Codigo = p.PRO_Codigo
  JOIN TAMANOS t            ON t.TAM_Codigo = pt.TAM_Codigo
  LEFT JOIN ETIQUETAS e     ON e.ETI_Codigo = p.ETI_Codigo;

-- Empleados con su nombre completo, su cargo, su sueldo y su edad.
CREATE VIEW VW_EMPLEADOS AS
SELECT e.EMP_Codigo,
       e.EMP_Cedula,
       e.EMP_PrimerApellido || COALESCE(' ' || e.EMP_SegundoApellido, '') || ' '
           || e.EMP_PrimerNombre || COALESCE(' ' || e.EMP_SegundoNombre, '') AS EMP_NombreCompleto,
       c.CAR_Nombre,
       e.EMP_Sueldo,
       e.EMP_FechaIngreso,
       date_part('year', age(e.EMP_FechaNacimiento))::INTEGER AS EMP_Edad,
       e.EMP_Activo
  FROM EMPLEADOS e
  JOIN CARGOS c ON c.CAR_Codigo = e.CAR_Codigo;

-- Proveedores con el tipo de persona, que sale de la identificación: cédula,
-- o RUC con tercer dígito menor que 6, es persona natural.
CREATE VIEW VW_PROVEEDORES AS
SELECT p.PVD_Codigo,
       p.PVD_Identificacion,
       p.PVD_RazonSocial,
       CASE WHEN p.TID_Codigo = '05' OR SUBSTRING(p.PVD_Identificacion, 3, 1)::INTEGER < 6
            THEN 'Natural' ELSE 'Jurídica' END AS PVD_TipoPersona,
       p.PVD_Telefono,
       p.PVD_Celular,
       p.PVD_Correo,
       c.CAN_Nombre,
       pr.PRV_Nombre,
       p.PVD_Direccion,
       p.PVD_Activo
  FROM PROVEEDORES p
  JOIN CANTONES c    ON c.CAN_Codigo = p.CAN_Codigo
  JOIN PROVINCIAS pr ON pr.PRV_Codigo = c.PRV_Codigo;

-- Subtotal, IVA y total de cada orden de compra.
CREATE VIEW VW_ORDENES_COMPRA_TOTALES AS
WITH lineas AS (
    SELECT OCO_Codigo,
           ROUND(DOC_Cantidad * DOC_PrecioUnitario, 2)                           AS subtotal,
           ROUND(DOC_Cantidad * DOC_PrecioUnitario * DOC_PorcentajeIva / 100, 2) AS iva
      FROM DETALLES_ORDEN_COMPRA
)
SELECT o.OCO_Codigo,
       o.OCO_Fecha,
       o.OCO_Estado,
       p.PVD_RazonSocial,
       COALESCE(SUM(l.subtotal), 0)           AS OCO_Subtotal,
       COALESCE(SUM(l.iva), 0)                AS OCO_Iva,
       COALESCE(SUM(l.subtotal + l.iva), 0)   AS OCO_Total
  FROM ORDENES_COMPRA o
  JOIN PROVEEDORES p   ON p.PVD_Codigo = o.PVD_Codigo
  LEFT JOIN lineas l   ON l.OCO_Codigo = o.OCO_Codigo
 GROUP BY o.OCO_Codigo, p.PVD_RazonSocial;

-- Lo pedido contra lo recibido (en recepciones ya recibidas), en la unidad
-- de compra. Diferencia distinta de 0: la orden no está completa.
CREATE VIEW VW_ORDENES_COMPRA_RECIBIDO AS
SELECT d.OCO_Codigo,
       d.MAT_Codigo,
       m.MAT_Nombre,
       u.UMI_Abreviatura                                                     AS UMI_Compra,
       d.DOC_Cantidad                                                        AS DOC_Pedido,
       COALESCE(SUM(l.LMA_CantidadRecibida) FILTER (WHERE r.RCP_Estado = 'REC'), 0) AS DOC_Recibido,
       d.DOC_Cantidad
           - COALESCE(SUM(l.LMA_CantidadRecibida) FILTER (WHERE r.RCP_Estado = 'REC'), 0) AS DOC_Diferencia
  FROM DETALLES_ORDEN_COMPRA d
  JOIN MATERIALES m          ON m.MAT_Codigo = d.MAT_Codigo
  JOIN UNIDADES_MEDIDA u     ON u.UMI_Codigo = m.UMI_CodigoCompra
  LEFT JOIN LOTES_MATERIAL l ON l.OCO_Codigo = d.OCO_Codigo AND l.MAT_Codigo = d.MAT_Codigo
  LEFT JOIN RECEPCIONES r    ON r.RCP_Codigo = l.RCP_Codigo
 GROUP BY d.OCO_Codigo, d.MAT_Codigo, m.MAT_Nombre, u.UMI_Abreviatura;

-- Saldo de cada lote: lo que entró, más los ajustes aprobados, menos lo que
-- consumió la producción. Un lote cuenta cuando su recepción ya se recibió
-- (o si es inventario inicial). Disponible = recibido, con saldo y sin caducar.
CREATE VIEW VW_LOTES_SALDO AS
WITH ajustes AS (
    SELECT d.LMA_Codigo, SUM(d.DAJ_Cantidad) AS cantidad
      FROM DETALLES_AJUSTE d
      JOIN AJUSTES_INVENTARIO a ON a.AJU_Codigo = d.AJU_Codigo
     WHERE a.AJU_Estado = 'APR'
     GROUP BY d.LMA_Codigo
),
consumos AS (
    SELECT LMA_Codigo, SUM(CPR_Cantidad) AS cantidad
      FROM CONSUMOS_PRODUCCION
     GROUP BY LMA_Codigo
),
lotes AS (
    SELECT l.LMA_Codigo,
           l.MAT_Codigo,
           l.LMA_FechaIngreso,
           l.LMA_FechaCaducidad,
           l.LMA_CostoUnitario,
           l.LMA_CantidadInicial,
           COALESCE(a.cantidad, 0) AS LMA_Ajustado,
           COALESCE(c.cantidad, 0) AS LMA_Consumido,
           l.LMA_CantidadInicial + COALESCE(a.cantidad, 0) - COALESCE(c.cantidad, 0) AS LMA_Saldo,
           (r.RCP_Codigo IS NULL OR r.RCP_Estado = 'REC')                            AS LMA_Recibido,
           COALESCE(l.LMA_FechaCaducidad < CURRENT_DATE, FALSE)                      AS LMA_Caducado
      FROM LOTES_MATERIAL l
      LEFT JOIN RECEPCIONES r ON r.RCP_Codigo = l.RCP_Codigo
      LEFT JOIN ajustes a     ON a.LMA_Codigo = l.LMA_Codigo
      LEFT JOIN consumos c    ON c.LMA_Codigo = l.LMA_Codigo
)
SELECT lotes.*,
       LMA_Recibido AND NOT LMA_Caducado AND LMA_Saldo > 0 AS LMA_Disponible
  FROM lotes;

-- Existencias de cada material (lotes recibidos y sin caducar), en las dos
-- unidades, su valor al costo y si está bajo el mínimo.
CREATE VIEW VW_EXISTENCIAS_MATERIALES AS
SELECT m.MAT_Codigo,
       m.MAT_Nombre,
       mc.MCO_Sigla,
       COALESCE(SUM(s.LMA_Saldo), 0)                                         AS MAT_Existencia,
       up.UMI_Abreviatura                                                    AS UMI_Produccion,
       ROUND(COALESCE(SUM(s.LMA_Saldo), 0) / m.MAT_FactorConversion, 2)      AS MAT_ExistenciaCompra,
       uc.UMI_Abreviatura                                                    AS UMI_Compra,
       ROUND(COALESCE(SUM(s.LMA_Saldo * s.LMA_CostoUnitario), 0), 2)         AS MAT_Valor,
       COALESCE(SUM(s.LMA_Saldo), 0) < m.MAT_StockMinimo                     AS MAT_BajoMinimo
  FROM MATERIALES m
  JOIN METODOS_COSTEO mc   ON mc.MCO_Codigo = m.MCO_Codigo
  JOIN UNIDADES_MEDIDA up  ON up.UMI_Codigo = m.UMI_CodigoProduccion
  JOIN UNIDADES_MEDIDA uc  ON uc.UMI_Codigo = m.UMI_CodigoCompra
  LEFT JOIN VW_LOTES_SALDO s ON s.MAT_Codigo = m.MAT_Codigo AND s.LMA_Recibido AND NOT s.LMA_Caducado
 GROUP BY m.MAT_Codigo, mc.MCO_Sigla, up.UMI_Abreviatura, uc.UMI_Abreviatura;

-- Kardex: cada entrada y salida de cada material, por lote, con su costo y
-- el saldo del material después de cada movimiento. Se arma con lo que ya
-- está guardado (lotes, ajustes y consumos), así que nada se guarda dos veces.
CREATE VIEW VW_KARDEX AS
WITH movimientos AS (
    SELECT l.MAT_Codigo, l.LMA_Codigo, l.LMA_FechaIngreso AS fecha,
           CASE WHEN l.RCP_Codigo IS NULL THEN 'Inventario inicial' ELSE 'Compra' END AS tipo,
           COALESCE(l.RCP_Codigo, l.LMA_Codigo) AS documento,
           l.LMA_CantidadInicial AS cantidad, l.LMA_CostoUnitario AS costo
      FROM LOTES_MATERIAL l
      LEFT JOIN RECEPCIONES r ON r.RCP_Codigo = l.RCP_Codigo
     WHERE r.RCP_Codigo IS NULL OR r.RCP_Estado = 'REC'
    UNION ALL
    SELECT l.MAT_Codigo, d.LMA_Codigo, a.AJU_Fecha, 'Ajuste', a.AJU_Codigo,
           d.DAJ_Cantidad, l.LMA_CostoUnitario
      FROM DETALLES_AJUSTE d
      JOIN AJUSTES_INVENTARIO a ON a.AJU_Codigo = d.AJU_Codigo
      JOIN LOTES_MATERIAL l     ON l.LMA_Codigo = d.LMA_Codigo
     WHERE a.AJU_Estado = 'APR'
    UNION ALL
    SELECT l.MAT_Codigo, c.LMA_Codigo, o.ORP_Fecha, 'Producción', o.ORP_Codigo,
           -c.CPR_Cantidad, c.CPR_CostoUnitario
      FROM CONSUMOS_PRODUCCION c
      JOIN ORDENES_PRODUCCION o ON o.ORP_Codigo = c.ORP_Codigo
      JOIN LOTES_MATERIAL l     ON l.LMA_Codigo = c.LMA_Codigo
)
SELECT mv.MAT_Codigo,
       m.MAT_Nombre,
       mv.fecha                          AS KAR_Fecha,
       mv.tipo                           AS KAR_Tipo,
       mv.documento                      AS KAR_Documento,
       mv.LMA_Codigo,
       mv.cantidad                       AS KAR_Cantidad,
       mv.costo                          AS KAR_CostoUnitario,
       ROUND(mv.cantidad * mv.costo, 2)  AS KAR_Valor,
       SUM(mv.cantidad) OVER (PARTITION BY mv.MAT_Codigo
                              ORDER BY mv.fecha, mv.documento, mv.LMA_Codigo
                              ROWS UNBOUNDED PRECEDING) AS KAR_Saldo
  FROM movimientos mv
  JOIN MATERIALES m ON m.MAT_Codigo = mv.MAT_Codigo;

-- Lo que costó cada tanda producida y cada unidad de ella.
CREATE VIEW VW_COSTO_PRODUCCION AS
SELECT o.ORP_Codigo,
       o.ORP_Fecha,
       o.PRO_Codigo,
       o.TAM_Codigo,
       p.PRO_Nombre,
       t.TAM_Descripcion,
       o.ORP_Cantidad,
       ROUND(SUM(c.CPR_Cantidad * c.CPR_CostoUnitario), 2)                  AS ORP_CostoTotal,
       ROUND(SUM(c.CPR_Cantidad * c.CPR_CostoUnitario) / o.ORP_Cantidad, 4) AS ORP_CostoUnitario
  FROM ORDENES_PRODUCCION o
  JOIN PRODUCTOS p            ON p.PRO_Codigo = o.PRO_Codigo
  JOIN TAMANOS t              ON t.TAM_Codigo = o.TAM_Codigo
  JOIN CONSUMOS_PRODUCCION c  ON c.ORP_Codigo = o.ORP_Codigo
 WHERE o.ORP_Estado = 'APR'
 GROUP BY o.ORP_Codigo, p.PRO_Nombre, t.TAM_Descripcion;

-- Por producto y tamaño: lo producido, lo vendido (pedidos no cancelados),
-- lo que queda y el costo promedio de una unidad.
CREATE VIEW VW_EXISTENCIAS_PRODUCTOS AS
WITH producido AS (
    SELECT PRO_Codigo, TAM_Codigo, SUM(ORP_Cantidad) AS cantidad, SUM(ORP_CostoTotal) AS costo
      FROM VW_COSTO_PRODUCCION
     GROUP BY PRO_Codigo, TAM_Codigo
),
vendido AS (
    SELECT d.PRO_Codigo, d.TAM_Codigo, SUM(d.DPE_Cantidad) AS cantidad
      FROM DETALLES_PEDIDO d
      JOIN PEDIDOS p        ON p.PED_Codigo = d.PED_Codigo
      JOIN ESTADOS_PEDIDO e ON e.EPE_Codigo = p.EPE_Codigo
     WHERE e.EPE_Nombre <> 'Cancelado'
     GROUP BY d.PRO_Codigo, d.TAM_Codigo
)
SELECT pt.PRO_Codigo,
       pt.TAM_Codigo,
       p.PRO_Nombre,
       t.TAM_Descripcion,
       COALESCE(pr.cantidad, 0)                            AS PTA_Producido,
       COALESCE(v.cantidad, 0)                             AS PTA_Vendido,
       COALESCE(pr.cantidad, 0) - COALESCE(v.cantidad, 0)  AS PTA_Existencia,
       ROUND(pr.costo / pr.cantidad, 4)                    AS PTA_CostoPromedio,
       pt.PTA_Precio
  FROM PRODUCTOS_TAMANOS pt
  JOIN PRODUCTOS p      ON p.PRO_Codigo = pt.PRO_Codigo
  JOIN TAMANOS t        ON t.TAM_Codigo = pt.TAM_Codigo
  LEFT JOIN producido pr ON pr.PRO_Codigo = pt.PRO_Codigo AND pr.TAM_Codigo = pt.TAM_Codigo
  LEFT JOIN vendido v    ON v.PRO_Codigo = pt.PRO_Codigo AND v.TAM_Codigo = pt.TAM_Codigo;

-- Ingresos, descuentos y neto a pagar de cada rol de pagos.
CREATE VIEW VW_NOMINAS AS
SELECT n.NOM_Codigo,
       n.EMP_Codigo,
       n.NOM_Anio,
       n.NOM_Mes,
       n.NOM_Estado,
       COALESCE(SUM(d.DNO_Valor) FILTER (WHERE c.CNO_Tipo = 'ING'), 0) AS NOM_Ingresos,
       COALESCE(SUM(d.DNO_Valor) FILTER (WHERE c.CNO_Tipo = 'DES'), 0) AS NOM_Descuentos,
       COALESCE(SUM(d.DNO_Valor) FILTER (WHERE c.CNO_Tipo = 'ING'), 0)
           - COALESCE(SUM(d.DNO_Valor) FILTER (WHERE c.CNO_Tipo = 'DES'), 0) AS NOM_Neto
  FROM NOMINAS n
  LEFT JOIN DETALLES_NOMINA d  ON d.NOM_Codigo = n.NOM_Codigo
  LEFT JOIN CONCEPTOS_NOMINA c ON c.CNO_Codigo = d.CNO_Codigo
 GROUP BY n.NOM_Codigo;

-- Cada asiento con la suma del DEBE y del HABER, y si cuadra.
CREATE VIEW VW_ASIENTOS AS
SELECT a.ASI_Codigo,
       a.ASI_Fecha,
       a.ASI_Origen,
       a.ASI_Referencia,
       a.ASI_Descripcion,
       a.ASI_Estado,
       COALESCE(SUM(d.DAS_Debe), 0)  AS ASI_Debe,
       COALESCE(SUM(d.DAS_Haber), 0) AS ASI_Haber,
       COALESCE(SUM(d.DAS_Debe), 0) = COALESCE(SUM(d.DAS_Haber), 0) AS ASI_Cuadra
  FROM ASIENTOS a
  LEFT JOIN DETALLES_ASIENTO d ON d.ASI_Codigo = a.ASI_Codigo
 GROUP BY a.ASI_Codigo;

-- El mayor: saldo de cada cuenta de detalle con los asientos aprobados.
CREATE VIEW VW_SALDOS_CUENTAS AS
SELECT c.CUE_Numero,
       c.CUE_Nombre,
       COALESCE(SUM(d.DAS_Debe), 0)               AS CUE_Debe,
       COALESCE(SUM(d.DAS_Haber), 0)              AS CUE_Haber,
       COALESCE(SUM(d.DAS_Debe - d.DAS_Haber), 0) AS CUE_Saldo
  FROM CUENTAS_CONTABLES c
  LEFT JOIN DETALLES_ASIENTO d
         ON d.CUE_Codigo = c.CUE_Codigo
        AND EXISTS (SELECT 1 FROM ASIENTOS a WHERE a.ASI_Codigo = d.ASI_Codigo AND a.ASI_Estado = 'APR')
 WHERE c.CUE_Tipo = 'DET'
 GROUP BY c.CUE_Codigo;


/* =============================================================================
   Datos iniciales
   ========================================================================== */

INSERT INTO ROLES (ROL_Nombre, ROL_Descripcion) VALUES
    ('Administrador', 'Maneja el catálogo, los usuarios y los reportes'),
    ('Empleado',      'Atiende los pedidos y emite las facturas'),
    ('Cliente',       'Compra desde el sitio y ve sus propios pedidos');

INSERT INTO PERMISOS (PER_Nombre, PER_Descripcion) VALUES
    ('productos.gestionar',    'Crear, editar y agotar productos'),
    ('usuarios.gestionar',     'Ver usuarios y cambiar su rol'),
    ('pedidos.crear',          'Hacer un pedido'),
    ('pedidos.ver_propios',    'Ver el historial de pedidos propios'),
    ('pedidos.ver_todos',      'Ver los pedidos de todos los clientes'),
    ('pedidos.cambiar_estado', 'Pasar un pedido a preparación, listo o entregado'),
    ('facturas.emitir',        'Emitir la factura de un pedido'),
    ('facturas.anular',        'Anular una factura emitida'),
    ('reportes.ver',           'Ver ventas por día y por producto');

INSERT INTO ROLES_PERMISOS (ROL_Codigo, PER_Codigo)
SELECT r.ROL_Codigo, p.PER_Codigo
  FROM (VALUES
        ('Administrador', 'productos.gestionar'),
        ('Administrador', 'usuarios.gestionar'),
        ('Administrador', 'pedidos.ver_todos'),
        ('Administrador', 'pedidos.cambiar_estado'),
        ('Administrador', 'facturas.emitir'),
        ('Administrador', 'facturas.anular'),
        ('Administrador', 'reportes.ver'),
        ('Empleado',      'pedidos.ver_todos'),
        ('Empleado',      'pedidos.cambiar_estado'),
        ('Empleado',      'facturas.emitir'),
        ('Cliente',       'pedidos.crear'),
        ('Cliente',       'pedidos.ver_propios')
       ) AS v (rol, permiso)
  JOIN ROLES r    ON r.ROL_Nombre = v.rol
  JOIN PERMISOS p ON p.PER_Nombre = v.permiso;

INSERT INTO PROVINCIAS (PRV_Codigo, PRV_Nombre) VALUES
    ('01', 'Azuay'),            ('02', 'Bolívar'),         ('03', 'Cañar'),
    ('04', 'Carchi'),           ('05', 'Cotopaxi'),        ('06', 'Chimborazo'),
    ('07', 'El Oro'),           ('08', 'Esmeraldas'),      ('09', 'Guayas'),
    ('10', 'Imbabura'),         ('11', 'Loja'),            ('12', 'Los Ríos'),
    ('13', 'Manabí'),           ('14', 'Morona Santiago'), ('15', 'Napo'),
    ('16', 'Pastaza'),          ('17', 'Pichincha'),       ('18', 'Tungurahua'),
    ('19', 'Zamora Chinchipe'), ('20', 'Galápagos'),       ('21', 'Sucumbíos'),
    ('22', 'Orellana'),         ('23', 'Santo Domingo de los Tsáchilas'),
    ('24', 'Santa Elena');

-- Los cantones de Napo, donde está el local. Los demás se agregan igual.
INSERT INTO CANTONES (CAN_Codigo, PRV_Codigo, CAN_Nombre) VALUES
    ('1501', '15', 'Tena'),
    ('1503', '15', 'Archidona'),
    ('1504', '15', 'El Chaco'),
    ('1507', '15', 'Quijos'),
    ('1509', '15', 'Carlos Julio Arosemena Tola');

INSERT INTO CATEGORIAS (CAT_Nombre, CAT_Slug) VALUES
    ('Panes',         'panes'),
    ('Dulces',        'dulces'),
    ('Bebidas frías', 'bebidas-frias');

INSERT INTO ETIQUETAS (ETI_Texto, ETI_Color) VALUES
    ('De la casa',       'green'),
    ('Recién hecho',     'yellow'),
    ('Dulce de siempre', 'green'),
    ('Para llevar',      'yellow');

INSERT INTO TARIFAS_IVA (TIV_CodigoSri, TIV_Descripcion, TIV_Porcentaje) VALUES
    ('0', 'IVA 0%',  0),
    ('4', 'IVA 15%', 15),
    ('5', 'IVA 5%',  5);

INSERT INTO TAMANOS (TAM_Descripcion) VALUES
    ('Único'), ('300 ml'), ('500 ml'), ('1 L'), ('2 L');

-- El catálogo de data/productos.json. El IVA de cada producto es una
-- suposición (pan 0%, lo demás 15%): lo tiene que confirmar el contador.
INSERT INTO PRODUCTOS (CAT_Codigo, ETI_Codigo, TIV_Codigo, PRO_Nombre, PRO_Foto,
                       PRO_TextoAlternativo, PRO_Disponible, PRO_Destacado)
SELECT c.CAT_Codigo, e.ETI_Codigo, t.TIV_Codigo, v.nombre,
       'assets/img/productos/' || v.foto, v.alt, v.disponible, v.destacado
  FROM (VALUES
        (1,  'panes',         'De la casa',       '0', 'Pan redondo',                    'pan-redondo',                     'Pan redondo de corteza dorada y brillante sobre papel blanco', TRUE, TRUE),
        (2,  'panes',         NULL,               '0', 'Pan enrollado',                   'pan-enrollado',                   'Pan enrollado en forma de media luna, dorado y hojaldrado', TRUE, FALSE),
        (3,  'panes',         NULL,               '0', 'Palanqueta',                      'palanqueta',                      'Palanqueta alargada de corteza crujiente con cortes en la superficie', FALSE, FALSE),
        (4,  'panes',         'Recién hecho',     '0', 'Empanada de queso',               'pan-con-queso',                   'Empanada de queso con borde repulgado y azúcar glas', TRUE, TRUE),
        (5,  'panes',         NULL,               '0', 'Pan de chocolate',                'pan-de-chocolate',                'Pan de chocolate partido por la mitad, con el relleno de chocolate a la vista', TRUE, TRUE),
        (6,  'panes',         'Dulce de siempre', '0', 'Pan redondo dulce',               'pan-redondo-dulce',               'Pan redondo dulce y brillante con grageas de colores encima', TRUE, TRUE),
        (7,  'dulces',        NULL,               '4', 'Suspiros',                        'suspiros',                        'Suspiro de merengue blanco en espiral sobre papel', FALSE, FALSE),
        (8,  'dulces',        NULL,               '4', 'Galletas',                        'galletas',                        'Galleta con chispas de chocolate sobre papel blanco', TRUE, TRUE),
        (9,  'dulces',        NULL,               '4', 'Rebanada de pastel de chocolate', 'rebanada-de-pastel-de-chocolate', 'Rebanada de pastel de chocolate de tres capas con cobertura de chocolate', TRUE, TRUE),
        (10, 'dulces',        NULL,               '4', 'Rebanada de pastel de vainilla',  'rebanada-de-pastel-de-vainilla',  'Rebanada de pastel de vainilla de tres capas con crema blanca', TRUE, FALSE),
        (11, 'dulces',        NULL,               '4', 'Rebanada de cheesecake de limón', 'rebanada-de-cheesecake-de-limon', 'Rebanada de cheesecake de limón con base de galleta, una rodaja de limón y ralladura encima', TRUE, TRUE),
        (12, 'bebidas-frias', 'Para llevar',      '4', 'Coca-Cola',                       'coca-cola',                       'Botella de vidrio de Coca-Cola sobre papel blanco', TRUE, TRUE),
        (13, 'bebidas-frias', NULL,               '4', 'Fanta',                           'fanta',                           'Botella de Fanta de naranja sobre papel blanco', TRUE, FALSE),
        (14, 'bebidas-frias', NULL,               '4', 'Sprite',                          'sprite',                          'Botella de Sprite sobre papel blanco', TRUE, FALSE),
        (15, 'bebidas-frias', NULL,               '4', 'Agua',                            'agua',                            'Botella de agua sin gas sobre papel blanco', TRUE, FALSE),
        (16, 'bebidas-frias', NULL,               '4', 'Powerade',                        'powerade',                        'Botella de Powerade azul de tapa negra', FALSE, FALSE),
        (17, 'bebidas-frias', NULL,               '4', 'Avena polaca',                    'avena-polaca',                    'Vaso de Avena Polaca con su etiqueta roja y blanca', TRUE, FALSE)
       ) AS v (orden, categoria, etiqueta, iva_sri, nombre, foto, alt, disponible, destacado)
  JOIN CATEGORIAS c   ON c.CAT_Slug = v.categoria
  JOIN TARIFAS_IVA t  ON t.TIV_CodigoSri = v.iva_sri
  LEFT JOIN ETIQUETAS e ON e.ETI_Texto = v.etiqueta
 ORDER BY v.orden;

INSERT INTO PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo, PTA_Precio, PTA_Orden)
SELECT p.PRO_Codigo, t.TAM_Codigo, v.precio, v.orden
  FROM (VALUES
        ('Pan redondo',                     'Único',  0.25, 1),
        ('Pan enrollado',                   'Único',  0.35, 1),
        ('Palanqueta',                      'Único',  0.50, 1),
        ('Empanada de queso',               'Único',  0.75, 1),
        ('Pan de chocolate',                'Único',  0.85, 1),
        ('Pan redondo dulce',               'Único',  0.40, 1),
        ('Suspiros',                        'Único',  0.75, 1),
        ('Galletas',                        'Único',  1.00, 1),
        ('Rebanada de pastel de chocolate', 'Único',  1.75, 1),
        ('Rebanada de pastel de vainilla',  'Único',  1.50, 1),
        ('Rebanada de cheesecake de limón', 'Único',  2.00, 1),
        ('Coca-Cola',                       '500 ml', 0.85, 1),
        ('Coca-Cola',                       '1 L',    1.25, 2),
        ('Coca-Cola',                       '2 L',    2.00, 3),
        ('Fanta',                           '500 ml', 0.85, 1),
        ('Fanta',                           '1 L',    1.25, 2),
        ('Sprite',                          '500 ml', 0.85, 1),
        ('Sprite',                          '1 L',    1.25, 2),
        ('Agua',                            '500 ml', 0.50, 1),
        ('Agua',                            '1 L',    0.75, 2),
        ('Powerade',                        '500 ml', 1.25, 1),
        ('Powerade',                        '1 L',    1.75, 2),
        ('Avena polaca',                    '300 ml', 0.75, 1),
        ('Avena polaca',                    '500 ml', 1.25, 2)
       ) AS v (producto, tamano, precio, orden)
  JOIN PRODUCTOS p ON p.PRO_Nombre = v.producto
  JOIN TAMANOS t   ON t.TAM_Descripcion = v.tamano;

-- Los alérgenos que más se repiten en panadería. Cuáles lleva cada producto
-- (PRODUCTOS_ALERGENOS) lo tiene que confirmar el negocio.
INSERT INTO ALERGENOS (ALE_Nombre) VALUES
    ('Gluten'), ('Leche'), ('Huevo'), ('Soya'), ('Maní'),
    ('Frutos secos'), ('Ajonjolí');

INSERT INTO TIPOS_ENTREGA (TEN_Nombre, TEN_Costo, TEN_PideDireccion) VALUES
    ('Retiro en el local', 0.00, FALSE),
    ('A domicilio',        1.50, TRUE);

INSERT INTO ESTADOS_PEDIDO (EPE_Nombre, EPE_Orden) VALUES
    ('Pendiente de pago',  1),
    ('Pagado',             2),
    ('En preparación',     3),
    ('Listo para retirar', 4),
    ('En camino',          5),
    ('Entregado',          6),
    ('Cancelado',          7);

INSERT INTO TIPOS_IDENTIFICACION (TID_Codigo, TID_Nombre) VALUES
    ('04', 'RUC'),
    ('05', 'Cédula'),
    ('06', 'Pasaporte'),
    ('07', 'Consumidor final');

INSERT INTO CLIENTES (TID_Codigo, CLI_Identificacion, CLI_RazonSocial) VALUES
    ('07', '9999999999999', 'CONSUMIDOR FINAL');

INSERT INTO METODOS_PAGO (MPA_Nombre, MPA_CodigoSri, MPA_UsaTarjeta) VALUES
    ('Efectivo',           '01', FALSE),
    ('Tarjeta de débito',  '16', TRUE),
    ('Tarjeta de crédito', '19', TRUE);

-- Permisos de los módulos internos (compras, bodega, producción, nómina y
-- contabilidad). Los usa el personal, no el cliente del sitio.
INSERT INTO PERMISOS (PER_Nombre, PER_Descripcion) VALUES
    ('compras.aprobar',      'Aprobar o anular órdenes de compra'),
    ('bodega.recibir',       'Registrar lo que llega de una orden de compra'),
    ('inventario.ajustar',   'Hacer y aprobar ajustes de inventario'),
    ('produccion.registrar', 'Registrar y aprobar órdenes de producción'),
    ('nomina.aprobar',       'Generar y aprobar roles de pago'),
    ('contabilidad.aprobar', 'Aprobar o anular asientos contables'),
    ('inventario.ver',       'Ver existencias, lotes por caducar y movimientos de bodega'),
    ('inventario.reportar',  'Reportar un faltante o sobrante de inventario (lo aprueba otra persona)');

INSERT INTO ROLES_PERMISOS (ROL_Codigo, PER_Codigo)
SELECT r.ROL_Codigo, p.PER_Codigo
  FROM (VALUES
        ('Administrador', 'compras.aprobar'),
        ('Administrador', 'bodega.recibir'),
        ('Administrador', 'inventario.ajustar'),
        ('Administrador', 'produccion.registrar'),
        ('Administrador', 'nomina.aprobar'),
        ('Administrador', 'contabilidad.aprobar'),
        ('Administrador', 'inventario.ver'),
        ('Administrador', 'inventario.reportar'),
        ('Empleado',      'bodega.recibir'),
        ('Empleado',      'produccion.registrar'),
        ('Empleado',      'inventario.ver'),
        ('Empleado',      'inventario.reportar')
       ) AS v (rol, permiso)
  JOIN ROLES r    ON r.ROL_Nombre = v.rol
  JOIN PERMISOS p ON p.PER_Nombre = v.permiso;

INSERT INTO CARGOS (CAR_Nombre, CAR_Funciones) VALUES
    ('Jefe de producción',    'Planifica las tandas y aprueba las órdenes de producción'),
    ('Panadero',              'Prepara y hornea el pan'),
    ('Pastelero',             'Prepara pasteles, galletas y dulces'),
    ('Ayudante de panadería', 'Pesa ingredientes, limpia y empaca'),
    ('Cajero',                'Cobra, factura y entrega los pedidos en el local'),
    ('Repartidor',            'Lleva los pedidos a domicilio'),
    ('Bodeguero',             'Recibe lo comprado, cuida los lotes y hace los conteos'),
    ('Jefe de compras',       'Elige proveedores y genera las órdenes de compra'),
    ('Administrador',         'Aprueba compras, ajustes y roles de pago'),
    ('Contador',              'Revisa y aprueba los asientos contables');

INSERT INTO UNIDADES_MEDIDA (UMI_Nombre, UMI_Abreviatura) VALUES
    ('Gramo',             'g'),
    ('Kilogramo',         'kg'),
    ('Quintal',           'qq'),
    ('Saco de 50 kg',     'saco'),
    ('Mililitro',         'ml'),
    ('Litro',             'L'),
    ('Unidad',            'u'),
    ('Cubeta de 30',      'cubeta'),
    ('Paca de 12',        'paca12'),
    ('Paca de 6',         'paca6');

INSERT INTO METODOS_COSTEO (MCO_Sigla, MCO_Nombre) VALUES
    ('FEFO', 'Primero en caducar, primero en salir'),
    ('FIFO', 'Primero en entrar, primero en salir'),
    ('LIFO', 'Último en entrar, primero en salir'),
    ('PROM', 'Costo promedio ponderado');

INSERT INTO TIPOS_MATERIAL (TMA_Nombre) VALUES
    ('Harinas y cereales'), ('Lácteos y huevos'), ('Azúcares y chocolates'),
    ('Grasas'), ('Levaduras y condimentos'), ('Frutas'), ('Bebidas para reventa');

-- Materia prima e insumos. El factor pasa de la unidad de compra a la de
-- producción (1 qq = 45359,2 g). Vida útil, método y mínimo son de ejemplo:
-- los tiene que confirmar el negocio. El IVA sigue la misma suposición que
-- el catálogo (lo básico 0 %, lo demás 15 %).
INSERT INTO MATERIALES (TMA_Codigo, MCO_Codigo, TIV_Codigo, UMI_CodigoCompra, UMI_CodigoProduccion,
                        MAT_Nombre, MAT_FactorConversion, MAT_Perecible, MAT_DiasVidaUtil, MAT_StockMinimo)
SELECT tm.TMA_Codigo, mc.MCO_Codigo, t.TIV_Codigo, uc.UMI_Codigo, up.UMI_Codigo,
       v.nombre, v.factor, v.dias IS NOT NULL, v.dias, v.minimo
  FROM (VALUES
        ('Harina de trigo',         'Harinas y cereales',      'FEFO', '0', 'qq',     'g',  45359.2, 180, 20000),
        ('Avena en hojuelas',       'Harinas y cereales',      'FEFO', '0', 'kg',     'g',  1000,    180, 2000),
        ('Galleta molida',          'Harinas y cereales',      'FIFO', '4', 'kg',     'g',  1000,    90,  1000),
        ('Leche entera',            'Lácteos y huevos',        'FEFO', '0', 'L',      'ml', 1000,    7,   10000),
        ('Queso fresco',            'Lácteos y huevos',        'FEFO', '0', 'kg',     'g',  1000,    10,  2000),
        ('Queso crema',             'Lácteos y huevos',        'FEFO', '4', 'kg',     'g',  1000,    20,  1000),
        ('Huevos',                  'Lácteos y huevos',        'FEFO', '0', 'cubeta', 'u',  30,      21,  60),
        ('Azúcar',                  'Azúcares y chocolates',   'FIFO', '0', 'saco',   'g',  50000,   NULL, 10000),
        ('Chocolate en barra',      'Azúcares y chocolates',   'FIFO', '4', 'kg',     'g',  1000,    180, 1000),
        ('Cacao en polvo',          'Azúcares y chocolates',   'PROM', '4', 'kg',     'g',  1000,    NULL, 500),
        ('Chispas de chocolate',    'Azúcares y chocolates',   'FIFO', '4', 'kg',     'g',  1000,    180, 500),
        ('Grageas de colores',      'Azúcares y chocolates',   'PROM', '4', 'kg',     'g',  1000,    NULL, 200),
        ('Mantequilla',             'Grasas',                  'FEFO', '0', 'kg',     'g',  1000,    60,  2000),
        ('Levadura fresca',         'Levaduras y condimentos', 'FEFO', '0', 'kg',     'g',  1000,    30,  500),
        ('Sal',                     'Levaduras y condimentos', 'PROM', '0', 'kg',     'g',  1000,    NULL, 1000),
        ('Esencia de vainilla',     'Levaduras y condimentos', 'PROM', '4', 'L',      'ml', 1000,    NULL, 100),
        ('Canela molida',           'Levaduras y condimentos', 'PROM', '0', 'kg',     'g',  1000,    NULL, 100),
        ('Limón',                   'Frutas',                  'FEFO', '0', 'kg',     'g',  1000,    15,  500),
        ('Coca-Cola de 500 ml',     'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 24),
        ('Coca-Cola de 1 L',        'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Coca-Cola de 2 L',        'Bebidas para reventa',    'FEFO', '4', 'paca6',  'u',  6,       180, 6),
        ('Fanta de 500 ml',         'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Fanta de 1 L',            'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Sprite de 500 ml',        'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Sprite de 1 L',           'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Agua de 500 ml',          'Bebidas para reventa',    'FIFO', '4', 'paca12', 'u',  12,      NULL, 24),
        ('Agua de 1 L',             'Bebidas para reventa',    'FIFO', '4', 'paca12', 'u',  12,      NULL, 12),
        ('Powerade de 500 ml',      'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12),
        ('Powerade de 1 L',         'Bebidas para reventa',    'FEFO', '4', 'paca12', 'u',  12,      180, 12)
       ) AS v (nombre, tipo, metodo, iva_sri, compra, produccion, factor, dias, minimo)
  JOIN TIPOS_MATERIAL tm  ON tm.TMA_Nombre = v.tipo
  JOIN METODOS_COSTEO mc  ON mc.MCO_Sigla = v.metodo
  JOIN TARIFAS_IVA t      ON t.TIV_CodigoSri = v.iva_sri
  JOIN UNIDADES_MEDIDA uc ON uc.UMI_Abreviatura = v.compra
  JOIN UNIDADES_MEDIDA up ON up.UMI_Abreviatura = v.produccion;

-- Lo que lleva UNA unidad de cada producto y tamaño. Son cantidades de
-- ejemplo: las tiene que confirmar el panadero.
INSERT INTO RECETAS (PRO_Codigo, TAM_Codigo, MAT_Codigo, RCT_Cantidad)
SELECT p.PRO_Codigo, t.TAM_Codigo, m.MAT_Codigo, v.cantidad
  FROM (VALUES
        ('Pan redondo',                     'Único',  'Harina de trigo',      60),
        ('Pan redondo',                     'Único',  'Azúcar',               4),
        ('Pan redondo',                     'Único',  'Sal',                  1.2),
        ('Pan redondo',                     'Único',  'Levadura fresca',      2),
        ('Pan redondo',                     'Único',  'Mantequilla',          4),
        ('Pan redondo',                     'Único',  'Huevos',               0.05),
        ('Pan enrollado',                   'Único',  'Harina de trigo',      70),
        ('Pan enrollado',                   'Único',  'Azúcar',               5),
        ('Pan enrollado',                   'Único',  'Sal',                  1.2),
        ('Pan enrollado',                   'Único',  'Levadura fresca',      2),
        ('Pan enrollado',                   'Único',  'Mantequilla',          10),
        ('Palanqueta',                      'Único',  'Harina de trigo',      90),
        ('Palanqueta',                      'Único',  'Sal',                  1.8),
        ('Palanqueta',                      'Único',  'Levadura fresca',      2.5),
        ('Empanada de queso',               'Único',  'Harina de trigo',      50),
        ('Empanada de queso',               'Único',  'Mantequilla',          12),
        ('Empanada de queso',               'Único',  'Queso fresco',         30),
        ('Empanada de queso',               'Único',  'Azúcar',               5),
        ('Empanada de queso',               'Único',  'Huevos',               0.1),
        ('Pan de chocolate',                'Único',  'Harina de trigo',      65),
        ('Pan de chocolate',                'Único',  'Azúcar',               8),
        ('Pan de chocolate',                'Único',  'Levadura fresca',      2),
        ('Pan de chocolate',                'Único',  'Mantequilla',          6),
        ('Pan de chocolate',                'Único',  'Chocolate en barra',   15),
        ('Pan de chocolate',                'Único',  'Huevos',               0.05),
        ('Pan redondo dulce',               'Único',  'Harina de trigo',      60),
        ('Pan redondo dulce',               'Único',  'Azúcar',               10),
        ('Pan redondo dulce',               'Único',  'Levadura fresca',      2),
        ('Pan redondo dulce',               'Único',  'Mantequilla',          6),
        ('Pan redondo dulce',               'Único',  'Huevos',               0.1),
        ('Pan redondo dulce',               'Único',  'Grageas de colores',   3),
        ('Suspiros',                        'Único',  'Huevos',               0.25),
        ('Suspiros',                        'Único',  'Azúcar',               30),
        ('Galletas',                        'Único',  'Harina de trigo',      25),
        ('Galletas',                        'Único',  'Mantequilla',          12),
        ('Galletas',                        'Único',  'Azúcar',               12),
        ('Galletas',                        'Único',  'Huevos',               0.1),
        ('Galletas',                        'Único',  'Chispas de chocolate', 8),
        ('Rebanada de pastel de chocolate', 'Único',  'Harina de trigo',      30),
        ('Rebanada de pastel de chocolate', 'Único',  'Azúcar',               30),
        ('Rebanada de pastel de chocolate', 'Único',  'Huevos',               0.5),
        ('Rebanada de pastel de chocolate', 'Único',  'Mantequilla',          15),
        ('Rebanada de pastel de chocolate', 'Único',  'Cacao en polvo',       10),
        ('Rebanada de pastel de chocolate', 'Único',  'Leche entera',         20),
        ('Rebanada de pastel de chocolate', 'Único',  'Chocolate en barra',   20),
        ('Rebanada de pastel de vainilla',  'Único',  'Harina de trigo',      30),
        ('Rebanada de pastel de vainilla',  'Único',  'Azúcar',               30),
        ('Rebanada de pastel de vainilla',  'Único',  'Huevos',               0.5),
        ('Rebanada de pastel de vainilla',  'Único',  'Mantequilla',          15),
        ('Rebanada de pastel de vainilla',  'Único',  'Leche entera',         25),
        ('Rebanada de pastel de vainilla',  'Único',  'Esencia de vainilla',  2),
        ('Rebanada de cheesecake de limón', 'Único',  'Queso crema',          60),
        ('Rebanada de cheesecake de limón', 'Único',  'Azúcar',               20),
        ('Rebanada de cheesecake de limón', 'Único',  'Huevos',               0.3),
        ('Rebanada de cheesecake de limón', 'Único',  'Galleta molida',       25),
        ('Rebanada de cheesecake de limón', 'Único',  'Mantequilla',          8),
        ('Rebanada de cheesecake de limón', 'Único',  'Limón',                15),
        ('Coca-Cola',                       '500 ml', 'Coca-Cola de 500 ml',  1),
        ('Coca-Cola',                       '1 L',    'Coca-Cola de 1 L',     1),
        ('Coca-Cola',                       '2 L',    'Coca-Cola de 2 L',     1),
        ('Fanta',                           '500 ml', 'Fanta de 500 ml',      1),
        ('Fanta',                           '1 L',    'Fanta de 1 L',         1),
        ('Sprite',                          '500 ml', 'Sprite de 500 ml',     1),
        ('Sprite',                          '1 L',    'Sprite de 1 L',        1),
        ('Agua',                            '500 ml', 'Agua de 500 ml',       1),
        ('Agua',                            '1 L',    'Agua de 1 L',          1),
        ('Powerade',                        '500 ml', 'Powerade de 500 ml',   1),
        ('Powerade',                        '1 L',    'Powerade de 1 L',      1),
        ('Avena polaca',                    '300 ml', 'Leche entera',         240),
        ('Avena polaca',                    '300 ml', 'Avena en hojuelas',    20),
        ('Avena polaca',                    '300 ml', 'Azúcar',               15),
        ('Avena polaca',                    '300 ml', 'Canela molida',        0.5),
        ('Avena polaca',                    '500 ml', 'Leche entera',         400),
        ('Avena polaca',                    '500 ml', 'Avena en hojuelas',    33),
        ('Avena polaca',                    '500 ml', 'Azúcar',               25),
        ('Avena polaca',                    '500 ml', 'Canela molida',        0.8)
       ) AS v (producto, tamano, material, cantidad)
  JOIN PRODUCTOS p  ON p.PRO_Nombre = v.producto
  JOIN TAMANOS t    ON t.TAM_Descripcion = v.tamano
  JOIN MATERIALES m ON m.MAT_Nombre = v.material;

-- Plan de cuentas de la panadería, de lo general a lo particular (cada cuenta
-- después de su madre). Los asientos automáticos usan estos números.
INSERT INTO CUENTAS_CONTABLES (CUE_Numero, CUE_Nombre, CUE_Tipo) VALUES
    ('1',          'Activos',                                 'MAY'),
    ('1.1',        'Activo corriente',                        'MAY'),
    ('1.1.01',     'Efectivo y equivalentes de efectivo',     'MAY'),
    ('1.1.01.01',  'Caja general',                            'DET'),
    ('1.1.01.02',  'Bancos',                                  'DET'),
    ('1.1.02',     'Cuentas por cobrar',                      'MAY'),
    ('1.1.02.01',  'Clientes',                                'DET'),
    ('1.1.02.02',  'Préstamos a empleados',                   'DET'),
    ('1.1.03',     'Inventarios',                             'MAY'),
    ('1.1.03.01',  'Inventario de materia prima',             'DET'),
    ('1.1.03.02',  'Inventario de productos terminados',      'DET'),
    ('1.1.04',     'Impuestos anticipados',                   'MAY'),
    ('1.1.04.01',  'IVA pagado en compras',                   'DET'),
    ('2',          'Pasivos',                                 'MAY'),
    ('2.1',        'Pasivo corriente',                        'MAY'),
    ('2.1.01',     'Cuentas por pagar',                       'MAY'),
    ('2.1.01.01',  'Proveedores',                             'DET'),
    ('2.1.02',     'Obligaciones tributarias',                'MAY'),
    ('2.1.02.01',  'IVA cobrado en ventas',                   'DET'),
    ('2.1.02.02',  'Retenciones de impuesto a la renta',      'DET'),
    ('2.1.03',     'Obligaciones con el IESS',                'MAY'),
    ('2.1.03.01',  'Aportes al IESS por pagar',               'DET'),
    ('3',          'Patrimonio',                              'MAY'),
    ('3.1',        'Capital',                                 'MAY'),
    ('3.1.01',     'Capital social',                          'DET'),
    ('4',          'Ingresos',                                'MAY'),
    ('4.1',        'Ingresos operacionales',                  'MAY'),
    ('4.1.01',     'Ventas de productos',                     'DET'),
    ('4.1.02',     'Sobrantes de inventario',                 'DET'),
    ('5',          'Costos y gastos',                         'MAY'),
    ('5.1',        'Costos',                                  'MAY'),
    ('5.1.01',     'Costo de ventas',                         'DET'),
    ('5.2',        'Gastos de operación',                     'MAY'),
    ('5.2.01',     'Sueldos y salarios',                      'DET'),
    ('5.2.02',     'Horas extra',                             'DET'),
    ('5.2.03',     'Fondos de reserva',                       'DET'),
    ('5.2.04',     'Pérdida por deterioro de inventario',     'DET'),
    ('6',          'Cuentas de orden',                        'MAY');

INSERT INTO CONCEPTOS_NOMINA (CUE_Codigo, CNO_Numero, CNO_Nombre, CNO_Tipo)
SELECT c.CUE_Codigo, v.numero, v.nombre, v.tipo
  FROM (VALUES
        ('1000', 'Sueldo mensual',            'ING', '5.2.01'),
        ('1010', 'Horas extra',               'ING', '5.2.02'),
        ('1020', 'Fondo de reserva',          'ING', '5.2.03'),
        ('2000', 'Aporte personal al IESS',   'DES', '2.1.03.01'),
        ('2010', 'Préstamo de la empresa',    'DES', '1.1.02.02'),
        ('2021', 'Impuesto a la renta',       'DES', '2.1.02.02')
       ) AS v (numero, nombre, tipo, cuenta)
  JOIN CUENTAS_CONTABLES c ON c.CUE_Numero = v.cuenta;


/* =============================================================================
   Lo que usa la API del sitio (supabase/functions/api/index.ts)
   Un pedido del sitio toca cinco tablas (PEDIDOS, DETALLES_PEDIDO, PAGOS,
   CLIENTES y FACTURAS, y DIRECCIONES si es a domicilio). Va en una función
   para que sea una sola transacción: si una parte falla, no queda nada a
   medias. Los precios, el IVA y el total los pone la base, nunca la página.
   Los errores que puede leer el cliente salen con el código 22023 y un texto
   para él; cualquier otro es un fallo de la base.
   ========================================================================== */

-- Un pedido como lo enseña el sitio (el mismo registro que guardaba en
-- IndexedDB): número, fecha, entrega, cómo se pagó, sumas y líneas.
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

-- Los pedidos de una cuenta de Supabase Auth, el más nuevo primero.
CREATE FUNCTION FN_PEDIDOS_DE(p_auth UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(jsonb_agg(FN_PEDIDOS_JSON(p.PED_Codigo) ORDER BY p.PED_Fecha DESC, p.PED_Codigo DESC), '[]')
      FROM PEDIDOS p
      JOIN USUARIOS u ON u.USU_Codigo = p.USU_Codigo
     WHERE u.USU_CodigoAuth = p_auth;
$$;

-- Registra un pedido del sitio. p_pedido trae lo que se escribió:
--   lineas      [{ nombre: 'Coca-Cola 2 L', cantidad: 2 }]: el nombre lleva el
--               tamaño, como en la canasta ('Único' no se escribe)
--   modo        'domicilio' o 'retiro'
--   direccion, piso, referencia, notas   de la entrega a domicilio
--   metodo      'efectivo' o 'tarjeta'; ultimos: los 4 últimos de la tarjeta
--   factura     { aOtro, nombre, ident, correo, direccion }; sin aOtro, a
--               consumidor final
--   clave       un UUID por intento de pagar: si ya hay un pedido de esa
--               cuenta con esa clave, se devuelve ese y no se hace otro
-- Con tarjeta el pago queda aprobado y el pedido 'Pagado' (el cobro es
-- simulado); en efectivo, el pago queda por cobrar y el pedido 'Pendiente de
-- pago'. La factura se emite al momento y su trigger hace el asiento.
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
    -- Quién hace el cambio, para AUDITORIAS (solo dura esta transacción).
    PERFORM set_config('app.usuario', v_usuario, TRUE);

    -- El mismo intento otra vez (se perdio la respuesta): el que ya se hizo.
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

    -- La dirección: se reusa si ya la tenía igual; si no, una nueva en Tena.
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

    -- El número que ve el cliente, sin 0, 1, I ni O; se repite si ya existe.
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

    -- Cada línea por su nombre con el tamaño; precio e IVA los copia
    -- TG_DETALLES_PEDIDO_PRECIO del catálogo de hoy.
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

    -- A quién se factura: a otra persona o empresa (se guarda o se pone al
    -- día por su cédula o RUC), o a consumidor final.
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

-- Crea o pone al día la fila de USUARIOS de una cuenta de Auth (POST y PUT
-- /cuenta). Fija app.usuario antes de escribir, para que AUDITORIAS sepa
-- que el cambio lo hizo la propia cuenta. Una cuenta nueva entra como
-- Cliente; el correo es el de Auth y aquí no se cambia.
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


/* =============================================================================
   El panel de administración (#/admin). Lo llama solo la API, con la sesión
   de quien pide: cada función mira primero que esa cuenta tenga el permiso
   (ROLES_PERMISOS) y, si no, lanza 42501, que la API contesta con 403. Las que
   escriben fijan app.usuario para que AUDITORIAS sepa quién fue.
   ========================================================================== */

-- Si la cuenta (activa) tiene el permiso. Los permisos son los de su rol.
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

-- Lanza 42501 si la cuenta no tiene el permiso; devuelve su código de usuario.
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

-- Quién es y qué puede hacer: lo que la página usa para enseñar o no el panel.
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

-- Los últimos 100 pedidos de todos los clientes, con quién los hizo.
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

-- Pasa un pedido a otro estado. Entregado y Cancelado son finales; "Listo
-- para retirar" es de retiro y "En camino" de domicilio. Devuelve el pedido.
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

-- El catálogo para editarlo: cada producto con sus tamaños y precios.
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

-- Guarda lo que el dueño cambió de un producto: si hay, si es recomendado y
-- el precio de cada tamaño (p_precios: {"TAM001": 1.25, ...}; los que no
-- vienen no cambian). Devuelve el producto como lo lista FN_ADMIN_PRODUCTOS.
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

-- El resumen: ventas de hoy y del mes (pedidos que no se cancelaron, a la hora
-- de Ecuador), los que faltan por entregar y lo más vendido en 30 días.
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


-- El inventario para el panel: existencias de materiales con su alerta, lotes
-- caducados o por caducar en 30 dias, y producido contra vendido de cada
-- producto. Los valores y costos solo salen para quien tiene reportes.ver
-- (el Administrador); para los demas van en null.
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

-- Los movimientos de un material (el kardex): compras, ajustes y producciones
-- con el saldo despues de cada uno, el mas nuevo primero.
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


-- Compras: proveedores. Un proveedor como lo ve el panel, con lo que vende.
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

-- Los proveedores, con los cantones y los materiales que se pueden elegir.
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

-- Alta de un proveedor. p_datos: tipo ('04' RUC o '05' cedula), identificacion,
-- razonSocial, correo, telefono y celular (opcionales), direccion, canton. Cada
-- dato se revisa aqui con su mensaje; la base vuelve a revisarlos con sus CHECK.
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

-- Lo que vende un proveedor: pone o cambia el precio de referencia (por unidad
-- de compra y sin IVA) y los dias que tarda en entregar.
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

-- Un proveedor desactivado ya no sale al hacer una orden de compra; sus
-- ordenes de antes se quedan como estaban.
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

-- Compras: ordenes de compra y recepciones de bodega.
-- Una orden como la ve el panel: con sus lineas (lo pedido y lo ya recibido),
-- los totales y el estado de su recepcion.
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

-- Las ultimas 100 ordenes.
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

-- Crea una orden abierta. p_datos: proveedor, entrega (AAAA-MM-DD), observacion
-- (opcional) y lineas [{ material, cantidad }] en la unidad de compra. El precio
-- y el IVA de cada linea son los del proveedor y el material en este momento.
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

-- Aprueba o anula una orden abierta. Aprobarla crea la recepcion pendiente
-- para bodega y el asiento; una orden aprobada ya no se anula.
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

-- Bodega: lo que espera llegar (sin precios, el bodeguero no los ve) y lo
-- ultimo que se recibio.
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

-- Confirma lo que llego. p_lineas: [{ material, cantidad, caducidad? }] en la
-- unidad de compra; lo que no se nombra es que no llego. No se recibe mas de
-- lo que falta, y si algo queda corto hace falta el motivo (p_observacion).
-- Cada linea es un lote; con ellos entra el inventario.
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

-- Produccion y ajustes de inventario.
-- Las tandas producidas (las ultimas 50), con lo que se puede producir (los
-- productos y tamanos que tienen receta). El costo solo con reportes.ver.
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

-- Registra una tanda ya hecha: crea la orden y la aprueba en el mismo paso, y
-- con eso se descuentan de los lotes los materiales de la receta. Si algun
-- material no alcanza no se guarda nada y se dice cual falta.
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

-- Un ajuste de inventario como lo ve el panel.
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

-- Los ajustes (los ultimos 100) y los lotes con saldo que se pueden ajustar.
-- Lo reporta quien tiene inventario.reportar; aprobarlo es de inventario.ajustar
-- y de otra persona (lo pide la base).
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

-- Reporta un faltante o sobrante. p_datos: motivo y lineas [{ lote, cantidad }]
-- con la cantidad en unidad de produccion: negativa si falta, positiva si sobra.
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

-- Aprueba o anula un ajuste abierto. Aprobar es de inventario.ajustar y de una
-- persona distinta de quien lo reporto; anular, ademas, lo puede hacer quien
-- lo reporto. Aprobar crea el asiento de perdida o sobrante.
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

-- Equipo: los empleados, su cargo y sueldo, y que cuentas del sitio tienen
-- acceso al panel. El que gestiona es quien tiene usuarios.gestionar (el
-- Administrador). Nadie cambia el rol ni el acceso de su propia cuenta, y por
-- eso siempre queda al menos un Administrador.
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

-- Alta de un empleado. p_datos: cedula, primerNombre, segundoNombre?,
-- primerApellido, segundoApellido?, nacimiento (AAAA-MM-DD), sexo (H o M),
-- correo, celular, direccion, canton, cargo, contrato (PER, TEM, TER o SPR) y
-- sueldo. Ingresa hoy.
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

-- Cambia el cargo, el sueldo o si sigue activo. p_datos trae solo lo que
-- cambia. Dar de baja a un empleado le quita el acceso al panel a sus cuentas
-- (vuelven a ser de cliente); no se da de baja a si mismo.
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

-- Da acceso al panel: liga la cuenta con ese correo (la persona tiene que haber
-- creado y verificado su cuenta en el sitio) al empleado, con el rol Empleado o
-- Administrador.
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

-- Quita el acceso al panel de una cuenta de ese empleado: vuelve a ser de cliente.
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

-- Panel, Facturas y Clientes (facturas.anular, solo el Administrador).
-- Una factura como la ve el panel: número 001-001-000000001, de qué pedido
-- es, a quién, por cuánto y si sigue vigente.
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

-- Las últimas 100 facturas y todos los clientes con lo que se les ha facturado.
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

-- Anula una factura vigente. Se crea solo el asiento contrario de la venta.
-- Una factura anulada no vuelve a ser válida.
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

-- Panel, Nómina (nomina.aprobar, solo el Administrador). Un rol de pagos como
-- lo ve el panel: de quién y de qué mes, su estado, lo que suma y cada línea.
-- El sueldo y el aporte al IESS los pone solos la base al crear el rol, y no
-- se quitan ("fija"); lo demás se agrega o se quita mientras el rol está abierto.
CREATE FUNCTION FN_NOMINA_JSON(p_nomina CHAR)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
               'codigo',     n.NOM_Codigo,
               'empleado',   n.EMP_Codigo,
               'nombre',     e.EMP_PrimerNombre || ' ' || e.EMP_PrimerApellido,
               'anio',       n.NOM_Anio,
               'mes',        n.NOM_Mes,
               'estado',     CASE n.NOM_Estado WHEN 'ABI' THEN 'Abierto' WHEN 'APR' THEN 'Aprobado' ELSE 'Anulado' END,
               'fechaPago',  n.NOM_FechaPago,
               'ingresos',   v.NOM_Ingresos,
               'descuentos', v.NOM_Descuentos,
               'neto',       v.NOM_Neto,
               'lineas',     (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                                     'numero', c.CNO_Numero, 'nombre', c.CNO_Nombre, 'tipo', c.CNO_Tipo,
                                     'cantidad', d.DNO_Cantidad, 'valor', d.DNO_Valor,
                                     'fija', c.CNO_Numero IN ('1000', '2000'))
                                   ORDER BY c.CNO_Tipo, c.CNO_Numero), '[]')
                                FROM DETALLES_NOMINA d JOIN CONCEPTOS_NOMINA c ON c.CNO_Codigo = d.CNO_Codigo
                               WHERE d.NOM_Codigo = n.NOM_Codigo))
      FROM NOMINAS n
      JOIN EMPLEADOS e ON e.EMP_Codigo = n.EMP_Codigo
      JOIN VW_NOMINAS v ON v.NOM_Codigo = n.NOM_Codigo
     WHERE n.NOM_Codigo = p_nomina;
$$;

-- Los últimos 60 roles, los empleados activos (para abrir uno) y los
-- conceptos que se pueden agregar a mano.
CREATE FUNCTION FN_ADMIN_NOMINAS(p_auth UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF NOT FN_TIENE_PERMISO(p_auth, 'nomina.aprobar') THEN
        RAISE EXCEPTION 'No tienes permiso para esto.' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object(
        'nominas',   (SELECT COALESCE(jsonb_agg(FN_NOMINA_JSON(x.NOM_Codigo) ORDER BY x.NOM_Anio DESC, x.NOM_Mes DESC, x.NOM_Codigo DESC), '[]')
                        FROM (SELECT NOM_Codigo, NOM_Anio, NOM_Mes FROM NOMINAS
                               ORDER BY NOM_Anio DESC, NOM_Mes DESC, NOM_Codigo DESC LIMIT 60) x),
        'empleados', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                               'codigo', EMP_Codigo, 'nombre', EMP_PrimerNombre || ' ' || EMP_PrimerApellido, 'sueldo', EMP_Sueldo)
                             ORDER BY EMP_PrimerApellido, EMP_PrimerNombre), '[]')
                        FROM EMPLEADOS WHERE EMP_Activo),
        'conceptos', (SELECT COALESCE(jsonb_agg(jsonb_build_object('numero', CNO_Numero, 'nombre', CNO_Nombre, 'tipo', CNO_Tipo)
                             ORDER BY CNO_Tipo, CNO_Numero), '[]')
                        FROM CONCEPTOS_NOMINA WHERE CNO_Numero NOT IN ('1000', '2000')));
END;
$$;

-- Abre el rol de un empleado activo en un mes que ya llegó. La base le pone
-- el sueldo de hoy y el aporte al IESS.
CREATE FUNCTION FN_ADMIN_NOMINA_CREAR(p_auth UUID, p_empleado TEXT, p_anio INTEGER, p_mes INTEGER)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_activo BOOLEAN;
    v_nomina CHAR(10);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT EMP_Activo INTO v_activo FROM EMPLEADOS WHERE EMP_Codigo = p_empleado;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese empleado no existe.' USING ERRCODE = '22023';
    ELSIF NOT v_activo THEN
        RAISE EXCEPTION 'Ese empleado ya no está activo.' USING ERRCODE = '22023';
    END IF;
    IF p_anio IS NULL OR p_mes IS NULL OR p_mes NOT BETWEEN 1 AND 12 OR p_anio < 2000 THEN
        RAISE EXCEPTION 'Elige un mes y un año válidos.' USING ERRCODE = '22023';
    END IF;
    IF make_date(p_anio, p_mes, 1) > date_trunc('month', CURRENT_DATE)::DATE THEN
        RAISE EXCEPTION 'Ese mes todavía no llega.' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM NOMINAS WHERE EMP_Codigo = p_empleado AND NOM_Anio = p_anio AND NOM_Mes = p_mes AND NOM_Estado <> 'ANU') THEN
        RAISE EXCEPTION 'Ese empleado ya tiene su rol de ese mes.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO NOMINAS (EMP_Codigo, NOM_Anio, NOM_Mes) VALUES (p_empleado, p_anio, p_mes)
    RETURNING NOM_Codigo INTO v_nomina;
    RETURN FN_NOMINA_JSON(v_nomina);
END;
$$;

-- Agrega (o cambia) una línea de un rol abierto: horas extra, fondo de
-- reserva, préstamo o impuesto a la renta. Cantidad son días u horas.
CREATE FUNCTION FN_ADMIN_NOMINA_LINEA(p_auth UUID, p_nomina TEXT, p_concepto TEXT, p_cantidad NUMERIC, p_valor NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_estado   CHAR(3);
    v_concepto CHAR(6);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_estado FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    ELSIF v_estado <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya no está abierto y no se cambia.' USING ERRCODE = '22023';
    END IF;
    SELECT CNO_Codigo INTO v_concepto FROM CONCEPTOS_NOMINA WHERE CNO_Numero = p_concepto AND CNO_Numero NOT IN ('1000', '2000');
    IF v_concepto IS NULL THEN
        RAISE EXCEPTION 'Ese concepto no se agrega a mano.' USING ERRCODE = '22023';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad <= 0 OR p_cantidad > 9999 THEN
        RAISE EXCEPTION 'La cantidad tiene que ser mayor que 0.' USING ERRCODE = '22023';
    END IF;
    IF p_valor IS NULL OR p_valor <= 0 OR p_valor > 99999999 THEN
        RAISE EXCEPTION 'El valor tiene que ser mayor que 0.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO DETALLES_NOMINA (NOM_Codigo, CNO_Codigo, DNO_Cantidad, DNO_Valor)
    VALUES (p_nomina, v_concepto, p_cantidad, ROUND(p_valor, 2))
    ON CONFLICT (NOM_Codigo, CNO_Codigo) DO UPDATE SET DNO_Cantidad = EXCLUDED.DNO_Cantidad, DNO_Valor = EXCLUDED.DNO_Valor;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

-- Quita una línea agregada a mano de un rol abierto.
CREATE FUNCTION FN_ADMIN_NOMINA_QUITAR_LINEA(p_auth UUID, p_nomina TEXT, p_concepto TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_estado CHAR(3);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_estado FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    ELSIF v_estado <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya no está abierto y no se cambia.' USING ERRCODE = '22023';
    END IF;
    IF p_concepto IN ('1000', '2000') THEN
        RAISE EXCEPTION 'El sueldo y el aporte al IESS no se quitan.' USING ERRCODE = '22023';
    END IF;
    DELETE FROM DETALLES_NOMINA
     WHERE NOM_Codigo = p_nomina AND CNO_Codigo = (SELECT CNO_Codigo FROM CONCEPTOS_NOMINA WHERE CNO_Numero = p_concepto);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no tiene esa línea.' USING ERRCODE = '22023';
    END IF;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

-- Aprueba (crea el asiento y pone hoy como fecha de pago) o anula un rol
-- abierto. Uno aprobado o anulado ya no cambia.
CREATE FUNCTION FN_ADMIN_NOMINA_ESTADO(p_auth UUID, p_nomina TEXT, p_estado TEXT)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_actual CHAR(3);
BEGIN
    PERFORM FN_EXIGIR_PERMISO(p_auth, 'nomina.aprobar');
    SELECT NOM_Estado INTO v_actual FROM NOMINAS WHERE NOM_Codigo = p_nomina FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ese rol no existe.' USING ERRCODE = '22023';
    END IF;
    IF p_estado NOT IN ('Aprobado', 'Anulado') THEN
        RAISE EXCEPTION 'Un rol se aprueba o se anula.' USING ERRCODE = '22023';
    END IF;
    IF v_actual <> 'ABI' THEN
        RAISE EXCEPTION 'Ese rol ya está %, y ya no cambia.', CASE v_actual WHEN 'APR' THEN 'aprobado' ELSE 'anulado' END USING ERRCODE = '22023';
    END IF;
    BEGIN
        IF p_estado = 'Aprobado' THEN
            UPDATE NOMINAS SET NOM_Estado = 'APR', NOM_FechaPago = CURRENT_DATE WHERE NOM_Codigo = p_nomina;
        ELSE
            UPDATE NOMINAS SET NOM_Estado = 'ANU' WHERE NOM_Codigo = p_nomina;
        END IF;
    EXCEPTION WHEN raise_exception THEN
        RAISE EXCEPTION '%', SQLERRM USING ERRCODE = '22023';
    END;
    RETURN FN_NOMINA_JSON(p_nomina);
END;
$$;

-- Panel, Contabilidad (contabilidad.aprobar, solo el Administrador). Un
-- asiento como lo ve el panel: de qué módulo viene, su estado, lo que suma el
-- DEBE y el HABER, si cuadra y cada línea con su cuenta.
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

-- Los últimos 200 asientos y el saldo de las cuentas que se han movido
-- (solo cuentan los asientos aprobados).
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

-- Aprueba (con el empleado de quien lo hace como contador) o anula un asiento
-- que todavía no está cerrado. Uno que no cuadra no se aprueba: la base lo
-- deja en "Con error" y se devuelve así.
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

/* =============================================================================
   Seguridad para Supabase: su API deja a cualquiera con la clave pública
   leer y escribir las tablas del esquema public. Se cierran todas (RLS sin
   políticas: por la API no entra nadie), las vistas usan los permisos de
   quien consulta y las funciones fijan dónde buscan las tablas. Al dueño
   (postgres, el editor SQL) RLS no le aplica. Las políticas se escriben
   cuando el sitio se conecte.
   ========================================================================== */

-- USUARIOS enlazada a Supabase Auth: cada fila apunta a su cuenta en
-- auth.users. Solo existe en Supabase; en otra base (PGlite, las pruebas) se
-- salta. RESTRICT: no se borra una cuenta de Auth que tenga pedidos.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE USUARIOS ADD CONSTRAINT FK_USUARIOS_AUTH FOREIGN KEY (USU_CodigoAuth)
            REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END;
$$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT c.relname, c.relkind
               FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v') LOOP
        IF r.relkind = 'r' THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
        ELSE
            EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', r.relname);
        END IF;
    END LOOP;
    FOR r IN SELECT p.oid::REGPROCEDURE AS firma
               FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.firma);
    END LOOP;
END;
$$;

-- Las funciones del sitio (pedidos y cuenta) solo las llama la API, con la
-- clave secreta (service_role): nadie con la clave pública puede usarlas.
REVOKE EXECUTE ON FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB), FN_PEDIDOS_DE(UUID), FN_PEDIDOS_JSON(CHAR), FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT),
    FN_TIENE_PERMISO(UUID, TEXT), FN_EXIGIR_PERMISO(UUID, TEXT), FN_ADMIN_YO(UUID), FN_ADMIN_PEDIDOS(UUID),
    FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT), FN_ADMIN_PRODUCTOS(UUID),
    FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB), FN_ADMIN_RESUMEN(UUID),
    FN_ADMIN_INVENTARIO(UUID), FN_ADMIN_KARDEX(UUID, TEXT),
    FN_PROVEEDOR_JSON(CHAR), FN_ADMIN_PROVEEDORES(UUID), FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB),
    FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER), FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT),
    FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN),
    FN_ORDEN_JSON(CHAR), FN_ADMIN_ORDENES(UUID), FN_ADMIN_ORDEN_CREAR(UUID, JSONB), FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT),
    FN_ADMIN_RECEPCIONES(UUID), FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT),
    FN_ADMIN_PRODUCCION(UUID), FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER),
    FN_AJUSTE_JSON(CHAR, BOOLEAN), FN_ADMIN_AJUSTES(UUID), FN_ADMIN_AJUSTE_CREAR(UUID, JSONB), FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT),
    FN_EMPLEADO_JSON(CHAR), FN_ADMIN_EQUIPO(UUID), FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB), FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB),
    FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT), FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT),
    FN_FACTURA_JSON(CHAR), FN_ADMIN_FACTURAS(UUID), FN_ADMIN_FACTURA_ANULAR(UUID, TEXT),
    FN_NOMINA_JSON(CHAR), FN_ADMIN_NOMINAS(UUID), FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER),
    FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC), FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT), FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT),
    FN_ASIENTO_JSON(CHAR), FN_ADMIN_CONTABILIDAD(UUID), FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE EXECUTE ON FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB), FN_PEDIDOS_DE(UUID), FN_PEDIDOS_JSON(CHAR), FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT),
    FN_TIENE_PERMISO(UUID, TEXT), FN_EXIGIR_PERMISO(UUID, TEXT), FN_ADMIN_YO(UUID), FN_ADMIN_PEDIDOS(UUID),
    FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT), FN_ADMIN_PRODUCTOS(UUID),
    FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB), FN_ADMIN_RESUMEN(UUID),
    FN_ADMIN_INVENTARIO(UUID), FN_ADMIN_KARDEX(UUID, TEXT),
    FN_PROVEEDOR_JSON(CHAR), FN_ADMIN_PROVEEDORES(UUID), FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB),
    FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER), FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT),
    FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN),
    FN_ORDEN_JSON(CHAR), FN_ADMIN_ORDENES(UUID), FN_ADMIN_ORDEN_CREAR(UUID, JSONB), FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT),
    FN_ADMIN_RECEPCIONES(UUID), FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT),
    FN_ADMIN_PRODUCCION(UUID), FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER),
    FN_AJUSTE_JSON(CHAR, BOOLEAN), FN_ADMIN_AJUSTES(UUID), FN_ADMIN_AJUSTE_CREAR(UUID, JSONB), FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT),
    FN_EMPLEADO_JSON(CHAR), FN_ADMIN_EQUIPO(UUID), FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB), FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB),
    FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT), FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT),
    FN_FACTURA_JSON(CHAR), FN_ADMIN_FACTURAS(UUID), FN_ADMIN_FACTURA_ANULAR(UUID, TEXT),
    FN_NOMINA_JSON(CHAR), FN_ADMIN_NOMINAS(UUID), FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER),
    FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC), FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT), FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT),
    FN_ASIENTO_JSON(CHAR), FN_ADMIN_CONTABILIDAD(UUID), FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT)
            FROM anon, authenticated;
        GRANT EXECUTE ON FUNCTION FN_PEDIDOS_REGISTRAR(UUID, JSONB), FN_PEDIDOS_DE(UUID), FN_PEDIDOS_JSON(CHAR), FN_USUARIOS_GUARDAR(UUID, TEXT, TEXT, TEXT, TEXT),
    FN_TIENE_PERMISO(UUID, TEXT), FN_EXIGIR_PERMISO(UUID, TEXT), FN_ADMIN_YO(UUID), FN_ADMIN_PEDIDOS(UUID),
    FN_ADMIN_PEDIDO_ESTADO(UUID, TEXT, TEXT), FN_ADMIN_PRODUCTOS(UUID),
    FN_ADMIN_PRODUCTO_GUARDAR(UUID, TEXT, BOOLEAN, BOOLEAN, JSONB), FN_ADMIN_RESUMEN(UUID),
    FN_ADMIN_INVENTARIO(UUID), FN_ADMIN_KARDEX(UUID, TEXT),
    FN_PROVEEDOR_JSON(CHAR), FN_ADMIN_PROVEEDORES(UUID), FN_ADMIN_PROVEEDOR_CREAR(UUID, JSONB),
    FN_ADMIN_PROVEEDOR_MATERIAL(UUID, TEXT, TEXT, NUMERIC, INTEGER), FN_ADMIN_PROVEEDOR_QUITAR_MATERIAL(UUID, TEXT, TEXT),
    FN_ADMIN_PROVEEDOR_ACTIVO(UUID, TEXT, BOOLEAN),
    FN_ORDEN_JSON(CHAR), FN_ADMIN_ORDENES(UUID), FN_ADMIN_ORDEN_CREAR(UUID, JSONB), FN_ADMIN_ORDEN_ESTADO(UUID, TEXT, TEXT),
    FN_ADMIN_RECEPCIONES(UUID), FN_ADMIN_RECEPCION_CONFIRMAR(UUID, TEXT, JSONB, TEXT),
    FN_ADMIN_PRODUCCION(UUID), FN_ADMIN_PRODUCCION_REGISTRAR(UUID, TEXT, TEXT, INTEGER),
    FN_AJUSTE_JSON(CHAR, BOOLEAN), FN_ADMIN_AJUSTES(UUID), FN_ADMIN_AJUSTE_CREAR(UUID, JSONB), FN_ADMIN_AJUSTE_ESTADO(UUID, TEXT, TEXT),
    FN_EMPLEADO_JSON(CHAR), FN_ADMIN_EQUIPO(UUID), FN_ADMIN_EMPLEADO_CREAR(UUID, JSONB), FN_ADMIN_EMPLEADO_EDITAR(UUID, TEXT, JSONB),
    FN_ADMIN_EMPLEADO_CUENTA(UUID, TEXT, TEXT, TEXT), FN_ADMIN_EMPLEADO_QUITAR_CUENTA(UUID, TEXT, TEXT),
    FN_FACTURA_JSON(CHAR), FN_ADMIN_FACTURAS(UUID), FN_ADMIN_FACTURA_ANULAR(UUID, TEXT),
    FN_NOMINA_JSON(CHAR), FN_ADMIN_NOMINAS(UUID), FN_ADMIN_NOMINA_CREAR(UUID, TEXT, INTEGER, INTEGER),
    FN_ADMIN_NOMINA_LINEA(UUID, TEXT, TEXT, NUMERIC, NUMERIC), FN_ADMIN_NOMINA_QUITAR_LINEA(UUID, TEXT, TEXT), FN_ADMIN_NOMINA_ESTADO(UUID, TEXT, TEXT),
    FN_ASIENTO_JSON(CHAR), FN_ADMIN_CONTABILIDAD(UUID), FN_ADMIN_ASIENTO_ESTADO(UUID, TEXT, TEXT)
            TO service_role;
    END IF;
END;
$$;

COMMIT;
