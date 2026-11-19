/*
  V2 · Hojas navegantes (#hojas)
  Inspirado en la tarea Flanker: el niño responde sobre la hoja GRANDE del
  centro e ignora las hojas chicas de los lados (control inhibitorio).

  Dos reglas que se alternan (flexibilidad cognitiva), marcadas por color:
    - Hojas verdes y quietas   -> "¿Hacia dónde apuntan?" (mira la punta)
    - Hojas amarillas y móviles -> "¿Hacia dónde vuelan?" (mira el movimiento)
  Una hoja que vuela siempre avanza con la punta por delante.
*/
(function () {
  const MC = MundoCurioso;
  const RONDAS = 8;

  const REGLAS = {
    apuntan: { pregunta: '¿Hacia dónde apuntan?', relleno: '#BBF7D0', trazo: '#166534' },
    vuelan:  { pregunta: '¿Hacia dónde vuelan?',  relleno: '#FDE68A', trazo: '#CA8A04' }
  };

  const FLECHAS = {
    izq: '<svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M20 12H5M11 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    der: '<svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // Decide al azar cómo será una ronda. La regla NO es al azar: alterna
  // verde/amarillo para que el niño tenga que cambiar de regla cada vez.
  function crearRonda(numero) {
    return {
      regla: numero % 2 === 0 ? 'apuntan' : 'vuelan',
      direccion: MC.azar(['izq', 'der']),      // respuesta correcta (hoja central)
      distractoras: MC.azar(['izq', 'der']),   // hacia dónde van las hojas chicas
      porLado: MC.azar([1, 2])                 // 1 o 2 hojas chicas a cada lado
    };
  }

  // Dibuja una hoja. El SVG siempre apunta a la derecha; para la izquierda
  // se voltea con CSS (.hoja-izq). Las hojas amarillas llevan líneas de
  // viento detrás y una animación de deslizamiento.
  function dibujarHoja(regla, direccion, esObjetivo) {
    const color = REGLAS[regla];
    const vuela = regla === 'vuelan';
    const viento = vuela
      ? `<path d="M-18 24 H-4 M-20 40 H-2 M-18 56 H-4" stroke="${color.trazo}" stroke-width="3" stroke-linecap="round"/>`
      : '';
    const clases = ['hoja', 'hoja-' + direccion];
    if (esObjetivo) clases.push('hoja-objetivo');
    if (vuela) clases.push('vuela-' + direccion);

    return `
      <div class="${clases.join(' ')}">
        <svg viewBox="-22 0 118 80" aria-hidden="true">
          ${viento}
          <path d="M14 40 C14 8 50 4 94 40 C50 76 14 72 14 40 Z" fill="${color.relleno}" stroke="${color.trazo}" stroke-width="3"/>
          <path d="M2 40 H78" stroke="${color.trazo}" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>`;
  }

  MC.registrar('hojas', function (app) {
    let numero = 0;            // ronda actual (0 a 7)
    let aciertos = 0;          // rondas acertadas AL PRIMER INTENTO
    let primerIntento = true;  // ¿sigue siendo el primer intento de esta ronda?
    let bloqueado = false;     // true mientras se muestra el "¡Muy bien!"
    let ronda;

    app.innerHTML = `
      <section>
        <p class="contador" id="hojas-contador"></p>
        <div class="pregunta-fila">
          <h1 id="hojas-pregunta"></h1>
          <button class="boton-icono" id="hojas-repetir" type="button" aria-label="Repetir la pregunta">${MC.DIBUJOS.bocina}</button>
        </div>
        <div class="campo" id="hojas-campo"></div>
        <p class="aviso" id="hojas-aviso" aria-live="polite"></p>
        <div class="flechas">
          <button class="boton" type="button" data-dir="izq" aria-label="Izquierda">${FLECHAS.izq}</button>
          <button class="boton" type="button" data-dir="der" aria-label="Derecha">${FLECHAS.der}</button>
        </div>
      </section>`;

    const campo = app.querySelector('#hojas-campo');
    const aviso = app.querySelector('#hojas-aviso');

    function decirPregunta() {
      MC.hablar(REGLAS[ronda.regla].pregunta + ' Mira la hoja grande.');
    }

    // Prepara y dibuja la ronda actual.
    function mostrarRonda() {
      ronda = crearRonda(numero);
      primerIntento = true;
      bloqueado = false;

      // Hojas chicas + hoja grande al centro + hojas chicas.
      const chicas = dibujarHoja(ronda.regla, ronda.distractoras, false).repeat(ronda.porLado);
      campo.className = 'campo campo-' + ronda.regla;
      campo.innerHTML = chicas + dibujarHoja(ronda.regla, ronda.direccion, true) + chicas;

      app.querySelector('#hojas-contador').textContent = (numero + 1) + '/' + RONDAS;
      app.querySelector('#hojas-pregunta').textContent = REGLAS[ronda.regla].pregunta;
      aviso.textContent = '';
      decirPregunta();
    }

    // Revisa la flecha que tocó el niño.
    function responder(direccion) {
      if (bloqueado) return;

      if (direccion === ronda.direccion) {
        if (primerIntento) aciertos += 1;
        bloqueado = true;
        campo.classList.add('campo-bien');
        aviso.textContent = '¡Muy bien!';
        MC.hablar('¡Muy bien!');
        MC.esperar(siguiente, 1400);
      } else {
        // Error: sin castigo. Se señala la hoja que importa y se reintenta.
        primerIntento = false;
        campo.querySelector('.hoja-objetivo').classList.add('hoja-pista');
        aviso.textContent = 'Mira la hoja grande';
        MC.hablar('Casi. Mira la hoja grande del centro.');
      }
    }

    function siguiente() {
      numero += 1;
      if (numero < RONDAS) mostrarRonda();
      else MC.mostrarFinal(app, 'hojas', aciertos);
    }

    app.querySelectorAll('[data-dir]').forEach(function (boton) {
      boton.addEventListener('click', () => responder(boton.dataset.dir));
    });
    app.querySelector('#hojas-repetir').addEventListener('click', decirPregunta);

    mostrarRonda();
  });
})();
