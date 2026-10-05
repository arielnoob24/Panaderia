// ---- La barra, el foco y los cuadritos de ayuda -----------------------
// Lo que no pertenece a ninguna pantalla concreta y lo usan todas: el cerco
// del foco, la cabecera pegajosa, el menu Tienda, los cuadritos de ayuda, las
// animaciones de entrada y el horario del pie. La canasta y la cuenta toman de
// aqui el cerco del foco; el catalogo, la region de avisos.

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// La region de avisos: un solo renglon invisible por el que pasa todo lo que
// hay que cantarle al lector de pantalla. Vive aqui y no en la canasta porque
// tambien lo usan el mostrador y la cuenta.
const avisos = document.createElement('p');
avisos.className = 'sr-only';
avisos.setAttribute('role', 'status');
avisos.setAttribute('aria-live', 'polite');
document.body.append(avisos);

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
});

// Cada imagen avisa cuando llega, y si no llega se quita en vez de dejar el
// hueco roto. Se pasa la raiz porque las fichas del catalogo nacen despues:
// el arranque lo llama otra vez con la cuadricula ya pintada.
const vigilarImagenes = (raiz = document) => {
  raiz.querySelectorAll('img').forEach((image) => {
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
};

const heroImage = document.querySelector('.hero-image');
if (heroImage) {
  const heroPreload = new Image();
  heroPreload.addEventListener('load', () => heroImage.classList.add('is-loaded'), { once: true });
  heroPreload.src = getComputedStyle(heroImage).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1] || '';
}

export {
  menuToggle, navigation, reducedMotion, avisos,
  focosDe, anexosDeFoco, apagarDetras, atraparFoco,
  flechasEnMenu, closeMenu, grupo, grupoBoton, abrirGrupo,
  updateOpeningStatus, vigilarImagenes,
};
