// ---- #/admin: el panel de quien atiende el local -------------------------
// Resumen, Pedidos y Productos (tanda 1 del panel, seccion 13 del plan). Sin
// sesion se va a entrar; con sesion de cliente se dice que no hay nada aqui.
// Cada pestaña se enseña solo si el rol tiene su permiso (usePanel), y la API
// lo vuelve a comprobar en cada ruta. #/admin lleva a la primera que se pueda.
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import MarcoCuenta from '../cuenta/MarcoCuenta.jsx';
import { Desvio } from '../cuenta/Desvio.jsx';
import { usePanel } from './usePanel.js';
import Resumen from './Resumen.jsx';
import Pedidos from './Pedidos.jsx';
import Productos from './Productos.jsx';
import Inventario from './Inventario.jsx';
import Compras from './Compras.jsx';
import Bodega from './Bodega.jsx';
import Produccion from './Produccion.jsx';
import Ajustes from './Ajustes.jsx';
import '../estilos/admin.css';

const VISTAS = { resumen: Resumen, pedidos: Pedidos, productos: Productos, inventario: Inventario, compras: Compras, bodega: Bodega, produccion: Produccion, ajustes: Ajustes };

function Panel() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <ConSesion />;
}

function ConSesion() {
  const { pathname } = useLocation();
  const { listo, secciones, rol } = usePanel();
  const actual = pathname.split('/')[2] || '';

  if (!listo) {
    return (
      <MarcoCuenta paso="admin" titulo="Panel" pestana="Panel de administración">
        <div className="cuenta-formulario"><p className="admin-vacio" role="status">Mirando qué puedes ver…</p></div>
      </MarcoCuenta>
    );
  }
  if (!secciones.length) {
    return (
      <MarcoCuenta paso="admin" titulo="Panel" pestana="Panel de administración">
        <div className="cuenta-formulario">
          <p className="admin-vacio">Esta cuenta no tiene acceso al panel. Es solo para quien atiende el local.</p>
          <p className="cuenta-pie"><Link className="cuenta-salir cuenta-volver-datos" to="/cuenta">Volver a mis datos</Link></p>
        </div>
      </MarcoCuenta>
    );
  }
  // #/admin, o una pestaña que este rol no tiene: a la primera que si.
  const seccion = secciones.find((s) => s.id === actual);
  if (!seccion) return <Navigate to={`/admin/${secciones[0].id}`} replace />;
  const Vista = VISTAS[seccion.id];

  return (
    <MarcoCuenta paso="admin" titulo="Panel" pestana={`${seccion.nombre} | Panel`}>
      <div className="cuenta-formulario admin-hoja">
        <nav className="admin-pestanas" aria-label="Secciones del panel">
          {secciones.map((s) => (
            <Link key={s.id} className="admin-pestana" to={`/admin/${s.id}`} aria-current={s.id === seccion.id ? 'page' : undefined}>
              {s.nombre}
            </Link>
          ))}
        </nav>
        <p className="admin-rol">Entraste como {rol.toLowerCase()}.</p>
        <Vista />
      </div>
    </MarcoCuenta>
  );
}

export default Panel;
