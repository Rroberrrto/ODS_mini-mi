/*
  V4 · Aprendo palabras (#palabras)
  Vocabulario y memoria: un cuarto con 4 objetos.
    Fase 1 (explorar):  cada objeto tiene su nombre; al tocarlo se escucha.
    Fase 2 (responder): los nombres desaparecen y se pregunta por cada objeto.
  No hay reconocimiento de voz: el niño dice la palabra y toca "Ya la dije".
*/
(function () {
  const MC = MundoCurioso;

  // Cada objeto: su nombre, dónde va en el cuarto (en % del cuarto) y su dibujo.
  const OBJETOS = [
    { nombre: 'ventana', izq: 6, arriba: 3, ancho: 30, dibujo: `
        <rect x="10" y="10" width="80" height="80" fill="#BAE6FD" stroke="#78350F" stroke-width="6"/>
        <path d="M50 10V90M10 50H90" stroke="#78350F" stroke-width="4"/>` },
    { nombre: 'lámpara', izq: 60, arriba: 0, ancho: 28, dibujo: `
        <path d="M50 0V30" stroke="#1F2937" stroke-width="4"/>
        <polygon points="32,30 68,30 86,66 14,66" fill="#FDE68A" stroke="#CA8A04" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="50" cy="76" r="9" fill="#FEF9C3" stroke="#CA8A04" stroke-width="3"/>` },
    { nombre: 'silla', izq: 8, arriba: 50, ancho: 28, dibujo: `
        <rect x="24" y="6" width="10" height="88" fill="#B45309" stroke="#78350F" stroke-width="3"/>
        <rect x="24" y="50" width="54" height="10" fill="#B45309" stroke="#78350F" stroke-width="3"/>
        <rect x="68" y="60" width="10" height="34" fill="#B45309" stroke="#78350F" stroke-width="3"/>` },
    { nombre: 'mesa', izq: 54, arriba: 47, ancho: 38, dibujo: `
        <rect x="4" y="30" width="92" height="12" fill="#B45309" stroke="#78350F" stroke-width="3"/>
        <rect x="12" y="42" width="9" height="52" fill="#B45309" stroke="#78350F" stroke-width="3"/>
        <rect x="79" y="42" width="9" height="52" fill="#B45309" stroke="#78350F" stroke-width="3"/>` }
  ];

  // Flecha que va de la palabra hacia el objeto (el objeto queda arriba).
  const FLECHA_ARRIBA = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21V5M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  MC.registrar('palabras', function (app) {
    let preguntas;            // objetos en el orden en que se preguntarán
    let numero = 0;           // pregunta actual (0 a 3)
    let aciertos = 0;         // respuestas correctas AL PRIMER INTENTO
    let primerIntento = true;

    // El cuarto se dibuja una sola vez; las fases solo cambian detalles.
    const objetosHtml = OBJETOS.map(objeto => `
      <div class="objeto" style="left:${objeto.izq}%; top:${objeto.arriba}%; width:${objeto.ancho}%">
        <button class="objeto-dibujo" type="button" data-nombre="${objeto.nombre}" aria-label="${objeto.nombre}">
          <svg viewBox="0 0 100 100" aria-hidden="true">${objeto.dibujo}</svg>
        </button>
        <button class="etiqueta" type="button" data-nombre="${objeto.nombre}">${FLECHA_ARRIBA}${objeto.nombre}</button>
      </div>`).join('');

    app.innerHTML = `
      <section>
        <div class="cuarto" id="palabras-cuarto">${objetosHtml}</div>
        <div class="panel" id="palabras-panel" aria-live="polite"></div>
      </section>`;

    const cuarto = app.querySelector('#palabras-cuarto');
    const panel = app.querySelector('#palabras-panel');

    /* ---------- Fase 1: explorar ---------- */

    // Tocar un objeto o su palabra dice el nombre. Solo vale en la fase 1:
    // en la fase 2 los dibujos se desactivan (si no, se regalaría la respuesta).
    cuarto.addEventListener('click', function (evento) {
      const boton = evento.target.closest('[data-nombre]');
      if (boton) MC.hablar(boton.dataset.nombre);
    });

    function faseExplorar() {
      panel.innerHTML = `
        <h1>Toca cada cosa para oír su nombre</h1>
        <button class="boton" id="palabras-listo" type="button">Ya los vi</button>`;
      panel.querySelector('#palabras-listo').addEventListener('click', faseResponder);
      MC.hablar('Toca cada cosa para oír su nombre. Cuando termines, toca el botón.');
    }

    /* ---------- Fase 2: responder ---------- */

    function faseResponder() {
      cuarto.querySelectorAll('.etiqueta').forEach(etiqueta => etiqueta.remove());
      cuarto.querySelectorAll('.objeto-dibujo').forEach(boton => { boton.disabled = true; });
      preguntas = MC.mezclar(OBJETOS);
      numero = 0;
      preguntar();
    }

    // Resalta el objeto de la pregunta y atenúa los demás.
    function resaltar(nombre) {
      cuarto.querySelectorAll('.objeto-dibujo').forEach(function (boton) {
        const esEste = boton.dataset.nombre === nombre;
        boton.classList.toggle('objeto-resaltado', esEste);
        boton.classList.toggle('objeto-apagado', !esEste);
      });
    }

    // Muestra la pregunta actual con 3 opciones: la correcta y 2 distractoras.
    function preguntar() {
      const correcta = preguntas[numero].nombre;
      const otras = MC.mezclar(OBJETOS.map(o => o.nombre).filter(n => n !== correcta)).slice(0, 2);
      const opciones = MC.mezclar([correcta].concat(otras));
      primerIntento = true;
      resaltar(correcta);

      // Cada opción tiene DOS botones: la bocina (solo escuchar) y la palabra
      // (responder). Así un niño que no lee puede oír todas antes de elegir.
      panel.innerHTML = `
        <p class="contador">${numero + 1}/${preguntas.length}</p>
        <div class="pregunta-fila">
          <h1>¿Cómo se llama esto?</h1>
          <button class="boton-icono" id="palabras-repetir" type="button" aria-label="Repetir la pregunta">${MC.DIBUJOS.bocina}</button>
        </div>
        <div class="opciones">
          ${opciones.map(nombre => `
            <div class="opcion">
              <button class="boton-icono" type="button" data-oir="${nombre}" aria-label="Escuchar ${nombre}">${MC.DIBUJOS.bocina}</button>
              <button class="boton boton-suave" type="button" data-responder="${nombre}">${nombre}</button>
            </div>`).join('')}
        </div>`;

      panel.querySelector('#palabras-repetir').addEventListener('click', () => MC.hablar('¿Cómo se llama esto?'));
      panel.querySelectorAll('[data-oir]').forEach(function (boton) {
        boton.addEventListener('click', () => MC.hablar(boton.dataset.oir));
      });
      panel.querySelectorAll('[data-responder]').forEach(function (boton) {
        boton.addEventListener('click', () => responder(boton, correcta));
      });
      MC.hablar('¿Cómo se llama esto?');
    }

    function responder(boton, correcta) {
      if (boton.dataset.responder === correcta) {
        if (primerIntento) aciertos += 1;
        mostrarAcierto(correcta);
      } else {
        // Error: se apaga esa opción y el niño vuelve a intentar.
        primerIntento = false;
        boton.disabled = true;
        MC.hablar('Casi. Intenta con otra.');
      }
    }

    // Tras acertar: se muestra la palabra y se invita a decirla en voz alta.
    function mostrarAcierto(nombre) {
      panel.innerHTML = `
        <p class="nombre-grande">${nombre}</p>
        <p>¡Dilo en voz alta!</p>
        <button class="boton" id="palabras-dije" type="button">Ya la dije</button>`;
      MC.hablar('¡Muy bien! ' + nombre + '. Ahora dilo tú en voz alta.');

      panel.querySelector('#palabras-dije').addEventListener('click', function () {
        numero += 1;
        if (numero < preguntas.length) preguntar();
        else MC.mostrarFinal(app, 'palabras', aciertos);
      });
    }

    faseExplorar();
  });
})();
