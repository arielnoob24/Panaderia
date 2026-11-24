-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "accesos" (
    "acc_codigo" CHAR(12) NOT NULL DEFAULT ('ACC'::text || lpad((nextval('seq_accesos'::regclass))::text, 9, '0'::text)),
    "usu_codigo" CHAR(10) NOT NULL,
    "acc_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acc_exitoso" BOOLEAN NOT NULL,
    "acc_motivo" CHAR(3),

    CONSTRAINT "pk_accesos" PRIMARY KEY ("acc_codigo")
);

-- CreateTable
CREATE TABLE "ajustes_inventario" (
    "aju_codigo" CHAR(10) NOT NULL DEFAULT ('AJU'::text || lpad((nextval('seq_ajustes_inventario'::regclass))::text, 7, '0'::text)),
    "emp_codigo" CHAR(10) NOT NULL,
    "emp_codigoautoriza" CHAR(10),
    "aju_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aju_motivo" VARCHAR(150) NOT NULL,
    "aju_estado" CHAR(3) NOT NULL DEFAULT 'ABI',

    CONSTRAINT "pk_ajustes_inventario" PRIMARY KEY ("aju_codigo")
);

-- CreateTable
CREATE TABLE "alergenos" (
    "ale_codigo" CHAR(6) NOT NULL DEFAULT ('ALE'::text || lpad((nextval('seq_alergenos'::regclass))::text, 3, '0'::text)),
    "ale_nombre" VARCHAR(40) NOT NULL,

    CONSTRAINT "pk_alergenos" PRIMARY KEY ("ale_codigo")
);

-- CreateTable
CREATE TABLE "asientos" (
    "asi_codigo" CHAR(10) NOT NULL DEFAULT ('ASI'::text || lpad((nextval('seq_asientos'::regclass))::text, 7, '0'::text)),
    "emp_codigo" CHAR(10),
    "asi_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asi_descripcion" VARCHAR(150) NOT NULL,
    "asi_origen" CHAR(3) NOT NULL DEFAULT 'MAN',
    "asi_referencia" CHAR(10),
    "asi_estado" CHAR(3) NOT NULL DEFAULT 'ABI',

    CONSTRAINT "pk_asientos" PRIMARY KEY ("asi_codigo")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "aud_codigo" CHAR(12) NOT NULL DEFAULT ('AUD'::text || lpad((nextval('seq_auditorias'::regclass))::text, 9, '0'::text)),
    "usu_codigo" CHAR(10),
    "aud_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aud_tabla" VARCHAR(40) NOT NULL,
    "aud_operacion" CHAR(1) NOT NULL,
    "aud_clave" VARCHAR(60) NOT NULL,
    "aud_antes" JSONB,
    "aud_despues" JSONB,

    CONSTRAINT "pk_auditorias" PRIMARY KEY ("aud_codigo")
);

-- CreateTable
CREATE TABLE "cantones" (
    "can_codigo" CHAR(4) NOT NULL,
    "prv_codigo" CHAR(2) NOT NULL,
    "can_nombre" VARCHAR(60) NOT NULL,

    CONSTRAINT "pk_cantones" PRIMARY KEY ("can_codigo")
);

-- CreateTable
CREATE TABLE "cargos" (
    "car_codigo" CHAR(6) NOT NULL DEFAULT ('CAR'::text || lpad((nextval('seq_cargos'::regclass))::text, 3, '0'::text)),
    "car_nombre" VARCHAR(40) NOT NULL,
    "car_funciones" VARCHAR(250),

    CONSTRAINT "pk_cargos" PRIMARY KEY ("car_codigo")
);

-- CreateTable
CREATE TABLE "categorias" (
    "cat_codigo" CHAR(6) NOT NULL DEFAULT ('CAT'::text || lpad((nextval('seq_categorias'::regclass))::text, 3, '0'::text)),
    "cat_nombre" VARCHAR(40) NOT NULL,
    "cat_slug" VARCHAR(40) NOT NULL,

    CONSTRAINT "pk_categorias" PRIMARY KEY ("cat_codigo")
);

-- CreateTable
CREATE TABLE "clientes" (
    "cli_codigo" CHAR(10) NOT NULL DEFAULT ('CLI'::text || lpad((nextval('seq_clientes'::regclass))::text, 7, '0'::text)),
    "tid_codigo" CHAR(2) NOT NULL,
    "cli_identificacion" VARCHAR(20) NOT NULL,
    "cli_razonsocial" VARCHAR(150) NOT NULL,
    "cli_correo" VARCHAR(254),
    "cli_telefono" VARCHAR(10),
    "cli_direccion" VARCHAR(200),

    CONSTRAINT "pk_clientes" PRIMARY KEY ("cli_codigo")
);

-- CreateTable
CREATE TABLE "conceptos_nomina" (
    "cno_codigo" CHAR(6) NOT NULL DEFAULT ('CNO'::text || lpad((nextval('seq_conceptos_nomina'::regclass))::text, 3, '0'::text)),
    "cue_codigo" CHAR(6) NOT NULL,
    "cno_numero" CHAR(4) NOT NULL,
    "cno_nombre" VARCHAR(60) NOT NULL,
    "cno_tipo" CHAR(3) NOT NULL,

    CONSTRAINT "pk_conceptos_nomina" PRIMARY KEY ("cno_codigo")
);

-- CreateTable
CREATE TABLE "consumos_produccion" (
    "orp_codigo" CHAR(10) NOT NULL,
    "lma_codigo" CHAR(10) NOT NULL,
    "cpr_cantidad" DECIMAL(14,3) NOT NULL,
    "cpr_costounitario" DECIMAL(18,10) NOT NULL,

    CONSTRAINT "pk_consumos_produccion" PRIMARY KEY ("orp_codigo","lma_codigo")
);

-- CreateTable
CREATE TABLE "cuentas_contables" (
    "cue_codigo" CHAR(6) NOT NULL DEFAULT ('CUE'::text || lpad((nextval('seq_cuentas_contables'::regclass))::text, 3, '0'::text)),
    "cue_numero" VARCHAR(20) NOT NULL,
    "cue_nombre" VARCHAR(80) NOT NULL,
    "cue_tipo" CHAR(3) NOT NULL,
    "cue_activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_cuentas_contables" PRIMARY KEY ("cue_codigo")
);

-- CreateTable
CREATE TABLE "detalles_ajuste" (
    "aju_codigo" CHAR(10) NOT NULL,
    "lma_codigo" CHAR(10) NOT NULL,
    "daj_cantidad" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "pk_detalles_ajuste" PRIMARY KEY ("aju_codigo","lma_codigo")
);

-- CreateTable
CREATE TABLE "detalles_asiento" (
    "asi_codigo" CHAR(10) NOT NULL,
    "cue_codigo" CHAR(6) NOT NULL,
    "das_debe" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "das_haber" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pk_detalles_asiento" PRIMARY KEY ("asi_codigo","cue_codigo")
);

-- CreateTable
CREATE TABLE "detalles_nomina" (
    "nom_codigo" CHAR(10) NOT NULL,
    "cno_codigo" CHAR(6) NOT NULL,
    "dno_cantidad" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "dno_valor" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pk_detalles_nomina" PRIMARY KEY ("nom_codigo","cno_codigo")
);

-- CreateTable
CREATE TABLE "detalles_orden_compra" (
    "oco_codigo" CHAR(10) NOT NULL,
    "mat_codigo" CHAR(6) NOT NULL,
    "doc_cantidad" DECIMAL(10,2) NOT NULL,
    "doc_preciounitario" DECIMAL(10,4) NOT NULL,
    "doc_porcentajeiva" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "pk_detalles_orden_compra" PRIMARY KEY ("oco_codigo","mat_codigo")
);

-- CreateTable
CREATE TABLE "detalles_pedido" (
    "ped_codigo" CHAR(10) NOT NULL,
    "pro_codigo" CHAR(6) NOT NULL,
    "tam_codigo" CHAR(6) NOT NULL,
    "dpe_cantidad" SMALLINT NOT NULL,
    "dpe_preciounitario" DECIMAL(8,2) NOT NULL,
    "dpe_porcentajeiva" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "pk_detalles_pedido" PRIMARY KEY ("ped_codigo","pro_codigo","tam_codigo")
);

-- CreateTable
CREATE TABLE "direcciones" (
    "dir_codigo" CHAR(10) NOT NULL DEFAULT ('DIR'::text || lpad((nextval('seq_direcciones'::regclass))::text, 7, '0'::text)),
    "usu_codigo" CHAR(10) NOT NULL,
    "can_codigo" CHAR(4) NOT NULL,
    "dir_alias" VARCHAR(30) NOT NULL DEFAULT 'Casa',
    "dir_calleprincipal" VARCHAR(80) NOT NULL,
    "dir_callesecundaria" VARCHAR(80),
    "dir_numeracion" VARCHAR(10),
    "dir_referencia" VARCHAR(150),

    CONSTRAINT "pk_direcciones" PRIMARY KEY ("dir_codigo")
);

-- CreateTable
CREATE TABLE "empleados" (
    "emp_codigo" CHAR(10) NOT NULL DEFAULT ('EMP'::text || lpad((nextval('seq_empleados'::regclass))::text, 7, '0'::text)),
    "can_codigo" CHAR(4) NOT NULL,
    "car_codigo" CHAR(6) NOT NULL,
    "emp_cedula" CHAR(10) NOT NULL,
    "emp_primerapellido" VARCHAR(30) NOT NULL,
    "emp_segundoapellido" VARCHAR(30),
    "emp_primernombre" VARCHAR(30) NOT NULL,
    "emp_segundonombre" VARCHAR(30),
    "emp_fechanacimiento" DATE NOT NULL,
    "emp_sexo" CHAR(1) NOT NULL,
    "emp_tiposangre" VARCHAR(3),
    "emp_correo" VARCHAR(254) NOT NULL,
    "emp_celular" CHAR(10) NOT NULL,
    "emp_direccion" VARCHAR(200) NOT NULL,
    "emp_foto" VARCHAR(150),
    "emp_tipocontrato" CHAR(3) NOT NULL DEFAULT 'PER',
    "emp_sueldo" DECIMAL(8,2) NOT NULL,
    "emp_banco" VARCHAR(40),
    "emp_cuentabancaria" VARCHAR(20),
    "emp_fechaingreso" DATE NOT NULL DEFAULT CURRENT_DATE,
    "emp_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_empleados" PRIMARY KEY ("emp_codigo")
);

-- CreateTable
CREATE TABLE "estados_pedido" (
    "epe_codigo" CHAR(6) NOT NULL DEFAULT ('EPE'::text || lpad((nextval('seq_estados_pedido'::regclass))::text, 3, '0'::text)),
    "epe_nombre" VARCHAR(30) NOT NULL,
    "epe_orden" SMALLINT NOT NULL,

    CONSTRAINT "pk_estados_pedido" PRIMARY KEY ("epe_codigo")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "eti_codigo" CHAR(6) NOT NULL DEFAULT ('ETI'::text || lpad((nextval('seq_etiquetas'::regclass))::text, 3, '0'::text)),
    "eti_texto" VARCHAR(30) NOT NULL,
    "eti_color" VARCHAR(10) NOT NULL,

    CONSTRAINT "pk_etiquetas" PRIMARY KEY ("eti_codigo")
);

-- CreateTable
CREATE TABLE "facturas" (
    "fac_codigo" CHAR(10) NOT NULL DEFAULT ('FAC'::text || lpad((nextval('seq_facturas'::regclass))::text, 7, '0'::text)),
    "ped_codigo" CHAR(10) NOT NULL,
    "cli_codigo" CHAR(10) NOT NULL,
    "fac_establecimiento" CHAR(3) NOT NULL DEFAULT '001',
    "fac_puntoemision" CHAR(3) NOT NULL DEFAULT '001',
    "fac_secuencial" CHAR(9) NOT NULL,
    "fac_claveacceso" CHAR(49),
    "fac_fechaemision" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fac_fechaanulacion" TIMESTAMPTZ(6),

    CONSTRAINT "pk_facturas" PRIMARY KEY ("fac_codigo")
);

-- CreateTable
CREATE TABLE "lotes_material" (
    "lma_codigo" CHAR(10) NOT NULL DEFAULT ('LMA'::text || lpad((nextval('seq_lotes_material'::regclass))::text, 7, '0'::text)),
    "mat_codigo" CHAR(6) NOT NULL,
    "rcp_codigo" CHAR(10),
    "oco_codigo" CHAR(10),
    "lma_fechaingreso" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lma_fechacaducidad" DATE,
    "lma_cantidadrecibida" DECIMAL(10,2) NOT NULL,
    "lma_cantidadinicial" DECIMAL(14,3) NOT NULL,
    "lma_costounitario" DECIMAL(18,10) NOT NULL,

    CONSTRAINT "pk_lotes_material" PRIMARY KEY ("lma_codigo")
);

-- CreateTable
CREATE TABLE "materiales" (
    "mat_codigo" CHAR(6) NOT NULL DEFAULT ('MAT'::text || lpad((nextval('seq_materiales'::regclass))::text, 3, '0'::text)),
    "tma_codigo" CHAR(6) NOT NULL,
    "mco_codigo" CHAR(6) NOT NULL,
    "tiv_codigo" CHAR(6) NOT NULL,
    "umi_codigocompra" CHAR(6) NOT NULL,
    "umi_codigoproduccion" CHAR(6) NOT NULL,
    "mat_nombre" VARCHAR(60) NOT NULL,
    "mat_factorconversion" DECIMAL(12,4) NOT NULL,
    "mat_perecible" BOOLEAN NOT NULL DEFAULT false,
    "mat_diasvidautil" SMALLINT,
    "mat_stockminimo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "mat_codigobarras" VARCHAR(14),
    "mat_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_materiales" PRIMARY KEY ("mat_codigo")
);

-- CreateTable
CREATE TABLE "metodos_costeo" (
    "mco_codigo" CHAR(6) NOT NULL DEFAULT ('MCO'::text || lpad((nextval('seq_metodos_costeo'::regclass))::text, 3, '0'::text)),
    "mco_sigla" VARCHAR(4) NOT NULL,
    "mco_nombre" VARCHAR(60) NOT NULL,

    CONSTRAINT "pk_metodos_costeo" PRIMARY KEY ("mco_codigo")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "mpa_codigo" CHAR(6) NOT NULL DEFAULT ('MPA'::text || lpad((nextval('seq_metodos_pago'::regclass))::text, 3, '0'::text)),
    "mpa_nombre" VARCHAR(30) NOT NULL,
    "mpa_codigosri" CHAR(2) NOT NULL,
    "mpa_usatarjeta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pk_metodos_pago" PRIMARY KEY ("mpa_codigo")
);

-- CreateTable
CREATE TABLE "nominas" (
    "nom_codigo" CHAR(10) NOT NULL DEFAULT ('NOM'::text || lpad((nextval('seq_nominas'::regclass))::text, 7, '0'::text)),
    "emp_codigo" CHAR(10) NOT NULL,
    "nom_anio" SMALLINT NOT NULL,
    "nom_mes" SMALLINT NOT NULL,
    "nom_fechapago" DATE,
    "nom_estado" CHAR(3) NOT NULL DEFAULT 'ABI',

    CONSTRAINT "pk_nominas" PRIMARY KEY ("nom_codigo")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "oco_codigo" CHAR(10) NOT NULL DEFAULT ('OCO'::text || lpad((nextval('seq_ordenes_compra'::regclass))::text, 7, '0'::text)),
    "pvd_codigo" CHAR(10) NOT NULL,
    "emp_codigo" CHAR(10) NOT NULL,
    "oco_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oco_fechaentrega" DATE NOT NULL,
    "oco_estado" CHAR(3) NOT NULL DEFAULT 'ABI',
    "oco_observacion" VARCHAR(250),

    CONSTRAINT "pk_ordenes_compra" PRIMARY KEY ("oco_codigo")
);

-- CreateTable
CREATE TABLE "ordenes_produccion" (
    "orp_codigo" CHAR(10) NOT NULL DEFAULT ('ORP'::text || lpad((nextval('seq_ordenes_produccion'::regclass))::text, 7, '0'::text)),
    "pro_codigo" CHAR(6) NOT NULL,
    "tam_codigo" CHAR(6) NOT NULL,
    "emp_codigo" CHAR(10) NOT NULL,
    "orp_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orp_cantidad" INTEGER NOT NULL,
    "orp_estado" CHAR(3) NOT NULL DEFAULT 'ABI',

    CONSTRAINT "pk_ordenes_produccion" PRIMARY KEY ("orp_codigo")
);

-- CreateTable
CREATE TABLE "pagos" (
    "pag_codigo" CHAR(10) NOT NULL DEFAULT ('PAG'::text || lpad((nextval('seq_pagos'::regclass))::text, 7, '0'::text)),
    "ped_codigo" CHAR(10) NOT NULL,
    "mpa_codigo" CHAR(6) NOT NULL,
    "pag_monto" DECIMAL(10,2) NOT NULL,
    "pag_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pag_aprobado" BOOLEAN NOT NULL DEFAULT false,
    "pag_ultimosdigitos" CHAR(4),
    "pag_autorizacion" VARCHAR(20),

    CONSTRAINT "pk_pagos" PRIMARY KEY ("pag_codigo")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "ped_codigo" CHAR(10) NOT NULL DEFAULT ('PED'::text || lpad((nextval('seq_pedidos'::regclass))::text, 7, '0'::text)),
    "usu_codigo" CHAR(10) NOT NULL,
    "ten_codigo" CHAR(6) NOT NULL,
    "dir_codigo" CHAR(10),
    "epe_codigo" CHAR(6) NOT NULL,
    "ped_numero" CHAR(7) NOT NULL,
    "ped_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ped_costoenvio" DECIMAL(6,2) NOT NULL,
    "ped_observacion" VARCHAR(250),
    "ped_claveenvio" UUID,

    CONSTRAINT "pk_pedidos" PRIMARY KEY ("ped_codigo")
);

-- CreateTable
CREATE TABLE "permisos" (
    "per_codigo" CHAR(6) NOT NULL DEFAULT ('PER'::text || lpad((nextval('seq_permisos'::regclass))::text, 3, '0'::text)),
    "per_nombre" VARCHAR(50) NOT NULL,
    "per_descripcion" VARCHAR(150),

    CONSTRAINT "pk_permisos" PRIMARY KEY ("per_codigo")
);

-- CreateTable
CREATE TABLE "productos" (
    "pro_codigo" CHAR(6) NOT NULL DEFAULT ('PRO'::text || lpad((nextval('seq_productos'::regclass))::text, 3, '0'::text)),
    "cat_codigo" CHAR(6) NOT NULL,
    "eti_codigo" CHAR(6),
    "tiv_codigo" CHAR(6) NOT NULL,
    "pro_nombre" VARCHAR(80) NOT NULL,
    "pro_descripcion" VARCHAR(300),
    "pro_foto" VARCHAR(150) NOT NULL,
    "pro_textoalternativo" VARCHAR(200) NOT NULL,
    "pro_disponible" BOOLEAN NOT NULL DEFAULT true,
    "pro_destacado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pk_productos" PRIMARY KEY ("pro_codigo")
);

-- CreateTable
CREATE TABLE "productos_alergenos" (
    "pro_codigo" CHAR(6) NOT NULL,
    "ale_codigo" CHAR(6) NOT NULL,
    "pal_trazas" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pk_productos_alergenos" PRIMARY KEY ("pro_codigo","ale_codigo")
);

-- CreateTable
CREATE TABLE "productos_tamanos" (
    "pro_codigo" CHAR(6) NOT NULL,
    "tam_codigo" CHAR(6) NOT NULL,
    "pta_precio" DECIMAL(8,2) NOT NULL,
    "pta_orden" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "pk_productos_tamanos" PRIMARY KEY ("pro_codigo","tam_codigo")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "pvd_codigo" CHAR(10) NOT NULL DEFAULT ('PVD'::text || lpad((nextval('seq_proveedores'::regclass))::text, 7, '0'::text)),
    "tid_codigo" CHAR(2) NOT NULL,
    "can_codigo" CHAR(4) NOT NULL,
    "pvd_identificacion" VARCHAR(13) NOT NULL,
    "pvd_razonsocial" VARCHAR(150) NOT NULL,
    "pvd_telefono" VARCHAR(10),
    "pvd_celular" CHAR(10),
    "pvd_correo" VARCHAR(254) NOT NULL,
    "pvd_direccion" VARCHAR(200) NOT NULL,
    "pvd_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_proveedores" PRIMARY KEY ("pvd_codigo")
);

-- CreateTable
CREATE TABLE "proveedores_materiales" (
    "pvd_codigo" CHAR(10) NOT NULL,
    "mat_codigo" CHAR(6) NOT NULL,
    "pma_precioreferencia" DECIMAL(10,4) NOT NULL,
    "pma_diasentrega" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "pk_proveedores_materiales" PRIMARY KEY ("pvd_codigo","mat_codigo")
);

-- CreateTable
CREATE TABLE "provincias" (
    "prv_codigo" CHAR(2) NOT NULL,
    "prv_nombre" VARCHAR(40) NOT NULL,

    CONSTRAINT "pk_provincias" PRIMARY KEY ("prv_codigo")
);

-- CreateTable
CREATE TABLE "recepciones" (
    "rcp_codigo" CHAR(10) NOT NULL DEFAULT ('RCP'::text || lpad((nextval('seq_recepciones'::regclass))::text, 7, '0'::text)),
    "oco_codigo" CHAR(10) NOT NULL,
    "emp_codigo" CHAR(10),
    "rcp_fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rcp_estado" CHAR(3) NOT NULL DEFAULT 'PEN',
    "rcp_observacion" VARCHAR(250),

    CONSTRAINT "pk_recepciones" PRIMARY KEY ("rcp_codigo")
);

-- CreateTable
CREATE TABLE "recetas" (
    "pro_codigo" CHAR(6) NOT NULL,
    "tam_codigo" CHAR(6) NOT NULL,
    "mat_codigo" CHAR(6) NOT NULL,
    "rct_cantidad" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "pk_recetas" PRIMARY KEY ("pro_codigo","tam_codigo","mat_codigo")
);

-- CreateTable
CREATE TABLE "roles" (
    "rol_codigo" CHAR(6) NOT NULL DEFAULT ('ROL'::text || lpad((nextval('seq_roles'::regclass))::text, 3, '0'::text)),
    "rol_nombre" VARCHAR(30) NOT NULL,
    "rol_descripcion" VARCHAR(150),

    CONSTRAINT "pk_roles" PRIMARY KEY ("rol_codigo")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_codigo" CHAR(6) NOT NULL,
    "per_codigo" CHAR(6) NOT NULL,
    "rpe_fechaasignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_roles_permisos" PRIMARY KEY ("rol_codigo","per_codigo")
);

-- CreateTable
CREATE TABLE "tamanos" (
    "tam_codigo" CHAR(6) NOT NULL DEFAULT ('TAM'::text || lpad((nextval('seq_tamanos'::regclass))::text, 3, '0'::text)),
    "tam_descripcion" VARCHAR(20) NOT NULL,

    CONSTRAINT "pk_tamanos" PRIMARY KEY ("tam_codigo")
);

-- CreateTable
CREATE TABLE "tarifas_iva" (
    "tiv_codigo" CHAR(6) NOT NULL DEFAULT ('TIV'::text || lpad((nextval('seq_tarifas_iva'::regclass))::text, 3, '0'::text)),
    "tiv_codigosri" VARCHAR(2) NOT NULL,
    "tiv_descripcion" VARCHAR(30) NOT NULL,
    "tiv_porcentaje" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "pk_tarifas_iva" PRIMARY KEY ("tiv_codigo")
);

-- CreateTable
CREATE TABLE "tipos_entrega" (
    "ten_codigo" CHAR(6) NOT NULL DEFAULT ('TEN'::text || lpad((nextval('seq_tipos_entrega'::regclass))::text, 3, '0'::text)),
    "ten_nombre" VARCHAR(30) NOT NULL,
    "ten_costo" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "ten_pidedireccion" BOOLEAN NOT NULL,

    CONSTRAINT "pk_tipos_entrega" PRIMARY KEY ("ten_codigo")
);

-- CreateTable
CREATE TABLE "tipos_identificacion" (
    "tid_codigo" CHAR(2) NOT NULL,
    "tid_nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "pk_tipos_identificacion" PRIMARY KEY ("tid_codigo")
);

-- CreateTable
CREATE TABLE "tipos_material" (
    "tma_codigo" CHAR(6) NOT NULL DEFAULT ('TMA'::text || lpad((nextval('seq_tipos_material'::regclass))::text, 3, '0'::text)),
    "tma_nombre" VARCHAR(40) NOT NULL,

    CONSTRAINT "pk_tipos_material" PRIMARY KEY ("tma_codigo")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "umi_codigo" CHAR(6) NOT NULL DEFAULT ('UMI'::text || lpad((nextval('seq_unidades_medida'::regclass))::text, 3, '0'::text)),
    "umi_nombre" VARCHAR(30) NOT NULL,
    "umi_abreviatura" VARCHAR(10) NOT NULL,

    CONSTRAINT "pk_unidades_medida" PRIMARY KEY ("umi_codigo")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "usu_codigo" CHAR(10) NOT NULL DEFAULT ('USU'::text || lpad((nextval('seq_usuarios'::regclass))::text, 7, '0'::text)),
    "rol_codigo" CHAR(6) NOT NULL,
    "emp_codigo" CHAR(10),
    "usu_nombres" VARCHAR(60) NOT NULL,
    "usu_apellidos" VARCHAR(60) NOT NULL,
    "usu_correo" VARCHAR(254) NOT NULL,
    "usu_celular" CHAR(10) NOT NULL,
    "usu_codigoauth" UUID NOT NULL,
    "usu_activo" BOOLEAN NOT NULL DEFAULT true,
    "usu_fecharegistro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_usuarios" PRIMARY KEY ("usu_codigo")
);

-- CreateTable
CREATE TABLE "verificaciones" (
    "ver_codigo" CHAR(10) NOT NULL DEFAULT ('VER'::text || lpad((nextval('seq_verificaciones'::regclass))::text, 7, '0'::text)),
    "usu_codigo" CHAR(10) NOT NULL,
    "ver_clave" CHAR(6) NOT NULL,
    "ver_fechaenvio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ver_fechaexpira" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '00:15:00'::interval),
    "ver_fechauso" TIMESTAMPTZ(6),
    "ver_intentos" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "pk_verificaciones" PRIMARY KEY ("ver_codigo")
);

-- CreateIndex
CREATE INDEX "ix_accesos_usuario" ON "accesos"("usu_codigo", "acc_fecha");

-- CreateIndex
CREATE INDEX "ix_ajustes_inventario_autoriza" ON "ajustes_inventario"("emp_codigoautoriza");

-- CreateIndex
CREATE INDEX "ix_ajustes_inventario_empleado" ON "ajustes_inventario"("emp_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_alergenos_nombre" ON "alergenos"("ale_nombre");

-- CreateIndex
CREATE INDEX "ix_asientos_empleado" ON "asientos"("emp_codigo");

-- CreateIndex
CREATE INDEX "ix_asientos_referencia" ON "asientos"("asi_origen", "asi_referencia");

-- CreateIndex
CREATE INDEX "ix_auditorias_fila" ON "auditorias"("aud_tabla", "aud_clave");

-- CreateIndex
CREATE INDEX "ix_auditorias_usuario" ON "auditorias"("usu_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cantones_nombre" ON "cantones"("prv_codigo", "can_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cargos_nombre" ON "cargos"("car_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categorias_nombre" ON "categorias"("cat_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categorias_slug" ON "categorias"("cat_slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_clientes_identificacion" ON "clientes"("tid_codigo", "cli_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_conceptos_nomina_numero" ON "conceptos_nomina"("cno_numero");

-- CreateIndex
CREATE UNIQUE INDEX "uq_conceptos_nomina_nombre" ON "conceptos_nomina"("cno_nombre");

-- CreateIndex
CREATE INDEX "ix_consumos_produccion_lote" ON "consumos_produccion"("lma_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cuentas_contables_numero" ON "cuentas_contables"("cue_numero");

-- CreateIndex
CREATE INDEX "ix_detalles_ajuste_lote" ON "detalles_ajuste"("lma_codigo");

-- CreateIndex
CREATE INDEX "ix_detalles_asiento_cuenta" ON "detalles_asiento"("cue_codigo");

-- CreateIndex
CREATE INDEX "ix_detalles_nomina_concepto" ON "detalles_nomina"("cno_codigo");

-- CreateIndex
CREATE INDEX "ix_detalles_orden_compra_material" ON "detalles_orden_compra"("mat_codigo");

-- CreateIndex
CREATE INDEX "ix_detalles_pedido_producto" ON "detalles_pedido"("pro_codigo", "tam_codigo");

-- CreateIndex
CREATE INDEX "ix_direcciones_canton" ON "direcciones"("can_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_direcciones_alias" ON "direcciones"("usu_codigo", "dir_alias");

-- CreateIndex
CREATE UNIQUE INDEX "uq_direcciones_usuario" ON "direcciones"("dir_codigo", "usu_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_empleados_cedula" ON "empleados"("emp_cedula");

-- CreateIndex
CREATE UNIQUE INDEX "uq_empleados_correo" ON "empleados"("emp_correo");

-- CreateIndex
CREATE INDEX "ix_empleados_canton" ON "empleados"("can_codigo");

-- CreateIndex
CREATE INDEX "ix_empleados_cargo" ON "empleados"("car_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_estados_pedido_nombre" ON "estados_pedido"("epe_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_estados_pedido_orden" ON "estados_pedido"("epe_orden");

-- CreateIndex
CREATE UNIQUE INDEX "uq_etiquetas_texto" ON "etiquetas"("eti_texto");

-- CreateIndex
CREATE UNIQUE INDEX "ux_facturas_vigente" ON "facturas"("ped_codigo") WHERE (fac_fechaanulacion IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "uq_facturas_claveacceso" ON "facturas"("fac_claveacceso");

-- CreateIndex
CREATE INDEX "ix_facturas_cliente" ON "facturas"("cli_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_facturas_numero" ON "facturas"("fac_establecimiento", "fac_puntoemision", "fac_secuencial");

-- CreateIndex
CREATE INDEX "ix_lotes_material_material" ON "lotes_material"("mat_codigo", "lma_fechaingreso");

-- CreateIndex
CREATE INDEX "ix_lotes_material_orden" ON "lotes_material"("oco_codigo", "mat_codigo");

-- CreateIndex
CREATE INDEX "ix_lotes_material_recepcion" ON "lotes_material"("rcp_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_materiales_nombre" ON "materiales"("mat_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_materiales_codigobarras" ON "materiales"("mat_codigobarras");

-- CreateIndex
CREATE INDEX "ix_materiales_tipo" ON "materiales"("tma_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_metodos_costeo_sigla" ON "metodos_costeo"("mco_sigla");

-- CreateIndex
CREATE UNIQUE INDEX "uq_metodos_pago_nombre" ON "metodos_pago"("mpa_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ux_nominas_mes" ON "nominas"("emp_codigo", "nom_anio", "nom_mes") WHERE (nom_estado <> 'ANU'::bpchar);

-- CreateIndex
CREATE INDEX "ix_ordenes_compra_empleado" ON "ordenes_compra"("emp_codigo");

-- CreateIndex
CREATE INDEX "ix_ordenes_compra_proveedor" ON "ordenes_compra"("pvd_codigo", "oco_fecha" DESC);

-- CreateIndex
CREATE INDEX "ix_ordenes_produccion_empleado" ON "ordenes_produccion"("emp_codigo");

-- CreateIndex
CREATE INDEX "ix_ordenes_produccion_producto" ON "ordenes_produccion"("pro_codigo", "tam_codigo");

-- CreateIndex
CREATE INDEX "ix_pagos_metodo" ON "pagos"("mpa_codigo");

-- CreateIndex
CREATE INDEX "ix_pagos_pedido" ON "pagos"("ped_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pedidos_numero" ON "pedidos"("ped_numero");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pedidos_claveenvio" ON "pedidos"("ped_claveenvio");

-- CreateIndex
CREATE INDEX "ix_pedidos_direccion" ON "pedidos"("dir_codigo");

-- CreateIndex
CREATE INDEX "ix_pedidos_estado" ON "pedidos"("epe_codigo");

-- CreateIndex
CREATE INDEX "ix_pedidos_usuario" ON "pedidos"("usu_codigo", "ped_fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_permisos_nombre" ON "permisos"("per_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_productos_nombre" ON "productos"("pro_nombre");

-- CreateIndex
CREATE INDEX "ix_productos_categoria" ON "productos"("cat_codigo");

-- CreateIndex
CREATE INDEX "ix_productos_alergenos_alergeno" ON "productos_alergenos"("ale_codigo");

-- CreateIndex
CREATE INDEX "ix_productos_tamanos_tamano" ON "productos_tamanos"("tam_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_productos_tamanos_orden" ON "productos_tamanos"("pro_codigo", "pta_orden");

-- CreateIndex
CREATE INDEX "ix_proveedores_canton" ON "proveedores"("can_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_proveedores_identificacion" ON "proveedores"("tid_codigo", "pvd_identificacion");

-- CreateIndex
CREATE INDEX "ix_proveedores_materiales_material" ON "proveedores_materiales"("mat_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_provincias_nombre" ON "provincias"("prv_nombre");

-- CreateIndex
CREATE INDEX "ix_recepciones_orden" ON "recepciones"("oco_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_recepciones_orden" ON "recepciones"("rcp_codigo", "oco_codigo");

-- CreateIndex
CREATE INDEX "ix_recetas_material" ON "recetas"("mat_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_nombre" ON "roles"("rol_nombre");

-- CreateIndex
CREATE INDEX "ix_roles_permisos_permiso" ON "roles_permisos"("per_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tamanos_descripcion" ON "tamanos"("tam_descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tarifas_iva_codigosri" ON "tarifas_iva"("tiv_codigosri");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tipos_entrega_nombre" ON "tipos_entrega"("ten_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tipos_identificacion_nombre" ON "tipos_identificacion"("tid_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tipos_material_nombre" ON "tipos_material"("tma_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_unidades_medida_nombre" ON "unidades_medida"("umi_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_unidades_medida_abreviatura" ON "unidades_medida"("umi_abreviatura");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_correo" ON "usuarios"("usu_correo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_codigoauth" ON "usuarios"("usu_codigoauth");

-- CreateIndex
CREATE INDEX "ix_usuarios_empleado" ON "usuarios"("emp_codigo");

-- CreateIndex
CREATE INDEX "ix_usuarios_rol" ON "usuarios"("rol_codigo");

-- CreateIndex
CREATE INDEX "ix_verificaciones_usuario" ON "verificaciones"("usu_codigo");

-- AddForeignKey
ALTER TABLE "accesos" ADD CONSTRAINT "fk_accesos_usuarios" FOREIGN KEY ("usu_codigo") REFERENCES "usuarios"("usu_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "fk_ajustes_inventario_autoriza" FOREIGN KEY ("emp_codigoautoriza") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "fk_ajustes_inventario_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos" ADD CONSTRAINT "fk_asientos_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "fk_auditorias_usuarios" FOREIGN KEY ("usu_codigo") REFERENCES "usuarios"("usu_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cantones" ADD CONSTRAINT "fk_cantones_provincias" FOREIGN KEY ("prv_codigo") REFERENCES "provincias"("prv_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "fk_clientes_tipos_identificacion" FOREIGN KEY ("tid_codigo") REFERENCES "tipos_identificacion"("tid_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conceptos_nomina" ADD CONSTRAINT "fk_conceptos_nomina_cuentas_contables" FOREIGN KEY ("cue_codigo") REFERENCES "cuentas_contables"("cue_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos_produccion" ADD CONSTRAINT "fk_consumos_produccion_lotes_material" FOREIGN KEY ("lma_codigo") REFERENCES "lotes_material"("lma_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos_produccion" ADD CONSTRAINT "fk_consumos_produccion_ordenes_produccion" FOREIGN KEY ("orp_codigo") REFERENCES "ordenes_produccion"("orp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ajuste" ADD CONSTRAINT "fk_detalles_ajuste_ajustes_inventario" FOREIGN KEY ("aju_codigo") REFERENCES "ajustes_inventario"("aju_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ajuste" ADD CONSTRAINT "fk_detalles_ajuste_lotes_material" FOREIGN KEY ("lma_codigo") REFERENCES "lotes_material"("lma_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "fk_detalles_asiento_asientos" FOREIGN KEY ("asi_codigo") REFERENCES "asientos"("asi_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "fk_detalles_asiento_cuentas_contables" FOREIGN KEY ("cue_codigo") REFERENCES "cuentas_contables"("cue_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_nomina" ADD CONSTRAINT "fk_detalles_nomina_conceptos_nomina" FOREIGN KEY ("cno_codigo") REFERENCES "conceptos_nomina"("cno_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_nomina" ADD CONSTRAINT "fk_detalles_nomina_nominas" FOREIGN KEY ("nom_codigo") REFERENCES "nominas"("nom_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "fk_detalles_orden_compra_materiales" FOREIGN KEY ("mat_codigo") REFERENCES "materiales"("mat_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "fk_detalles_orden_compra_ordenes_compra" FOREIGN KEY ("oco_codigo") REFERENCES "ordenes_compra"("oco_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "fk_detalles_pedido_pedidos" FOREIGN KEY ("ped_codigo") REFERENCES "pedidos"("ped_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "fk_detalles_pedido_productos_tamanos" FOREIGN KEY ("pro_codigo", "tam_codigo") REFERENCES "productos_tamanos"("pro_codigo", "tam_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "fk_direcciones_cantones" FOREIGN KEY ("can_codigo") REFERENCES "cantones"("can_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "fk_direcciones_usuarios" FOREIGN KEY ("usu_codigo") REFERENCES "usuarios"("usu_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "fk_empleados_cantones" FOREIGN KEY ("can_codigo") REFERENCES "cantones"("can_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "fk_empleados_cargos" FOREIGN KEY ("car_codigo") REFERENCES "cargos"("car_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "fk_facturas_clientes" FOREIGN KEY ("cli_codigo") REFERENCES "clientes"("cli_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "fk_facturas_pedidos" FOREIGN KEY ("ped_codigo") REFERENCES "pedidos"("ped_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_material" ADD CONSTRAINT "fk_lotes_material_detalles_orden_compra" FOREIGN KEY ("oco_codigo", "mat_codigo") REFERENCES "detalles_orden_compra"("oco_codigo", "mat_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_material" ADD CONSTRAINT "fk_lotes_material_materiales" FOREIGN KEY ("mat_codigo") REFERENCES "materiales"("mat_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_material" ADD CONSTRAINT "fk_lotes_material_recepciones" FOREIGN KEY ("rcp_codigo", "oco_codigo") REFERENCES "recepciones"("rcp_codigo", "oco_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "fk_materiales_metodos_costeo" FOREIGN KEY ("mco_codigo") REFERENCES "metodos_costeo"("mco_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "fk_materiales_tarifas_iva" FOREIGN KEY ("tiv_codigo") REFERENCES "tarifas_iva"("tiv_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "fk_materiales_tipos_material" FOREIGN KEY ("tma_codigo") REFERENCES "tipos_material"("tma_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "fk_materiales_unidad_compra" FOREIGN KEY ("umi_codigocompra") REFERENCES "unidades_medida"("umi_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "fk_materiales_unidad_produccion" FOREIGN KEY ("umi_codigoproduccion") REFERENCES "unidades_medida"("umi_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominas" ADD CONSTRAINT "fk_nominas_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "fk_ordenes_compra_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "fk_ordenes_compra_proveedores" FOREIGN KEY ("pvd_codigo") REFERENCES "proveedores"("pvd_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "fk_ordenes_produccion_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "fk_ordenes_produccion_productos_tamanos" FOREIGN KEY ("pro_codigo", "tam_codigo") REFERENCES "productos_tamanos"("pro_codigo", "tam_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "fk_pagos_metodos_pago" FOREIGN KEY ("mpa_codigo") REFERENCES "metodos_pago"("mpa_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "fk_pagos_pedidos" FOREIGN KEY ("ped_codigo") REFERENCES "pedidos"("ped_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "fk_pedidos_direcciones" FOREIGN KEY ("dir_codigo", "usu_codigo") REFERENCES "direcciones"("dir_codigo", "usu_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "fk_pedidos_estados_pedido" FOREIGN KEY ("epe_codigo") REFERENCES "estados_pedido"("epe_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "fk_pedidos_tipos_entrega" FOREIGN KEY ("ten_codigo") REFERENCES "tipos_entrega"("ten_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "fk_pedidos_usuarios" FOREIGN KEY ("usu_codigo") REFERENCES "usuarios"("usu_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "fk_productos_categorias" FOREIGN KEY ("cat_codigo") REFERENCES "categorias"("cat_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "fk_productos_etiquetas" FOREIGN KEY ("eti_codigo") REFERENCES "etiquetas"("eti_codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "fk_productos_tarifas_iva" FOREIGN KEY ("tiv_codigo") REFERENCES "tarifas_iva"("tiv_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_alergenos" ADD CONSTRAINT "fk_productos_alergenos_alergenos" FOREIGN KEY ("ale_codigo") REFERENCES "alergenos"("ale_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_alergenos" ADD CONSTRAINT "fk_productos_alergenos_productos" FOREIGN KEY ("pro_codigo") REFERENCES "productos"("pro_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_tamanos" ADD CONSTRAINT "fk_productos_tamanos_productos" FOREIGN KEY ("pro_codigo") REFERENCES "productos"("pro_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_tamanos" ADD CONSTRAINT "fk_productos_tamanos_tamanos" FOREIGN KEY ("tam_codigo") REFERENCES "tamanos"("tam_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "fk_proveedores_cantones" FOREIGN KEY ("can_codigo") REFERENCES "cantones"("can_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "fk_proveedores_tipos_identificacion" FOREIGN KEY ("tid_codigo") REFERENCES "tipos_identificacion"("tid_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores_materiales" ADD CONSTRAINT "fk_proveedores_materiales_materiales" FOREIGN KEY ("mat_codigo") REFERENCES "materiales"("mat_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores_materiales" ADD CONSTRAINT "fk_proveedores_materiales_proveedores" FOREIGN KEY ("pvd_codigo") REFERENCES "proveedores"("pvd_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones" ADD CONSTRAINT "fk_recepciones_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones" ADD CONSTRAINT "fk_recepciones_ordenes_compra" FOREIGN KEY ("oco_codigo") REFERENCES "ordenes_compra"("oco_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "fk_recetas_materiales" FOREIGN KEY ("mat_codigo") REFERENCES "materiales"("mat_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "fk_recetas_productos_tamanos" FOREIGN KEY ("pro_codigo", "tam_codigo") REFERENCES "productos_tamanos"("pro_codigo", "tam_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "fk_roles_permisos_permisos" FOREIGN KEY ("per_codigo") REFERENCES "permisos"("per_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "fk_roles_permisos_roles" FOREIGN KEY ("rol_codigo") REFERENCES "roles"("rol_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuarios_empleados" FOREIGN KEY ("emp_codigo") REFERENCES "empleados"("emp_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuarios_roles" FOREIGN KEY ("rol_codigo") REFERENCES "roles"("rol_codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificaciones" ADD CONSTRAINT "fk_verificaciones_usuarios" FOREIGN KEY ("usu_codigo") REFERENCES "usuarios"("usu_codigo") ON DELETE CASCADE ON UPDATE CASCADE;

