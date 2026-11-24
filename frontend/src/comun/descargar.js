// Hace que el navegador descargue un archivo armado en la pagina (un CSV,
// una base .sqlite), sin pasar por ningun servidor: un Blob, un enlace con
// download y un clic. La direccion temporal se suelta despues.
const descargar = (nombre, contenido, tipo) => {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export { descargar };
