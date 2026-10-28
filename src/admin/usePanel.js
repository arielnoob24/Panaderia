// ---- Que puede ver quien tiene la sesion abierta -------------------------
// El panel (#/admin) es para quien atiende el local, no para los clientes. La
// pagina solo pregunta a la API (GET /admin/yo) que rol tiene la cuenta y que
// permisos le da; con eso enseña u oculta el panel y sus secciones. Esconder
// no protege nada: cada ruta /admin de la API vuelve a mirar el permiso.
//
// La respuesta se guarda medio minuto por correo: la ficha de la cuenta y el
// panel la piden a la vez y no hace falta ir dos veces. null es "esta cuenta
// no tiene panel" (un cliente); undefined, que no se pudo saber (sin red).
import { useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionProvider.jsx';
import { pedirApi } from '../servicios/api.js';

const VIGENCIA = 30000;
const guardado = new Map();

const leer = (correo) => {
  const hay = guardado.get(correo);
  if (hay && Date.now() - hay.cuando < VIGENCIA) return hay.promesa;
  const promesa = pedirApi('/admin/yo', { sesion: true, espera: 8000 }).catch((e) => {
    if (e.estado === 401 || e.estado === 403 || e.estado === 404) return null;
    guardado.delete(correo);
    return undefined;
  });
  guardado.set(correo, { cuando: Date.now(), promesa });
  return promesa;
};

// Las secciones del panel, cada una con el permiso que la abre. El orden es
// el de las pestañas; la primera que se pueda es a la que lleva #/admin.
const SECCIONES = [
  { id: 'resumen', nombre: 'Resumen', permiso: 'reportes.ver' },
  { id: 'pedidos', nombre: 'Pedidos', permiso: 'pedidos.ver_todos' },
  { id: 'productos', nombre: 'Productos', permiso: 'productos.gestionar' },
];

// activo: false hasta que haga falta saber (la ficha de la cuenta espera a que
// se abra), para no preguntar en cada pagina a quien solo viene a comprar.
function usePanel(activo = true) {
  const { dentro, correo } = useSesion();
  const [lectura, setLectura] = useState({ correo: null, quien: null });
  useEffect(() => {
    if (!dentro || !activo) return undefined;
    let vigente = true;
    leer(correo).then((quien) => { if (vigente) setLectura({ correo, quien }); });
    return () => { vigente = false; };
  }, [dentro, activo, correo]);

  // Listo cuando la respuesta es de la cuenta que esta abierta ahora.
  const listo = dentro && activo && lectura.correo === correo;
  const permisos = listo && lectura.quien ? lectura.quien.permisos : [];
  const secciones = SECCIONES.filter((s) => permisos.includes(s.permiso));
  return { listo, rol: listo && lectura.quien ? lectura.quien.rol : '', permisos, secciones, hayPanel: secciones.length > 0 };
}

export { usePanel, SECCIONES };
