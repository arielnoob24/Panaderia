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
     PRODUCTOS, la categoría es CAT_Codigo.
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

   Grupos (25 tablas)
   1. Autenticación y autorización: ROLES, PERMISOS, ROLES_PERMISOS (débil),
      USUARIOS, VERIFICACIONES
   2. Ubicación: PROVINCIAS, CANTONES, DIRECCIONES
   3. Catálogo: CATEGORIAS, ETIQUETAS, TARIFAS_IVA, PRODUCTOS, TAMANOS,
      PRODUCTOS_TAMANOS (débil), ALERGENOS, PRODUCTOS_ALERGENOS (débil)
   4. Pedidos: TIPOS_ENTREGA, ESTADOS_PEDIDO, PEDIDOS, DETALLES_PEDIDO (débil)
   5. Facturación y pagos: TIPOS_IDENTIFICACION, CLIENTES, FACTURAS,
      METODOS_PAGO, PAGOS

   Relaciones (todas 1:N; "A 1:N B" = un A tiene muchos B)
   ROLES 1:N USUARIOS                      ROLES 1:N ROLES_PERMISOS
   PERMISOS 1:N ROLES_PERMISOS             USUARIOS 1:N VERIFICACIONES
   USUARIOS 1:N DIRECCIONES                USUARIOS 1:N PEDIDOS
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

-- La contraseña nunca se guarda: solo su huella PBKDF2-SHA256 (32 bytes), la
-- sal (16 bytes) y las iteraciones con que se calculó, como hace el sitio.
CREATE SEQUENCE SEQ_USUARIOS MAXVALUE 9999999;
CREATE TABLE USUARIOS (
    USU_Codigo         CHAR(10)     NOT NULL DEFAULT 'USU' || LPAD(nextval('SEQ_USUARIOS')::TEXT, 7, '0'),
    ROL_Codigo         CHAR(6)      NOT NULL,
    USU_Nombres        VARCHAR(60)  NOT NULL,
    USU_Apellidos      VARCHAR(60)  NOT NULL,
    USU_Correo         VARCHAR(254) NOT NULL,
    USU_Celular        CHAR(10)     NOT NULL,   -- formato nacional: 09XXXXXXXX
    USU_HuellaClave    BYTEA        NOT NULL,
    USU_Sal            BYTEA        NOT NULL,
    USU_Iteraciones    INTEGER      NOT NULL DEFAULT 210000,
    USU_Activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    USU_FechaRegistro  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT PK_USUARIOS PRIMARY KEY (USU_Codigo),
    CONSTRAINT UQ_USUARIOS_Correo UNIQUE (USU_Correo),
    CONSTRAINT FK_USUARIOS_ROLES FOREIGN KEY (ROL_Codigo)
        REFERENCES ROLES (ROL_Codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_USUARIOS_Codigo CHECK (USU_Codigo ~ '^USU[0-9]{7}$'),
    CONSTRAINT CK_USUARIOS_Nombres CHECK (btrim(USU_Nombres) <> ''),
    CONSTRAINT CK_USUARIOS_Apellidos CHECK (btrim(USU_Apellidos) <> ''),
    -- En minúsculas, para que Ana@x.com y ana@x.com no sean dos cuentas.
    CONSTRAINT CK_USUARIOS_Correo CHECK (
        USU_Correo = lower(USU_Correo)
        AND USU_Correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    CONSTRAINT CK_USUARIOS_Celular CHECK (USU_Celular ~ '^09[0-9]{8}$'),
    CONSTRAINT CK_USUARIOS_HuellaClave CHECK (octet_length(USU_HuellaClave) = 32),
    CONSTRAINT CK_USUARIOS_Sal CHECK (octet_length(USU_Sal) = 16),
    CONSTRAINT CK_USUARIOS_Iteraciones CHECK (USU_Iteraciones >= 100000)
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
-- lo copia TG_PEDIDOS_ENTREGA desde TIPOS_ENTREGA.
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
    CONSTRAINT PK_PEDIDOS PRIMARY KEY (PED_Codigo),
    CONSTRAINT UQ_PEDIDOS_Numero UNIQUE (PED_Numero),
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


/* =============================================================================
   Vistas: lo que se calcula no se guarda
   ========================================================================== */

-- Usuarios con su rol y si ya verificaron el correo.
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
                  AND v.VER_FechaUso IS NOT NULL) AS USU_CorreoVerificado
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

COMMIT;
