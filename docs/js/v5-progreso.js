/*
  V5 · Mi progreso (#progreso)
  Resume lo guardado en localStorage: la mejor sesión de cada juego y cuántas
  veces se jugó. A propósito NO hay porcentajes, rankings ni comparación con
  otros niños: solo lo que este niño ha logrado.
*/
(function () {
  const MC = MundoCurioso;

  // "1 vez" / "3 veces"
  function textoVeces(veces) {
    return veces === 1 ? 'Has jugado 1 vez.' : `Has jugado ${veces} veces.`;
  }

  MC.registrar('progreso', function (app) {
    const nombres = Object.keys(MC.JUEGOS);
    const jugados = nombres.filter(juego => MC.estado.juegos[juego].veces > 0);

    // Estado vacío: todavía no hay nada que mostrar.
    if (jugados.length === 0) {
      app.innerHTML = `
        <section class="final">
          ${MC.DIBUJOS.personaje}
          <h1>¡Mira lo que descubriste!</h1>
          <p class="frase">Todavía no has jugado. ¡Escoge tu primera actividad!</p>
          <div class="botones">
            ${nombres.map(juego => `<button class="boton" type="button" data-ir="${juego}">${MC.JUEGOS[juego].nombre}</button>`).join('')}
          </div>
        </section>`;
      return;
    }

    // Una tarjeta por juego (los no jugados muestran una invitación).
    const tarjetas = nombres.map(function (juego) {
      const datos = MC.estado.juegos[juego];
      const detalle = datos.veces > 0
        ? `<p>Tu mejor vez: ${MC.JUEGOS[juego].frase(datos.mejor)}.</p><p>${textoVeces(datos.veces)}</p>`
        : '<p>Aún no lo has probado. ¡Te espera!</p>';
      return `<article class="logro"><h2>${MC.JUEGOS[juego].nombre}</h2>${detalle}</article>`;
    }).join('');

    const ultimo = MC.estado.ultimoJuego;
    app.innerHTML = `
      <section>
        <h1>¡Mira lo que descubriste!</h1>
        ${tarjetas}
        <div class="botones">
          <button class="boton" type="button" data-ir="${ultimo}" aria-label="Jugar otra vez ${MC.JUEGOS[ultimo].nombre}">Jugar otra vez</button>
          <button class="boton boton-suave" type="button" data-ir="bienvenida">Volver al inicio</button>
        </div>
      </section>`;
  });
})();
