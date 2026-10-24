import { m } from 'motion/react';

function IndicadorNav({ reducido }) {
  return (
    <span className="nav-indicador-marco" aria-hidden="true">
      <m.span
        className="nav-indicador"
        layoutId="indicador-menu-superior"
        transition={reducido ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  );
}

export default IndicadorNav;
