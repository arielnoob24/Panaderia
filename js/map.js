// ---- El mapa del reparto ----------------------------------------------
// Vive aparte porque es la unica parte del sitio que descarga una libreria de
// fuera, y solo cuando hace falta. Le pasa a la canasta el punto marcado para
// que recalcule el envio; eso va por el puente, porque la canasta tambien lo
// llama a el y no pueden importarse en redondo.
import { entrega, LOCAL, kmEntre, tarifaPara, dinero, puente } from './state.js';

// Los trozos del panel con que trabaja. Se rellenan en montarMapa, que es
// cuando la canasta ya ha creado el panel; antes de eso no hay nada que buscar.
let mapaLienzo = null;
let mapaFallo = null;
let mapaDato = null;
let mapaAqui = null;
let mapaCentro = null;
// El mapa de quien pasa a retirar es otro: ensena donde esta el local y no se
// marca nada en el, asi que no comparte ni lienzo ni aguja con el de arriba.
let localLienzo = null;
let localFallo = null;
let mapaLocal = null;

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

// ---- Buscar una direccion ---------------------------------------------
// Nominatim es el buscador de OpenStreetMap: gratis, sin clave y sin tarjeta,
// que es la unica clase de servicio que este proyecto puede usar. A cambio pide
// no inundarlo de consultas, de ahi que la canasta espere a que la mano pare
// antes de llamar aqui.
//
// La busqueda se ata a Ecuador y se centra en Tena: sin eso, "Eloy Alfaro" trae
// calles de medio continente, porque hay una en casi cada ciudad del pais.
const BUSCADOR = 'https://nominatim.openstreetmap.org/search';
const CAJA_TENA = '-78.1,-0.75,-77.5,-1.25';

const buscarDireccion = (texto) => {
  const url = `${BUSCADOR}?format=jsonv2&limit=6&addressdetails=1`
    + '&accept-language=es&countrycodes=ec'
    + `&viewbox=${CAJA_TENA}&q=${encodeURIComponent(texto)}`;
  return fetch(url, { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no respondio'))))
    .then((lista) => (Array.isArray(lista) ? lista : [])
      .map((sitio) => ({
        // display_name trae el pais y la provincia al final, que en una lista
        // de seis resultados de la misma ciudad es ruido repetido en todos.
        nombre: String(sitio.display_name || '').split(',').slice(0, 4).join(',').trim(),
        punto: { lat: Number(sitio.lat), lng: Number(sitio.lon) },
      }))
      .filter((s) => s.nombre && Number.isFinite(s.punto.lat) && Number.isFinite(s.punto.lng)));
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
  puente.pintarDesglose();
  puente.guardar();
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

// Llevar el mapa a un punto y dejar la aguja ahi. Lo llama el buscador al
// elegir un resultado: desde ese momento ya hay punto, asi que el envio se
// cobra por distancia y no por la tarifa de salida. Si el mapa todavia se esta
// descargando, se espera a que este: el punto ya quedo guardado en 'entrega', y
// armarMapa lo coloca al nacer.
const irAlPunto = (punto) => {
  ponerAguja(punto);
  armarMapa();
  if (!mapa || !aguja) return;
  if (!aguja._map) aguja.addTo(mapa);
  mapa.setView([punto.lat, punto.lng], 17);
  setTimeout(() => mapa.invalidateSize(), 60);
};

// El mapa del local: de referencia y nada mas. Sin arrastre, sin rueda y sin
// teclado, por lo mismo que se le quitaron al mapa del reparto en su dia: un
// mapa metido en una pagina larga que captura la rueda secuestra el
// desplazamiento. Para llegar de verdad esta el enlace de al lado, que abre la
// aplicacion de mapas con la ruta ya puesta.
const armarMapaLocal = () => {
  if (mapaLocal || !localLienzo) return;
  traerLeaflet().then((L) => {
    mapaLocal = L.map(localLienzo, {
      attributionControl: true,
      dragging: false, scrollWheelZoom: false, touchZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, zoomControl: false,
    }).setView([LOCAL.lat, LOCAL.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapaLocal);
    L.circleMarker([LOCAL.lat, LOCAL.lng], {
      radius: 9, color: '#a85f45', fillColor: '#d79b4a', fillOpacity: 1, weight: 3,
    }).addTo(mapaLocal).bindTooltip('El Tradicional');
    // Es una imagen, no un control: no se tabula hasta el ni se anuncia, porque
    // la direccion escrita encima ya dice lo mismo y el enlace hace lo util.
    localLienzo.setAttribute('aria-hidden', 'true');
    localLienzo.tabIndex = -1;
    setTimeout(() => mapaLocal.invalidateSize(), 60);
  }).catch(() => {
    if (localFallo) localFallo.hidden = false;
    if (localLienzo) localLienzo.hidden = true;
  });
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

// La canasta llama a esto una vez, con el panel ya creado.
const montarMapa = (panel) => {
  mapaLienzo = panel.querySelector('.mapa-lienzo');
  mapaFallo = panel.querySelector('.mapa-fallo');
  mapaDato = panel.querySelector('.mapa-dato');
  mapaAqui = panel.querySelector('.mapa-aqui');
  mapaCentro = panel.querySelector('.mapa-centro');
  localLienzo = panel.querySelector('.mapa-local-lienzo');
  localFallo = panel.querySelector('.mapa-local-fallo');

  mapaCentro?.addEventListener('click', marcarCentro);

  // "Usar mi ubicacion" vive arriba, junto al buscador: es la otra manera de
  // contestar a donde, y las dos tienen que estar en el mismo sitio. El estado
  // se escribe en el rotulo del buscador mientras el mapa sigue escondido, y
  // pasa al del mapa en cuanto este a la vista.
  const avisar = (texto) => {
    const estado = panel.querySelector('.dir-busca-estado');
    if (estado) estado.textContent = texto;
    if (mapaDato && mapa) mapaDato.textContent = texto;
  };

  mapaAqui?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      avisar('Este navegador no sabe decir dónde estás; márcalo en el mapa');
      puente.mostrarMapa?.();
      return;
    }
    avisar('Buscando dónde estás…');
    navigator.geolocation.getCurrentPosition((pos) => {
      // El punto del GPS cae en la manzana, no en la puerta: se ensena el mapa
      // para que se acabe de precisar, que es justo lo que no se podia hacer
      // cuando el mapa aparecia solo si ya se habia elegido domicilio.
      puente.mostrarMapa?.();
      irAlPunto({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      avisar('Esa es tu zona: arrastra la aguja hasta la puerta.');
    }, () => {
      avisar('No se pudo saber dónde estás; márcalo en el mapa');
      puente.mostrarMapa?.();
    }, { enableHighAccuracy: true, timeout: 8000 });
  });
};

export { montarMapa, armarMapa, armarMapaLocal, buscarDireccion, irAlPunto };
