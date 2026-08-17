/* ══════════════════════════════════════════════════════════
   Vórtices · miles de partículas arrastradas por remolinos

   Demostración de la dirección visual: densidad, color como
   material, y física real debajo. Cada partícula obedece una
   sola fórmula; el dibujo no lo decide nadie.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

/* ── Paleta: cianotipo, pero usada con ambición ── */
const RAMPA = [
  [0.00, '#12314B'],
  [0.26, '#2B6B92'],
  [0.50, '#5FC6DA'],
  [0.72, '#E9A93C'],
  [1.00, '#FFF6E2']
];
const NB = 14;                         /* franjas de color = pasadas de trazo */

const aRGB = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];

const COLORES = (() => {
  const out = [];
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    let a = RAMPA[0], b = RAMPA[RAMPA.length - 1];
    for (let k = 0; k < RAMPA.length - 1; k++)
      if (t >= RAMPA[k][0] && t <= RAMPA[k + 1][0]) { a = RAMPA[k]; b = RAMPA[k + 1]; break; }
    const f = (t - a[0]) / ((b[0] - a[0]) || 1);
    const A = aRGB(a[1]), B = aRGB(b[1]);
    out.push(`rgb(${Math.round(A[0] + (B[0]-A[0])*f)},${
                   Math.round(A[1] + (B[1]-A[1])*f)},${
                   Math.round(A[2] + (B[2]-A[2])*f)})`);
  }
  return out;
})();

/* ── Estado de la escena ── */
const MAXP = 7000;
const px = new Float32Array(MAXP), py = new Float32Array(MAXP);
const qx = new Float32Array(MAXP), qy = new Float32Array(MAXP);
const vida = new Float32Array(MAXP);
const franja = new Uint8Array(MAXP);
let nAct = 0;

let vor = [];                          /* {x, y, g} en unidades de mundo */
let vRef = 1;                          /* referencia de velocidad para el color */
let vMed = 0, vMax = 0;

let lienzoEstela = null, ce = null, anchoE = 0, altoE = 0;

const SUAVE = 0.014;                   /* núcleo blando: sin infinitos */
const RADIO = 1.30;                    /* fuera de aquí, la partícula renace */

function sembrar(i) {
  const a = Math.random() * 6.28318, r = Math.sqrt(Math.random()) * RADIO;
  px[i] = qx[i] = Math.cos(a) * r;
  py[i] = qy[i] = Math.sin(a) * r;
  vida[i] = 1.5 + Math.random() * 5;
}

function crearVortices(n) {
  vor = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.28318 + .4;
    const r = n === 1 ? 0 : .46;
    vor.push({ x: Math.cos(a) * r, y: Math.sin(a) * r,
               g: (i % 2 ? -1 : 1) * (n === 1 ? 1 : 1) });
  }
}

/* Velocidad del fluido en un punto: suma de todos los remolinos */
function campo(x, y, fuerza, flujo, salida) {
  let u = flujo, v = 0;
  for (let j = 0; j < vor.length; j++) {
    const V = vor[j];
    const dx = x - V.x, dy = y - V.y;
    const r2 = dx*dx + dy*dy + SUAVE;
    const k = V.g * fuerza / r2;
    u -= k * dy;
    v += k * dx;
  }
  salida[0] = u; salida[1] = v;
}

const tmp = [0, 0];

/* Los remolinos también se arrastran entre ellos: por eso el dibujo cambia */
function moverVortices(dt, fuerza, flujo) {
  const n = vor.length;
  if (n < 2) return;
  /* si el campo es más fuerte, sujetarlos tiene que costar más */
  const k0 = Math.max(1, fuerza / .2 + Math.abs(flujo) * 1.6);
  const ux = new Float32Array(n), uy = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let u = flujo * .35, v = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = vor[i].x - vor[j].x, dy = vor[i].y - vor[j].y;
      const r2 = dx*dx + dy*dy + .05;
      const k = vor[j].g * fuerza / r2;
      u -= k * dy;
      v += k * dx;

      /* si se acercan demasiado se funden y dejan un hueco muerto.
         Ojo: hay que medir la distancia real, no la suavizada. */
      const dd = Math.sqrt(dx*dx + dy*dy) + 1e-6;
      if (dd < .34) {
        const e = (.34 - dd) * 5.5 * k0 / dd;
        u += dx * e; v += dy * e;
      }
    }
    /* un tirón al centro para que no se escapen del encuadre */
    const d = Math.hypot(vor[i].x, vor[i].y);
    if (d > .55) { const e = (d - .55) * 3.4 * k0; u -= vor[i].x * e; v -= vor[i].y * e; }
    ux[i] = u; uy[i] = v;
  }
  for (let i = 0; i < n; i++) {
    vor[i].x += ux[i]*dt; vor[i].y += uy[i]*dt;
    /* tope duro: pase lo que pase, dentro del encuadre */
    const d = Math.hypot(vor[i].x, vor[i].y);
    if (d > .80) { const s = .80 / d; vor[i].x *= s; vor[i].y *= s; }
  }
}

function prepararEstela(w, h) {
  if (lienzoEstela && anchoE === w && altoE === h) return;
  anchoE = w; altoE = h;
  lienzoEstela = document.createElement('canvas');
  lienzoEstela.width = w; lienzoEstela.height = h;
  ce = lienzoEstela.getContext('2d');
}

LabShell.registrar({

  meta: {
    id:'vortices',
    titulo:'Vórtices',
    subtitulo:'Miles de partículas y una sola fórmula',
    categoria:'Fluidos',
    lecturaPrincipal:'vmax',
    etiquetaPrincipal:'Velocidad punta',
    gancho:'Nadie dibuja esto: cada partícula solo sigue una fórmula',
    etiquetas:['fluidos','fisica','vortices','matematicas','stem']
  },

  portal: {
    texto:'Cada partícula obedece una sola fórmula: gira alrededor de cada remolino con ' +
          'más fuerza cuanto más cerca esté. Nada más. Los remolinos, además, se arrastran ' +
          'unos a otros, así que el dibujo nunca se repite dos veces.',
    pruebas: [
      { t:'Un solo remolino',
        d:'La forma más simple: todo gira alrededor de un punto.',
        al:a => { a.set('nv',1); a.set('flujo',0); a.set('estela',11); } },
      { t:'Seis remolinos y estela larga',
        d:'Aquí es donde el dibujo se vuelve imposible de predecir.',
        al:a => { a.set('nv',6); a.set('estela',20); a.set('part',6000); a.set('flujo',0); } },
      { t:'Añade corriente lateral',
        d:'El orden se deshace en filamentos que se estiran.',
        al:a => { a.set('nv',5); a.set('flujo',44); a.set('fuerza',20); } }
    ]
  },

  params: [
    { id:'nv', tipo:'rango', label:'Remolinos', min:1, max:7, paso:1, valor:4 },
    { id:'fuerza', tipo:'rango', label:'Intensidad', min:2, max:40, paso:1, valor:14,
      fmt:v => num(v/10, 1) },
    { id:'flujo', tipo:'rango', label:'Corriente lateral', min:-60, max:60, paso:2, valor:0,
      fmt:v => num(v/100, 2) },
    { id:'estela', tipo:'rango', label:'Estela', min:1, max:20, paso:1, valor:11 },
    { id:'part', tipo:'rango', label:'Partículas', min:600, max:7000, paso:200, valor:4200 },

    { id:'nucleos', tipo:'interruptor', label:'Núcleos', valor:true,  grupo:'vista' },
    { id:'color',   tipo:'interruptor', label:'Color',   valor:true,  grupo:'vista' },
    { id:'grosor',  tipo:'interruptor', label:'Trazo fino', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'vmax', label:'Velocidad punta', acento:true },
    { id:'vmed', label:'Media',    video:true },
    { id:'nvl',  label:'Remolinos', video:true },
    { id:'npl',  label:'Partículas' }
  ],

  ayuda: [
    ['Remolinos',  'Cuántos vórtices hay. Alternan sentido de giro, y a partir de tres el conjunto ya no es predecible.'],
    ['Intensidad', 'La circulación de cada remolino. Más intensidad, más velocidad y más mezcla.'],
    ['Corriente',  'Un flujo lateral que arrastra todo. Rompe la simetría y estira el dibujo en filamentos.'],
    ['Estela',     'Cuánto tarda en borrarse el rastro. Es lo que convierte puntos en dibujo.'],
    ['Color',      'Cada partícula se pinta según su velocidad, del azul profundo al blanco.']
  ],

  guion: [
    /* Solo esta parada lleva título: se lee una vez y se queda fijo */
    { clave:'Leonardo · hacia 1510', titulo:'Remolinos',
      texto:'Tardaron tres siglos en escribir las reglas de un remolino. Leonardo se sentaba ' +
            'junto al agua a dibujarlos durante años, sin poder explicarlos.',
      dato:() => 'sus cuadernos siguen siendo el mejor retrato del caos',
      al:a => { a.set('nv',1); a.set('flujo',0); a.set('fuerza',14); a.set('estela',13); } },

    { clave:'Helmholtz · 1858',
      texto:'Tres siglos después alguien escribió sus reglas. Son solo tres, y una es asombrosa: ' +
            'un remolino no puede empezar ni acabar dentro del fluido.',
      dato:() => `2 remolinos · punta ${num(vMax,2)}`,
      al:a => { a.set('nv',2); a.set('estela',15); } },

    { clave:'Kelvin · 1867',
      texto:'A Kelvin le pareció tan perfecto que dedujo que los átomos eran nudos de remolino. ' +
            'Estaba equivocado, y al intentar clasificarlos fundó la teoría de nudos.',
      dato:() => `4 remolinos · media ${num(vMed,2)}`,
      al:a => { a.set('nv',4); a.set('estela',18); } },

    { clave:'A partir de tres',
      texto:'Con dos puedes predecirlo todo. Añade el tercero y se acabó: no es que falte ' +
            'potencia de cálculo, es que la respuesta no existe de antemano.',
      dato:() => `${vor.length} remolinos · media ${num(vMed,2)}`,
      al:a => { a.set('nv',5); a.set('fuerza',18); a.set('flujo',12); } },

    { clave:'Sigue abierto',
      texto:'Y hay algo peor. Nadie ha demostrado que las ecuaciones del fluido tengan siempre ' +
            'solución. Un millón de dólares espera desde el año dos mil.',
      dato:() => 'Navier-Stokes · problema del milenio',
      al:a => { a.set('nv',6); a.set('flujo',34); a.set('fuerza',22); } },

    { clave:'Y sin embargo',
      texto:'Todo esto sale de una línea: gira alrededor de cada remolino, más fuerte cuanto ' +
            'más cerca. Ninguna partícula sabe qué está dibujando. Solo obedece.',
      dato:() => `${nAct} partículas · una fórmula`,
      al:a => { a.set('nv',5); a.set('estela',20); a.set('part',6000); a.set('flujo',8); } },

    { clave:'Ahora te toca',
      texto:'Cambia los remolinos, la corriente, la estela. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('nv',4); a.set('flujo',14); a.set('estela',16); } }
  ],

  iniciar(a) {
    crearVortices(a.p.nv);
    nAct = a.p.part;
    for (let i = 0; i < MAXP; i++) sembrar(i);
  },

  reiniciar(a) {
    crearVortices(a.p.nv);
    nAct = a.p.part;
    for (let i = 0; i < MAXP; i++) sembrar(i);
    if (ce) ce.clearRect(0, 0, anchoE, altoE);
    vRef = 1;
  },

  cambio(id, v, a) {
    if (id === 'nv') crearVortices(v);
    if (id === 'part') nAct = v;
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    const W = Math.max(1, Math.round(e.w)), H = Math.max(1, Math.round(e.h));
    prepararEstela(W, H);

    const esc = Math.min(W, H) / 2 * .96;
    const cx = W / 2, cy = H / 2;
    const mundoX = x => cx + x * esc;
    const mundoY = y => cy + y * esc;

    const fuerza = a.p.fuerza / 70;
    const flujo  = a.p.flujo / 100;
    const dt = Math.min(a.dt, .033);

    /* ── Física ── */
    if (dt > 0) {
      moverVortices(dt, fuerza, flujo);

      let suma = 0, pico = 0;
      for (let i = 0; i < nAct; i++) {
        campo(px[i], py[i], fuerza, flujo, tmp);
        const vx = tmp[0], vy = tmp[1];
        const vel = Math.hypot(vx, vy);
        if (vel > pico) pico = vel;
        suma += vel;

        qx[i] = px[i]; qy[i] = py[i];
        px[i] += vx * dt; py[i] += vy * dt;

        vida[i] -= dt;
        const d2 = px[i]*px[i] + py[i]*py[i];
        if (vida[i] <= 0 || d2 > RADIO*RADIO) sembrar(i);

        /* franja de color según velocidad */
        const t = Math.min(1, vel / vRef);
        franja[i] = Math.min(NB - 1, (Math.sqrt(t) * (NB - 1)) | 0);
      }
      vMed = suma / Math.max(1, nAct);
      vMax = pico;
      vRef += (pico * .78 - vRef) * (1 - Math.exp(-dt * 1.4));
      if (vRef < .05) vRef = .05;
    }

    a.leer('vmax', num(vMax, 2));
    a.leer('vmed', num(vMed, 2));
    a.leer('nvl',  String(vor.length));
    a.leer('npl',  String(nAct));

    /* ── Estela: se borra poco a poco, no se repinta ── */
    ce.globalCompositeOperation = 'destination-out';
    ce.fillStyle = `rgba(0,0,0,${(0.30 / a.p.estela).toFixed(4)})`;
    ce.fillRect(0, 0, W, H);

    /* ── Trazos, agrupados por color para no cambiar de pincel 4000 veces ── */
    ce.globalCompositeOperation = 'lighter';
    ce.lineWidth = (a.p.grosor ? .9 : 1.8) * Math.max(1, u * .8);
    ce.lineCap = 'round';

    for (let b = 0; b < NB; b++) {
      let hay = false;
      ce.beginPath();
      for (let i = 0; i < nAct; i++) {
        if (franja[i] !== b) continue;
        const x0 = mundoX(qx[i]), y0 = mundoY(qy[i]);
        const x1 = mundoX(px[i]), y1 = mundoY(py[i]);
        const dx = x1 - x0, dy = y1 - y0;
        if (dx*dx + dy*dy > 9000) continue;      /* salto por renacer: no lo unas */
        ce.moveTo(x0, y0); ce.lineTo(x1, y1);
        hay = true;
      }
      if (!hay) continue;
      ce.strokeStyle = a.p.color ? COLORES[b] : COLORES[Math.min(NB-1, 8 + (b >> 2))];
      ce.globalAlpha = .30 + b / NB * .55;
      ce.stroke();
    }
    ce.globalAlpha = 1;
    ce.globalCompositeOperation = 'source-over';

    g.drawImage(lienzoEstela, e.x, e.y);

    /* ── Núcleos ── */
    if (a.p.nucleos) {
      for (const V of vor) {
        const X = e.x + mundoX(V.x), Y = e.y + mundoY(V.y);
        const col = V.g > 0 ? '233,169,60' : '95,198,218';
        const r = 26 * u;
        const gr = g.createRadialGradient(X, Y, 0, X, Y, r);
        gr.addColorStop(0, `rgba(${col},.42)`);
        gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(X, Y, r, 0, 6.28318); g.fill();

        g.strokeStyle = `rgba(${col},.9)`;
        g.lineWidth = 1.4 * u;
        g.beginPath(); g.arc(X, Y, 5.5 * u, 0, 6.28318); g.stroke();
      }
    }

    /* ── Rótulo de la escena ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`${vor.length} ${vor.length === 1 ? 'remolino' : 'remolinos'}`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillText(`${nAct} partículas`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
