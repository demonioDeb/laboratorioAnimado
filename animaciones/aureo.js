/* ══════════════════════════════════════════════════════════
   Se lo inventó en 1855 y seguimos repitiéndolo

   Semillas colocadas con el modelo de Vogel: r = c·√n y un giro
   fijo entre una y la siguiente. Con el ángulo áureo el reparto
   es perfecto; con casi cualquier otro salen radios y huecos.

   Verificado: con 600 semillas, la distancia al vecino más
   cercano es 1,60 con el ángulo áureo y 1,10 con 137,3°.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const PHI = (1 + Math.sqrt(5)) / 2;
const AUREO = 360 / (PHI * PHI);          /* 137,5077° */

const RAMPA = [
  [0.00, '#1E4E74'],
  [0.26, '#2F86A8'],
  [0.50, '#5FC6DA'],
  [0.68, '#DDEDDF'],
  [0.85, '#E9A93C'],
  [1.00, '#FFD98A']
];
const NB = 18;
const aRGB = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
const COLOR = (() => {
  const out = [];
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    let a = RAMPA[0], b = RAMPA[RAMPA.length - 1];
    for (let k = 0; k < RAMPA.length - 1; k++)
      if (t >= RAMPA[k][0] && t <= RAMPA[k + 1][0]) { a = RAMPA[k]; b = RAMPA[k + 1]; break; }
    const f = (t - a[0]) / ((b[0] - a[0]) || 1);
    const A = aRGB(a[1]), B = aRGB(b[1]);
    out.push(`rgb(${Math.round(A[0]+(B[0]-A[0])*f)},${
                   Math.round(A[1]+(B[1]-A[1])*f)},${
                   Math.round(A[2]+(B[2]-A[2])*f)})`);
  }
  return out;
})();

/* ── Estado ──
   Un girasol no se dibuja de fuera hacia dentro: las semillas nuevas
   brotan en el centro y empujan a las viejas hacia el borde. El reloj
   cuenta semillas nacidas, y el radio de cada una depende de su edad.
   Así la flor nunca se queda quieta. */
let angSuave = AUREO;
let reloj = 0, hueco = 0;

/* Distancia al vecino más cercano: mide si quedan huecos.
   Se calcula sobre una muestra para no comerse el fotograma. */
function medirHueco(ang, N) {
  const paso = Math.max(1, Math.floor(N / 90));
  const a = ang * Math.PI / 180;
  let peor = 1e9;
  for (let i = 1; i <= N; i += paso) {
    const ti = i * a, ri = Math.sqrt(i);
    const xi = Math.cos(ti) * ri, yi = Math.sin(ti) * ri;
    let d = 1e9;
    for (let j = Math.max(1, i - 40); j <= Math.min(N, i + 40); j++) {
      if (j === i) continue;
      const tj = j * a, rj = Math.sqrt(j);
      const dx = xi - Math.cos(tj) * rj, dy = yi - Math.sin(tj) * rj;
      const q = dx * dx + dy * dy;
      if (q < d) d = q;
    }
    if (d < peor) peor = d;
  }
  return Math.sqrt(peor);
}

/* Convergentes de la fracción continua: son los únicos denominadores
   que producen brazos visibles. La última que cabe en el disco es la
   que se ve. Con el ángulo áureo salen números de Fibonacci. */
function brazosDe(ang, N) {
  const lim = Math.max(6, Math.round(Math.sqrt(N) * 1.6));
  let x = ((ang / 360) % 1 + 1) % 1;
  let p0 = 0, q0 = 1, p1 = 1, q1 = 0, ultimo = 3;
  for (let i = 0; i < 25; i++) {
    const a = Math.floor(x);
    const p2 = a * p1 + p0, q2 = a * q1 + q0;
    if (q2 > lim) break;
    if (q2 > 1) ultimo = q2;
    p0 = p1; q0 = q1; p1 = p2; q1 = q2;
    const f = x - a;
    if (f < 1e-12) break;
    x = 1 / f;
  }
  return ultimo;
}

/* Fracción sencilla más cercana al ángulo, para enseñar de qué
   se está quedando cerca cuando salen radios. */
function fraccionDe(ang) {
  const v = ang / 360;
  let mejor = null, err = 1e9;
  for (let q = 2; q <= 24; q++) {
    const p = Math.round(v * q);
    if (p < 1) continue;
    const e = Math.abs(v - p / q);
    if (e < err - 1e-12) { err = e; mejor = p + '/' + q; }
  }
  return { txt: mejor, err };
}

LabShell.registrar({

  meta: {
    id:'aureo',
    titulo:'Se lo inventó en 1855',
    subtitulo:'Y ciento setenta años después seguimos repitiéndolo',
    categoria:'Geometría',
    lecturaPrincipal:'ang',
    etiquetaPrincipal:'Ángulo entre semillas',
    gancho:'El número áureo no está donde te dijeron que estaba',
    etiquetas:['matematicas','numeroaureo','fibonacci','naturaleza','stem']
  },

  portal: {
    texto:'Te han contado que el número áureo está en el Partenón, en las conchas y en la ' +
          'cara humana. No está en ninguno de los tres: eso se lo inventó un profesor alemán ' +
          'en 1855 y llevamos siglo y medio repitiéndolo. Donde sí está es en un girasol, y ' +
          'por una razón que es mejor que el mito.',
    pruebas: [
      { t:'El ángulo áureo: 137,5077°',
        d:'Ni un hueco, ni un radio. Reparto perfecto.',
        al:a => { a.set('ang', Math.round(AUREO * 1000)); a.set('semillas', 1400); } },
      { t:'Muévelo dos décimas',
        d:'Con 137,3° ya empiezan a abrirse los brazos.',
        al:a => { a.set('ang', 137300); a.set('semillas', 1400); } },
      { t:'Un ángulo con fracción sencilla',
        d:'144° es dos quintos de vuelta: cinco radios y todo lo demás vacío.',
        al:a => { a.set('ang', 144000); a.set('semillas', 1400); } }
    ]
  },

  params: [
    { id:'ang', tipo:'rango', label:'Ángulo entre semillas',
      min:60000, max:180000, paso:25, valor:Math.round(AUREO * 1000),
      fmt:v => num(v / 1000, 3) + '°' },
    { id:'semillas', tipo:'rango', label:'Semillas', min:80, max:2600, paso:20, valor:1200 },
    { id:'tam', tipo:'rango', label:'Tamaño', min:20, max:90, paso:2, valor:46,
      fmt:v => num(v / 100, 2) },
    { id:'brotar', tipo:'rango', label:'Velocidad de brote', min:0, max:60, paso:2, valor:10 },

    { id:'aureo',  tipo:'interruptor', label:'Fijar en el áureo', valor:false, grupo:'vista' },
    { id:'espiral',tipo:'interruptor', label:'Marcar las espirales', valor:false, grupo:'vista' },
    { id:'porArm', tipo:'interruptor', label:'Color por brazo', valor:true, grupo:'vista' },
    { id:'aro',    tipo:'interruptor', label:'Borde', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'ang',   label:'Ángulo', acento:true },
    { id:'vuelta',label:'De una vuelta', video:true },
    { id:'hueco', label:'Reparto',  video:true },
    { id:'n',     label:'Semillas' }
  ],

  ayuda: [
    ['Ángulo entre semillas', 'Cuánto gira cada semilla respecto a la anterior. El áureo son 137,5077°.'],
    ['De una vuelta', 'La fracción sencilla más cercana. Cuando el ángulo se parece a una fracción, las semillas se alinean en radios.'],
    ['Reparto', 'Distancia al vecino más cercano. Cuanto mayor, mejor aprovechado está el espacio.'],
    ['Fijar en el áureo', 'Devuelve el deslizador a 137,5077° exactos.'],
    ['Marcar las espirales', 'Dibuja encima los brazos que aparecen solos.'],
    ['Color por brazo', 'Cada brazo lleva su tono. Es lo que hace visible el reparto: con el ángulo áureo los colores se entrelazan y no queda hueco; con una fracción sencilla se separan en radios.']
  ],

  guion: [
    { clave:'Zeising · 1855', titulo:'Se lo inventó en 1855',
      texto:'Adolf Zeising publicó que el Partenón, las conchas y el cuerpo humano seguían ' +
            'el número áureo. Sin aportar una sola medida.',
      dato:() => 'Adolf Zeising · 1855',
      al:a => { a.set('ang', Math.round(AUREO*1000)); a.set('semillas',900); a.set('brotar',10); } },

    { clave:'Y lo repetimos',
      texto:'Ciento setenta años después sigue en libros, vídeos y clases. El Partenón no lo ' +
            'usa. La concha del nautilus tampoco: crece con otra proporción.',
      dato:() => 'ni Partenón ni nautilus',
      al:a => a.set('semillas',1400) },

    { clave:'Pero',
      texto:'Hay un sitio donde sí está, y de verdad. Un girasol coloca cada semilla girada ' +
            'un ángulo fijo respecto a la anterior. Este.',
      dato:() => num(angSuave,3) + '°',
      al:a => { a.set('ang', Math.round(AUREO*1000)); a.set('semillas',1800); } },

    { clave:'Ciento treinta y siete y medio',
      texto:'Con ese ángulo no queda ni un hueco y no se forma ningún radio. Cada semilla cae ' +
            'justo donde nadie ha caído todavía.',
      dato:() => `reparto ${num(hueco,2)}`,
      al:a => a.set('semillas',2200) },

    { clave:'Muévelo un poco',
      texto:'Y basta con desviarse dos décimas de grado para que empiecen a abrirse brazos y ' +
            'aparezcan huecos entre ellos.',
      dato:() => num(angSuave,3) + '°',
      al:a => a.set('ang', 137300) },

    { clave:'Con una fracción',
      texto:'Si el ángulo se parece a una fracción sencilla, es peor. Ciento cuarenta y cuatro ' +
            'grados son dos quintos de vuelta: cinco radios y todo lo demás vacío.',
      dato:() => 'dos quintos de vuelta',
      al:a => { a.set('ang', 144000); a.set('semillas', 1600); } },

    { clave:'Y ahí está la razón',
      texto:'El número áureo es el más difícil de aproximar con fracciones que existe. Por eso ' +
            'las semillas nunca llegan a alinearse.',
      dato:() => 'el peor aproximable',
      al:a => { a.set('ang', Math.round(AUREO*1000)); a.set('semillas',2400); } },

    { clave:'Lo verdadero es mejor',
      texto:'No hace falta inventarse un Partenón. La razón de verdad, la del girasol, es más ' +
            'rara y más bonita que el cuento.',
      dato:() => `reparto ${num(hueco,2)} · sin huecos`,
      al:a => a.set('espiral', true) },

    { clave:'Ahora te toca',
      texto:'Mueve el ángulo y mira aparecer los brazos. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('espiral',false); a.set('semillas',1600); a.set('ang',140000); } }
  ],

  iniciar(a) { angSuave = a.p.ang / 1000; reloj = 0; },
  reiniciar(a) { angSuave = a.p.ang / 1000; reloj = 0; },

  cambio(id, v, a) {
    if (id === 'aureo' && v) a.set('ang', Math.round(AUREO * 1000));
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    /* El ángulo se acerca a su destino en vez de saltar: el paso de
       un reparto a otro es lo que hay que ver. */
    const destino = a.p.aureo ? AUREO : a.p.ang / 1000;
    angSuave += (destino - angSuave) * (1 - Math.exp(-a.dtr * 4));
    if (Math.abs(destino - angSuave) < .0004) angSuave = destino;

    const N = a.p.semillas;
    if (a.dt > 0) reloj += a.dt * (a.p.brotar + 2) * 3.2;

    /* Medir cada pocos fotogramas: es lo caro de la escena */
    if (a.dt > 0 && (a.t * 4 | 0) !== ((a.t - a.dt) * 4 | 0))
      hueco = medirHueco(angSuave, Math.min(900, N));

    const fr = fraccionDe(angSuave);
    a.leer('ang',    num(angSuave, 3) + '°');
    a.leer('vuelta', fr.txt + (fr.err < .0015 ? '  ← casi exacta' : ''));
    a.leer('hueco',  num(hueco, 2) + (hueco > 1.4 ? '  sin huecos' : '  con huecos'));
    a.leer('n',      String(N) + ' · ' + brazosDe(angSuave, N) + ' brazos');

    /* ── Encaje: el radio crece con √n, así que el disco cabe siempre ── */
    const R = Math.min(e.w, e.h) * .44;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const esc = R / Math.sqrt(N);
    const rad = angSuave * Math.PI / 180;
    const tam = a.p.tam / 100;

    if (a.p.aro) {
      g.strokeStyle = 'rgba(42,88,120,.45)';
      g.lineWidth = Math.max(1, 1.2 * u);
      g.beginPath(); g.arc(cx, cy, R + 6 * u, 0, 6.283185307); g.stroke();
    }

    /* ── Las semillas ──
       La más nueva está en el centro y tiene edad cero. Las de atrás
       han ido saliendo hacia el borde. El color dice a qué brazo
       pertenece cada una, no cuándo nació: por orden salían anillos
       concéntricos que tapaban justo lo que hay que ver. */
    const br = a.p.porArm ? brazosDe(angSuave, N) : Math.max(1, Math.ceil(N / NB));
    const ultima = Math.floor(reloj);

    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < NB; b++) {
      let hay = false;
      g.beginPath();
      for (let j = 0; j < N; j++) {
        const k = ultima - j;
        if (k < 1) break;
        if ((((k % br) * NB / br) | 0) !== b) continue;
        const edad = reloj - k;
        const t = k * rad, r = Math.sqrt(edad) * esc;
        const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
        /* brota pequeña en el centro y se estira al alejarse */
        const cerca = Math.min(1, edad / 12);
        const s = Math.max(.8, tam * esc * (1.5 + Math.sqrt(edad / N) * 1.1) * (.25 + .75 * cerca));
        g.moveTo(x + s, y);
        g.arc(x, y, s, 0, 6.283185307);
        hay = true;
      }
      if (!hay) continue;
      g.fillStyle = COLOR[b];
      g.globalAlpha = .88;
      g.fill();
    }
    g.restore();

    /* ── Los brazos que aparecen solos ── */
    if (a.p.espiral && reloj > 60) {
      const mejor = br;
      g.strokeStyle = 'rgba(255,246,226,.5)';
      g.lineWidth = Math.max(1, 1.6 * u);
      const ult = Math.floor(reloj);
      for (let c = 0; c < mejor; c++) {
        g.beginPath();
        let primero = true;
        for (let j = c; j < N; j += mejor) {
          const k = ult - j;
          if (k < 1) break;
          const t = k * rad, r = Math.sqrt(reloj - k) * esc;
          const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
          primero ? (g.moveTo(x, y), primero = false) : g.lineTo(x, y);
        }
        g.stroke();
      }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = `${17 * uh}px 'JetBrains Mono',monospace`;
      g.fillStyle = 'rgba(255,246,226,.85)';
      g.fillText(`${mejor} brazos`, cx, cy + R + 30 * uh);
    }

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = Math.abs(angSuave - AUREO) < .02
      ? 'rgba(233,169,60,.95)' : 'rgba(119,148,173,.95)';
    g.fillText(`${num(angSuave, 3)}°`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`${N} semillas`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
