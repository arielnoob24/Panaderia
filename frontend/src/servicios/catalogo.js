// ---- El catalogo -------------------------------------------------------
// Los productos salen de la base de datos, pedidos a la API (servicios/api.js),
// con la misma forma que data/productos.json. Ese JSON sigue dentro del
// paquete como respaldo: si la API no contesta (sin red, o el proyecto de
// Supabase en pausa), la tienda se ve igual con lo que trae. Las reglas
// (revisar() y normalizar()) estan en reglasCatalogo.js, sin nada de Vite,
// para que el CI las use con node.
import respaldo from '/data/productos.json';
import { revisar, normalizar } from './reglasCatalogo.js';
import { pedirApi } from './api.js';

// Las fotos siguen en el sitio, no en la base: cada producto solo trae la raiz
// del nombre ("assets/img/productos/pan-redondo") y Vite no sabe que de ahi salen
// archivos. El glob se lo dice: cada .jpg de la carpeta pasa al build con su
// huella en el nombre, y aqui queda la direccion final de cada uno.
const archivos = import.meta.glob('/assets/img/productos/*.jpg', {
  eager: true, query: '?url', import: 'default',
});
const FOTOS = {};
Object.entries(archivos).forEach(([ruta, url]) => {
  // La clave es la ruta tal como la escribe el JSON: 'assets/img/productos/...'.
  FOTOS[ruta.slice(ruta.indexOf('assets/img/productos/'))] = url;
});

// La misma foto en dos anchos, como en view.js del sitio presentado.
const ANCHOS = [420, 840];
const fotoDe = (p, ancho) => FOTOS[`${p.foto}-${ancho}.jpg`];

// Revisa y normaliza lo que llega, venga de la API o del respaldo. Lanza si
// algo viene mal, con el nombre del producto.
const leer = (datos, origen) => {
  const crudos = Array.isArray(datos) ? datos : datos?.productos;
  if (!Array.isArray(crudos) || !crudos.length) throw new Error(`${origen} no trae ningun producto`);
  crudos.forEach(revisar);
  const productos = crudos.map(normalizar);
  // Una foto que no esta en la carpeta romperia la ficha sin que nadie se
  // quejara: mejor saberlo aqui, con el nombre del producto.
  productos.forEach((p) => ANCHOS.forEach((w) => {
    if (!fotoDe(p, w)) throw new Error(`falta ${p.foto}-${w}.jpg, la foto de "${p.nombre}"`);
  }));
  return productos;
};

// El catalogo que usa el resto del sitio. Se llena una vez, antes de pintar
// (main.jsx espera a cargarCatalogo). La lista es siempre la misma: se llena
// en su sitio, porque Catalogo.jsx la toma al importarse. "origen" dice de
// donde salio: 'api' o 'respaldo'.
const catalogo = { productos: [], error: null, origen: null };

// Se pide en cuanto se importa el modulo, sin esperar a React: asi la
// peticion va a la par con la descarga del resto de la pagina.
const peticion = pedirApi('/productos');

// Nunca lanza: si la API falla se usa el respaldo, y si tambien el respaldo
// viene mal, la tienda lo dice y el resto del sitio sigue en pie.
const cargarCatalogo = async () => {
  try {
    catalogo.productos.push(...leer(await peticion, 'La API'));
    catalogo.origen = 'api';
  } catch (fallo) {
    console.warn(`Catalogo: la API no respondio (${fallo.message}); se usa data/productos.json.`);
    try {
      catalogo.productos.push(...leer(respaldo, 'data/productos.json'));
      catalogo.origen = 'respaldo';
    } catch (error) {
      catalogo.error = error;
    }
  }
};

// La foto chica del producto de una linea de la canasta, para reconocerlo de
// un vistazo. Una linea con tamano ("Torta de chocolate 1 libra") usa la de su
// producto; se prueba primero el nombre exacto y luego el mas largo que encaje,
// para que un producto cuyo nombre empiece como otro no se lleve su foto.
const fotoDeLinea = (nombre) => {
  let elegido = null;
  for (const p of catalogo.productos) {
    if (p.nombre === nombre) return fotoDe(p, 420);
    if (nombre.startsWith(`${p.nombre} `) && (!elegido || p.nombre.length > elegido.nombre.length)) elegido = p;
  }
  return elegido ? fotoDe(elegido, 420) : '';
};

export { catalogo, cargarCatalogo, fotoDe, fotoDeLinea, ANCHOS };
