// Generado por herramientas/empaquetar.mjs: no se edita a mano.
// Es el mismo codigo de js/, en un solo archivo y con el catalogo dentro,
// para que index.html funcione abierto con doble clic.
var CATALOGO_EMBEBIDO = {"productos":[{"nombre":"Pan redondo","categoria":"panes","precio":0.25,"destacado":true,"foto":"assets/img/productos/pan-redondo","alt":"Pan redondo de corteza dorada y brillante sobre papel blanco","etiqueta":{"color":"green","texto":"De la casa"}},{"nombre":"Pan enrollado","categoria":"panes","precio":0.35,"foto":"assets/img/productos/pan-enrollado","alt":"Pan enrollado en forma de media luna, dorado y hojaldrado"},{"nombre":"Palanqueta","categoria":"panes","precio":0.5,"foto":"assets/img/productos/palanqueta","alt":"Palanqueta alargada de corteza crujiente con cortes en la superficie","disponible":false},{"nombre":"Empanada de queso","categoria":"panes","precio":0.75,"destacado":true,"foto":"assets/img/productos/pan-con-queso","alt":"Empanada de queso con borde repulgado y azúcar glas","etiqueta":{"color":"yellow","texto":"Recién hecho"}},{"nombre":"Pan de chocolate","categoria":"panes","precio":0.85,"destacado":true,"foto":"assets/img/productos/pan-de-chocolate","alt":"Pan de chocolate partido por la mitad, con el relleno de chocolate a la vista"},{"nombre":"Pan redondo dulce","categoria":"panes","precio":0.4,"destacado":true,"foto":"assets/img/productos/pan-redondo-dulce","alt":"Pan redondo dulce y brillante con grageas de colores encima","etiqueta":{"color":"green","texto":"Dulce de siempre"}},{"nombre":"Suspiros","categoria":"dulces","precio":0.75,"foto":"assets/img/productos/suspiros","alt":"Suspiro de merengue blanco en espiral sobre papel","disponible":false},{"nombre":"Galletas","categoria":"dulces","precio":1,"destacado":true,"foto":"assets/img/productos/galletas","alt":"Galleta con chispas de chocolate sobre papel blanco"},{"nombre":"Rebanada de pastel de chocolate","categoria":"dulces","precio":1.75,"destacado":true,"foto":"assets/img/productos/rebanada-de-pastel-de-chocolate","alt":"Rebanada de pastel de chocolate de tres capas con cobertura de chocolate"},{"nombre":"Rebanada de pastel de vainilla","categoria":"dulces","precio":1.5,"foto":"assets/img/productos/rebanada-de-pastel-de-vainilla","alt":"Rebanada de pastel de vainilla de tres capas con crema blanca"},{"nombre":"Rebanada de cheesecake de limón","categoria":"dulces","precio":2,"destacado":true,"foto":"assets/img/productos/rebanada-de-cheesecake-de-limon","alt":"Rebanada de cheesecake de limón con base de galleta, una rodaja de limón y ralladura encima"},{"nombre":"Coca-Cola","categoria":"bebidas-frias","precio":0.85,"destacado":true,"foto":"assets/img/productos/coca-cola","alt":"Botella de vidrio de Coca-Cola sobre papel blanco","etiqueta":{"color":"yellow","texto":"Para llevar"},"tamanos":[{"valor":"500 ml","precio":0.85},{"valor":"1 L","precio":1.25},{"valor":"2 L","precio":2}]},{"nombre":"Fanta","categoria":"bebidas-frias","precio":0.85,"foto":"assets/img/productos/fanta","alt":"Botella de Fanta de naranja sobre papel blanco","tamanos":[{"valor":"500 ml","precio":0.85},{"valor":"1 L","precio":1.25}]},{"nombre":"Sprite","categoria":"bebidas-frias","precio":0.85,"foto":"assets/img/productos/sprite","alt":"Botella de Sprite sobre papel blanco","tamanos":[{"valor":"500 ml","precio":0.85},{"valor":"1 L","precio":1.25}]},{"nombre":"Agua","categoria":"bebidas-frias","precio":0.5,"foto":"assets/img/productos/agua","alt":"Botella de agua sin gas sobre papel blanco","tamanos":[{"valor":"500 ml","precio":0.5},{"valor":"1 L","precio":0.75}]},{"nombre":"Powerade","categoria":"bebidas-frias","precio":1.25,"foto":"assets/img/productos/powerade","alt":"Botella de Powerade azul de tapa negra","disponible":false,"tamanos":[{"valor":"500 ml","precio":1.25},{"valor":"1 L","precio":1.75}]},{"nombre":"Avena polaca","categoria":"bebidas-frias","precio":0.75,"foto":"assets/img/productos/avena-polaca","alt":"Vaso de Avena Polaca con su etiqueta roja y blanca","tamanos":[{"valor":"300 ml","precio":0.75},{"valor":"500 ml","precio":1.25}]}]};
(() => {
  // js/repo.js
  var RUTA = "data/productos.json";
  var revisar = (p, i) => {
    const donde = p && p.nombre ? `"${p.nombre}"` : `el producto numero ${i + 1}`;
    if (!p || typeof p !== "object") throw new Error(`${donde} no es un producto`);
    if (typeof p.nombre !== "string" || !p.nombre.trim()) throw new Error(`a ${donde} le falta el nombre`);
    if (typeof p.categoria !== "string" || !p.categoria.trim()) throw new Error(`a ${donde} le falta la categoria`);
    if (!Number.isFinite(p.precio) || p.precio < 0) throw new Error(`${donde} no tiene un precio valido`);
    if (typeof p.foto !== "string" || !p.foto) throw new Error(`a ${donde} le falta la foto`);
    if (/\.(jpg|jpeg|png|webp|avif)$/i.test(p.foto)) {
      throw new Error(`la foto de ${donde} lleva extension: va la raiz, sin ancho ni .jpg`);
    }
    if (typeof p.alt !== "string" || !p.alt.trim()) throw new Error(`a ${donde} le falta el texto alternativo`);
    if (p.tamanos && (!Array.isArray(p.tamanos) || !p.tamanos.length)) {
      throw new Error(`los tamanos de ${donde} no son una lista`);
    }
    (p.tamanos || []).forEach((t) => {
      if (!t || typeof t.valor !== "string" || !Number.isFinite(t.precio)) {
        throw new Error(`un tamano de ${donde} esta incompleto`);
      }
    });
    if (p.destacado !== void 0 && typeof p.destacado !== "boolean") {
      throw new Error(`"destacado" de ${donde} tiene que ser true o false`);
    }
    if (p.tamanos && p.tamanos[0].precio !== p.precio) {
      throw new Error(`en ${donde} el precio no es el del primer tamano`);
    }
  };
  var normalizar = (p) => ({
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
    tamanos: p.tamanos || []
  });
  var cargarProductos = async () => {
    let datos2 = globalThis.CATALOGO_EMBEBIDO;
    if (!datos2) {
      const r = await fetch(RUTA);
      if (!r.ok) throw new Error(`no se pudo leer ${RUTA} (${r.status})`);
      datos2 = await r.json();
    }
    const crudos = Array.isArray(datos2) ? datos2 : datos2.productos;
    if (!Array.isArray(crudos) || !crudos.length) throw new Error(`${RUTA} no trae ningun producto`);
    crudos.forEach(revisar);
    const productos = crudos.map(normalizar);
    return { productos };
  };

  // js/ui.js
  var menuToggle = document.querySelector(".menu-toggle");
  var navigation = document.querySelector("#main-nav");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var avisos = document.createElement("p");
  avisos.className = "sr-only";
  avisos.setAttribute("role", "status");
  avisos.setAttribute("aria-live", "polite");
  document.body.append(avisos);
  var FOCOS = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var focosDe = (caja) => [...caja.querySelectorAll(FOCOS)].filter((el) => el.offsetParent !== null && !el.disabled && el.getAttribute("aria-disabled") !== "true" && !el.closest("[inert]"));
  var anexosDeFoco = /* @__PURE__ */ new Set();
  var panelesAbiertos = /* @__PURE__ */ new Set();
  var detras = () => [
    document.querySelector(".site-header"),
    document.querySelector("#contenido"),
    document.querySelector(".site-footer"),
    document.querySelector(".floating-whatsapp")
  ].filter(Boolean);
  var apagarDetras = (panel3, apagado) => {
    if (apagado) panelesAbiertos.add(panel3);
    else panelesAbiertos.delete(panel3);
    const hayPanel = panelesAbiertos.size > 0;
    detras().forEach((zona) => {
      zona.inert = hayPanel;
    });
  };
  var flechasEnMenu = (boton2, caja, abrir3, estaAbierto) => {
    const opciones = () => focosDe(caja);
    const irA = (i) => {
      const lista2 = opciones();
      if (!lista2.length) return;
      lista2[(i + lista2.length) % lista2.length].focus();
    };
    const mover = (paso) => {
      const lista2 = opciones();
      const donde = lista2.indexOf(document.activeElement);
      irA(donde === -1 ? paso > 0 ? 0 : lista2.length - 1 : donde + paso);
    };
    boton2.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      if (!estaAbierto()) abrir3(true);
      requestAnimationFrame(() => irA(e.key === "ArrowDown" ? 0 : -1));
    });
    caja.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        mover(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        mover(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        irA(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        irA(-1);
        return;
      }
      if (e.key !== "Escape") return;
      e.preventDefault();
      abrir3(false);
      boton2.focus();
    });
  };
  var cabecera = document.querySelector(".site-header");
  if (cabecera) {
    let pegada = false;
    let sobreOscuro = false;
    const oscuras = [...document.querySelectorAll(".story, .site-footer")];
    const mirarScroll = () => {
      const ahora = window.scrollY > 40;
      const alto = cabecera.getBoundingClientRect().height;
      const tapando = oscuras.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < alto && r.bottom > 0;
      });
      if (ahora !== pegada) {
        pegada = ahora;
        cabecera.classList.toggle("is-pegada", ahora);
      }
      if (tapando !== sobreOscuro) {
        sobreOscuro = tapando;
        cabecera.classList.toggle("is-sobre-oscuro", tapando);
      }
    };
    window.addEventListener("scroll", mirarScroll, { passive: true });
    mirarScroll();
  }
  var grupo = document.querySelector(".nav-grupo");
  var grupoBoton = grupo?.querySelector(".nav-grupo-boton");
  var abrirGrupo = (abierto2) => {
    if (!grupo || !grupoBoton) return;
    grupo.classList.toggle("is-open", abierto2);
    grupoBoton.setAttribute("aria-expanded", String(abierto2));
  };
  var closeMenu = (restoreFocus = false) => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    navigation.classList.remove("is-open");
    abrirGrupo(false);
    if (restoreFocus) menuToggle.focus();
  };
  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
    navigation.classList.toggle("is-open", !isOpen);
    if (isOpen) {
      menuToggle.focus();
      return;
    }
    requestAnimationFrame(() => focosDe(navigation)[0]?.focus());
  });
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("click", (event) => {
    if (navigation?.classList.contains("is-open") && !navigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const tiendaAbierta = grupo?.classList.contains("is-open");
    grupo?.dispatchEvent(new CustomEvent("soltar"));
    closeMenu(true);
    if (tiendaAbierta) grupoBoton?.focus();
  });
  if (grupo && grupoBoton) {
    let fijada = false;
    grupoBoton.addEventListener("click", () => {
      fijada = !fijada;
      abrirGrupo(fijada);
    });
    const esRaton = (e) => e.pointerType === "mouse" || e.pointerType === "pen";
    const hayBarra = () => window.innerWidth > 680;
    grupo.addEventListener("pointerenter", (e) => {
      if (esRaton(e) && hayBarra()) abrirGrupo(true);
    });
    grupo.addEventListener("pointerleave", (e) => {
      if (esRaton(e) && !fijada) abrirGrupo(false);
    });
    document.addEventListener("click", (event) => {
      if (grupo.contains(event.target)) return;
      fijada = false;
      abrirGrupo(false);
    });
    document.addEventListener("focusin", (event) => {
      if (grupo.contains(event.target)) return;
      fijada = false;
      abrirGrupo(false);
    });
    grupo.addEventListener("soltar", () => {
      fijada = false;
    });
    const submenu = grupo.querySelector(".nav-submenu");
    if (submenu) {
      grupoBoton.setAttribute("aria-haspopup", "true");
      flechasEnMenu(grupoBoton, submenu, (abierto2) => {
        fijada = abierto2;
        abrirGrupo(abierto2);
      }, () => grupo.classList.contains("is-open"));
    }
  }
  window.addEventListener("resize", () => {
    if (window.innerWidth > 680) closeMenu();
  });
  var ESPERA_TIP = 500;
  var globo = document.createElement("div");
  globo.className = "globo";
  globo.setAttribute("role", "tooltip");
  globo.id = "globo-ayuda";
  globo.hidden = true;
  document.body.append(globo);
  var relojTip = null;
  var conTip = null;
  var esconderTip = () => {
    clearTimeout(relojTip);
    relojTip = null;
    if (!conTip) return;
    conTip.removeAttribute("aria-describedby");
    conTip = null;
    globo.classList.remove("is-open");
    setTimeout(() => {
      if (!conTip) globo.hidden = true;
    }, 160);
  };
  var colocarTip = (quien) => {
    const c = quien.getBoundingClientRect();
    globo.hidden = false;
    const g = globo.getBoundingClientRect();
    const margen = 8;
    const arriba = c.top - g.height - 10;
    const cabeArriba = arriba > margen;
    globo.style.top = `${(cabeArriba ? arriba : c.bottom + 10) + window.scrollY}px`;
    globo.classList.toggle("is-abajo", !cabeArriba);
    const x = c.left + c.width / 2 - g.width / 2;
    globo.style.left = `${Math.max(margen, Math.min(x, window.innerWidth - g.width - margen)) + window.scrollX}px`;
  };
  var mostrarTip = (quien, yaMismo) => {
    const texto = quien.dataset.tip;
    if (!texto) return;
    clearTimeout(relojTip);
    const abrir3 = () => {
      conTip = quien;
      globo.textContent = texto;
      quien.setAttribute("aria-describedby", globo.id);
      colocarTip(quien);
      globo.classList.add("is-open");
    };
    if (yaMismo) abrir3();
    else relojTip = setTimeout(abrir3, ESPERA_TIP);
  };
  var mandaElTeclado = () => Boolean(conTip) && document.activeElement === conTip;
  document.addEventListener("mouseover", (e) => {
    const quien = e.target.closest?.("[data-tip]");
    if (quien === conTip || mandaElTeclado()) return;
    esconderTip();
    if (quien) mostrarTip(quien, false);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest?.("[data-tip]") && !mandaElTeclado()) esconderTip();
  });
  var llegoConRaton = false;
  document.addEventListener("pointerdown", () => {
    llegoConRaton = true;
  }, true);
  document.addEventListener("keydown", () => {
    llegoConRaton = false;
  }, true);
  document.addEventListener("focusin", (e) => {
    const quien = e.target.closest?.("[data-tip]");
    if (!quien) return;
    if (llegoConRaton) esconderTip();
    else mostrarTip(quien, true);
  });
  document.addEventListener("focusout", esconderTip);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") esconderTip();
  });
  var seguirOEsconder = () => {
    if (!conTip) return;
    if (document.activeElement === conTip) colocarTip(conTip);
    else esconderTip();
  };
  window.addEventListener("scroll", seguirOEsconder, { passive: true });
  window.addEventListener("resize", seguirOEsconder, { passive: true });
  var easterSunday = (year) => {
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
    const day = (h + l - 7 * m + 114) % 31 + 1;
    return new Date(year, month - 1, day);
  };
  var dateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  var holidayKeys = (year) => {
    const easter = easterSunday(year);
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 48);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    return /* @__PURE__ */ new Set([
      `${year}-1-1`,
      `${year}-5-1`,
      `${year}-8-10`,
      `${year}-10-9`,
      `${year}-11-2`,
      `${year}-11-3`,
      `${year}-12-25`,
      dateKey(carnival),
      dateKey(new Date(carnival.getFullYear(), carnival.getMonth(), carnival.getDate() + 1)),
      dateKey(goodFriday)
    ]);
  };
  var toMinutes = (value) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  var horarioDeHoy = () => {
    const now = /* @__PURE__ */ new Date();
    const day = now.getDay();
    const festivo = holidayKeys(now.getFullYear()).has(dateKey(now));
    const hours = day >= 1 && day <= 5 ? "08:00-20:00" : "09:00-21:00";
    const [abre, cierra] = hours.split("-");
    const ahora = now.getHours() * 60 + now.getMinutes();
    return {
      day,
      festivo,
      abre,
      cierra,
      abierto: !festivo && ahora >= toMinutes(abre) && ahora < toMinutes(cierra),
      antesDeAbrir: ahora < toMinutes(abre)
    };
  };
  var updateOpeningStatus = () => {
    const visita = document.querySelector(".footer-visita");
    const label = visita?.querySelector(".open-label");
    if (!visita || !label) return;
    const {
      day,
      festivo: holiday,
      abre: opening,
      cierra: closing,
      abierto: isOpen,
      antesDeAbrir
    } = horarioDeHoy();
    label.classList.toggle("is-closed", !isOpen);
    label.querySelector(".status-dot")?.classList.toggle("is-closed", !isOpen);
    document.querySelectorAll(".footer-horario div[data-dias]").forEach((fila) => {
      const esHoy = fila.dataset.dias.split(",").includes(String(day));
      fila.classList.toggle("is-today", esHoy);
      let marca = fila.querySelector(".dia-hoy");
      if (esHoy && !marca) {
        marca = document.createElement("span");
        marca.className = "dia-hoy";
        marca.textContent = "hoy";
        fila.querySelector("dt")?.appendChild(marca);
      } else if (!esHoy && marca) {
        marca.remove();
      }
    });
    let estado;
    if (holiday) estado = "Cerrado · día festivo";
    else if (isOpen) estado = `Abierto · cierra ${closing}`;
    else if (antesDeAbrir) estado = `Cerrado · abre ${opening}`;
    else estado = "Cerrado · abre mañana";
    label.lastChild.textContent = ` ${estado}`;
    const nota = document.querySelector(".hero-note");
    const notaTitulo = nota?.querySelector(".hero-note-titulo");
    const notaDato = nota?.querySelector(".hero-note-dato");
    if (!notaTitulo || !notaDato) return;
    nota.querySelector(".status-dot")?.classList.toggle("is-closed", !isOpen);
    if (isOpen) {
      notaTitulo.textContent = "Horneando ahora mismo";
      notaDato.textContent = `Abierto hasta las ${closing}`;
    } else if (holiday) {
      notaTitulo.textContent = "Hoy no horneamos";
      notaDato.textContent = "Día festivo · volvemos mañana";
    } else if (antesDeAbrir) {
      notaTitulo.textContent = "El horno se está calentando";
      notaDato.textContent = `Abrimos a las ${opening}`;
    } else {
      notaTitulo.textContent = "Ya cerramos por hoy";
      notaDato.textContent = `Mañana abrimos a las ${opening}`;
    }
  };
  var enterAvanza = (campos2, alFinal) => {
    const visible = (c) => c && !c.disabled && !c.closest("[hidden]");
    campos2.forEach((campo, i) => campo?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.isComposing || campo.tagName === "TEXTAREA") return;
      e.preventDefault();
      const siguiente = campos2.slice(i + 1).find(visible);
      if (siguiente) siguiente.focus();
      else alFinal?.();
    }));
  };
  var atraparFoco = (panel3, abierto2, cerrar2) => {
    document.addEventListener("keydown", (e) => {
      if (!abierto2()) return;
      if (e.key === "Escape") {
        cerrar2();
        return;
      }
      if (e.key !== "Tab") return;
      const focos = [panel3, ...anexosDeFoco].flatMap((caja) => focosDe(caja));
      if (!focos.length) return;
      const primero = focos[0], ultimo = focos[focos.length - 1];
      const dentro = [panel3, ...anexosDeFoco].some((caja) => caja.contains(document.activeElement));
      if (!dentro) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    });
  };
  var motionMap = [
    [".sign-band", "reveal-band"],
    [".section-heading", "reveal"],
    [".story-photo", "reveal-mask"],
    [".story-copy", "reveal-x"],
    [".principles", "reveal-line"]
  ];
  var motionItems = [];
  motionMap.forEach(([selector, pattern]) => {
    document.querySelectorAll(selector).forEach((item) => {
      item.classList.add(pattern);
      item.dataset.motion = pattern;
      motionItems.push(item);
    });
  });
  var heroContent = document.querySelector(".hero-content");
  if (heroContent) {
    const riseByIndex = [16, 10, 8];
    [...heroContent.children].forEach((child, index) => {
      child.style.setProperty("--rise", `${riseByIndex[index] ?? 8}px`);
      child.style.setProperty("--hero-delay", `${Math.min(index * 70, 420)}ms`);
    });
    heroContent.classList.add("is-ready");
  }
  var revealObserver = null;
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    motionItems.forEach((item) => revealObserver.observe(item));
  } else {
    motionItems.forEach((item) => item.classList.add("is-visible"));
  }
  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    revealObserver = null;
    motionItems.forEach((item) => item.classList.add("is-visible"));
  });
  var vigilarImagenes = (raiz = document) => {
    raiz.querySelectorAll("img").forEach((image) => {
      image.parentElement?.classList.add("is-loading");
      const markImageLoaded = () => {
        image.classList.add("is-loaded");
        image.parentElement?.classList.remove("is-loading");
      };
      image.addEventListener("load", markImageLoaded);
      image.addEventListener("error", () => {
        image.hidden = true;
        image.classList.remove("is-loaded");
        image.parentElement?.classList.remove("is-loading");
        image.parentElement?.classList.add("image-unavailable");
      });
      if (image.complete && image.naturalWidth > 0) markImageLoaded();
    });
  };
  var heroImage = document.querySelector(".hero-image");
  if (heroImage) {
    const heroPreload = new Image();
    heroPreload.addEventListener("load", () => heroImage.classList.add("is-loaded"), { once: true });
    heroPreload.src = getComputedStyle(heroImage).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1] || "";
  }

  // js/state.js
  var CLAVE = "eltradicional-pedido";
  var pedido = /* @__PURE__ */ new Map();
  var entrega = { modo: "retiro", direccion: "", piso: "", referencia: "", notas: "" };
  var sesion = {
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    dentro: false,
    verificado: false,
    metodo: "efectivo"
  };
  var telefonoLargo = (n) => `+593 ${String(n || "").replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3")}`;
  var tarjeta = { numero: "", vence: "", cvv: "", titular: "" };
  var cobro = { metodo: "efectivo", numero: "", detalle: "" };
  var factura = { aOtro: false, nombre: "", ident: "", correo: "", direccion: "" };
  var MAX_UNIDADES = 100;
  var ENVIO = 1.5;
  var dinero = (n) => "$" + n.toFixed(2);
  var direccionEntera = () => [entrega.direccion, entrega.piso, entrega.referencia].filter(Boolean).join(" · ");
  var idDe = (nombre) => nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
  var subtotal = () => [...pedido.values()].reduce((s, l) => s + l.precio * l.cantidad, 0);
  var envio = () => entrega.modo === "domicilio" ? ENVIO : 0;
  var total = () => subtotal() + envio();
  var unidades = () => [...pedido.values()].reduce((s, l) => s + l.cantidad, 0);
  var puente = {};

  // js/storage.js
  var COOKIE = "eltradicional-guardado";
  var UN_MES = 60 * 60 * 24 * 30;
  var marcarActualizacion = (cuando = /* @__PURE__ */ new Date()) => {
    try {
      document.cookie = `${COOKIE}=${encodeURIComponent(cuando.toISOString())}; path=/; max-age=${UN_MES}; SameSite=Lax`;
    } catch (e) {
    }
    return cuando;
  };
  var ultimaActualizacion = () => {
    try {
      const trozo = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
      if (!trozo) return null;
      const fecha = new Date(decodeURIComponent(trozo.slice(COOKIE.length + 1)));
      return Number.isNaN(fecha.getTime()) ? null : fecha;
    } catch (e) {
      return null;
    }
  };
  var olvidarMarca = () => {
    try {
      document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    } catch (e) {
    }
  };
  var marcaBonita = (fecha) => {
    if (!fecha) return "";
    const hora = fecha.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
    const hoy = /* @__PURE__ */ new Date();
    const mismoDia = (a, b) => a.toDateString() === b.toDateString();
    if (mismoDia(fecha, hoy)) return `hoy a las ${hora}`;
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (mismoDia(fecha, ayer)) return `ayer a las ${hora}`;
    const dia = fecha.toLocaleDateString("es-EC", { day: "numeric", month: "long" });
    return `el ${dia} a las ${hora}`;
  };
  var CLAVE_VISTA = "eltradicional-vista";
  var recordarVista = (vista2) => {
    try {
      window.sessionStorage.setItem(CLAVE_VISTA, JSON.stringify(vista2));
    } catch (e) {
    }
  };
  var vistaRecordada = () => {
    try {
      const crudo = window.sessionStorage.getItem(CLAVE_VISTA);
      if (!crudo) return null;
      const v = JSON.parse(crudo);
      return v && typeof v === "object" ? v : null;
    } catch (e) {
      return null;
    }
  };
  var BASE = "eltradicional";
  var ALMACEN = "pedidos";
  var VERSION = 1;
  var A_LA_VISTA = 5;
  var abriendo = null;
  var abrir = () => {
    if (abriendo) return abriendo;
    abriendo = new Promise((listo2, falla) => {
      if (!window.indexedDB) {
        falla(new Error("este navegador no trae IndexedDB"));
        return;
      }
      const pet = window.indexedDB.open(BASE, VERSION);
      pet.onupgradeneeded = () => {
        const db = pet.result;
        if (db.objectStoreNames.contains(ALMACEN)) return;
        db.createObjectStore(ALMACEN, { keyPath: "numero" }).createIndex("fecha", "fecha");
      };
      pet.onsuccess = () => listo2(pet.result);
      pet.onerror = () => falla(pet.error);
      pet.onblocked = () => falla(new Error("la base esta bloqueada"));
    }).catch((e) => {
      abriendo = null;
      throw e;
    });
    return abriendo;
  };
  var guardarPedido = async (recibo) => {
    try {
      const db = await abrir();
      await new Promise((listo2, falla) => {
        const t = db.transaction(ALMACEN, "readwrite");
        t.objectStore(ALMACEN).put(recibo);
        t.oncomplete = listo2;
        t.onerror = () => falla(t.error);
        t.onabort = () => falla(t.error);
      });
      marcarActualizacion();
      return true;
    } catch (e) {
      console.warn("No se pudo guardar el pedido en el historial:", e);
      return false;
    }
  };
  var pedidosGuardados = async (tope = A_LA_VISTA) => {
    try {
      const db = await abrir();
      const todos = await new Promise((listo2, falla) => {
        const t = db.transaction(ALMACEN, "readonly");
        const pet = t.objectStore(ALMACEN).getAll();
        pet.onsuccess = () => listo2(pet.result || []);
        pet.onerror = () => falla(pet.error);
      });
      return todos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, tope);
    } catch (e) {
      return [];
    }
  };

  // js/view.js
  var catalogStatus = document.querySelector(".catalog-status");
  var productGrid = document.querySelector(".product-grid");
  var escapar = (texto) => String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var enlacesTienda = [...document.querySelectorAll(".main-nav a[data-filtro]")];
  var NOMBRES = {};
  enlacesTienda.forEach((a) => {
    NOMBRES[a.dataset.filtro] = a.textContent.trim();
  });
  var ANCHOS = [420, 840];
  var SIZES_CUADRICULA = "(max-width: 680px) calc(50vw - 23px), (max-width: 900px) calc(50vw - 40px), 280px";
  var SIZES_FILA = "(max-width: 680px) calc(50vw - 23px), 272px";
  var foto = (p, w) => `${p.foto}-${w}.jpg`;
  var tamanosHtml = (p) => {
    if (!p.tamanos.length) return "";
    const id = idDe(p.nombre);
    const opciones = p.tamanos.map((t, i) => {
      const marca = i === 0 ? " checked" : "";
      const apagado = p.disponible ? "" : " disabled";
      return `<input class="tamano-input" type="radio" name="tam-${id}" id="tam-${id}-${i}" value="${escapar(t.valor)}" data-precio="${t.precio.toFixed(2)}"${marca}${apagado}><label class="tamano" for="tam-${id}-${i}">${escapar(t.valor)}</label>`;
    }).join("");
    return `<div class="card-tamanos" role="group" aria-label="Tamaño de ${escapar(p.nombre)}">` + opciones + "</div>";
  };
  var fondoHtml = (p) => {
    if (!p.disponible) return '<span class="card-agotado">Vuelve mañana</span>';
    const texto = encodeURIComponent(`Hola, quiero pedir ${p.nombre}.`);
    return `<a class="order-button" href="https://wa.me/593990000000?text=${texto}" target="_blank" rel="noopener">Pedir <span aria-hidden="true">↗</span></a>`;
  };
  var etiquetaHtml = (p) => {
    if (!p.disponible) return '<span class="product-tag agotado">Agotado</span>';
    if (!p.etiqueta) return "";
    return `<span class="product-tag ${escapar(p.etiqueta.color)}">${escapar(p.etiqueta.texto)}</span>`;
  };
  var categoriaHtml = (p) => NOMBRES[p.categoria] ? `<span class="product-categoria">${escapar(NOMBRES[p.categoria])}</span>` : "";
  var fichaHtml = (p) => {
    const srcset = ANCHOS.map((w) => `${foto(p, w)} ${w}w`).join(", ");
    return `<article class="product-card"${p.disponible ? "" : ' data-available="false"'}` + (p.destacado ? ' data-destacado="true"' : "") + ` data-category="${escapar(p.categoria)}"><div class="product-image"><img src="${foto(p, 840)}" srcset="${srcset}" sizes="${SIZES_FILA}" alt="${escapar(p.alt)}" loading="lazy" width="840" height="630">` + etiquetaHtml(p) + '</div><div class="product-info">' + categoriaHtml(p) + `<h3>${escapar(p.nombre)}</h3>` + tamanosHtml(p) + `<div class="product-bottom"><strong>${dinero(p.precio)}</strong>${fondoHtml(p)}</div></div></article>`;
  };
  var products = [];
  var pintarFichas = (productos) => {
    if (!productGrid) return;
    productGrid.innerHTML = productos.map(fichaHtml).join("");
    products = [...productGrid.querySelectorAll(".product-card")];
  };
  var montarCatalogo = (productos) => {
    pintarFichas(productos);
    const columnCount = (grid) => {
      if (!grid) return 1;
      const columns = window.getComputedStyle(grid).gridTemplateColumns;
      if (!columns || columns === "none") return 1;
      return columns.split(" ").filter(Boolean).length || 1;
    };
    const diagonalDelay = (index, columns, step, max) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      return Math.min((row + column) * step, max);
    };
    const FLECHA = (izq) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M' + (izq ? "14.5 5.5 8 12l6.5 6.5" : "9.5 5.5 16 12l-6.5 6.5") + '"/></svg>';
    const pasoFila = () => {
      const ficha = productGrid?.querySelector(".product-card:not([hidden])");
      const hueco = parseFloat(getComputedStyle(productGrid).columnGap) || 0;
      return ficha ? ficha.getBoundingClientRect().width + hueco : 280;
    };
    const enElFinal = () => productGrid.scrollLeft > productGrid.scrollWidth - productGrid.clientWidth - 8;
    let flechas = [];
    if (productGrid) {
      const zona = document.createElement("div");
      zona.className = "fila-zona";
      productGrid.parentElement.insertBefore(zona, productGrid);
      const cabezaFila = document.createElement("div");
      cabezaFila.className = "fila-cabeza";
      const rotulo = document.createElement("h3");
      rotulo.className = "fila-rotulo";
      rotulo.textContent = "Los más pedidos";
      const verTodo = document.createElement("a");
      verTodo.className = "fila-ver-todo";
      verTodo.href = "#catalogo";
      verTodo.innerHTML = 'Ver todo<span class="fila-ver-todo-largo"> el catálogo</span> <span aria-hidden="true">→</span>';
      verTodo.setAttribute("aria-label", "Ver todo el catálogo");
      verTodo.addEventListener("click", (e) => {
        e.preventDefault();
        abrirCategoria("catalogo");
      });
      cabezaFila.append(rotulo, verTodo);
      zona.before(cabezaFila);
      zona.append(productGrid);
      const pie = document.createElement("div");
      pie.className = "fila-pie";
      const barra = document.createElement("div");
      barra.className = "fila-barra";
      barra.setAttribute("aria-hidden", "true");
      const avance = document.createElement("span");
      avance.className = "fila-avance";
      barra.append(avance);
      flechas = [-1, 1].map((ir) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "fila-flecha";
        b.dataset.ir = String(ir);
        b.innerHTML = FLECHA(ir === -1);
        b.setAttribute("aria-label", ir === -1 ? "Ver los productos anteriores" : "Ver más productos");
        b.dataset.tip = ir === -1 ? "Anterior" : "Siguiente";
        b.addEventListener("click", () => {
          if (ir === 1 && enElFinal()) {
            productGrid.scrollTo({ left: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
            return;
          }
          productGrid.scrollBy({
            left: ir * pasoFila(),
            behavior: reducedMotion.matches ? "auto" : "smooth"
          });
        });
        return b;
      });
      pie.append(flechas[0], barra, flechas[1]);
      zona.append(pie);
      const telefono = window.matchMedia("(max-width: 680px)");
      const altoPropio = (ficha) => {
        const fondo2 = ficha.querySelector(".product-bottom");
        const antes2 = fondo2?.previousElementSibling;
        if (!antes2) return ficha.offsetHeight;
        const sobra = fondo2.getBoundingClientRect().top - antes2.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(antes2).marginBottom) || 0);
        return ficha.offsetHeight - Math.max(0, sobra);
      };
      let midiendo = 0;
      const medirFila = () => {
        if (midiendo) return;
        midiendo = requestAnimationFrame(() => {
          midiendo = 0;
          const fichas = products.filter((p) => !p.hidden);
          if (!telefono.matches || !productGrid.classList.contains("is-fila")) {
            productGrid.style.height = "";
            fichas.forEach((p) => {
              p.style.minHeight = "";
            });
            return;
          }
          const caja = productGrid.getBoundingClientRect();
          const vistas = fichas.filter((p) => {
            const r = p.getBoundingClientRect();
            return r.right > caja.left + 1 && r.left < caja.right - 1;
          });
          const alto = Math.ceil(Math.max(0, ...vistas.map(altoPropio)));
          if (!alto) return;
          fichas.forEach((p) => {
            p.style.minHeight = vistas.includes(p) ? `${alto}px` : "";
          });
          const estilo = getComputedStyle(productGrid);
          productGrid.style.height = `${alto + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)}px`;
        });
      };
      telefono.addEventListener("change", medirFila);
      document.fonts?.ready.then(medirFila);
      if ("ResizeObserver" in window) {
        const vigia = new ResizeObserver(medirFila);
        productGrid.querySelectorAll(".product-bottom").forEach((f) => vigia.observe(f));
      }
      const mirarPuntas = () => {
        const sobra = productGrid.scrollWidth - productGrid.clientWidth;
        const hayFila = productGrid.classList.contains("is-fila");
        const final = enElFinal();
        pie.hidden = !hayFila || sobra < 24;
        avance.style.width = `${productGrid.clientWidth / productGrid.scrollWidth * 100}%`;
        avance.style.transform = `translateX(${productGrid.scrollLeft / productGrid.clientWidth * 100}%)`;
        flechas.forEach((b) => {
          b.hidden = !hayFila || sobra < 24;
          if (b.dataset.ir === "-1") {
            b.disabled = productGrid.scrollLeft < 8;
          } else {
            b.setAttribute("aria-label", final ? "Volver al primer producto" : "Ver más productos");
            b.dataset.tip = final ? "Volver al principio" : "Siguiente";
          }
        });
        medirFila();
      };
      productGrid.addEventListener("scroll", mirarPuntas, { passive: true });
      window.addEventListener("resize", mirarPuntas, { passive: true });
      productGrid.mirarPuntas = mirarPuntas;
      const CADA = 4200;
      let reloj = null;
      const cerca = /* @__PURE__ */ new Set();
      const RESPIRO = CADA * 2;
      let tocada = 0;
      const puedeAndar = () => productGrid.classList.contains("is-fila") && !reducedMotion.matches && !document.hidden && !productGrid.estaParada?.() && productGrid.scrollWidth - productGrid.clientWidth > 24;
      const avanzar = () => {
        if (cerca.size || Date.now() - tocada < RESPIRO || !puedeAndar()) return;
        if (enElFinal()) {
          productGrid.scrollTo({ left: 0, behavior: "smooth" });
          return;
        }
        productGrid.scrollBy({ left: pasoFila(), behavior: "smooth" });
      };
      const arrancar2 = () => {
        if (productGrid.estaParada?.()) return;
        if (!reloj) reloj = setInterval(avanzar, CADA);
      };
      const parar = () => {
        clearInterval(reloj);
        reloj = null;
      };
      const vigilar = (entra, sale) => {
        zona.addEventListener(entra, () => {
          cerca.add(entra);
        }, { passive: true });
        zona.addEventListener(sale, () => {
          cerca.delete(entra);
          tocada = Date.now();
        }, { passive: true });
      };
      vigilar("mouseenter", "mouseleave");
      vigilar("focusin", "focusout");
      vigilar("touchstart", "touchend");
      zona.addEventListener("touchcancel", () => {
        cerca.delete("touchstart");
        tocada = Date.now();
      }, { passive: true });
      ["pointerdown", "click", "input", "change", "keydown"].forEach((ev) => {
        zona.addEventListener(ev, () => {
          tocada = Date.now();
        }, { passive: true });
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) parar();
        else arrancar2();
      });
      let parada = false;
      const botonPausa = document.createElement("button");
      botonPausa.type = "button";
      botonPausa.className = "fila-pausa";
      const PAUSA_ICONO = (quieta) => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' + (quieta ? '<path d="M8 5.5l11 6.5-11 6.5z"/>' : '<rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/>') + "</svg>";
      const pintarPausa = () => {
        botonPausa.innerHTML = PAUSA_ICONO(parada);
        botonPausa.setAttribute("aria-pressed", String(parada));
        const dice = parada ? "Reanudar el avance de los más pedidos" : "Detener el avance de los más pedidos";
        botonPausa.setAttribute("aria-label", dice);
        botonPausa.dataset.tip = parada ? "Reanudar" : "Pausar";
      };
      botonPausa.addEventListener("click", () => {
        parada = !parada;
        pintarPausa();
        if (parada) parar();
        else arrancar2();
        avisos.textContent = parada ? "Los más pedidos, detenidos. No se moverán hasta que lo reanudes." : "Los más pedidos, en marcha otra vez.";
      });
      pintarPausa();
      cabezaFila.append(botonPausa);
      productGrid.estaParada = () => parada;
      arrancar2();
    }
    products.forEach((p, i) => {
      p.dataset.orden = String(i);
    });
    const precioDeFicha = (p) => parseFloat(
      (p.querySelector(".product-bottom strong")?.textContent || "").replace(/[^0-9.]/g, "")
    ) || 0;
    const nombreDeFicha = (p) => (p.querySelector("h3")?.textContent || "").trim();
    let orden = "recomendados";
    let soloDisponibles = false;
    let subcategoria = "todas";
    let busqueda = "";
    const plano = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    let filterRun = 0;
    let categoria = "todos";
    const applyFilter = (shouldAnimate = false) => {
      const category = categoria;
      recordarVista({ categoria: category, orden, soloDisponibles, subcategoria });
      const animate = shouldAnimate && !reducedMotion.matches;
      const columns = columnCount(productGrid);
      const entering = [];
      let visibleCount = 0;
      let agotados = 0;
      productGrid?.classList.toggle("is-fila", category === "todos");
      const sizes = category === "todos" ? SIZES_FILA : SIZES_CUADRICULA;
      productGrid?.querySelectorAll(".product-image img").forEach((img) => {
        img.sizes = sizes;
      });
      productGrid?.classList.remove("is-filtering");
      const todoJunto = category === "todos" || category === "catalogo";
      const enCatalogo = category === "catalogo";
      const hayDestacados = products.some((p) => p.dataset.destacado === "true");
      const enPortada = (p) => !hayDestacados || p.dataset.destacado === "true" && p.dataset.available !== "false";
      const deLaCategoria = products.filter((p) => category === "todos" ? enPortada(p) : todoJunto || p.dataset.category === category);
      const total2 = deLaCategoria.length;
      const porOrden = [...deLaCategoria].sort((a, b) => {
        if (orden === "precio-asc") return precioDeFicha(a) - precioDeFicha(b);
        if (orden === "precio-desc") return precioDeFicha(b) - precioDeFicha(a);
        if (orden === "nombre") return nombreDeFicha(a).localeCompare(nombreDeFicha(b), "es");
        return Number(a.dataset.orden) - Number(b.dataset.orden);
      });
      porOrden.forEach((p, i) => {
        p.style.order = String(i);
      });
      products.forEach((product) => {
        const deAqui = category === "todos" ? enPortada(product) : todoJunto || product.dataset.category === category;
        const pasaFiltro = category === "todos" || !soloDisponibles || product.dataset.available !== "false";
        const pasaSub = !enCatalogo || subcategoria === "todas" || product.dataset.category === subcategoria;
        const pasaBusqueda = !enCatalogo || !busqueda || plano(nombreDeFicha(product)).includes(plano(busqueda));
        const visible = deAqui && pasaFiltro && pasaSub && pasaBusqueda;
        product.hidden = !visible;
        if (visible) {
          product.style.setProperty("--catalog-delay", `${diagonalDelay(visibleCount, columns, 40, 320)}ms`);
          product.classList.toggle("catalog-enter", animate);
          if (animate) entering.push(product);
          visibleCount += 1;
          if (product.dataset.available === "false") agotados += 1;
        } else {
          product.classList.remove("catalog-enter");
        }
      });
      const dice = category === "todos" ? null : `Mostrando ${visibleCount} de ${total2} producto${total2 === 1 ? "" : "s"}`;
      if (cuentaVista) cuentaVista.textContent = dice || "";
      if (vacioVista) {
        vacioVista.hidden = !(enCatalogo && visibleCount === 0);
        vacioVista.textContent = busqueda ? `No encontramos nada que se llame «${busqueda.trim()}». Prueba con otra palabra o quita algún filtro.` : "No hay productos con estos filtros.";
      }
      if (catalogStatus) {
        const plural = visibleCount === 1 ? "" : "s";
        const cuantos = agotados ? `${visibleCount} producto${plural}, ${agotados} agotado${agotados === 1 ? "" : "s"}` : `${visibleCount} producto${plural} disponible${plural}`;
        catalogStatus.textContent = category === "todos" ? `Los ${visibleCount} más pedidos. En todo el catálogo hay ${products.length}.` : `${dice}. ${cuantos} en esta categoría.`;
      }
      productGrid?.mirarPuntas?.();
      if (!animate) return;
      const run = ++filterRun;
      const clearEnter = () => {
        if (run !== filterRun) return;
        products.forEach((product) => product.classList.remove("catalog-enter"));
      };
      entering[entering.length - 1]?.addEventListener("animationend", clearEnter, { once: true });
      window.setTimeout(clearEnter, 780);
    };
    const cambiarCategoria = (cat) => {
      if (cat === categoria) return;
      categoria = cat;
      if (productGrid) productGrid.scrollLeft = 0;
      if (reducedMotion.matches) {
        applyFilter(false);
        return;
      }
      productGrid?.classList.add("is-filtering");
      window.setTimeout(() => applyFilter(true), 160);
    };
    const cabeza = document.createElement("div");
    cabeza.className = "vista-cabeza";
    cabeza.hidden = true;
    cabeza.innerHTML = '<button class="vista-volver" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>Volver al inicio</button><h2 class="vista-titulo" tabindex="-1"></h2><div class="vista-barra"><div class="vista-mandos"><div class="vista-mando vista-chips solo-catalogo" role="radiogroup" aria-labelledby="vista-sub-rotulo"><span id="vista-sub-rotulo">Filtrar por</span>' + [["todas", "Todas"], ...enlacesTienda.map((a) => [a.dataset.filtro, a.textContent.trim()])].map(([valor, texto], i) => `<input class="chip-input" type="radio" name="vista-sub" id="vista-sub-${escapar(valor)}" value="${escapar(valor)}"${i === 0 ? " checked" : ""}><label class="chip" for="vista-sub-${escapar(valor)}">${escapar(texto)}</label>`).join("") + '</div><label class="vista-mando vista-buscar solo-catalogo"><span class="sr-only">Buscar en el catálogo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input class="vista-busca" type="search" placeholder="Buscar un producto" autocomplete="off"></label><label class="vista-mando"><span>Ordenar por</span><select class="vista-orden"><option value="recomendados">Recomendados</option><option value="precio-asc">Precio: de menor a mayor</option><option value="precio-desc">Precio: de mayor a menor</option><option value="nombre">Nombre: de la A a la Z</option></select></label><label class="vista-mando"><span>Mostrar</span><select class="vista-filtro"><option value="todos">Todos</option><option value="disponibles">Solo los disponibles</option></select></label></div><p class="vista-cuenta" aria-hidden="true"></p></div><p class="vista-vacio" role="status" hidden></p>';
    const encabezado = document.querySelector(".catalog .section-heading");
    encabezado?.parentElement.insertBefore(cabeza, encabezado);
    const tituloVista2 = cabeza.querySelector(".vista-titulo");
    const selOrden = cabeza.querySelector(".vista-orden");
    const selFiltro = cabeza.querySelector(".vista-filtro");
    const cuentaVista = cabeza.querySelector(".vista-cuenta");
    const cajaSub = cabeza.querySelector(".vista-chips");
    const campoBusca = cabeza.querySelector(".vista-busca");
    const vacioVista = cabeza.querySelector(".vista-vacio");
    NOMBRES.catalogo = "Todo el catálogo";
    selOrden?.addEventListener("change", () => {
      orden = selOrden.value;
      applyFilter(true);
    });
    selFiltro?.addEventListener("change", () => {
      soloDisponibles = selFiltro.value === "disponibles";
      applyFilter(true);
    });
    cajaSub?.addEventListener("change", (e) => {
      subcategoria = e.target.value;
      applyFilter(true);
    });
    campoBusca?.addEventListener("input", () => {
      busqueda = campoBusca.value;
      applyFilter(false);
    });
    const pintarVista = (cat) => {
      const enVista = cat !== "todos";
      document.body.classList.toggle("is-vista", enVista);
      cabeza.hidden = !enVista;
      cabeza.classList.toggle("es-catalogo", cat === "catalogo");
      if (encabezado) encabezado.hidden = enVista;
      if (enVista) tituloVista2.textContent = NOMBRES[cat] || "Catálogo";
      document.title = enVista ? `${NOMBRES[cat] || "Catálogo"} | El Tradicional` : "El Tradicional | Panadería & Pastelería";
    };
    const esDeTienda = (cat) => cat !== "todos" && cat !== "catalogo";
    const vistaDe = (cat) => esDeTienda(cat) ? "catalogo" : cat;
    const filtroDe = (cat) => esDeTienda(cat) ? cat : "todas";
    const ponerFiltro = (sub) => {
      subcategoria = sub;
      const boton2 = cajaSub?.querySelector(`input[value="${sub}"]`);
      if (boton2) boton2.checked = true;
    };
    const abrirCategoria = (cat, conHistorial = true) => {
      const vista2 = vistaDe(cat);
      puente.ocultarCheckout?.();
      orden = "recomendados";
      soloDisponibles = false;
      if (selOrden) selOrden.value = "recomendados";
      if (selFiltro) selFiltro.value = "todos";
      ponerFiltro(filtroDe(cat));
      busqueda = "";
      if (campoBusca) campoBusca.value = "";
      if (vista2 === categoria) applyFilter(false);
      cambiarCategoria(vista2);
      pintarVista(vista2);
      if (conHistorial) {
        const destino = cat === "todos" ? location.pathname + location.search : "#tienda-" + cat;
        history.pushState({ cat }, "", destino);
      }
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      if (vista2 !== "todos") tituloVista2.focus({ preventScroll: true });
    };
    cajaSub?.addEventListener("change", () => {
      if (categoria !== "catalogo") return;
      history.replaceState(history.state, "", "#tienda-" + (subcategoria === "todas" ? "catalogo" : subcategoria));
    });
    enlacesTienda.forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      grupo?.dispatchEvent(new CustomEvent("soltar"));
      abrirGrupo(false);
      abrirCategoria(a.dataset.filtro);
    }));
    cabeza.querySelector(".vista-volver").addEventListener("click", () => abrirCategoria("todos"));
    document.querySelector('.hero-actions a[href="#catalogo"]')?.addEventListener("click", (e) => {
      e.preventDefault();
      abrirCategoria("catalogo");
    });
    document.querySelector(".nav-grupo-enlace")?.addEventListener("click", (e) => {
      e.preventDefault();
      grupo?.dispatchEvent(new CustomEvent("soltar"));
      abrirGrupo(false);
      abrirCategoria("catalogo");
    });
    const deLaDireccion = () => {
      const m = location.hash.match(/^#tienda-(.+)$/);
      return m && NOMBRES[m[1]] ? m[1] : "todos";
    };
    const pintarRuta = () => {
      const cat = deLaDireccion();
      const vista2 = vistaDe(cat);
      ponerFiltro(filtroDe(cat));
      if (vista2 === categoria) applyFilter(false);
      cambiarCategoria(vista2);
      pintarVista(vista2);
    };
    puente.pintarRuta = pintarRuta;
    window.addEventListener("popstate", () => {
      if (puente.verCheckout?.()) return;
      pintarRuta();
    });
    const deEntrada = deLaDireccion();
    categoria = vistaDe(deEntrada);
    const antes = vistaRecordada();
    if (antes && antes.categoria === categoria) {
      const ordenes = [...selOrden?.options || []].map((o) => o.value);
      if (ordenes.includes(antes.orden)) orden = antes.orden;
      soloDisponibles = antes.soloDisponibles === true;
      if (selOrden) selOrden.value = orden;
      if (selFiltro) selFiltro.value = soloDisponibles ? "disponibles" : "todos";
    }
    ponerFiltro(filtroDe(deEntrada));
    pintarVista(categoria);
    applyFilter();
    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      productGrid?.classList.remove("is-filtering");
      products.forEach((product) => product.classList.remove("catalog-enter"));
    });
  };

  // js/mail.js
  var BUZON = {
    servicio: "service_u77o0ad",
    plantilla: "template_76qhpup",
    clave: "-ftq8owbv8TlMmxV8"
  };
  var buzonListo = () => Boolean(BUZON.servicio && BUZON.plantilla && BUZON.clave);
  var enviarCorreo = async (para, nombre, asunto, cuerpo) => {
    if (!buzonListo()) return false;
    try {
      const r = await window.fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: BUZON.servicio,
          template_id: BUZON.plantilla,
          user_id: BUZON.clave,
          template_params: { a_correo: para, a_nombre: nombre, asunto, cuerpo }
        })
      });
      return r.ok;
    } catch (e) {
      return false;
    }
  };

  // js/checkout.js
  var piezasDePago = () => ({
    aviso: '<p class="pago-demo"><strong>Esto es una demostración.</strong> Es un proyecto de clase: no se procesa ningún cobro real y los datos de la tarjeta no se guardan ni se envían.</p>',
    metodos: '<fieldset class="canasta-entrega pago-metodos"><legend>¿Cómo quieres pagar?</legend><div class="canasta-opciones"><label><input type="radio" name="canasta-metodo" value="efectivo" checked><span>Efectivo</span></label><label><input type="radio" name="canasta-metodo" value="tarjeta"><span>Tarjeta</span></label></div></fieldset><div class="pago-detalle" data-detalle="efectivo"><p class="pago-dato pago-efectivo">Pagas al retirar el pedido.</p></div><div class="pago-detalle" data-detalle="tarjeta" hidden><p class="pago-prueba">Tarjeta de prueba: <strong>4242 4242 4242 4242</strong>, cualquier vencimiento futuro y CVV 123. No escribas una tarjeta de verdad.</p><div class="pago-campo"><label for="pago-numero">Número de la tarjeta</label><input id="pago-numero" type="text" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="19" aria-describedby="pago-numero-error"><p class="pago-campo-error" id="pago-numero-error" hidden></p></div><div class="pago-fila"><div class="pago-campo"><label for="pago-vence">Vencimiento</label><input id="pago-vence" type="text" inputmode="numeric" autocomplete="off" placeholder="MM/AA" maxlength="5" aria-describedby="pago-vence-error"><p class="pago-campo-error" id="pago-vence-error" hidden></p></div><div class="pago-campo"><label for="pago-cvv">CVV</label><input id="pago-cvv" type="text" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="3" aria-describedby="pago-cvv-error"><p class="pago-campo-error" id="pago-cvv-error" hidden></p></div></div><div class="pago-campo"><label for="pago-titular">Nombre del titular</label><input id="pago-titular" type="text" autocomplete="off" placeholder="Como aparece en la tarjeta" maxlength="60" aria-describedby="pago-titular-error"><p class="pago-campo-error" id="pago-titular-error" hidden></p></div></div>',
    // A nombre de quien va la factura. Lo normal es que sea de quien pide, asi que
    // eso viene marcado y no hay nada que rellenar; los campos aparecen solo al
    // decir que va a otro nombre, que es el caso de comprar para una oficina o de
    // que pague un familiar.
    factura: '<fieldset class="canasta-entrega factura-bloque"><legend>Datos para la factura</legend><div class="canasta-opciones"><label><input type="radio" name="canasta-factura" value="mi" checked><span>A mi nombre</span></label><label><input type="radio" name="canasta-factura" value="otro"><span>A nombre de otra persona</span></label></div><div class="factura-mia"><p class="factura-dato"><strong class="factura-mi-nombre"></strong><br><span class="factura-mi-correo"></span></p><p class="factura-nota">Son los datos de tu cuenta. Si te falta la cédula o el RUC, elige la otra opción y escríbelos.</p></div><div class="factura-otra" hidden><div class="pago-campo"><label for="factura-nombre">Nombre o razón social</label><input id="factura-nombre" type="text" autocomplete="off" maxlength="80" placeholder="A quién se le factura" aria-describedby="factura-nombre-error"><p class="pago-campo-error" id="factura-nombre-error" hidden></p></div><div class="pago-campo"><label for="factura-ident">Cédula o RUC</label><input id="factura-ident" type="text" inputmode="numeric" autocomplete="off" maxlength="13" placeholder="10 dígitos, o 13 si es RUC" aria-describedby="factura-ident-error"><p class="pago-campo-error" id="factura-ident-error" hidden></p></div><div class="pago-campo"><label for="factura-correo">Correo para enviarle la factura <small>(opcional)</small></label><input id="factura-correo" type="email" autocomplete="off" maxlength="120" placeholder="Si se la quieres hacer llegar a esa persona"></div><div class="pago-campo"><label for="factura-dir">Dirección <small>(opcional)</small></label><input id="factura-dir" type="text" autocomplete="off" maxlength="160" placeholder="La que debe constar en la factura"></div><p class="factura-nota">El comprobante del pedido sigue llegando a tu correo; esto es solo a nombre de quién sale la factura.</p></div></fieldset>',
    canal: '<div class="pago-canal"><h3 class="pago-canal-titulo">Dónde te llega el comprobante</h3><p class="pago-canal-dato">A <strong class="pago-canal-correo"></strong>, el correo verificado de tu cuenta.</p></div>',
    pie: '<div class="canasta-pie"><p class="canasta-aviso pago-error" role="alert" hidden></p><button class="button button-yellow canasta-pagar" type="button">Confirmar el pedido</button><p class="canasta-nota">Simulación académica: no se cobra ni un centavo.</p></div>'
  });
  var comprobanteHtml = () => '<div class="checkout-recibo"><div class="recibo-cuerpo"><p class="recibo-sello"><span aria-hidden="true">✓</span> Pedido registrado</p><p class="recibo-simulado">Pedido simulado. Es una demostración académica: no se realizó ningún cobro y la panadería todavía no ha recibido nada.</p><dl class="recibo-datos"><div><dt>Número de pedido</dt><dd><span class="recibo-numero">ET-0000</span><button class="recibo-copiar" type="button">Copiar</button></dd></div><div><dt>Subtotal</dt><dd class="recibo-subtotal">$0.00</dd></div><div><dt>Envío</dt><dd class="recibo-envio">Gratis</dd></div><div><dt>Total</dt><dd class="recibo-total">$0.00</dd></div><div><dt>Pago</dt><dd class="recibo-metodo"></dd></div><div><dt>Entrega</dt><dd class="recibo-modo"></dd></div><div><dt>Factura</dt><dd class="recibo-factura"></dd></div><div class="recibo-linea-dir" hidden><dt>Dirección</dt><dd class="recibo-direccion"></dd></div><div class="recibo-linea-notas" hidden><dt>Indicaciones</dt><dd class="recibo-notas"></dd></div></dl><h3 class="recibo-titulo">Lo que pediste</h3><ul class="recibo-lista"></ul></div><div class="codigo-falso recibo-enviado"><p class="codigo-falso-de recibo-enviado-de"></p><p class="codigo-falso-texto recibo-enviado-texto"></p></div><p class="recibo-simulado recibo-envio-estado" role="status"></p><div class="recibo-pie"><p class="recibo-copiado" role="status" hidden></p><button class="button button-yellow canasta-listo" type="button">Listo, cerrar</button><p class="canasta-nota">Apunta o copia el número antes de cerrar: al cerrar, el pedido queda cumplido y la canasta se vacía.</p></div></div>';
  var panel = null;
  var metodos = [];
  var detalles = [];
  var camposTarjeta = [];
  var pagoEfectivo = null;
  var pagar = null;
  var errorPago = null;
  var canalCorreo = null;
  var reciboEnviadoDe = null;
  var reciboEnviadoTexto = null;
  var reciboEnvioEstado = null;
  var reciboCopiar = null;
  var reciboCopiado = null;
  var facturaRadios = [];
  var facturaCampos = [];
  var facturaMia = null;
  var facturaOtra = null;
  var facturaAOtro = () => facturaRadios.find((r) => r.checked)?.value === "otro";
  var revisarFactura = () => {
    const fallos = {};
    if (!facturaAOtro()) return fallos;
    if (!factura.nombre) fallos.nombre = "Escribe a nombre de quién va la factura.";
    const digitos = factura.ident.replace(/\D/g, "");
    if (!digitos) fallos.ident = "Escribe la cédula o el RUC.";
    else if (digitos.length !== 10 && digitos.length !== 13) {
      fallos.ident = "La cédula tiene 10 dígitos y el RUC 13.";
    } else if (Number(digitos.slice(0, 2)) < 1 || Number(digitos.slice(0, 2)) > 24) {
      fallos.ident = "Los dos primeros dígitos no son de una provincia del Ecuador.";
    }
    return fallos;
  };
  var tocadosFactura = /* @__PURE__ */ new Set();
  var intentadoFactura = false;
  var pintarFactura = () => {
    const aOtro = facturaAOtro();
    factura.aOtro = aOtro;
    if (facturaMia) facturaMia.hidden = aOtro;
    if (facturaOtra) facturaOtra.hidden = !aOtro;
    const nombreMio = panel?.querySelector(".factura-mi-nombre");
    const correoMio = panel?.querySelector(".factura-mi-correo");
    if (nombreMio) nombreMio.textContent = sesion.nombre || "Tu nombre";
    if (correoMio) correoMio.textContent = sesion.correo;
    const fallos = revisarFactura();
    facturaCampos.forEach(({ clave, input, error }) => {
      const mal = fallos[clave] && (intentadoFactura || tocadosFactura.has(clave));
      error.hidden = !mal;
      error.textContent = mal ? fallos[clave] : "";
      input.setAttribute("aria-invalid", String(Boolean(mal)));
    });
    return fallos;
  };
  var olvidarFactura = () => {
    factura.aOtro = false;
    factura.nombre = "";
    factura.ident = "";
    factura.correo = "";
    factura.direccion = "";
    facturaRadios.forEach((r) => {
      r.checked = r.value === "mi";
    });
    facturaCampos.forEach(({ input, error }) => {
      input.value = "";
      error.hidden = true;
      input.removeAttribute("aria-invalid");
    });
    tocadosFactura.clear();
    intentadoFactura = false;
    pintarFactura();
  };
  var cargarFactura = () => {
    facturaRadios.forEach((r) => {
      r.checked = r.value === (factura.aOtro ? "otro" : "mi");
    });
    facturaCampos.forEach(({ clave, input }) => {
      input.value = factura[clave];
    });
    const correo = panel?.querySelector("#factura-correo");
    const dir = panel?.querySelector("#factura-dir");
    if (correo) correo.value = factura.correo;
    if (dir) dir.value = factura.direccion;
    pintarFactura();
  };
  var facturaTexto = () => factura.aOtro ? `${factura.nombre} · ${factura.ident.replace(/\D/g, "")}` : "A tu nombre";
  var METODOS = { efectivo: "Efectivo", tarjeta: "Tarjeta" };
  var metodoActual = () => metodos.find((m) => m.checked)?.value || "efectivo";
  var procesando = false;
  var temporizador = 0;
  var pintarPago = () => {
    const metodo = metodoActual();
    pagoEfectivo.textContent = entrega.modo === "domicilio" ? "Pagas en efectivo al recibir el pedido en tu puerta." : "Pagas en efectivo al retirar el pedido en el local.";
    detalles.forEach((d) => {
      d.hidden = d.dataset.detalle !== metodo;
    });
    if (canalCorreo) canalCorreo.textContent = sesion.correo;
    pintarFactura();
    if (procesando) return;
    const vacia = pedido.size === 0;
    pagar.disabled = vacia;
    pagar.setAttribute("aria-disabled", String(vacia));
    if (vacia) {
      pagar.textContent = "Tu canasta está vacía";
      return;
    }
    pagar.textContent = metodo === "efectivo" ? `Confirmar el pedido · ${dinero(total())}` : `Pagar ${dinero(total())}`;
  };
  var luhn = (digitos) => {
    let suma = 0;
    let doble = false;
    for (let i = digitos.length - 1; i >= 0; i -= 1) {
      let n = Number(digitos[i]);
      if (doble) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      suma += n;
      doble = !doble;
    }
    return digitos.length > 0 && suma % 10 === 0;
  };
  var tocados = /* @__PURE__ */ new Set();
  var intentado = false;
  var fallosTarjeta = () => {
    const fallos = {};
    const num = tarjeta.numero.replace(/\D/g, "");
    if (num.length < 16) fallos.numero = "Faltan dígitos: son 16.";
    else if (!luhn(num)) fallos.numero = "Ese número no es válido. Prueba con 4242 4242 4242 4242.";
    const partes = /^(\d{2})\/(\d{2})$/.exec(tarjeta.vence);
    if (!partes) fallos.vence = "Escríbelo como MM/AA.";
    else {
      const mes = Number(partes[1]);
      const anio = 2e3 + Number(partes[2]);
      const hoy = /* @__PURE__ */ new Date();
      if (mes < 1 || mes > 12) fallos.vence = "El mes va entre 01 y 12.";
      else if (anio < hoy.getFullYear() || anio === hoy.getFullYear() && mes < hoy.getMonth() + 1) fallos.vence = "Esa tarjeta ya venció.";
    }
    if (!/^\d{3}$/.test(tarjeta.cvv)) fallos.cvv = "Son los 3 dígitos del reverso.";
    if (tarjeta.titular.length < 3) fallos.titular = "Escribe el nombre del titular.";
    return fallos;
  };
  var pintarTarjeta = () => {
    const fallos = fallosTarjeta();
    camposTarjeta.forEach(({ clave, input, error }) => {
      const texto = intentado || tocados.has(clave) ? fallos[clave] : "";
      error.hidden = !texto;
      error.textContent = texto || "";
      input.setAttribute("aria-invalid", texto ? "true" : "false");
      input.classList.toggle("is-mal", Boolean(texto));
    });
    return fallos;
  };
  var reformatear = (input, agrupar) => {
    const corte = input.selectionStart === null ? input.value.length : input.selectionStart;
    const antes = input.value.slice(0, corte).replace(/\D/g, "").length;
    input.value = agrupar(input.value.replace(/\D/g, ""));
    let pos = 0;
    let vistos = 0;
    while (pos < input.value.length && vistos < antes) {
      if (/\d/.test(input.value[pos])) vistos += 1;
      pos += 1;
    }
    try {
      input.setSelectionRange(pos, pos);
    } catch (e) {
    }
  };
  var grupos4 = (d) => d.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  var mmaa = (d) => d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d;
  var olvidarTarjeta = () => {
    camposTarjeta.forEach(({ clave, input }) => {
      tarjeta[clave] = "";
      input.value = "";
    });
    tocados.clear();
    intentado = false;
    pintarTarjeta();
    errorPago.hidden = true;
  };
  var respaldoCopiar = (texto) => {
    const temporal = document.createElement("textarea");
    temporal.value = texto;
    temporal.setAttribute("readonly", "");
    temporal.style.cssText = "position:fixed;top:-100px;opacity:0";
    document.body.append(temporal);
    temporal.select();
    let hecho;
    try {
      hecho = document.execCommand("copy");
    } catch (e) {
      hecho = false;
    }
    temporal.remove();
    return hecho;
  };
  var ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  var numeroDePedido = () => "ET-" + Array.from({ length: 4 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");
  var detalleDe = (metodo) => {
    if (metodo === "efectivo") return entrega.modo === "domicilio" ? "Efectivo al recibir" : "Efectivo al retirar";
    if (metodo === "tarjeta") return `Tarjeta terminada en ${tarjeta.numero.replace(/\D/g, "").slice(-4)}`;
    return METODOS[metodo];
  };
  var pintarComprobante = () => {
    panel.querySelector(".recibo-numero").textContent = cobro.numero;
    panel.querySelector(".recibo-subtotal").textContent = dinero(subtotal());
    panel.querySelector(".recibo-envio").textContent = envio() ? dinero(envio()) : "Gratis";
    panel.querySelector(".recibo-total").textContent = dinero(total());
    panel.querySelector(".recibo-metodo").textContent = cobro.detalle;
    panel.querySelector(".recibo-modo").textContent = entrega.modo === "domicilio" ? "A domicilio" : "Paso retirando por el local";
    panel.querySelector(".recibo-factura").textContent = facturaTexto();
    panel.querySelector(".recibo-linea-dir").hidden = entrega.modo !== "domicilio";
    panel.querySelector(".recibo-direccion").textContent = direccionEntera();
    panel.querySelector(".recibo-linea-notas").hidden = entrega.modo !== "domicilio" || !entrega.notas;
    panel.querySelector(".recibo-notas").textContent = entrega.notas;
    const recibo = panel.querySelector(".recibo-lista");
    recibo.textContent = "";
    for (const l of pedido.values()) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${l.cantidad} × ${l.nombre}</span><span>${dinero(l.precio * l.cantidad)}</span>`;
      recibo.append(li);
    }
    reciboEnviadoDe.textContent = `Correo de El Tradicional · para ${sesion.correo}`;
    reciboEnviadoTexto.textContent = saludoComprobante();
  };
  var saludoComprobante = () => `Hola ${sesion.nombre.split(" ")[0]}: tu pedido ${cobro.numero} quedó registrado por ${dinero(total())}. ${entrega.modo === "domicilio" ? "Te lo llevamos a " + direccionEntera() : "Pasa a retirarlo por el local"}. Gracias por comprar en El Tradicional.`;
  var cuerpoComprobante = () => {
    const lineas = [...pedido.values()].map((l) => `  ${l.cantidad} × ${l.nombre} — ${dinero(l.precio * l.cantidad)}`);
    return [
      saludoComprobante(),
      "",
      "LO QUE PEDISTE",
      ...lineas,
      "",
      `Subtotal: ${dinero(subtotal())}`,
      `Envío: ${envio() ? dinero(envio()) : "Gratis"}`,
      `Total: ${dinero(total())}`,
      `Pago: ${cobro.detalle}`,
      `Factura: ${facturaTexto()}`,
      ...factura.aOtro && factura.direccion ? [`Dirección de la factura: ${factura.direccion}`] : [],
      `Entrega: ${entrega.modo === "domicilio" ? "A domicilio — " + direccionEntera() : "Paso retirando por el local"}`,
      // Quien reparte lee esto antes de bajarse de la moto, asi que va en su
      // propia linea y no pegado a la direccion.
      ...entrega.modo === "domicilio" && entrega.notas ? [`Indicaciones: ${entrega.notas}`] : [],
      `Te llamamos al ${telefonoLargo(sesion.telefono)} si hace falta.`,
      "",
      "Este pedido es parte de un proyecto académico: el cobro está simulado y",
      "no se descontó ningún dinero. El correo, en cambio, es real."
    ].join("\n");
  };
  var restablecerPagar = () => {
    procesando = false;
    panel.classList.remove("is-procesando");
    pagar.disabled = false;
    pagar.removeAttribute("aria-disabled");
    pintarPago();
  };
  var cancelarProceso = () => {
    if (temporizador) {
      window.clearTimeout(temporizador);
      temporizador = 0;
    }
  };
  var limpiarCopiados = () => {
    if (reciboCopiado) reciboCopiado.hidden = true;
  };
  var elegirMetodo = (valor) => {
    metodos.forEach((m) => {
      m.checked = m.value === valor;
    });
    if (pagoEfectivo) pintarPago();
  };
  puente.elegirMetodo = elegirMetodo;
  var reiniciarMetodo = () => {
    elegirMetodo(sesion.dentro ? sesion.metodo : "efectivo");
  };
  var mandarComprobante = async () => {
    const decir = (texto, bien2) => {
      reciboEnvioEstado.textContent = texto;
      reciboEnvioEstado.classList.toggle("is-bien", Boolean(bien2));
    };
    if (!buzonListo()) {
      decir("Mensaje simulado: el envío de correo no está configurado en esta copia del sitio, así que no salió nada. El recuadro de arriba es el mensaje que habría llegado.");
      return;
    }
    const numero = cobro.numero;
    const para = sesion.correo;
    decir("Enviando el comprobante a tu correo…");
    const bien = await enviarCorreo(
      para,
      sesion.nombre,
      `Pedido ${numero} · El Tradicional`,
      cuerpoComprobante()
    );
    if (cobro.numero !== numero) return;
    decir(bien ? `Comprobante enviado a ${para}. Si no lo ves, mira en la carpeta de spam.` : `No se pudo enviar el correo (puede ser la red o la cuota del mes). Tu pedido quedó registrado igual: apunta el número ${numero}.`, bien);
  };
  var aprobar = (metodo) => {
    procesando = false;
    cobro.metodo = metodo;
    cobro.numero = numeroDePedido();
    cobro.detalle = detalleDe(metodo);
    pintarComprobante();
    mandarComprobante();
    guardarPedido({
      numero: cobro.numero,
      fecha: (/* @__PURE__ */ new Date()).toISOString(),
      modo: entrega.modo,
      direccion: entrega.modo === "domicilio" ? direccionEntera() : "",
      metodo: cobro.detalle,
      subtotal: subtotal(),
      envio: envio(),
      total: total(),
      lineas: [...pedido].map(([id, l]) => ({
        id,
        nombre: l.nombre,
        precio: l.precio,
        cantidad: l.cantidad
      }))
    });
    puente.borrarGuardado();
    puente.vaciarContador();
    olvidarTarjeta();
    olvidarFactura();
    restablecerPagar();
    puente.verComprobante();
    avisos.textContent = `Pago aprobado. Pedido ${cobro.numero}. Es una simulación: no se cobró nada.`;
  };
  var montarPago = (elPanel) => {
    panel = elPanel;
    metodos = [...panel.querySelectorAll('input[name="canasta-metodo"]')];
    detalles = [...panel.querySelectorAll(".pago-detalle")];
    pagoEfectivo = panel.querySelector(".pago-efectivo");
    pagar = panel.querySelector(".canasta-pagar");
    errorPago = panel.querySelector(".pago-error");
    canalCorreo = panel.querySelector(".pago-canal-correo");
    reciboEnviadoDe = panel.querySelector(".recibo-enviado-de");
    reciboEnviadoTexto = panel.querySelector(".recibo-enviado-texto");
    reciboEnvioEstado = panel.querySelector(".recibo-envio-estado");
    reciboCopiar = panel.querySelector(".recibo-copiar");
    reciboCopiado = panel.querySelector(".recibo-copiado");
    facturaRadios = [...panel.querySelectorAll('input[name="canasta-factura"]')];
    facturaMia = panel.querySelector(".factura-mia");
    facturaOtra = panel.querySelector(".factura-otra");
    facturaCampos = [
      { clave: "nombre", nombre: "el nombre", input: panel.querySelector("#factura-nombre"), error: panel.querySelector("#factura-nombre-error") },
      { clave: "ident", nombre: "la cédula o el RUC", input: panel.querySelector("#factura-ident"), error: panel.querySelector("#factura-ident-error") }
    ];
    const facturaCorreo = panel.querySelector("#factura-correo");
    const facturaDir = panel.querySelector("#factura-dir");
    facturaRadios.forEach((r) => r.addEventListener("change", () => {
      if (!r.checked) return;
      errorPago.hidden = true;
      intentadoFactura = false;
      tocadosFactura.clear();
      pintarFactura();
      puente.guardar?.();
      if (facturaAOtro()) facturaCampos[0].input.focus();
    }));
    facturaCampos.forEach(({ clave, input }) => {
      input.addEventListener("input", () => {
        if (clave === "ident") input.value = input.value.replace(/\D/g, "").slice(0, 13);
        factura[clave] = input.value.trim().slice(0, clave === "nombre" ? 80 : 13);
        pintarFactura();
        puente.guardar?.();
      });
      input.addEventListener("blur", () => {
        tocadosFactura.add(clave);
        pintarFactura();
      });
    });
    facturaCorreo?.addEventListener("input", () => {
      factura.correo = facturaCorreo.value.trim().slice(0, 120);
      puente.guardar?.();
    });
    facturaDir?.addEventListener("input", () => {
      factura.direccion = facturaDir.value.trim().slice(0, 160);
      puente.guardar?.();
    });
    camposTarjeta = [
      { clave: "numero", nombre: "el número", input: panel.querySelector("#pago-numero"), error: panel.querySelector("#pago-numero-error") },
      { clave: "vence", nombre: "el vencimiento", input: panel.querySelector("#pago-vence"), error: panel.querySelector("#pago-vence-error") },
      { clave: "cvv", nombre: "el CVV", input: panel.querySelector("#pago-cvv"), error: panel.querySelector("#pago-cvv-error") },
      { clave: "titular", nombre: "el titular", input: panel.querySelector("#pago-titular"), error: panel.querySelector("#pago-titular-error") }
    ];
    camposTarjeta.forEach(({ clave, input }) => {
      input.addEventListener("input", () => {
        if (clave === "numero") reformatear(input, grupos4);
        if (clave === "vence") reformatear(input, mmaa);
        if (clave === "cvv") reformatear(input, (d) => d.slice(0, 3));
        tarjeta[clave] = clave === "titular" ? input.value.trim().slice(0, 60) : input.value;
        pintarTarjeta();
      });
      input.addEventListener("blur", () => {
        tocados.add(clave);
        pintarTarjeta();
      });
    });
    metodos.forEach((m) => m.addEventListener("change", () => {
      if (!m.checked) return;
      errorPago.hidden = true;
      pintarPago();
    }));
    reciboCopiar.addEventListener("click", async () => {
      const texto = panel.querySelector(".recibo-numero").textContent.trim();
      let hecho;
      try {
        if (!navigator.clipboard) throw new Error("sin portapapeles");
        await navigator.clipboard.writeText(texto);
        hecho = true;
      } catch (e) {
        hecho = respaldoCopiar(texto);
      }
      reciboCopiado.hidden = false;
      reciboCopiado.textContent = hecho ? `Número ${texto} copiado.` : `No se pudo copiar; apunta el ${texto} a mano.`;
    });
    pagar.addEventListener("click", () => {
      if (procesando || !pedido.size) return;
      if (puente.faltaDireccion()) return;
      intentadoFactura = true;
      const malFactura = pintarFactura();
      const faltaFactura = facturaCampos.filter(({ clave }) => malFactura[clave]);
      if (faltaFactura.length) {
        errorPago.hidden = false;
        errorPago.textContent = `Para la factura, revisa ${faltaFactura.map((c) => c.nombre).join(" y ")}.`;
        faltaFactura[0].input.focus();
        return;
      }
      const metodo = metodoActual();
      if (metodo === "tarjeta") {
        intentado = true;
        const fallos = pintarTarjeta();
        const faltan = camposTarjeta.filter(({ clave }) => fallos[clave]);
        if (faltan.length) {
          errorPago.hidden = false;
          errorPago.textContent = `Revisa ${faltan.map((c) => c.nombre).join(", ")} de la tarjeta.`;
          faltan[0].input.focus();
          return;
        }
      }
      errorPago.hidden = true;
      procesando = true;
      panel.classList.add("is-procesando");
      pagar.innerHTML = '<span class="pago-girando" aria-hidden="true"></span> Procesando el pago…';
      pagar.disabled = true;
      pagar.setAttribute("aria-disabled", "true");
      puente.enfocarTitulo();
      avisos.textContent = "Procesando el pago…";
      temporizador = window.setTimeout(() => {
        temporizador = 0;
        aprobar(metodo);
      }, 1500);
    });
  };

  // js/cart.js
  var leerGuardado = () => {
    try {
      const crudo = window.localStorage.getItem(CLAVE);
      if (!crudo) return;
      const dato = JSON.parse(crudo);
      const lineas = Array.isArray(dato) ? dato : dato.lineas || [];
      lineas.forEach((l) => {
        if (l && l.id && l.nombre && l.cantidad > 0) pedido.set(l.id, { nombre: l.nombre, precio: Number(l.precio) || 0, cantidad: Math.min(l.cantidad, MAX_UNIDADES) });
      });
      if (!Array.isArray(dato)) {
        if (dato.modo === "domicilio") entrega.modo = "domicilio";
        if (typeof dato.direccion === "string") entrega.direccion = dato.direccion.slice(0, 200);
        if (typeof dato.piso === "string") entrega.piso = dato.piso.slice(0, 120);
        if (typeof dato.referencia === "string") entrega.referencia = dato.referencia.slice(0, 200);
        if (typeof dato.notas === "string") entrega.notas = dato.notas.slice(0, 300);
        const f = dato.factura;
        if (f && typeof f === "object") {
          factura.aOtro = f.aOtro === true;
          if (typeof f.nombre === "string") factura.nombre = f.nombre.slice(0, 80);
          if (typeof f.ident === "string") factura.ident = f.ident.replace(/\D/g, "").slice(0, 13);
          if (typeof f.correo === "string") factura.correo = f.correo.slice(0, 120);
          if (typeof f.direccion === "string") factura.direccion = f.direccion.slice(0, 160);
        }
      }
    } catch (e) {
    }
  };
  var guardar = () => {
    const cuando = marcarActualizacion();
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify({
        lineas: [...pedido].map(([id, l]) => ({ id, ...l })),
        modo: entrega.modo,
        direccion: entrega.direccion,
        piso: entrega.piso,
        referencia: entrega.referencia,
        notas: entrega.notas,
        factura: { ...factura },
        guardado: cuando.toISOString()
      }));
    } catch (e) {
    }
    puente.pintarGuardado?.(cuando);
  };
  var borrarGuardado = () => {
    try {
      window.localStorage.removeItem(CLAVE);
    } catch (e) {
    }
    olvidarMarca();
    puente.pintarGuardado?.(null);
  };
  var fondo = document.createElement("div");
  fondo.className = "canasta-fondo";
  var panel2 = document.createElement("aside");
  panel2.className = "canasta-panel";
  panel2.setAttribute("role", "dialog");
  panel2.setAttribute("aria-modal", "true");
  panel2.setAttribute("aria-labelledby", "canasta-titulo");
  var piezas = piezasDePago();
  panel2.innerHTML = '<div class="canasta-cabecera"><div class="canasta-cabecera-titulo"><h2 id="canasta-titulo" tabindex="-1">Tu canasta</h2><span class="canasta-cabecera-cuenta" hidden></span></div><button class="canasta-cerrar" type="button" aria-label="Cerrar la canasta">×</button></div><div class="canasta-pasos"><section class="canasta-paso" data-paso="canasta"><div class="canasta-cuerpo"><ul class="canasta-lista"></ul><div class="canasta-vacio"><span class="canasta-vacio-dibujo" aria-hidden="true"></span><p class="canasta-vacio-titulo">Tu canasta está vacía</p><p class="canasta-vacio-dicho">Elige algo de la vitrina y aparecerá aquí.</p><button class="canasta-vacio-ir" type="button">Ver la vitrina</button></div><div class="canasta-vaciar-zona" hidden><button class="canasta-vaciar" type="button">Vaciar la canasta</button><div class="canasta-vaciar-pregunta" hidden><p class="canasta-confirma-dicho">¿Quitamos todo lo que hay en la canasta?</p><div class="canasta-confirma"><button class="canasta-confirma-si canasta-vaciar-si" type="button">Sí, vaciar</button><button class="canasta-confirma-no canasta-vaciar-no" type="button">Cancelar</button></div></div></div></div><div class="canasta-pie"><div class="canasta-total"><span>Subtotal <small class="canasta-total-cuenta"></small></span><strong>$0.00</strong></div><button class="button button-yellow canasta-enviar" type="button">Ir a pagar <span aria-hidden="true">→</span></button><p class="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p></div></section></div><div class="pide-cuenta" role="alertdialog" aria-modal="true" aria-labelledby="pide-cuenta-titulo" aria-describedby="pide-cuenta-dicho" hidden><div class="pide-cuenta-hoja"><span class="pide-cuenta-dibujo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="12" cy="8.2" r="3.6"/><path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/></svg></span><h3 id="pide-cuenta-titulo">Entra a tu cuenta para pagar</h3><p id="pide-cuenta-dicho">El comprobante del pedido te llega al correo, así que necesitas una cuenta con el correo verificado. <strong>Tu canasta se queda tal como está.</strong></p><button class="button button-yellow pide-cuenta-principal" type="button"></button><button class="pide-cuenta-otra" type="button"></button><button class="pide-cuenta-volver" type="button">Seguir viendo la canasta</button></div></div>';
  var vista = document.createElement("section");
  vista.id = "confirmar";
  vista.className = "checkout section-pad";
  vista.hidden = true;
  vista.innerHTML = '<div class="container"><div class="vista-cabeza checkout-cabeza"><button class="vista-volver checkout-volver" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>Volver a la tienda</button><h2 class="vista-titulo checkout-titulo" tabindex="-1">Confirmar el pedido</h2></div><div class="checkout-paso" data-checkout="pedido"><div class="checkout-grid"><div class="checkout-datos">' + piezas.aviso + '<fieldset class="canasta-entrega"><legend>¿Cómo lo quieres?</legend><div class="canasta-opciones"><label><input type="radio" name="canasta-entrega" value="retiro" checked><span>Paso retirando<small>Gratis</small></span></label><label><input type="radio" name="canasta-entrega" value="domicilio"><span>A domicilio<small>' + dinero(ENVIO) + '</small></span></label></div><div class="canasta-local"><p class="canasta-local-titulo">Esquina de Eloy Alfaro y Gabriel Espinosa</p><p class="canasta-local-dato">Tena, Napo. Te esperamos en el mostrador.</p><a class="mapa-ruta" href="https://www.google.com/maps/dir/?api=1&destination=-1.004033,-77.812690" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21.4c0 0-6.6-5.3-6.6-10.1a6.6 6.6 0 0 1 13.2 0c0 4.8-6.6 10.1-6.6 10.1Z"/><circle cx="12" cy="11" r="2.4"/></svg>Cómo llegar <span aria-hidden="true">↗</span><span class="sr-only"> (abre en una pestaña nueva)</span></a><p class="canasta-local-hora"></p></div><div class="canasta-direccion" hidden><label for="canasta-dir">¿A dónde lo llevamos?</label><input id="canasta-dir" type="text" autocomplete="street-address" placeholder="Calle, número y barrio"><p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p><div class="dir-detalle"><div><label for="canasta-piso">Piso, departamento u oficina</label><input id="canasta-piso" type="text" autocomplete="address-line2" placeholder="Torre B, piso 3, dpto. 302"></div><div><label for="canasta-ref">Una referencia para encontrarlo</label><input id="canasta-ref" type="text" placeholder="Portón verde, frente a la cancha"></div></div><label for="canasta-notas">Indicaciones para quien entrega <small>(opcional)</small></label><textarea id="canasta-notas" rows="2" maxlength="300" placeholder="Timbre dañado, llamar al llegar. Hay perro."></textarea></div></fieldset>' + piezas.metodos + piezas.factura + '</div><aside class="checkout-resumen"><div class="pedido-resumen"><div class="resumen-cabeza"><h3 class="recibo-titulo">Tu pedido</h3><p class="resumen-cuenta"></p></div><ul class="recibo-lista resumen-lista"></ul><button class="resumen-editar" type="button">Editar la canasta</button></div><dl class="canasta-desglose"><div><dt>Subtotal</dt><dd class="desglose-subtotal">$0.00</dd></div><div><dt>Envío</dt><dd class="desglose-envio">Gratis</dd></div><div class="desglose-suma"><dt>Total</dt><dd class="desglose-total">$0.00</dd></div></dl>' + piezas.canal + piezas.pie + '</aside></div></div><div class="checkout-paso" data-checkout="comprobante" hidden>' + comprobanteHtml() + "</div></div>";
  document.querySelector("#contenido")?.append(vista);
  var barraDeshacer = document.createElement("div");
  barraDeshacer.className = "deshacer-barra";
  barraDeshacer.hidden = true;
  barraDeshacer.innerHTML = '<p class="deshacer-texto"></p><button class="deshacer-boton" type="button">Deshacer</button>';
  var deshacerTexto = barraDeshacer.querySelector(".deshacer-texto");
  var deshacerBoton = barraDeshacer.querySelector(".deshacer-boton");
  anexosDeFoco.add(barraDeshacer);
  document.body.append(fondo, panel2, barraDeshacer);
  var titulo = panel2.querySelector("#canasta-titulo");
  var lista = panel2.querySelector(".canasta-lista");
  var vacio = panel2.querySelector(".canasta-vacio");
  var totalEl = panel2.querySelector('[data-paso="canasta"] .canasta-total strong');
  var totalCuenta = panel2.querySelector(".canasta-total-cuenta");
  var cabeceraCuenta = panel2.querySelector(".canasta-cabecera-cuenta");
  var enviar = panel2.querySelector(".canasta-enviar");
  var radios = [...vista.querySelectorAll('input[name="canasta-entrega"]')];
  var bloqueDir = vista.querySelector(".canasta-direccion");
  var campoDir = vista.querySelector("#canasta-dir");
  var campoPiso = vista.querySelector("#canasta-piso");
  var campoRef = vista.querySelector("#canasta-ref");
  var campoNotas = vista.querySelector("#canasta-notas");
  var avisoDir = vista.querySelector(".canasta-direccion .canasta-aviso");
  var resumenLista = vista.querySelector(".resumen-lista");
  var resumenCuenta = vista.querySelector(".resumen-cuenta");
  var resumenEditar = vista.querySelector(".resumen-editar");
  var localHora = vista.querySelector(".canasta-local-hora");
  var desgloseSub = vista.querySelector(".desglose-subtotal");
  var desgloseEnvio = vista.querySelector(".desglose-envio");
  var desgloseTotal = vista.querySelector(".desglose-total");
  var bloqueLocal = vista.querySelector(".canasta-local");
  var pideCuenta = panel2.querySelector(".pide-cuenta");
  var pidePrincipal = panel2.querySelector(".pide-cuenta-principal");
  var pideOtra = panel2.querySelector(".pide-cuenta-otra");
  var listo = vista.querySelector(".canasta-listo");
  var zonaVaciar = panel2.querySelector(".canasta-vaciar-zona");
  var botonVaciar = panel2.querySelector(".canasta-vaciar");
  var preguntaVaciar = panel2.querySelector(".canasta-vaciar-pregunta");
  var boton = document.querySelector(".floating-whatsapp");
  if (boton) boton.dataset.tip = "Tu canasta";
  var cuenta = document.createElement("span");
  cuenta.className = "canasta-cuenta";
  cuenta.hidden = true;
  var refrescos = [];
  var botonesMas = [];
  var BASURERO = '<svg class="card-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.8 7.1h14.4"/><path d="M9.7 7.1V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.8"/><path d="M6.5 7.1l.8 11.3a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11.3"/><path d="M10.3 10.8v5.8"/><path d="M13.7 10.8v5.8"/></svg>';
  var fotos = /* @__PURE__ */ new Map();
  var fotoDe = (nombre) => {
    for (const [base, src] of fotos) {
      if (nombre === base || nombre.startsWith(`${base} `)) return src;
    }
    return "";
  };
  var fotoHtml = (nombre) => {
    const src = fotoDe(nombre);
    return '<span class="canasta-foto">' + (src ? `<img src="${src}" alt="" width="64" height="64" loading="lazy">` : "") + "</span>";
  };
  var latido = () => {
    if (!boton) return;
    boton.classList.remove("is-latido");
    void boton.offsetWidth;
    boton.classList.add("is-latido");
  };
  var volarALaCanasta = (ficha) => {
    const img = ficha.querySelector(".product-image img");
    const destino = boton?.getBoundingClientRect();
    if (reducedMotion.matches || !img || !destino?.width) {
      latido();
      return;
    }
    const origen = img.getBoundingClientRect();
    const lado = 76;
    const bolita = document.createElement("span");
    bolita.className = "vuela-canasta";
    bolita.setAttribute("aria-hidden", "true");
    bolita.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    bolita.style.left = `${origen.left + origen.width / 2 - lado / 2}px`;
    bolita.style.top = `${origen.top + origen.height / 2 - lado / 2}px`;
    document.body.append(bolita);
    const dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
    const dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
    const vuelo = bolita.animate([
      { transform: "translate(0, 0) scale(.6)", opacity: 0 },
      { transform: "translate(0, -24px) scale(1.1)", opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.75)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.7 }
    ], { duration: 750, easing: "cubic-bezier(.45, 0, .55, 1)" });
    vuelo.onfinish = () => {
      bolita.remove();
      latido();
    };
    vuelo.oncancel = () => bolita.remove();
  };
  var porConfirmar = null;
  var preguntoDesde = "[data-menos]";
  var pintar = () => {
    lista.textContent = "";
    for (const [id, l] of pedido) {
      const li = document.createElement("li");
      li.className = "canasta-linea";
      li.dataset.id = id;
      if (id === porConfirmar) {
        li.classList.add("is-confirmando");
        li.innerHTML = fotoHtml(l.nombre) + `<div class="canasta-info"><h3>${l.nombre}</h3><p class="canasta-confirma-dicho">${l.cantidad === 1 ? "¿Lo quitamos de la canasta?" : `¿Quitamos las ${l.cantidad} unidades?`}</p><div class="canasta-confirma"><button class="canasta-confirma-si" type="button" aria-label="Sí, quitar ${l.nombre} de la canasta">Sí, quitar</button><button class="canasta-confirma-no" type="button" aria-label="Cancelar, dejar ${l.nombre} en la canasta">Cancelar</button></div></div>`;
        li.querySelector(".canasta-confirma-si").addEventListener("click", () => confirmarQuitar(id));
        li.querySelector(".canasta-confirma-no").addEventListener("click", () => cancelarQuitar(id));
        li.addEventListener("keydown", (e) => {
          if (e.key !== "Escape") return;
          e.stopPropagation();
          cancelarQuitar(id);
        });
        lista.append(li);
        continue;
      }
      const ultima = l.cantidad === 1;
      li.innerHTML = fotoHtml(l.nombre) + `<div class="canasta-info"><div class="canasta-fila"><h3>${l.nombre}</h3><button class="canasta-quitar" type="button" aria-label="Quitar ${l.nombre} de la canasta" data-tip="Quitar de la canasta">×</button></div><p class="canasta-precio">${dinero(l.precio)} c/u</p><div class="canasta-fila canasta-fila-baja"><div class="canasta-cantidad"><button type="button" data-menos aria-label="${ultima ? `Quitar ${l.nombre} de la canasta` : `Quitar uno de ${l.nombre}`}">${ultima ? BASURERO : "−"}</button><output>${l.cantidad}</output><button type="button" data-mas aria-label="Añadir uno de ${l.nombre}">+</button></div><span class="canasta-subtotal">${dinero(l.precio * l.cantidad)}</span></div></div>`;
      li.querySelector("[data-menos]").addEventListener("click", () => {
        if (l.cantidad === 1) {
          pedirQuitar(id, "[data-menos]");
          return;
        }
        cambiar(id, -1);
      });
      li.querySelector(".canasta-quitar").addEventListener("click", () => pedirQuitar(id, ".canasta-quitar"));
      li.querySelector("[data-mas]").addEventListener("click", () => cambiar(id, 1));
      lista.append(li);
    }
    pintarPie();
  };
  var lineaDe = (id) => [...lista.children].find((li) => li.dataset.id === id);
  var pedirQuitar = (id, desde) => {
    const l = pedido.get(id);
    if (!l) return;
    porConfirmar = id;
    preguntoDesde = desde;
    pintar();
    lineaDe(id)?.querySelector(".canasta-confirma-si")?.focus();
    avisos.textContent = l.cantidad === 1 ? `¿Quitar ${l.nombre} de la canasta?` : `¿Quitar las ${l.cantidad} unidades de ${l.nombre} de la canasta?`;
  };
  var cancelarQuitar = (id) => {
    if (porConfirmar !== id) return;
    porConfirmar = null;
    pintar();
    lineaDe(id)?.querySelector(preguntoDesde)?.focus();
    avisos.textContent = `${pedido.get(id)?.nombre || "El producto"} sigue en la canasta.`;
  };
  var confirmarQuitar = (id) => {
    const l = pedido.get(id);
    porConfirmar = null;
    if (!l) {
      pintar();
      return;
    }
    anotarBorrado(id, { ...l });
    pedido.delete(id);
    pintar();
    avisos.textContent = `Quitaste ${l.nombre}. ${unidades()} producto${unidades() === 1 ? "" : "s"} en la canasta.`;
    deshacerBoton.focus();
  };
  var pintarDesglose = () => {
    bloqueDir.hidden = entrega.modo !== "domicilio";
    if (bloqueLocal) bloqueLocal.hidden = entrega.modo !== "retiro";
    pintarHoraRetiro();
    if (desgloseSub) desgloseSub.textContent = dinero(subtotal());
    if (desgloseEnvio) desgloseEnvio.textContent = envio() ? dinero(envio()) : "Gratis";
    if (desgloseTotal) desgloseTotal.textContent = dinero(total());
  };
  var pintarResumen = () => {
    if (!resumenLista) return;
    resumenLista.textContent = "";
    for (const l of pedido.values()) {
      const li = document.createElement("li");
      const que = document.createElement("span");
      que.textContent = `${l.cantidad} × ${l.nombre}`;
      const cuanto = document.createElement("span");
      cuanto.textContent = dinero(l.precio * l.cantidad);
      li.append(que, cuanto);
      resumenLista.append(li);
    }
    const n = unidades();
    if (resumenCuenta) resumenCuenta.textContent = `${n} producto${n === 1 ? "" : "s"}`;
  };
  var pintarHoraRetiro = () => {
    if (!localHora) return;
    const h = horarioDeHoy();
    if (h.festivo) localHora.textContent = "Hoy no horneamos: es día festivo.";
    else if (h.abierto) localHora.textContent = `Puedes retirarlo hoy hasta las ${h.cierra}.`;
    else if (h.antesDeAbrir) localHora.textContent = `Hoy abrimos a las ${h.abre}.`;
    else localHora.textContent = "Hoy ya cerramos.";
  };
  var pintarPie = () => {
    const hayAlgo = pedido.size > 0;
    vacio.hidden = hayAlgo;
    zonaVaciar.hidden = !hayAlgo;
    totalEl.textContent = dinero(subtotal());
    const cuantos = unidades();
    const cuantosTexto = `${cuantos} producto${cuantos === 1 ? "" : "s"}`;
    totalCuenta.textContent = hayAlgo ? `(${cuantosTexto})` : "";
    cabeceraCuenta.hidden = !hayAlgo;
    cabeceraCuenta.textContent = cuantosTexto;
    enviar.disabled = !hayAlgo;
    enviar.setAttribute("aria-disabled", String(!hayAlgo));
    pintarDesglose();
    const n = unidades();
    cuenta.hidden = n === 0;
    cuenta.textContent = n;
    if (boton) boton.setAttribute("aria-label", n ? `Ver la canasta, ${n} producto${n === 1 ? "" : "s"}` : "Ver la canasta, vacía");
    if (sesion.dentro && sesion.verificado) verPideCuenta(false);
    pintarResumen();
    pintarPago();
    refrescos.forEach((refrescar) => refrescar());
    guardar();
  };
  var RUTAS = { "#confirmar": "pedido", "#comprobante": "comprobante" };
  var TITULOS = { pedido: "Confirmar el pedido", comprobante: "Pedido confirmado" };
  var pasosVista = [...vista.querySelectorAll(".checkout-paso")];
  var tituloVista = vista.querySelector(".checkout-titulo");
  var pasoActual = null;
  var verVista = (paso, mover = true) => {
    pasoActual = paso;
    const dentro = Boolean(paso);
    document.body.classList.toggle("is-checkout", dentro);
    vista.hidden = !dentro;
    pasosVista.forEach((s) => {
      s.hidden = s.dataset.checkout !== paso;
    });
    if (!dentro) return;
    tituloVista.textContent = TITULOS[paso];
    document.title = TITULOS[paso] + " | El Tradicional";
    window.scrollTo({ top: 0, behavior: "auto" });
    if (mover) tituloVista.focus({ preventScroll: true });
  };
  var abrirCheckout = () => {
    if (abierto()) cerrar();
    history.pushState({ checkout: "pedido" }, "", "#confirmar");
    verVista("pedido");
  };
  var verComprobante = () => {
    history.replaceState({ checkout: "comprobante" }, "", "#comprobante");
    verVista("comprobante");
  };
  var recogerCheckout = () => {
    const desdeComprobante = pasoActual === "comprobante";
    cancelarProceso();
    restablecerPagar();
    olvidarTarjeta();
    limpiarCopiados();
    if (!desdeComprobante) return;
    cobro.numero = "";
    olvidarBorrado();
    pedido.clear();
    reiniciarMetodo();
    pintar();
  };
  var cerrarCheckout = () => {
    recogerCheckout();
    history.pushState({}, "", location.pathname + location.search);
    verVista(null);
    puente.pintarRuta?.();
    boton?.focus();
  };
  vista.querySelector(".checkout-volver").addEventListener("click", () => cerrarCheckout());
  listo.addEventListener("click", () => cerrarCheckout());
  puente.verCheckout = () => {
    const paso = RUTAS[location.hash] || null;
    const limpiar = () => {
      recogerCheckout();
      verVista(null);
      history.replaceState({}, "", location.pathname + location.search);
      return false;
    };
    if (!paso) {
      if (pasoActual) {
        recogerCheckout();
        verVista(null);
      }
      return false;
    }
    if (paso === "comprobante" && !cobro.numero) return limpiar();
    if (paso === "pedido" && !pedido.size) return limpiar();
    if (paso !== pasoActual) verVista(paso);
    return true;
  };
  puente.ocultarCheckout = () => {
    if (pasoActual) verVista(null);
  };
  puente.verComprobante = verComprobante;
  radios.forEach((radio) => radio.addEventListener("change", () => {
    if (!radio.checked) return;
    entrega.modo = radio.value === "domicilio" ? "domicilio" : "retiro";
    avisoDir.hidden = true;
    pintarPie();
    if (entrega.modo === "domicilio") campoDir.focus();
  }));
  campoDir.addEventListener("input", () => {
    entrega.direccion = campoDir.value.trim().slice(0, 200);
    if (entrega.direccion) avisoDir.hidden = true;
    pintarPie();
  });
  [[campoPiso, "piso", 120], [campoRef, "referencia", 200], [campoNotas, "notas", 300]].forEach(([campo, llave, tope]) => campo?.addEventListener("input", () => {
    entrega[llave] = campo.value.trim().slice(0, tope);
    guardar();
  }));
  var puedePedir = () => sesion.dentro && sesion.verificado;
  enviar.addEventListener("click", () => {
    if (!pedido.size) return;
    if (!puedePedir()) {
      verPideCuenta(true);
      pidePrincipal.focus();
      return;
    }
    verPideCuenta(false);
    pintarDesglose();
    abrirCheckout();
  });
  function verPideCuenta(ver) {
    if (ver) {
      const tiene = Boolean(puente.correoGuardado?.());
      pidePrincipal.dataset.va = tiene ? "entrar" : "crear";
      pidePrincipal.textContent = tiene ? "Iniciar sesión" : "Crear una cuenta";
      pideOtra.dataset.va = tiene ? "crear" : "entrar";
      pideOtra.textContent = tiene ? "No tengo cuenta, crear una" : "Ya tengo cuenta, iniciar sesión";
    }
    pideCuenta.hidden = !ver;
    panel2.querySelector(".canasta-cabecera").inert = ver;
    panel2.querySelector(".canasta-pasos").inert = ver;
  }
  [pidePrincipal, pideOtra].forEach((b) => b.addEventListener("click", () => {
    verPideCuenta(false);
    cerrar();
    puente.abrirC(b.dataset.va);
  }));
  var volverDePide = () => {
    verPideCuenta(false);
    enviar.focus();
  };
  panel2.querySelector(".pide-cuenta-volver").addEventListener("click", volverDePide);
  pideCuenta.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    volverDePide();
  });
  pideCuenta.addEventListener("click", (e) => {
    if (e.target === pideCuenta) volverDePide();
  });
  resumenEditar?.addEventListener("click", () => abrir2());
  puente.faltaDireccion = () => {
    if (entrega.modo !== "domicilio" || entrega.direccion) return false;
    avisoDir.hidden = false;
    campoDir.focus();
    return true;
  };
  var ESPERA_DESHACER = 12e3;
  var borrado = null;
  var relojDeshacer = 0;
  var olvidarBorrado = () => {
    const teniaFoco = barraDeshacer.contains(document.activeElement);
    const id = borrado?.lineas[0]?.[0];
    window.clearTimeout(relojDeshacer);
    relojDeshacer = 0;
    borrado = null;
    barraDeshacer.hidden = true;
    if (!teniaFoco) return;
    const destino = abierto() ? titulo : botonesMas.find(({ coincide }) => coincide(id))?.boton;
    destino?.focus();
  };
  var anotarLineas = (lineas, texto) => {
    borrado = { lineas: lineas.map(([id, l]) => [id, { ...l }]) };
    deshacerTexto.textContent = texto;
    barraDeshacer.hidden = false;
    window.clearTimeout(relojDeshacer);
    relojDeshacer = window.setTimeout(olvidarBorrado, ESPERA_DESHACER);
  };
  var anotarBorrado = (id, linea) => anotarLineas([[id, linea]], linea.cantidad === 1 ? `Quitaste ${linea.nombre}.` : `Quitaste ${linea.nombre} (${linea.cantidad} unidades).`);
  var deshacerBorrado = () => {
    if (!borrado) return;
    const repuestas = borrado.lineas;
    repuestas.forEach(([idL, l]) => pedido.set(idL, { ...l }));
    const [id, linea] = repuestas[0];
    olvidarBorrado();
    pintar();
    avisos.textContent = `${repuestas.length === 1 ? `${linea.nombre} vuelve` : "Todo vuelve"} a la canasta. ${unidades()} producto${unidades() === 1 ? "" : "s"} en la canasta.`;
    const destino = abierto() ? [...lista.querySelectorAll(".canasta-linea")].find((li) => li.querySelector("h3")?.textContent === linea.nombre)?.querySelector("[data-mas]") || panel2.querySelector(".canasta-cerrar") : botonesMas.find(({ coincide }) => coincide(id))?.boton;
    destino?.focus();
  };
  deshacerBoton.addEventListener("click", deshacerBorrado);
  var preguntarVaciar = (si) => {
    preguntaVaciar.hidden = !si;
    botonVaciar.hidden = si;
  };
  botonVaciar.addEventListener("click", () => {
    preguntarVaciar(true);
    preguntaVaciar.querySelector(".canasta-vaciar-si").focus();
    avisos.textContent = "¿Vaciar la canasta?";
  });
  preguntaVaciar.querySelector(".canasta-vaciar-no").addEventListener("click", () => {
    preguntarVaciar(false);
    botonVaciar.focus();
  });
  preguntaVaciar.querySelector(".canasta-vaciar-si").addEventListener("click", () => {
    preguntarVaciar(false);
    const n = unidades();
    anotarLineas([...pedido], `Vaciaste la canasta (${n} producto${n === 1 ? "" : "s"}).`);
    pedido.clear();
    porConfirmar = null;
    pintar();
    avisos.textContent = "Vaciaste la canasta.";
    deshacerBoton.focus();
  });
  preguntaVaciar.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    preguntarVaciar(false);
    botonVaciar.focus();
  });
  var cambiar = (id, delta) => {
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
  var ultimoFoco = null;
  var abrir2 = () => {
    ultimoFoco = document.activeElement;
    fondo.classList.add("is-open");
    panel2.classList.add("is-open");
    document.body.style.overflow = "hidden";
    apagarDetras(panel2, true);
    panel2.querySelector(".canasta-cerrar").focus();
  };
  var cerrar = () => {
    fondo.classList.remove("is-open");
    panel2.classList.remove("is-open");
    document.body.style.overflow = "";
    apagarDetras(panel2, false);
    if (porConfirmar) {
      porConfirmar = null;
      pintar();
    }
    preguntarVaciar(false);
    verPideCuenta(false);
    ultimoFoco?.focus();
  };
  var abierto = () => panel2.classList.contains("is-open");
  fondo.addEventListener("click", cerrar);
  panel2.querySelector(".canasta-cerrar").addEventListener("click", cerrar);
  panel2.querySelector(".canasta-vacio-ir").addEventListener("click", () => {
    cerrar();
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  });
  atraparFoco(panel2, abierto, cerrar);
  if (boton) {
    boton.removeAttribute("href");
    boton.removeAttribute("target");
    boton.removeAttribute("rel");
    boton.setAttribute("role", "button");
    boton.setAttribute("tabindex", "0");
    boton.textContent = "";
    boton.classList.add("is-canasta");
    boton.insertAdjacentHTML(
      "beforeend",
      '<svg class="canasta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7.6 9.4a4.4 4.4 0 0 1 8.8 0"/><path d="M3.6 9.4h16.8l-1.5 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6Z"/><path d="M9.7 12.7l.6 3.5"/><path d="M14.3 12.7l-.6 3.5"/></svg>'
    );
    boton.append(cuenta);
    const acciones = document.querySelector(".nav-acciones");
    if (acciones) acciones.insertBefore(boton, acciones.querySelector(".menu-toggle"));
    boton.addEventListener("click", abrir2);
    boton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrir2();
      }
    });
  }
  montarPago(vista);
  enterAvanza([
    "#canasta-dir",
    "#canasta-piso",
    "#canasta-ref",
    "#canasta-notas",
    "#pago-numero",
    "#pago-vence",
    "#pago-cvv",
    "#pago-titular",
    "#factura-nombre",
    "#factura-ident",
    "#factura-correo",
    "#factura-dir"
  ].map((id) => vista.querySelector(id)), () => vista.querySelector(".canasta-pagar")?.focus());
  var montarControlesDeFicha = () => {
    document.querySelectorAll(".product-card .order-button").forEach((enlace) => {
      const ficha = enlace.closest(".product-card");
      const nombre = ficha.querySelector("h3")?.textContent.trim();
      const precio = parseFloat((ficha.querySelector(".product-bottom strong")?.textContent || "").replace(/[^0-9.]/g, ""));
      if (!nombre || Number.isNaN(precio)) return;
      const tamanos = [...ficha.querySelectorAll(".tamano-input")];
      const elegido = () => tamanos.find((t) => t.checked) || tamanos[0];
      const nombreDe = () => tamanos.length ? `${nombre} ${elegido().value}` : nombre;
      const precioDe = () => tamanos.length ? Number(elegido().dataset.precio) : precio;
      const idDeAhora = () => idDe(nombreDe());
      const importe = ficha.querySelector(".product-bottom strong");
      const img = ficha.querySelector(".product-image img");
      const chica = img?.getAttribute("srcset")?.split(",")[0].trim().split(" ")[0] || img?.getAttribute("src");
      if (chica) fotos.set(nombre, chica);
      const grupo2 = document.createElement("div");
      grupo2.className = "card-cantidad";
      grupo2.innerHTML = '<button class="card-menos" type="button" hidden></button><input class="card-numero" type="text" inputmode="numeric" autocomplete="off" maxlength="3" value="0" hidden><button class="card-mas" type="button">+</button>';
      const menos = grupo2.querySelector(".card-menos");
      const cuentaFicha = grupo2.querySelector(".card-numero");
      const mas = grupo2.querySelector(".card-mas");
      const cuantos = () => pedido.get(idDeAhora())?.cantidad || 0;
      const refrescar = () => {
        const n = cuantos();
        grupo2.classList.toggle("is-lleno", n > 0);
        menos.hidden = n === 0;
        cuentaFicha.hidden = n === 0;
        if (document.activeElement !== cuentaFicha) cuentaFicha.value = n;
        menos.innerHTML = n === 1 ? BASURERO : '<span aria-hidden="true">−</span>';
        const comoSeLlama = nombreDe();
        menos.setAttribute("aria-label", n === 1 ? `Quitar ${comoSeLlama} de la canasta` : `Quitar uno de ${comoSeLlama}`);
        menos.dataset.tip = n === 1 ? "Quitar de la canasta" : "Uno menos";
        mas.setAttribute("aria-label", n ? `Añadir otro de ${comoSeLlama}` : `Añadir ${comoSeLlama} a la canasta`);
        cuentaFicha.setAttribute("aria-label", `Cantidad de ${comoSeLlama}`);
        mas.dataset.tip = n ? "Uno más" : "Añadir a la canasta";
        cuentaFicha.dataset.tip = `Escribe cuántos quieres, hasta ${MAX_UNIDADES}`;
        if (importe) importe.textContent = dinero(precioDe());
      };
      refrescos.push(refrescar);
      botonesMas.push({ coincide: (id) => idDeAhora() === id, boton: mas });
      tamanos.forEach((t) => t.addEventListener("change", () => {
        refrescar();
        avisos.textContent = `${nombreDe()}, ${dinero(precioDe())}.`;
      }));
      const cuantosQuedan = () => `${unidades()} producto${unidades() === 1 ? "" : "s"} en la canasta.`;
      mas.addEventListener("click", () => {
        const comoSeLlama = nombreDe();
        const l = pedido.get(idDeAhora()) || { nombre: comoSeLlama, precio: precioDe(), cantidad: 0 };
        l.cantidad = Math.min(l.cantidad + 1, MAX_UNIDADES);
        pedido.set(idDeAhora(), l);
        pintar();
        volarALaCanasta(ficha);
        avisos.textContent = `${comoSeLlama} añadido. ${cuantosQuedan()}`;
      });
      cuentaFicha.addEventListener("input", () => {
        const limpio = cuentaFicha.value.replace(/[^0-9]/g, "").slice(0, 3);
        if (limpio !== cuentaFicha.value) cuentaFicha.value = limpio;
      });
      cuentaFicha.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          cuentaFicha.blur();
        }
        if (e.key === "Escape") {
          cuentaFicha.value = cuantos();
          cuentaFicha.blur();
        }
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const ahora = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
        const paso = e.key === "ArrowUp" ? 1 : -1;
        cuentaFicha.value = Math.max(0, Math.min(ahora + paso, MAX_UNIDADES));
      });
      cuentaFicha.addEventListener("blur", () => {
        const comoSeLlama = nombreDe();
        const id = idDeAhora();
        const pedida = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
        const antes = cuantos();
        if (pedida === antes) {
          cuentaFicha.value = antes;
          return;
        }
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
        avisos.textContent = recortado ? `El máximo es ${MAX_UNIDADES} por producto, así que quedaron ${MAX_UNIDADES} de ${comoSeLlama}. ${cuantosQuedan()}` : `${pedida} de ${comoSeLlama}. ${cuantosQuedan()}`;
      });
      menos.addEventListener("click", () => {
        const comoSeLlama = nombreDe();
        const seVa = cuantos() <= 1;
        cambiar(idDeAhora(), -1);
        avisos.textContent = seVa ? `${comoSeLlama} quitado. ${cuantosQuedan()}` : `Una unidad menos de ${comoSeLlama}. ${cuantosQuedan()}`;
        if (seVa) mas.focus();
      });
      enlace.replaceWith(grupo2);
    });
  };
  var iniciarCanasta = () => {
    if (RUTAS[location.hash]) history.replaceState({}, "", location.pathname + location.search);
    leerGuardado();
    radios.forEach((radio) => {
      radio.checked = radio.value === entrega.modo;
    });
    campoDir.value = entrega.direccion;
    if (campoPiso) campoPiso.value = entrega.piso;
    if (campoRef) campoRef.value = entrega.referencia;
    if (campoNotas) campoNotas.value = entrega.notas;
    cargarFactura();
    pintar();
  };
  puente.guardar = guardar;
  puente.borrarGuardado = borrarGuardado;
  puente.enfocarTitulo = () => tituloVista.focus();
  puente.vaciarContador = () => {
    cuenta.hidden = true;
    if (boton) boton.setAttribute("aria-label", "Ver la canasta, vacía");
  };
  puente.ponerDireccion = (direccion) => {
    entrega.direccion = direccion;
    campoDir.value = direccion;
    pintarPie();
  };

  // js/account.js
  var CLAVE_CUENTA = "eltradicional-cuenta";
  var huellaClave = null;
  var VUELTAS = 1e5;
  var aHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  var deHex = (hex) => new Uint8Array((hex.match(/../g) || []).map((h) => parseInt(h, 16)));
  var puedeHuella = () => Boolean(window.crypto?.subtle);
  var calcularHuella = async (clave, salHex) => {
    const sal = salHex ? deHex(salHex) : window.crypto.getRandomValues(new Uint8Array(16));
    const base = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(clave),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: sal, iterations: VUELTAS, hash: "SHA-256" },
      base,
      256
    );
    return { sal: aHex(sal), hash: aHex(bits) };
  };
  var icono = (trazos) => '<svg class="cuenta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + trazos + "</svg>";
  var ICONOS = {
    cuenta: icono('<circle cx="12" cy="8.2" r="3.6"/><path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/>'),
    pedidos: icono('<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>'),
    tarjeta: icono('<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18"/><path d="M6.5 15h3.5"/>'),
    efectivo: icono('<rect x="2.8" y="6.5" width="18.4" height="11" rx="1.8"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>'),
    salir: icono('<path d="M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="M11 12h9"/><path d="M17 8.5l3.5 3.5-3.5 3.5"/>')
  };
  var METODOS_CUENTA = [
    {
      valor: "efectivo",
      nombre: "Efectivo",
      icono: ICONOS.efectivo,
      dicho: "Al retirar en el local o al recibir en tu puerta."
    },
    {
      valor: "tarjeta",
      nombre: "Tarjeta",
      icono: ICONOS.tarjeta,
      dicho: "Crédito o débito. La escribes al pagar."
    }
  ];
  var nombreMetodo = (valor) => METODOS_CUENTA.find((m) => m.valor === valor)?.nombre || "Efectivo";
  var fondoC = document.createElement("div");
  fondoC.className = "cuenta-fondo";
  var panelC = document.createElement("aside");
  panelC.className = "cuenta-panel";
  panelC.setAttribute("role", "dialog");
  panelC.setAttribute("aria-modal", "true");
  panelC.setAttribute("aria-labelledby", "cuenta-titulo");
  var campoHtml = (id, etiqueta, extra, opciones = {}) => {
    const describe = (opciones.describe ? opciones.describe + " " : "") + `cuenta-${id}-error`;
    const campo = `<input id="cuenta-${id}" ${extra} aria-describedby="${describe}">`;
    const esClave = extra.includes('type="password"');
    return `<div class="cuenta-campo"><label for="cuenta-${id}">${etiqueta}` + (opciones.opcional ? ' <span class="cuenta-campo-opcional">(opcional)</span>' : "") + "</label>" + (opciones.prefijo ? `<div class="cuenta-conprefijo"><span class="cuenta-prefijo">${opciones.prefijo}</span>${campo}</div>` : esClave ? `<div class="cuenta-conclave">${campo}<button class="ver-clave" type="button" aria-controls="cuenta-${id}" aria-label="Mostrar la contraseña">Mostrar</button></div>` : campo) + (opciones.despues || "") + `<p class="cuenta-campo-error" id="cuenta-${id}-error" hidden></p></div>`;
  };
  var REGLAS = [
    { id: "largo", texto: "Al menos 8 caracteres", cumple: (v) => v.length >= 8 },
    { id: "minuscula", texto: "Una letra minúscula", cumple: (v) => /[a-zñáéíóúü]/.test(v) },
    { id: "mayuscula", texto: "Una letra mayúscula", cumple: (v) => /[A-ZÑÁÉÍÓÚÜ]/.test(v) },
    { id: "numero", texto: "Un número", cumple: (v) => /[0-9]/.test(v) }
  ];
  var soloNueve = (v) => v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  var telefonoBonito = (d) => d ? `+593 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : "";
  var reglasHtml = '<ul class="cuenta-reglas" id="cuenta-clave-reglas">' + REGLAS.map((r) => `<li data-regla="${r.id}">${r.texto}<span class="sr-only cuenta-regla-estado">, falta</span></li>`).join("") + "</ul>";
  panelC.innerHTML = '<div class="cuenta-cabecera"><h2 id="cuenta-titulo" tabindex="-1">Crear cuenta</h2><button class="cuenta-cerrar" type="button" aria-label="Cerrar">×</button></div><section class="cuenta-paso" data-paso="crear"><div class="cuenta-cuerpo"><p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Este sitio no tiene servidor: la cuenta se guarda solo en este navegador, y de la contraseña solo su huella cifrada. Aun así, no escribas una contraseña de verdad.</p>' + campoHtml("nombre", "Nombre y apellido", 'type="text" autocomplete="name" maxlength="60" placeholder="María Pérez"') + campoHtml("correo", "Correo", 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"') + campoHtml("telefono", "Teléfono", 'type="tel" inputmode="numeric" autocomplete="tel" maxlength="9" placeholder="990001122"', { prefijo: "+593" }) + campoHtml("direccion", "Dirección", 'type="text" autocomplete="street-address" maxlength="200" placeholder="Calle, número y una referencia"', { opcional: true }) + campoHtml(
    "clave",
    "Contraseña",
    'type="password" autocomplete="new-password" maxlength="40"',
    { describe: "cuenta-clave-reglas", despues: reglasHtml }
  ) + campoHtml("repite", "Repite la contraseña", 'type="password" autocomplete="new-password" maxlength="40"') + '</div><div class="cuenta-pie"><p class="cuenta-aviso" role="alert" hidden></p><button class="button button-yellow cuenta-crear" type="button">Crear la cuenta</button><button class="cuenta-cambiar" type="button" data-va="entrar">Ya tengo cuenta, quiero entrar</button></div></section><section class="cuenta-paso" data-paso="verificar" hidden><div class="cuenta-cuerpo"><p class="cuenta-maqueta cuenta-maqueta-codigo" hidden></p><p class="codigo-dicho">Escribe el código de 6 cifras que enviamos a <strong class="codigo-correo"></strong>.</p><p class="codigo-estado" role="status" hidden></p><div class="codigo-falso" hidden><p class="codigo-falso-de">Correo de El Tradicional</p><p class="codigo-falso-texto">Tu código es <b class="codigo-valor"></b>. No lo compartas con nadie.</p></div><div class="cuenta-campo"><label for="cuenta-codigo">Código de verificación</label><input id="cuenta-codigo" class="campo-codigo" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" aria-describedby="cuenta-codigo-error"><p class="cuenta-campo-error" id="cuenta-codigo-error" hidden></p></div><button class="codigo-reenviar" type="button">Enviar otro código</button></div><div class="cuenta-pie"><p class="cuenta-aviso" role="alert" hidden></p><button class="button button-yellow cuenta-verificar" type="button">Verificar el correo</button><button class="cuenta-cambiar" type="button" data-va="crear">Cambiar el correo</button></div></section><section class="cuenta-paso" data-paso="entrar" hidden><div class="cuenta-cuerpo"><p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Sin servidor, solo se puede entrar a la cuenta que creaste en este navegador.</p>' + campoHtml("entrar-correo", "Correo", 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"') + campoHtml("entrar-clave", "Contraseña", 'type="password" autocomplete="current-password" maxlength="40"') + '</div><div class="cuenta-pie"><p class="cuenta-aviso" role="alert" hidden></p><button class="button button-yellow cuenta-entrar" type="button">Entrar</button><button class="cuenta-cambiar" type="button" data-va="crear">No tengo cuenta, quiero crear una</button></div></section><section class="cuenta-paso" data-paso="sesion" hidden><div class="cuenta-cuerpo"><div class="cuenta-sesion"><span class="cuenta-avatar" aria-hidden="true"></span><div><p class="cuenta-sesion-nombre"></p><p class="cuenta-sesion-correo"></p></div></div><dl class="cuenta-datos"><div><dt>Teléfono</dt><dd class="cuenta-dato-telefono"></dd></div><div><dt>Dirección</dt><dd class="cuenta-dato-direccion"></dd></div><div><dt>Pago preferido</dt><dd class="cuenta-dato-metodo"></dd></div></dl><p class="cuenta-hecho" role="status" hidden></p><div class="cuenta-acciones"><button class="cuenta-editar" type="button">Editar mis datos</button><button class="cuenta-editar cuenta-ver-pedidos" type="button">Ver mis pedidos</button><button class="cuenta-editar cuenta-ver-pagos" type="button">Métodos de pago</button></div><p class="cuenta-nota">Tu pedido ya sale a tu nombre y con tu dirección escrita.</p></div><div class="cuenta-pie"><button class="cuenta-salir" type="button">Cerrar sesión</button><p class="cuenta-nota">La cuenta se queda guardada en este navegador: puedes volver a entrar con tu correo y tu contraseña. No hay ningún otro lugar donde estuviera guardada.</p></div></section><section class="cuenta-paso" data-paso="editar" hidden><div class="cuenta-cuerpo">' + campoHtml("editar-nombre", "Nombre y apellido", 'type="text" autocomplete="name" maxlength="60"') + campoHtml("editar-telefono", "Teléfono", 'type="tel" inputmode="numeric" autocomplete="tel" maxlength="9" placeholder="990001122"', { prefijo: "+593" }) + campoHtml("editar-direccion", "Dirección", 'type="text" autocomplete="street-address" maxlength="200" placeholder="Calle, número y una referencia"', { opcional: true }) + '<p class="cuenta-nota cuenta-nota-izq">El correo no se cambia aquí: es con el que entras y adonde te llega el comprobante.</p></div><div class="cuenta-pie"><p class="cuenta-aviso" role="alert" hidden></p><button class="button button-yellow cuenta-guardar" type="button">Guardar los cambios</button><button class="cuenta-cambiar" type="button" data-va="sesion">Cancelar</button></div></section><section class="cuenta-paso" data-paso="pedidos" hidden><div class="cuenta-cuerpo"><p class="cuenta-historial-vacio" hidden>Todavía no has hecho ningún pedido desde este navegador. Cuando pagues uno, aparecerá aquí.</p><ul class="cuenta-historial"></ul><p class="cuenta-nota">Quedan guardados en este navegador y en ninguna otra parte: desde otro equipo no se ven.</p></div><div class="cuenta-pie"><button class="cuenta-salir" type="button" data-va="sesion">Volver a tu cuenta</button></div></section><section class="cuenta-paso" data-paso="pagos" hidden><div class="cuenta-cuerpo"><p class="cuenta-pagos-dicho">Elige cómo prefieres pagar. Lo dejamos marcado en cada pedido, y al confirmarlo puedes cambiarlo.</p><fieldset class="cuenta-metodos"><legend class="sr-only">Forma de pago preferida</legend>' + METODOS_CUENTA.map((m) => `<label class="cuenta-metodo"><input type="radio" name="cuenta-metodo" value="${m.valor}"><span class="cuenta-metodo-caja">${m.icono}<span><strong>${m.nombre}</strong><small>${m.dicho}</small></span></span></label>`).join("") + '</fieldset><p class="cuenta-hecho cuenta-pagos-hecho" role="status" hidden></p><p class="cuenta-maqueta"><strong>No guardamos tarjetas.</strong> Sin un servidor seguro no hay dónde tenerlas bien guardadas, así que la tarjeta se escribe en cada pago y se borra al terminar.</p></div><div class="cuenta-pie"><button class="cuenta-salir" type="button" data-va="sesion">Volver a tu cuenta</button></div></section>';
  document.body.append(fondoC, panelC);
  var PERSONA = '<svg class="nav-cuenta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8.2" r="3.6"/><path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/></svg>';
  var navCuenta = document.createElement("button");
  navCuenta.type = "button";
  navCuenta.className = "nav-cuenta";
  document.querySelector(".nav-acciones")?.prepend(navCuenta);
  var tituloC = panelC.querySelector("#cuenta-titulo");
  var pasosC = [...panelC.querySelectorAll(".cuenta-paso")];
  var avisoCrear = panelC.querySelector('[data-paso="crear"] .cuenta-aviso');
  var avisoEntrar = panelC.querySelector('[data-paso="entrar"] .cuenta-aviso');
  var campoCodigo = panelC.querySelector("#cuenta-codigo");
  var errorCodigo = panelC.querySelector("#cuenta-codigo-error");
  var avisoVerificar = panelC.querySelector('[data-paso="verificar"] .cuenta-aviso');
  var codigoCorreo = panelC.querySelector(".codigo-correo");
  var codigoValor = panelC.querySelector(".codigo-valor");
  var codigoFalso = panelC.querySelector(".codigo-falso");
  var codigoEstado = panelC.querySelector(".codigo-estado");
  var maquetaCodigo = panelC.querySelector(".cuenta-maqueta-codigo");
  var codigoReenviar = panelC.querySelector(".codigo-reenviar");
  var correoEntrar = panelC.querySelector("#cuenta-entrar-correo");
  var errorEntrarCorreo = panelC.querySelector("#cuenta-entrar-correo-error");
  var claveEntrar = panelC.querySelector("#cuenta-entrar-clave");
  var errorEntrarClave = panelC.querySelector("#cuenta-entrar-clave-error");
  var TITULOS_CUENTA = {
    crear: "Crear cuenta",
    verificar: "Verificar tu correo",
    entrar: "Entrar",
    sesion: "Tu cuenta",
    editar: "Editar tus datos",
    pedidos: "Tus pedidos",
    pagos: "Métodos de pago"
  };
  var codigoEsperado = "";
  var relojReenvio = 0;
  var REENVIO = 45;
  var correoAVerificar = () => datos.correo || sesion.correo;
  var nuevoCodigo = () => {
    codigoEsperado = String(Math.floor(1e5 + Math.random() * 9e5));
    if (codigoValor) codigoValor.textContent = codigoEsperado;
    if (codigoCorreo) codigoCorreo.textContent = correoAVerificar();
  };
  var mandarCodigo = async () => {
    const para = correoAVerificar();
    const codigo = codigoEsperado;
    const verAtajo = (motivo) => {
      codigoEstado.textContent = "";
      codigoEstado.hidden = true;
      codigoFalso.hidden = false;
      maquetaCodigo.hidden = false;
      maquetaCodigo.innerHTML = `<strong>Maqueta académica.</strong> ${motivo} El código se muestra aquí abajo para que puedas seguir.`;
    };
    if (!buzonListo()) {
      verAtajo("El envío de correo no está configurado en esta copia del sitio.");
      return;
    }
    codigoFalso.hidden = true;
    maquetaCodigo.hidden = true;
    codigoEstado.hidden = false;
    codigoEstado.textContent = "Enviando el código a tu correo…";
    const bien = await enviarCorreo(
      para,
      datos.nombre || sesion.nombre,
      "Tu código de El Tradicional",
      `Tu código para verificar la cuenta es ${codigo}.

Caduca cuando pidas otro. No lo compartas con nadie: nadie de El Tradicional te lo va a pedir.`
    );
    if (codigoEsperado !== codigo) return;
    if (bien) {
      codigoEstado.textContent = "Código enviado. Si no lo ves, mira en la carpeta de spam.";
      return;
    }
    codigoEstado.hidden = true;
    verAtajo("No se pudo enviar el correo: puede ser la red o la cuota del mes.");
  };
  var cuentaAtras = () => {
    window.clearInterval(relojReenvio);
    let quedan = REENVIO;
    const pintar2 = () => {
      if (quedan <= 0) {
        window.clearInterval(relojReenvio);
        relojReenvio = 0;
        codigoReenviar.disabled = false;
        codigoReenviar.textContent = "Enviar otro código";
        return;
      }
      codigoReenviar.disabled = true;
      codigoReenviar.textContent = `Enviar otro código en ${quedan}s`;
      quedan -= 1;
    };
    pintar2();
    relojReenvio = window.setInterval(pintar2, 1e3);
  };
  var pararCuentaAtras = () => {
    window.clearInterval(relojReenvio);
    relojReenvio = 0;
    if (codigoReenviar) {
      codigoReenviar.disabled = false;
      codigoReenviar.textContent = "Enviar otro código";
    }
  };
  var verPaso = (nombre, hecho = "") => {
    pasosC.forEach((paso) => {
      paso.hidden = paso.dataset.paso !== nombre;
    });
    const cartel = panelC.querySelector(".cuenta-hecho");
    cartel.hidden = !hecho;
    cartel.textContent = hecho;
    tituloC.textContent = TITULOS_CUENTA[nombre];
    if (nombre === "sesion") contarPedidos();
    if (nombre === "pedidos") pintarHistorial();
    if (nombre === "pagos") pintarPagos();
  };
  var datos = { nombre: "", correo: "", telefono: "", direccion: "", clave: "", repite: "" };
  var campos = [
    { clave: "nombre" },
    { clave: "correo" },
    { clave: "telefono" },
    { clave: "direccion" },
    { clave: "clave", soloAlIntentar: true },
    { clave: "repite", alEscribir: true }
  ].map((campo) => Object.assign(campo, {
    input: panelC.querySelector(`#cuenta-${campo.clave}`),
    error: panelC.querySelector(`#cuenta-${campo.clave}-error`)
  }));
  var tocadosC = /* @__PURE__ */ new Set();
  var intentadoC = false;
  var CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var fallaCorreo = (v) => {
    if (!v) return "Escribe tu correo.";
    if (/\s/.test(v)) return "El correo no lleva espacios.";
    const arroba = v.indexOf("@");
    if (arroba === -1) return "Le falta el @ y todo lo que sigue, por ejemplo @gmail.com.";
    if (arroba === 0) return "Le falta tu usuario antes del @, como juan.perez@gmail.com.";
    if (v.includes("@", arroba + 1)) return "Tiene más de un @: el correo lleva solo uno.";
    const dominio = v.slice(arroba + 1);
    if (!dominio) return "Le falta lo que va después del @, por ejemplo gmail.com u hotmail.com.";
    if (dominio.startsWith(".")) return "Le falta el nombre entre el @ y el punto, como gmail u outlook.";
    if (dominio.includes("..")) return "Tiene dos puntos seguidos: va solo uno.";
    if (!dominio.includes(".")) return "Le falta el final, por ejemplo .com, .ec o .es.";
    if (dominio.endsWith(".")) return "Le falta lo que va después del punto, como com o ec.";
    if (!/\.[a-z]{2,}$/i.test(dominio)) return "El final no está completo: suele ser .com, .ec o .es.";
    if (!CORREO.test(v)) return "Revisa el correo, algo no cuadra.";
    return "";
  };
  var fallaNombre = (v) => {
    if (v.length < 3) return "Escribe tu nombre.";
    if (!v.includes(" ")) return "Falta el apellido.";
    return "";
  };
  var fallaTelefono = (v) => {
    if (!v) return "Escribe tu número.";
    if (!/^9\d{8}$/.test(v)) return "Son 9 números después del +593, empezando por 9.";
    return "";
  };
  var fallosCuenta = () => {
    const f = {};
    if (fallaNombre(datos.nombre)) f.nombre = fallaNombre(datos.nombre);
    const correo = fallaCorreo(datos.correo);
    if (correo) f.correo = correo;
    if (fallaTelefono(datos.telefono)) f.telefono = fallaTelefono(datos.telefono);
    if (REGLAS.some((r) => !r.cumple(datos.clave))) f.clave = "A la contraseña le falta algo de la lista.";
    if (datos.repite !== datos.clave) f.repite = "Las dos no son iguales.";
    return f;
  };
  var pintarReglas = () => {
    REGLAS.forEach((r) => {
      const fila = panelC.querySelector(`[data-regla="${r.id}"]`);
      const hecha = r.cumple(datos.clave);
      fila.classList.toggle("is-hecha", hecha);
      fila.querySelector(".cuenta-regla-estado").textContent = hecha ? ", cumplido" : ", falta";
    });
  };
  var pintarCampos = () => {
    const fallos = fallosCuenta();
    pintarReglas();
    campos.forEach(({ clave, input, error, soloAlIntentar, alEscribir }) => {
      const momento = soloAlIntentar ? intentadoC : intentadoC || tocadosC.has(clave) || alEscribir && Boolean(datos[clave]);
      const texto = momento ? fallos[clave] : "";
      error.hidden = !texto;
      error.textContent = texto || "";
      input.setAttribute("aria-invalid", texto ? "true" : "false");
      input.classList.toggle("is-mal", Boolean(texto));
    });
    return fallos;
  };
  campos.forEach(({ clave, input }) => {
    input.addEventListener("input", () => {
      if (clave === "telefono") input.value = soloNueve(input.value);
      datos[clave] = clave === "clave" || clave === "repite" ? input.value : input.value.trim();
      pintarCampos();
    });
    input.addEventListener("blur", () => {
      tocadosC.add(clave);
      pintarCampos();
    });
  });
  enterAvanza(campos.map((c) => c.input), () => panelC.querySelector(".cuenta-crear").click());
  var olvidarFormulario = () => {
    campos.forEach(({ clave, input }) => {
      datos[clave] = "";
      input.value = "";
    });
    tocadosC.clear();
    intentadoC = false;
    pintarCampos();
    avisoCrear.hidden = true;
    avisoEntrar.hidden = true;
    correoEntrar.value = "";
    errorEntrarCorreo.hidden = true;
    correoEntrar.classList.remove("is-mal");
    claveEntrar.value = "";
    errorEntrarClave.hidden = true;
    claveEntrar.classList.remove("is-mal");
    taparClaves();
    limpiarEditar();
  };
  var guardarCuenta = () => {
    try {
      window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
        nombre: sesion.nombre,
        correo: sesion.correo,
        telefono: sesion.telefono,
        direccion: sesion.direccion,
        verificado: sesion.verificado,
        sesionAbierta: sesion.dentro,
        metodo: sesion.metodo,
        clave: huellaClave
      }));
    } catch (e) {
    }
  };
  var correoGuardado = () => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_CUENTA);
      return crudo ? String(JSON.parse(crudo).correo || "") : "";
    } catch (e) {
      return "";
    }
  };
  var huellaGuardada = () => {
    try {
      const h = JSON.parse(window.localStorage.getItem(CLAVE_CUENTA) || "{}").clave;
      return h && typeof h.sal === "string" && typeof h.hash === "string" ? h : null;
    } catch (e) {
      return null;
    }
  };
  var leerCuenta = () => {
    huellaClave = huellaGuardada();
    try {
      const crudo = window.localStorage.getItem(CLAVE_CUENTA);
      if (!crudo) return;
      const dato = JSON.parse(crudo);
      if (!dato || !dato.nombre || typeof dato.correo !== "string") return;
      sesion.nombre = String(dato.nombre).slice(0, 60);
      sesion.correo = String(dato.correo).slice(0, 80);
      sesion.telefono = soloNueve(String(dato.telefono || ""));
      sesion.direccion = String(dato.direccion || "").slice(0, 200);
      sesion.verificado = dato.verificado === true;
      sesion.metodo = dato.metodo === "tarjeta" ? "tarjeta" : "efectivo";
      sesion.dentro = dato.sesionAbierta !== false;
    } catch (e) {
    }
  };
  var iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join("");
  var nombrarBoton = (texto) => {
    navCuenta.setAttribute("aria-label", texto);
    navCuenta.setAttribute("title", texto);
  };
  var pintarSesion = () => {
    if (!sesion.dentro) {
      navCuenta.classList.remove("is-dentro");
      navCuenta.innerHTML = PERSONA;
      nombrarBoton("Entrar o crear una cuenta");
      pintarMenu();
      return;
    }
    navCuenta.classList.add("is-dentro");
    navCuenta.textContent = "";
    const marca = document.createElement("span");
    marca.className = "nav-cuenta-iniciales";
    marca.setAttribute("aria-hidden", "true");
    marca.textContent = iniciales(sesion.nombre);
    navCuenta.append(marca);
    nombrarBoton(`Tu cuenta, ${sesion.nombre}`);
    panelC.querySelector(".cuenta-avatar").textContent = iniciales(sesion.nombre);
    panelC.querySelector(".cuenta-sesion-nombre").textContent = sesion.nombre;
    panelC.querySelector(".cuenta-sesion-correo").textContent = sesion.correo;
    panelC.querySelector(".cuenta-dato-telefono").textContent = telefonoBonito(sesion.telefono) || "—";
    panelC.querySelector(".cuenta-dato-direccion").textContent = sesion.direccion || "Sin dirección guardada";
    panelC.querySelector(".cuenta-dato-metodo").textContent = nombreMetodo(sesion.metodo);
    pintarMenu();
  };
  var nodo = (etiqueta, clase, texto) => {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== void 0) el.textContent = texto;
    return el;
  };
  var todosLosPedidos = () => pedidosGuardados(Infinity);
  var botonPedidos = panelC.querySelector(".cuenta-ver-pedidos");
  var contarPedidos = async () => {
    const n = (await todosLosPedidos()).length;
    botonPedidos.textContent = n ? `Ver mis pedidos (${n})` : "Ver mis pedidos";
    const pastilla = menuCuenta.querySelector(".cuenta-menu-numero");
    if (pastilla) {
      pastilla.hidden = !n;
      pastilla.textContent = n;
    }
  };
  var pintarHistorial = async () => {
    const lista2 = panelC.querySelector(".cuenta-historial");
    const vacio2 = panelC.querySelector(".cuenta-historial-vacio");
    const pedidos = await todosLosPedidos();
    vacio2.hidden = pedidos.length > 0;
    lista2.textContent = "";
    pedidos.forEach((p) => {
      const lineas = p.lineas || [];
      const cuantos = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
      const plegable = nodo("details", "cuenta-pedido");
      const resumen = nodo("summary");
      resumen.append(
        nodo("span", "cuenta-pedido-numero", p.numero),
        nodo("strong", "", dinero(Number(p.total) || 0)),
        nodo("span", "cuenta-pedido-fecha", marcaBonita(new Date(p.fecha))),
        nodo("span", "cuenta-pedido-detalle", `${cuantos} ${cuantos === 1 ? "unidad" : "unidades"}` + (p.modo === "domicilio" ? " · a domicilio" : " · para retirar"))
      );
      const cuerpo = nodo("div", "cuenta-pedido-cuerpo");
      const productos = nodo("ul", "cuenta-pedido-lineas");
      lineas.forEach((l) => {
        const fila = nodo("li");
        fila.append(
          nodo("span", "", `${l.cantidad} × ${l.nombre}`),
          nodo("span", "", dinero((Number(l.precio) || 0) * (Number(l.cantidad) || 0)))
        );
        productos.append(fila);
      });
      const cuentas = nodo("dl", "cuenta-pedido-cuentas");
      const dato = (titulo2, valor) => {
        const par = nodo("div");
        par.append(nodo("dt", "", titulo2), nodo("dd", "", valor));
        cuentas.append(par);
      };
      dato("Subtotal", dinero(Number(p.subtotal) || 0));
      dato("Envío", Number(p.envio) ? dinero(Number(p.envio)) : "Gratis");
      dato("Total", dinero(Number(p.total) || 0));
      if (p.metodo) dato("Pago", p.metodo);
      dato("Entrega", p.modo === "domicilio" ? p.direccion || "A domicilio" : "Retiro en el local");
      cuerpo.append(productos, cuentas);
      plegable.append(resumen, cuerpo);
      const item = nodo("li");
      item.append(plegable);
      lista2.append(item);
    });
  };
  botonPedidos.addEventListener("click", () => {
    verPaso("pedidos");
    tituloC.focus();
  });
  panelC.querySelector('[data-paso="pedidos"] .cuenta-salir').addEventListener("click", () => {
    verPaso("sesion");
    botonPedidos.focus();
  });
  var botonPagos = panelC.querySelector(".cuenta-ver-pagos");
  var radiosMetodo = [...panelC.querySelectorAll('input[name="cuenta-metodo"]')];
  var hechoPagos = panelC.querySelector(".cuenta-pagos-hecho");
  function pintarPagos() {
    radiosMetodo.forEach((r) => {
      r.checked = r.value === sesion.metodo;
    });
    hechoPagos.hidden = true;
  }
  radiosMetodo.forEach((r) => r.addEventListener("change", () => {
    if (!r.checked) return;
    sesion.metodo = r.value;
    guardarCuenta();
    pintarSesion();
    puente.elegirMetodo?.(sesion.metodo);
    hechoPagos.hidden = false;
    hechoPagos.textContent = `Listo: tus pedidos saldrán marcados con ${nombreMetodo(sesion.metodo).toLowerCase()}.`;
  }));
  botonPagos.addEventListener("click", () => {
    verPaso("pagos");
    tituloC.focus();
  });
  panelC.querySelector('[data-paso="pagos"] .cuenta-salir').addEventListener("click", () => {
    verPaso("sesion");
    botonPagos.focus();
  });
  var prellenarPedido = () => {
    if (!sesion.dentro || !sesion.direccion || entrega.direccion) return;
    puente.ponerDireccion(sesion.direccion);
  };
  var ultimoFocoC = null;
  var abiertoC = () => panelC.classList.contains("is-open");
  var PASOS_DENTRO = ["sesion", "pedidos", "pagos"];
  var abrirC = (paso) => {
    ultimoFocoC = document.activeElement;
    if (sesion.dentro) verPaso(PASOS_DENTRO.includes(paso) ? paso : "sesion");
    else verPaso(paso || "entrar");
    fondoC.classList.add("is-open");
    panelC.classList.add("is-open");
    document.body.style.overflow = "hidden";
    apagarDetras(panelC, true);
    tituloC.focus();
  };
  var cerrarC = () => {
    menuCuenta?.classList.remove("is-open");
    navCuenta.setAttribute("aria-expanded", "false");
    fondoC.classList.remove("is-open");
    panelC.classList.remove("is-open");
    document.body.style.overflow = "";
    apagarDetras(panelC, false);
    olvidarFormulario();
    if (ultimoFocoC && ultimoFocoC.offsetParent === null) menuToggle?.focus();
    else ultimoFocoC?.focus();
  };
  var menuCuenta = document.createElement("div");
  menuCuenta.className = "cuenta-menu";
  menuCuenta.id = "cuenta-menu";
  navCuenta.insertAdjacentElement("afterend", menuCuenta);
  var opcionMenu = (va, dibujo, texto, extra = "") => `<button class="cuenta-menu-opcion" type="button" data-va="${va}">${dibujo}<span>${texto}</span>${extra}</button>`;
  function pintarMenu() {
    if (!sesion.dentro) {
      menuCuenta.innerHTML = '<div class="cuenta-menu-cabeza"><p class="cuenta-menu-hola">¡Hola!</p><p class="cuenta-menu-dicho">Entra para pedir más rápido y ver tus pedidos.</p></div><button class="cuenta-menu-principal" type="button" data-va="entrar">Iniciar sesión</button><button class="cuenta-menu-secundario" type="button" data-va="crear">Crear una cuenta</button>';
      return;
    }
    menuCuenta.innerHTML = '<div class="cuenta-menu-cabeza is-dentro"><span class="cuenta-menu-avatar" aria-hidden="true"></span><div><p class="cuenta-menu-nombre"></p><p class="cuenta-menu-correo"></p></div></div>' + opcionMenu("sesion", ICONOS.cuenta, "Mi cuenta") + opcionMenu("pedidos", ICONOS.pedidos, "Mis pedidos", '<span class="cuenta-menu-numero" hidden></span>') + opcionMenu("pagos", ICONOS.tarjeta, "Métodos de pago") + '<hr class="cuenta-menu-raya">' + opcionMenu("salir", ICONOS.salir, "Cerrar sesión");
    menuCuenta.querySelector(".cuenta-menu-avatar").textContent = iniciales(sesion.nombre);
    menuCuenta.querySelector(".cuenta-menu-nombre").textContent = sesion.nombre;
    menuCuenta.querySelector(".cuenta-menu-correo").textContent = sesion.correo;
    menuCuenta.querySelector('[data-va="salir"]').classList.add("is-salir");
  }
  var abrirMenuCuenta = (abierto2) => {
    menuCuenta.classList.toggle("is-open", abierto2);
    navCuenta.setAttribute("aria-expanded", String(abierto2));
  };
  navCuenta.setAttribute("aria-expanded", "false");
  navCuenta.setAttribute("aria-haspopup", "true");
  navCuenta.setAttribute("aria-controls", menuCuenta.id);
  navCuenta.dataset.tip = "Tu cuenta";
  flechasEnMenu(
    navCuenta,
    menuCuenta,
    abrirMenuCuenta,
    () => menuCuenta.classList.contains("is-open")
  );
  navCuenta.addEventListener("click", () => {
    closeMenu();
    const abrir3 = !menuCuenta.classList.contains("is-open");
    if (abrir3 && sesion.dentro) contarPedidos();
    abrirMenuCuenta(abrir3);
  });
  menuCuenta.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    abrirMenuCuenta(false);
    if (b.dataset.va === "salir") {
      cerrarSesion();
      navCuenta.focus();
      return;
    }
    abrirC(b.dataset.va);
  });
  var fueraDeCuenta = (destino) => !navCuenta.contains(destino) && !menuCuenta.contains(destino);
  document.addEventListener("click", (e) => {
    if (!fueraDeCuenta(e.target)) return;
    abrirMenuCuenta(false);
  });
  document.addEventListener("focusin", (e) => {
    if (!fueraDeCuenta(e.target)) return;
    abrirMenuCuenta(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !menuCuenta.classList.contains("is-open")) return;
    abrirMenuCuenta(false);
    navCuenta.focus();
  });
  fondoC.addEventListener("click", cerrarC);
  panelC.querySelector(".cuenta-cerrar").addEventListener("click", cerrarC);
  atraparFoco(panelC, abiertoC, cerrarC);
  panelC.querySelectorAll(".cuenta-cambiar").forEach((boton2) => {
    boton2.addEventListener("click", () => {
      avisoCrear.hidden = true;
      avisoEntrar.hidden = true;
      verPaso(boton2.dataset.va);
      tituloC.focus();
    });
  });
  var entrarEnSesion = (aviso) => {
    guardarCuenta();
    pintarSesion();
    prellenarPedido();
    puente.elegirMetodo?.(sesion.metodo);
    olvidarFormulario();
    verPaso("sesion");
    tituloC.focus();
    avisos.textContent = aviso;
  };
  panelC.querySelector(".cuenta-crear").addEventListener("click", async () => {
    intentadoC = true;
    const fallos = pintarCampos();
    const malos = Object.keys(fallos);
    if (malos.length) {
      avisoCrear.hidden = false;
      avisoCrear.textContent = malos.length === 1 ? "Falta corregir un campo." : `Faltan ${malos.length} campos por corregir.`;
      campos.find(({ clave }) => clave === malos[0])?.input.focus();
      return;
    }
    if (!puedeHuella()) {
      avisoCrear.hidden = false;
      avisoCrear.textContent = "Este navegador no puede guardar la contraseña aquí. Abre el sitio por https.";
      return;
    }
    huellaClave = await calcularHuella(datos.clave);
    sesion.nombre = datos.nombre;
    sesion.correo = datos.correo;
    sesion.telefono = datos.telefono;
    sesion.direccion = datos.direccion;
    sesion.verificado = false;
    irAVerificar();
  });
  var irAVerificar = () => {
    nuevoCodigo();
    campoCodigo.value = "";
    errorCodigo.hidden = true;
    campoCodigo.classList.remove("is-mal");
    avisoVerificar.hidden = true;
    codigoEstado.hidden = true;
    verPaso("verificar");
    cuentaAtras();
    tituloC.focus();
    avisos.textContent = `Te enviamos un código a ${correoAVerificar()}.`;
    mandarCodigo();
  };
  var marcarCodigo = (texto) => {
    errorCodigo.hidden = !texto;
    errorCodigo.textContent = texto;
    campoCodigo.classList.toggle("is-mal", Boolean(texto));
    avisoVerificar.hidden = !texto;
    avisoVerificar.textContent = texto;
  };
  campoCodigo.addEventListener("input", () => {
    const limpio = campoCodigo.value.replace(/[^0-9]/g, "").slice(0, 6);
    if (limpio !== campoCodigo.value) campoCodigo.value = limpio;
    if (!errorCodigo.hidden) marcarCodigo("");
  });
  var comprobarCodigo = () => {
    const escrito = campoCodigo.value.trim();
    if (escrito.length !== 6) {
      marcarCodigo("El código tiene 6 cifras.");
      campoCodigo.focus();
      return;
    }
    if (escrito !== codigoEsperado) {
      marcarCodigo("Ese código no es el que enviamos. Míralo otra vez.");
      campoCodigo.focus();
      return;
    }
    marcarCodigo("");
    codigoEstado.hidden = true;
    pararCuentaAtras();
    codigoEsperado = "";
    sesion.verificado = true;
    sesion.dentro = true;
    entrarEnSesion(`Correo verificado. Entraste como ${sesion.nombre}.`);
  };
  panelC.querySelector(".cuenta-verificar").addEventListener("click", comprobarCodigo);
  campoCodigo.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    comprobarCodigo();
  });
  codigoReenviar.addEventListener("click", () => {
    nuevoCodigo();
    campoCodigo.value = "";
    marcarCodigo("");
    cuentaAtras();
    campoCodigo.focus();
    avisos.textContent = "Te enviamos un código nuevo.";
    mandarCodigo();
  });
  var marcarEntrar = (input, error, texto, decir = false) => {
    error.hidden = !texto;
    error.textContent = texto || "";
    input.setAttribute("aria-invalid", texto ? "true" : "false");
    input.classList.toggle("is-mal", Boolean(texto));
    if (texto && decir) avisos.textContent = texto;
  };
  var entrar = async () => {
    const escrito = correoEntrar.value.trim();
    avisoEntrar.hidden = true;
    const malCorreo = fallaCorreo(escrito);
    const malClave = claveEntrar.value ? "" : "Escribe tu contraseña.";
    marcarEntrar(correoEntrar, errorEntrarCorreo, malCorreo);
    marcarEntrar(claveEntrar, errorEntrarClave, malClave);
    if (malCorreo) {
      correoEntrar.focus();
      return;
    }
    if (malClave) {
      claveEntrar.focus();
      return;
    }
    const guardado = correoGuardado();
    if (!guardado || guardado.toLowerCase() !== escrito.toLowerCase()) {
      marcarEntrar(correoEntrar, errorEntrarCorreo, guardado ? "No hay ninguna cuenta con este correo. Revisa que esté bien escrito: es el que usaste al registrarte." : "En este navegador no hay ninguna cuenta creada todavía. Créala con el enlace de abajo.", true);
      correoEntrar.focus();
      return;
    }
    if (!puedeHuella()) {
      avisoEntrar.hidden = false;
      avisoEntrar.textContent = "Este navegador no puede comprobar la contraseña aquí. Abre el sitio por https.";
      return;
    }
    const huella = huellaGuardada();
    if (!huella) {
      avisoEntrar.hidden = false;
      avisoEntrar.textContent = "Esta cuenta se creó sin contraseña. Vuelve a registrarte para ponerle una.";
      return;
    }
    if ((await calcularHuella(claveEntrar.value, huella.sal)).hash !== huella.hash) {
      marcarEntrar(
        claveEntrar,
        errorEntrarClave,
        "La contraseña no es correcta. Revisa mayúsculas y minúsculas, o pulsa Mostrar para ver lo que escribiste.",
        true
      );
      claveEntrar.focus();
      return;
    }
    leerCuenta();
    if (!sesion.verificado) {
      sesion.dentro = false;
      irAVerificar();
      return;
    }
    sesion.dentro = true;
    entrarEnSesion(`Entraste como ${sesion.nombre}.`);
  };
  panelC.querySelector(".cuenta-entrar").addEventListener("click", entrar);
  enterAvanza([correoEntrar, claveEntrar], entrar);
  correoEntrar.addEventListener("blur", () => {
    const escrito = correoEntrar.value.trim();
    if (!escrito) return;
    marcarEntrar(correoEntrar, errorEntrarCorreo, fallaCorreo(escrito));
  });
  correoEntrar.addEventListener("input", () => {
    if (errorEntrarCorreo.hidden) return;
    marcarEntrar(correoEntrar, errorEntrarCorreo, fallaCorreo(correoEntrar.value.trim()));
  });
  claveEntrar.addEventListener("input", () => {
    if (!errorEntrarClave.hidden) marcarEntrar(claveEntrar, errorEntrarClave, "");
  });
  function cerrarSesion() {
    const nombre = sesion.nombre;
    sesion.dentro = false;
    guardarCuenta();
    sesion.nombre = "";
    sesion.correo = "";
    sesion.telefono = "";
    sesion.direccion = "";
    sesion.verificado = false;
    sesion.metodo = "efectivo";
    pintarSesion();
    avisos.textContent = `Cerraste la sesión de ${nombre}.`;
  }
  panelC.querySelector(".cuenta-salir").addEventListener("click", () => {
    cerrarSesion();
    verPaso("entrar");
    tituloC.focus();
  });
  var botonesVer = [...panelC.querySelectorAll(".ver-clave")];
  var campoDeVer = (b) => panelC.querySelector(`#${b.getAttribute("aria-controls")}`);
  var verClave = (b, ver) => {
    campoDeVer(b).type = ver ? "text" : "password";
    b.textContent = ver ? "Ocultar" : "Mostrar";
    b.setAttribute("aria-label", ver ? "Ocultar la contraseña" : "Mostrar la contraseña");
  };
  botonesVer.forEach((b) => b.addEventListener("click", () => verClave(b, campoDeVer(b).type === "password")));
  function taparClaves() {
    botonesVer.forEach((b) => verClave(b, false));
  }
  var camposEditar = ["nombre", "telefono", "direccion"].map((clave) => ({
    clave,
    input: panelC.querySelector(`#cuenta-editar-${clave}`),
    error: panelC.querySelector(`#cuenta-editar-${clave}-error`)
  }));
  var avisoEditar = panelC.querySelector('[data-paso="editar"] .cuenta-aviso');
  var tocadosE = /* @__PURE__ */ new Set();
  var intentadoE = false;
  var valoresEditar = () => {
    const v = {};
    camposEditar.forEach(({ clave, input }) => {
      v[clave] = input.value.trim();
    });
    return v;
  };
  var pintarEditar = () => {
    const v = valoresEditar();
    const f = {};
    if (fallaNombre(v.nombre)) f.nombre = fallaNombre(v.nombre);
    if (fallaTelefono(v.telefono)) f.telefono = fallaTelefono(v.telefono);
    camposEditar.forEach(({ clave, input, error }) => {
      const texto = intentadoE || tocadosE.has(clave) ? f[clave] : "";
      error.hidden = !texto;
      error.textContent = texto || "";
      input.setAttribute("aria-invalid", texto ? "true" : "false");
      input.classList.toggle("is-mal", Boolean(texto));
    });
    return f;
  };
  function limpiarEditar() {
    tocadosE.clear();
    intentadoE = false;
    avisoEditar.hidden = true;
    camposEditar.forEach(({ input, error }) => {
      input.value = "";
      error.hidden = true;
      input.classList.remove("is-mal");
      input.setAttribute("aria-invalid", "false");
    });
  }
  camposEditar.forEach(({ clave, input }) => {
    input.addEventListener("input", () => {
      if (clave === "telefono") input.value = soloNueve(input.value);
      pintarEditar();
    });
    input.addEventListener("blur", () => {
      tocadosE.add(clave);
      pintarEditar();
    });
  });
  panelC.querySelector(".cuenta-editar").addEventListener("click", () => {
    limpiarEditar();
    camposEditar[0].input.value = sesion.nombre;
    camposEditar[1].input.value = sesion.telefono;
    camposEditar[2].input.value = sesion.direccion;
    verPaso("editar");
    tituloC.focus();
  });
  var guardarEdicion = () => {
    intentadoE = true;
    const fallos = Object.keys(pintarEditar());
    if (fallos.length) {
      avisoEditar.hidden = false;
      avisoEditar.textContent = fallos.length === 1 ? "Falta corregir un campo." : `Faltan ${fallos.length} campos por corregir.`;
      camposEditar.find(({ clave }) => clave === fallos[0])?.input.focus();
      return;
    }
    const v = valoresEditar();
    if (entrega.direccion && entrega.direccion === sesion.direccion) puente.ponerDireccion(v.direccion);
    sesion.nombre = v.nombre;
    sesion.telefono = v.telefono;
    sesion.direccion = v.direccion;
    guardarCuenta();
    pintarSesion();
    prellenarPedido();
    limpiarEditar();
    verPaso("sesion", "Guardamos tus cambios.");
    tituloC.focus();
  };
  panelC.querySelector(".cuenta-guardar").addEventListener("click", guardarEdicion);
  enterAvanza(camposEditar.map((c) => c.input), guardarEdicion);
  var iniciarCuenta = () => {
    leerCuenta();
    pintarSesion();
    prellenarPedido();
    if (sesion.dentro) puente.elegirMetodo?.(sesion.metodo);
  };
  puente.abrirC = abrirC;
  puente.correoGuardado = correoGuardado;

  // js/app.js
  var catalogStatus2 = document.querySelector(".catalog-status");
  var pieGuardado = document.querySelector(".footer-guardado");
  var pintarGuardado = (fecha = ultimaActualizacion()) => {
    if (!pieGuardado) return;
    const cuando = marcaBonita(fecha);
    pieGuardado.hidden = !cuando;
    pieGuardado.textContent = cuando ? `Tu pedido se guardó ${cuando} en este navegador.` : "";
  };
  puente.pintarGuardado = pintarGuardado;
  var sinCatalogo = (e) => {
    console.error(`No se pudo cargar ${RUTA}:`, e);
    if (!catalogStatus2) return;
    catalogStatus2.textContent = "No se pudo cargar el catálogo. Recarga la página; si sigue sin salir, escríbenos y te decimos qué hay hoy.";
  };
  var arrancar = async () => {
    try {
      const { productos } = await cargarProductos();
      montarCatalogo(productos);
      montarControlesDeFicha();
      vigilarImagenes();
    } catch (e) {
      sinCatalogo(e);
    }
    iniciarCanasta();
    iniciarCuenta();
    pintarGuardado();
    updateOpeningStatus();
    window.setInterval(updateOpeningStatus, 6e4);
  };
  arrancar();
})();
