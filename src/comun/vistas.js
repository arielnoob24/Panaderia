// ---- Las vistas y sus direcciones --------------------------------------
// Cada opcion del menu de arriba es una vista propia (seccion 15 del plan,
// "Vistas y aspecto"):
//   #/                    inicio: portada, franja y "Los mas pedidos"
//   #/nosotros            la historia
//   #/tienda-catalogo     el catalogo entero
//   #/tienda-<categoria>  el catalogo con "Filtrar por" puesto
//   #/contacto            horario, direccion, mapa y contacto
//   #/confirmar, #/comprobante  el pedido (src/pedido/)
//   #/cuenta/entrar, #/cuenta/crear, #/cuenta/verificar, #/cuenta/recuperar,
//   #/cuenta (Mis
//   datos), #/cuenta/pedidos   la cuenta (src/cuenta/); cada una lleva a
//   otra con replace cuando no corresponde (fase 5 en la seccion 15 del plan)
// Las tiendas son una sola vista: cambiar de categoria no es cambiar de
// pagina, y el catalogo no se vuelve a montar.
import { categoriaDeRuta } from '../catalogo/categorias.js';

// Las direcciones de cuando todo era una pagina larga (#historia, #visitanos...)
// estan en enlaces guardados y compartidos. React Router las lee como
// #/historia, y aqui se dice a que vista llevan; se entra con replace.
const VIEJAS = {
  '/inicio': '/',
  '/contenido': '/',
  '/historia': '/nosotros',
  '/visitanos': '/contacto',
  '/catalogo': '/tienda-catalogo',
};

// Las vistas de la cuenta, una por paso.
const CUENTA = {
  '/cuenta': 'cuenta',
  '/cuenta/entrar': 'cuenta-entrar',
  '/cuenta/crear': 'cuenta-crear',
  '/cuenta/verificar': 'cuenta-verificar',
  '/cuenta/recuperar': 'cuenta-recuperar',
  '/cuenta/pedidos': 'cuenta-pedidos',
};

// Que vista pide la direccion, o null si no es ninguna.
function vistaDeRuta(pathname) {
  if (pathname === '/' || pathname === '') return 'inicio';
  if (pathname === '/nosotros') return 'nosotros';
  if (pathname === '/contacto') return 'contacto';
  if (pathname === '/confirmar') return 'confirmar';
  if (pathname === '/comprobante') return 'comprobante';
  if (CUENTA[pathname]) return CUENTA[pathname];
  const categoria = categoriaDeRuta(pathname);
  return categoria && categoria !== 'todos' ? 'tienda' : null;
}

export { VIEJAS, vistaDeRuta };
