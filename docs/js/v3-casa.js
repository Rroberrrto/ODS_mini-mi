/*
  V3 · Arma tu casa (#casa)
  Memoria de trabajo visoespacial: el niño ve una casa modelo unos segundos,
  el modelo desaparece y debe reconstruirla con las piezas de la bandeja.

  Todo ocurre dentro de UN solo <svg> de 300×420 unidades:
    - y de 0 a 240   -> tablero (donde se arma la casa)
    - y de 240 a 420 -> bandeja (donde esperan las piezas)
  Las posiciones se miden en unidades del SVG, no en píxeles de pantalla,
  para que la validación funcione igual en cualquier tamaño de pantalla.
*/
(function () {
  const MC = MundoCurioso;
  const TOLERANCIA = 20;       // qué tan lejos del lugar exacto se acepta una pieza
  const TOQUE_MINIMO = 52;     // tamaño mínimo de la zona tocable de una pieza

  // Cada forma se dibuja centrada en (0,0); la posición se da con translate().
  const FORMAS = {
    pared:   { ancho: 120, alto: 100, dibujo: '<rect x="-60" y="-50" width="120" height="100" fill="#FDE68A" stroke="#CA8A04" stroke-width="3"/>' },
    techo:   { ancho: 150, alto: 70,  dibujo: '<polygon points="-75,35 75,35 0,-35" fill="#EF4444" stroke="#991B1B" stroke-width="3" stroke-linejoin="round"/>' },
    puerta:  { ancho: 36,  alto: 56,  dibujo: '<rect x="-18" y="-28" width="36" height="56" fill="#B45309" stroke="#78350F" stroke-width="3"/><circle cx="10" cy="2" r="3" fill="#FDE68A"/>' },
    ventana: { ancho: 32,  alto: 32,  dibujo: '<rect x="-16" y="-16" width="32" height="32" fill="#BAE6FD" stroke="#075985" stroke-width="3"/><path d="M0 -16V16M-16 0H16" stroke="#075985" stroke-width="2"/>' }
  };

  // La casa completa: dónde va el centro de cada pieza. El orden importa por
  // dos razones: (1) cada nivel usa las primeras N piezas, y (2) las últimas
  // se dibujan encima (la puerta sobre la pared).
  const CASA = [
    { forma: 'pared',   x: 150, y: 180 },
    { forma: 'techo',   x: 150, y: 95 },
    { forma: 'puerta',  x: 150, y: 202 },
    { forma: 'ventana', x: 115, y: 160 },
    { forma: 'ventana', x: 185, y: 160 }
  ];
  const PIEZAS_POR_NIVEL = [3, 4, 5];

  // Dónde espera cada pieza en la bandeja (mismo orden que CASA).
  const BANDEJA = [
    { x: 225, y: 305 }, { x: 80, y: 305 },
    { x: 60, y: 388 }, { x: 150, y: 388 }, { x: 240, y: 388 }
  ];

  // Devuelve el SVG de una pieza. Incluye un rectángulo invisible ("toque")
  // para que las piezas chicas sean fáciles de agarrar con el dedo.
  function dibujarPieza(pieza, indice) {
    const forma = FORMAS[pieza.forma];
    const ancho = Math.max(forma.ancho, TOQUE_MINIMO);
    const alto = Math.max(forma.alto, TOQUE_MINIMO);
    return `
      <g class="pieza" data-i="${indice}" transform="translate(${pieza.x},${pieza.y})">
        <rect class="toque" x="${-ancho / 2}" y="${-alto / 2}" width="${ancho}" height="${alto}"/>
        ${forma.dibujo}
      </g>`;
  }

  function dibujarPiezas(piezas) {
    return piezas.map(dibujarPieza).join('');
  }

  // Cuenta cuántas piezas están en su lugar. Cada lugar ("meta") solo puede
  // usarse una vez; así las dos ventanas son intercambiables entre sí.
  function contarCorrectas(piezas, metas) {
    const libres = metas.slice();
    let correctas = 0;
    piezas.forEach(function (pieza) {
      const k = libres.findIndex(meta =>
        meta.forma === pieza.forma &&
        Math.hypot(meta.x - pieza.x, meta.y - pieza.y) <= TOLERANCIA);
      if (k >= 0) {
        correctas += 1;
        libres.splice(k, 1);
      }
    });
    return correctas;
  }

  MC.registrar('casa', function (app) {
    let nivel = 0;              // 0, 1 o 2
    let intento = 1;            // intento dentro del nivel actual
    let puntosFinales = 0;      // piezas correctas en la 1ª revisión del nivel 3
    let metas, piezas;          // posiciones correctas / posiciones actuales
    let seleccionada = null;    // índice de la pieza elegida con un toque
    let arrastre = null;        // datos del arrastre en curso
    let modeloVisible = false;  // mientras se ve el modelo no se puede mover nada
    let svg;

    // Dibuja el tablero del nivel y enseña el modelo 5 segundos.
    function empezarNivel() {
      metas = CASA.slice(0, PIEZAS_POR_NIVEL[nivel]);
      piezas = metas.map((meta, i) => ({ forma: meta.forma, x: BANDEJA[i].x, y: BANDEJA[i].y }));
      seleccionada = null;
      arrastre = null;

      app.innerHTML = `
        <section>
          <p class="contador">Casa ${nivel + 1}/3</p>
          <h1 id="casa-titulo" aria-live="polite"></h1>
          <svg id="casa-svg" viewBox="0 0 300 420" role="img" aria-label="Tablero para armar la casa">
            <rect class="bandeja" x="0" y="240" width="300" height="180"/>
            <polygon class="silueta" points="150,60 225,130 210,130 210,230 90,230 90,130 75,130"/>
            <g id="casa-piezas">${dibujarPiezas(piezas)}</g>
            <g id="casa-modelo">
              <rect width="300" height="420" fill="#FAF7F0"/>
              ${dibujarPiezas(metas)}
            </g>
          </svg>
          <div class="botones">
            <button class="boton boton-suave" id="casa-ver" type="button">Ver otra vez</button>
            <button class="boton" id="casa-revisar" type="button">Revisar mi casa</button>
          </div>
        </section>`;

      svg = app.querySelector('#casa-svg');
      svg.addEventListener('pointerdown', alPresionar);
      svg.addEventListener('pointermove', alMover);
      svg.addEventListener('pointerup', alSoltar);
      svg.addEventListener('pointercancel', alSoltar);
      app.querySelector('#casa-ver').addEventListener('click', () => mostrarModelo(3000));
      app.querySelector('#casa-revisar').addEventListener('click', revisar);

      mostrarModelo(5000);
    }

    // Tapa el tablero con la casa modelo durante un tiempo y luego la quita.
    function mostrarModelo(milisegundos) {
      const titulo = app.querySelector('#casa-titulo');
      const botones = app.querySelectorAll('#casa-ver, #casa-revisar');
      const modelo = app.querySelector('#casa-modelo');

      modeloVisible = true;
      seleccionar(null);
      modelo.style.display = '';
      botones.forEach(boton => { boton.disabled = true; });
      titulo.textContent = 'Mira bien la casa';
      MC.hablar('Mira bien la casa. Después la vas a armar tú.');

      MC.esperar(function () {
        modeloVisible = false;
        modelo.style.display = 'none';
        botones.forEach(boton => { boton.disabled = false; });
        titulo.textContent = 'Ahora ármala tú';
        MC.hablar('Ahora ármala tú.');
      }, milisegundos);
    }

    /* ---------- Mover piezas: arrastrar O tocar-y-colocar ---------- */

    // Convierte la posición del dedo/ratón (píxeles de pantalla) a unidades
    // del SVG. getScreenCTM() es la matriz que el navegador usa para dibujar
    // el SVG en pantalla; al invertirla hacemos el camino contrario.
    function puntoEnSvg(evento) {
      const punto = svg.createSVGPoint();
      punto.x = evento.clientX;
      punto.y = evento.clientY;
      return punto.matrixTransform(svg.getScreenCTM().inverse());
    }

    function grupoDe(indice) {
      return svg.querySelector('#casa-piezas [data-i="' + indice + '"]');
    }

    // Mueve una pieza (sin dejar que se salga del SVG).
    function moverPieza(indice, x, y) {
      const pieza = piezas[indice];
      pieza.x = Math.min(290, Math.max(10, x));
      pieza.y = Math.min(410, Math.max(10, y));
      grupoDe(indice).setAttribute('transform', `translate(${pieza.x},${pieza.y})`);
    }

    // Marca (o desmarca, con null) la pieza elegida con un toque.
    function seleccionar(indice) {
      if (seleccionada !== null) grupoDe(seleccionada).classList.remove('pieza-seleccionada');
      seleccionada = indice;
      if (indice !== null) grupoDe(indice).classList.add('pieza-seleccionada');
    }

    function alPresionar(evento) {
      if (modeloVisible) return;
      const punto = puntoEnSvg(evento);
      const grupo = evento.target.closest('#casa-piezas .pieza');
      const indice = grupo ? Number(grupo.dataset.i) : null;

      // Con una pieza ya elegida, tocar cualquier otro lugar la coloca ahí
      // (aunque sea encima de otra pieza: la puerta va sobre la pared).
      if (seleccionada !== null && indice !== seleccionada) {
        moverPieza(seleccionada, punto.x, punto.y);
        seleccionar(null);
        return;
      }
      if (indice === null) return;

      // Empieza un posible arrastre. Se guarda la distancia entre el dedo y
      // el centro de la pieza para que la pieza no "salte" al agarrarla.
      arrastre = {
        indice: indice,
        inicio: punto,
        dx: punto.x - piezas[indice].x,
        dy: punto.y - piezas[indice].y,
        seMovio: false
      };
      svg.setPointerCapture(evento.pointerId); // seguir el dedo aunque salga del SVG
    }

    function alMover(evento) {
      if (!arrastre) return;
      const punto = puntoEnSvg(evento);
      // Un dedo nunca se queda perfectamente quieto: solo cuenta como
      // arrastre si se movió más de 5 unidades.
      if (Math.hypot(punto.x - arrastre.inicio.x, punto.y - arrastre.inicio.y) > 5) {
        arrastre.seMovio = true;
      }
      if (arrastre.seMovio) moverPieza(arrastre.indice, punto.x - arrastre.dx, punto.y - arrastre.dy);
    }

    function alSoltar() {
      if (!arrastre) return;
      // Si no hubo movimiento fue un toque: elegir (o soltar) la pieza.
      if (arrastre.seMovio) seleccionar(null);
      else seleccionar(seleccionada === arrastre.indice ? null : arrastre.indice);
      arrastre = null;
    }

    /* ---------- Revisar y comparar ---------- */

    function revisar() {
      const correctas = contarCorrectas(piezas, metas);
      if (nivel === 2 && intento === 1) puntosFinales = correctas;
      mostrarComparacion(correctas);
    }

    // Enseña el modelo y la casa del niño lado a lado.
    function mostrarComparacion(correctas) {
      const todas = correctas === metas.length;
      const mensaje = todas
        ? '¡Tu casa quedó igual!'
        : `Pusiste ${correctas} de ${metas.length} piezas en su lugar`;
      const ultimo = nivel === PIEZAS_POR_NIVEL.length - 1;

      app.innerHTML = `
        <section>
          <h1>${mensaje}</h1>
          <div class="comparacion">
            <figure>
              <svg viewBox="0 0 300 240" role="img" aria-label="Casa modelo">${dibujarPiezas(metas)}</svg>
              <figcaption>Modelo</figcaption>
            </figure>
            <figure>
              <svg viewBox="0 0 300 240" role="img" aria-label="Tu casa">${dibujarPiezas(piezas)}</svg>
              <figcaption>Tu casa</figcaption>
            </figure>
          </div>
          <div class="botones">
            ${todas ? '' : '<button class="boton boton-suave" id="casa-reintentar" type="button">Intentar otra vez</button>'}
            <button class="boton" id="casa-seguir" type="button">${ultimo ? 'Terminar' : 'Siguiente casa'}</button>
          </div>
        </section>`;
      MC.hablar(mensaje + (todas ? '' : '. Puedes intentar otra vez.'));

      app.querySelector('#casa-seguir').addEventListener('click', function () {
        if (ultimo) {
          MC.mostrarFinal(app, 'casa', puntosFinales);
        } else {
          nivel += 1;
          intento = 1;
          empezarNivel();
        }
      });
      if (!todas) {
        app.querySelector('#casa-reintentar').addEventListener('click', function () {
          intento += 1;
          empezarNivel();
        });
      }
    }

    empezarNivel();
  });
})();
