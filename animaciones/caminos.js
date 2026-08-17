/* ══════════════════════════════════════════════════════════
   70 caminos contra uno

   Por qué siempre sale la campana: no es magia, es un recuento.
   Al centro llegan C(n,k) recorridos distintos y al borde solo
   uno. Las líneas gruesas son los caminos que acaban en el cubo
   elegido, con el grosor proporcional a cuántos pasan por ahí.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const RAMPA = [
  [0.00, '#1E4E74'],
  [0.30, '#2F86A8'],
  [0.54, '#5FC6DA'],
  [0.70, '#DDEDDF'],
  [0.85, '#E9A93C'],
  [1.00, '#FFD98A']
];
const NB = 14;
const aRGB = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
const franjas = alfa => {
  const out = [];
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    let a = RAMPA[0], b = RAMPA[RAMPA.length - 1];
    for (let k = 0; k < RAMPA.length - 1; k++)
      if (t >= RAMPA[k][0] && t <= RAMPA[k + 1][0]) { a = RAMPA[k]; b = RAMPA[k + 1]; break; }
    const f = (t - a[0]) / ((b[0] - a[0]) || 1);
    const A = aRGB(a[1]), B = aRGB(b[1]);
    out.push(`rgba(${Math.round(A[0]+(B[0]-A[0])*f)},${
                    Math.round(A[1]+(B[1]-A[1])*f)},${
                    Math.round(A[2]+(B[2]-A[2])*f)},${alfa})`);
  }
  return out;
};
const COLOR = franjas(1), COLOR_S = franjas(.5);

/* ── Combinatoria ── */
const MAXN = 20;
const COMB = [];
for (let n = 0; n <= MAXN; n++) {
  COMB[n] = [];
  for (let k = 0; k <= n; k++)
    COMB[n][k] = (k === 0 || k === n) ? 1 : COMB[n-1][k-1] + COMB[n-1][k];
}
const C = (n, k) => (k < 0 || k > n || n < 0) ? 0 : COMB[n][k];

/* ── Pelotas ── */
const MAXP = 900;
const pi_ = new Int16Array(MAXP), pj = new Int16Array(MAXP);
const pfrac = new Float32Array(MAXP), pviva = new Uint8Array(MAXP);
const pdestino = new Int16Array(MAXP);

let cubos = null, nFilas = 0, total = 0, cima = 1, ultimo = -1, brillo = 0;

function reiniciar(filas) {
  nFilas = filas;
  cubos = new Float64Array(filas + 1);
  total = 0; cima = 1; ultimo = -1; brillo = 0;
  for (let i = 0; i < MAXP; i++) pviva[i] = 0;
}

function soltar(i) {
  pi_[i] = 0; pj[i] = 0; pfrac[i] = 0; pviva[i] = 1;
}

LabShell.registrar({

  meta: {
    id:'caminos',
    titulo:'70 caminos contra uno',
    subtitulo:'Por qué el azar acaba siempre con la misma forma',
    categoria:'Probabilidad',
    lecturaPrincipal:'caminos',
    etiquetaPrincipal:'Caminos a ese cubo',
    gancho:'Al centro llegan 70 caminos. Al borde, uno solo',
    etiquetas:['probabilidad','matematicas','pascal','azar','stem']
  },

  portal: {
    texto:'Suelta una pelota y déjala rebotar ocho veces, izquierda o derecha, al azar. ' +
          'Puede acabar en cualquier cubo. Pero para caer en el del medio hay setenta ' +
          'recorridos posibles, y para caer en el del borde solo hay uno. Ahí está toda ' +
          'la explicación de por qué el azar acaba siempre con la misma forma.',
    pruebas: [
      { t:'Los caminos al centro',
        d:'Setenta formas distintas de acabar en el mismo sitio.',
        al:a => { a.set('filas',8); a.set('cubo',50); a.set('caminos',true); a.set('numeros',true); } },
      { t:'El único camino al borde',
        d:'Ocho veces a la derecha seguidas. Una entre 256.',
        al:a => { a.set('filas',8); a.set('cubo',100); a.set('caminos',true); } },
      { t:'Dieciséis filas',
        d:'Con más rebotes, la diferencia entre centro y orilla se dispara.',
        al:a => { a.set('filas',16); a.set('cubo',50); a.set('numeros',false); } }
    ]
  },

  params: [
    { id:'filas', tipo:'rango', label:'Filas', min:4, max:16, paso:1, valor:8 },
    { id:'cubo',  tipo:'rango', label:'Cubo señalado', min:0, max:100, paso:1, valor:50,
      fmt:v => 'nº ' + Math.round(v / 100 * nFilas) },
    { id:'caudal',tipo:'rango', label:'Pelotas por segundo', min:0, max:180, paso:5, valor:40 },
    { id:'veloc', tipo:'rango', label:'Velocidad de caída', min:4, max:30, paso:1, valor:12,
      fmt:v => num(v/10,1) + '×' },

    { id:'caminos', tipo:'interruptor', label:'Caminos',    valor:true,  grupo:'vista' },
    { id:'numeros', tipo:'interruptor', label:'Los números', valor:true, grupo:'vista' },
    { id:'campana', tipo:'interruptor', label:'Campana',    valor:true,  grupo:'vista' }
  ],

  lecturas: [
    { id:'caminos', label:'Caminos a ese cubo', acento:true },
    { id:'prob',    label:'Probabilidad', video:true },
    { id:'todos',   label:'Caminos posibles', video:true },
    { id:'n',       label:'Pelotas caídas' }
  ],

  ayuda: [
    ['Filas', 'Cuántas veces rebota cada pelota. Con ocho filas hay 256 recorridos posibles.'],
    ['Cubo señalado', 'Elige un cubo y se dibujan todos los caminos que llegan a él. El grosor de cada tramo dice cuántos pasan por ahí.'],
    ['Los números', 'El triángulo de Pascal: cada clavo lleva el número de caminos que llegan hasta él.'],
    ['Campana', 'La curva teórica, que no es más que el recuento de caminos dibujado.'],
    ['Caminos a ese cubo', 'El número combinatorio. Al centro llegan muchos; a las orillas, casi ninguno.']
  ],

  guion: [
    { clave:'La pregunta', titulo:'70 caminos contra uno',
      texto:'Sueltas una pelota y rebota ocho veces al azar. Puede acabar en cualquier cubo, ' +
            'pero no todos los cubos cuestan lo mismo.',
      dato:() => '256 recorridos posibles',
      al:a => { a.set('filas',8); a.set('cubo',50); a.set('caudal',30);
                a.set('caminos',true); a.set('numeros',false); } },

    { clave:'El centro',
      texto:'Para caer justo en medio hay setenta recorridos distintos. Setenta maneras de ' +
            'compensar los rebotes de un lado con los del otro.',
      dato:() => `cubo del medio · ${C(nFilas, Math.round(nFilas/2))} caminos`,
      al:a => { a.set('cubo',50); a.set('caudal',60); } },

    { clave:'El borde',
      texto:'Para caer en el último cubo solo hay uno: girar a la derecha las ocho veces ' +
            'seguidas, sin fallar ninguna. Una vez de cada doscientas cincuenta y seis.',
      dato:() => 'un solo camino · 1 de cada 256',
      al:a => a.set('cubo',100) },

    { clave:'Por eso sale la campana',
      texto:'No es magia ni una ley de la naturaleza. Es un recuento: el centro tiene más ' +
            'caminos que las orillas, y cada cubo se llena en proporción a los suyos.',
      dato:() => `${total} pelotas caídas`,
      al:a => { a.set('cubo',50); a.set('caudal',140); a.set('numeros',true); } },

    { clave:'Pascal · 1654',
      texto:'Esos números ya estaban escritos en libros chinos y persas siglos antes. Pascal ' +
            'fue quien los ató al azar, discutiendo por carta cómo repartir el dinero de ' +
            'una partida que se había interrumpido.',
      dato:() => 'el triángulo de Pascal',
      al:a => { a.set('numeros',true); a.set('filas',8); } },

    { clave:'Con más rebotes',
      texto:'Sube las filas y la diferencia se dispara. Con dieciséis, al centro llegan doce ' +
            'mil ochocientos setenta caminos. Al borde sigue llegando uno.',
      dato:() => `${C(nFilas, Math.round(nFilas/2))} contra 1`,
      al:a => { a.set('filas',16); a.set('cubo',50); a.set('numeros',false); a.set('caudal',180); } },

    { clave:'Ahora te toca',
      texto:'Cambia el cubo señalado y mira cuántos caminos llegan. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('filas',8); a.set('cubo',75); a.set('caudal',60); a.set('numeros',true); } }
  ],

  iniciar(a) { reiniciar(a.p.filas); },
  reiniciar(a) { reiniciar(a.p.filas); },
  cambio(id, v, a) { if (id === 'filas') reiniciar(v); },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 60 || e.h < 60) return;
    if (!cubos || nFilas !== a.p.filas) reiniciar(a.p.filas);

    const n = nFilas;
    const k = Math.max(0, Math.min(n, Math.round(a.p.cubo / 100 * n)));
    const caminosK = C(n, k);
    const todos = Math.pow(2, n);

    /* ── Encaje ── */
    const margen = 16 * u;
    const hp = (e.w - margen * 2) / (2 * n + 4);
    const altoTab = e.h * .56, altoHist = e.h * .34;
    const vs = altoTab / (n + 1);
    const cx = e.x + e.w / 2, yTop = e.y + margen;
    const X = x => cx + x * hp;
    const Y = i => yTop + i * vs;

    /* ── Física ── */
    if (a.dt > 0) {
      const v = a.p.veloc / 10 * 8;
      let nacer = a.p.caudal * a.dt;
      for (let i = 0; i < MAXP && nacer > 0; i++)
        if (!pviva[i]) { soltar(i); nacer--; }

      for (let i = 0; i < MAXP; i++) {
        if (!pviva[i]) continue;
        pfrac[i] += v * a.dt;
        while (pfrac[i] >= 1) {
          pfrac[i] -= 1;
          if (Math.random() < .5) pj[i]++;
          pi_[i]++;
          if (pi_[i] >= n) {
            const b = Math.max(0, Math.min(n, pj[i]));
            cubos[b] += 1;
            if (cubos[b] > cima) cima = cubos[b];
            total++;
            if (b === k) { ultimo = b; brillo = 1; }
            pviva[i] = 0;
            break;
          }
        }
      }
      brillo = Math.max(0, brillo - a.dtr * 2.2);
    }

    a.leer('caminos', caminosK.toLocaleString('es'));
    a.leer('prob',    '1 de cada ' + num(todos / caminosK, caminosK === 1 ? 0 : 1));
    a.leer('todos',   todos.toLocaleString('es'));
    a.leer('n',       String(total));

    /* ── Caminos hasta el cubo elegido ──
       Cada tramo lleva C(i,j)·C(n−i−1, k−j) recorridos: los que llegan
       hasta ese clavo por los que salen de ahí al destino. */
    if (a.p.caminos && caminosK > 0) {
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
          const hasta = C(i, j);
          if (!hasta) continue;
          for (const der of [0, 1]) {
            const w = hasta * C(n - i - 1, k - j - der);
            if (!w) continue;
            const t = w / caminosK;
            g.strokeStyle = `rgba(233,169,60,${(.14 + .72 * Math.sqrt(t)).toFixed(3)})`;
            g.lineWidth = Math.max(1, (1 + 5 * Math.sqrt(t)) * u);
            g.beginPath();
            g.moveTo(X(2 * j - i), Y(i));
            g.lineTo(X(2 * (j + der) - i - 1), Y(i + 1));
            g.stroke();
          }
        }
      }
    }

    /* ── Clavos y números del triángulo ── */
    const rClavo = Math.max(1.2, 2.2 * u);
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= i; j++) {
        const x = X(2 * j - i), y = Y(i);
        g.fillStyle = 'rgba(119,148,173,.75)';
        g.beginPath(); g.arc(x, y, rClavo, 0, 6.28318); g.fill();
      }
    }
    if (a.p.numeros && n <= 12) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${Math.min(15, hp * 1.1) * uh / u}px 'JetBrains Mono',monospace`;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= i; j++) {
          const enRuta = C(i, j) * C(n - i, k - j) > 0;
          g.fillStyle = enRuta ? 'rgba(233,169,60,.95)' : 'rgba(119,148,173,.45)';
          g.fillText(String(C(i, j)), X(2 * j - i), Y(i) - vs * .34);
        }
      g.textBaseline = 'alphabetic';
    }

    /* ── Pelotas ── */
    for (let i = 0; i < MAXP; i++) {
      if (!pviva[i]) continue;
      const f = pfrac[i], sm = f * f * (3 - 2 * f);
      /* la pelota ya ha decidido su lado: interpolamos entre clavo y clavo */
      const xa = 2 * pj[i] - pi_[i] - (pi_[i] > 0 ? 0 : 0);
      const x = X(xa), y = Y(pi_[i] + sm);
      const t = Math.min(1, Math.abs(xa) / Math.max(1, n * .8));
      g.fillStyle = COLOR[Math.min(NB - 1, (t * (NB - 1)) | 0)];
      g.beginPath(); g.arc(x, y, Math.max(1.6, 2.8 * u), 0, 6.28318); g.fill();
    }

    /* ── Histograma ── */
    const yH = Y(n) + 14 * u;
    const altoMax = Math.max(10, altoHist - 16 * u);
    const ancho = Math.max(2, hp * 2 - Math.max(1, u));

    for (let b = 0; b <= n; b++) {
      const h = cubos[b] / cima * altoMax;
      const sel = b === k;
      const val = 2 * b - n;
      if (h > .6) {
        const t = Math.min(1, Math.abs(val) / Math.max(1, n * .8));
        g.fillStyle = sel ? 'rgba(233,169,60,.95)' : COLOR_S[Math.min(NB - 1, (t * (NB - 1)) | 0)];
        g.fillRect(X(val) - ancho / 2, yH + altoMax - h, ancho, h);
      }
      if (sel) {
        g.strokeStyle = `rgba(233,169,60,${(.35 + brillo * .6).toFixed(2)})`;
        g.lineWidth = Math.max(1, 1.4 * u);
        g.strokeRect(X(val) - ancho / 2, yH, ancho, altoMax);
      }
    }

    /* ── Campana teórica: el recuento, dibujado ── */
    if (a.p.campana) {
      g.strokeStyle = 'rgba(234,242,248,.85)';
      g.lineWidth = 2.2 * u; g.lineJoin = 'round';
      g.beginPath();
      const pico = C(n, Math.floor(n / 2));
      for (let b = 0; b <= n; b++) {
        const Yb = yH + altoMax - C(n, b) / pico * altoMax;
        b ? g.lineTo(X(2 * b - n), Yb) : g.moveTo(X(2 * b - n), Yb);
      }
      g.stroke();
    }

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(`${caminosK.toLocaleString('es')} ${caminosK === 1 ? 'camino' : 'caminos'}`,
               e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`de ${todos.toLocaleString('es')} posibles`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
