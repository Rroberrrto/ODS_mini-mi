/*
  app.js — el centro del juego.

  Define UN objeto global, MundoCurioso, con lo que comparten todas las pantallas:
    1. Estado guardado (localStorage)
    2. Voz (Web Speech API)
    3. Enrutador por hash (#bienvenida, #hojas, ...)
    4. Utilidades pequeñas (azar, mezclar, pantalla final)

  Cada archivo vN-*.js llama a MundoCurioso.registrar('nombre', funcion)
  para decir "yo sé dibujar esta pantalla".
*/
const MundoCurioso = (function () {

  /* ===================== 1. ESTADO GUARDADO ===================== */

  // Clave única en localStorage. El ".v1" permite cambiar el formato en el
  // futuro sin leer por error datos viejos.
  const CLAVE = 'mundoCurioso.v1';

  // Datos fijos de cada juego. "total" es el máximo de aciertos por sesión y
  // "frase" arma el texto de resultado (se usa al terminar y en Mi progreso).
  const JUEGOS = {
    hojas:    { nombre: 'Hojas navegantes', total: 8, frase: n => `${n} de 8 hojas a la primera` },
    casa:     { nombre: 'Arma tu casa',     total: 5, frase: n => `${n} de 5 piezas en su lugar` },
    palabras: { nombre: 'Aprendo palabras', total: 4, frase: n => `${n} de 4 objetos con su nombre` }
  };

  // Forma exacta de lo que se guarda. Si no hay nada guardado, se usa esto.
  function estadoInicial() {
    return {
      sonido: true,          // ¿la voz está activada?
      ultimoJuego: null,     // 'hojas' | 'casa' | 'palabras' (para "Jugar otra vez")
      juegos: {
        hojas:    { mejor: 0, veces: 0 },   // mejor = aciertos de la mejor sesión
        casa:     { mejor: 0, veces: 0 },   // veces = sesiones terminadas
        palabras: { mejor: 0, veces: 0 }
      }
    };
  }

  // Lee el estado guardado. Copia campo por campo (en vez de confiar en el
  // JSON completo) para que un dato corrupto o viejo nunca rompa el juego.
  function cargarEstado() {
    const estado = estadoInicial();
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado && typeof guardado === 'object') {
        if (typeof guardado.sonido === 'boolean') estado.sonido = guardado.sonido;
        if (JUEGOS[guardado.ultimoJuego]) estado.ultimoJuego = guardado.ultimoJuego;
        Object.keys(JUEGOS).forEach(function (juego) {
          const datos = guardado.juegos && guardado.juegos[juego];
          if (datos && Number.isFinite(datos.mejor) && Number.isFinite(datos.veces)) {
            estado.juegos[juego] = { mejor: datos.mejor, veces: datos.veces };
          }
        });
      }
    } catch (error) {
      // JSON inválido o localStorage bloqueado: seguimos con el estado inicial.
    }
    return estado;
  }

  // Guarda el estado. El try/catch existe porque en modo privado algunos
  // navegadores bloquean localStorage; el juego debe seguir funcionando.
  function guardarEstado() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (error) { /* sin persistencia, pero jugable */ }
  }

  // Anota una sesión terminada: suma una vez jugada y conserva el mejor resultado.
  function registrarSesion(juego, aciertos) {
    const datos = estado.juegos[juego];
    datos.veces += 1;
    datos.mejor = Math.max(datos.mejor, aciertos);
    estado.ultimoJuego = juego;
    guardarEstado();
  }

  const estado = cargarEstado();


  /* ===================== 2. VOZ ===================== */

  // Los niños de 4 a 6 años todavía no leen: toda instrucción se dice en voz alta.
  // Si el navegador no tiene Web Speech, "sintesis" queda en null y todas las
  // funciones de voz simplemente no hacen nada (degradación silenciosa).
  const sintesis = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voz = null;

  // Busca una voz en español: primero de México, luego cualquier español.
  // Las voces cargan tarde en algunos navegadores, por eso también se llama
  // desde el evento "voiceschanged".
  function elegirVoz() {
    const voces = sintesis.getVoices();
    voz = voces.find(v => v.lang.replace('_', '-') === 'es-MX')
       || voces.find(v => v.lang.toLowerCase().startsWith('es'))
       || null;
  }

  if (sintesis) {
    elegirVoz();
    sintesis.onvoiceschanged = elegirVoz;
  }

  // Dice un texto en voz alta. Corta lo que se estuviera diciendo para que
  // las frases no se encimen cuando el niño toca rápido.
  function hablar(texto) {
    if (!sintesis || !estado.sonido) return;
    sintesis.cancel();
    const locucion = new SpeechSynthesisUtterance(texto);
    locucion.lang = 'es-MX';
    if (voz) locucion.voice = voz;
    locucion.rate = 0.9; // un poco más lento, para niños pequeños
    sintesis.speak(locucion);
  }

  function callar() {
    if (sintesis) sintesis.cancel();
  }

  // Refleja en el botón de la barra si el sonido está activado.
  function pintarBotonSonido() {
    const boton = document.getElementById('boton-sonido');
    boton.setAttribute('aria-pressed', String(estado.sonido));
    boton.setAttribute('aria-label', estado.sonido ? 'Sonido activado' : 'Sonido apagado');
  }

  function alternarSonido() {
    estado.sonido = !estado.sonido;
    guardarEstado();
    pintarBotonSonido();
    if (estado.sonido) hablar('Sonido activado'); else callar();
  }


  /* ===================== 3. ENRUTADOR ===================== */

  const pantallas = {};      // nombre -> función que dibuja la pantalla
  let temporizadores = [];   // esperas pendientes de la pantalla actual

  // Cada archivo de ventana se apunta aquí.
  function registrar(nombre, dibujar) {
    pantallas[nombre] = dibujar;
  }

  // Igual que setTimeout, pero el enrutador cancela la espera si el niño
  // cambia de pantalla. Evita que un juego anterior hable o dibuje "tarde".
  function esperar(funcion, milisegundos) {
    temporizadores.push(setTimeout(funcion, milisegundos));
  }

  // Lee el hash de la URL y dibuja la pantalla correspondiente.
  // Se ejecuta al cargar la página y cada vez que cambia el hash.
  function enrutar() {
    let nombre = location.hash.replace('#', '');
    if (!pantallas[nombre]) nombre = 'bienvenida';

    // Limpieza de la pantalla anterior.
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
    callar();

    const app = document.getElementById('app');
    app.innerHTML = '';
    document.getElementById('boton-inicio').hidden = (nombre === 'bienvenida');
    pantallas[nombre](app);
    window.scrollTo(0, 0);
  }

  // Navega a una pantalla. Si ya estamos en ella (ej. "Jugar otra vez"),
  // el hash no cambia y no habría evento, así que se redibuja a mano.
  function ir(nombre) {
    if (location.hash === '#' + nombre) enrutar();
    else location.hash = nombre;
  }


  /* ===================== 4. UTILIDADES ===================== */

  // Elige un elemento al azar de una lista.
  function azar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  // Devuelve una copia desordenada de la lista (algoritmo Fisher-Yates).
  function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Dibujos SVG que se repiten en varias pantallas.
  const DIBUJOS = {
    personaje: `
      <svg class="personaje" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#D97757" stroke="#1F2937" stroke-width="4"/>
        <circle cx="42" cy="50" r="7" fill="#1F2937"/>
        <circle cx="78" cy="50" r="7" fill="#1F2937"/>
        <path d="M38 72 Q60 94 82 72" fill="none" stroke="#1F2937" stroke-width="5" stroke-linecap="round"/>
      </svg>`,
    bocina: `
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/>
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
  };

  // Pantalla de cierre común a los tres juegos: guarda la sesión y ofrece
  // qué hacer después. Mismo mensaje tranquilo siempre: sin premios sorpresa.
  function mostrarFinal(app, juego, aciertos) {
    registrarSesion(juego, aciertos);
    const frase = 'Lograste ' + JUEGOS[juego].frase(aciertos) + '.';
    app.innerHTML = `
      <section class="final">
        ${DIBUJOS.personaje}
        <h1>¡Terminaste!</h1>
        <p class="frase">${frase}</p>
        <div class="botones">
          <button class="boton" type="button" data-ir="${juego}">Jugar otra vez</button>
          <button class="boton boton-suave" type="button" data-ir="progreso">Mi progreso</button>
          <button class="boton boton-suave" type="button" data-ir="bienvenida">Volver al inicio</button>
        </div>
      </section>`;
    hablar('¡Terminaste! ' + frase);
  }


  /* ===================== ARRANQUE ===================== */

  // Un solo "escucha" de clics para toda la app: cualquier botón con el
  // atributo data-ir="pantalla" navega a esa pantalla. Así las ventanas no
  // tienen que conectar cada botón de navegación por separado.
  document.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-ir]');
    if (boton) ir(boton.dataset.ir);
  });

  window.addEventListener('hashchange', enrutar);
  window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('boton-sonido').addEventListener('click', alternarSonido);
    pintarBotonSonido();
    enrutar();
  });

  // Lo que las ventanas pueden usar.
  return {
    JUEGOS, DIBUJOS, estado,
    registrar, ir, esperar,
    hablar, azar, mezclar, mostrarFinal
  };
})();
