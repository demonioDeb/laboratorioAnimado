/* ══════════════════════════════════════════════════════════
   España decía 1214 kilómetros. Portugal decía 987

   La costa se genera por desplazamiento del punto medio, así que
   tiene detalle a todas las escalas. Luego se recorre con una regla
   de longitud fija: la medida NO se calcula con una fórmula, se
   cuenta paso a paso, y por eso crece de verdad al acortar la regla.

   Verificado: al dividir la regla entre diez, la longitud sube un
   78 % con dimensión 1,25, que es la de la costa oeste británica.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const RAMPA = [
  [0.00, '#1E4E74'],
  [0.30, '#2F86A8'],
  [0.55, '#5FC6DA'],
  [0.72, '#DDEDDF'],
  [0.88, '#E9A93C'],
  [1.00, '#FFD98A']
];
const NB = 14;
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

/* ── La costa ──
   Desplazamiento del punto medio: se parte cada tramo por la mitad
   y se aparta el centro un poco al azar. Repetido muchas veces, sale
   una línea con detalle a cualquier escala, como una costa real. */
const NIVELES = 13;                       /* 2^13 + 1 = 8193 puntos */
let costa = null, largoTotal = 0, semilla = 1;

function azar() {                          /* generador propio: mismo mapa siempre */
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
}

function generarCosta(rugosidad, sem) {
  semilla = sem;
  let p = [[0, 0], [1, 0]];
  let amp = rugosidad;
  for (let nivel = 0; nivel < NIVELES; nivel++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1e-9;
      const d = (azar() * 2 - 1) * amp;
      q.push([mx - dy / len * d, my + dx / len * d]);
      q.push(b);
    }
    p = q;
    amp *= 0.5;                            /* cada nivel, la mitad de altura */
  }
  costa = p;
  largoTotal = 0;
  for (let i = 1; i < p.length; i++)
    largoTotal += Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]);
}

/* ── Medir con una regla ──
   Se planta el compás en el primer punto y se busca el primer punto
   de la costa que quede a esa distancia. Así se cuenta de verdad. */
function medir(regla) {
  if (!costa) return { pasos: [], largo: 0 };
  const pasos = [costa[0]];
  let i = 0;
  let guardia = 0;
  while (i < costa.length - 1 && guardia++ < 4000) {
    const a = pasos[pasos.length - 1];
    let j = i + 1;
    while (j < costa.length &&
           Math.hypot(costa[j][0] - a[0], costa[j][1] - a[1]) < regla) j++;
    if (j >= costa.length) break;
    pasos.push(costa[j]);
    i = j;
  }
  return { pasos, largo: (pasos.length - 1) * regla };
}

/* ── Estado ── */
let reglaSuave = .12, medida = { pasos: [], largo: 0 };
const historia = [];                       /* [regla, largo] para la gráfica */
let avance = 0;

LabShell.registrar({

  meta: {
    id:'costa',
    titulo:'España decía 1214 kilómetros. Portugal decía 987',
    subtitulo:'La misma frontera, medida por los dos vecinos',
    categoria:'Geometría',
    lecturaPrincipal:'largo',
    etiquetaPrincipal:'Longitud medida',
    gancho:'Dos países no se ponían de acuerdo en su frontera común',
    etiquetas:['matematicas','fractales','geografia','mandelbrot','stem']
  },

  portal: {
    texto:'España decía que su frontera con Portugal medía mil doscientos catorce kilómetros. ' +
          'Portugal decía novecientos ochenta y siete. Ninguno de los dos se equivocaba: ' +
          'habían usado reglas de distinto tamaño. Y cuanto más corta es la regla, más larga ' +
          'sale la costa, sin llegar nunca a un número final.',
    pruebas: [
      { t:'Una regla grande',
        d:'Pocos pasos, y la costa parece corta.',
        al:a => { a.set('regla', 260); a.set('rugoso', 55); } },
      { t:'Divide la regla entre diez',
        d:'La misma costa mide bastante más.',
        al:a => { a.set('regla', 26); a.set('rugoso', 55); } },
      { t:'Una costa más recortada',
        d:'Con más entrantes, el efecto se dispara.',
        al:a => { a.set('regla', 40); a.set('rugoso', 72); } }
    ]
  },

  params: [
    { id:'regla', tipo:'rango', label:'Tamaño de la regla', min:8, max:400, paso:2, valor:150,
      fmt:v => num(v / 10, 1) + ' unidades' },
    { id:'rugoso', tipo:'rango', label:'Lo recortada que es', min:5, max:85, paso:1, valor:55,
      fmt:v => num(v / 100, 2) },
    { id:'mapa', tipo:'rango', label:'Otra costa', min:1, max:60, paso:1, valor:7,
      fmt:v => 'mapa ' + v },

    { id:'pasos',  tipo:'interruptor', label:'Los pasos de la regla', valor:true, grupo:'vista' },
    { id:'grafica',tipo:'interruptor', label:'La gráfica', valor:true, grupo:'vista' },
    { id:'relleno',tipo:'interruptor', label:'Rellenar el mar', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'largo',  label:'Longitud medida', acento:true },
    { id:'regla',  label:'Con una regla de', video:true },
    { id:'pasos',  label:'Pasos', video:true },
    { id:'dim',    label:'Dimensión' }
  ],

  ayuda: [
    ['Tamaño de la regla', 'Con qué mides. Es lo único que cambia, y la longitud cambia con él.'],
    ['Longitud medida', 'Pasos multiplicados por el tamaño de la regla. No se calcula con una fórmula: se cuenta.'],
    ['Dimensión', 'Cuánto crece la longitud al acortar la regla. Una línea recta da 1; la costa oeste de Gran Bretaña, 1,25.'],
    ['Lo recortada que es', 'Cuántos entrantes y salientes tiene. Más recortada, más se dispara la medida.'],
    ['La gráfica', 'Cada medición deja un punto. Si salen alineados, hay una ley detrás.']
  ],

  guion: [
    { clave:'Richardson', titulo:'España decía 1214 kilómetros',
      texto:'Portugal decía novecientos ochenta y siete. La misma frontera, un veintitrés por ' +
            'ciento de diferencia. Y ninguno de los dos se había equivocado.',
      dato:() => 'la frontera que no cuadra',
      al:a => { a.set('regla', 300); a.set('rugoso', 55); a.set('mapa', 7);
                a.set('pasos', true); a.set('grafica', false); } },

    { clave:'El detalle',
      texto:'Lo que pasa es que habían medido con reglas de distinto tamaño. Y en una costa, ' +
            'eso no da un error pequeño: lo cambia todo.',
      dato:() => `regla ${num(reglaSuave * 100, 1)} · ${medida.pasos.length - 1} pasos`,
      al:a => a.set('regla', 260) },

    { clave:'Mira',
      texto:'Con una regla grande, el compás se salta las bahías y los cabos. Sale una costa ' +
            'corta porque te has perdido casi todo.',
      dato:() => `${num(medida.largo * 100, 0)} unidades`,
      al:a => { a.set('regla', 200); a.set('grafica', true); } },

    { clave:'Acórtala',
      texto:'Cada vez que la acortas, la regla entra en huecos que antes no veía. Y cada hueco ' +
            'suma. La longitud no se afina: sube.',
      dato:() => `${num(medida.largo * 100, 0)} unidades`,
      al:a => a.set('regla', 60) },

    { clave:'Y otra vez',
      texto:'Divide la regla entre diez y la costa mide casi el doble. Vuelve a dividirla y ' +
            'vuelve a crecer. Nunca se para en un número.',
      dato:() => `${num(medida.largo * 100, 0)} unidades`,
      al:a => a.set('regla', 12) },

    { clave:'Mandelbrot · 1967',
      texto:'Benoît Mandelbrot lo publicó con un título que era una pregunta: cuánto mide la ' +
            'costa de Gran Bretaña. Su respuesta fue que la pregunta está mal hecha.',
      dato:() => 'la pregunta está mal hecha',
      al:a => { a.set('regla', 30); a.set('grafica', true); } },

    { clave:'Pero hay una ley',
      texto:'Los puntos de la gráfica caen en línea recta. La pendiente es un número fijo de ' +
            'cada costa, y Mandelbrot lo llamó su dimensión.',
      dato:() => `dimensión ${num(1 + Math.max(0, dimEstimada() - 1), 2)}`,
      al:a => { a.set('rugoso', 72); a.set('regla', 40); } },

    { clave:'Uno y cuarto',
      texto:'La costa oeste de Gran Bretaña tiene dimensión uno y cuarto. No es una línea ni ' +
            'es una superficie: está en medio.',
      dato:() => 'ni línea ni superficie',
      al:a => { a.set('rugoso', 72); a.set('regla', 24); } },

    { clave:'Ahora te toca',
      texto:'Mueve la regla y mira subir el número. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('regla', 120); a.set('rugoso', 55); a.set('grafica', true); } }
  ],

  iniciar(a) {
    generarCosta(a.p.rugoso / 100, a.p.mapa * 7919 + 13);
    reglaSuave = a.p.regla / 1000;
    historia.length = 0;
    avance = 0;
  },
  reiniciar(a) {
    generarCosta(a.p.rugoso / 100, a.p.mapa * 7919 + 13);
    historia.length = 0;
    avance = 0;
  },

  cambio(id, v, a) {
    if (id === 'rugoso' || id === 'mapa') {
      generarCosta(a.p.rugoso / 100, a.p.mapa * 7919 + 13);
      historia.length = 0;
    }
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;
    if (!costa) generarCosta(a.p.rugoso / 100, a.p.mapa * 7919 + 13);

    /* La regla se acerca a su destino: el crecimiento hay que verlo */
    const destino = a.p.regla / 1000;
    reglaSuave += (destino - reglaSuave) * (1 - Math.exp(-a.dtr * 3.2));
    if (Math.abs(destino - reglaSuave) < 2e-5) reglaSuave = destino;

    medida = medir(reglaSuave);

    /* Cada medida deja su punto en la gráfica */
    if (a.dt > 0) {
      const ya = historia.some(h => Math.abs(h[0] / reglaSuave - 1) < .02);
      if (!ya && medida.pasos.length > 2) {
        historia.push([reglaSuave, medida.largo]);
        if (historia.length > 60) historia.shift();
      }
      avance = Math.min(1, avance + a.dt * .8);
    }

    a.leer('largo', num(medida.largo * 100, 0) + ' unidades');
    a.leer('regla', num(reglaSuave * 100, 1));
    a.leer('pasos', String(Math.max(0, medida.pasos.length - 1)));
    a.leer('dim',   num(dimEstimada(), 2));

    /* ── Encaje: la costa se escala a lo que haya ── */
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of costa) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    const anchoG = a.p.grafica ? e.h * .30 : 0;
    const zona = { x: e.x, y: e.y, w: e.w, h: e.h - anchoG };
    const esc = Math.min(zona.w * .92 / Math.max(1e-6, x1 - x0),
                         zona.h * .82 / Math.max(1e-6, y1 - y0));
    const ox = zona.x + zona.w / 2 - (x0 + x1) / 2 * esc;
    const oy = zona.y + zona.h / 2 - (y0 + y1) / 2 * esc;
    const PX = v => ox + v * esc, PY = v => oy + v * esc;

    /* ── El mar ── */
    if (a.p.relleno) {
      g.beginPath();
      costa.forEach((p, i) => i ? g.lineTo(PX(p[0]), PY(p[1])) : g.moveTo(PX(p[0]), PY(p[1])));
      g.lineTo(PX(costa[costa.length-1][0]), zona.y + zona.h);
      g.lineTo(PX(costa[0][0]), zona.y + zona.h);
      g.closePath();
      g.fillStyle = 'rgba(30,78,116,.30)';
      g.fill();
    }

    /* ── La costa, con todo su detalle ── */
    g.strokeStyle = 'rgba(169,194,214,.85)';
    g.lineWidth = Math.max(.8, 1.3 * u);
    g.lineJoin = 'round';
    g.beginPath();
    costa.forEach((p, i) => i ? g.lineTo(PX(p[0]), PY(p[1])) : g.moveTo(PX(p[0]), PY(p[1])));
    g.stroke();

    /* ── Los pasos de la regla ── */
    if (a.p.pasos && medida.pasos.length > 1) {
      const P = medida.pasos;
      const hasta = Math.max(2, Math.floor(P.length * avance));
      g.lineCap = 'round';
      for (let i = 1; i < hasta; i++) {
        const t = (i - 1) / Math.max(1, P.length - 2);
        g.strokeStyle = COLOR[Math.min(NB - 1, (t * (NB - 1)) | 0)];
        g.lineWidth = Math.max(1.4, 2.6 * u);
        g.beginPath();
        g.moveTo(PX(P[i-1][0]), PY(P[i-1][1]));
        g.lineTo(PX(P[i][0]),   PY(P[i][1]));
        g.stroke();
      }
      g.fillStyle = 'rgba(255,246,226,.9)';
      for (let i = 0; i < hasta; i++) {
        g.beginPath();
        g.arc(PX(P[i][0]), PY(P[i][1]), Math.max(1.4, 2.4 * u), 0, 6.28318);
        g.fill();
      }
    }

    /* ── La gráfica: regla contra longitud ── */
    if (a.p.grafica && historia.length > 1) {
      const gx = e.x + 14 * u, gy = e.y + e.h - anchoG + 10 * u;
      const gw = e.w - 28 * u, gh = anchoG - 26 * u;
      g.strokeStyle = 'rgba(42,88,120,.6)';
      g.lineWidth = Math.max(1, 1.1 * u);
      g.strokeRect(gx, gy, gw, gh);

      let lrmin = 1e9, lrmax = -1e9, llmin = 1e9, llmax = -1e9;
      for (const [r, l] of historia) {
        const A = Math.log(r), B = Math.log(Math.max(1e-9, l));
        if (A < lrmin) lrmin = A; if (A > lrmax) lrmax = A;
        if (B < llmin) llmin = B; if (B > llmax) llmax = B;
      }
      const dr = Math.max(.35, lrmax - lrmin), dl = Math.max(.2, llmax - llmin);
      const px = r => gx + gw - (Math.log(r) - lrmin) / dr * gw * .92 - gw * .04;
      const py = l => gy + gh - (Math.log(l) - llmin) / dl * gh * .84 - gh * .08;

      g.fillStyle = '#E9A93C';
      for (const [r, l] of historia) {
        g.beginPath(); g.arc(px(r), py(l), Math.max(1.6, 2.6 * u), 0, 6.28318); g.fill();
      }
      g.fillStyle = 'rgba(119,148,173,.9)';
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.font = `${14 * uh}px 'JetBrains Mono',monospace`;
      g.fillText('regla más corta →', gx + 6 * u, gy + gh - 5 * u);
      g.save();
      g.translate(gx + 12 * u, gy + gh * .6);
      g.rotate(-Math.PI / 2);
      g.fillText('más longitud →', 0, 0);
      g.restore();
    }

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(`${num(medida.largo * 100, 0)} unidades`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`regla ${num(reglaSuave * 100, 1)} · ${Math.max(0, medida.pasos.length - 1)} pasos`,
               e.x + 4 * uh, e.y + 44 * uh);
  }
});

/* Pendiente de la recta en la gráfica: la dimensión.
   L = C·r^(1−D)  →  log L = log C + (1−D)·log r  →  D = 1 − pendiente */
function dimEstimada() {
  if (historia.length < 3) return 1;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  const n = historia.length;
  for (const [r, l] of historia) {
    const x = Math.log(r), y = Math.log(Math.max(1e-9, l));
    sx += x; sy += y; sxy += x * y; sxx += x * x;
  }
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-12) return 1;
  const m = (n * sxy - sx * sy) / den;
  return Math.max(1, Math.min(2, 1 - m));
}
})();
