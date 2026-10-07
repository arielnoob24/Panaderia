// ---- La vitrina -------------------------------------------------------
// Pinta las fichas con lo que trae repo.js y manda el catalogo: el mostrador
// en fila de la portada, la vista de cada categoria, el orden y el filtro.
// Las fichas salen de aqui como HTML; el control de cantidad que llevan
// dentro lo pone cart.js despues, porque eso ya es canasta.
import { reducedMotion, avisos, grupo, abrirGrupo } from './ui.js';
import { dinero, idDe, puente } from './state.js';
import { recordarVista, vistaRecordada } from './storage.js';

const catalogStatus = document.querySelector('.catalog-status');
const productGrid = document.querySelector('.product-grid');

// Los nombres y los textos alternativos vienen de un archivo de datos y entran
// en la pagina como HTML, asi que se escapan: un '<' en un nombre no puede
// acabar siendo una etiqueta.
const escapar = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Como se llama cada categoria lo dice el menu Tienda, y de ahi lo leen la
// ficha y la vista de categoria: un solo sitio donde cambiar "Bebidas".
const enlacesTienda = [...document.querySelectorAll('.main-nav a[data-filtro]')];
const NOMBRES = {};
enlacesTienda.forEach((a) => { NOMBRES[a.dataset.filtro] = a.textContent.trim(); });

// La misma foto en dos anchos: el navegador elige la que le cabe y no descarga
// la grande en un telefono. El 'sizes' dice cuanto va a ocupar la ficha en
// cada tamanio de pantalla, que es lo que no puede adivinar solo.
//
// Antes eran cuatro anchos porque los servia un CDN que los recortaba al
// vuelo. Ahora las fotos estan en el repositorio, y cada ancho de mas es un
// archivo de mas que pesa: con 420 y 840 se cubren el telefono y la pantalla
// con el doble de densidad, que es el salto que de verdad se nota.
const ANCHOS = [420, 840];
// Lo que mide la foto en cada vista. En el telefono la cuadricula es de dos
// columnas y la ficha de la fila mide como mucho 272 px: decirle al navegador
// que la foto ocupa toda la pantalla le hacia bajar la de 840 donde basta la
// de 420. La fila es la vista de entrada, asi que es la que se pinta primero.
const SIZES_CUADRICULA = '(max-width: 680px) calc(50vw - 23px), (max-width: 900px) calc(50vw - 40px), 280px';
const SIZES_FILA = '(max-width: 680px) calc(50vw - 23px), 272px';
const foto = (p, w) => `${p.foto}-${w}.jpg`;

// Lo que viene en varios tamanios lleva un grupo de botones de radio. El
// identificador sale del nombre, que es lo unico que distingue un producto de
// otro, y el primero va marcado porque su precio es el que se ve en la ficha.
const tamanosHtml = (p) => {
  if (!p.tamanos.length) return '';
  const id = idDe(p.nombre);
  const opciones = p.tamanos.map((t, i) => {
    const marca = i === 0 ? ' checked' : '';
    // Agotado es agotado en todos sus tamanios: se pueden ver, pero no elegir.
    const apagado = p.disponible ? '' : ' disabled';
    return `<input class="tamano-input" type="radio" name="tam-${id}" id="tam-${id}-${i}"`
      + ` value="${escapar(t.valor)}" data-precio="${t.precio.toFixed(2)}"${marca}${apagado}>`
      + `<label class="tamano" for="tam-${id}-${i}">${escapar(t.valor)}</label>`;
  }).join('');
  return `<div class="card-tamanos" role="group" aria-label="Tamaño de ${escapar(p.nombre)}">`
    + opciones + '</div>';
};

// Lo agotado no lleva boton de pedir: lleva dicho que vuelve manana. Poner un
// boton que no se puede usar seria ofrecer algo que no hay.
const fondoHtml = (p) => {
  if (!p.disponible) return '<span class="card-agotado">Vuelve mañana</span>';
  // Sin JavaScript este enlace sigue siendo la unica manera de pedir, asi que
  // se queda. Con JS cargado, cart.js lo cambia por el control de cantidad.
  const texto = encodeURIComponent(`Hola, quiero pedir ${p.nombre}.`);
  return `<a class="order-button" href="https://wa.me/593990000000?text=${texto}"`
    + ' target="_blank" rel="noopener">Pedir <span aria-hidden="true">↗</span></a>';
};

// La etiqueta de agotado no viene en los datos: sale de que no haya existencia,
// que es el unico sitio donde ese dato tiene que estar escrito.
const etiquetaHtml = (p) => {
  if (!p.disponible) return '<span class="product-tag agotado">Agotado</span>';
  if (!p.etiqueta) return '';
  return `<span class="product-tag ${escapar(p.etiqueta.color)}">${escapar(p.etiqueta.texto)}</span>`;
};

// La categoria va encima del nombre, en pequeno. Si el menu no la conoce no se
// pone nada: mejor sin rotulo que con el identificador ('bebidas-frias') a la vista.
const categoriaHtml = (p) => (NOMBRES[p.categoria]
  ? `<span class="product-categoria">${escapar(NOMBRES[p.categoria])}</span>` : '');

const fichaHtml = (p) => {
  const srcset = ANCHOS.map((w) => `${foto(p, w)} ${w}w`).join(', ');
  return `<article class="product-card"${p.disponible ? '' : ' data-available="false"'}`
    + ` data-category="${escapar(p.categoria)}">`
    + '<div class="product-image">'
    // El src es el de reserva, para el navegador que no entienda srcset: va el
    // grande, que se ve bien en cualquier sitio aunque pese mas.
    + `<img src="${foto(p, 840)}" srcset="${srcset}" sizes="${SIZES_FILA}"`
    + ` alt="${escapar(p.alt)}" loading="lazy" width="840" height="630">`
    + etiquetaHtml(p)
    + '</div>'
    + '<div class="product-info">'
    + categoriaHtml(p)
    + `<h3>${escapar(p.nombre)}</h3>`
    + tamanosHtml(p)
    + `<div class="product-bottom"><strong>${dinero(p.precio)}</strong>${fondoHtml(p)}</div>`
    + '</div></article>';
};

// Las fichas del DOM, una vez pintadas. Lo que viene abajo las ordena, las
// esconde y las cuenta, asi que necesita la lista de nodos y no los datos.
let products = [];

const pintarFichas = (productos) => {
  if (!productGrid) return;
  productGrid.innerHTML = productos.map(fichaHtml).join('');
  products = [...productGrid.querySelectorAll('.product-card')];
};

// El catalogo entero se arma de una vez, con las fichas ya puestas: el
// mostrador en fila, las flechas, el orden y la vista de categoria necesitan
// medir fichas de verdad, y antes de pintarlas no habria nada que medir.
const montarCatalogo = (productos) => {
  pintarFichas(productos);

  // El stagger lineal recorre la cuadrícula como una tabla. La diagonal se lee como
  // una bandeja que se llena, así que el retraso depende de fila más columna.
  const columnCount = (grid) => {
    if (!grid) return 1;
    const columns = window.getComputedStyle(grid).gridTemplateColumns;
    if (!columns || columns === 'none') return 1;
    return columns.split(' ').filter(Boolean).length || 1;
  };
  const diagonalDelay = (index, columns, step, max) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return Math.min((row + column) * step, max);
  };

  // La fila del mostrador se recorre con el dedo o con el teclado -tabulando por
  // las fichas, que el navegador trae solas a la vista-. Las flechas son el
  // apaño para el raton, que no tiene como desplazar de lado.
  const FLECHA = (izq) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '
    + 'focusable="false"><path d="M' + (izq ? '14.5 5.5 8 12l6.5 6.5' : '9.5 5.5 16 12l-6.5 6.5') + '"/></svg>';
  // Una ficha por salto: el salto de casi una pantalla se pasaba de largo y
  // habia que buscar donde se habia quedado uno. Lo usan la flecha y el reloj.
  const pasoFila = () => {
    const ficha = productGrid?.querySelector('.product-card:not([hidden])');
    const hueco = parseFloat(getComputedStyle(productGrid).columnGap) || 0;
    return ficha ? ficha.getBoundingClientRect().width + hueco : 280;
  };
  // Con 8 px de margen: el desplazamiento suave a veces se queda a uno o dos
  // pixeles de la punta exacta.
  const enElFinal = () => productGrid.scrollLeft
    > productGrid.scrollWidth - productGrid.clientWidth - 8;
  let flechas = [];
  if (productGrid) {
    const zona = document.createElement('div');
    zona.className = 'fila-zona';
    productGrid.parentElement.insertBefore(zona, productGrid);
    // La fila necesita decir que es: sin nombre parecia el catalogo entero
    // puesto de lado. Va fuera de la zona para no pasar por debajo de las
    // flechas, que estan pegadas a los bordes.
    const cabezaFila = document.createElement('div');
    cabezaFila.className = 'fila-cabeza';
    const rotulo = document.createElement('h3');
    rotulo.className = 'fila-rotulo';
    // Decia "Los mas pedidos" y debajo estaban los dieciocho productos, sin
    // ningun dato de ventas detras: un rotulo afirmando lo que el sitio no
    // sabe. Ahora nombra lo que hay.
    rotulo.textContent = 'Nuestro mostrador';
    cabezaFila.append(rotulo);
    zona.before(cabezaFila);
    zona.append(productGrid);
    // Las flechas van en un pie debajo de la fila, con una barra entre las dos
    // que dice por donde se va. En la computadora el pie no pinta caja: las
    // flechas siguen flotando a los lados de las fichas y la barra no sale.
    // En el telefono si: ahi la fila se ve de dos en dos y sin la barra no se
    // sabe cuanto queda.
    const pie = document.createElement('div');
    pie.className = 'fila-pie';
    const barra = document.createElement('div');
    barra.className = 'fila-barra';
    // Es un dibujo de lo que ya cuentan las fichas y las flechas: el lector
    // de pantalla no tiene nada que leer ahi.
    barra.setAttribute('aria-hidden', 'true');
    const avance = document.createElement('span');
    avance.className = 'fila-avance';
    barra.append(avance);
    flechas = [-1, 1].map((ir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fila-flecha';
      b.dataset.ir = String(ir);
      b.innerHTML = FLECHA(ir === -1);
      b.setAttribute('aria-label', ir === -1 ? 'Ver los productos anteriores' : 'Ver más productos');
      b.dataset.tip = ir === -1 ? 'Anterior' : 'Siguiente';
      b.addEventListener('click', () => {
        // La de adelante, en la ultima ficha, vuelve a la primera: lo mismo que
        // hace la fila cuando avanza sola.
        if (ir === 1 && enElFinal()) {
          productGrid.scrollTo({ left: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
          return;
        }
        productGrid.scrollBy({
          left: ir * pasoFila(),
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });
      });
      return b;
    });
    pie.append(flechas[0], barra, flechas[1]);
    zona.append(pie);
    // Al principio se apaga la flecha de atras. La de adelante no se apaga: en
    // la ultima ficha cambia de nombre y lleva de vuelta a la primera, que
    // perderla ahi dejaba al raton sin manera de seguir.
    const mirarPuntas = () => {
      const sobra = productGrid.scrollWidth - productGrid.clientWidth;
      const hayFila = productGrid.classList.contains('is-fila');
      const final = enElFinal();
      pie.hidden = !hayFila || sobra < 24;
      // El trozo lleno mide lo que se ve de la fila y se corre lo que se ha
      // avanzado. El translateX va en % de su propio ancho, de ahi /clientWidth.
      avance.style.width = `${(productGrid.clientWidth / productGrid.scrollWidth) * 100}%`;
      avance.style.transform = `translateX(${(productGrid.scrollLeft / productGrid.clientWidth) * 100}%)`;
      flechas.forEach((b) => {
        b.hidden = !hayFila || sobra < 24;
        if (b.dataset.ir === '-1') {
          b.disabled = productGrid.scrollLeft < 8;
        } else {
          b.setAttribute('aria-label', final ? 'Volver al primer producto' : 'Ver más productos');
          b.dataset.tip = final ? 'Volver al principio' : 'Siguiente';
        }
      });
    };
    productGrid.addEventListener('scroll', mirarPuntas, { passive: true });
    window.addEventListener('resize', mirarPuntas, { passive: true });
    productGrid.mirarPuntas = mirarPuntas;

    // La fila se adelanta sola una ficha cada tanto, que si no hay que adivinar
    // que se puede mover. Al llegar al final vuelve al principio, para que no
    // se quede parada en seco dando la impresion de que se rompio.
    const CADA = 4200;
    let reloj = null;
    let quieta = false;
    const puedeAndar = () => productGrid.classList.contains('is-fila')
      && !reducedMotion.matches
      && !document.hidden
      && !productGrid.estaParada?.()
      && productGrid.scrollWidth - productGrid.clientWidth > 24;

    const avanzar = () => {
      if (quieta || !puedeAndar()) return;
      if (enElFinal()) {
        productGrid.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      productGrid.scrollBy({ left: pasoFila(), behavior: 'smooth' });
    };

    const arrancar = () => {
      if (productGrid.estaParada?.()) return;
      if (!reloj) reloj = setInterval(avanzar, CADA);
    };
    const parar = () => { clearInterval(reloj); reloj = null; };
    // Tras tocarla a mano se le da un respiro largo: seguir empujando mientras
    // alguien decide que lleva es la forma mas rapida de molestar.
    const respiro = () => { parar(); setTimeout(arrancar, CADA * 2); };

    // Mientras se la mira de cerca no se mueve: el raton encima, un dedo, o el
    // foco en alguna ficha son todas senales de que hay alguien eligiendo.
    const vigilar = (entra, sale) => {
      zona.addEventListener(entra, () => { quieta = true; });
      zona.addEventListener(sale, () => { quieta = false; });
    };
    vigilar('mouseenter', 'mouseleave');
    vigilar('focusin', 'focusout');
    vigilar('touchstart', 'touchend');
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) parar(); else arrancar();
    });
    // El boton de pausa queda fuera de la vigilancia del foco: si entrar en el
    // lo marcase como "hay alguien eligiendo", pulsarlo no se distinguiria de
    // pasar por encima.
    flechas.forEach((b) => b.addEventListener('click', respiro));

    // La fila se adelanta sola, y eso necesita un boton que la pare: no vale
    // que se detenga al pasar el raton o al entrar el foco, porque eso es un
    // efecto secundario de hacer otra cosa, no una manera de pedirlo. Quien la
    // para, la para hasta que diga lo contrario.
    let parada = false;
    const botonPausa = document.createElement('button');
    botonPausa.type = 'button';
    botonPausa.className = 'fila-pausa';
    const PAUSA_ICONO = (quieta) => '<svg viewBox="0 0 24 24" fill="currentColor" '
      + 'aria-hidden="true" focusable="false">'
      + (quieta ? '<path d="M8 5.5l11 6.5-11 6.5z"/>'
                : '<rect x="7" y="5.5" width="3.4" height="13" rx="1"/>'
                  + '<rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/>')
      + '</svg>';
    const pintarPausa = () => {
      botonPausa.innerHTML = PAUSA_ICONO(parada);
      botonPausa.setAttribute('aria-pressed', String(parada));
      const dice = parada ? 'Reanudar el avance del mostrador' : 'Detener el avance del mostrador';
      botonPausa.setAttribute('aria-label', dice);
      botonPausa.dataset.tip = parada ? 'Reanudar' : 'Pausar';
    };
    botonPausa.addEventListener('click', () => {
      parada = !parada;
      pintarPausa();
      if (parada) parar(); else arrancar();
      avisos.textContent = parada
        ? 'Mostrador detenido. No se moverá hasta que lo reanudes.'
        : 'Mostrador en marcha otra vez.';
    });
    pintarPausa();
    cabezaFila.append(botonPausa);
    // Mientras este parado a mano, ni el reloj ni las flechas lo reanudan.
    productGrid.estaParada = () => parada;
    arrancar();
  }

  // El orden en que vienen escritas es el de la casa, el que recomienda la
  // panaderia. Se guarda ahora para poder volver a el.
  products.forEach((p, i) => { p.dataset.orden = String(i); });
  const precioDeFicha = (p) => parseFloat(
    (p.querySelector('.product-bottom strong')?.textContent || '').replace(/[^0-9.]/g, '')) || 0;
  const nombreDeFicha = (p) => (p.querySelector('h3')?.textContent || '').trim();
  let orden = 'recomendados';
  let soloDisponibles = false;
  // Solo en el catalogo entero: por que categoria se mira y que se busca. En
  // una categoria sobran, alli ya se esta dentro de una.
  let subcategoria = 'todas';
  let busqueda = '';
  // Se busca sin tildes ni mayusculas: quien escribe "limon" quiere el de limón.
  const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  let filterRun = 0;
  // Ya no hay barra de filtros: la categoria es un estado de la pagina. 'todos'
  // es el inicio con su mostrador en fila; cualquier otra abre su vista.
  let categoria = 'todos';
  const applyFilter = (shouldAnimate = false) => {
    const category = categoria;
    // Donde estabas se apunta en cada cambio, no al salir: de la pagina se
    // sale cerrandola, y no hay un momento fiable para guardar al final.
    recordarVista({ categoria: category, orden, soloDisponibles, subcategoria });
    const animate = shouldAnimate && !reducedMotion.matches;
    const columns = columnCount(productGrid);
    const entering = [];
    let visibleCount = 0;
    let agotados = 0;

    // Sin categoria elegida el catalogo es el mostrador en fila; al elegir una,
    // pasa a cuadricula, que es cuando se viene a mirarlo todo.
    productGrid?.classList.toggle('is-fila', category === 'todos');
    const sizes = category === 'todos' ? SIZES_FILA : SIZES_CUADRICULA;
    productGrid?.querySelectorAll('.product-image img').forEach((img) => { img.sizes = sizes; });
    productGrid?.classList.remove('is-filtering');
    // Cuantos hay en la categoria antes de filtrar nada: es el "de cuantos".
    const todoJunto = category === 'todos' || category === 'catalogo';
    const enCatalogo = category === 'catalogo';
    const deLaCategoria = products.filter((p) => todoJunto || p.dataset.category === category);
    const total = deLaCategoria.length;

    // Ordenar se hace con la propiedad order y no moviendo nodos: las fichas
    // llevan dentro el control de cantidad con su estado, y sacarlas y volverlas
    // a meter es pedir que algo se pierda por el camino.
    const porOrden = [...deLaCategoria].sort((a, b) => {
      if (orden === 'precio-asc') return precioDeFicha(a) - precioDeFicha(b);
      if (orden === 'precio-desc') return precioDeFicha(b) - precioDeFicha(a);
      if (orden === 'nombre') return nombreDeFicha(a).localeCompare(nombreDeFicha(b), 'es');
      return Number(a.dataset.orden) - Number(b.dataset.orden);
    });
    porOrden.forEach((p, i) => { p.style.order = String(i); });

    products.forEach((product) => {
      const deAqui = todoJunto || product.dataset.category === category;
      // El filtro solo manda dentro de una categoria; en el mostrador no hay
      // barra con que tocarlo, asi que ahi se sale todo como siempre.
      const pasaFiltro = category === 'todos' || !soloDisponibles
        || product.dataset.available !== 'false';
      const pasaSub = !enCatalogo || subcategoria === 'todas'
        || product.dataset.category === subcategoria;
      const pasaBusqueda = !enCatalogo || !busqueda
        || plano(nombreDeFicha(product)).includes(plano(busqueda));
      const visible = deAqui && pasaFiltro && pasaSub && pasaBusqueda;
      product.hidden = !visible;
      if (visible) {
        product.style.setProperty('--catalog-delay', `${diagonalDelay(visibleCount, columns, 40, 320)}ms`);
        product.classList.toggle('catalog-enter', animate);
        if (animate) entering.push(product);
        visibleCount += 1;
        if (product.dataset.available === 'false') agotados += 1;
      } else {
        product.classList.remove('catalog-enter');
      }
    });

    // Dentro de una categoria lo util es saber cuantos se estan viendo de los
    // que hay: con un filtro puesto, un numero suelto no dice si falta algo.
    const dice = category === 'todos'
      ? null
      : `Mostrando ${visibleCount} de ${total} producto${total === 1 ? '' : 's'}`;
    if (cuentaVista) cuentaVista.textContent = dice || '';
    // Una busqueda sin resultados no puede quedarse en una pantalla vacia: se
    // dice que no hay y por que.
    if (vacioVista) {
      vacioVista.hidden = !(enCatalogo && visibleCount === 0);
      vacioVista.textContent = busqueda
        ? `No encontramos nada que se llame «${busqueda.trim()}». Prueba con otra palabra o quita algún filtro.`
        : 'No hay productos con estos filtros.';
    }

    if (catalogStatus) {
      const plural = visibleCount === 1 ? '' : 's';
      // Llamar "disponible" a lo que esta agotado seria mentira: cuando falta algo,
      // el aviso cuenta cuantos hay y cuantos se acabaron.
      const cuantos = agotados
        ? `${visibleCount} producto${plural}, ${agotados} agotado${agotados === 1 ? '' : 's'}`
        : `${visibleCount} producto${plural} disponible${plural}`;
      // En el mostrador, el aviso dice ademas por donde se ve todo: si no, la
      // fila parece el catalogo entero y la cuadricula no la encuentra nadie.
      catalogStatus.textContent = category === 'todos'
        ? `${cuantos} en el mostrador.`
        : `${dice}. ${cuantos} en esta categoría.`;
    }
    productGrid?.mirarPuntas?.();
    if (!animate) return;

    const run = ++filterRun;
    const clearEnter = () => {
      if (run !== filterRun) return;
      products.forEach((product) => product.classList.remove('catalog-enter'));
    };
    entering[entering.length - 1]?.addEventListener('animationend', clearEnter, { once: true });
    window.setTimeout(clearEnter, 780);
  };
  // La salida es la única del sitio: los productos actuales se atenúan con una curva
  // acelerada y solo después entra la categoría nueva con la curva desacelerada.
  const cambiarCategoria = (cat) => {
    if (cat === categoria) return;
    categoria = cat;
    // Al cambiar, la fila vuelve a su principio: si no, se entraria a la mitad
    // de lo nuevo sin saber que hay detras.
    if (productGrid) productGrid.scrollLeft = 0;
    if (reducedMotion.matches) {
      applyFilter(false);
      return;
    }
    productGrid?.classList.add('is-filtering');
    window.setTimeout(() => applyFilter(true), 160);
  };

  // ---- La vista del catalogo --------------------------------------------
  // "Ver el menu", Tienda y sus tres categorias abren todos la misma vista: el
  // catalogo entero, que no es el inicio con un filtro puesto sino otra
  // pantalla. Se arma desde aqui porque sin JavaScript no habria vista que
  // abrir; ahi los enlaces bajan al catalogo, que sin la fila sale como
  // cuadricula entera, y eso ya es una respuesta valida.

  const cabeza = document.createElement('div');
  cabeza.className = 'vista-cabeza';
  cabeza.hidden = true;
  cabeza.innerHTML = '<button class="vista-volver" type="button">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="M14.5 5.5 8 12l6.5 6.5"/></svg>Volver al inicio</button>'
    + '<h2 class="vista-titulo" tabindex="-1"></h2>'
    // Ordenar y filtrar viven aqui y no en el mostrador: la fila de la portada
    // es un escaparate de seis, y ordenar seis no le hace falta a nadie.
    + '<div class="vista-barra">'
    + '<div class="vista-mandos">'
    // Buscar y filtrar por categoria salen solo en el catalogo entero, que es
    // donde hay tanto que hace falta.
    + '<label class="vista-mando vista-buscar solo-catalogo"><span class="sr-only">Buscar en el catálogo</span>'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>'
    + '<input class="vista-busca" type="search" placeholder="Buscar un producto" autocomplete="off"></label>'
    + '<label class="vista-mando solo-catalogo"><span>Filtrar por</span>'
    + '<select class="vista-sub">'
    + '<option value="todas">Todas las categorías</option>'
    + '<option value="panes">Panes</option>'
    + '<option value="dulces">Dulces y pasteles</option>'
    + '<option value="bebidas-frias">Bebidas</option>'
    + '</select></label>'
    + '<label class="vista-mando"><span>Ordenar por</span>'
    + '<select class="vista-orden">'
    + '<option value="recomendados">Recomendados</option>'
    + '<option value="precio-asc">Precio: de menor a mayor</option>'
    + '<option value="precio-desc">Precio: de mayor a menor</option>'
    + '<option value="nombre">Nombre: de la A a la Z</option>'
    + '</select></label>'
    + '<label class="vista-mando"><span>Mostrar</span>'
    + '<select class="vista-filtro">'
    + '<option value="todos">Todos</option>'
    + '<option value="disponibles">Solo los disponibles</option>'
    + '</select></label>'
    + '</div>'
    // Lo que se ve de lo que hay. Mudo para el lector de pantalla, que ya tiene
    // el aviso de mas abajo y oirlo dos veces es peor que no oirlo.
    + '<p class="vista-cuenta" aria-hidden="true"></p>'
    + '</div>'
    + '<p class="vista-vacio" role="status" hidden></p>';
  const encabezado = document.querySelector('.catalog .section-heading');
  encabezado?.parentElement.insertBefore(cabeza, encabezado);
  const tituloVista = cabeza.querySelector('.vista-titulo');
  const selOrden = cabeza.querySelector('.vista-orden');
  const selFiltro = cabeza.querySelector('.vista-filtro');
  const cuentaVista = cabeza.querySelector('.vista-cuenta');
  const selSub = cabeza.querySelector('.vista-sub');
  const campoBusca = cabeza.querySelector('.vista-busca');
  const vacioVista = cabeza.querySelector('.vista-vacio');
  // "Todo el catalogo" no es una de las tres de Tienda (a el se llega con
  // "Ver el menu" o con la palabra Tienda), pero es una vista con nombre y
  // direccion propia.
  NOMBRES.catalogo = 'Todo el catálogo';

  selOrden?.addEventListener('change', () => {
    orden = selOrden.value;
    applyFilter(true);
  });
  selFiltro?.addEventListener('change', () => {
    soloDisponibles = selFiltro.value === 'disponibles';
    applyFilter(true);
  });
  selSub?.addEventListener('change', () => {
    subcategoria = selSub.value;
    applyFilter(true);
  });
  // Mientras se escribe no se anima: las fichas entrando a cada tecla marean.
  campoBusca?.addEventListener('input', () => {
    busqueda = campoBusca.value;
    applyFilter(false);
  });

  const pintarVista = (cat) => {
    const enVista = cat !== 'todos';
    document.body.classList.toggle('is-vista', enVista);
    cabeza.hidden = !enVista;
    cabeza.classList.toggle('es-catalogo', cat === 'catalogo');
    if (encabezado) encabezado.hidden = enVista;
    if (enVista) tituloVista.textContent = NOMBRES[cat] || 'Catálogo';
    document.title = enVista
      ? `${NOMBRES[cat] || 'Catálogo'} | El Tradicional`
      : 'El Tradicional | Panadería & Pastelería';
  };

  // Panes, Dulces y Bebidas no abren una vista suya: abren el catalogo entero,
  // el mismo de "Ver el menu", con "Filtrar por" ya puesto en esa categoria.
  // Asi hay una sola pantalla de catalogo y quien entra por Panes tiene a mano
  // quitar el filtro y ver lo demas. La direccion si guarda la categoria
  // (#tienda-panes), para que recargar o volver atras la deje puesta.
  const esDeTienda = (cat) => cat !== 'todos' && cat !== 'catalogo';
  const vistaDe = (cat) => (esDeTienda(cat) ? 'catalogo' : cat);
  const filtroDe = (cat) => (esDeTienda(cat) ? cat : 'todas');
  const ponerFiltro = (sub) => {
    subcategoria = sub;
    if (selSub) selSub.value = sub;
  };

  const abrirCategoria = (cat, conHistorial = true) => {
    const vista = vistaDe(cat);
    // La vista de confirmar el pedido se ve con la barra puesta, asi que desde
    // alli se puede pulsar una categoria: eso es irse del checkout.
    puente.ocultarCheckout?.();
    // Cada categoria se entra limpia: lo elegido en panes no tiene por que
    // seguir puesto al pasar a bebidas.
    orden = 'recomendados';
    soloDisponibles = false;
    if (selOrden) selOrden.value = 'recomendados';
    if (selFiltro) selFiltro.value = 'todos';
    ponerFiltro(filtroDe(cat));
    busqueda = '';
    if (campoBusca) campoBusca.value = '';
    // Volver a la misma vista no la cambia, pero si la limpia (y le pone el
    // filtro nuevo: de Panes a Bebidas la vista es la misma).
    if (vista === categoria) applyFilter(false);
    cambiarCategoria(vista);
    pintarVista(vista);
    if (conHistorial) {
      const destino = cat === 'todos' ? location.pathname + location.search : '#tienda-' + cat;
      history.pushState({ cat }, '', destino);
    }
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    if (vista !== 'todos') tituloVista.focus({ preventScroll: true });
  };
  // Cambiar el filtro a mano tambien cambia la direccion, pero sin apuntar un
  // paso en el historial: Atras tiene que llevar fuera del catalogo, no
  // deshacer los filtros de uno en uno.
  selSub?.addEventListener('change', () => {
    if (categoria !== 'catalogo') return;
    history.replaceState(history.state, '', '#tienda-' + (subcategoria === 'todas' ? 'catalogo' : subcategoria));
  });

  enlacesTienda.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    grupo?.dispatchEvent(new CustomEvent('soltar'));
    abrirGrupo(false);
    abrirCategoria(a.dataset.filtro);
  }));
  cabeza.querySelector('.vista-volver').addEventListener('click', () => abrirCategoria('todos'));

  // "Ver el menu" de la portada y la palabra Tienda de la barra llevan al
  // catalogo entero. Antes solo bajaban a la seccion y dejaban el mostrador en
  // fila, que es un resumen: quien pulsa ahi quiere verlo todo, no una muestra.
  // Sin JavaScript siguen siendo enlaces normales, que bajan ahi mismo.
  document.querySelector('.hero-actions a[href="#catalogo"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    abrirCategoria('catalogo');
  });
  document.querySelector('.nav-grupo-enlace')?.addEventListener('click', (e) => {
    e.preventDefault();
    grupo?.dispatchEvent(new CustomEvent('soltar'));
    abrirGrupo(false);
    abrirCategoria('catalogo');
  });

  // El boton de atras del navegador tiene que funcionar: la vista es un sitio.
  const deLaDireccion = () => {
    const m = location.hash.match(/^#tienda-(.+)$/);
    return m && NOMBRES[m[1]] ? m[1] : 'todos';
  };
  const pintarRuta = () => {
    const cat = deLaDireccion();
    const vista = vistaDe(cat);
    ponerFiltro(filtroDe(cat));
    // Entre #tienda-panes y #tienda-catalogo la vista es la misma y
    // cambiarCategoria no haria nada: el filtro nuevo se aplica aqui.
    if (vista === categoria) applyFilter(false);
    cambiarCategoria(vista);
    pintarVista(vista);
  };
  // Al salir del checkout, la pagina vuelve a lo que diga la direccion: la
  // categoria que hubiera puesta y su titulo.
  puente.pintarRuta = pintarRuta;

  window.addEventListener('popstate', () => {
    // El checkout es otra vista y vive en cart.js. Si la direccion es la suya,
    // manda el y aqui no hay categoria que pintar.
    if (puente.verCheckout?.()) return;
    pintarRuta();
  });

  const deEntrada = deLaDireccion();
  categoria = vistaDe(deEntrada);
  // La vista y su filtro de categoria los dice la direccion, que es la que
  // manda y la que se puede compartir. El orden y "solo disponibles" los dice
  // la pestana, si lo que recordaba es de esta misma vista.
  const antes = vistaRecordada();
  if (antes && antes.categoria === categoria) {
    // Lo recordado se comprueba contra las opciones que existen de verdad. Es
    // un dato del navegador y se puede editar a mano: un orden inventado
    // dejaria el selector en blanco y ordenando por nada.
    const ordenes = [...(selOrden?.options || [])].map((o) => o.value);
    if (ordenes.includes(antes.orden)) orden = antes.orden;
    soloDisponibles = antes.soloDisponibles === true;
    if (selOrden) selOrden.value = orden;
    if (selFiltro) selFiltro.value = soloDisponibles ? 'disponibles' : 'todos';
  }
  // El filtro de categoria no se recuerda: lo dice la direccion, que ahora lo
  // lleva siempre.
  ponerFiltro(filtroDe(deEntrada));
  pintarVista(categoria);
  applyFilter();

  // Al pedir menos animacion, la cuadricula se queda quieta: ni el velo del
  // cambio de categoria ni la entrada escalonada de las fichas.
  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    productGrid?.classList.remove('is-filtering');
    products.forEach((product) => product.classList.remove('catalog-enter'));
  });
};

export { montarCatalogo };
