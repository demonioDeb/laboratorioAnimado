/* ══════════════════════════════════════════════════════════
   Sumas de Riemann · el área bajo una curva
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

/* ── Paleta: la misma rampa que Vórtices, para que se reconozcan ── */
/* El puente claro del 0,70 evita que al pasar de cian a ámbar
   la mezcla caiga en un verde grisáceo. */
const RAMPA = [
  [0.00, '#1E4E74'],
  [0.30, '#2F86A8'],
  [0.54, '#5FC6DA'],
  [0.70, '#DDEDDF'],
  [0.85, '#E9A93C'],
  [1.00, '#FFD98A']
];
const NB = 12;

const aRGB = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];

const franjas = (alfa) => {
  const out = [];
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    let a = RAMPA[0], b = RAMPA[RAMPA.length - 1];
    for (let k = 0; k < RAMPA.length - 1; k++)
      if (t >= RAMPA[k][0] && t <= RAMPA[k + 1][0]) { a = RAMPA[k]; b = RAMPA[k + 1]; break; }
    const f = (t - a[0]) / ((b[0] - a[0]) || 1);
    const A = aRGB(a[1]), B = aRGB(b[1]);
    out.push(`rgba(${Math.round(A[0] + (B[0]-A[0])*f)},${
                    Math.round(A[1] + (B[1]-A[1])*f)},${
                    Math.round(A[2] + (B[2]-A[2])*f)},${alfa})`);
  }
  return out;
};

const RELLENO = franjas(.40);
const BORDE   = franjas(.95);

/* ── Funciones disponibles ── */
const FN = {
  cuad: { et:'x²',  f:x => x*x,          a:0, b:2, exacta:8/3,  ymax:4.4,  ley:'f(x) = x²' },
  seno: { et:'sen', f:x => Math.sin(x),  a:0, b:Math.PI, exacta:2, ymax:1.18, ley:'f(x) = sen x' },
  raiz: { et:'√x',  f:x => Math.sqrt(x), a:0, b:4, exacta:16/3, ymax:2.25, ley:'f(x) = √x' }
};

/* El deslizador es logarítmico: mucha resolución donde importa */
const N_MAX = 500;
const nDe = v => Math.max(1, Math.round(Math.pow(N_MAX, v / 100)));
const vDe = n => Math.round(100 * Math.log(n) / Math.log(N_MAX));

/* Estado interno de la escena */
let nSuave = 1, suma = 0, err = 0, errPct = 0, N = 1;

function calcular(fn, n, metodo) {
  const h = (fn.b - fn.a) / n;
  let s = 0;
  if (metodo === 'trapecio') {
    s = (fn.f(fn.a) + fn.f(fn.b)) / 2;
    for (let i = 1; i < n; i++) s += fn.f(fn.a + i * h);
    return s * h;
  }
  const d = metodo === 'izq' ? 0 : metodo === 'der' ? 1 : .5;
  for (let i = 0; i < n; i++) s += fn.f(fn.a + (i + d) * h);
  return s * h;
}

LabShell.registrar({

  meta: {
    id:'riemann',
    titulo:'Sumas de Riemann',
    subtitulo:'Cuenta rectángulos hasta que dejen de ser rectángulos',
    categoria:'Cálculo',
    lecturaPrincipal:'suma',
    etiquetaPrincipal:'Área aproximada',
    gancho:'¿Cuánta área hay bajo una curva? Cuéntala con rectángulos',
    etiquetas:['calculo','matematicas','integrales','riemann','stem']
  },

  portal: {
    texto:'Ninguna fórmula te da el área que hay debajo de una curva. Pero sí la de un ' +
          'rectángulo, y esos podemos ponerlos todos los que queramos. Cuantos más y más ' +
          'finos, menos se escapa. Aquí puedes ver ese error desplomarse en directo.',
    pruebas: [
      { t:'Sube los rectángulos hasta 500',
        d:'Mira caer la desviación de un 34 % a menos del 0,1 %.',
        al:a => { a.set('fn','cuad'); a.set('metodo','izq'); a.set('n', vDe(500)); } },
      { t:'Izquierda contra Trapecio, con ocho',
        d:'El mismo trabajo y cien veces menos error.',
        al:a => { a.set('fn','cuad'); a.set('n', vDe(8)); a.set('metodo','trapecio'); } },
      { t:'Prueba con la raíz cuadrada',
        d:'Una curva que sube al revés: ¿te quedas corto o te pasas?',
        al:a => { a.set('fn','raiz'); a.set('n', vDe(6)); a.set('metodo','izq'); } }
    ]
  },

  params: [
    { id:'fn', tipo:'opciones', label:'Función', valor:'cuad',
      opciones:[{v:'cuad',t:'x²'},{v:'seno',t:'sen x'},{v:'raiz',t:'√x'}] },

    { id:'n', tipo:'rango', label:'Rectángulos', min:0, max:100, paso:1, valor:vDe(4),
      fmt:v => String(nDe(v)) },

    { id:'metodo', tipo:'opciones', label:'Dónde se mide la altura', valor:'izq',
      opciones:[{v:'izq',t:'Izquierda'},{v:'der',t:'Derecha'},
                {v:'medio',t:'Punto medio'},{v:'trapecio',t:'Trapecio'}] },

    { id:'curva',  tipo:'interruptor', label:'Curva',     valor:true,  grupo:'vista' },
    { id:'rect',   tipo:'interruptor', label:'Rectángulos',valor:true, grupo:'vista' },
    { id:'sobra',  tipo:'interruptor', label:'Error',     valor:true,  grupo:'vista' },
    { id:'ejes',   tipo:'interruptor', label:'Ejes',      valor:true,  grupo:'vista' }
  ],

  lecturas: [
    { id:'suma',   label:'Suma',        acento:true },
    { id:'exacta', label:'Exacto',      video:true },
    { id:'err',    label:'Error' },
    { id:'pct',    label:'Desviación',  video:true }
  ],

  ayuda: [
    ['Función',    'La curva cuya área quieres medir. Cada una tiene un valor exacto conocido.'],
    ['Rectángulos','Cuántos trozos parten el intervalo. El deslizador llega hasta 500.'],
    ['Altura',     'De dónde se toma la altura de cada rectángulo. Cambia mucho el error.'],
    ['Trapecio',   'En vez de un techo plano, uno inclinado que une los dos extremos.'],
    ['Error',      'Pinta en rojo lo que sobra o falta respecto al área real.']
  ],

  guion: [
    /* Solo esta parada lleva título: se lee una vez y se queda fijo */
    { clave:'Arquímedes · siglo III a.C.', titulo:'El área bajo una curva',
      texto:'Tardó dos mil años en descubrirse. Arquímedes fue el primero en acercarse: ' +
            'metió un triángulo dentro de la curva, luego otro en cada hueco, y otro más.',
      dato:() => 'método de exhausción',
      al:a => { a.set('fn','cuad'); a.set('metodo','medio'); a.set('n', vDe(3)); a.set('sobra', true); } },

    { clave:'La idea que sobrevivió',
      texto:'Nunca tocó el área exacta, pero se quedó tan cerca que dejó de importar. ' +
            'Si no sabes medir la curva, deja de intentarlo: mide rectángulos, que eso sí sabes.',
      dato:() => `n = ${N} · se escapa el ${num(errPct,0)} %`,
      al:a => { a.set('n', vDe(6)); a.set('metodo','izq'); } },

    { clave:'El truco',
      texto:'Y aquí está lo bueno. Al estrecharlos no sobra un poco menos: sobra muchísimo menos. ' +
            'Doblas el número y el error se parte en cuatro.',
      dato:() => `n = ${N} · se escapa el ${num(errPct,1)} %`,
      al:a => a.set('n', vDe(40)) },

    { clave:'Newton y Leibniz · siglo XVII',
      texto:'Los dos vieron por separado que ese conteo tenía atajo. Lo llamaron cálculo, ' +
            'y se pasaron el resto de sus vidas peleando por quién llegó primero.',
      dato:() => `n = ${N} · se escapa el ${num(errPct,2)} %`,
      al:a => a.set('n', vDe(300)) },

    { clave:'La grieta',
      texto:'Pero funcionaba sin que nadie supiera por qué. Mide por la izquierda y te quedas corto. ' +
            'Por la derecha te pasas. ¿Quién garantizaba que en medio hubiera un único número?',
      dato:() => 'dos métodos, dos resultados',
      al:a => { a.set('n', vDe(8)); a.set('metodo','der'); } },

    { clave:'Riemann · 1854',
      texto:'Lo hizo él, con veintiocho años. Escribió la condición exacta que hay que cumplir, ' +
            'y dos siglos de usar algo a ciegas terminaron en una sola frase.',
      dato:() => `n = ${N} · se escapa el ${num(errPct,2)} %`,
      al:a => { a.set('n', vDe(400)); a.set('metodo','medio'); } },

    { clave:'Hoy',
      texto:'Cada área bajo una gráfica que has visto en tu vida sale de aquí. ' +
            'De rellenar un hueco con rectángulos hasta que dejan de verse.',
      dato:() => 'la integral definida',
      al:a => { a.set('n', vDe(500)); a.set('metodo','izq'); } },

    { clave:'Ahora te toca',
      texto:'Cambia la función, mueve el número, mira caer el error. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('n', vDe(24)); a.set('metodo','trapecio'); a.set('fn','seno'); } }
  ],

  iniciar(a) { nSuave = nDe(a.p.n); },
  reiniciar(a) { nSuave = nDe(a.p.n); },

  dibujar(g, a) {
    const u = a.u, uh = a.uh, e = a.escena;
    if (e.h < 60 * u) return;

    const fn = FN[a.p.fn] || FN.cuad;
    const objetivo = nDe(a.p.n);

    /* el número de rectángulos se acerca a su destino, no salta.
       Usa el reloj de interfaz: responde aunque la escena esté en pausa. */
    nSuave += (objetivo - nSuave) * (1 - Math.exp(-a.dtr * 4));
    if (Math.abs(objetivo - nSuave) < .5) nSuave = objetivo;
    N = Math.max(1, Math.round(nSuave));

    suma   = calcular(fn, N, a.p.metodo);
    err    = suma - fn.exacta;
    errPct = Math.abs(err) / fn.exacta * 100;

    a.leer('suma',   num(suma, 4));
    a.leer('exacta', num(fn.exacta, 4));
    a.leer('err',    (err >= 0 ? '+' : '−') + num(Math.abs(err), 4));
    a.leer('pct',    num(errPct, errPct < 1 ? 3 : 2) + ' %');

    /* ── Marco de dibujo ── */
    const pi = 46 * uh, pd = 14 * u, pa = 18 * u, pb = 44 * uh;
    const X0 = e.x + pi, Y0 = e.y + e.h - pb;
    const AN = e.w - pi - pd, AL = e.h - pa - pb;
    if (AN <= 0 || AL <= 0) return;

    const px = x => X0 + (x - fn.a) / (fn.b - fn.a) * AN;
    const py = y => Y0 - y / fn.ymax * AL;

    /* ── Ejes ── */
    if (a.p.ejes) {
      g.strokeStyle = 'rgba(42,88,120,.9)';
      g.lineWidth = 1.5 * u;
      g.beginPath();
      g.moveTo(X0, e.y + pa); g.lineTo(X0, Y0); g.lineTo(X0 + AN, Y0);
      g.stroke();

      g.fillStyle = '#7794AD';
      g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
      g.textAlign = 'center';
      g.fillText(num(fn.a, 0), X0, Y0 + 28 * uh);
      g.fillText(fn.b === Math.PI ? 'π' : num(fn.b, 0), X0 + AN, Y0 + 28 * uh);
      g.textAlign = 'right';
      g.fillText('0', X0 - 12 * uh, Y0 + 6 * uh);
    }

    /* ── Rectángulos: cada uno con su tono ── */
    const h = (fn.b - fn.a) / N;
    const finos = N > 110;
    const alturaDe = i => {
      const x0 = fn.a + i * h;
      if (a.p.metodo === 'trapecio') return (fn.f(x0) + fn.f(x0 + h)) / 2;
      const d = a.p.metodo === 'izq' ? 0 : a.p.metodo === 'der' ? 1 : .5;
      return fn.f(fn.a + (i + d) * h);
    };

    if (a.p.rect) {
      /* Agrupados por franja de color: pocas llamadas, muchos tonos */
      const cubos = Array.from({ length: NB }, () => []);
      for (let i = 0; i < N; i++) cubos[Math.min(NB - 1, (i / N * NB) | 0)].push(i);

      g.lineWidth = Math.max(.5, 1.1 * u);
      cubos.forEach((lista, b) => {
        if (!lista.length) return;
        g.beginPath();
        for (const i of lista) {
          const x0 = fn.a + i * h, x1 = x0 + h;
          if (a.p.metodo === 'trapecio') {
            g.moveTo(px(x0), py(0));
            g.lineTo(px(x0), py(fn.f(x0)));
            g.lineTo(px(x1), py(fn.f(x1)));
            g.lineTo(px(x1), py(0));
            g.closePath();
          } else {
            const alt = alturaDe(i);
            g.rect(px(x0), py(alt), px(x1) - px(x0), py(0) - py(alt));
          }
        }
        g.fillStyle = RELLENO[b];
        g.fill();
        if (!finos) { g.strokeStyle = BORDE[b]; g.stroke(); }
      });
    }

    /* ── Lo que se escapa: late despacio para que se note ── */
    if (a.p.sobra && !finos) {
      const latido = .40 + .12 * Math.sin(a.tr * 2.1);
      g.fillStyle = `rgba(255,116,90,${latido.toFixed(3)})`;
      g.beginPath();
      for (let i = 0; i < N; i++) {
        const x0 = fn.a + i * h, x1 = x0 + h, M = 6;
        if (a.p.metodo === 'trapecio') {
          g.moveTo(px(x0), py(fn.f(x0)));
          for (let k = 1; k <= M; k++) {
            const x = x0 + (x1 - x0) * k / M;
            g.lineTo(px(x), py(fn.f(x)));
          }
          g.lineTo(px(x1), py(fn.f(x1)));
          g.closePath();
        } else {
          const alt = alturaDe(i);
          g.moveTo(px(x0), py(alt));
          for (let k = 0; k <= M; k++) {
            const x = x0 + (x1 - x0) * k / M;
            g.lineTo(px(x), py(fn.f(x)));
          }
          g.lineTo(px(x1), py(alt));
          g.closePath();
        }
      }
      g.fill();
    }

    /* ── La curva, con halo ── */
    if (a.p.curva) {
      const trazo = () => {
        g.beginPath();
        const P = 260;
        for (let k = 0; k <= P; k++) {
          const x = fn.a + (fn.b - fn.a) * k / P;
          k ? g.lineTo(px(x), py(fn.f(x))) : g.moveTo(px(x), py(fn.f(x)));
        }
        g.stroke();
      };
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(120,205,225,.16)';
      g.lineWidth = 12 * u; trazo();
      g.strokeStyle = 'rgba(160,220,240,.20)';
      g.lineWidth = 5 * u;  trazo();
      g.restore();
      g.strokeStyle = '#F4FAFF';
      g.lineWidth = 2.6 * u; trazo();
    }

    /* ── Ley de la función ── */
    g.fillStyle = 'rgba(234,242,248,.9)';
    g.font = `${30 * uh}px 'Instrument Serif',Georgia,serif`;
    g.textAlign = 'left';
    g.fillText(fn.ley, X0 + 16 * uh, e.y + pa + 28 * uh);

    g.fillStyle = '#7794AD';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillText(`n = ${N}`, X0 + 16 * uh, e.y + pa + 56 * uh);
  }
});
})();
