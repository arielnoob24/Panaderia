(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');

  const closeMenu = () => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
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
    if (event.key === 'Escape') closeMenu();
  });

  const filters = [...document.querySelectorAll('.filter-input')];
  const products = [...document.querySelectorAll('.product-card')];
  const catalogStatus = document.querySelector('.catalog-status');
  const updateCatalog = () => {
    const selected = filters.find((filter) => filter.checked);
    const category = selected?.id.replace('filter-', '') || 'todos';
    let visibleCount = 0;

    products.forEach((product) => {
      const visible = category === 'todos' || product.dataset.category === category;
      product.hidden = !visible;
      if (visible) visibleCount += 1;
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
  };
  filters.forEach((filter) => filter.addEventListener('change', updateCatalog));
  updateCatalog();

  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      image.parentElement?.classList.add('image-unavailable');
    });
  });
  document.querySelectorAll('.map-panel iframe').forEach((map) => {
    map.addEventListener('error', () => {
      map.hidden = true;
      const fallback = map.parentElement?.querySelector('.map-fallback');
      if (fallback) fallback.style.display = 'block';
    });
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
    const reason = holiday ? ' · Día festivo' : '';
    const status = isOpen ? 'Abierto hoy' : 'Cerrado hoy';
    label.lastChild.textContent = ` ${status}${reason}`;
  };
  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60000);
})();
