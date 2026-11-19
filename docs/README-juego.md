# Mundo Curioso

Juego web para niños de **4 a 6 años** con tres mini-juegos cortos que ejercitan funciones ejecutivas. Es un MVP escolar: una alternativa *activa* al contenido pasivo de video, donde el niño decide, recuerda y responde en lugar de solo mirar.

**Jugar en línea:** https://roberto-gm-p.github.io/mini-mi/

## Actividades

| Actividad | Qué hace el niño | Función cognitiva |
|---|---|---|
| **Hojas navegantes** | Dice hacia dónde apunta o vuela la hoja grande, ignorando las hojas chicas de los lados. La regla cambia según el color. | Control inhibitorio y flexibilidad cognitiva (inspirado en la tarea Flanker) |
| **Arma tu casa** | Mira una casa modelo unos segundos y la reconstruye de memoria con piezas. | Memoria de trabajo visoespacial |
| **Aprendo palabras** | Explora un cuarto, escucha el nombre de 4 objetos y luego los identifica. | Atención, vocabulario y memoria verbal |

Hay además una pantalla de bienvenida y una de **Mi progreso** (5 pantallas en total).

## Cómo correrlo

Abre `index.html` en Chrome o Firefox. No hay nada que instalar ni compilar.

## Decisiones de diseño

- **JavaScript sin frameworks.** Son 5 pantallas; un framework añadiría instalación, compilación y código que no podríamos explicar línea por línea. Aquí todo el código que corre está en este repositorio.
- **Scripts clásicos, sin módulos.** Los módulos ES no cargan al abrir un archivo con doble clic (`file://`); con `<script>` normales el juego funciona sin servidor.
- **Web Speech API para la voz.** Los niños de esta edad aún no leen, así que toda instrucción se narra. La voz del navegador evita grabar y distribuir archivos de audio. Si el navegador no la soporta, el juego sigue siendo jugable en silencio.
- **localStorage para el progreso.** No hay cuentas, servidor ni datos que salgan del dispositivo. Tampoco hay cookies, analítica ni rastreo.
- **Sin recompensa variable.** Plataformas como Cocomelon o TikTok retienen con estímulos rápidos y premios impredecibles. Aquí el refuerzo es siempre el mismo ("¡Muy bien!"), no hay cronómetro, rachas, monedas ni autoplay: el juego termina y lo dice.
- **Errores sin castigo.** Un error muestra una pista y deja reintentar. El progreso nunca usa porcentajes ni compara con otros niños.
- **SVG dibujado en el código.** Sin imágenes externas: no hay nada que descargar y cada dibujo se puede leer y modificar.

## Estructura de archivos

```
index.html             Página única: barra superior y contenedor donde se dibuja cada pantalla
css/styles.css         Paleta, botones y estilos de cada ventana
js/app.js              Enrutador por hash, estado en localStorage, voz y utilidades compartidas
js/v1-bienvenida.js    Menú principal
js/v2-hojas.js         Juego Hojas navegantes
js/v3-casa.js          Juego Arma tu casa (arrastrar o tocar-y-colocar)
js/v4-palabras.js      Juego Aprendo palabras
js/v5-progreso.js      Pantalla Mi progreso
```

### Cómo se conectan las piezas

1. `app.js` crea un objeto global `MundoCurioso`.
2. Cada archivo `vN-*.js` llama a `MundoCurioso.registrar('nombre', funcion)`; esa función dibuja su pantalla dentro de `<main id="app">`.
3. El enrutador lee el hash de la URL (`#bienvenida`, `#hojas`, `#casa`, `#palabras`, `#progreso`) y llama a la función correspondiente. Cualquier botón con `data-ir="nombre"` navega a esa pantalla.

### Qué se guarda

Una sola clave de `localStorage`, `mundoCurioso.v1`:

```json
{
  "sonido": true,
  "ultimoJuego": "hojas",
  "juegos": {
    "hojas":    { "mejor": 6, "veces": 2 },
    "casa":     { "mejor": 4, "veces": 1 },
    "palabras": { "mejor": 4, "veces": 3 }
  }
}
```

`mejor` es el resultado de la mejor sesión y `veces` las sesiones terminadas. Si el dato está corrupto, el juego empieza de cero sin fallar.

## Limitaciones conocidas del MVP

- **Sin reconocimiento de voz.** En "Aprendo palabras" el niño dice la palabra y toca "Ya la dije"; el juego no verifica que la haya dicho.
- **La voz depende del dispositivo.** La calidad cambia entre navegadores, algunos necesitan conexión para sintetizar y si no hay voz en español instalada puede sonar con acento extraño o no sonar.
- **"Arma tu casa" no se puede jugar solo con teclado**, y una sesión solo se guarda si se terminan las tres casas.
- **El resultado de la casa** cuenta las piezas correctas en la primera revisión de la tercera casa, no en las tres.
- **Contenido fijo:** una sola casa, 4 palabras y dificultad que no se adapta al niño.
- **Probado en Chromium** (escritorio y ancho de teléfono emulado). No se ha probado con niños ni en teléfonos reales, Safari o Firefox.
- **No es un instrumento validado.** Las actividades se inspiran en tareas de psicología cognitiva, pero no hay evidencia de que este juego mejore esas funciones.

## Siguientes pasos

- Controles para padres (límite de tiempo, reiniciar progreso).
- Más niveles y contenido: más casas, más cuartos y palabras.
- Soporte sin conexión con audio pregrabado en lugar de voz sintetizada.
- Pruebas con niños reales y ajuste de dificultad según lo observado.

## Créditos

- Autor: Roberto `[tus apellidos]`
- Tecnológico de Monterrey, campus León
- Materia: `[tu materia]`
