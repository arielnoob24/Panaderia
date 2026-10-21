// ---- El cuadrito que sale al dejar el cursor quieto -------------------
// Hay botones que son solo un dibujo y no dicen en voz alta lo que hacen. El
// cuadrito lo cuenta, pero sin estorbar: solo si el cursor se queda, y se va
// en cuanto se mueve. Es uno solo para toda la pagina y lo pide cualquier cosa
// con data-tip, como en js/comun/ui.js, del que esto es la misma logica.
//
// Vive fuera del estado de React a proposito: se mueve con cada desplazamiento
// y cada paso del raton, y pintarlo por estado seria repintar a cada pixel.
// El componente pone la caja; el efecto la maneja, igual que antes.
import { useEffect, useRef } from 'react';

const ESPERA_TIP = 500;

function Globo() {
  const ref = useRef(null);

  useEffect(() => {
    const globo = ref.current;
    let relojTip = null;
    let relojOcultar = null;
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
      relojOcultar = setTimeout(() => { if (!conTip) globo.hidden = true; }, 160);
    };

    const colocarTip = (quien) => {
      const c = quien.getBoundingClientRect();
      globo.hidden = false;
      const g = globo.getBoundingClientRect();
      const margen = 8;
      // Encima de lo que se senala, y si no cabe arriba, debajo.
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

    const alEntrar = (e) => {
      // Llevar el cursor encima del globo para leerlo no lo cierra (WCAG 1.4.13).
      if (globo.contains(e.target)) return;
      const quien = e.target.closest?.('[data-tip]');
      if (quien === conTip || mandaElTeclado()) return;
      esconderTip();
      if (quien) mostrarTip(quien, false);
    };
    // Se esconde al salir de verdad: no al pasar del dibujo del boton a su
    // borde, ni al subir al globo para leerlo.
    const alSalir = (e) => {
      const quien = e.target.closest?.('[data-tip]');
      if (!quien || quien.contains(e.relatedTarget) || globo.contains(e.relatedTarget)) return;
      if (!mandaElTeclado()) esconderTip();
    };
    // Al tabular si sale; al pulsar con el raton no, que ahi ya se vio el
    // efecto. Un campo de texto casa con :focus-visible siempre, lo enfoque el
    // raton o el teclado, asi que para distinguirlos hay que recordar como se llego.
    let llegoConRaton = false;
    const alApuntar = () => { llegoConRaton = true; };
    // Escape con el cuadrito a la vista solo lo esconde (WCAG 1.4.13): se
    // ataja aqui, en la captura del documento, antes de que llegue al cerco
    // de la canasta, que si no se cerraba tambien.
    const alTeclear = (e) => {
      llegoConRaton = false;
      if (e.key !== 'Escape' || !conTip) return;
      esconderTip();
      e.stopPropagation();
    };
    const alEnfocar = (e) => {
      const quien = e.target.closest?.('[data-tip]');
      if (!quien) return;
      // Quien tabula hasta aqui si quiere saber que es esto. Quien lo pulso con
      // el raton ya lo esta usando: el cuadrito solo le taparia lo que escribe.
      if (llegoConRaton) esconderTip();
      else mostrarTip(quien, true);
    };
    // Si la pagina se mueve debajo, el cuadrito se queda apuntando al vacio.
    // Pero tabular hasta un boton ya desplaza la pagina: ahi no hay que
    // esconderlo -se iria en el mismo instante en que sale- sino seguirlo.
    const seguirOEsconder = () => {
      if (!conTip) return;
      if (document.activeElement === conTip) colocarTip(conTip);
      else esconderTip();
    };

    document.addEventListener('mouseover', alEntrar);
    document.addEventListener('mouseout', alSalir);
    document.addEventListener('pointerdown', alApuntar, true);
    document.addEventListener('keydown', alTeclear, true);
    document.addEventListener('focusin', alEnfocar);
    document.addEventListener('focusout', esconderTip);
    window.addEventListener('scroll', seguirOEsconder, { passive: true });
    window.addEventListener('resize', seguirOEsconder, { passive: true });
    return () => {
      clearTimeout(relojTip);
      clearTimeout(relojOcultar);
      document.removeEventListener('mouseover', alEntrar);
      document.removeEventListener('mouseout', alSalir);
      document.removeEventListener('pointerdown', alApuntar, true);
      document.removeEventListener('keydown', alTeclear, true);
      document.removeEventListener('focusin', alEnfocar);
      document.removeEventListener('focusout', esconderTip);
      window.removeEventListener('scroll', seguirOEsconder);
      window.removeEventListener('resize', seguirOEsconder);
    };
  }, []);

  return <div ref={ref} className="globo" role="tooltip" id="globo-ayuda" hidden />;
}

export default Globo;
