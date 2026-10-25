// ---- Las letras que saltan una tras otra (la ola, seccion 10) --------------
// Cada letra va en su span con su turno (--i), y el CSS las hace saltar con
// el puntero encima ("Como llegar" de la portada, vistas.css). El lector de
// pantalla no tiene que oir letras sueltas: las letras van aria-hidden y el
// texto entero, escondido a la vista, es el que da nombre al enlace. Asi
// "Cómo llegar" y las categorias se siguen anunciando como una sola frase.
function TextoOla({ children }) {
  const texto = String(children);
  return (
    <>
      <span className="letras" aria-hidden="true">
        {[...texto].map((letra, i) => (
          // El indice es la clave buena: el texto no cambia de orden.
          // El espacio lleva su clase: en linea, para que se vea y la linea
          // se parta por ahi y no por dentro de una palabra (vistas.css).
          <span key={i} className={letra === ' ' ? 'ola-espacio' : undefined} style={{ '--i': i }}>{letra}</span>
        ))}
      </span>
      <span className="sr-only">{texto}</span>
    </>
  );
}

export default TextoOla;
