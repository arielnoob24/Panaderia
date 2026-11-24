// ---- Avisos del local, desde Firebase Firestore -----------------------
// Firestore es una base NoSQL: guarda documentos sueltos (como JSON) dentro
// de colecciones, sin tablas ni esquema fijo. La usamos para lo que cambia
// de un dia para otro y no pertenece al modelo relacional de PostgreSQL:
// los avisos del local ("Hoy cerramos a las 14:00 por el feriado"). Quien
// atiende los cambia en la consola de Firebase, sin desplegar nada.
//
// Coleccion "avisos", un documento por aviso:
//   { texto: "Hoy cerramos a las 14:00", activo: true, orden: 1 }
// La pagina solo LEE (las reglas de Firestore, firebase/firestore.rules,
// no dejan escribir a nadie desde fuera). Se lee por la API REST oficial de
// Firestore con fetch, sin el SDK: es una sola consulta y no hace falta
// cargar una libreria entera para ella.

const PROYECTO = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const CLAVE = import.meta.env.VITE_FIREBASE_API_KEY;
const ESPERA = 4000;

// Un valor de Firestore viene con su tipo: { stringValue: "..." },
// { booleanValue: true }, { integerValue: "1" }... Aqui se queda el valor.
const valor = (v = {}) => {
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  return null;
};

// Los avisos activos, por su campo "orden". [] si Firestore no esta
// configurado, no contesta a tiempo o trae algo raro: los avisos son un
// extra y nunca pueden romper la pagina.
const leerAvisos = async () => {
  if (!PROYECTO || !CLAVE) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents:runQuery?key=${CLAVE}`;
  // La consulta: los documentos de "avisos" con activo == true. Un filtro de
  // un solo campo no necesita indice compuesto; el orden se pone aqui.
  const consulta = {
    structuredQuery: {
      from: [{ collectionId: 'avisos' }],
      where: { fieldFilter: { field: { fieldPath: 'activo' }, op: 'EQUAL', value: { booleanValue: true } } },
      limit: 5,
    },
  };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consulta),
      signal: AbortSignal.timeout(ESPERA),
    });
    if (!r.ok) return [];
    const filas = await r.json();
    return (Array.isArray(filas) ? filas : [])
      .filter((f) => f.document?.fields)
      .map((f) => ({
        id: f.document.name.split('/').pop(),
        texto: String(valor(f.document.fields.texto) ?? '').trim(),
        orden: Number(valor(f.document.fields.orden)) || 0,
      }))
      .filter((a) => a.texto)
      .sort((a, b) => a.orden - b.orden);
  } catch (e) {
    return [];
  }
};

export { leerAvisos };
