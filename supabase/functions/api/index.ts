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

  // Cualquier otra ruta: no existe
  return responder(h, 404, { error: "Ruta no encontrada" });
});
