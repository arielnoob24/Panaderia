// ---- Las letras que saltan una tras otra (imprenta + ola, seccion 10) -----
// Cada letra va en su span con su turno (--i), y el CSS las hace saltar con
// el puntero encima (.h-ola). El lector de pantalla no tiene que oir letras
// sueltas: las letras van aria-hidden y el texto entero, escondido a la
// vista, es el que da nombre al enlace. Asi "Como llegar" se sigue llamando
// "Como llegar".
function TextoOla({ children }) {
  const texto = String(children);
  return (
    <>
      <span className="letras" aria-hidden="true">
        {[...texto].map((letra, i) => (
          // El indice es la clave buena: el texto no cambia de orden.
          <span key={i} style={{ '--i': i }}>{letra}</span>
        ))}
      </span>
      <span className="sr-only">{texto}</span>
    </>
  );
}

export default TextoOla;
