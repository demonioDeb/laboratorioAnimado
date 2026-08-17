/* ══════════════════════════════════════════════════════════
   La flecha que nadie giró

   Transporte paralelo sobre una esfera. La flecha se mueve por
   un camino cerrado sin que nadie la gire, y vuelve apuntando
   a otro sitio. El giro no se calcula con una fórmula: se mide
   proyectando el vector sobre el plano tangente en cada paso.

   Es el mismo mecanismo del péndulo de Foucault: en París gira
   271 grados al día, una vuelta completa cada 31,8 horas.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const RAMPA = [
  [0.00, '#1E4E74'],
  [0.28, '#2F86A8'],
  [0.52, '#5FC6DA'],
  [0.70, '#DDEDDF'],
  [0.86, '#E9A93C'],
  [1.00, '#FFD98A']
];
const NB = 16;
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
    out.push([Math.round(A[0]+(B[0]-A[0])*f),
              Math.round(A[1]+(B[1]-A[1])*f),
              Math.round(A[2]+(B[2]-A[2])*f)]);
  }
  return out;
})();

/* ── Estado ── */
let fase = 0, vueltas = 0, acumulado = 0, angPrev = null;
let v = [0, 0, 1];                  /* la flecha, en el espacio */
let azim = 0;
const MEM = 260;
const memQ = new Float64Array(MEM * 3), memV = new Float64Array(MEM * 3);
let memN = 0, memI = 0;

const punto = (colat, f) => [
  Math.sin(colat) * Math.cos(f),
  Math.sin(colat) * Math.sin(f),
  Math.cos(colat)
];

/* Este y norte locales: el «suelo» del observador */
function baseLocal(q) {
  let E = [-q[1], q[0], 0];
  const ne = Math.hypot(E[0], E[1], E[2]) || 1;
  E = [E[0]/ne, E[1]/ne, E[2]/ne];
  const N = [E[1]*q[2] - E[2]*q[1], E[2]*q[0] - E[0]*q[2], E[0]*q[1] - E[1]*q[0]];
  return [E, N];
}

function sembrar(a) {
  const colat = Math.PI/2 - a.p.lat * Math.PI/180;
  fase = 0; vueltas = 0; acumulado = 0; angPrev = null;
  const q = punto(colat, 0);
  const [, N] = baseLocal(q);
  v = [...N];
  memN = 0; memI = 0;
}

/* Transporte paralelo: mover el punto y volver a apoyar el vector
   en el nuevo plano tangente. Nadie lo gira; solo se le quita la
   parte que se sale de la superficie. */
function transportar(colat, dfase) {
  const q = punto(colat, fase + dfase);
  const d = v[0]*q[0] + v[1]*q[1] + v[2]*q[2];
  v = [v[0] - d*q[0], v[1] - d*q[1], v[2] - d*q[2]];
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  v = [v[0]/n, v[1]/n, v[2]/n];
  fase += dfase;

  const [E, N] = baseLocal(q);
  const ang = Math.atan2(v[0]*N[0] + v[1]*N[1] + v[2]*N[2],
                         v[0]*E[0] + v[1]*E[1] + v[2]*E[2]);
  if (angPrev !== null) {
    let dd = ang - angPrev;
    while (dd >  Math.PI) dd -= 6.283185307;
    while (dd < -Math.PI) dd += 6.283185307;
    acumulado += dd * 180 / Math.PI;
  }
  angPrev = ang;

  if (fase >= 6.283185307) { fase -= 6.283185307; vueltas++; }
  return q;
}

LabShell.registrar({

  meta: {
    id:'foucault',
    titulo:'La flecha que nadie giró',
    subtitulo:'Volvió al mismo sitio apuntando a otro lado',
    categoria:'Geometría',
    lecturaPrincipal:'vuelta',
    etiquetaPrincipal:'Giro por vuelta',
    gancho:'Demostró que la Tierra gira sin asomarse por la ventana',
    etiquetas:['fisica','geometria','foucault','relatividad','stem']
  },

  portal: {
    texto:'Coge una flecha y paséala por un camino cerrado, con cuidado de no girarla nunca. ' +
          'Sobre una mesa plana volverá apuntando igual. Sobre una esfera, no: vuelve girada, ' +
          'y nadie la ha tocado. Eso es lo que hace girar el péndulo de Foucault, y es la razón ' +
          'de que se pueda averiguar la forma del planeta sin salir de una habitación.',
    pruebas: [
      { t:'En el polo: una vuelta entera',
        d:'La flecha gira 360 grados en cada paseo.',
        al:a => { a.set('lat',85); a.set('veloc',12); a.set('flechas',180); } },
      { t:'En el ecuador: no pasa nada',
        d:'El camino es un círculo máximo y la flecha vuelve intacta.',
        al:a => { a.set('lat',0); a.set('veloc',12); } },
      { t:'En París: 271 grados',
        d:'Lo que midió Foucault en 1851. Una vuelta cada 32 horas.',
        al:a => { a.set('lat',49); a.set('veloc',10); a.set('flechas',220); } }
    ]
  },

  params: [
    { id:'lat', tipo:'rango', label:'Latitud', min:-85, max:85, paso:1, valor:49,
      fmt:v => v + '°' },
    { id:'veloc', tipo:'rango', label:'Velocidad', min:2, max:30, paso:1, valor:10,
      fmt:v => num(v/10,1) + '×' },
    { id:'flechas', tipo:'rango', label:'Rastro de flechas', min:0, max:260, paso:10, valor:180 },

    { id:'malla',    tipo:'interruptor', label:'Malla',    valor:true, grupo:'vista' },
    { id:'camino',   tipo:'interruptor', label:'Camino',   valor:true, grupo:'vista' },
    { id:'fantasma', tipo:'interruptor', label:'Dirección inicial', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'vuelta', label:'Giro por vuelta', acento:true },
    { id:'acum',   label:'Girado hasta ahora', video:true },
    { id:'horas',  label:'Equivale a', video:true },
    { id:'v',      label:'Vueltas' }
  ],

  ayuda: [
    ['Latitud', 'Por dónde pasa el camino cerrado. En el polo el giro es de una vuelta entera; en el ecuador, de nada.'],
    ['Giro por vuelta', 'Cuánto vuelve girada la flecha. Sale de multiplicar 360 por el seno de la latitud.'],
    ['Equivale a', 'Cuánto tardaría el péndulo de Foucault en dar una vuelta completa a esa latitud.'],
    ['Rastro de flechas', 'Las posiciones anteriores. La cinta que forman se retuerce: eso es la curvatura.'],
    ['Dirección inicial', 'Una flecha fija en el punto de partida, para comparar al volver.']
  ],

  guion: [
    { clave:'París · 1851', titulo:'La flecha que nadie giró',
      texto:'Léon Foucault colgó una bola de veintiocho kilos de un cable de setenta metros, ' +
            'dentro de un edificio cerrado, y la dejó oscilar. Horas después el péndulo ' +
            'oscilaba en otra dirección, y nadie lo había tocado.',
      dato:() => 'París, 1851',
      al:a => { a.set('lat',49); a.set('veloc',10); a.set('flechas',180); a.set('fantasma',true); } },

    { clave:'La prueba',
      texto:'Fue la primera vez que alguien demostró que la Tierra gira sin mirar al cielo. ' +
            'Bastaba una sala cerrada, un cable largo y paciencia.',
      dato:() => 'sin astronomía',
      al:a => a.set('veloc',14) },

    { clave:'Por qué ocurre',
      texto:'Coge una flecha y paséala por un camino cerrado, con cuidado de no girarla nunca. ' +
            'Sobre una mesa plana vuelve igual. Sobre una esfera, no.',
      dato:() => `girado ${num(acumulado, 0)}°`,
      al:a => { a.set('lat',60); a.set('flechas',220); } },

    { clave:'Nadie la tocó',
      texto:'La flecha no ha girado: ha girado el suelo debajo de ella. Lo único que ha pasado ' +
            'es que la superficie es curva, y eso basta.',
      dato:() => `${vueltas} vueltas · ${num(acumulado, 0)}°`,
      al:a => a.set('lat',30) },

    { clave:'Depende de dónde estés',
      texto:'En el polo la flecha da una vuelta entera cada día. En el ecuador no gira nada. ' +
            'En París giraba doscientos setenta y un grados: una vuelta cada treinta y dos horas.',
      dato:() => `latitud 49° · 271° al día`,
      al:a => { a.set('lat',85); a.set('veloc',18); } },

    { clave:'Y en el ecuador',
      texto:'Aquí el camino es un círculo máximo, la ruta más recta que existe sobre una esfera. ' +
            'La flecha vuelve exactamente como salió.',
      dato:() => `giro por vuelta: ${num(360 * Math.sin(0), 1)}°`,
      al:a => { a.set('lat',0); a.set('veloc',14); } },

    { clave:'La idea',
      texto:'Y ahí está lo bueno. La forma del planeta entero estaba escrita en un sótano de ' +
            'París. No hace falta salir para saber dónde estás.',
      dato:() => 'la curvatura, medida desde dentro',
      al:a => { a.set('lat',49); a.set('veloc',10); a.set('flechas',240); } },

    { clave:'Ahora te toca',
      texto:'Mueve la latitud y mira cuánto gira. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('lat',35); a.set('veloc',12); } }
  ],

  iniciar(a) { sembrar(a); },
  reiniciar(a) { sembrar(a); },
  cambio(id, val, a) { if (id === 'lat') sembrar(a); },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    const lat = a.p.lat * Math.PI / 180;
    const colat = Math.PI / 2 - lat;

    /* ── Transporte ── */
    if (a.dt > 0) {
      const total = Math.min(a.dt, .033) * (a.p.veloc / 10) * .55;
      const sub = Math.max(1, Math.ceil(total / .004));
      const h = total / sub;
      let q = null;
      for (let k = 0; k < sub; k++) q = transportar(colat, h);
      if (q) {
        memQ[memI*3] = q[0]; memQ[memI*3+1] = q[1]; memQ[memI*3+2] = q[2];
        memV[memI*3] = v[0]; memV[memI*3+1] = v[1]; memV[memI*3+2] = v[2];
        memI = (memI + 1) % MEM;
        if (memN < MEM) memN++;
      }
      azim += a.dtr * .16;
    }

    const porVuelta = 360 * Math.sin(lat);
    const horas = Math.abs(Math.sin(lat)) > .01 ? 23.934 / Math.abs(Math.sin(lat)) : 0;

    a.leer('vuelta', num(Math.abs(porVuelta), 1) + '°');
    a.leer('acum',   num(acumulado, 0) + '°');
    a.leer('horas',  horas ? num(horas, 1) + ' h por vuelta' : 'nunca da la vuelta');
    a.leer('v',      String(vueltas));

    /* ── Proyección ── */
    const R = Math.min(e.w, e.h) * .40;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const ca = Math.cos(azim), sa = Math.sin(azim);
    const tilt = .46, ct = Math.cos(tilt), st = Math.sin(tilt);
    const proy = p => {
      const xr = p[0]*ca - p[1]*sa, yr = p[0]*sa + p[1]*ca, zr = p[2];
      return [cx + xr*R, cy - (zr*ct - yr*st)*R, yr*ct + zr*st];
    };

    /* ── La esfera ── */
    if (a.p.malla) {
      g.lineWidth = Math.max(.6, 1 * u);
      for (let m = 0; m < 18; m++) {
        const f = 6.283185307 * m / 18;
        g.beginPath();
        for (let k = 0; k <= 90; k++) {
          const [X, Y, d] = proy(punto(Math.PI * k / 90, f));
          k ? g.lineTo(X, Y) : g.moveTo(X, Y);
        }
        g.strokeStyle = 'rgba(90,150,200,.13)';
        g.stroke();
      }
      for (let p = 1; p < 12; p++) {
        const c = Math.PI * p / 12;
        g.beginPath();
        for (let k = 0; k <= 120; k++) {
          const [X, Y] = proy(punto(c, 6.283185307 * k / 120));
          k ? g.lineTo(X, Y) : g.moveTo(X, Y);
        }
        g.strokeStyle = 'rgba(90,150,200,.13)';
        g.stroke();
      }
      g.strokeStyle = 'rgba(42,88,120,.5)';
      g.lineWidth = Math.max(1, 1.4 * u);
      g.beginPath(); g.arc(cx, cy, R, 0, 6.283185307); g.stroke();
    }

    /* ── El camino ── */
    if (a.p.camino) {
      g.lineWidth = Math.max(1.2, 2 * u);
      for (let k = 0; k < 160; k++) {
        const [X1, Y1, d1] = proy(punto(colat, 6.283185307 * k / 160));
        const [X2, Y2] = proy(punto(colat, 6.283185307 * (k+1) / 160));
        g.strokeStyle = `rgba(233,169,60,${(d1 > 0 ? .85 : .22).toFixed(2)})`;
        g.beginPath(); g.moveTo(X1, Y1); g.lineTo(X2, Y2); g.stroke();
      }
    }

    /* ── El rastro de flechas: la cinta que se retuerce ── */
    const cuantas = Math.min(memN, a.p.flechas);
    const largo = .30;
    g.lineCap = 'round';
    for (let n = 0; n < cuantas; n++) {
      const i = (memI - 1 - n + MEM * 2) % MEM;
      const q = [memQ[i*3], memQ[i*3+1], memQ[i*3+2]];
      const w = [memV[i*3], memV[i*3+1], memV[i*3+2]];
      const [X1, Y1, d1] = proy(q);
      const [X2, Y2] = proy([q[0] + w[0]*largo, q[1] + w[1]*largo, q[2] + w[2]*largo]);
      const t = 1 - n / Math.max(1, cuantas);
      const c = COLOR[Math.min(NB - 1, (t * (NB - 1)) | 0)];
      const alfa = (d1 > 0 ? .70 : .16) * (.25 + t * .75);
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alfa.toFixed(3)})`;
      g.lineWidth = Math.max(.7, (.8 + t * 1.6) * u);
      g.beginPath(); g.moveTo(X1, Y1); g.lineTo(X2, Y2); g.stroke();
    }

    /* ── La dirección de partida, para comparar ── */
    if (a.p.fantasma) {
      const q0 = punto(colat, 0);
      const [, N0] = baseLocal(q0);
      const [X1, Y1, d1] = proy(q0);
      const [X2, Y2] = proy([q0[0] + N0[0]*largo, q0[1] + N0[1]*largo, q0[2] + N0[2]*largo]);
      g.strokeStyle = `rgba(169,194,214,${d1 > 0 ? .75 : .2})`;
      g.lineWidth = Math.max(1, 1.6 * u);
      g.setLineDash([4 * u, 4 * u]);
      g.beginPath(); g.moveTo(X1, Y1); g.lineTo(X2, Y2); g.stroke();
      g.setLineDash([]);
      g.fillStyle = `rgba(169,194,214,${d1 > 0 ? .9 : .25})`;
      g.beginPath(); g.arc(X1, Y1, 3 * u, 0, 6.283185307); g.fill();
    }

    /* ── La flecha de ahora ── */
    const q = punto(colat, fase);
    const [AX, AY, ad] = proy(q);
    const [BX, BY] = proy([q[0] + v[0]*largo, q[1] + v[1]*largo, q[2] + v[2]*largo]);
    g.strokeStyle = ad > 0 ? '#FFF6E2' : 'rgba(255,246,226,.3)';
    g.lineWidth = Math.max(1.8, 3.2 * u);
    g.beginPath(); g.moveTo(AX, AY); g.lineTo(BX, BY); g.stroke();
    const ang = Math.atan2(BY - AY, BX - AX), cab = 9 * u;
    g.fillStyle = g.strokeStyle;
    g.beginPath();
    g.moveTo(BX, BY);
    g.lineTo(BX - cab * Math.cos(ang - .42), BY - cab * Math.sin(ang - .42));
    g.lineTo(BX - cab * Math.cos(ang + .42), BY - cab * Math.sin(ang + .42));
    g.closePath(); g.fill();
    g.fillStyle = '#E9A93C';
    g.beginPath(); g.arc(AX, AY, 4.2 * u, 0, 6.283185307); g.fill();

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(`latitud ${a.p.lat}°`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`${num(Math.abs(porVuelta), 0)}° por vuelta`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
