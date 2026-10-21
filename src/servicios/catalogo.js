// ---- El catalogo -------------------------------------------------------
// Los datos son los de siempre, data/productos.json de la raiz, y las reglas
// (revisar() y normalizar()) estan en reglasCatalogo.js, sin nada de Vite,
// para que el CI las use con node.
import datos from '/data/productos.json';
import { revisar, normalizar } from './reglasCatalogo.js';

// El JSON va dentro del paquete que arma Vite en vez de pedirse con fetch:
// no hay una segunda peticion que pueda fallar y no hace falta esperar.
// Las fotos, en cambio, no pueden ir dentro: el JSON solo trae la raiz del
// nombre ("assets/img/productos/pan-redondo") y Vite no sabe que de ahi salen
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

// Se lee una sola vez, al cargar el modulo. Nunca lanza: si el catalogo viene
// mal, la portada lo dice y el resto del sitio sigue en pie, que es lo que
// hacia app.js en el sitio presentado.
const leerCatalogo = () => {
  try {
    const crudos = Array.isArray(datos) ? datos : datos.productos;
    if (!Array.isArray(crudos) || !crudos.length) throw new Error('data/productos.json no trae ningun producto');
    crudos.forEach(revisar);
    const productos = crudos.map(normalizar);
    // Una foto que no esta en la carpeta romperia la ficha sin que nadie se
    // quejara: mejor saberlo aqui, con el nombre del producto.
    productos.forEach((p) => ANCHOS.forEach((w) => {
      if (!fotoDe(p, w)) throw new Error(`falta ${p.foto}-${w}.jpg, la foto de "${p.nombre}"`);
    }));
    return { productos, error: null };
  } catch (error) {
    return { productos: [], error };
  }
};

const catalogo = leerCatalogo();

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

export { catalogo, fotoDe, fotoDeLinea, ANCHOS };
