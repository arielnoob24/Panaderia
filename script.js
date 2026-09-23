(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');

  const closeMenu = (restoreFocus = false) => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
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
    if (event.key === 'Escape') closeMenu(true);
  });
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

    productGrid?.classList.remove('is-filtering');
    products.forEach((product) => {
      const visible = category === 'todos' || product.dataset.category === category;
      product.hidden = !visible;
      if (visible) {
        product.style.setProperty('--catalog-delay', `${diagonalDelay(visibleCount, columns, 40, 320)}ms`);
        product.classList.toggle('catalog-enter', animate);
        if (animate) entering.push(product);
        visibleCount += 1;
      } else {
        product.classList.remove('catalog-enter');
      }
      let availability = product.querySelector('.availability');
      if (!availability) {
        availability = document.createElement('span');
        availability.className = 'availability';
        product.querySelector('.product-bottom')?.prepend(availability);
      }
      availability.textContent = product.dataset.available === 'false' ? 'Agotado' : 'Disponible';
      availability.classList.toggle('is-unavailable', product.dataset.available === 'false');
    });

    if (catalogStatus) catalogStatus.textContent = `${visibleCount} producto${visibleCount === 1 ? '' : 's'} disponible${visibleCount === 1 ? '' : 's'} en esta categoría.`;
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
  document.querySelectorAll('.map-panel iframe').forEach((map) => {
    const panel = map.parentElement;
    panel?.classList.add('is-loading');
    map.addEventListener('load', () => panel?.classList.remove('is-loading'), { once: true });
    map.addEventListener('error', () => {
      map.hidden = true;
      panel?.classList.remove('is-loading');
      const fallback = map.parentElement?.querySelector('.map-fallback');
      if (fallback) fallback.style.display = 'block';
    });
  });

  // Una animación dominante por zona. El patrón describe la forma de cada zona:
  // fade-up de base, máscara para la foto en retrato, eje X para el texto y la franja,
  // secuencia numerada para los principios y solo opacidad para el iframe del mapa.
  const motionMap = [
    ['.sign-band', 'reveal-band'],
    ['.section-heading', 'reveal'],
    ['.product-card', 'reveal'],
    ['.story-photo', 'reveal-mask'],
    ['.story-copy', 'reveal-x'],
    ['.principles', 'reveal-line'],
    ['.location-card', 'reveal'],
    ['.map-panel', 'reveal-fade']
  ];
  const motionItems = [];
  motionMap.forEach(([selector, pattern]) => {
    document.querySelectorAll(selector).forEach((item) => {
      item.classList.add(pattern);
      item.dataset.motion = pattern;
      motionItems.push(item);
    });
  });
  document.querySelectorAll('.product-grid, .location-grid').forEach((grid) => grid.classList.add('reveal-stagger'));
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
    const location = document.querySelector('.featured-location');
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
    const reason = holiday ? ' · Día festivo' : '';
    const status = isOpen ? 'Abierto hoy' : 'Cerrado hoy';
    label.lastChild.textContent = ` ${status}${reason}`;
  };
  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60000);
})();
