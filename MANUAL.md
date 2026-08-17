# Laboratorio Animado · manual del proyecto

> Este archivo es la memoria del proyecto. Si retomas el trabajo con Claude en
> otra conversación, **pégalo entero al principio**: contiene todas las
> decisiones tomadas y el contrato que debe cumplir cada animación.
>
> Última revisión: agosto de 2026.

---

## 1 · Qué es esto

Una biblioteca de animaciones científicas interactivas en español. Cada pieza
existe en tres niveles y los tres se alimentan entre sí:

| Nivel | Dónde | Para qué |
|---|---|---|
| **Vídeo vertical** | TikTok, YouTube Shorts, Facebook Reels | El anzuelo |
| **Vídeo largo** *(opcional)* | YouTube | La profundidad |
| **Simulación jugable** | La web | La razón de existir |

Alguien ve 40 segundos en el móvil, le queda la duda, entra en la web y **toca**
la simulación. Por eso los controles no son una herramienta de producción: son
el producto.

---

## 2 · Decisiones cerradas

No volver a discutirlas sin un motivo nuevo.

**Voz sí, sonido sintetizado no.** Los vídeos llevarán narración generada en
ElevenLabs y cargada en el estudio (ver sección 9). El sonido sintetizado en el
navegador se retiró (sección 5). Ahora mismo el código no tiene ninguna de las
dos cosas: los vídeos salen mudos. La voz sintética del navegador *no puede grabarse* (Chrome la genera
fuera de la pestaña) y grabar con micrófono añade fricción que mata la
constancia. El texto en pantalla **es** la narración.

**Frases cortas.** Como el texto se lee mientras la escena se mueve, cada parada
es una idea en una o dos líneas. Nada de párrafos.

**35–50 segundos** de duración estándar, 5–6 paradas. El mismo guion se estira a
vídeo largo cambiando el deslizador de duración. Con voz, manda la duración del
audio.

**La web es para tocar, las redes para mirar.** Quien entra a la web quiere
mover controles, no oír una explicación: **la voz no va en la web**, solo en el
vídeo. Los `.mp3` nunca entran en el repositorio.

**Identidad «Cianotipo».** Azul de Prusia, papel milimetrado bajo toda la
interfaz, ocre como única tinta de acento. Instrument Serif + Public Sans +
JetBrains Mono. Legibilidad por encima de la atmósfera: nada de texto de 9 px
ni de grises tenues sobre negro.

**Estructura plana.** Todos los archivos en una carpeta, sin subdirectorios. Las
descargas aplanan las carpetas y rompen las rutas relativas. `ordenar.ps1`
construye la versión con carpetas para publicar.

**Estudio oculto.** El panel de exportación solo aparece con `?studio` al final
de la dirección. Los dos paneles son **idénticos salvo esa sección**.

**Cada control vive con aquello sobre lo que actúa.** Es la regla que resuelve
casi todas las dudas de dónde poner un botón.

---

## 3 · Arquitectura

```
lab.css        Sistema visual. Común.
shell.js       Toda la infraestructura. Común.
index.html     Galería.
catalogo.js    Una entrada por animación. Lo único que tocas al publicar.
ordenar.ps1    Construye .\sitio\ con estructura de carpetas.

riemann.html   Página de la animación (10 líneas, siempre iguales).
riemann.js     La animación: escena, controles, guion.
riemann-portada.jpg
```

**El shell hace todo lo compartido:** panel, visita guiada, zonas seguras,
grabación, subtítulos, textos de publicación, sonido, portada, atajos.

**La animación solo declara:** su escena, sus controles, su guion, su sonido y
sus metadatos. Nunca sabe qué es TikTok ni cómo se centra en una zona segura.

Si algo va a repetirse en más de una animación, va al shell.

---

## 4 · El contrato de una animación

Todo lo que puede declarar un archivo de animación. Lo único obligatorio es
`meta`, `params` y `dibujar`.

```js
(function () {
"use strict";
const num = LabShell.num;

LabShell.registrar({

  meta: {
    id:'riemann',                   // sin espacios ni acentos: define nombres de archivo
    titulo:'Sumas de Riemann',
    subtitulo:'...',                // se dibuja en el vídeo, bajo la marca
    categoria:'Cálculo',
    lecturaPrincipal:'suma',        // id de la lectura grande del vídeo
    etiquetaPrincipal:'Área aproximada',
    gancho:'¿Cuánta área hay bajo una curva?',   // titular para redes
    etiquetas:['calculo','matematicas']          // hashtags propios
  },

  params: [
    { id:'fn', tipo:'opciones', label:'Función', valor:'cuad',
      opciones:[{v:'cuad',t:'x²'},{v:'seno',t:'sen x'}] },

    { id:'n', tipo:'rango', label:'Rectángulos',
      min:0, max:100, paso:1, valor:22, fmt:v => String(v) },

    // grupo:'vista' los manda a la sección Vista en vez de Controles
    { id:'curva', tipo:'interruptor', label:'Curva', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'suma', label:'Suma', acento:true },   // acento: se pinta en ocre
    { id:'pct',  label:'Desviación', video:true } // video: sale en el clip
  ],

  ayuda: [ ['Curvatura','Qué hace este control.'] ],

  guion: [
    { clave:'El problema',            // capítulo, arriba a la izquierda
      titulo:'Área bajo la curva',    // en ocre, tipografía serif
      texto:'Una o dos líneas. Se lee de un vistazo.',
      dato:() => `n = ${N} · error ${num(errPct,1)} %`,  // texto o función
      al:a => { a.set('n', 22); a.set('metodo','izq'); } // mueve los controles
    }
  ],

  iniciar(a)  {},                 // al cargar
  reiniciar(a){},                 // al restablecer valores y antes de grabar
  cambio(id, v, a) {},            // cuando el usuario toca un control
  tecla(e, a) {},                 // teclas no capturadas por el shell
  dibujar(g, a) {}                // cada fotograma
});
})();
```

### Lo que recibe `dibujar(g, a)`

| | |
|---|---|
| `g` | Contexto 2D. El fondo y el papel milimetrado ya están pintados. |
| `a.escena` | `{x, y, w, h, cx, cy}` — **el único sitio donde dibujar.** Ya descuenta cabecera, texto narrado y zona segura. |
| `a.p` | Valores actuales de los controles. |
| `a.dt`, `a.t` | Reloj de **simulación**. Se congela al pausar. |
| `a.dtr`, `a.tr` | Reloj de **interfaz**. Nunca para. Para transiciones de controles. |
| `a.u` | Escala del lienzo: `ancho / 1080`. Para grosores y geometría. |
| `a.uh` | Como `a.u` pero con **suelo de legibilidad** al navegar. Para cualquier texto. En vertical y al grabar vale exactamente `a.u`. |
| `a.leer(id, txt)` | Escribe una lectura. |
| `a.set(id, v)` | Cambia un control (lo usa el guion). |
| `a.grabando()` | `true` durante la grabación. |
| `a.num(v, d)` | Número con coma decimal. |

### Reglas al escribir una animación

1. **Dibuja solo dentro de `a.escena`.** Nunca uses `a.W` / `a.H` para colocar
   nada: en vertical se sale de la zona segura.
2. **Escala la geometría por `a.u` y el texto por `a.uh`.** Un `lineWidth: 2`
   que se ve bien en pantalla es invisible a 1080×1920. Y un rótulo escalado
   con `a.u` cae por debajo de 9 px en un móvil: para texto, siempre `a.uh`.
3. **Usa `a.dtr` para animar la interfaz** (una transición al mover un slider) y
   `a.dt` para la física. Si usas `a.dt`, en pausa los controles no responden.
4. **Dimensiona por el alcance máximo, no por el habitual.** Un péndulo doble
   con energía da vueltas completas y llega a dos brazos en cualquier
   dirección, también hacia arriba. Calcula el caso extremo y encájalo en
   `a.escena`, o se saldrá justo cuando la animación se pone interesante.
5. **No guardes coordenadas de pantalla entre fotogramas.** Guarda coordenadas
   del mundo y proyecta al dibujar; si no, al mover la cámara todo se retuerce.
5. **Vigila el coste por fotograma.** Saca los buffers del bucle y simplifica
   cuando haya muchos elementos (en Riemann, por encima de 110 rectángulos
   desaparecen bordes y relleno de error).

### Cómo escribir un guion

- 5 o 6 paradas. Una idea por parada.
- El texto se **lee en 4 segundos en un móvil**. Si tiene más de 15 palabras,
  córtalo.
- El `dato` es el remate numérico, no parte de la frase.
- `al` mueve los controles: es lo que hace que el vídeo se cuente solo.
- El shell reparte el tiempo **en proporción a la longitud del texto** y reserva
  la altura de la parada **más larga**, para que la escena no salte entre
  paradas.

---

## 5 · El sonido — RETIRADO, pendiente de decidir

> **El sonido no está en el código.** Se retiró entero en agosto de 2026: en
> escritorio sonaba bien, pero en el altavoz de un móvil siempre quedaba un
> resto audible que no conseguimos eliminar del todo. Esta sección se conserva
> como registro de lo aprendido, por si se retoma.
>
> Para volver a montarlo hay que rehacer: la cadena de audio en `shell.js`, la
> sección Sonido del panel, la mezcla en `comenzarGrabacion`, los códecs con
> pista de audio en `MIMES`, `API.sonar` y el campo `sonido` del contrato.

No había archivos de audio. **Todo se sintetiza en la pestaña**, y por eso se
graba dentro del vídeo sin necesidad de nada externo.

### La cadena

```
osciladores → ganancia con envolvente
   → paso alto 62 Hz      corta el retumbe que ningún móvil reproduce
   → paso bajo 2400 Hz    quita aspereza
   → limitador            redondea picos en vez de recortarlos
   → altavoces  +  pista de audio del vídeo
```

### Las dos capas

**Ambiente.** Continuo o casi. Lo declara la animación en `sonido.ambiente`:

| | |
|---|---|
| `deriva` | Acorde sostenido con vibrato lento. El más neutro. |
| `pulso` | Notas cortas cada medio segundo. Da energía. |
| `reticula` | Destellos agudos dispersos, 220–1300 Hz. Seco, técnico. |
| `grave` | Solo las dos voces bajas. Mínimo. |
| `silencio` | Nada. El vídeo sale sin pista de audio. |

**Eventos.** Los dispara la animación con `a.sonar({alto, fuerza, dur, forma,
pan, octava})`. `alto` va de 0 a 1 y el shell lo encaja en una pentatónica menor
construida sobre el acorde que suena en ese instante: por eso mil rebotes nunca
desafinan. Un cubo de fichas descarta los que no caben
(`sonido.notasPorSegundo`, 14 por defecto).

### El acorde desciende

A lo largo del recorrido el acorde baja casi una octava, de La 110 Hz a La 55 Hz.
Da arco musical sin que nadie lo note: la pieza empieza arriba y aterriza.

### Reglas aprendidas a golpes

**Nada por debajo de 62 Hz.** Un bajo a la mitad de la fundamental acababa en
27 Hz al final del recorrido. En un PC se oye como un zumbido sucio; en un móvil,
que no llega a esa frecuencia, como un chisporroteo. El filtro paso alto es la
red, pero al inventar un ambiente conviene no pisar ahí.

**Nada que suene sin parar.** Un tono sostenido, aunque esté afinado y en buen
registro, se percibe como zumbido de fondo. `reticula` no tiene ni una voz
continua: hay un 25 % de silencio repartido entre los destellos.

**Descartar, no acumular.** Si el navegador frena la pestaña, las notas
pendientes caerían todas en el mismo instante. `planificar` resincroniza y las
pierde.

**Probar en el móvil.** Un PC reproduce graves que un teléfono no, y un teléfono
destapa artefactos que un PC disimula. Los dos mienten de formas distintas.

---

## 6 · Dónde va cada control

| Sección | Qué contiene |
|---|---|
| **Controles** | Los sliders y opciones de la animación + *Restablecer valores* |
| **Vista** | Interruptores de qué se muestra |
| **Lecturas** | Cifras en vivo |
| **Visita guiada** | Iniciar · transporte `‹ Pausar ›` · Volver a la parada 1 · Capturar imagen · Salir |
| **Sonido** | Silenciar + volumen |
| **Estudio** *(solo `?studio`)* | Zona segura · duración · Grabar · Grabar las 3 · Portada 16:9 · Subtítulos · Textos |

**Dos reinicios distintos y deliberados.** *Restablecer valores* vive en
Controles porque es lo que reinicia. *Volver a la parada 1* vive en Visita
guiada. Un botón hereda su significado de la sección donde está.

Pausar y el transporte **solo aparecen con el recorrido en marcha**.

---

## 7 · Zonas seguras

Fracciones del fotograma 9:16. **Las apps las cambian: verifícalas cada pocos
meses con una captura real del móvil.**

| | Arriba | Abajo | Izq. | Der. |
|---|---|---|---|---|
| Facebook Reels | .115 | .219 | .06 | .185 |
| YouTube Shorts | .094 | .198 | .06 | .167 |
| TikTok | .104 | .260 | .06 | .231 |
| Todas | .115 | .260 | .06 | .231 |
| YouTube horizontal | .055 | .115 | .045 | .045 |

El formato horizontal es 16:9 y sirve para el vídeo largo. Con formato puesto, la
unidad `u` se apoya en el lado corto, así el texto pesa igual en vertical que en
apaisado.

El margen derecho existe porque ahí viven los iconos de like y compartir.

---

## 8 · Publicar una pieza

1. Abrir `animacion.html?studio`
2. Elegir plataforma y duración · **Grabar** (o *Grabar las 3*)
3. **Portada 16:9** → guardar como `{id}-portada.jpg` junto al resto.
   Para hacerlas todas de golpe: abre la galería con `?studio` y pulsa
   **Generar todas las portadas**. Abre cada animación en un marco oculto,
   la deja correr unos segundos y descarga su imagen. Unos 35 segundos
   para siete piezas.
4. **Textos para publicar** → copiar el de cada red
5. **Subtítulos** → descargar el `.srt` y subirlo a YouTube. Con la voz cargada
   y marcada, los tiempos salen de **tus marcas**, no de una estimación. Si lo
   exportas antes de marcar, el archivo dirá «estimado» y llevará desfase.
6. Subir los vídeos y pegar los identificadores en `catalogo.js`
7. `ordenar.ps1` → subir el contenido de `.\sitio\` a GitHub

Los `.srt`, las capturas y los vídeos **no van al repositorio**.

### Direcciones del proyecto

- Repositorio: `github.com/demonioDeb/laboratorioAnimado`
- Sitio: `https://demoniodeb.github.io/laboratorioAnimado`

Ese dominio está escrito en tres sitios y hay que tocarlos si algún día cambia:
`SITIO` en `shell.js`, y las etiquetas `og:url` y `og:image` de cada HTML.
Cada animación nueva hereda esas etiquetas de su plantilla HTML.

---

## 9 · Plan acordado, aún sin construir

Decidido en conversación tras publicar Riemann en YouTube y Facebook. Nada de
esto está en el código todavía.

### El diagnóstico

El vídeo salió **frío y seco**. La información es buena pero parece material de
clase, no algo que pare el dedo en un feed. Dos causas concretas:

- **El texto es un cartel.** Aparece de golpe, entero, y espera siete segundos.
  No entra, no acompaña a la escena, no tiene ritmo interno.
- **El guion explica en vez de provocar.** Cada parada es una afirmación
  cerrada. No hay tensión, así que nada invita a quedarse.

La estética cianotipo **no es el problema** y no se toca: es la marca, y hacerla
chillona sería perder lo que la distingue.

### Voz — HECHO

Narración por **audio generado fuera y cargado en el estudio**. Un `.mp3` reproducido dentro de la página sí se captura
en el vídeo (a diferencia de la voz sintética del navegador, que Chrome genera
fuera de la pestaña).

- **ElevenLabs, plan gratuito, desde su web.** Sin API. El guion de una pieza
  ronda los 400 caracteres, así que el cupo mensual da de sobra.
- **Un solo archivo** con toda la narración: suena más natural que seis trozos.
- **Sin API no hay marcas de tiempo**, así que la sincronía se marca a mano:
  se carga el audio, se reproduce en el estudio y **se pulsa la barra
  espaciadora al empezar cada parada**. Cuarenta segundos por pieza.
- El archivo se arrastra a la página; no vale una ruta del disco.
- **Manda el audio, no el guion.** La voz se genera con naturalidad y las
  paradas se ajustan a ella, no al revés.

Asumido: **esto añade unos diez minutos por pieza** y rompe la promesa inicial
de «grabar y subir». Decisión consciente: mejor pocas piezas buenas que muchas
secas.

**Cómo funciona en el panel Estudio**

0. **Textos para publicar** → el primer bloque es el **guion para la voz**, ya
   limpio y con líneas en blanco entre paradas. Cópialo y pégalo en ElevenLabs
   tal cual. Nunca uses el `.srt` para esto: la voz leería los números y los
   códigos de tiempo.
1. Arrastra el `.mp3` a la zona de suelta (o púlsala para elegirlo). La duración
   del clip se ajusta sola a la del audio.
2. **Marcar tiempos**: se reproduce desde el principio y pulsas **espacio** al
   empezar cada parada. La primera marca es el 0 automáticamente, así que para
   seis paradas son cinco pulsaciones.
3. **Ensayar**: lo ves entero, con voz y subtítulos, sin grabar.
4. **Grabar**: la voz entra en la pista de audio y el clip dura lo que dure
   el audio, no lo que diga el deslizador.

Los tiempos **viven solo en la sesión**: al recargar hay que volver a marcar.
Son cuarenta segundos. Si resulta pesado, se guardarán en el archivo de la
animación.

Con voz cargada, `progresoParada()` devuelve la posición del audio y el
resaltado de subtítulos se sincroniza solo.

### Subtítulos animados

Selector de estilos de presentación en el panel Estudio: palabra a palabra,
frase que sube, palabra clave resaltada, línea a línea.

**El texto completo se mantiene aunque haya voz.** Mucha gente ve sin sonido.

Pendiente y deseable: que texto y escena vayan sincronizados. Hoy la frase
«fíjate en todo lo que sobra» aparece siete segundos antes de que el rojo se
encienda.

### Guion

Reescribir para **abrir con el problema desnudo, no con el enunciado**. Ejemplo:
la curva sola dos segundos y «esta figura no tiene fórmula»; los rectángulos
entran después, como respuesta. Mismo contenido, invertido.

Y **cerrar invitando a la web**. Ahora la pieza termina y ya.

### La web: página intermedia

Cada animación tiene una presentación antes de la simulación, **en el mismo
archivo**, sin páginas extra:

- Resumen de qué es
- **«Qué puedes probar»**: tres o cuatro sugerencias concretas
  («sube los rectángulos a 200 y mira caer el error»)
- Vídeo de YouTube **enlazado, no incrustado** (carga más rápido y le suma
  visitas al vídeo)
- Cuatro botones: **abrir los controles · compartir · ver el código · invítame
  a un café**

Detalles cerrados:

| | |
|---|---|
| `riemann.html` | La presentación |
| `riemann.html` | En la descripción de los vídeos va **la dirección limpia**: quien llega desde YouTube, TikTok, Facebook o Instagram se salta la portada automáticamente, porque el shell mira de dónde viene. |
| `riemann.html?abrir` · `#abrir` | Fuerzan la entrada directa. Solo hacen falta si la plataforma borra el referente. |
| Botón del café | Preparado pero oculto hasta que haya enlace en el catálogo |
| Botón del código | Enlaza a los archivos de esa animación en GitHub, no al repositorio entero |
| El texto | Lo declara cada animación en su archivo, no el catálogo |

Sabido y aceptado: **esa página la verá poca gente al principio**, porque casi
todo el tráfico llega del vídeo y va directo a los controles. Se hace por el
retorno a largo plazo y para no depender solo de las redes.

Queda abierta la opción de un **artículo corto** por animación cuando alguna lo
merezca; es lo que haría que Google encuentre el sitio.

### Ideas aparcadas

**Grabar con OBS** girando el monitor a vertical. Daría audio del sistema y
resolución exacta, pero se pierde la sincronía del `.srt` y el encuadre
garantizado. Si se retoma, hace falta un botón «Ensayo para OBS»: todo el modo
grabación (lienzo 1080×1920, sin panel, sin guías, visita cronometrada) pero sin
`MediaRecorder`. Unas veinte líneas.

**El sonido sintetizado.** Ver sección 5.

### La voz del canal

**Alguien que te muestra algo asombroso**, no alguien que te reta. «Mira esto,
es increíble que funcione», nunca «seguro que crees que esto es imposible».

El reto engancha más rápido pero cansa a la quinta pieza y suena a listillo. El
asombro se sostiene veinte piezas y encaja con una estética sobria: no hace
falta prometer nada, basta con enseñar algo que de verdad lo tenga y quitarse de
en medio.

### Abre con el precio, no con el tema

**Nadie quiere saber qué es una suma de rectángulos. Quieren saber por qué tardó
tanto.** Esa es la frase que resume todo lo demás.

La primera línea no debe decir de qué trata el vídeo: debe decir **cuánto
costó**. Cuántos siglos, cuántos intentos fallidos, qué error lo desencadenó,
quién se equivocó.

| En vez de… | Mejor |
|---|---|
| «El área bajo una curva» | «Tardó dos mil años en descubrirse la integral» |
| «Qué es un vórtice» | «Tres siglos para escribir las reglas de un remolino» |
| «El efecto mariposa» | «Un error de tres decimales destruyó la predicción del tiempo» |
| «El problema de los tres cuerpos» | «Ganó un premio del rey de Suecia y luego encontró él mismo el fallo» |

Lo de la izquierda es un índice de libro de texto. Lo de la derecha abre una
pregunta que el espectador no puede evitar hacerse.

El contenido acaba siendo el mismo. Lo que cambia es **qué se promete en el
primer segundo**: no una explicación, sino una historia con un coste.

### Contarlo como un suceso, no como una clase

El guion funciona mejor **narrando lo que pasó** que explicando cómo funciona.
No «esta figura no tiene fórmula», sino «Arquímedes ya lo intentaba hace 2.200
años». La explicación entra sola por el camino, y la pieza deja de oler a aula.

Estructura que funciona: **alguien se topa con el problema → se le ocurre un
apaño → el apaño se convierte en herramienta → queda una grieta → alguien la
cierra → hoy se usa para todo → muévelo tú**.

**Un solo título, al principio.** Solo la primera parada declara `titulo`; las
demás lo omiten y el shell arrastra el último. Así la voz lo lee una vez, se
queda fijo en pantalla y la narración fluye sin cortes. Un título por segmento
rompe el hilo y confunde.

El `clave` de cada parada sí cambia —**«Riemann · 1854», «La grieta»**— pero no
se lee: es un rótulo pequeño arriba del bloque que sitúa al espectador.

**Una parada, una idea contada.** Dos frases con su propio pequeño arco:
situación, giro, remate. Con una sola frase suena a lista de fechas.

**Cuidado con los datos.** En este registro una fecha mal puesta te la señalan
en comentarios. Verificado para las dos piezas actuales:

| | |
|---|---|
| Arquímedes, método de exhausción | siglo III a.C. |
| Newton y Leibniz, cálculo | 1665–1684 |
| Riemann, integral rigurosa | 1854 |
| Leonardo, estudios de turbulencia | ~1508–1513, acuñó «turbolenza» |
| Helmholtz, teoremas de vórtices | 1858 |
| Kelvin, átomos como nudos | 1867, falso, pero nació la teoría de nudos |
| Navier-Stokes, existencia y suavidad | problema del milenio, sigue abierto |

**Riemann no es el padre del cálculo.** Lo son Newton y Leibniz. Riemann
demostró *cuándo* la suma de rectángulos converge, dos siglos después.

La escena acompaña la historia moviendo los controles con `al`, sin dibujar
nada nuevo: pocos rectángulos toscos en Arquímedes, muchísimos en Newton, la
duda volviendo a ocho en la grieta.

### Cuántas palabras por parada

Con voz, **cada marca que pulsas pone la sincronía a cero**. Entre marca y marca
el resaltado interpola suponiendo un ritmo constante, y la voz no lo es: respira,
pausa, alarga. Cuanto más larga la parada, más desfase se acumula sin corregir.

**Entre 20 y 26 palabras por parada. Nunca más de 28.** Una o dos frases, no tres.
El título cuenta: la primera parada tiende a ser la más larga, así que déjala corta.

Medido en los guiones de agosto de 2026: los que mejor cuadraban tenían paradas
parejas (Vórtices: 24, 24, 26, 26, 25, 24) y los que peor tenían saltos de 11 a 42.

### La voz pausa en los signos

El resaltado repartía el tiempo por longitud de palabra, y eso ignora que la voz
**se para en cada punto**. En una parada con tres frases el desfase acumulado
llegaba a cuatro o cinco segundos.

Ahora un punto pesa como siete caracteres extra y una coma como tres. Y el
barrido termina al 96 % de la parada, no al 82: antes acababa demasiado pronto.

### Reglas de escritura

1. **Abrir con lo que no cuadra, no con el tema.** «Área bajo la curva» es un
   tema. «Esta figura no tiene fórmula» es una tensión.
2. **Que cada parada deje algo abierto.** Una frase que se cierra del todo no da
   motivos para ver la siguiente.
3. **Primera persona del plural.** «Cuando los estrechamos, los huecos se cierran
   solos». Estás enseñando, no examinando.
4. **Nada que huela a examen.** No «aproximación», sino «no llega». No «el
   límite», sino «cuando ya no se distinguen».
5. **El dato como golpe, no como apoyo.** Suelto, después de la frase.
6. **Dejar que la escena haga el trabajo.** Si la animación muestra el error
   desplomándose, la frase no tiene que decirlo. Que la imagen sea lo grande.
7. **Rematar con algo que se recuerde**, no con un resumen. Para Riemann:
   *lo imposible no era medirlo, era medirlo de una sola vez.*

### Ideas para futuras animaciones

Se apuntan según aparecen; **no se construyen hasta que el sistema esté
completo**. Una buena idea se estrena una sola vez, y gastarla con el motor a
medias es desperdiciarla.

- **Péndulo doble o triple.** Dos que empiezan casi idénticos y acaban
  completamente distintos. El gancho no necesita explicación.
- **Problema de los tres cuerpos.** Las órbitas coreografiadas en figura de
  ocho, y un empujón mínimo que lo desmorona todo.
- **Osciladores en fase.** Puntos que solo van y vienen en línea recta pero
  aparentan movimiento circular; el patrón se deshace y vuelve a formarse.

Lo que tienen en común y le falta a Riemann: **atrapan sin que haya que entender
nada**. Reglas simples, comportamiento imposible. Las piezas que atrapan sin
explicación traen gente; las que exigen contexto la retienen. Hacen falta las
dos, pero no conviene empezar por las segundas.

### Orden de construcción

Sin tocar hasta terminarlo: **ondas → gas → rehacer la curvatura**. Ondas prueba
el rendimiento por píxel; gas, el estado irreversible.

Se eligieron como banco de pruebas técnico, antes de saber lo que sabemos sobre
el feed. Se mantienen, pero **con exigencia visual nueva**: ondas puede ser
espectacular si en vez de dos fuentes discretas se dibuja el campo entero con
color, tipo interferencia luminosa. El tema no decide si impresiona; lo decide
la ejecución.

**Al menos una de las tres se publica con el sistema completo** — voz, guion
nuevo y página intermedia. Si las tres salen como Riemann, llegaríamos a las
buenas ideas con el motor probado pero sin haber probado nunca la fórmula
entera.

### Lo que funciona en el feed

Observado en agosto de 2026 mirando piezas comparables con sus números a la
vista. No son opiniones: son cuentas de otros con el mismo tema.

| Cuenta | Tema | Me gusta | Guardados |
|---|---|---|---|
| Merlino Math | Polarización circular, con ecuación de Maxwell | 17.879 | 4.401 |
| Primek Science | Curvas de Lissajous | 14.997 | 3.134 |
| Mathiverse | Seno y coseno con círculos | 12.697 | 3.919 |
| Lucio Arese | El canto de un pájaro visualizado | 8.839 | 1.123 |
| Magik of Edit | Estrella de partículas, «Like Please» | **12** | 2 |

**El último es el más instructivo.** Visualmente es tan llamativo como los
demás, pero no hay nada real detrás. La belleza abre la puerta; lo que hace que
alguien comparta y guarde es sentir que ha aprendido algo verdadero. Los que
arrasan tienen las dos cosas.

Merlino pone una ecuación vectorial que casi nadie entiende y arrasa igual: la
dificultad no espanta si la imagen es hipnótica. Un comentario destacado admite
que no lo entiende, y aun así el vídeo se comparte 1.616 veces.

**Uno de cada cuatro lo guarda.** Ese impulso de «quiero volver a esto» es
exactamente el que debe llevar a la web.

### Qué tienen y nos falta

**Densidad visual.** Cientos o miles de trazos superpuestos formando algo
emergente. Nuestra parábola tiene una curva y cuatro rectángulos: es honesta y
es pobre de imagen. **La densidad pasa a ser criterio de diseño, no adorno.**

**Color como material.** Degradados a lo largo del recorrido, dos o tres tintas
cruzándose. La paleta cianotipo se mantiene, pero **en la escena puede usarse
con mucha más ambición** sin dejar de ser reconocible.

**Dos capas de texto.** Primek pone la ecuación *y* la traducción en lenguaje
llano: «sombra vertical → y», «donde se cruzan → nace el punto». No elige entre
rigor y claridad.

**Formato de lista.** Cinco variantes a la vez, cada una con su resultado.
Y series numeradas: una de esas cuentas va por la parte 34.

**La música no significa nada.** Ponen una pista que suena bien y ya. No intenta
acompañar a la escena ni explicarla. Nosotros diseñamos acordes que descendían
con el recorrido; era un esfuerzo que nadie iba a percibir.

### El reparto de papeles

**El vídeo impresiona. La web enseña.**

Eso libera al vídeo de tener que explicarlo todo, y libera a la web de tener que
ser espectacular. Riemann salió al revés: explica bien y no impresiona.

Consecuencia práctica sobre las zonas seguras: **la escena puede desbordar, el
texto que importa no.** Si una línea se sale por arriba, es decorado y no pasa
nada. Si se tapa una fórmula, la pieza está perdida — le ocurrió a Merlino, que
tiene el título comido por la interfaz de Facebook.

---

## 10 · Cosas sabidas

**El bucle de dibujo pide el siguiente fotograma antes de trabajar.** Antes lo
pedía al final, así que cualquier excepción —en el shell o en el `dibujar` de
una animación— congelaba la página para siempre y solo se salía recargando.
Ahora un fallo pinta un aviso, se registra en la consola y el siguiente
fotograma llega igual. **No quites ese `requestAnimationFrame` de la primera
línea de `bucle()`.**

**Con voz cargada, el deslizador de duración se ignora**: el clip dura lo que dure
el audio. Solo manda cuando grabas mudo.

**El códec importa más que la resolución.** `avc1.42E01E` es perfil Baseline, sin
CABAC ni fotogramas B: a igual tasa de bits se ve claramente peor. El shell pide
High primero. Y grabar a 1440 o 2160 mejora el resultado final porque las
plataformas dan más tasa de bits a los vídeos grandes.

**Las animaciones pendientes** en el orden acordado: ondas (rendimiento por
píxel), gas (estado irreversible), y rehacer la curvatura del espacio-tiempo
sobre esta arquitectura.

**Errores conocidos del archivo original de curvatura**, por si se reaprovecha:
el contador de años iba 2,9× rápido, la dilatación temporal del Sol sobre la
Tierra es ~0,3 s/año y no 66 µs, y las estelas guardaban coordenadas de
pantalla en vez de coordenadas del mundo.
