(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');

  // ---- Lo que el tabulador puede alcanzar -------------------------------
  // La misma lista la usan el cerco de los paneles y los desplegables de la
  // barra, asi que vive una sola vez y aqui arriba. Un elemento escondido no
  // cuenta: 'offsetParent' nulo es como se nota que no esta en pantalla, y asi
  // los pasos ocultos del panel no se cuelan en el recorrido.
  const FOCOS = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focosDe = (caja) => [...caja.querySelectorAll(FOCOS)]
    .filter((el) => el.offsetParent !== null && !el.disabled && el.getAttribute('aria-disabled') !== 'true');

  // Mientras un panel esta abierto, la pagina de detras se apaga del todo con
  // 'inert': ni el tabulador la recorre ni el lector de pantalla la lee. El
  // cerco de Tab ya lo impedia, pero solo para quien tabula; esto lo cierra
  // para todos. Se lleva en un conjunto para que abrir dos veces no descuadre
  // la cuenta y el ultimo en cerrarse sea el que vuelve a encenderla.
  // Cajas de fuera del panel que el cerco tiene que incluir mientras el panel
  // este abierto. Sin esto, la barra de deshacer seria inalcanzable con teclado
  // justo cuando mas falta: al quitar una linea desde dentro de la canasta.
  const anexosDeFoco = new Set();

  const panelesAbiertos = new Set();
  const detras = () => [
    document.querySelector('.site-header'),
    document.querySelector('#contenido'),
    document.querySelector('.site-footer'),
    document.querySelector('.floating-whatsapp'),
  ].filter(Boolean);
  const apagarDetras = (panel, apagado) => {
    if (apagado) panelesAbiertos.add(panel); else panelesAbiertos.delete(panel);
    const hayPanel = panelesAbiertos.size > 0;
    detras().forEach((zona) => { zona.inert = hayPanel; });
  };

  // Un desplegable de la barra se recorre con las flechas, que es lo que espera
  // quien no usa raton: abajo entra y baja, arriba sube, Inicio y Fin van a las
  // puntas y Escape lo cierra devolviendo el foco al boton que lo abrio.
  const flechasEnMenu = (boton, caja, abrir, estaAbierto) => {
    const opciones = () => focosDe(caja);
    const irA = (i) => {
      const lista = opciones();
      if (!lista.length) return;
      lista[(i + lista.length) % lista.length].focus();
    };
    const mover = (paso) => {
      const lista = opciones();
      const donde = lista.indexOf(document.activeElement);
      irA(donde === -1 ? (paso > 0 ? 0 : lista.length - 1) : donde + paso);
    };
    boton.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      if (!estaAbierto()) abrir(true);
      // El desplegable aparece con una transicion; hasta que no es visible no
      // se le puede dar el foco, de ahi el salto al siguiente cuadro.
      requestAnimationFrame(() => irA(e.key === 'ArrowDown' ? 0 : -1));
    });
    caja.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); return; }
      if (e.key === 'Home') { e.preventDefault(); irA(0); return; }
      if (e.key === 'End') { e.preventDefault(); irA(-1); return; }
      if (e.key !== 'Escape') return;
      e.preventDefault();
      abrir(false);
      boton.focus();
    });
  };

  // La cabecera se queda arriba al bajar. Sin fondo mientras se esta en lo alto
  // -ahi la sostiene el velo del hero- y con fondo en cuanto se baja, que es
  // cuando pasan secciones oscuras por detras.
  const cabecera = document.querySelector('.site-header');
  if (cabecera) {
    let pegada = false;
    let sobreOscuro = false;
    // La historia y el pie son del mismo marron que la barra pegada: cuando
    // alguno pasa por detras de ella, la barra se da la vuelta para no fundirse.
    const oscuras = [...document.querySelectorAll('.story, .site-footer')];
    const mirarScroll = () => {
      const ahora = window.scrollY > 40;
      const alto = cabecera.getBoundingClientRect().height;
      const tapando = oscuras.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < alto && r.bottom > 0;
      });
      // Solo se toca el DOM cuando algo cambia; si no, seria en cada pixel.
      if (ahora !== pegada) {
        pegada = ahora;
        cabecera.classList.toggle('is-pegada', ahora);
      }
      if (tapando !== sobreOscuro) {
        sobreOscuro = tapando;
        cabecera.classList.toggle('is-sobre-oscuro', tapando);
      }
    };
    window.addEventListener('scroll', mirarScroll, { passive: true });
    mirarScroll();
  }

  // "Tienda" agrupa las tres categorias del catalogo. Manda el clic, que es lo
  // que funciona con teclado y con el dedo; en raton, ademas, se abre al pasar
  // por encima, porque ahi si existe eso de pasar por encima.
  const grupo = document.querySelector('.nav-grupo');
  const grupoBoton = grupo?.querySelector('.nav-grupo-boton');
  const abrirGrupo = (abierto) => {
    if (!grupo || !grupoBoton) return;
    grupo.classList.toggle('is-open', abierto);
    grupoBoton.setAttribute('aria-expanded', String(abierto));
  };

  const closeMenu = (restoreFocus = false) => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
    // Al plegarse el menu del telefono, la tienda no se queda abierta debajo.
    abrirGrupo(false);
    if (restoreFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    navigation.classList.toggle('is-open', !isOpen);
    // La navegacion va antes del boton en el documento, asi que al abrirla con
    // el teclado el siguiente tabulador se la salta por detras y hay que
    // retroceder para encontrarla. Abriendola, el foco entra en el primer
    // enlace; cerrandola, vuelve al boton, que es de donde salio.
    if (isOpen) { menuToggle.focus(); return; }
    // El menu aparece con una transicion: hasta el cuadro siguiente sigue
    // escondido, y a lo escondido no se le puede dar el foco.
    requestAnimationFrame(() => focosDe(navigation)[0]?.focus());
  });

  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (navigation?.classList.contains('is-open') && !navigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    // Si lo abierto era la tienda, el foco vuelve a su boton y no al de menu,
    // que en pantalla grande ni siquiera se ve.
    const tiendaAbierta = grupo?.classList.contains('is-open');
    grupo?.dispatchEvent(new CustomEvent('soltar'));
    closeMenu(true);
    if (tiendaAbierta) grupoBoton?.focus();
  });

  if (grupo && grupoBoton) {
    // El cursor solo la asoma: al apartarlo se cierra. El clic la deja fijada,
    // y entonces se queda aunque el cursor se vaya, hasta que se vuelve a
    // pulsar o se toca otra cosa.
    let fijada = false;
    grupoBoton.addEventListener('click', () => {
      fijada = !fijada;
      abrirGrupo(fijada);
    });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      grupo.addEventListener('mouseenter', () => abrirGrupo(true));
      grupo.addEventListener('mouseleave', () => { if (!fijada) abrirGrupo(false); });
    }
    // Si el clic o el foco se van a otra parte, el desplegable ya no pinta nada.
    document.addEventListener('click', (event) => {
      if (grupo.contains(event.target)) return;
      fijada = false;
      abrirGrupo(false);
    });
    document.addEventListener('focusin', (event) => {
      if (grupo.contains(event.target)) return;
      fijada = false;
      abrirGrupo(false);
    });
    // Escape la suelta tambien, no solo la cierra.
    grupo.addEventListener('soltar', () => { fijada = false; });
    // Con las flechas se entra y se recorre. Quien abre con el teclado la deja
    // fijada: si no, el primer movimiento del raton se la cerraria en la cara.
    const submenu = grupo.querySelector('.nav-submenu');
    if (submenu) {
      grupoBoton.setAttribute('aria-haspopup', 'true');
      flechasEnMenu(grupoBoton, submenu, (abierto) => {
        fijada = abierto;
        abrirGrupo(abierto);
      }, () => grupo.classList.contains('is-open'));
    }
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth > 680) closeMenu();
  });

  // ---- El cuadrito que sale al dejar el cursor quieto -------------------
  // Hay botones que son solo un dibujo y no dicen en voz alta lo que hacen. El
  // cuadrito lo cuenta, pero sin estorbar: solo si el cursor se queda, y se va
  // en cuanto se mueve. Es uno solo para toda la pagina; ponerle uno a cada
  // boton seria llenar el DOM de cajas que casi nunca se ven.
  const ESPERA_TIP = 500;
  const globo = document.createElement('div');
  globo.className = 'globo';
  globo.setAttribute('role', 'tooltip');
  globo.id = 'globo-ayuda';
  globo.hidden = true;
  document.body.append(globo);

  let relojTip = null;
  let conTip = null;

  const esconderTip = () => {
    clearTimeout(relojTip);
    relojTip = null;
    if (!conTip) return;
    conTip.removeAttribute('aria-describedby');
    conTip = null;
    globo.classList.remove('is-open');
    // Se oculta del todo recien al acabar el desvanecido, que si no reaparece
    // un instante en la esquina la proxima vez que se abre.
    setTimeout(() => { if (!conTip) globo.hidden = true; }, 160);
  };

  const colocarTip = (quien) => {
    const c = quien.getBoundingClientRect();
    globo.hidden = false;
    const g = globo.getBoundingClientRect();
    const margen = 8;
    // Encima de lo que se señala, y si no cabe arriba, debajo.
    const arriba = c.top - g.height - 10;
    const cabeArriba = arriba > margen;
    globo.style.top = `${(cabeArriba ? arriba : c.bottom + 10) + window.scrollY}px`;
    globo.classList.toggle('is-abajo', !cabeArriba);
    // Centrado, pero sin salirse por los lados de la ventana.
    const x = c.left + c.width / 2 - g.width / 2;
    globo.style.left = `${Math.max(margen, Math.min(x, window.innerWidth - g.width - margen)) + window.scrollX}px`;
  };

  const mostrarTip = (quien, yaMismo) => {
    const texto = quien.dataset.tip;
    if (!texto) return;
    clearTimeout(relojTip);
    const abrir = () => {
      conTip = quien;
      globo.textContent = texto;
      quien.setAttribute('aria-describedby', globo.id);
      colocarTip(quien);
      globo.classList.add('is-open');
    };
    // Con el teclado no se espera: quien tabula ya decidio mirar ese boton.
    if (yaMismo) abrir(); else relojTip = setTimeout(abrir, ESPERA_TIP);
  };

  // Si el cuadrito lo pidio el teclado, el raton no manda sobre el: al
  // desplazarse la pagina bajo un cursor quieto saltan mouseover y mouseout
  // solos, y se lo llevaban por delante en el mismo instante en que salia.
  const mandaElTeclado = () => Boolean(conTip) && document.activeElement === conTip;

  document.addEventListener('mouseover', (e) => {
    const quien = e.target.closest?.('[data-tip]');
    if (quien === conTip || mandaElTeclado()) return;
    esconderTip();
    if (quien) mostrarTip(quien, false);
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest?.('[data-tip]') && !mandaElTeclado()) esconderTip();
  });
  // Al tabular si sale; al pulsar con el raton no, que ahi ya se vio el efecto.
  // Un campo de texto casa con :focus-visible siempre, lo enfoque el raton o el
  // teclado, asi que para distinguirlos hay que recordar como se llego.
  let llegoConRaton = false;
  document.addEventListener('pointerdown', () => { llegoConRaton = true; }, true);
  document.addEventListener('keydown', () => { llegoConRaton = false; }, true);

  document.addEventListener('focusin', (e) => {
    const quien = e.target.closest?.('[data-tip]');
    if (!quien) return;
    // Quien tabula hasta aqui si quiere saber que es esto. Quien lo pulso con
    // el raton ya lo esta usando: el cuadrito solo le taparia lo que escribe.
    if (llegoConRaton) esconderTip();
    else mostrarTip(quien, true);
  });
  document.addEventListener('focusout', esconderTip);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') esconderTip(); });
  // Si la pagina se mueve debajo, el cuadrito se queda apuntando al vacio. Pero
  // tabular hasta un boton ya desplaza la pagina: ahi no hay que esconderlo
  // -se iria en el mismo instante en que sale- sino seguirlo.
  const seguirOEsconder = () => {
    if (!conTip) return;
    if (document.activeElement === conTip) colocarTip(conTip);
    else esconderTip();
  };
  window.addEventListener('scroll', seguirOEsconder, { passive: true });
  window.addEventListener('resize', seguirOEsconder, { passive: true });

  const products = [...document.querySelectorAll('.product-card')];
  const catalogStatus = document.querySelector('.catalog-status');
  const productGrid = document.querySelector('.product-grid');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    // La puerta al catalogo entero. Antes esto era una frase en el aviso de
    // abajo -"Entra en Tienda para ver una categoria completa"-, es decir una
    // instruccion tapando que no habia por donde entrar.
    const verTodo = document.createElement('button');
    verTodo.type = 'button';
    verTodo.className = 'fila-vertodo';
    verTodo.innerHTML = 'Ver todo el catálogo<svg viewBox="0 0 24 24" fill="none" '
      + 'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" '
      + 'stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + '<path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';
    cabezaFila.append(rotulo, verTodo);
    zona.before(cabezaFila);
    zona.append(productGrid);
    flechas = [-1, 1].map((ir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fila-flecha';
      b.dataset.ir = String(ir);
      b.innerHTML = FLECHA(ir === -1);
      b.setAttribute('aria-label', ir === -1 ? 'Ver los productos anteriores' : 'Ver más productos');
      b.dataset.tip = ir === -1 ? 'Anterior' : 'Siguiente';
      b.addEventListener('click', () => {
        productGrid.scrollBy({
          left: ir * pasoFila(),
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });
      });
      zona.append(b);
      return b;
    });
    // Al llegar a una punta, la flecha de ese lado se apaga.
    const mirarPuntas = () => {
      const sobra = productGrid.scrollWidth - productGrid.clientWidth;
      const hayFila = productGrid.classList.contains('is-fila');
      flechas.forEach((b) => {
        b.hidden = !hayFila || sobra < 24;
        b.disabled = b.dataset.ir === '-1'
          ? productGrid.scrollLeft < 8
          : productGrid.scrollLeft > sobra - 8;
      });
    };
    productGrid.addEventListener('scroll', mirarPuntas, { passive: true });
    window.addEventListener('resize', mirarPuntas, { passive: true });
    productGrid.dataset.mirarPuntas = '1';
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
      const sobra = productGrid.scrollWidth - productGrid.clientWidth;
      if (productGrid.scrollLeft > sobra - 8) {
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
    // abrirCategoria se declara mas abajo en este mismo ambito; al pulsar ya
    // existe, igual que 'avisos', que tambien se usa aqui y nace despues.
    verTodo.addEventListener('click', () => abrirCategoria('catalogo'));
    // Mientras este parado a mano, ni el reloj ni las flechas lo reanudan.
    productGrid.estaParada = () => parada;
    productGrid.andarSola = { arrancar, parar };
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

  let filterRun = 0;
  // Ya no hay barra de filtros: la categoria es un estado de la pagina. 'todos'
  // es el inicio con su mostrador en fila; cualquier otra abre su vista.
  let categoria = 'todos';
  const applyFilter = (shouldAnimate = false) => {
    const category = categoria;
    const animate = shouldAnimate && !reducedMotion.matches;
    const columns = columnCount(productGrid);
    const entering = [];
    let visibleCount = 0;
    let agotados = 0;

    // Sin categoria elegida el catalogo es el mostrador en fila; al elegir una,
    // pasa a cuadricula, que es cuando se viene a mirarlo todo.
    productGrid?.classList.toggle('is-fila', category === 'todos');
    productGrid?.classList.remove('is-filtering');
    // Cuantos hay en la categoria antes de filtrar nada: es el "de cuantos".
    const todoJunto = category === 'todos' || category === 'catalogo';
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
      const visible = deAqui && pasaFiltro;
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

  // ---- La vista de categoria -------------------------------------------
  // A una categoria se entra desde Tienda, y lo que se abre no es el inicio con
  // un filtro puesto: es otra vista. Se arma desde aqui porque sin JavaScript no
  // habria vista que abrir; ahi los enlaces bajan al catalogo, que sin la fila
  // sale como cuadricula entera, y eso ya es una respuesta valida.
  const enlacesTienda = [...document.querySelectorAll('.main-nav a[data-filtro]')];
  const NOMBRES = {};
  enlacesTienda.forEach((a) => { NOMBRES[a.dataset.filtro] = a.textContent.trim(); });

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
    + '</div>';
  const encabezado = document.querySelector('.catalog .section-heading');
  encabezado?.parentElement.insertBefore(cabeza, encabezado);
  const tituloVista = cabeza.querySelector('.vista-titulo');
  const selOrden = cabeza.querySelector('.vista-orden');
  const selFiltro = cabeza.querySelector('.vista-filtro');
  const cuentaVista = cabeza.querySelector('.vista-cuenta');

  selOrden?.addEventListener('change', () => {
    orden = selOrden.value;
    applyFilter(true);
  });
  selFiltro?.addEventListener('change', () => {
    soloDisponibles = selFiltro.value === 'disponibles';
    applyFilter(true);
  });

  const pintarVista = (cat) => {
    const enVista = cat !== 'todos';
    document.body.classList.toggle('is-vista', enVista);
    cabeza.hidden = !enVista;
    if (encabezado) encabezado.hidden = enVista;
    if (enVista) tituloVista.textContent = NOMBRES[cat] || 'Catálogo';
    document.title = enVista
      ? `${NOMBRES[cat] || 'Catálogo'} | El Tradicional`
      : 'El Tradicional | Panadería & Pastelería';
  };

  const abrirCategoria = (cat, conHistorial = true) => {
    // Cada categoria se entra limpia: lo elegido en panes no tiene por que
    // seguir puesto al pasar a bebidas.
    orden = 'recomendados';
    soloDisponibles = false;
    if (selOrden) selOrden.value = 'recomendados';
    if (selFiltro) selFiltro.value = 'todos';
    cambiarCategoria(cat);
    pintarVista(cat);
    if (conHistorial) {
      const destino = cat === 'todos' ? location.pathname + location.search : '#tienda-' + cat;
      history.pushState({ cat }, '', destino);
    }
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    if (cat !== 'todos') tituloVista.focus({ preventScroll: true });
  };

  enlacesTienda.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    grupo?.dispatchEvent(new CustomEvent('soltar'));
    abrirGrupo(false);
    abrirCategoria(a.dataset.filtro);
  }));
  cabeza.querySelector('.vista-volver').addEventListener('click', () => abrirCategoria('todos'));

  // El boton de atras del navegador tiene que funcionar: la vista es un sitio.
  const deLaDireccion = () => {
    const m = location.hash.match(/^#tienda-(.+)$/);
    return m && NOMBRES[m[1]] ? m[1] : 'todos';
  };
  window.addEventListener('popstate', () => {
    const cat = deLaDireccion();
    cambiarCategoria(cat);
    pintarVista(cat);
  });

  categoria = deLaDireccion();
  pintarVista(categoria);
  applyFilter();

  // Tres entradas de la barra nombran una categoria. Sin JavaScript son enlaces
  // normales que bajan al catalogo, que ya es la respuesta correcta; con JS
  // ademas dejan puesto el filtro, para que bajar a "Bebidas" no aterrice en el
  // pan y toque buscar.
  document.querySelectorAll('.main-nav a[data-filtro]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      const filtro = document.querySelector(`#filter-${enlace.dataset.filtro}`);
      if (!filtro || filtro.checked) return;
      filtro.checked = true;
      filtro.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  document.querySelectorAll('img').forEach((image) => {
    image.parentElement?.classList.add('is-loading');
    const markImageLoaded = () => {
      image.classList.add('is-loaded');
      image.parentElement?.classList.remove('is-loading');
    };
    image.addEventListener('load', markImageLoaded);
    image.addEventListener('error', () => {
      image.hidden = true;
      image.classList.remove('is-loaded');
      image.parentElement?.classList.remove('is-loading');
      image.parentElement?.classList.add('image-unavailable');
    });
    if (image.complete && image.naturalWidth > 0) markImageLoaded();
  });
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) {
    const heroPreload = new Image();
    heroPreload.addEventListener('load', () => heroImage.classList.add('is-loaded'), { once: true });
    heroPreload.src = getComputedStyle(heroImage).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1] || '';
  }

  // Una animación dominante por zona. El patrón describe la forma de cada zona:
  // fade-up de base, máscara para la foto en retrato, eje X para el texto y la franja,
  // y secuencia numerada para los principios.
  const motionMap = [
    ['.sign-band', 'reveal-band'],
    ['.section-heading', 'reveal'],
    ['.story-photo', 'reveal-mask'],
    ['.story-copy', 'reveal-x'],
    ['.principles', 'reveal-line']
  ];
  const motionItems = [];
  motionMap.forEach(([selector, pattern]) => {
    document.querySelectorAll(selector).forEach((item) => {
      item.classList.add(pattern);
      item.dataset.motion = pattern;
      motionItems.push(item);
    });
  });

  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    // La amplitud acompaña al peso tipográfico: el titular recorre más que el eyebrow.
    // Tres hijos desde que el panadero subio a la cabecera: el titular -que
    // recorre mas, porque pesa mas-, el parrafo y los botones.
    const riseByIndex = [16, 10, 8];
    [...heroContent.children].forEach((child, index) => {
      child.style.setProperty('--rise', `${riseByIndex[index] ?? 8}px`);
      child.style.setProperty('--hero-delay', `${Math.min(index * 70, 420)}ms`);
    });
    heroContent.classList.add('is-ready');
  }

  let revealObserver = null;
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    motionItems.forEach((item) => revealObserver.observe(item));
  } else {
    motionItems.forEach((item) => item.classList.add('is-visible'));
  }

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    revealObserver = null;
    motionItems.forEach((item) => item.classList.add('is-visible'));
    productGrid?.classList.remove('is-filtering');
    products.forEach((product) => product.classList.remove('catalog-enter'));
  });

  const easterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };
  const dateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const holidayKeys = (year) => {
    const easter = easterSunday(year);
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 48);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    return new Set([
      `${year}-1-1`, `${year}-5-1`, `${year}-8-10`, `${year}-10-9`, `${year}-11-2`, `${year}-11-3`, `${year}-12-25`,
      dateKey(carnival), dateKey(new Date(carnival.getFullYear(), carnival.getMonth(), carnival.getDate() + 1)), dateKey(goodFriday)
    ]);
  };
  const toMinutes = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const updateOpeningStatus = () => {
    const visita = document.querySelector('.footer-visita');
    const label = visita?.querySelector('.open-label');
    if (!visita || !label) return;
    const now = new Date();
    const day = now.getDay();
    const holiday = holidayKeys(now.getFullYear()).has(dateKey(now));
    const hours = day >= 1 && day <= 5 ? '08:00-20:00' : '09:00-21:00';
    const [opening, closing] = hours.split('-');
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isOpen = !holiday && currentMinutes >= toMinutes(opening) && currentMinutes < toMinutes(closing);
    label.classList.toggle('is-closed', !isOpen);
    label.querySelector('.status-dot')?.classList.toggle('is-closed', !isOpen);

    // Senalar que fila del horario es la de hoy, reutilizando el dia ya calculado.
    // Se busca por el cuadro del horario y no por la columna de al lado: el
    // cuadro se mudo de columna una vez y esto dejo de funcionar en silencio.
    document.querySelectorAll('.footer-horario div[data-dias]').forEach((fila) => {
      const esHoy = fila.dataset.dias.split(',').includes(String(day));
      fila.classList.toggle('is-today', esHoy);
      let marca = fila.querySelector('.dia-hoy');
      if (esHoy && !marca) {
        marca = document.createElement('span');
        marca.className = 'dia-hoy';
        marca.textContent = 'hoy';
        fila.querySelector('dt')?.appendChild(marca);
      } else if (!esHoy && marca) {
        marca.remove();
      }
    });
    // Google y Yelp muestran el estado con la hora, no solo "abierto": es el dato
    // que responde la pregunta real, "¿me da tiempo a ir?". Ya se calculaba y se tiraba.
    let estado;
    if (holiday) estado = 'Cerrado · día festivo';
    else if (isOpen) estado = `Abierto · cierra ${closing}`;
    else if (currentMinutes < toMinutes(opening)) estado = `Cerrado · abre ${opening}`;
    else estado = 'Cerrado · abre mañana';
    label.lastChild.textContent = ` ${estado}`;

    // La nota del hero decia "Recien salido del horno · Sale a las 17:00" en
    // texto fijo, con un punto de estado al lado que latia en ambar a cualquier
    // hora: el CSS de "cerrado" existia para ese punto y nada lo activaba. Era
    // el sitio afirmando un dato que no tenia, al lado de un horario que si se
    // calcula. Ahora las dos cosas salen del mismo calculo.
    const nota = document.querySelector('.hero-note');
    const notaTitulo = nota?.querySelector('.hero-note-titulo');
    const notaDato = nota?.querySelector('.hero-note-dato');
    if (!notaTitulo || !notaDato) return;
    nota.querySelector('.status-dot')?.classList.toggle('is-closed', !isOpen);
    if (isOpen) {
      notaTitulo.textContent = 'Horneando ahora mismo';
      notaDato.textContent = `Abierto hasta las ${closing}`;
    } else if (holiday) {
      notaTitulo.textContent = 'Hoy no horneamos';
      notaDato.textContent = 'Día festivo · volvemos mañana';
    } else if (currentMinutes < toMinutes(opening)) {
      notaTitulo.textContent = 'El horno se está calentando';
      notaDato.textContent = `Abrimos a las ${opening}`;
    } else {
      notaTitulo.textContent = 'Ya cerramos por hoy';
      notaDato.textContent = `Mañana abrimos a las ${opening}`;
    }
  };

  // Mientras un panel esta abierto el foco no puede escaparse a la pagina de
  // detras, y Escape lo cierra. Lo mismo hace falta en la canasta y en la cuenta,
  // asi que vive una sola vez aqui.
  const atraparFoco = (panel, abierto, cerrar) => {
    document.addEventListener('keydown', (e) => {
      if (!abierto()) return;
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return;
      // El panel primero y los anexos despues: el recorrido tiene que acabar
      // en la barra de deshacer, que es lo ultimo que aparece en pantalla.
      const focos = [panel, ...anexosDeFoco].flatMap((caja) => focosDe(caja));
      if (!focos.length) return;
      const primero = focos[0], ultimo = focos[focos.length - 1];
      // Si el foco acabo fuera -en el body, por ejemplo, porque se escondio el
      // boton que lo tenia al cambiar de paso-, la siguiente tecla lo devuelve
      // dentro en vez de echarlo a pasear por la pagina de detras.
      const dentro = [panel, ...anexosDeFoco].some((caja) => caja.contains(document.activeElement));
      if (!dentro) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  };

  // ---- Canasta ---------------------------------------------------------
  // El sitio es estatico, asi que el pedido viaja por WhatsApp. Pero WhatsApp es
  // el medio, no la oferta: antes de confirmar se elige retiro o domicilio y eso
  // va escrito en el mensaje. El cobro es una simulacion academica y vive en el
  // mismo panel, en tres pasos (canasta, pago, comprobante), para no sacar al
  // cliente del pedido que ya armo. Los botones "Pedir" siguen siendo enlaces:
  // si esto falla, funcionan solos.
  const WHATSAPP = '593990000000';
  const CLAVE = 'eltradicional-pedido';
  const pedido = new Map();
  const entrega = { modo: 'retiro', direccion: '', punto: null };
  // La cuenta es una maqueta sin servidor; se rellena en la seccion de mas abajo.
  const sesion = { nombre: '', correo: '', telefono: '', direccion: '',
    dentro: false, verificado: false };
  // El numero con el prefijo delante, tal como lo veria quien lo marca. Vive
  // aqui arriba porque lo usan la canasta y la cuenta, y la canasta lo escribe
  // al pintar el pie, que corre nada mas cargar la pagina.
  const telefonoLargo = (n) => `+593 ${String(n || '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')}`;
  // Los datos de la tarjeta viven aqui y solo aqui: no se guardan ni se envian
  // a ningun lado, y se borran al salir del paso de pago.
  const tarjeta = { numero: '', vence: '', cvv: '', titular: '' };
  const cobro = { metodo: 'efectivo', numero: '', detalle: '' };

  // Lo que cuesta llevarlo. Vive aqui arriba, con los demas datos, porque el
  // panel ya lo escribe al nacer para que cada opcion diga lo que vale.
  // Mientras no se senala a donde, se cobra la tarifa de salida; al marcar el
  // punto en el mapa se cobra por lo lejos que queda, como en las apps.
  // Cien panes es un pedido de fiesta; mas que eso se habla por telefono, no se
  // teclea. El tope vive aqui, con los demas datos, porque lo usan el boton, el
  // campo y lo que se recupera de lo guardado, y eso ultimo corre antes.
  const MAX_UNIDADES = 100;
  const ENVIO = 1.50;
  const ENVIO_BASE = 1.00;
  const ENVIO_POR_KM = 0.35;
  const ENVIO_TECHO = 6.00;
  // La panaderia, en la esquina de Eloy Alfaro y Gabriel Espinosa, Tena.
  const LOCAL = { lat: -0.9938, lng: -77.8128 };

  // Distancia en linea recta entre dos puntos de la Tierra. No es lo que anda
  // la moto, pero para una maqueta de clase sobra y no necesita ningun servicio.
  const kmEntre = (a, b) => {
    const R = 6371;
    const rad = (g) => (g * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // Al 0,05 mas cercano: cobrar $2,3718 no lo hace nadie.
  const tarifaPara = (km) => Math.min(
    Math.round((ENVIO_BASE + km * ENVIO_POR_KM) * 20) / 20, ENVIO_TECHO);
  const dinero = (n) => '$' + n.toFixed(2);
  const idDe = (nombre) => nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

  const leerGuardado = () => {
    try {
      const crudo = window.localStorage.getItem(CLAVE);
      if (!crudo) return;
      // Antes se guardaba solo el array de lineas; se sigue aceptando ese formato.
      const dato = JSON.parse(crudo);
      const lineas = Array.isArray(dato) ? dato : (dato.lineas || []);
      lineas.forEach((l) => {
        if (l && l.id && l.nombre && l.cantidad > 0) pedido.set(l.id, { nombre: l.nombre, precio: Number(l.precio) || 0, cantidad: Math.min(l.cantidad, MAX_UNIDADES) });
      });
      if (!Array.isArray(dato)) {
        if (dato.modo === 'domicilio') entrega.modo = 'domicilio';
        if (typeof dato.direccion === 'string') entrega.direccion = dato.direccion.slice(0, 200);
        // El punto del mapa viene de lo que haya en este navegador: se mira que
        // sean dos numeros de verdad antes de cobrar una distancia con ellos.
        const p = dato.punto;
        if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
          && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) {
          entrega.punto = { lat: p.lat, lng: p.lng };
        }
      }
    } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza vacio */ }
  };
  const guardar = () => {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify({
        lineas: [...pedido].map(([id, l]) => ({ id, ...l })),
        modo: entrega.modo,
        direccion: entrega.direccion,
        punto: entrega.punto,
      }));
    } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
  };
  const borrarGuardado = () => {
    try { window.localStorage.removeItem(CLAVE); } catch (e) { /* si no se pudo guardar, no hay nada que borrar */ }
  };

  // QR decorativo: los modulos salen de una secuencia fija, asi que siempre se
  // dibuja igual y tiene la textura de un QR, pero no codifica nada. Por eso va
  // aria-hidden y con un texto al lado que explica que es.
  const qrDecorativo = () => {
    const lado = 25;
    const enOjo = (x, y) => [[0, 0], [lado - 7, 0], [0, lado - 7]].some(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
    let semilla = 20260926;
    const modulos = [];
    for (let y = 0; y < lado; y += 1) {
      for (let x = 0; x < lado; x += 1) {
        semilla = (semilla * 1103515245 + 12345) % 2147483648;
        if (enOjo(x, y) || semilla % 100 >= 46) continue;
        modulos.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
      }
    }
    const ojo = (x, y) => `<path d="M${x + 0.5} ${y + 0.5}h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return '<svg class="pago-qr" viewBox="-1 -1 27 27" aria-hidden="true" focusable="false"><g fill="currentColor">'
      + modulos.join('') + ojo(0, 0) + ojo(lado - 7, 0) + ojo(0, lado - 7) + '</g></svg>';
  };

  // Panel, fondo y region de avisos se crean desde JavaScript: sin JS no hacen falta.
  const fondo = document.createElement('div');
  fondo.className = 'canasta-fondo';
  const panel = document.createElement('aside');
  panel.className = 'canasta-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'canasta-titulo');
  panel.innerHTML =
    '<div class="canasta-cabecera"><h2 id="canasta-titulo" tabindex="-1">Tu canasta</h2>'
    + '<button class="canasta-cerrar" type="button" aria-label="Cerrar la canasta">×</button></div>'
    + '<div class="canasta-pasos">'

    + '<section class="canasta-paso" data-paso="canasta">'
    + '<div class="canasta-cuerpo"><ul class="canasta-lista"></ul>'
    + '<p class="canasta-vacio">Tu canasta está vacía.</p></div>'
    + '<div class="canasta-pie">'
    + '<p class="canasta-aviso pide-cuenta" role="alert" hidden>'
    + 'Para pedir necesitas una cuenta con el teléfono verificado: ahí te llega el comprobante.'
    + '<button class="pide-cuenta-boton" type="button">Crear cuenta o entrar</button></p>'
    + '<div class="canasta-total"><span>Subtotal</span><strong>$0.00</strong></div>'
    + '<button class="button button-yellow canasta-enviar" type="button">'
    + 'Confirmar el pedido <span aria-hidden="true">→</span></button>'
    + '<p class="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p>'
    + '</div></section>'

    // Como se recibe el pedido es su propio paso: aqui se elige entre pasar a
    // retirarlo o que se lo lleven, y recien aqui aparece el desglose, porque
    // hasta no saberlo no se puede decir cuanto cuesta el pedido entero.
    + '<section class="canasta-paso" data-paso="entrega" hidden>'
    + '<div class="canasta-cuerpo">'
    + '<button class="canasta-volver" data-vuelve="canasta" type="button">'
    + '<span aria-hidden="true">←</span> Volver a la canasta</button>'
    + '<fieldset class="canasta-entrega"><legend>¿Cómo lo quieres?</legend>'
    + '<div class="canasta-opciones">'
    + '<label><input type="radio" name="canasta-entrega" value="retiro" checked>'
    + '<span>Paso retirando<small>Gratis</small></span></label>'
    + '<label><input type="radio" name="canasta-entrega" value="domicilio">'
    + '<span>A domicilio<small>Desde ' + dinero(ENVIO_BASE) + '</small></span></label></div>'
    + '<div class="canasta-local">'
    + '<p class="canasta-local-titulo">Esquina de Eloy Alfaro y Gabriel Espinosa</p>'
    + '<p class="canasta-local-dato">Tena, Napo. Te esperamos en el mostrador.</p></div>'
    + '<div class="canasta-direccion" hidden>'
    + '<div class="mapa-zona">'
    + '<div class="mapa-caja"><div class="mapa-lienzo"></div>'
    + '<p class="mapa-fallo" hidden>No se pudo cargar el mapa. '
    + 'Escribe la dirección y cobramos la tarifa de salida</p></div>'
    + '<div class="mapa-pie">'
    + '<button class="mapa-aqui" type="button">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<circle cx="12" cy="12" r="3.3"/><path d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2"/>'
    + '<circle cx="12" cy="12" r="8"/></svg>Usar mi ubicación</button>'
    // Marcar el punto no puede depender de acertarle con el raton: este boton
    // deja la aguja en el centro de lo que se esta mirando, y el mapa se mueve
    // con las flechas. Es el camino de quien va solo con teclado, y de paso el
    // de quien en el telefono no quiere pelearse con el pulgar.
    + '<button class="mapa-centro" type="button">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="M12 21.4c0 0-6.6-5.3-6.6-10.1a6.6 6.6 0 0 1 13.2 0c0 4.8-6.6 10.1-6.6 10.1Z"/>'
    + '<circle cx="12" cy="11" r="2.4"/></svg>Marcar el centro del mapa</button>'
    + '<p class="mapa-dato">Marca a dónde va el pedido: toca el mapa, o muévelo '
    + 'con las flechas y pulsa Enter</p>'
    + '</div></div>'
    + '<label for="canasta-dir">¿A dónde lo llevamos?</label>'
    + '<input id="canasta-dir" type="text" autocomplete="street-address" '
    + 'placeholder="Calle, número y una referencia">'
    + '<p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p>'
    + '</div></fieldset></div>'
    + '<div class="canasta-pie">'
    + '<dl class="canasta-desglose">'
    + '<div><dt>Subtotal</dt><dd class="desglose-subtotal">$0.00</dd></div>'
    + '<div><dt>Envío</dt><dd class="desglose-envio">Gratis</dd></div>'
    + '<div class="desglose-suma"><dt>Total</dt><dd class="desglose-total">$0.00</dd></div>'
    + '</dl>'
    + '<button class="button button-yellow canasta-seguir" type="button">'
    + 'Seguir al pago <span aria-hidden="true">→</span></button>'
    + '</div></section>'

    + '<section class="canasta-paso" data-paso="pago" hidden>'
    + '<div class="canasta-cuerpo">'
    + '<button class="canasta-volver" data-vuelve="entrega" type="button">'
    + '<span aria-hidden="true">←</span> Volver a cómo lo recibes</button>'
    + '<p class="pago-demo"><strong>Esto es una demostración.</strong> Es un proyecto de clase: '
    + 'no se procesa ningún cobro real y los datos de la tarjeta no se guardan ni se envían.</p>'
    + '<div class="canasta-total pago-total"><span>Total a pagar</span><strong>$0.00</strong></div>'
    + '<p class="pago-modalidad"></p>'
    + '<fieldset class="canasta-entrega pago-metodos"><legend>¿Cómo quieres pagar?</legend>'
    + '<div class="canasta-opciones">'
    + '<label><input type="radio" name="canasta-metodo" value="efectivo" checked><span>Efectivo</span></label>'
    + '<label><input type="radio" name="canasta-metodo" value="tarjeta"><span>Tarjeta</span></label>'
    + '<label><input type="radio" name="canasta-metodo" value="transferencia"><span>Transferencia</span></label>'
    + '<label><input type="radio" name="canasta-metodo" value="deuna"><span>DeUna</span></label>'
    + '</div></fieldset>'

    + '<div class="pago-detalle" data-detalle="efectivo">'
    + '<p class="pago-dato pago-efectivo">Pagas al retirar el pedido.</p></div>'

    + '<div class="pago-detalle" data-detalle="tarjeta" hidden>'
    + '<p class="pago-prueba">Tarjeta de prueba: <strong>4242 4242 4242 4242</strong>, '
    + 'cualquier vencimiento futuro y CVV 123. No escribas una tarjeta de verdad.</p>'
    + '<div class="pago-campo"><label for="pago-numero">Número de la tarjeta</label>'
    + '<input id="pago-numero" type="text" inputmode="numeric" autocomplete="off" '
    + 'placeholder="4242 4242 4242 4242" maxlength="19" aria-describedby="pago-numero-error">'
    + '<p class="pago-campo-error" id="pago-numero-error" hidden></p></div>'
    + '<div class="pago-fila">'
    + '<div class="pago-campo"><label for="pago-vence">Vencimiento</label>'
    + '<input id="pago-vence" type="text" inputmode="numeric" autocomplete="off" '
    + 'placeholder="MM/AA" maxlength="5" aria-describedby="pago-vence-error">'
    + '<p class="pago-campo-error" id="pago-vence-error" hidden></p></div>'
    + '<div class="pago-campo"><label for="pago-cvv">CVV</label>'
    + '<input id="pago-cvv" type="text" inputmode="numeric" autocomplete="off" '
    + 'placeholder="123" maxlength="3" aria-describedby="pago-cvv-error">'
    + '<p class="pago-campo-error" id="pago-cvv-error" hidden></p></div></div>'
    + '<div class="pago-campo"><label for="pago-titular">Nombre del titular</label>'
    + '<input id="pago-titular" type="text" autocomplete="off" '
    + 'placeholder="Como aparece en la tarjeta" maxlength="60" aria-describedby="pago-titular-error">'
    + '<p class="pago-campo-error" id="pago-titular-error" hidden></p></div></div>'

    + '<div class="pago-detalle" data-detalle="transferencia" hidden>'
    + '<p class="pago-dato">Transfiere desde tu banco y avísanos con el comprobante.</p>'
    + '<dl class="pago-banco">'
    + '<div><dt>Banco</dt><dd>Banco Pichincha</dd></div>'
    + '<div><dt>Tipo de cuenta</dt><dd>Corriente</dd></div>'
    + '<div><dt>Número de cuenta</dt><dd><span class="pago-cuenta">2100123456</span></dd></div>'
    + '<div><dt>Titular</dt><dd>Panadería El Tradicional Cía. Ltda.</dd></div>'
    + '<div><dt>RUC</dt><dd>1591234567001</dd></div></dl>'
    + '<button class="pago-copiar" type="button">Copiar el número de cuenta</button>'
    + '<p class="pago-copiado" role="status" hidden></p>'
    + '<p class="pago-dato pago-ficticio">Datos bancarios ficticios, puestos para la demostración.</p></div>'

    + '<div class="pago-detalle" data-detalle="deuna" hidden>'
    + '<p class="pago-dato">Abre DeUna en la app de tu banco y escanea el código.</p>'
    + '<div class="pago-qr-caja">' + qrDecorativo()
    + '<p class="pago-qr-alt">Código QR de adorno: tiene la forma de un QR de DeUna '
    + 'para El Tradicional, pero no codifica nada y no abre ningún cobro.</p></div></div>'

    + '<fieldset class="canasta-entrega pago-canal"><legend>¿Dónde te enviamos el comprobante?</legend>'
    + '<div class="canasta-opciones">'
    + '<label><input type="radio" name="canasta-canal" value="sms" checked>'
    + '<span>Mensaje de texto</span></label>'
    + '<label><input type="radio" name="canasta-canal" value="whatsapp">'
    + '<span>WhatsApp</span></label>'
    + '</div>'
    + '<p class="pago-canal-dato">Al <strong class="pago-canal-numero"></strong>, '
    + 'el teléfono verificado de tu cuenta.</p></fieldset>'
    + '</div><div class="canasta-pie">'
    + '<p class="canasta-aviso pago-error" role="alert" hidden></p>'
    + '<button class="button button-yellow canasta-pagar" type="button">Confirmar el pedido</button>'
    + '<p class="canasta-nota">Simulación académica: no se cobra ni un centavo.</p>'
    + '</div></section>'

    + '<section class="canasta-paso" data-paso="comprobante" hidden>'
    + '<div class="canasta-cuerpo">'
    + '<p class="recibo-sello"><span aria-hidden="true">✓</span> Pedido registrado</p>'
    + '<p class="recibo-simulado">Pedido simulado. Es una demostración académica: '
    + 'no se realizó ningún cobro y la panadería todavía no ha recibido nada.</p>'
    + '<dl class="recibo-datos">'
    + '<div><dt>Número de pedido</dt><dd><span class="recibo-numero">ET-0000</span>'
    + '<button class="recibo-copiar" type="button">Copiar</button></dd></div>'
    + '<div><dt>Subtotal</dt><dd class="recibo-subtotal">$0.00</dd></div>'
    + '<div><dt>Envío</dt><dd class="recibo-envio">Gratis</dd></div>'
    + '<div><dt>Total</dt><dd class="recibo-total">$0.00</dd></div>'
    + '<div><dt>Pago</dt><dd class="recibo-metodo"></dd></div>'
    + '<div><dt>Entrega</dt><dd class="recibo-modo"></dd></div>'
    + '<div class="recibo-linea-dir" hidden><dt>Dirección</dt><dd class="recibo-direccion"></dd></div>'
    + '</dl>'
    + '<h3 class="recibo-titulo">Lo que pediste</h3><ul class="recibo-lista"></ul></div>'
    + '<div class="codigo-falso recibo-enviado">'
    + '<p class="codigo-falso-de recibo-enviado-de"></p>'
    + '<p class="codigo-falso-texto recibo-enviado-texto"></p></div>'
    + '<p class="recibo-simulado">Mensaje simulado: no se envió nada a ningún teléfono de '
    + 'verdad. Con un servidor detrás, aquí saldría el comprobante al número verificado.</p>'
    + '<div class="canasta-pie">'
    + '<p class="recibo-copiado" role="status" hidden></p>'
    + '<button class="button button-yellow canasta-listo" type="button">Listo, cerrar</button>'
    + '<p class="canasta-nota">Apunta o copia el número antes de cerrar: al cerrar, '
    + 'el pedido queda cumplido y la canasta se vacía.</p>'
    + '</div></section>'

    + '</div>';
  const avisos = document.createElement('p');
  avisos.className = 'sr-only';
  avisos.setAttribute('role', 'status');
  avisos.setAttribute('aria-live', 'polite');

  // La barra de deshacer. Vive en el body y no dentro del panel porque se
  // quita desde los dos sitios: desde la ficha del catalogo y desde la lista de
  // la canasta. Va por encima del panel para que se vea en ambos casos, y se
  // apunta en los anexos del cerco para que el tabulador la alcance.
  const barraDeshacer = document.createElement('div');
  barraDeshacer.className = 'deshacer-barra';
  barraDeshacer.hidden = true;
  barraDeshacer.innerHTML = '<p class="deshacer-texto"></p>'
    + '<button class="deshacer-boton" type="button">Deshacer</button>';
  const deshacerTexto = barraDeshacer.querySelector('.deshacer-texto');
  const deshacerBoton = barraDeshacer.querySelector('.deshacer-boton');
  anexosDeFoco.add(barraDeshacer);

  document.body.append(fondo, panel, avisos, barraDeshacer);

  const titulo = panel.querySelector('#canasta-titulo');
  const pasos = [...panel.querySelectorAll('.canasta-paso')];
  const lista = panel.querySelector('.canasta-lista');
  const vacio = panel.querySelector('.canasta-vacio');
  const totalEl = panel.querySelector('[data-paso="canasta"] .canasta-total strong');
  const enviar = panel.querySelector('.canasta-enviar');
  const radios = [...panel.querySelectorAll('input[name="canasta-entrega"]')];
  const bloqueDir = panel.querySelector('.canasta-direccion');
  const campoDir = panel.querySelector('#canasta-dir');
  const avisoDir = panel.querySelector('.canasta-direccion .canasta-aviso');
  const seguir = panel.querySelector('.canasta-seguir');
  const desgloseSub = panel.querySelector('.desglose-subtotal');
  const desgloseEnvio = panel.querySelector('.desglose-envio');
  const desgloseTotal = panel.querySelector('.desglose-total');
  const bloqueLocal = panel.querySelector('.canasta-local');
  const mapaCaja = panel.querySelector('.mapa-zona');
  const mapaLienzo = panel.querySelector('.mapa-lienzo');
  const mapaFallo = panel.querySelector('.mapa-fallo');
  const mapaDato = panel.querySelector('.mapa-dato');
  const mapaAqui = panel.querySelector('.mapa-aqui');
  const mapaCentro = panel.querySelector('.mapa-centro');
  const metodos = [...panel.querySelectorAll('input[name="canasta-metodo"]')];
  const detalles = [...panel.querySelectorAll('.pago-detalle')];
  const pagoTotal = panel.querySelector('.pago-total strong');
  const pagoModalidad = panel.querySelector('.pago-modalidad');
  const pagoEfectivo = panel.querySelector('.pago-efectivo');
  const pagar = panel.querySelector('.canasta-pagar');
  const errorPago = panel.querySelector('.pago-error');
  const copiar = panel.querySelector('.pago-copiar');
  const copiado = panel.querySelector('.pago-copiado');
  const pideCuenta = panel.querySelector('.pide-cuenta');
  const pideCuentaBoton = panel.querySelector('.pide-cuenta-boton');
  const canales = [...panel.querySelectorAll('input[name="canasta-canal"]')];
  const canalNumero = panel.querySelector('.pago-canal-numero');
  const reciboEnviadoDe = panel.querySelector('.recibo-enviado-de');
  const reciboEnviadoTexto = panel.querySelector('.recibo-enviado-texto');
  const listo = panel.querySelector('.canasta-listo');
  const reciboCopiar = panel.querySelector('.recibo-copiar');
  const reciboCopiado = panel.querySelector('.recibo-copiado');

  // Llevarlo cuesta; pasar a retirarlo, no. De ahi que haya dos sumas: la del
  // pan y la del pedido. Antes solo habia una y el envio no existia.
  const subtotal = () => [...pedido.values()].reduce((s, l) => s + l.precio * l.cantidad, 0);
  const envio = () => {
    if (entrega.modo !== 'domicilio') return 0;
    return entrega.punto ? tarifaPara(kmEntre(LOCAL, entrega.punto)) : ENVIO;
  };
  const total = () => subtotal() + envio();
  const unidades = () => [...pedido.values()].reduce((s, l) => s + l.cantidad, 0);

  const mensaje = () => {
    const lineas = [...pedido.values()].map((l) => `• ${l.cantidad} × ${l.nombre} — ${dinero(l.precio * l.cantidad)}`);
    // La modalidad viaja escrita en el mensaje: quien atiende no tiene que preguntarla.
    const comoLoQuiere = entrega.modo === 'domicilio'
      ? `Entrega: a domicilio\nDirección: ${entrega.direccion}`
      : 'Entrega: paso retirando por el local';
    // Estando dentro de la cuenta el pedido sale con nombre: quien atiende no
    // tiene que preguntar de quien es.
    const quien = sesion.dentro ? `\nA nombre de: ${sesion.nombre}` : '';
    // El numero de pedido y el metodo solo existen despues del paso de pago; sin
    // ellos el mensaje es el de siempre.
    const cabecera = cobro.numero ? `Hola, confirmo el pedido ${cobro.numero}:` : 'Hola, quiero pedir esto:';
    const pago = cobro.numero ? `\nPago: ${cobro.detalle} (simulado, sin cobro real)` : '';
    const cuenta = envio()
      ? `Subtotal: ${dinero(subtotal())}\nEnvío: ${dinero(envio())}\nTotal: ${dinero(total())}`
      : `Total: ${dinero(total())}`;
    return `${cabecera}\n${lineas.join('\n')}\n\n${cuenta}\n${comoLoQuiere}${quien}${pago}`;
  };

  const boton = document.querySelector('.floating-whatsapp');
  if (boton) boton.dataset.tip = 'Tu canasta';
  const cuenta = document.createElement('span');
  cuenta.className = 'canasta-cuenta';
  cuenta.hidden = true;
  // Cada ficha del catalogo deja aqui su manera de repintarse: lo que cambia en
  // el panel (o al restaurar el pedido guardado) tiene que verse en el catalogo.
  const refrescos = [];
  // Y donde vive el boton "mas" de cada producto, para poder devolverle el
  // foco. Es una funcion y no un id fijo porque lo que viene en varios tamanios
  // cambia de identificador al cambiar el tamanio elegido.
  const botonesMas = [];

  const pintar = () => {
    lista.textContent = '';
    for (const [id, l] of pedido) {
      const li = document.createElement('li');
      li.className = 'canasta-linea';
      li.innerHTML =
        `<div><h3>${l.nombre}</h3><p class="canasta-precio">${dinero(l.precio)} la unidad</p>`
        + `<div class="canasta-cantidad"><button type="button" data-menos aria-label="Quitar uno de ${l.nombre}">−</button>`
        + `<output>${l.cantidad}</output>`
        + `<button type="button" data-mas aria-label="Añadir uno de ${l.nombre}">+</button></div></div>`
        + `<span class="canasta-subtotal">${dinero(l.precio * l.cantidad)}</span>`;
      li.querySelector('[data-menos]').addEventListener('click', () => cambiar(id, -1));
      li.querySelector('[data-mas]').addEventListener('click', () => cambiar(id, 1));
      lista.append(li);
    }
    pintarPie();
  };

  // ---- El mapa del reparto ---------------------------------------------
  // Leaflet se trae recien cuando alguien elige que se lo lleven: quien pasa a
  // retirar no tiene por que descargar un mapa que no va a mirar. Si no llega
  // -sin red, o con el CDN caido- no se rompe nada: queda la direccion escrita
  // y se cobra la tarifa de salida, que es como funcionaba hasta ahora.
  const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
  let mapa = null;
  let aguja = null;
  let pidiendoMapa = null;

  const traerLeaflet = () => {
    if (window.L) return Promise.resolve(window.L);
    if (pidiendoMapa) return pidiendoMapa;
    pidiendoMapa = new Promise((listo, falla) => {
      const hoja = document.createElement('link');
      hoja.rel = 'stylesheet';
      hoja.href = LEAFLET_CSS;
      document.head.append(hoja);
      const guion = document.createElement('script');
      guion.src = LEAFLET_JS;
      guion.onload = () => (window.L ? listo(window.L) : falla(new Error('sin L')));
      guion.onerror = () => falla(new Error('no cargo'));
      document.head.append(guion);
    });
    return pidiendoMapa;
  };

  const contarDistancia = () => {
    if (!mapaDato) return;
    if (!entrega.punto) {
      mapaDato.textContent = 'Marca a dónde va el pedido: toca el mapa, o muévelo '
        + 'con las flechas y pulsa Enter';
      return;
    }
    const km = kmEntre(LOCAL, entrega.punto);
    mapaDato.textContent = `A ${km.toFixed(1)} km del local · envío ${dinero(tarifaPara(km))}`;
  };

  const ponerAguja = (donde) => {
    entrega.punto = { lat: donde.lat, lng: donde.lng };
    if (aguja) aguja.setLatLng(donde);
    contarDistancia();
    pintarDesglose();
    guardar();
  };

  // El centro de lo que se esta mirando es el punto. Lo usan el boton del pie y
  // la tecla Enter sobre el mapa, que son las dos maneras de marcarlo sin raton.
  const marcarCentro = () => {
    if (!mapa || !aguja) {
      if (mapaDato) mapaDato.textContent = 'El mapa todavía se está cargando; espera un momento';
      return;
    }
    if (!aguja._map) aguja.addTo(mapa);
    const centro = mapa.getCenter();
    ponerAguja({ lat: centro.lat, lng: centro.lng });
  };

  const armarMapa = () => {
    if (mapa || !mapaLienzo) return;
    traerLeaflet().then((L) => {
      mapa = L.map(mapaLienzo, { attributionControl: true })
        .setView([LOCAL.lat, LOCAL.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapa);
      // El local, fijo, para que se vea desde donde sale el pan.
      L.circleMarker([LOCAL.lat, LOCAL.lng], {
        radius: 7, color: '#a85f45', fillColor: '#d79b4a', fillOpacity: 1, weight: 2,
      }).addTo(mapa).bindTooltip('El Tradicional');
      aguja = L.marker([LOCAL.lat, LOCAL.lng], { draggable: true });
      aguja.on('dragend', () => ponerAguja(aguja.getLatLng()));
      mapa.on('click', (e) => {
        if (!aguja._map) aguja.addTo(mapa);
        ponerAguja(e.latlng);
      });
      // Leaflet le pone tabindex="0" al lienzo y ya mueve con las flechas y
      // acerca con + y −. Lo que no trae es manera de soltar la aguja sin
      // raton, asi que Enter hace eso. Sin rotulo, al tabular hasta aqui no se
      // oye mas que "mapa" y no hay como saber que se puede hacer.
      mapaLienzo.setAttribute('role', 'application');
      mapaLienzo.setAttribute('aria-label', 'Mapa del reparto. Muévelo con las flechas, '
        + 'acerca y aleja con las teclas más y menos, y pulsa Enter para marcar el centro '
        + 'como punto de entrega.');
      mapaLienzo.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        marcarCentro();
      });
      if (entrega.punto) { aguja.setLatLng(entrega.punto).addTo(mapa); contarDistancia(); }
      // Nace con el panel cerrado y sin medidas; hay que decirle que se mire.
      setTimeout(() => mapa.invalidateSize(), 60);
    }).catch(() => {
      if (mapaFallo) mapaFallo.hidden = false;
      if (mapaLienzo) mapaLienzo.hidden = true;
      if (mapaAqui) mapaAqui.hidden = true;
      if (mapaCentro) mapaCentro.hidden = true;
    });
  };

  mapaCentro?.addEventListener('click', marcarCentro);

  mapaAqui?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      mapaDato.textContent = 'Este navegador no sabe decir dónde estás; marca el punto a mano';
      return;
    }
    mapaDato.textContent = 'Buscando dónde estás…';
    navigator.geolocation.getCurrentPosition((pos) => {
      const donde = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (mapa && aguja) {
        if (!aguja._map) aguja.addTo(mapa);
        mapa.setView([donde.lat, donde.lng], 16);
      }
      ponerAguja(donde);
    }, () => {
      mapaDato.textContent = 'No se pudo saber dónde estás; marca el punto en el mapa';
    }, { enableHighAccuracy: true, timeout: 8000 });
  });

  // El desglose solo se puede escribir una vez que se sabe como se recibe: el
  // envio cambia el total y hasta el paso de entrega no esta decidido.
  const pintarDesglose = () => {
    bloqueDir.hidden = entrega.modo !== 'domicilio';
    if (bloqueLocal) bloqueLocal.hidden = entrega.modo !== 'retiro';
    if (desgloseSub) desgloseSub.textContent = dinero(subtotal());
    if (desgloseEnvio) desgloseEnvio.textContent = envio() ? dinero(envio()) : 'Gratis';
    if (desgloseTotal) desgloseTotal.textContent = dinero(total());
  };

  const pintarPie = () => {
    const hayAlgo = pedido.size > 0;
    vacio.hidden = hayAlgo;
    totalEl.textContent = dinero(subtotal());
    enviar.disabled = !hayAlgo;
    enviar.setAttribute('aria-disabled', String(!hayAlgo));
    pintarDesglose();
    const n = unidades();
    cuenta.hidden = n === 0;
    cuenta.textContent = n;
    if (boton) boton.setAttribute('aria-label', n ? `Ver la canasta, ${n} producto${n === 1 ? '' : 's'}` : 'Ver la canasta, vacía');
    if (canalNumero) canalNumero.textContent = telefonoLargo(sesion.telefono);
    if (pideCuenta && sesion.dentro && sesion.verificado) pideCuenta.hidden = true;
    // El importe del paso de pago se recalcula aqui: volver atras y cambiar la
    // canasta tiene que verse reflejado al seguir.
    pintarPago();
    refrescos.forEach((refrescar) => refrescar());
    guardar();
  };

  // ---- Pago simulado ----
  // El proyecto es academico: la gracia es enseñar el recorrido completo, no
  // cobrar. Cada pantalla lo dice en voz alta para que nadie crea otra cosa.
  const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia bancaria', deuna: 'DeUna' };
  const metodoActual = () => metodos.find((m) => m.checked)?.value || 'efectivo';
  let procesando = false;
  let temporizador = 0;

  const pintarPago = () => {
    const metodo = metodoActual();
    pagoTotal.textContent = dinero(total());
    pagoModalidad.textContent = entrega.modo === 'domicilio'
      ? `A domicilio · ${entrega.direccion}`
      : 'Paso retirando por el local';
    pagoEfectivo.textContent = entrega.modo === 'domicilio'
      ? 'Pagas en efectivo al recibir el pedido en tu puerta.'
      : 'Pagas en efectivo al retirar el pedido en el local.';
    detalles.forEach((d) => { d.hidden = d.dataset.detalle !== metodo; });
    // Mientras procesa, el boton dice otra cosa y no se le puede pisar el texto.
    if (procesando) return;
    // En efectivo no hay nada que cobrar ahora, asi que el boton no promete un pago.
    pagar.textContent = metodo === 'efectivo' ? 'Confirmar el pedido' : `Pagar ${dinero(total())}`;
  };

  // Luhn: es la comprobacion que hace cualquier pasarela antes de mandar nada,
  // y es lo que separa un numero inventado de uno con forma de tarjeta.
  const luhn = (digitos) => {
    let suma = 0;
    let doble = false;
    for (let i = digitos.length - 1; i >= 0; i -= 1) {
      let n = Number(digitos[i]);
      if (doble) { n *= 2; if (n > 9) n -= 9; }
      suma += n;
      doble = !doble;
    }
    return digitos.length > 0 && suma % 10 === 0;
  };

  const camposTarjeta = [
    { clave: 'numero', nombre: 'el número', input: panel.querySelector('#pago-numero'), error: panel.querySelector('#pago-numero-error') },
    { clave: 'vence', nombre: 'el vencimiento', input: panel.querySelector('#pago-vence'), error: panel.querySelector('#pago-vence-error') },
    { clave: 'cvv', nombre: 'el CVV', input: panel.querySelector('#pago-cvv'), error: panel.querySelector('#pago-cvv-error') },
    { clave: 'titular', nombre: 'el titular', input: panel.querySelector('#pago-titular'), error: panel.querySelector('#pago-titular-error') },
  ];
  const tocados = new Set();
  let intentado = false;

  const fallosTarjeta = () => {
    const fallos = {};
    const num = tarjeta.numero.replace(/\D/g, '');
    if (num.length < 16) fallos.numero = 'Faltan dígitos: son 16.';
    else if (!luhn(num)) fallos.numero = 'Ese número no es válido. Prueba con 4242 4242 4242 4242.';
    const partes = /^(\d{2})\/(\d{2})$/.exec(tarjeta.vence);
    if (!partes) fallos.vence = 'Escríbelo como MM/AA.';
    else {
      const mes = Number(partes[1]);
      const anio = 2000 + Number(partes[2]);
      const hoy = new Date();
      if (mes < 1 || mes > 12) fallos.vence = 'El mes va entre 01 y 12.';
      else if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) fallos.vence = 'Esa tarjeta ya venció.';
    }
    if (!/^\d{3}$/.test(tarjeta.cvv)) fallos.cvv = 'Son los 3 dígitos del reverso.';
    if (tarjeta.titular.length < 3) fallos.titular = 'Escribe el nombre del titular.';
    return fallos;
  };

  // Un campo solo se marca cuando ya lo tocaste o cuando ya intentaste pagar:
  // avisar de un error antes de escribir nada no ayuda a nadie.
  const pintarTarjeta = () => {
    const fallos = fallosTarjeta();
    camposTarjeta.forEach(({ clave, input, error }) => {
      const texto = (intentado || tocados.has(clave)) ? fallos[clave] : '';
      error.hidden = !texto;
      error.textContent = texto || '';
      input.setAttribute('aria-invalid', texto ? 'true' : 'false');
      input.classList.toggle('is-mal', Boolean(texto));
    });
    return fallos;
  };

  // El cursor vuelve a la misma posicion contada en digitos, no en caracteres:
  // si no, al reformatear salta al final y no se puede corregir en medio.
  const reformatear = (input, agrupar) => {
    const corte = input.selectionStart === null ? input.value.length : input.selectionStart;
    const antes = input.value.slice(0, corte).replace(/\D/g, '').length;
    input.value = agrupar(input.value.replace(/\D/g, ''));
    let pos = 0;
    let vistos = 0;
    while (pos < input.value.length && vistos < antes) {
      if (/\d/.test(input.value[pos])) vistos += 1;
      pos += 1;
    }
    try { input.setSelectionRange(pos, pos); } catch (e) { /* el campo puede no estar enfocado */ }
  };
  const grupos4 = (d) => d.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const mmaa = (d) => (d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d);

  camposTarjeta.forEach(({ clave, input }) => {
    input.addEventListener('input', () => {
      if (clave === 'numero') reformatear(input, grupos4);
      if (clave === 'vence') reformatear(input, mmaa);
      if (clave === 'cvv') reformatear(input, (d) => d.slice(0, 3));
      tarjeta[clave] = clave === 'titular' ? input.value.trim().slice(0, 60) : input.value;
      pintarTarjeta();
    });
    input.addEventListener('blur', () => { tocados.add(clave); pintarTarjeta(); });
  });

  const olvidarTarjeta = () => {
    camposTarjeta.forEach(({ clave, input }) => { tarjeta[clave] = ''; input.value = ''; });
    tocados.clear();
    intentado = false;
    pintarTarjeta();
    errorPago.hidden = true;
  };

  canales.forEach((c) => c.addEventListener('change', () => {
    if (!c.checked) return;
    avisos.textContent = c.value === 'whatsapp'
      ? 'El comprobante llegará por WhatsApp.'
      : 'El comprobante llegará por mensaje de texto.';
  }));

  metodos.forEach((m) => m.addEventListener('change', () => {
    if (!m.checked) return;
    errorPago.hidden = true;
    copiado.hidden = true;
    pintarPago();
  }));

  const respaldoCopiar = (texto) => {
    // Sin permiso de portapapeles (o sin HTTPS) queda el camino de siempre.
    const temporal = document.createElement('textarea');
    temporal.value = texto;
    temporal.setAttribute('readonly', '');
    temporal.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.append(temporal);
    temporal.select();
    let hecho = false;
    try { hecho = document.execCommand('copy'); } catch (e) { hecho = false; }
    temporal.remove();
    return hecho;
  };
  reciboCopiar.addEventListener('click', async () => {
    const texto = panel.querySelector('.recibo-numero').textContent.trim();
    let hecho = false;
    try {
      if (!navigator.clipboard) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(texto);
      hecho = true;
    } catch (e) {
      hecho = respaldoCopiar(texto);
    }
    reciboCopiado.hidden = false;
    reciboCopiado.textContent = hecho
      ? `Número ${texto} copiado.`
      : `No se pudo copiar; apunta el ${texto} a mano.`;
  });

  copiar.addEventListener('click', async () => {
    const texto = panel.querySelector('.pago-cuenta').textContent.trim();
    let hecho = false;
    try {
      if (!navigator.clipboard) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(texto);
      hecho = true;
    } catch (e) {
      hecho = respaldoCopiar(texto);
    }
    copiado.hidden = false;
    copiado.textContent = hecho ? 'Número de cuenta copiado.' : 'No se pudo copiar; selecciónalo a mano.';
  });

  // Sin caracteres que se confundan al dictar el numero por telefono.
  const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeroDePedido = () => 'ET-' + Array.from({ length: 4 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');

  const detalleDe = (metodo) => {
    if (metodo === 'efectivo') return entrega.modo === 'domicilio' ? 'Efectivo al recibir' : 'Efectivo al retirar';
    if (metodo === 'tarjeta') return `Tarjeta terminada en ${tarjeta.numero.replace(/\D/g, '').slice(-4)}`;
    if (metodo === 'deuna') return 'DeUna (QR)';
    return METODOS[metodo];
  };

  const pintarComprobante = () => {
    panel.querySelector('.recibo-numero').textContent = cobro.numero;
    panel.querySelector('.recibo-subtotal').textContent = dinero(subtotal());
    panel.querySelector('.recibo-envio').textContent = envio() ? dinero(envio()) : 'Gratis';
    panel.querySelector('.recibo-total').textContent = dinero(total());
    panel.querySelector('.recibo-metodo').textContent = cobro.detalle;
    panel.querySelector('.recibo-modo').textContent = entrega.modo === 'domicilio' ? 'A domicilio' : 'Paso retirando por el local';
    panel.querySelector('.recibo-linea-dir').hidden = entrega.modo !== 'domicilio';
    panel.querySelector('.recibo-direccion').textContent = entrega.direccion;
    const recibo = panel.querySelector('.recibo-lista');
    recibo.textContent = '';
    for (const l of pedido.values()) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${l.cantidad} × ${l.nombre}</span><span>${dinero(l.precio * l.cantidad)}</span>`;
      recibo.append(li);
    }
    const porDonde = canales.find((c) => c.checked)?.value === 'whatsapp'
      ? 'WhatsApp' : 'Mensaje de texto';
    reciboEnviadoDe.textContent = `${porDonde} de El Tradicional · ${telefonoLargo(sesion.telefono)}`;
    reciboEnviadoTexto.textContent = `Hola ${sesion.nombre.split(' ')[0]}: tu pedido `
      + `${cobro.numero} quedó registrado por ${dinero(total())}. `
      + `${entrega.modo === 'domicilio' ? 'Te lo llevamos a ' + entrega.direccion : 'Pasa a retirarlo por el local'}. `
      + 'Gracias por comprar en El Tradicional.';
  };

  const TITULOS = { canasta: 'Tu canasta', entrega: 'Cómo lo recibes',
    pago: 'Pago del pedido', comprobante: 'Pedido confirmado' };
  let pasoActual = 'canasta';

  // Al llegar al pago el panel deja de ser una gaveta lateral y se planta en el
  // centro, con el resto desenfocado: pagar merece toda la pantalla, no un
  // costado. La forma solo se recalcula con el panel abierto, asi que al cerrar
  // la tarjeta se desvanece donde estaba en vez de saltar al borde.
  const pintarForma = () => {
    const centrado = pasoActual !== 'canasta';
    panel.classList.toggle('is-centrado', centrado);
    fondo.classList.toggle('is-difuminado', centrado);
  };

  const irA = (nombre, mover = true, forma = true) => {
    pasoActual = nombre;
    if (forma) pintarForma();
    // El dialogo se sigue nombrando por el mismo h2, que cambia con el paso.
    titulo.textContent = TITULOS[nombre];
    pasos.forEach((s) => { s.hidden = s.dataset.paso !== nombre; });
    const cuerpo = panel.querySelector('.canasta-paso:not([hidden]) .canasta-cuerpo');
    if (cuerpo) cuerpo.scrollTop = 0;
    if (mover) titulo.focus();
  };

  const restablecerPagar = () => {
    procesando = false;
    panel.classList.remove('is-procesando');
    pagar.disabled = false;
    pagar.removeAttribute('aria-disabled');
    pintarPago();
  };

  const aprobar = (metodo) => {
    procesando = false;
    cobro.metodo = metodo;
    cobro.numero = numeroDePedido();
    cobro.detalle = detalleDe(metodo);
    pintarComprobante();
    // El comprobante ya esta emitido: la canasta guardada se borra para que no
    // reaparezca en la proxima visita, pero las lineas siguen en memoria para
    // poder leer el recibo y armar el mensaje hasta que se cierre el panel.
    borrarGuardado();
    cuenta.hidden = true;
    if (boton) boton.setAttribute('aria-label', 'Ver la canasta, vacía');
    olvidarTarjeta();
    restablecerPagar();
    irA('comprobante');
    avisos.textContent = `Pago aprobado. Pedido ${cobro.numero}. Es una simulación: no se cobró nada.`;
  };

  pagar.addEventListener('click', () => {
    if (procesando || !pedido.size) return;
    const metodo = metodoActual();
    if (metodo === 'tarjeta') {
      intentado = true;
      const fallos = pintarTarjeta();
      const faltan = camposTarjeta.filter(({ clave }) => fallos[clave]);
      if (faltan.length) {
        errorPago.hidden = false;
        errorPago.textContent = `Revisa ${faltan.map((c) => c.nombre).join(', ')} de la tarjeta.`;
        faltan[0].input.focus();
        return;
      }
    }
    errorPago.hidden = true;
    procesando = true;
    panel.classList.add('is-procesando');
    pagar.innerHTML = '<span class="pago-girando" aria-hidden="true"></span> Procesando el pago…';
    pagar.disabled = true;
    pagar.setAttribute('aria-disabled', 'true');
    // El boton se desactiva, asi que el foco se va con el: al titulo, que es
    // ademas lo que lee el lector de pantalla al cambiar de paso.
    titulo.focus();
    avisos.textContent = 'Procesando el pago…';
    temporizador = window.setTimeout(() => { temporizador = 0; aprobar(metodo); }, 1500);
  });

  // Cada paso vuelve al anterior, no siempre a la canasta.
  panel.querySelectorAll('.canasta-volver').forEach((b) => b.addEventListener('click',
    () => irA(b.dataset.vuelve || 'entrega')));
  listo.addEventListener('click', () => cerrar());

  // Elegir retiro o domicilio: lo unico que cambia es el pie.
  radios.forEach((radio) => radio.addEventListener('change', () => {
    if (!radio.checked) return;
    entrega.modo = radio.value === 'domicilio' ? 'domicilio' : 'retiro';
    avisoDir.hidden = true;
    pintarPie();
    pintarDesglose();
    if (entrega.modo === 'domicilio') { armarMapa(); campoDir.focus(); }
  }));

  campoDir.addEventListener('input', () => {
    entrega.direccion = campoDir.value.trim().slice(0, 200);
    if (entrega.direccion) avisoDir.hidden = true;
    pintarPie();
  });

  // Confirmar la canasta lleva a decidir como se recibe, no al pago: hasta no
  // saberlo no se puede decir cuanto cuesta el pedido entero.
  const puedePedir = () => sesion.dentro && sesion.verificado;

  enviar.addEventListener('click', () => {
    if (!pedido.size) return;
    // El comprobante va al telefono de la cuenta, asi que hay que saber cual
    // es y que sea suyo. El aviso se queda dentro de la canasta y no echa al
    // usuario a otra parte sin explicar por que.
    if (!puedePedir()) {
      pideCuenta.hidden = false;
      pideCuentaBoton.focus();
      avisos.textContent = 'Para pedir hace falta una cuenta con el teléfono verificado.';
      return;
    }
    pideCuenta.hidden = true;
    pintarDesglose();
    irA('entrega');
  });

  // Saltar a la cuenta no pierde el pedido: la canasta se queda como esta y al
  // volver se sigue donde se estaba. abrirC se declara mas abajo, igual que
  // 'avisos'; al pulsar ya existe.
  pideCuentaBoton.addEventListener('click', () => {
    pideCuenta.hidden = true;
    cerrar();
    abrirC();
  });

  // Sin direccion no se puede llevar nada: en vez de pasar al pago, se avisa y
  // se lleva el foco al campo que falta.
  seguir?.addEventListener('click', () => {
    if (!pedido.size) return;
    if (entrega.modo === 'domicilio' && !entrega.direccion) {
      avisoDir.hidden = false;
      campoDir.focus();
      return;
    }
    pintarPago();
    irA('pago');
  });

  // Lo ultimo que se quito, por si hay que reponerlo. Se guarda una copia: la
  // linea original se borra del pedido y no se puede confiar en la referencia.
  const ESPERA_DESHACER = 12000;
  let borrado = null;
  let relojDeshacer = 0;

  const olvidarBorrado = () => {
    window.clearTimeout(relojDeshacer);
    relojDeshacer = 0;
    borrado = null;
    barraDeshacer.hidden = true;
  };

  const anotarBorrado = (id, linea) => {
    borrado = { id, linea: { ...linea } };
    deshacerTexto.textContent = linea.cantidad === 1
      ? `Quitaste ${linea.nombre}.`
      : `Quitaste ${linea.nombre} (${linea.cantidad} unidades).`;
    barraDeshacer.hidden = false;
    window.clearTimeout(relojDeshacer);
    relojDeshacer = window.setTimeout(olvidarBorrado, ESPERA_DESHACER);
  };

  const deshacerBorrado = () => {
    if (!borrado) return;
    const { id, linea } = borrado;
    pedido.set(id, { ...linea });
    olvidarBorrado();
    pintar();
    avisos.textContent = `${linea.nombre} vuelve a la canasta. ${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
    // La barra acaba de esconderse con el foco dentro, asi que hay que
    // recogerlo: si no, se va al body y quien usa teclado pierde el sitio.
    // Va al "mas" del producto repuesto, que es a donde manda tambien quitar
    // la ultima unidad desde la ficha. Pero el destino depende de desde donde
    // se quito: con el panel abierto el catalogo esta inert, y a lo inerte no
    // se le puede dar el foco -lo intenta y se queda en el body-, asi que ahi
    // el sitio es el "mas" de la linea recien repuesta dentro del panel.
    // Si el panel esta abierto el destino vive dentro de el; si no, en la ficha
    // del catalogo. No vale mirar si el elemento "se ve": el panel cerrado sigue
    // teniendo medidas y solo esta en visibility hidden, asi que parece valido
    // y al darle el foco no pasa nada.
    const destino = abierto()
      ? ([...lista.querySelectorAll('.canasta-linea')]
          .find((li) => li.querySelector('h3')?.textContent === linea.nombre)
          ?.querySelector('[data-mas]') || panel.querySelector('.canasta-cerrar'))
      : botonesMas.find(({ coincide }) => coincide(id))?.boton;
    destino?.focus();
  };

  deshacerBoton.addEventListener('click', deshacerBorrado);

  const cambiar = (id, delta) => {
    const l = pedido.get(id);
    if (!l) return;
    l.cantidad += delta;
    if (l.cantidad < 1) {
      anotarBorrado(id, { ...l, cantidad: 1 });
      pedido.delete(id);
    } else {
      pedido.set(id, l);
    }
    pintar();
  };

  let ultimoFoco = null;
  const abrir = () => {
    ultimoFoco = document.activeElement;
    pintarForma();
    fondo.classList.add('is-open');
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    apagarDetras(panel, true);
    panel.querySelector('.canasta-cerrar').focus();
  };
  const cerrar = () => {
    fondo.classList.remove('is-open');
    panel.classList.remove('is-open');
    document.body.style.overflow = '';
    // Se enciende antes de devolver el foco: a lo apagado no se le puede dar.
    apagarDetras(panel, false);
    // Cerrar a media compra no puede dejar el panel atascado en "procesando":
    // se corta el temporizador y se vuelve siempre a la canasta. Si ya habia
    // comprobante, el pedido esta cumplido y la canasta se vacia.
    if (temporizador) { window.clearTimeout(temporizador); temporizador = 0; }
    restablecerPagar();
    olvidarTarjeta();
    copiado.hidden = true;
    pideCuenta.hidden = true;
    reciboCopiado.hidden = true;
    if (pasoActual === 'comprobante') {
      cobro.numero = '';
      olvidarBorrado();
      pedido.clear();
      // Pedido cumplido: el proximo empieza de cero, tambien en la forma de
      // pago. Cerrar a medio pago si conserva lo elegido, que no se ha gastado.
      metodos.forEach((m) => { m.checked = m.value === 'efectivo'; });
      pintar();
    }
    irA('canasta', false, false);
    ultimoFoco?.focus();
  };
  const abierto = () => panel.classList.contains('is-open');

  fondo.addEventListener('click', cerrar);
  panel.querySelector('.canasta-cerrar').addEventListener('click', cerrar);
  atraparFoco(panel, abierto, cerrar);

  // El boton flotante pasa a ser el acceso al pedido. El contacto general de
  // WhatsApp sigue en la navegacion y en el pie, asi que no se pierde.
  if (boton) {
    boton.removeAttribute('href');
    boton.removeAttribute('target');
    boton.removeAttribute('rel');
    boton.setAttribute('role', 'button');
    boton.setAttribute('tabindex', '0');
    boton.textContent = '';
    boton.classList.add('is-canasta');
    // Canasta de pan: asa de arco, cuerpo ahusado y dos mimbres. Mismo trazo
    // que los iconos del pie, para que no parezca prestado de otro sitio.
    boton.insertAdjacentHTML('beforeend',
      '<svg class="canasta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + '<path d="M7.6 9.4a4.4 4.4 0 0 1 8.8 0"/>'
      + '<path d="M3.6 9.4h16.8l-1.5 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6Z"/>'
      + '<path d="M9.7 12.7l.6 3.5"/><path d="M14.3 12.7l-.6 3.5"/></svg>');
    boton.append(cuenta);
    boton.addEventListener('click', abrir);
    boton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  }

  // Basurero del mismo trazo que el resto de los iconos: tapa, asa, cuerpo que
  // se estrecha y dos costillas.
  const BASURERO = '<svg class="card-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="M4.8 7.1h14.4"/>'
    + '<path d="M9.7 7.1V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.8"/>'
    + '<path d="M6.5 7.1l.8 11.3a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11.3"/>'
    + '<path d="M10.3 10.8v5.8"/><path d="M13.7 10.8v5.8"/></svg>';

  // Sin JavaScript cada "Pedir" sigue siendo un enlace a WhatsApp que funciona.
  // Con JS se cambia por el control de cantidad: mientras no hay nada pedido solo
  // se ve el signo mas, y al usarlo se abre en quitar, la cuenta y sumar.
  document.querySelectorAll('.product-card .order-button').forEach((enlace) => {
    const ficha = enlace.closest('.product-card');
    const nombre = ficha.querySelector('h3')?.textContent.trim();
    const precio = parseFloat((ficha.querySelector('.product-bottom strong')?.textContent || '').replace(/[^0-9.]/g, ''));
    if (!nombre || Number.isNaN(precio)) return;
    // Lo que viene en varios tamanios no tiene un nombre ni un precio fijos: los
    // dicta el que este elegido. Y como el nombre que se guarda lleva el tamanio
    // dentro, cada uno es su propia linea de la canasta sin tocar la canasta.
    const tamanos = [...ficha.querySelectorAll('.tamano-input')];
    const elegido = () => tamanos.find((t) => t.checked) || tamanos[0];
    const nombreDe = () => (tamanos.length ? `${nombre} ${elegido().value}` : nombre);
    const precioDe = () => (tamanos.length ? Number(elegido().dataset.precio) : precio);
    const idDeAhora = () => idDe(nombreDe());
    const importe = ficha.querySelector('.product-bottom strong');

    const grupo = document.createElement('div');
    grupo.className = 'card-cantidad';
    // La cuenta es un campo, no un letrero: para llevarse veinte panes nadie
    // quiere pulsar veinte veces. Sigue siendo texto y no un number porque el
    // de tipo numero trae sus propias flechitas y acepta signos y comas.
    grupo.innerHTML = '<button class="card-menos" type="button" hidden></button>'
      + '<input class="card-numero" type="text" inputmode="numeric" autocomplete="off" '
      + 'maxlength="3" value="0" hidden>'
      + '<button class="card-mas" type="button">+</button>';
    const menos = grupo.querySelector('.card-menos');
    const cuentaFicha = grupo.querySelector('.card-numero');
    const mas = grupo.querySelector('.card-mas');
    const cuantos = () => pedido.get(idDeAhora())?.cantidad || 0;

    const refrescar = () => {
      const n = cuantos();
      grupo.classList.toggle('is-lleno', n > 0);
      menos.hidden = n === 0;
      cuentaFicha.hidden = n === 0;
      // Si lo esta escribiendo ahora mismo, no se le pisa lo tecleado.
      if (document.activeElement !== cuentaFicha) cuentaFicha.value = n;
      // Con una sola unidad, quitarla es borrar el producto del pedido: el boton
      // lo dice con un basurero. Desde dos vuelve a ser un signo de resta.
      menos.innerHTML = n === 1 ? BASURERO : '<span aria-hidden="true">−</span>';
      const comoSeLlama = nombreDe();
      menos.setAttribute('aria-label', n === 1 ? `Quitar ${comoSeLlama} de la canasta` : `Quitar uno de ${comoSeLlama}`);
      menos.dataset.tip = n === 1 ? 'Quitar de la canasta' : 'Uno menos';
      mas.setAttribute('aria-label', n ? `Añadir otro de ${comoSeLlama}` : `Añadir ${comoSeLlama} a la canasta`);
      cuentaFicha.setAttribute('aria-label', `Cantidad de ${comoSeLlama}`);
      mas.dataset.tip = n ? 'Uno más' : 'Añadir a la canasta';
      cuentaFicha.dataset.tip = `Escribe cuántos quieres, hasta ${MAX_UNIDADES}`;
      if (importe) importe.textContent = dinero(precioDe());
    };
    refrescos.push(refrescar);
    botonesMas.push({ coincide: (id) => idDeAhora() === id, boton: mas });
    tamanos.forEach((t) => t.addEventListener('change', () => {
      refrescar();
      avisos.textContent = `${nombreDe()}, ${dinero(precioDe())}.`;
    }));

    const cuantosQuedan = () => `${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
    mas.addEventListener('click', () => {
      const comoSeLlama = nombreDe();
      const l = pedido.get(idDeAhora()) || { nombre: comoSeLlama, precio: precioDe(), cantidad: 0 };
      l.cantidad = Math.min(l.cantidad + 1, MAX_UNIDADES);
      pedido.set(idDeAhora(), l);
      pintar();
      avisos.textContent = `${comoSeLlama} añadido. ${cuantosQuedan()}`;
    });
    // Mientras teclea solo se limpia lo que no son cifras; el numero no se
    // corrige hasta que termina, que corregirlo al vuelo impide escribir un 12
    // (al pasar por el 1 ya seria valido y saltaria solo).
    cuentaFicha.addEventListener('input', () => {
      const limpio = cuentaFicha.value.replace(/[^0-9]/g, '').slice(0, 3);
      if (limpio !== cuentaFicha.value) cuentaFicha.value = limpio;
    });
    cuentaFicha.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); cuentaFicha.blur(); }
      if (e.key === 'Escape') { cuentaFicha.value = cuantos(); cuentaFicha.blur(); }
      // Es un campo de texto y no un number justamente para no heredar sus
      // flechitas, pero las teclas de flecha si se esperan en algo que cuenta:
      // suben y bajan de uno sin tener que borrar y reescribir el numero.
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const ahora = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
      const paso = e.key === 'ArrowUp' ? 1 : -1;
      cuentaFicha.value = Math.max(0, Math.min(ahora + paso, MAX_UNIDADES));
    });
    // Al salir del campo se asienta: se recorta al tope y, si quedo en cero o
    // en blanco, el producto sale de la canasta, que es lo que un cero dice.
    cuentaFicha.addEventListener('blur', () => {
      const comoSeLlama = nombreDe();
      const id = idDeAhora();
      const pedida = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
      const antes = cuantos();
      if (pedida === antes) { cuentaFicha.value = antes; return; }
      if (pedida <= 0) {
        const antesDeBorrar = pedido.get(id);
        if (antesDeBorrar) anotarBorrado(id, antesDeBorrar);
        pedido.delete(id);
        pintar();
        avisos.textContent = `${comoSeLlama} quitado. ${cuantosQuedan()}`;
        mas.focus();
        return;
      }
      const l = pedido.get(id) || { nombre: comoSeLlama, precio: precioDe(), cantidad: 0 };
      const recortado = (parseInt(cuentaFicha.value, 10) || 0) > MAX_UNIDADES;
      l.cantidad = pedida;
      pedido.set(id, l);
      pintar();
      avisos.textContent = recortado
        ? `El máximo es ${MAX_UNIDADES} por producto, así que quedaron ${MAX_UNIDADES} de ${comoSeLlama}. ${cuantosQuedan()}`
        : `${pedida} de ${comoSeLlama}. ${cuantosQuedan()}`;
    });

    menos.addEventListener('click', () => {
      const comoSeLlama = nombreDe();
      const seVa = cuantos() <= 1;
      cambiar(idDeAhora(), -1);
      avisos.textContent = seVa ? `${comoSeLlama} quitado. ${cuantosQuedan()}` : `Una unidad menos de ${comoSeLlama}. ${cuantosQuedan()}`;
      // El boton recien usado desaparece; el foco pasa al mas para no perderse.
      if (seVa) mas.focus();
    });

    enlace.replaceWith(grupo);
  });

  leerGuardado();
  radios.forEach((radio) => { radio.checked = radio.value === entrega.modo; });
  campoDir.value = entrega.direccion;
  pintar();

  // ---- Cuenta ----------------------------------------------------------
  // Maqueta de cuentas. No hay servidor detras, asi que nada de esto viaja a
  // ninguna parte: la cuenta queda escrita en este navegador y en ningun otro
  // sitio. La contrasena se pide, se comprueba y se tira; no se guarda ni aqui
  // ni en el navegador, porque guardarla seria ensenar a hacerlo mal. Por lo
  // mismo, "entrar" no puede comprobar ninguna contrasena: no hay con que
  // compararla, y el panel lo dice en voz alta en vez de fingir que si.
  const CLAVE_CUENTA = 'eltradicional-cuenta';

  const fondoC = document.createElement('div');
  fondoC.className = 'cuenta-fondo';
  const panelC = document.createElement('aside');
  panelC.className = 'cuenta-panel';
  panelC.setAttribute('role', 'dialog');
  panelC.setAttribute('aria-modal', 'true');
  panelC.setAttribute('aria-labelledby', 'cuenta-titulo');

  // opciones: opcional, prefijo (texto fijo pegado al campo), describe (ids que
  // se suman al aria-describedby) y despues (lo que va entre campo y error).
  const campoHtml = (id, etiqueta, extra, opciones = {}) => {
    const describe = (opciones.describe ? opciones.describe + ' ' : '') + `cuenta-${id}-error`;
    const campo = `<input id="cuenta-${id}" ${extra} aria-describedby="${describe}">`;
    return `<div class="cuenta-campo"><label for="cuenta-${id}">${etiqueta}`
      + (opciones.opcional ? ' <span class="cuenta-campo-opcional">(opcional)</span>' : '')
      + '</label>'
      + (opciones.prefijo
        ? `<div class="cuenta-conprefijo"><span class="cuenta-prefijo">${opciones.prefijo}</span>${campo}</div>`
        : campo)
      + (opciones.despues || '')
      + `<p class="cuenta-campo-error" id="cuenta-${id}-error" hidden></p></div>`;
  };

  // Lo que tiene que cumplir la contrasena, escrito una sola vez: de aqui salen
  // la lista que se ve debajo del campo y la comprobacion de si vale.
  const REGLAS = [
    { id: 'largo', texto: 'Al menos 8 caracteres', cumple: (v) => v.length >= 8 },
    { id: 'minuscula', texto: 'Una letra minúscula', cumple: (v) => /[a-zñáéíóúü]/.test(v) },
    { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v) => /[A-ZÑÁÉÍÓÚÜ]/.test(v) },
    { id: 'numero', texto: 'Un número', cumple: (v) => /[0-9]/.test(v) },
  ];
  // El +593 esta fijo delante del campo, asi que el numero va sin el cero de
  // 09... Quien lo escriba de memoria con el cero no se equivoca: se lo come.
  const soloNueve = (v) => v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  const telefonoBonito = (d) => (d ? `+593 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : '');

  const reglasHtml = '<ul class="cuenta-reglas" id="cuenta-clave-reglas">'
    + REGLAS.map((r) => `<li data-regla="${r.id}">${r.texto}`
      + '<span class="sr-only cuenta-regla-estado">, falta</span></li>').join('')
    + '</ul>';

  panelC.innerHTML =
    '<div class="cuenta-cabecera"><h2 id="cuenta-titulo" tabindex="-1">Crear cuenta</h2>'
    + '<button class="cuenta-cerrar" type="button" aria-label="Cerrar">×</button></div>'

    + '<section class="cuenta-paso" data-paso="crear">'
    + '<div class="cuenta-cuerpo">'
    + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Este sitio no tiene '
    + 'servidor: la cuenta se guarda solo en este navegador y la contraseña no se guarda '
    + 'en ninguna parte. No escribas una contraseña de verdad.</p>'
    + campoHtml('nombre', 'Nombre y apellido', 'type="text" autocomplete="name" maxlength="60" placeholder="Ariel Escobar"')
    + campoHtml('correo', 'Correo', 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"')
    + campoHtml('telefono', 'Teléfono', 'type="tel" inputmode="numeric" autocomplete="tel" '
      + 'maxlength="9" placeholder="990001122"', { prefijo: '+593' })
    + campoHtml('direccion', 'Dirección', 'type="text" autocomplete="street-address" maxlength="200" '
      + 'placeholder="Calle, número y una referencia"', { opcional: true })
    + campoHtml('clave', 'Contraseña', 'type="password" autocomplete="new-password" maxlength="40"',
      { describe: 'cuenta-clave-reglas', despues: reglasHtml })
    + campoHtml('repite', 'Repite la contraseña', 'type="password" autocomplete="new-password" maxlength="40"')
    + '</div>'
    + '<div class="cuenta-pie">'
    + '<p class="cuenta-aviso" role="alert" hidden></p>'
    + '<button class="button button-yellow cuenta-crear" type="button">Crear la cuenta</button>'
    + '<button class="cuenta-cambiar" type="button" data-va="entrar">Ya tengo cuenta, quiero entrar</button>'
    + '</div></section>'

    + '<section class="cuenta-paso" data-paso="verificar" hidden>'
    + '<div class="cuenta-cuerpo">'
    + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> No hay servidor que '
    + 'mande mensajes, así que el código no sale de este navegador: se muestra aquí '
    + 'abajo, en el recuadro que imita la notificación del teléfono.</p>'
    + '<p class="codigo-dicho">Escribe el código de 6 cifras que enviamos al '
    + '<strong class="codigo-numero"></strong>.</p>'
    + '<div class="codigo-falso">'
    + '<p class="codigo-falso-de">Mensaje de El Tradicional</p>'
    + '<p class="codigo-falso-texto">Tu código es <b class="codigo-valor"></b>. '
    + 'No lo compartas con nadie.</p></div>'
    + '<div class="cuenta-campo"><label for="cuenta-codigo">Código de verificación</label>'
    + '<input id="cuenta-codigo" class="campo-codigo" type="text" inputmode="numeric" '
    + 'autocomplete="one-time-code" maxlength="6" placeholder="000000" '
    + 'aria-describedby="cuenta-codigo-error">'
    + '<p class="cuenta-campo-error" id="cuenta-codigo-error" hidden></p></div>'
    + '<button class="codigo-reenviar" type="button">Enviar otro código</button>'
    + '</div>'
    + '<div class="cuenta-pie">'
    + '<p class="cuenta-aviso" role="alert" hidden></p>'
    + '<button class="button button-yellow cuenta-verificar" type="button">Verificar el teléfono</button>'
    + '<button class="cuenta-cambiar" type="button" data-va="crear">Cambiar el número</button>'
    + '</div></section>'

    + '<section class="cuenta-paso" data-paso="entrar" hidden>'
    + '<div class="cuenta-cuerpo">'
    + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Sin servidor no hay '
    + 'contraseña que comprobar, así que no se pide: basta el correo de la cuenta que '
    + 'creaste en este navegador. Pedirla para luego tirarla sería fingir.</p>'
    + campoHtml('entrar-correo', 'Correo', 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"')
    + '</div>'
    + '<div class="cuenta-pie">'
    + '<p class="cuenta-aviso" role="alert" hidden></p>'
    + '<button class="button button-yellow cuenta-entrar" type="button">Entrar</button>'
    + '<button class="cuenta-cambiar" type="button" data-va="crear">No tengo cuenta, quiero crear una</button>'
    + '</div></section>'

    + '<section class="cuenta-paso" data-paso="sesion" hidden>'
    + '<div class="cuenta-cuerpo">'
    + '<div class="cuenta-sesion"><span class="cuenta-avatar" aria-hidden="true"></span>'
    + '<div><p class="cuenta-sesion-nombre"></p><p class="cuenta-sesion-correo"></p></div></div>'
    + '<dl class="cuenta-datos">'
    + '<div><dt>Teléfono</dt><dd class="cuenta-dato-telefono"></dd></div>'
    + '<div><dt>Dirección</dt><dd class="cuenta-dato-direccion"></dd></div>'
    + '</dl>'
    + '<p class="cuenta-nota">Tu pedido ya sale a tu nombre y con tu dirección escrita.</p>'
    + '</div>'
    + '<div class="cuenta-pie">'
    + '<button class="cuenta-salir" type="button">Salir de la cuenta</button>'
    + '<p class="cuenta-nota">Salir solo borra la cuenta de este navegador. '
    + 'No hay ningún otro lugar donde estuviera guardada.</p>'
    + '</div></section>';
  document.body.append(fondoC, panelC);

  // La entrada vive en la navegacion y se crea desde aqui: sin JavaScript no
  // habria panel que abrir, asi que tampoco tiene que haber boton.
  const PERSONA = '<svg class="nav-cuenta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<circle cx="12" cy="8.2" r="3.6"/>'
    + '<path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/></svg>';
  const navCuenta = document.createElement('button');
  navCuenta.type = 'button';
  navCuenta.className = 'nav-cuenta';
  // Va en el grupo de acciones, no dentro de la navegacion: asi puede quedarse
  // a la derecha mientras los enlaces se centran, y en el telefono se ve
  // siempre, sin tener que abrir el menu.
  document.querySelector('.nav-acciones')?.prepend(navCuenta);

  const tituloC = panelC.querySelector('#cuenta-titulo');
  const pasosC = [...panelC.querySelectorAll('.cuenta-paso')];
  const avisoCrear = panelC.querySelector('[data-paso="crear"] .cuenta-aviso');
  const avisoEntrar = panelC.querySelector('[data-paso="entrar"] .cuenta-aviso');
  const campoCodigo = panelC.querySelector('#cuenta-codigo');
  const errorCodigo = panelC.querySelector('#cuenta-codigo-error');
  const avisoVerificar = panelC.querySelector('[data-paso="verificar"] .cuenta-aviso');
  const codigoNumero = panelC.querySelector('.codigo-numero');
  const codigoValor = panelC.querySelector('.codigo-valor');
  const codigoReenviar = panelC.querySelector('.codigo-reenviar');
  const correoEntrar = panelC.querySelector('#cuenta-entrar-correo');
  // En "entrar" ya no hay campo de contrasena: ver el parrafo de la maqueta.
  const errorEntrarCorreo = panelC.querySelector('#cuenta-entrar-correo-error');

  const TITULOS_CUENTA = { crear: 'Crear cuenta', verificar: 'Verificar tu teléfono',
    entrar: 'Entrar', sesion: 'Tu cuenta' };

  // El numero con el prefijo delante, tal como lo veria quien lo marca.
  // Sin servidor el codigo no viaja a ninguna parte: nace aqui y se ensena en
  // el recuadro que imita la notificacion, declarado como simulacion. Es la
  // misma honestidad que ya se usa con el cobro.
  let codigoEsperado = '';
  let relojReenvio = 0;
  const REENVIO = 45;

  const nuevoCodigo = () => {
    codigoEsperado = String(Math.floor(100000 + Math.random() * 900000));
    if (codigoValor) codigoValor.textContent = codigoEsperado;
    if (codigoNumero) codigoNumero.textContent = telefonoLargo(datos.telefono || sesion.telefono);
  };

  // La espera para reenviar: sin ella, pulsar "Enviar otro codigo" en bucle no
  // tendria coste, y en un sistema de verdad cada mensaje cuesta dinero.
  const cuentaAtras = () => {
    window.clearInterval(relojReenvio);
    let quedan = REENVIO;
    const pintar = () => {
      if (quedan <= 0) {
        window.clearInterval(relojReenvio);
        relojReenvio = 0;
        codigoReenviar.disabled = false;
        codigoReenviar.textContent = 'Enviar otro código';
        return;
      }
      codigoReenviar.disabled = true;
      codigoReenviar.textContent = `Enviar otro código en ${quedan}s`;
      quedan -= 1;
    };
    pintar();
    relojReenvio = window.setInterval(pintar, 1000);
  };

  const pararCuentaAtras = () => {
    window.clearInterval(relojReenvio);
    relojReenvio = 0;
    if (codigoReenviar) {
      codigoReenviar.disabled = false;
      codigoReenviar.textContent = 'Enviar otro código';
    }
  };
  const verPaso = (nombre) => {
    pasosC.forEach((paso) => { paso.hidden = paso.dataset.paso !== nombre; });
    tituloC.textContent = TITULOS_CUENTA[nombre];
  };

  // Mismo trato que en la tarjeta: un campo solo se marca cuando ya lo tocaste
  // o cuando ya intentaste enviar. Avisar antes de escribir nada no ayuda.
  const datos = { nombre: '', correo: '', telefono: '', direccion: '', clave: '', repite: '' };
  // Cada campo elige cuando se le puede reganar. El correo y el telefono, al
  // salir de ellos: corregir a alguien el correo en la tercera letra no ayuda.
  // La contrasena no se marca nunca en rojo mientras escribes, porque la lista
  // de abajo ya va diciendo lo que falta; solo al intentar crear la cuenta.
  const campos = [
    { clave: 'nombre' },
    { clave: 'correo' },
    { clave: 'telefono' },
    { clave: 'direccion' },
    { clave: 'clave', soloAlIntentar: true },
    { clave: 'repite' },
  ].map((campo) => Object.assign(campo, {
    input: panelC.querySelector(`#cuenta-${campo.clave}`),
    error: panelC.querySelector(`#cuenta-${campo.clave}-error`),
  }));
  const tocadosC = new Set();
  let intentadoC = false;

  const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // El correo no se despacha con un "algo esta mal": se dice que le falta.
  const fallaCorreo = (v) => {
    if (!v) return 'Escribe tu correo.';
    if (!v.includes('@')) return 'Le falta el @.';
    if (!/\.[a-z]{2,}$/i.test(v)) return 'Le falta el final, como .com o .ec.';
    if (!CORREO.test(v)) return 'Revisa el correo, algo no cuadra.';
    return '';
  };
  const fallosCuenta = () => {
    const f = {};
    if (datos.nombre.length < 3) f.nombre = 'Escribe tu nombre.';
    else if (!datos.nombre.includes(' ')) f.nombre = 'Falta el apellido.';
    const correo = fallaCorreo(datos.correo);
    if (correo) f.correo = correo;
    // Tras el +593 el numero va sin el cero: los celulares de aqui son 09...,
    // asi que quedan nueve cifras que empiezan en 9.
    if (!datos.telefono) f.telefono = 'Escribe tu número.';
    else if (!/^9\d{8}$/.test(datos.telefono)) f.telefono = 'Son 9 números después del +593, empezando por 9.';
    if (REGLAS.some((r) => !r.cumple(datos.clave))) f.clave = 'A la contraseña le falta algo de la lista.';
    if (datos.repite !== datos.clave) f.repite = 'Las dos no son iguales.';
    return f;
  };

  // La lista de obligaciones se repinta en cada tecla: es la unica parte del
  // formulario que contesta mientras escribes, y por eso no hay que adivinar.
  const pintarReglas = () => {
    REGLAS.forEach((r) => {
      const fila = panelC.querySelector(`[data-regla="${r.id}"]`);
      const hecha = r.cumple(datos.clave);
      fila.classList.toggle('is-hecha', hecha);
      fila.querySelector('.cuenta-regla-estado').textContent = hecha ? ', cumplido' : ', falta';
    });
  };
  const pintarCampos = () => {
    const fallos = fallosCuenta();
    pintarReglas();
    campos.forEach(({ clave, input, error, soloAlIntentar }) => {
      const momento = soloAlIntentar ? intentadoC : (intentadoC || tocadosC.has(clave));
      const texto = momento ? fallos[clave] : '';
      error.hidden = !texto;
      error.textContent = texto || '';
      input.setAttribute('aria-invalid', texto ? 'true' : 'false');
      input.classList.toggle('is-mal', Boolean(texto));
    });
    return fallos;
  };
  campos.forEach(({ clave, input }) => {
    input.addEventListener('input', () => {
      // El telefono solo admite cifras. El 0 de 09... se lo come el +593, asi
      // que escribir el numero de memoria tambien funciona.
      if (clave === 'telefono') input.value = soloNueve(input.value);
      datos[clave] = (clave === 'clave' || clave === 'repite') ? input.value : input.value.trim();
      pintarCampos();
    });
    input.addEventListener('blur', () => { tocadosC.add(clave); pintarCampos(); });
  });

  // Las contrasenas no se quedan escritas al cerrar: ni en el campo ni en la
  // variable. Es lo unico de aqui que no debe sobrevivir al panel.
  const olvidarFormulario = () => {
    campos.forEach(({ clave, input }) => { datos[clave] = ''; input.value = ''; });
    tocadosC.clear();
    intentadoC = false;
    pintarCampos();
    avisoCrear.hidden = true;
    avisoEntrar.hidden = true;
    correoEntrar.value = '';
    errorEntrarCorreo.hidden = true;
    correoEntrar.classList.remove('is-mal');
  };

  const guardarCuenta = () => {
    try {
      // Solo lo que hace falta para el pedido. La contrasena no entra aqui.
      window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
        nombre: sesion.nombre, correo: sesion.correo,
        telefono: sesion.telefono, direccion: sesion.direccion,
        verificado: sesion.verificado,
      }));
    } catch (e) { /* en ventana privada no se puede guardar; la sesion sigue viva en memoria */ }
  };
  const correoGuardado = () => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_CUENTA);
      return crudo ? String(JSON.parse(crudo).correo || '') : '';
    } catch (e) { return ''; }
  };
  const leerCuenta = () => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_CUENTA);
      if (!crudo) return;
      const dato = JSON.parse(crudo);
      if (!dato || !dato.nombre || typeof dato.correo !== 'string') return;
      sesion.nombre = String(dato.nombre).slice(0, 60);
      sesion.correo = String(dato.correo).slice(0, 80);
      sesion.telefono = soloNueve(String(dato.telefono || ''));
      sesion.direccion = String(dato.direccion || '').slice(0, 200);
      sesion.verificado = dato.verificado === true;
      sesion.dentro = true;
    } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza fuera */ }
  };

  const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((parte) => parte[0].toUpperCase()).join('');

  // El boton de la cuenta no lleva texto: fuera de sesion es la silueta, y dentro
  // son tus iniciales, que hacen de icono. Sin rotulo a la vista, el nombre va en
  // aria-label para quien usa lector de pantalla y en title para quien usa raton;
  // si no, seria un circulo sin explicacion para todos.
  const nombrarBoton = (texto) => {
    navCuenta.setAttribute('aria-label', texto);
    navCuenta.setAttribute('title', texto);
  };

  const pintarSesion = () => {
    if (!sesion.dentro) {
      navCuenta.classList.remove('is-dentro');
      navCuenta.innerHTML = PERSONA;
      nombrarBoton('Entrar o crear una cuenta');
      return;
    }
    navCuenta.classList.add('is-dentro');
    // El nombre lo escribe quien usa el sitio, asi que entra como texto y no como
    // HTML: con innerHTML, un nombre con etiquetas dentro se ejecutaria.
    navCuenta.textContent = '';
    const marca = document.createElement('span');
    marca.className = 'nav-cuenta-iniciales';
    marca.setAttribute('aria-hidden', 'true');
    marca.textContent = iniciales(sesion.nombre);
    navCuenta.append(marca);
    nombrarBoton(`Tu cuenta, ${sesion.nombre}`);
    panelC.querySelector('.cuenta-avatar').textContent = iniciales(sesion.nombre);
    panelC.querySelector('.cuenta-sesion-nombre').textContent = sesion.nombre;
    panelC.querySelector('.cuenta-sesion-correo').textContent = sesion.correo;
    panelC.querySelector('.cuenta-dato-telefono').textContent = telefonoBonito(sesion.telefono) || '—';
    panelC.querySelector('.cuenta-dato-direccion').textContent = sesion.direccion || 'Sin dirección guardada';
  };

  // Tener cuenta sirve para no volver a escribir lo mismo: la direccion pasa a la
  // canasta, pero solo si esta vacia. Lo que ya escribiste manda sobre la cuenta.
  const prellenarPedido = () => {
    if (!sesion.dentro || !sesion.direccion || entrega.direccion) return;
    entrega.direccion = sesion.direccion;
    campoDir.value = sesion.direccion;
    pintarPie();
  };

  let ultimoFocoC = null;
  const abiertoC = () => panelC.classList.contains('is-open');
  const abrirC = (paso) => {
    ultimoFocoC = document.activeElement;
    // Con sesion abierta se entra a la ficha; sin ella, al paso que se pidio.
    verPaso(sesion.dentro ? 'sesion' : (paso || 'entrar'));
    fondoC.classList.add('is-open');
    panelC.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    apagarDetras(panelC, true);
    tituloC.focus();
  };
  const cerrarC = () => {
    menuCuenta?.classList.remove('is-open');
    navCuenta.setAttribute('aria-expanded', 'false');
    fondoC.classList.remove('is-open');
    panelC.classList.remove('is-open');
    document.body.style.overflow = '';
    // Igual que en la canasta: primero se enciende, despues se devuelve el foco.
    apagarDetras(panelC, false);
    olvidarFormulario();
    // En el telefono el menu se cerro al abrir el panel, asi que el boton al que
    // habria que volver esta escondido: el foco va al de abrir el menu, que si se ve.
    if (ultimoFocoC && ultimoFocoC.offsetParent === null) menuToggle?.focus();
    else ultimoFocoC?.focus();
  };

  // Pulsar el circulo no lanza al formulario de crear cuenta: despliega las dos
  // puertas, entrar o registrarse, y cada una abre su paso. Estando dentro no
  // hay nada que elegir, asi que va directo a la ficha de la sesion.
  const menuCuenta = document.createElement('div');
  menuCuenta.className = 'cuenta-menu';
  menuCuenta.id = 'cuenta-menu';
  menuCuenta.innerHTML = '<button type="button" data-va="entrar">Iniciar sesión</button>'
    + '<button type="button" data-va="crear">Registrarse</button>';
  navCuenta.insertAdjacentElement('afterend', menuCuenta);

  const abrirMenuCuenta = (abierto) => {
    menuCuenta.classList.toggle('is-open', abierto);
    navCuenta.setAttribute('aria-expanded', String(abierto));
  };
  navCuenta.setAttribute('aria-expanded', 'false');
  navCuenta.setAttribute('aria-haspopup', 'true');
  navCuenta.setAttribute('aria-controls', menuCuenta.id);
  navCuenta.dataset.tip = 'Tu cuenta';
  // Las dos puertas se recorren con las flechas, como el desplegable de Tienda.
  flechasEnMenu(navCuenta, menuCuenta, abrirMenuCuenta,
    () => menuCuenta.classList.contains('is-open'));

  navCuenta.addEventListener('click', () => {
    closeMenu();
    if (sesion.dentro) { abrirC(); return; }
    abrirMenuCuenta(!menuCuenta.classList.contains('is-open'));
  });
  menuCuenta.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    abrirMenuCuenta(false);
    abrirC(b.dataset.va);
  }));
  const fueraDeCuenta = (destino) => !navCuenta.contains(destino) && !menuCuenta.contains(destino);
  document.addEventListener('click', (e) => {
    if (!fueraDeCuenta(e.target)) return;
    abrirMenuCuenta(false);
  });
  // Tabular fuera lo cierra: dejarlo desplegado detras del foco es ensenar un
  // menu que ya no responde a nada.
  document.addEventListener('focusin', (e) => {
    if (!fueraDeCuenta(e.target)) return;
    abrirMenuCuenta(false);
  });
  // Escape lo cierra desde donde sea y devuelve el foco al circulo, que si no
  // se queda colgando en un boton que acaba de desaparecer.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !menuCuenta.classList.contains('is-open')) return;
    abrirMenuCuenta(false);
    navCuenta.focus();
  });
  fondoC.addEventListener('click', cerrarC);
  panelC.querySelector('.cuenta-cerrar').addEventListener('click', cerrarC);
  atraparFoco(panelC, abiertoC, cerrarC);

  panelC.querySelectorAll('.cuenta-cambiar').forEach((boton) => {
    boton.addEventListener('click', () => {
      avisoCrear.hidden = true;
      avisoEntrar.hidden = true;
      verPaso(boton.dataset.va);
      tituloC.focus();
    });
  });

  // Entrar en la sesion es lo mismo se venga de crear la cuenta o de reconocerla.
  const entrarEnSesion = (aviso) => {
    guardarCuenta();
    pintarSesion();
    prellenarPedido();
    olvidarFormulario();
    verPaso('sesion');
    tituloC.focus();
    avisos.textContent = aviso;
  };

  panelC.querySelector('.cuenta-crear').addEventListener('click', () => {
    intentadoC = true;
    const fallos = pintarCampos();
    const malos = Object.keys(fallos);
    if (malos.length) {
      avisoCrear.hidden = false;
      avisoCrear.textContent = malos.length === 1
        ? 'Falta corregir un campo.'
        : `Faltan ${malos.length} campos por corregir.`;
      campos.find(({ clave }) => clave === malos[0])?.input.focus();
      return;
    }
    sesion.nombre = datos.nombre;
    sesion.correo = datos.correo;
    sesion.telefono = datos.telefono;
    sesion.direccion = datos.direccion;
    // La cuenta todavia no esta dentro: falta probar que el telefono es suyo.
    // Si entrara aqui, el numero podria ser inventado y el comprobante no
    // llegaria a ninguna parte.
    sesion.verificado = false;
    irAVerificar();
  });

  // --- Verificar el telefono ---------------------------------------------
  const irAVerificar = () => {
    nuevoCodigo();
    campoCodigo.value = '';
    errorCodigo.hidden = true;
    campoCodigo.classList.remove('is-mal');
    avisoVerificar.hidden = true;
    verPaso('verificar');
    cuentaAtras();
    tituloC.focus();
    avisos.textContent = `Te enviamos un código al ${telefonoLargo(sesion.telefono || datos.telefono)}.`;
  };

  const marcarCodigo = (texto) => {
    errorCodigo.hidden = !texto;
    errorCodigo.textContent = texto;
    campoCodigo.classList.toggle('is-mal', Boolean(texto));
  };

  // Mientras escribe solo se limpia lo que no son cifras. El codigo no se
  // comprueba al vuelo: nadie quiere que le digan que va mal a la tercera.
  campoCodigo.addEventListener('input', () => {
    const limpio = campoCodigo.value.replace(/[^0-9]/g, '').slice(0, 6);
    if (limpio !== campoCodigo.value) campoCodigo.value = limpio;
    if (!errorCodigo.hidden) marcarCodigo('');
  });

  const comprobarCodigo = () => {
    const escrito = campoCodigo.value.trim();
    if (escrito.length !== 6) {
      marcarCodigo('El código tiene 6 cifras.');
      campoCodigo.focus();
      return;
    }
    if (escrito !== codigoEsperado) {
      marcarCodigo('Ese código no es el que enviamos. Míralo otra vez.');
      campoCodigo.focus();
      return;
    }
    marcarCodigo('');
    pararCuentaAtras();
    codigoEsperado = '';
    sesion.verificado = true;
    sesion.dentro = true;
    entrarEnSesion(`Teléfono verificado. Entraste como ${sesion.nombre}.`);
  };

  panelC.querySelector('.cuenta-verificar').addEventListener('click', comprobarCodigo);
  campoCodigo.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    comprobarCodigo();
  });

  codigoReenviar.addEventListener('click', () => {
    nuevoCodigo();
    campoCodigo.value = '';
    marcarCodigo('');
    cuentaAtras();
    campoCodigo.focus();
    avisos.textContent = 'Te enviamos un código nuevo.';
  });

  panelC.querySelector('.cuenta-entrar').addEventListener('click', () => {
    const escrito = correoEntrar.value.trim();
    const marcar = (texto) => {
      errorEntrarCorreo.hidden = !texto;
      errorEntrarCorreo.textContent = texto || '';
      correoEntrar.setAttribute('aria-invalid', texto ? 'true' : 'false');
      correoEntrar.classList.toggle('is-mal', Boolean(texto));
    };
    if (!CORREO.test(escrito)) { marcar('Revisa el correo, algo le falta.'); correoEntrar.focus(); return; }
    marcar('');
    // Sin servidor solo se puede reconocer la cuenta de este navegador. Decirlo
    // asi es mas honrado que inventar un "correo o contrasena incorrectos".
    const guardado = correoGuardado();
    if (!guardado) {
      avisoEntrar.hidden = false;
      avisoEntrar.textContent = 'En este navegador no hay ninguna cuenta creada todavía.';
      return;
    }
    if (guardado.toLowerCase() !== escrito.toLowerCase()) {
      avisoEntrar.hidden = false;
      avisoEntrar.textContent = `Ese correo no es el de la cuenta de este navegador (${guardado}).`;
      return;
    }
    leerCuenta();
    // Una cuenta de antes de la verificacion entra igual, pero pasa por el
    // codigo: el pedido se confirma al telefono y hay que saber que es suyo.
    if (!sesion.verificado) { sesion.dentro = false; irAVerificar(); return; }
    entrarEnSesion(`Entraste como ${sesion.nombre}.`);
  });

  panelC.querySelector('.cuenta-salir').addEventListener('click', () => {
    const nombre = sesion.nombre;
    sesion.nombre = '';
    sesion.correo = '';
    sesion.telefono = '';
    sesion.direccion = '';
    sesion.dentro = false;
    sesion.verificado = false;
    try { window.localStorage.removeItem(CLAVE_CUENTA); } catch (e) { /* no habia nada guardado */ }
    pintarSesion();
    verPaso('entrar');
    tituloC.focus();
    avisos.textContent = `Saliste de la cuenta de ${nombre}.`;
  });

  leerCuenta();
  pintarSesion();
  prellenarPedido();

  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60000);
})();
