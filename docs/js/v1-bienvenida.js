/*
  V1 · Bienvenida (#bienvenida)
  Menú principal: saludo, tres tarjetas de juego y acceso a "Mi progreso".
  Es la pantalla por defecto cuando el hash está vacío o no existe.
*/
(function () {
  const MC = MundoCurioso;

  // Un dibujo por tarjeta, para que el niño reconozca el juego sin leer.
  const ICONOS = {
    hojas: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M12 50 C12 24 52 18 92 50 C52 82 12 76 12 50 Z" fill="#BBF7D0" stroke="#166534" stroke-width="4"/>
        <path d="M2 50 H76" stroke="#166534" stroke-width="4" stroke-linecap="round"/>
      </svg>`,
    casa: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="22" y="48" width="56" height="44" fill="#FDE68A" stroke="#CA8A04" stroke-width="4"/>
        <polygon points="12,48 88,48 50,12" fill="#EF4444" stroke="#991B1B" stroke-width="4" stroke-linejoin="round"/>
        <rect x="42" y="64" width="16" height="28" fill="#B45309" stroke="#78350F" stroke-width="3"/>
      </svg>`,
    palabras: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M10 14 H90 V68 H44 L26 88 V68 H10 Z" fill="#FFFFFF" stroke="#1F2937" stroke-width="4" stroke-linejoin="round"/>
        <path d="M24 32 H76 M24 48 H60" stroke="#D97757" stroke-width="6" stroke-linecap="round"/>
      </svg>`
  };

  // El navegador prohíbe audio antes de que el usuario toque algo, así que el
  // saludo se dice en el primer toque. Esta bandera evita repetirlo cada vez
  // que se regresa al menú.
  let yaSaludo = false;

  MC.registrar('bienvenida', function (app) {
    // Una tarjeta por cada juego definido en app.js.
    const tarjetas = Object.keys(MC.JUEGOS).map(juego => `
      <button class="tarjeta" type="button" data-ir="${juego}">
        ${ICONOS[juego]}
        <span>${MC.JUEGOS[juego].nombre}</span>
      </button>`).join('');

    app.innerHTML = `
      <section>
        ${MC.DIBUJOS.personaje}
        <h1>¡Hola, explorador!</h1>
        <div class="tarjetas">${tarjetas}</div>
        <div class="centrado">
          <button class="boton boton-suave" type="button" data-ir="progreso">Mi progreso</button>
        </div>
      </section>`;

    if (!yaSaludo) {
      app.addEventListener('pointerdown', function () {
        yaSaludo = true;
        MC.hablar('¡Hola, explorador! Escoge un juego.');
      }, { once: true });
    }
  });
})();
