(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');

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
    closeMenu(true);
    if (tiendaAbierta) grupoBoton?.focus();
  });

  if (grupo && grupoBoton) {
    grupoBoton.addEventListener('click', () => abrirGrupo(!grupo.classList.contains('is-open')));
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      grupo.addEventListener('mouseenter', () => abrirGrupo(true));
      grupo.addEventListener('mouseleave', () => abrirGrupo(false));
    }
    // Si el clic o el foco se van a otra parte, el desplegable ya no pinta nada.
    document.addEventListener('click', (event) => {
      if (!grupo.contains(event.target)) abrirGrupo(false);
    });
    document.addEventListener('focusin', (event) => {
      if (!grupo.contains(event.target)) abrirGrupo(false);
    });
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth > 680) closeMenu();
  });

  const filters = [...document.querySelectorAll('.filter-input')];
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

  let filterRun = 0;
  const applyFilter = (shouldAnimate = false) => {
    const selected = filters.find((filter) => filter.checked);
    const category = selected?.id.replace('filter-', '') || 'todos';
    const animate = shouldAnimate && !reducedMotion.matches;
    const columns = columnCount(productGrid);
    const entering = [];
    let visibleCount = 0;
    let agotados = 0;

    productGrid?.classList.remove('is-filtering');
    products.forEach((product) => {
      const visible = category === 'todos' || product.dataset.category === category;
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

    if (catalogStatus) {
      const plural = visibleCount === 1 ? '' : 's';
      // Llamar "disponible" a lo que esta agotado seria mentira: cuando falta algo,
      // el aviso cuenta cuantos hay y cuantos se acabaron.
      catalogStatus.textContent = agotados
        ? `${visibleCount} producto${plural} en esta categoría, ${agotados} agotado${agotados === 1 ? '' : 's'}.`
        : `${visibleCount} producto${plural} disponible${plural} en esta categoría.`;
    }
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
  filters.forEach((filter) => filter.addEventListener('change', () => {
    if (reducedMotion.matches) {
      applyFilter(false);
      return;
    }
    productGrid?.classList.add('is-filtering');
    window.setTimeout(() => applyFilter(true), 160);
  }));
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
    ['.product-card', 'reveal'],
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
  document.querySelectorAll('.product-grid').forEach((grid) => grid.classList.add('reveal-stagger'));
  const revealColumns = columnCount(productGrid);
  products.forEach((product, index) => product.style.setProperty('--reveal-delay', `${diagonalDelay(index, revealColumns, 40, 320)}ms`));

  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    // La amplitud acompaña al peso tipográfico: el titular recorre más que el eyebrow.
    const riseByIndex = [8, 6, 16, 10, 8];
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
    const location = document.querySelector('.footer-visita');
    const label = location?.querySelector('.open-label');
    if (!location || !label) return;
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
    location.querySelectorAll('dl div[data-dias]').forEach((fila) => {
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
  };

  // Mientras un panel esta abierto el foco no puede escaparse a la pagina de
  // detras, y Escape lo cierra. Lo mismo hace falta en la canasta y en la cuenta,
  // asi que vive una sola vez aqui.
  const atraparFoco = (panel, abierto, cerrar) => {
    document.addEventListener('keydown', (e) => {
      if (!abierto()) return;
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return;
      const focos = [...panel.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => el.offsetParent !== null && !el.disabled && el.getAttribute('aria-disabled') !== 'true');
      if (!focos.length) return;
      const primero = focos[0], ultimo = focos[focos.length - 1];
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
  const entrega = { modo: 'retiro', direccion: '' };
  // La cuenta es una maqueta sin servidor; se rellena en la seccion de mas abajo.
  const sesion = { nombre: '', correo: '', telefono: '', direccion: '', dentro: false };
  // Los datos de la tarjeta viven aqui y solo aqui: no se guardan ni se envian
  // a ningun lado, y se borran al salir del paso de pago.
  const tarjeta = { numero: '', vence: '', cvv: '', titular: '' };
  const cobro = { metodo: 'efectivo', numero: '', detalle: '' };

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
        if (l && l.id && l.nombre && l.cantidad > 0) pedido.set(l.id, { nombre: l.nombre, precio: Number(l.precio) || 0, cantidad: Math.min(l.cantidad, 99) });
      });
      if (!Array.isArray(dato)) {
        if (dato.modo === 'domicilio') entrega.modo = 'domicilio';
        if (typeof dato.direccion === 'string') entrega.direccion = dato.direccion.slice(0, 200);
      }
    } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza vacio */ }
  };
  const guardar = () => {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify({
        lineas: [...pedido].map(([id, l]) => ({ id, ...l })),
        modo: entrega.modo,
        direccion: entrega.direccion,
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
    + '<fieldset class="canasta-entrega"><legend>¿Cómo lo quieres?</legend>'
    + '<div class="canasta-opciones">'
    + '<label><input type="radio" name="canasta-entrega" value="retiro" checked>'
    + '<span>Paso retirando</span></label>'
    + '<label><input type="radio" name="canasta-entrega" value="domicilio">'
    + '<span>A domicilio</span></label></div>'
    + '<div class="canasta-direccion" hidden>'
    + '<label for="canasta-dir">¿A dónde lo llevamos?</label>'
    + '<input id="canasta-dir" type="text" autocomplete="street-address" '
    + 'placeholder="Calle, número y una referencia">'
    + '<p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p>'
    + '</div></fieldset>'
    + '<div class="canasta-total"><span>Total</span><strong>$0.00</strong></div>'
    + '<button class="button button-yellow canasta-enviar" type="button">'
    + 'Confirmar el pedido <span aria-hidden="true">→</span></button>'
    + '<p class="canasta-nota">En el siguiente paso eliges cómo pagar.</p>'
    + '</div></section>'

    + '<section class="canasta-paso" data-paso="pago" hidden>'
    + '<div class="canasta-cuerpo">'
    + '<button class="canasta-volver" type="button"><span aria-hidden="true">←</span> Volver a la canasta</button>'
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
    + '<div><dt>Número de pedido</dt><dd><span class="recibo-numero">ET-0000</span></dd></div>'
    + '<div><dt>Total</dt><dd class="recibo-total">$0.00</dd></div>'
    + '<div><dt>Pago</dt><dd class="recibo-metodo"></dd></div>'
    + '<div><dt>Entrega</dt><dd class="recibo-modo"></dd></div>'
    + '<div class="recibo-linea-dir" hidden><dt>Dirección</dt><dd class="recibo-direccion"></dd></div>'
    + '</dl>'
    + '<h3 class="recibo-titulo">Lo que pediste</h3><ul class="recibo-lista"></ul></div>'
    + '<div class="canasta-pie">'
    + '<a class="button button-yellow canasta-avisar" href="#" target="_blank" rel="noopener">'
    + 'Avisar a la panadería por WhatsApp <span aria-hidden="true">↗</span></a>'
    + '<button class="canasta-listo" type="button">Cerrar</button>'
    + '<p class="canasta-nota">Al avisar por WhatsApp confirmamos la hora y el pago de verdad.</p>'
    + '</div></section>'

    + '</div>';
  const avisos = document.createElement('p');
  avisos.className = 'sr-only';
  avisos.setAttribute('role', 'status');
  avisos.setAttribute('aria-live', 'polite');
  document.body.append(fondo, panel, avisos);

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
  const bloqueEntrega = panel.querySelector('[data-paso="canasta"] .canasta-entrega');
  const metodos = [...panel.querySelectorAll('input[name="canasta-metodo"]')];
  const detalles = [...panel.querySelectorAll('.pago-detalle')];
  const pagoTotal = panel.querySelector('.pago-total strong');
  const pagoModalidad = panel.querySelector('.pago-modalidad');
  const pagoEfectivo = panel.querySelector('.pago-efectivo');
  const pagar = panel.querySelector('.canasta-pagar');
  const errorPago = panel.querySelector('.pago-error');
  const volver = panel.querySelector('.canasta-volver');
  const copiar = panel.querySelector('.pago-copiar');
  const copiado = panel.querySelector('.pago-copiado');
  const avisar = panel.querySelector('.canasta-avisar');
  const listo = panel.querySelector('.canasta-listo');

  const total = () => [...pedido.values()].reduce((s, l) => s + l.precio * l.cantidad, 0);
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
    return `${cabecera}\n${lineas.join('\n')}\n\nTotal: ${dinero(total())}\n${comoLoQuiere}${quien}${pago}`;
  };

  const boton = document.querySelector('.floating-whatsapp');
  const cuenta = document.createElement('span');
  cuenta.className = 'canasta-cuenta';
  cuenta.hidden = true;
  // Cada ficha del catalogo deja aqui su manera de repintarse: lo que cambia en
  // el panel (o al restaurar el pedido guardado) tiene que verse en el catalogo.
  const refrescos = [];

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

  const pintarPie = () => {
    const hayAlgo = pedido.size > 0;
    vacio.hidden = hayAlgo;
    bloqueEntrega.hidden = !hayAlgo;
    bloqueDir.hidden = entrega.modo !== 'domicilio';
    totalEl.textContent = dinero(total());
    // El boton nombra lo que va a pasar, no el canal por el que pasa.
    enviar.innerHTML = (entrega.modo === 'domicilio' ? 'Confirmar el pedido a domicilio' : 'Confirmar el pedido para retirar')
      + ' <span aria-hidden="true">→</span>';
    enviar.disabled = !hayAlgo;
    enviar.setAttribute('aria-disabled', String(!hayAlgo));
    const n = unidades();
    cuenta.hidden = n === 0;
    cuenta.textContent = n;
    if (boton) boton.setAttribute('aria-label', n ? `Ver la canasta, ${n} producto${n === 1 ? '' : 's'}` : 'Ver la canasta, vacía');
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
    avisar.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje())}`;
  };

  const TITULOS = { canasta: 'Tu canasta', pago: 'Pago del pedido', comprobante: 'Pedido confirmado' };
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

  volver.addEventListener('click', () => irA('canasta'));
  listo.addEventListener('click', () => cerrar());

  // Elegir retiro o domicilio: lo unico que cambia es el pie.
  radios.forEach((radio) => radio.addEventListener('change', () => {
    if (!radio.checked) return;
    entrega.modo = radio.value === 'domicilio' ? 'domicilio' : 'retiro';
    avisoDir.hidden = true;
    pintarPie();
    if (entrega.modo === 'domicilio') campoDir.focus();
  }));

  campoDir.addEventListener('input', () => {
    entrega.direccion = campoDir.value.trim().slice(0, 200);
    if (entrega.direccion) avisoDir.hidden = true;
    pintarPie();
  });

  // Sin direccion no se puede llevar nada: en vez de pasar al pago, se avisa y
  // se lleva el foco al campo que falta.
  enviar.addEventListener('click', () => {
    if (!pedido.size) return;
    if (entrega.modo === 'domicilio' && !entrega.direccion) {
      avisoDir.hidden = false;
      campoDir.focus();
      return;
    }
    pintarPago();
    irA('pago');
  });

  const cambiar = (id, delta) => {
    const l = pedido.get(id);
    if (!l) return;
    l.cantidad += delta;
    if (l.cantidad < 1) pedido.delete(id); else pedido.set(id, l);
    pintar();
  };

  let ultimoFoco = null;
  const abrir = () => {
    ultimoFoco = document.activeElement;
    pintarForma();
    fondo.classList.add('is-open');
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.canasta-cerrar').focus();
  };
  const cerrar = () => {
    fondo.classList.remove('is-open');
    panel.classList.remove('is-open');
    document.body.style.overflow = '';
    // Cerrar a media compra no puede dejar el panel atascado en "procesando":
    // se corta el temporizador y se vuelve siempre a la canasta. Si ya habia
    // comprobante, el pedido esta cumplido y la canasta se vacia.
    if (temporizador) { window.clearTimeout(temporizador); temporizador = 0; }
    restablecerPagar();
    olvidarTarjeta();
    copiado.hidden = true;
    if (pasoActual === 'comprobante') {
      cobro.numero = '';
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
    const id = idDe(nombre);

    const grupo = document.createElement('div');
    grupo.className = 'card-cantidad';
    grupo.innerHTML = '<button class="card-menos" type="button" hidden></button>'
      + '<output hidden></output>'
      + '<button class="card-mas" type="button">+</button>';
    const menos = grupo.querySelector('.card-menos');
    const cuentaFicha = grupo.querySelector('output');
    const mas = grupo.querySelector('.card-mas');
    const cuantos = () => pedido.get(id)?.cantidad || 0;

    const refrescar = () => {
      const n = cuantos();
      grupo.classList.toggle('is-lleno', n > 0);
      menos.hidden = n === 0;
      cuentaFicha.hidden = n === 0;
      cuentaFicha.textContent = n;
      // Con una sola unidad, quitarla es borrar el producto del pedido: el boton
      // lo dice con un basurero. Desde dos vuelve a ser un signo de resta.
      menos.innerHTML = n === 1 ? BASURERO : '<span aria-hidden="true">−</span>';
      menos.setAttribute('aria-label', n === 1 ? `Quitar ${nombre} de la canasta` : `Quitar uno de ${nombre}`);
      mas.setAttribute('aria-label', n ? `Añadir otro de ${nombre}` : `Añadir ${nombre} a la canasta`);
    };
    refrescos.push(refrescar);

    const cuantosQuedan = () => `${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
    mas.addEventListener('click', () => {
      const l = pedido.get(id) || { nombre, precio, cantidad: 0 };
      l.cantidad = Math.min(l.cantidad + 1, 99);
      pedido.set(id, l);
      pintar();
      avisos.textContent = `${nombre} añadido. ${cuantosQuedan()}`;
    });
    menos.addEventListener('click', () => {
      const seVa = cuantos() <= 1;
      cambiar(id, -1);
      avisos.textContent = seVa ? `${nombre} quitado. ${cuantosQuedan()}` : `Una unidad menos de ${nombre}. ${cuantosQuedan()}`;
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

    + '<section class="cuenta-paso" data-paso="entrar" hidden>'
    + '<div class="cuenta-cuerpo">'
    + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Sin servidor no hay '
    + 'contraseña que comprobar: entra cualquiera. Solo se busca el correo de la cuenta '
    + 'que creaste en este navegador.</p>'
    + campoHtml('entrar-correo', 'Correo', 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"')
    + campoHtml('entrar-clave', 'Contraseña', 'type="password" autocomplete="current-password" maxlength="40"')
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
  const correoEntrar = panelC.querySelector('#cuenta-entrar-correo');
  const claveEntrar = panelC.querySelector('#cuenta-entrar-clave');
  const errorEntrarCorreo = panelC.querySelector('#cuenta-entrar-correo-error');

  const TITULOS_CUENTA = { crear: 'Crear cuenta', entrar: 'Entrar', sesion: 'Tu cuenta' };
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
    claveEntrar.value = '';
    errorEntrarCorreo.hidden = true;
    correoEntrar.classList.remove('is-mal');
  };

  const guardarCuenta = () => {
    try {
      // Solo lo que hace falta para el pedido. La contrasena no entra aqui.
      window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
        nombre: sesion.nombre, correo: sesion.correo,
        telefono: sesion.telefono, direccion: sesion.direccion,
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
  const abrirC = () => {
    ultimoFocoC = document.activeElement;
    // Con sesion abierta se entra a la ficha; sin ella, a crear la cuenta.
    verPaso(sesion.dentro ? 'sesion' : 'crear');
    fondoC.classList.add('is-open');
    panelC.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    tituloC.focus();
  };
  const cerrarC = () => {
    fondoC.classList.remove('is-open');
    panelC.classList.remove('is-open');
    document.body.style.overflow = '';
    olvidarFormulario();
    // En el telefono el menu se cerro al abrir el panel, asi que el boton al que
    // habria que volver esta escondido: el foco va al de abrir el menu, que si se ve.
    if (ultimoFocoC && ultimoFocoC.offsetParent === null) menuToggle?.focus();
    else ultimoFocoC?.focus();
  };

  navCuenta.addEventListener('click', () => { closeMenu(); abrirC(); });
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
    sesion.dentro = true;
    entrarEnSesion(`Cuenta creada. Entraste como ${sesion.nombre}.`);
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
    entrarEnSesion(`Entraste como ${sesion.nombre}.`);
  });

  panelC.querySelector('.cuenta-salir').addEventListener('click', () => {
    const nombre = sesion.nombre;
    sesion.nombre = '';
    sesion.correo = '';
    sesion.telefono = '';
    sesion.direccion = '';
    sesion.dentro = false;
    try { window.localStorage.removeItem(CLAVE_CUENTA); } catch (e) { /* no habia nada guardado */ }
    pintarSesion();
    verPaso('crear');
    tituloC.focus();
    avisos.textContent = `Saliste de la cuenta de ${nombre}.`;
  });

  leerCuenta();
  pintarSesion();
  prellenarPedido();

  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60000);
})();
