// ---- Empaquetar para abrir sin servidor -------------------------------
// Abierto con doble clic (file://), el navegador no carga modulos de
// JavaScript ni deja leer data/productos.json. Este guion junta los 11
// modulos en un solo script normal, con el catalogo metido dentro, y lo deja
// en js/sin-servidor.js. index.html solo lo usa cuando la pagina se abre como
// archivo; servida por HTTP sigue cargando los modulos de siempre.
//
// Hay que volver a correrlo cada vez que se toca algo de js/ o del catalogo:
//   node herramientas/empaquetar.mjs
// El CI lo corre tambien y no publica si el archivo no esta al dia.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SALIDA = 'js/sin-servidor.js';

// La version va fija para que en el CI y en esta maquina salga el mismo
// archivo, letra por letra: si no, la comprobacion fallaria sin motivo.
const codigo = execSync(
  'npx --yes esbuild@0.28.2 js/app.js --bundle --format=iife --target=es2020 --charset=utf8',
  { encoding: 'utf8' },
);
const catalogo = JSON.stringify(JSON.parse(readFileSync('data/productos.json', 'utf8')));

writeFileSync(SALIDA, [
  '// Generado por herramientas/empaquetar.mjs: no se edita a mano.',
  '// Es el mismo codigo de js/, en un solo archivo y con el catalogo dentro,',
  '// para que index.html funcione abierto con doble clic.',
  `var CATALOGO_EMBEBIDO = ${catalogo};`,
  codigo,
].join('\n'));
console.log(`${SALIDA} listo.`);
