import { createClient } from "npm:@supabase/supabase-js@2";

// 1. Conexion a la base. Supabase pone estas dos variables solo,
//    en su servidor: la clave secreta nunca esta en tu pagina.
const base = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// 2. Quien puede llamar a la API (CORS): la pagina publicada y la de tu
//    computador en cualquier puerto (npm run dev, npm run preview, las pruebas).
const PUBLICADA = "https://arielnoob24.github.io";
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function cabeceras(req: Request) {
  const origen = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": origen === PUBLICADA || LOCAL.test(origen) ? origen : PUBLICADA,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Content-Type": "application/json",
  };
}

// Una respuesta en JSON con su codigo (200 bien, 400 datos mal, 401 sin
// sesion, 404 no existe, 500 fallo de la base).
const responder = (h: HeadersInit, estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: h });

// Una fila de la base pasa a un producto como los de data/productos.json.
// Un producto de un solo tamano ("Único") no lleva lista de tamanos: su
// precio es ese. Con varios, el precio que se ve es el del primero.
// deno-lint-ignore no-explicit-any
function aProducto(f: any) {
  const tamanos = [...f.productos_tamanos]
    .sort((a, b) => a.pta_orden - b.pta_orden)
    .map((t) => ({ valor: t.tamanos.tam_descripcion, precio: Number(t.pta_precio) }));
  const unico = tamanos.length === 1 && tamanos[0].valor === "Único";
  return {
    nombre: f.pro_nombre,
    categoria: f.categorias.cat_slug,
    precio: tamanos[0].precio,
    destacado: f.pro_destacado,
    foto: f.pro_foto,
    alt: f.pro_textoalternativo,
    disponible: f.pro_disponible,
    ...(f.etiquetas ? { etiqueta: { color: f.etiquetas.eti_color, texto: f.etiquetas.eti_texto } } : {}),
    ...(unico ? {} : { tamanos }),
  };
}

// ---- La cuenta ---------------------------------------------------------
// Quien llama: la pagina manda el token de su sesion de Supabase Auth en
// "Authorization: Bearer ...". Se le pregunta a Auth de quien es; si no vale
// (caduco, inventado), no hay usuario. Solo cuentas con el correo verificado.
async function quienLlama(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await base.auth.getUser(token);
  if (error || !data.user?.email_confirmed_at) return null;
  return data.user;
}

// Las mismas reglas que la pagina (servicios/cuenta.js): la API no se fia de
// lo que le llega. El telefono llega con los 9 digitos tras el +593.
// deno-lint-ignore no-explicit-any
function fallosCuenta(d: any) {
  const nombre = String(d?.nombre ?? "").trim().replace(/\s+/g, " ");
  const telefono = String(d?.telefono ?? "");
  const direccion = String(d?.direccion ?? "").trim();
  const metodo = d?.metodo === "tarjeta" ? "tarjeta" : "efectivo";
  if (nombre.length < 3 || nombre.length > 120 || !nombre.includes(" ")) return { error: "El nombre lleva nombre y apellido." };
  if (!/^9\d{8}$/.test(telefono)) return { error: "El teléfono son 9 números después del +593, empezando por 9." };
  if (direccion.length > 80) return { error: "La dirección es demasiado larga." };
  return { nombre, telefono, direccion, metodo };
}

// "Ana María Pérez López" -> nombres "Ana María", apellidos "Pérez López":
// la primera mitad de las palabras (redondeando hacia arriba) son nombres.
function partirNombre(nombre: string) {
  const p = nombre.split(" ");
  const n = Math.ceil(p.length / 2);
  return { nombres: p.slice(0, n).join(" "), apellidos: p.slice(n).join(" ") };
}

// Lo que la pagina ve de la cuenta. Nombre y telefono son de USUARIOS; la
// direccion de entrega y la forma de pago preferidas, de la cuenta de Auth
// (no son parte del modelo: DIRECCIONES pide canton y calles por separado).
// deno-lint-ignore no-explicit-any
const aCuenta = (fila: any, usuario: any) => ({
  nombre: `${fila.usu_nombres} ${fila.usu_apellidos}`,
  correo: fila.usu_correo,
  telefono: String(fila.usu_celular).slice(1),
  direccion: usuario.user_metadata?.direccion ?? "",
  metodo: usuario.user_metadata?.metodo === "tarjeta" ? "tarjeta" : "efectivo",
});

const COLUMNAS = "usu_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular";

// 3. La API: cada peticion entra por aqui.
Deno.serve(async (req) => {
  const h = cabeceras(req);

  // El navegador pregunta antes si puede llamar: se le dice que si.
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  // Que ruta pidieron: lo que va despues de /api
  const ruta = new URL(req.url).pathname.replace(/^.*\/api/, "");

  // RUTA: GET /productos -> el catalogo
  if (req.method === "GET" && ruta === "/productos") {
    const { data, error } = await base
      .from("productos")
      .select(`
        pro_codigo, pro_nombre, pro_foto, pro_textoalternativo,
        pro_disponible, pro_destacado,
        categorias ( cat_slug ),
        etiquetas ( eti_texto, eti_color ),
        productos_tamanos ( pta_precio, pta_orden, tamanos ( tam_descripcion ) )
      `)
      // El codigo sigue el orden en que se cargaron: es el de "Recomendados".
      .order("pro_codigo");

    if (error) return responder(h, 500, { error: error.message });

    // Se responde con la misma forma que data/productos.json, para que la
    // pagina no tenga que saber como se llaman las columnas de la base.
    const productos = data.map(aProducto);
    return new Response(JSON.stringify({ productos }), {
      status: 200,
      // El navegador puede reusar la respuesta un minuto sin volver a pedirla.
      headers: { ...h, "Cache-Control": "public, max-age=60" },
    });
  }

  // RUTAS de /cuenta: todas piden sesion.
  if (ruta === "/cuenta") {
    const usuario = await quienLlama(req);
    if (!usuario) return responder(h, 401, { error: "Inicia sesión otra vez." });
    const { data: fila, error } = await base.from("usuarios")
      .select(COLUMNAS).eq("usu_codigoauth", usuario.id).maybeSingle();
    if (error) return responder(h, 500, { error: error.message });

    // GET /cuenta -> los datos de quien llama (404 si aun no tiene fila).
    if (req.method === "GET") {
      if (!fila) return responder(h, 404, { error: "Esta cuenta todavía no tiene datos." });
      return responder(h, 200, aCuenta(fila, usuario));
    }

    const datos = fallosCuenta(await req.json().catch(() => null));
    if ("error" in datos) return responder(h, 400, datos);
    const { nombres, apellidos } = partirNombre(datos.nombre);
    const celular = `0${datos.telefono}`;

    // Direccion y forma de pago, en la cuenta de Auth.
    const { data: auth, error: fallaAuth } = await base.auth.admin.updateUserById(usuario.id, {
      user_metadata: { ...usuario.user_metadata, direccion: datos.direccion, metodo: datos.metodo },
    });
    if (fallaAuth) return responder(h, 500, { error: fallaAuth.message });

    // POST /cuenta -> la fila en USUARIOS, al verificar el correo. Si ya
    // existe (se verifico en otra pestana), se devuelve la que hay.
    // PUT /cuenta -> cambiar nombre, telefono, direccion y forma de pago.
    // El correo no se cambia aqui. Las dos escriben con FN_USUARIOS_GUARDAR,
    // que deja en AUDITORIAS que el cambio lo hizo la propia cuenta.
    if (req.method === "POST" && fila) return responder(h, 200, aCuenta(fila, auth.user));
    if (req.method === "PUT" && !fila) return responder(h, 404, { error: "Esta cuenta todavía no tiene datos." });
    if (req.method === "POST" || req.method === "PUT") {
      const { data: guardada, error: fallaGuardar } = await base.rpc("fn_usuarios_guardar", {
        p_auth: usuario.id, p_correo: usuario.email!, p_nombres: nombres, p_apellidos: apellidos, p_celular: celular,
      });
      if (fallaGuardar) return responder(h, 500, { error: fallaGuardar.message });
      return responder(h, req.method === "POST" ? 201 : 200, aCuenta(guardada, auth.user));
    }
  }

  // RUTAS de /pedidos: tambien piden sesion. Todo lo hace la base en una
  // sola transaccion (FN_PEDIDOS_REGISTRAR y FN_PEDIDOS_DE, en
  // bd/BD_EL_TRADICIONAL.sql): precios, IVA, total, pago y factura. La API
  // solo dice quien llama; lo que mande la pagina sobre precios no cuenta.
  if (ruta === "/pedidos") {
    const usuario = await quienLlama(req);
    if (!usuario) return responder(h, 401, { error: "Inicia sesión otra vez." });

    // GET /pedidos -> los pedidos de quien llama, el mas nuevo primero.
    if (req.method === "GET") {
      const { data, error } = await base.rpc("fn_pedidos_de", { p_auth: usuario.id });
      if (error) return responder(h, 500, { error: error.message });
      return responder(h, 200, { pedidos: data });
    }

    // POST /pedidos -> registrar uno. 22023 es un error para el cliente
    // ("Ya no tenemos Palanqueta"); cualquier otro, un fallo de la base.
    if (req.method === "POST") {
      const pedido = await req.json().catch(() => null);
      if (!pedido || typeof pedido !== "object") return responder(h, 400, { error: "El pedido no llegó bien." });
      const { data, error } = await base.rpc("fn_pedidos_registrar", { p_auth: usuario.id, p_pedido: pedido });
      if (error) return responder(h, error.code === "22023" ? 400 : 500, { error: error.message });
      return responder(h, 201, data);
    }
  }

  // RUTAS de /admin: el panel de quien atiende el local. Piden sesion, y la
  // base mira ademas que el rol de la cuenta tenga el permiso de cada cosa
  // (FN_ADMIN_*, en bd/BD_EL_TRADICIONAL.sql): 42501 es "no tienes permiso"
  // (403) y 22023 un dato mal (400). Esconder el panel en la pagina no
  // protege nada; esto si.
  if (ruta.startsWith("/admin/")) {
    const usuario = await quienLlama(req);
    if (!usuario) return responder(h, 401, { error: "Inicia sesión otra vez." });

    const llamar = async (funcion: string, args: Record<string, unknown>, exito = 200) => {
      const { data, error } = await base.rpc(funcion, { p_auth: usuario.id, ...args });
      if (error) {
        const estado = error.code === "42501" ? 403 : error.code === "22023" ? 400 : 500;
        return responder(h, estado, { error: estado === 500 ? "Algo falló en el servidor." : error.message });
      }
      return responder(h, exito, data);
    };

    // GET /admin/yo -> el rol y los permisos de quien llama (403 si no tiene
    // fila activa en USUARIOS): lo que la pagina usa para enseñar el panel. Un
    // cliente tambien recibe 200, con los permisos de un cliente.
    if (req.method === "GET" && ruta === "/admin/yo") {
      const { data, error } = await base.rpc("fn_admin_yo", { p_auth: usuario.id });
      if (error) return responder(h, 500, { error: "Algo falló en el servidor." });
      if (!data) return responder(h, 403, { error: "No tienes permiso para esto." });
      return responder(h, 200, data);
    }
    if (req.method === "GET" && ruta === "/admin/pedidos") {
      const r = await llamar("fn_admin_pedidos", {});
      return r.ok ? responder(h, 200, { pedidos: await r.json() }) : r;
    }
    if (req.method === "GET" && ruta === "/admin/productos") {
      const r = await llamar("fn_admin_productos", {});
      return r.ok ? responder(h, 200, { productos: await r.json() }) : r;
    }
    if (req.method === "GET" && ruta === "/admin/resumen") return llamar("fn_admin_resumen", {});

    // GET /admin/inventario -> existencias, lotes por caducar y producto
    // producido contra vendido; los costos solo para quien tiene reportes.ver.
    if (req.method === "GET" && ruta === "/admin/inventario") return llamar("fn_admin_inventario", {});
    // GET /admin/inventario/MAT001 -> los movimientos (kardex) de ese material.
    const kardex = ruta.match(/^\/admin\/inventario\/(MAT\d{3})$/);
    if (req.method === "GET" && kardex) {
      const r = await llamar("fn_admin_kardex", { p_material: kardex[1] });
      return r.ok ? responder(h, 200, { movimientos: await r.json() }) : r;
    }

    // COMPRAS (compras.aprobar, solo el Administrador). Sin DELETE: quitar lo
    // que vende un proveedor es un POST a /quitar.
    // GET /admin/proveedores -> { proveedores, cantones, materiales }
    if (req.method === "GET" && ruta === "/admin/proveedores") return llamar("fn_admin_proveedores", {});
    // POST /admin/proveedores { tipo, identificacion, razonSocial, correo, telefono?, celular?, direccion, canton }
    if (req.method === "POST" && ruta === "/admin/proveedores") {
      const c = await req.json().catch(() => null);
      if (!c || typeof c !== "object" || Array.isArray(c)) return responder(h, 400, { error: "Faltan los datos del proveedor." });
      return llamar("fn_admin_proveedor_crear", { p_datos: c }, 201);
    }
    // PUT /admin/proveedores/PVD0000001 { activo } -> activa o desactiva.
    const proveedor = ruta.match(/^\/admin\/proveedores\/(PVD\d{7})$/);
    if (req.method === "PUT" && proveedor) {
      const c = await req.json().catch(() => null);
      if (typeof c?.activo !== "boolean") return responder(h, 400, { error: "Falta si el proveedor está activo." });
      return llamar("fn_admin_proveedor_activo", { p_proveedor: proveedor[1], p_activo: c.activo });
    }
    // PUT /admin/proveedores/PVD0000001/materiales/MAT001 { precio, dias } -> lo que vende.
    const vende = ruta.match(/^\/admin\/proveedores\/(PVD\d{7})\/materiales\/(MAT\d{3})(\/quitar)?$/);
    if (req.method === "PUT" && vende && !vende[3]) {
      const c = await req.json().catch(() => null);
      if (typeof c?.precio !== "number" || !Number.isInteger(c?.dias)) return responder(h, 400, { error: "Faltan el precio y los días de entrega." });
      return llamar("fn_admin_proveedor_material", { p_proveedor: vende[1], p_material: vende[2], p_precio: c.precio, p_dias: c.dias });
    }
    if (req.method === "POST" && vende && vende[3]) {
      return llamar("fn_admin_proveedor_quitar_material", { p_proveedor: vende[1], p_material: vende[2] });
    }

    // GET /admin/ordenes -> { ordenes } las ultimas 100, con sus lineas.
    if (req.method === "GET" && ruta === "/admin/ordenes") {
      const r = await llamar("fn_admin_ordenes", {});
      return r.ok ? responder(h, 200, { ordenes: await r.json() }) : r;
    }
    // POST /admin/ordenes { proveedor, entrega, observacion?, lineas: [{ material, cantidad }] }
    if (req.method === "POST" && ruta === "/admin/ordenes") {
      const c = await req.json().catch(() => null);
      if (!c || typeof c !== "object" || Array.isArray(c)) return responder(h, 400, { error: "Faltan los datos de la orden." });
      return llamar("fn_admin_orden_crear", { p_datos: c }, 201);
    }
    // PUT /admin/ordenes/OCO0000001 { estado: "Aprobada" | "Anulada" }
    const ordenCompra = ruta.match(/^\/admin\/ordenes\/(OCO\d{7})$/);
    if (req.method === "PUT" && ordenCompra) {
      const c = await req.json().catch(() => null);
      if (typeof c?.estado !== "string") return responder(h, 400, { error: "Falta el estado." });
      return llamar("fn_admin_orden_estado", { p_orden: ordenCompra[1], p_estado: c.estado });
    }

    // BODEGA (bodega.recibir: Administrador y Empleado).
    // GET /admin/recepciones -> { pendientes, recibidas }
    if (req.method === "GET" && ruta === "/admin/recepciones") return llamar("fn_admin_recepciones", {});
    // POST /admin/recepciones/RCP0000001 { lineas: [{ material, cantidad, caducidad? }], observacion? }
    const recepcion = ruta.match(/^\/admin\/recepciones\/(RCP\d{7})$/);
    if (req.method === "POST" && recepcion) {
      const c = await req.json().catch(() => null);
      if (!Array.isArray(c?.lineas)) return responder(h, 400, { error: "Faltan las cantidades recibidas." });
      return llamar("fn_admin_recepcion_confirmar", {
        p_recepcion: recepcion[1], p_lineas: c.lineas, p_observacion: typeof c.observacion === "string" ? c.observacion : null,
      });
    }

    // PRODUCCION (produccion.registrar: Administrador y Empleado).
    // GET /admin/produccion -> { costos, ordenes, productos }
    if (req.method === "GET" && ruta === "/admin/produccion") return llamar("fn_admin_produccion", {});
    // POST /admin/produccion { producto, tamano, cantidad } -> registra la tanda ya hecha.
    if (req.method === "POST" && ruta === "/admin/produccion") {
      const c = await req.json().catch(() => null);
      if (typeof c?.producto !== "string" || typeof c?.tamano !== "string" || !Number.isInteger(c?.cantidad)) {
        return responder(h, 400, { error: "Faltan el producto, el tamaño y la cantidad." });
      }
      return llamar("fn_admin_produccion_registrar", { p_producto: c.producto, p_tamano: c.tamano, p_cantidad: c.cantidad }, 201);
    }

    // AJUSTES de inventario (inventario.reportar para reportar; aprobar es de inventario.ajustar).
    // GET /admin/ajustes -> { costos, ajustes, lotes }
    if (req.method === "GET" && ruta === "/admin/ajustes") return llamar("fn_admin_ajustes", {});
    // POST /admin/ajustes { motivo, lineas: [{ lote, cantidad }] } (negativa si falta, positiva si sobra)
    if (req.method === "POST" && ruta === "/admin/ajustes") {
      const c = await req.json().catch(() => null);
      if (!c || typeof c !== "object" || Array.isArray(c)) return responder(h, 400, { error: "Faltan los datos del ajuste." });
      return llamar("fn_admin_ajuste_crear", { p_datos: c }, 201);
    }
    // PUT /admin/ajustes/AJU0000001 { estado: "Aprobado" | "Anulado" }
    const ajuste = ruta.match(/^\/admin\/ajustes\/(AJU\d{7})$/);
    if (req.method === "PUT" && ajuste) {
      const c = await req.json().catch(() => null);
      if (typeof c?.estado !== "string") return responder(h, 400, { error: "Falta el estado." });
      return llamar("fn_admin_ajuste_estado", { p_ajuste: ajuste[1], p_estado: c.estado });
    }

    // EQUIPO (usuarios.gestionar, solo el Administrador).
    // GET /admin/equipo -> { empleados, cargos, cantones }
    if (req.method === "GET" && ruta === "/admin/equipo") return llamar("fn_admin_equipo", {});
    // POST /admin/equipo { cedula, primerNombre, ..., sueldo } -> da de alta a un empleado.
    if (req.method === "POST" && ruta === "/admin/equipo") {
      const c = await req.json().catch(() => null);
      if (!c || typeof c !== "object" || Array.isArray(c)) return responder(h, 400, { error: "Faltan los datos del empleado." });
      return llamar("fn_admin_empleado_crear", { p_datos: c }, 201);
    }
    const equipo = ruta.match(/^\/admin\/equipo\/(EMP\d{7})(\/cuenta(\/quitar)?)?$/);
    if (equipo) {
      const c = await req.json().catch(() => null);
      if (!c || typeof c !== "object" || Array.isArray(c)) return responder(h, 400, { error: "Faltan los datos." });
      // PUT /admin/equipo/EMP0000001 { cargo?, sueldo?, activo? }
      if (req.method === "PUT" && !equipo[2]) return llamar("fn_admin_empleado_editar", { p_empleado: equipo[1], p_datos: c });
      // PUT /admin/equipo/EMP0000001/cuenta { correo, rol } -> da acceso al panel.
      if (req.method === "PUT" && equipo[2] === "/cuenta") {
        if (typeof c.correo !== "string" || typeof c.rol !== "string") return responder(h, 400, { error: "Faltan el correo y el rol." });
        return llamar("fn_admin_empleado_cuenta", { p_empleado: equipo[1], p_correo: c.correo, p_rol: c.rol });
      }
      // POST /admin/equipo/EMP0000001/cuenta/quitar { correo } -> le quita el acceso.
      if (req.method === "POST" && equipo[3]) {
        if (typeof c.correo !== "string") return responder(h, 400, { error: "Falta el correo." });
        return llamar("fn_admin_empleado_quitar_cuenta", { p_empleado: equipo[1], p_correo: c.correo });
      }
    }

    // FACTURAS y CLIENTES (facturas.anular, solo el Administrador).
    // GET /admin/facturas -> { facturas, clientes }
    if (req.method === "GET" && ruta === "/admin/facturas") return llamar("fn_admin_facturas", {});
    // POST /admin/facturas/FAC0000001/anular -> anula la factura (crea el asiento contrario).
    const factura = ruta.match(/^\/admin\/facturas\/(FAC\d{7})\/anular$/);
    if (req.method === "POST" && factura) return llamar("fn_admin_factura_anular", { p_factura: factura[1] });

    // PUT /admin/pedidos/ET-XXXX { estado } -> pasa el pedido a ese estado.
    const pedido = ruta.match(/^\/admin\/pedidos\/(ET-[A-Z0-9]{4})$/);
    if (req.method === "PUT" && pedido) {
      const cuerpo = await req.json().catch(() => null);
      if (typeof cuerpo?.estado !== "string") return responder(h, 400, { error: "Falta el estado." });
      return llamar("fn_admin_pedido_estado", { p_numero: pedido[1], p_estado: cuerpo.estado });
    }

    // PUT /admin/productos/PRO001 { disponible, destacado, precios } -> guarda
    // lo que cambio (precios: { TAM001: 1.25 }, solo los que cambiaron).
    const producto = ruta.match(/^\/admin\/productos\/(PRO\d{3})$/);
    if (req.method === "PUT" && producto) {
      const c = await req.json().catch(() => null);
      if (typeof c?.disponible !== "boolean" || typeof c?.destacado !== "boolean") {
        return responder(h, 400, { error: "Faltan los datos del producto." });
      }
      const precios = c.precios && typeof c.precios === "object" && !Array.isArray(c.precios) ? c.precios : {};
      return llamar("fn_admin_producto_guardar", {
        p_codigo: producto[1], p_disponible: c.disponible, p_destacado: c.destacado, p_precios: precios,
      });
    }
  }

  // Cualquier otra ruta: no existe
  return responder(h, 404, { error: "Ruta no encontrada" });
});
