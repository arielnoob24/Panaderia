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
};

export { montarMapa, armarMapa, contarDistancia };
