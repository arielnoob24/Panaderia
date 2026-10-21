// ---- Las reglas del catalogo -------------------------------------------
// revisar() y normalizar() de repo.js del sitio presentado (sitio-presentado),
// movidas tal cual (fase 7): un producto que pasaba alli pasa aqui. Viven
// aparte de catalogo.js porque no usan nada de Vite (ni import.meta.glob ni
// el JSON importado): asi el CI las corre con node sobre data/productos.json
// y comprueba el catalogo con las mismas reglas que el sitio.

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

export { revisar, normalizar };
