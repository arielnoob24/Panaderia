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

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: h });
    }

    // Se responde con la misma forma que data/productos.json, para que la
    // pagina no tenga que saber como se llaman las columnas de la base.
    const productos = data.map(aProducto);
    return new Response(JSON.stringify({ productos }), {
      status: 200,
      // El navegador puede reusar la respuesta un minuto sin volver a pedirla.
      headers: { ...h, "Cache-Control": "public, max-age=60" },
    });
  }

  // Cualquier otra ruta: no existe
  return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers: h });
});