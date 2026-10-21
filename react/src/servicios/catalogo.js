// ---- El catalogo, para la version en React -----------------------------
// Los datos son los de siempre, data/productos.json de la raiz, y las reglas
// son revisar() y normalizar() de js/catalogo/repo.js del sitio presentado,
// movidas tal cual (fase 7): un producto que pasaba alli pasa aqui.
import datos from '@raiz/data/productos.json';

// Lo que se espera de cada producto. Se comprueba al cargar y no al pintar: si
// una ficha viene mal escrita conviene saberlo de golpe y con su nombre, no
// descubrirlo mas tarde con un precio en blanco en medio de la vitrina.
const revisar = (p, i) => {
  const donde = p && p.nombre ? `"${p.nombre}"` : `el producto numero ${i + 1}`;
  if (!p || typeof p !== 'object') throw new Error(`${donde} no es un producto`);
  if (typeof p.nombre !== 'string' || !p.nombre.trim()) throw new Error(`a ${donde} le falta el nombre`);
  if (typeof p.categoria !== 'string' || !p.categoria.trim()) throw new Error(`a ${donde} le falta la categoria`);
  if (!Number.isFinite(p.precio) || p.precio < 0) throw new Error(`${donde} no tiene un precio valido`);
  // La foto es la raiz del nombre del archivo, sin ancho ni extension: de
  // "assets/img/productos/pan-redondo" salen "...-420.jpg" y "...-840.jpg",
  // que es lo que el navegador elige segun lo que le quepa. Se guarda asi y no
  // con la ruta entera para no repetir dos veces lo mismo en cada producto.
  if (typeof p.foto !== 'string' || !p.foto) throw new Error(`a ${donde} le falta la foto`);
  if (/\.(jpg|jpeg|png|webp|avif)$/i.test(p.foto)) {
    throw new Error(`la foto de ${donde} lleva extension: va la raiz, sin ancho ni .jpg`);
  }
  // El alt no es un adorno: sin el, quien usa lector de pantalla no sabe que
  // hay en la foto. Vacio solo valdria si la imagen fuera decorativa, y estas
  // no lo son.
  if (typeof p.alt !== 'string' || !p.alt.trim()) throw new Error(`a ${donde} le falta el texto alternativo`);
  if (p.tamanos && (!Array.isArray(p.tamanos) || !p.tamanos.length)) {
    throw new Error(`los tamanos de ${donde} no son una lista`);
  }
  (p.tamanos || []).forEach((t) => {
    if (!t || typeof t.valor !== 'string' || !Number.isFinite(t.precio)) {
      throw new Error(`un tamano de ${donde} esta incompleto`);
    }
  });
  if (p.destacado !== undefined && typeof p.destacado !== 'boolean') {
    throw new Error(`"destacado" de ${donde} tiene que ser true o false`);
  }
  // El precio que se ve en la ficha es el del primer tamano; si no coincidieran,
  // la ficha diria un precio y la canasta cobraria otro.
  if (p.tamanos && p.tamanos[0].precio !== p.precio) {
    throw new Error(`en ${donde} el precio no es el del primer tamano`);
  }
};

// Lo que falta se rellena con su valor de siempre, para que el resto del sitio
// no tenga que preguntar si tal cosa venia o no: un producto sin "disponible"
// esta disponible, y uno sin tamanos viene en uno solo.
const normalizar = (p) => ({
  nombre: p.nombre.trim(),
  categoria: p.categoria.trim(),
  precio: p.precio,
  foto: p.foto,
  alt: p.alt.trim(),
  disponible: p.disponible !== false,
  // Si sale en "Los mas pedidos" de la portada. Lo marca la panaderia, que es
  // quien sabe que se vende mas: el sitio no tiene datos de ventas.
  destacado: p.destacado === true,
  etiqueta: p.etiqueta && p.etiqueta.texto ? p.etiqueta : null,
  tamanos: p.tamanos || [],
});

// El JSON va dentro del paquete que arma Vite en vez de pedirse con fetch:
// no hay una segunda peticion que pueda fallar y no hace falta esperar.
// Las fotos, en cambio, no pueden ir dentro: el JSON solo trae la raiz del
// nombre ("assets/img/productos/pan-redondo") y Vite no sabe que de ahi salen
// archivos. El glob se lo dice: cada .jpg de la carpeta pasa al build con su
// huella en el nombre, y aqui queda la direccion final de cada uno.
const archivos = import.meta.glob('@raiz/assets/img/productos/*.jpg', {
  eager: true, query: '?url', import: 'default',
});
const FOTOS = {};
Object.entries(archivos).forEach(([ruta, url]) => {
  // La clave es la ruta tal como la escribe el JSON: 'assets/img/productos/...'.
  FOTOS[ruta.slice(ruta.indexOf('assets/img/productos/'))] = url;
});

// La misma foto en dos anchos, como en js/catalogo/view.js.
const ANCHOS = [420, 840];
const fotoDe = (p, ancho) => FOTOS[`${p.foto}-${ancho}.jpg`];

// Se lee una sola vez, al cargar el modulo. Nunca lanza: si el catalogo viene
// mal, la portada lo dice y el resto del sitio sigue en pie, que es lo que
// hace app.js en el sitio actual.
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

export { catalogo, fotoDe, fotoDeLinea, ANCHOS, revisar, normalizar };
