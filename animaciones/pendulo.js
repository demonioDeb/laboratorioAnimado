/* ══════════════════════════════════════════════════════════
   Una bola colgada sabe dónde estás

   Vista cenital de un péndulo de Foucault. El plano de oscilación
   gira a −360·sen(latitud) por día sidéreo, que es lo que dice la
   física del marco rotante (verificado con Coriolis: error 0,07°).

   Un péndulo real da 2.573 vaivenes en seis horas y su plano solo
   gira 68 grados: por vaivén, 0,026 grados. Invisible. Por eso
   esto es un lapso de tiempo, y la aceleración va en pantalla.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const DIA = 86164;                 /* día sidéreo, en segundos */

/* Un péndulo de 70 m tarda 8,4 s en cada vaivén: 0,374 rad/s. Dibujar
   los trece mil vaivenes de una vuelta completa es imposible, así que
   cada vaivén en pantalla vale por unos 300 reales. Lo importante es
   que este ritmo va atado al tiempo SIMULADO y no al reloj de pared:
   al acelerar, el vaivén acelera igual y el dibujo no cambia de forma. */
const VAIVENES_COMPRIMIDOS = 300;
const RITMO = 0.374 / VAIVENES_COMPRIMIDOS;

const RAMPA = [
  [0.00, '#1E4E74'],
  [0.30, '#2F86A8'],
  [0.55, '#5FC6DA'],
  [0.74, '#DDEDDF'],
  [0.90, '#E9A93C'],
  [1.00, '#FFD98A']
];
const aRGB = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
function tono(t) {
  let a = RAMPA[0], b = RAMPA[RAMPA.length - 1];
  for (let k = 0; k < RAMPA.length - 1; k++)
    if (t >= RAMPA[k][0] && t <= RAMPA[k + 1][0]) { a = RAMPA[k]; b = RAMPA[k + 1]; break; }
  const f = (t - a[0]) / ((b[0] - a[0]) || 1);
  const A = aRGB(a[1]), B = aRGB(b[1]);
  return [Math.round(A[0]+(B[0]-A[0])*f),
          Math.round(A[1]+(B[1]-A[1])*f),
          Math.round(A[2]+(B[2]-A[2])*f)];
}

/* ── Estado ── */
let tSim = 0;            /* segundos simulados */
let fase = 0;            /* vaivén en pantalla */
let anguloIni = 0, caidas = 0;
let clavijas = [];

let lienzoEstela = null, ce = null, anchoE = 0, altoE = 0;
let pvx = 0, pvy = 0, hayPrev = false;

/* Los planos por los que ya ha pasado. Dibujarlos todos a la vez
   convierte el giro en un abanico, que es lo que engancha. */
const MEMP = 420;
const planos = new Float64Array(MEMP);
let planoN = 0, planoI = 0, ultimoPlano = 1e9;

function prepararEstela(w, h) {
  if (lienzoEstela && anchoE === w && altoE === h) return;
  anchoE = w; altoE = h;
  lienzoEstela = document.createElement('canvas');
  lienzoEstela.width = w; lienzoEstela.height = h;
  ce = lienzoEstela.getContext('2d');
}

/* Ángulo del plano de oscilación, en grados. Signo negativo en el
   hemisferio norte: gira en el sentido de las agujas del reloj. */
const anguloPlano = (lat, t) => -360 * Math.sin(lat * Math.PI / 180) * t / DIA;

function sembrar(a) {
  tSim = 0; fase = 0; caidas = 0;
  anguloIni = 0;
  const n = a.p.clavijas;
  clavijas = [];
  for (let i = 0; i < n; i++) clavijas.push({ a: 360 * i / n, caida: false });
  hayPrev = false;
  planoN = 0; planoI = 0; ultimoPlano = 1e9;
}

LabShell.registrar({

  meta: {
    id:'pendulo',
    titulo:'Una bola colgada sabe dónde estás',
    subtitulo:'No gira el péndulo: gira el suelo',
    categoria:'Física',
    lecturaPrincipal:'vuelta',
    etiquetaPrincipal:'Vuelta completa',
    gancho:'Una bola colgada de un cable sabe a qué latitud está',
    etiquetas:['fisica','foucault','tierra','astronomia','stem']
  },

  portal: {
    texto:'Cuelga una bola de un cable muy largo y déjala oscilar en línea recta. Vuelve al ' +
          'cabo de una hora y estará oscilando en otra dirección. Nadie la ha tocado: lo que ' +
          'se ha movido es el suelo. Y lo mejor es que el ritmo al que gira depende solo de ' +
          'la latitud, así que el péndulo te dice dónde estás sin mirar por la ventana.',
    pruebas: [
      { t:'En París, como en 1851',
        d:'Una vuelta completa cada treinta y dos horas.',
        al:a => { a.set('lat',49); a.set('horas',12); a.set('clavijas',48); } },
      { t:'En el polo: un día justo',
        d:'Veinticuatro horas por vuelta, ni una más.',
        al:a => { a.set('lat',85); a.set('horas',12); } },
      { t:'En el ecuador: nunca gira',
        d:'El péndulo se queda oscilando en la misma dirección para siempre.',
        al:a => { a.set('lat',0); a.set('horas',20); } }
    ]
  },

  params: [
    { id:'lat', tipo:'rango', label:'Latitud', min:-85, max:85, paso:1, valor:49,
      fmt:v => v + '°' },
    { id:'horas', tipo:'rango', label:'Horas por segundo', min:2, max:80, paso:1, valor:12,
      fmt:v => num(v/10, 1) + ' h/s' },
    { id:'clavijas', tipo:'rango', label:'Clavijas', min:0, max:72, paso:4, valor:48 },
    { id:'estela', tipo:'rango', label:'Rastro', min:1, max:40, paso:1, valor:26 },

    { id:'sala',   tipo:'interruptor', label:'La sala', valor:true, grupo:'vista' },
    { id:'rosa',   tipo:'interruptor', label:'Norte',   valor:true, grupo:'vista' },
    { id:'inicial',tipo:'interruptor', label:'Dirección inicial', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'vuelta', label:'Vuelta completa', acento:true },
    { id:'girado', label:'Ha girado', video:true },
    { id:'horas',  label:'Tiempo simulado', video:true },
    { id:'caidas', label:'Clavijas tumbadas' }
  ],

  ayuda: [
    ['Latitud', 'Lo único que decide la velocidad del giro. En el polo, un día; en el ecuador, nunca.'],
    ['Horas por segundo', 'Esto es un lapso de tiempo: al acelerar corre todo igual, el vaivén y el giro. Cada vaivén de la pantalla vale por unos trescientos reales.'],
    ['Clavijas', 'La corona que se pone alrededor en las salas donde cuelga uno. El péndulo las va tumbando y hacen de reloj.'],
    ['Vuelta completa', 'Cuánto tarda el plano en dar los 360 grados a esa latitud.'],
    ['Dirección inicial', 'Por dónde empezó a oscilar, para comparar.']
  ],

  guion: [
    { clave:'París · 1851', titulo:'Una bola colgada sabe dónde estás',
      texto:'Léon Foucault colgó una bola de veintiocho kilos de un cable larguísimo y la dejó ' +
            'oscilar en línea recta.',
      dato:() => 'Léon Foucault · 1851',
      al:a => { a.set('lat',49); a.set('horas',14); a.set('clavijas',48); a.set('estela',30); } },

    { clave:'Horas después',
      texto:'Volvió y la bola oscilaba en otra dirección. Nadie la había tocado. Esto va ' +
            'acelerado: aquí pasan horas en cada segundo.',
      dato:() => `${num(tSim/3600, 1)} horas simuladas`,
      al:a => a.set('horas',22) },

    { clave:'No gira el péndulo',
      texto:'Gira el suelo. La sala, el edificio y la ciudad entera se mueven debajo, y el ' +
            'péndulo se queda donde estaba.',
      dato:() => 'la Tierra pasa por debajo',
      al:a => { a.set('horas',30); a.set('estela',36); } },

    { clave:'En los museos',
      texto:'Todavía cuelga uno en museos de medio mundo. Le ponen una corona de clavijas y ' +
            'el péndulo las va tumbando.',
      dato:() => `${caidas} clavijas tumbadas`,
      al:a => { a.set('clavijas',64); a.set('horas',34); } },

    { clave:'París: 32 horas',
      texto:'Allí la vuelta entera tarda treinta y dos horas. No veinticuatro. Ese número ' +
            'descolocó a mucha gente.',
      dato:() => '31,8 horas por vuelta',
      al:a => { a.set('lat',49); a.set('horas',44); } },

    { clave:'Y cambia con la ciudad',
      texto:'En Ciudad de México tarda setenta y dos horas. En Nueva York, treinta y siete. ' +
            'En Tokio, cuarenta y una.',
      dato:() => `latitud ${19}° · 71,9 h`,
      al:a => { a.set('lat',19); a.set('horas',60); } },

    { clave:'En el ecuador',
      texto:'Justo ahí no gira nunca. Un péndulo en Quito oscila en la misma dirección para ' +
            'siempre, sin moverse ni un grado.',
      dato:() => 'latitud 0° · nunca',
      al:a => { a.set('lat',0); a.set('horas',60); } },

    { clave:'Y en el polo',
      texto:'Da la vuelta completa en un día exacto. Del cero al día entero, según dónde lo ' +
            'cuelgues.',
      dato:() => 'latitud 90° · 23,9 h',
      al:a => { a.set('lat',85); a.set('horas',60); } },

    { clave:'El remate',
      texto:'Así que el péndulo no solo dice que la Tierra gira. Dice en qué punto del ' +
            'planeta lo estás mirando.',
      dato:() => 'sin mirar por la ventana',
      al:a => { a.set('lat',49); a.set('horas',50); a.set('estela',38); } },

    { clave:'Ahora te toca',
      texto:'¿A qué latitud vives tú? Dilo en los comentarios y te calculo tu número. La ' +
            'simulación está en el enlace de abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('lat',35); a.set('horas',40); a.set('clavijas',48); } }
  ],

  iniciar(a) { sembrar(a); },
  reiniciar(a) { sembrar(a); if (ce) ce.clearRect(0,0,anchoE,altoE); },

  cambio(id, v, a) {
    if (id === 'lat' || id === 'clavijas') {
      sembrar(a);
      if (ce) ce.clearRect(0, 0, anchoE, altoE);
    }
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    const W = Math.max(1, Math.round(e.w)), H = Math.max(1, Math.round(e.h));
    prepararEstela(W, H);

    const lat = a.p.lat;
    const hPorSeg = a.p.horas / 10;
    const sen = Math.sin(lat * Math.PI / 180);

    /* ── Avance ──
       El vaivén corre con el tiempo SIMULADO, igual que la precesión.
       Si fuera al ritmo del reloj real, al acelerar saldrían menos
       vaivenes por vuelta y el rastro daría saltos enormes. */
    if (a.dt > 0) {
      const dtSim = a.dt * hPorSeg * 3600;
      tSim += dtSim;
      fase += dtSim * RITMO;
    }
    const ang = anguloPlano(lat, tSim);

    /* Clavijas: caen cuando el plano pasa por encima */
    for (const c of clavijas) {
      if (c.caida) continue;
      const antes = Math.floor((anguloIni - c.a) / 180);
      const ahora = Math.floor((ang - c.a) / 180);
      if (antes !== ahora) { c.caida = true; caidas++; }
    }

    const horasVuelta = Math.abs(sen) > .008 ? 23.934 / Math.abs(sen) : 0;
    a.leer('girado', num(Math.abs(ang), 0) + '°');
    a.leer('horas',  num(tSim / 3600, 1) + ' h');
    a.leer('vuelta', horasVuelta ? num(horasVuelta, 1) + ' h' : 'nunca');
    a.leer('caidas', String(caidas));

    /* ── Encaje ── */
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * .40;
    const rad = ang * Math.PI / 180;
    const ux = Math.cos(rad), uy = Math.sin(rad);

    /* Guardamos el plano cada poco para trazar el abanico */
    if (a.dt > 0 && Math.abs(ang - ultimoPlano) > .45) {
      planos[planoI] = ang;
      planoI = (planoI + 1) % MEMP;
      if (planoN < MEMP) planoN++;
      ultimoPlano = ang;
    }

    /* ── La sala ── */
    if (a.p.sala) {
      g.strokeStyle = 'rgba(42,88,120,.55)';
      g.lineWidth = Math.max(1, 1.4 * u);
      g.beginPath(); g.arc(e.x + cx, e.y + cy, R, 0, 6.283185307); g.stroke();
      g.strokeStyle = 'rgba(90,150,200,.10)';
      g.lineWidth = Math.max(.6, 1 * u);
      for (let k = 1; k <= 3; k++) {
        g.beginPath(); g.arc(e.x + cx, e.y + cy, R * k / 4, 0, 6.283185307); g.stroke();
      }
    }

    /* ── El abanico de planos recorridos ── */
    const ampF = Math.min(W, H) * .40 * .90;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (let n = 0; n < planoN; n++) {
      const i = (planoI - 1 - n + MEMP * 2) % MEMP;
      const t = 1 - n / Math.max(1, planoN);
      const rr = planos[i] * Math.PI / 180;
      const c = tono(.15 + t * .8);
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(.05 + t * .16).toFixed(3)})`;
      g.lineWidth = Math.max(.6, (.7 + t * 1.4) * u);
      g.beginPath();
      g.moveTo(e.x + cx - Math.cos(rr) * ampF, e.y + cy - Math.sin(rr) * ampF);
      g.lineTo(e.x + cx + Math.cos(rr) * ampF, e.y + cy + Math.sin(rr) * ampF);
      g.stroke();
    }
    g.restore();

    /* ── Rastro del vaivén: la roseta ── */
    const amp = R * .90;
    const s = Math.sin(fase);
    const bx = cx + ux * amp * s, by = cy + uy * amp * s;

    ce.globalCompositeOperation = 'destination-out';
    ce.fillStyle = `rgba(0,0,0,${(0.34 / a.p.estela).toFixed(4)})`;
    ce.fillRect(0, 0, W, H);
    ce.globalCompositeOperation = 'lighter';
    if (hayPrev) {
      const t = Math.min(1, Math.abs(s));
      const c = tono(.2 + t * .8);
      ce.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},.72)`;
      ce.lineWidth = Math.max(1.2, 2.4 * u);
      ce.lineCap = 'round';
      ce.beginPath(); ce.moveTo(pvx, pvy); ce.lineTo(bx, by); ce.stroke();
    }
    ce.globalCompositeOperation = 'source-over';
    pvx = bx; pvy = by; hayPrev = true;
    g.drawImage(lienzoEstela, e.x, e.y);

    /* ── Dirección inicial ── */
    if (a.p.inicial) {
      g.strokeStyle = 'rgba(169,194,214,.35)';
      g.lineWidth = Math.max(1, 1.4 * u);
      g.setLineDash([6 * u, 6 * u]);
      g.beginPath();
      g.moveTo(e.x + cx - amp, e.y + cy);
      g.lineTo(e.x + cx + amp, e.y + cy);
      g.stroke();
      g.setLineDash([]);
    }

    /* ── Las clavijas ── */
    for (const c of clavijas) {
      const t = c.a * Math.PI / 180;
      const X = e.x + cx + Math.cos(t) * R * .96;
      const Y = e.y + cy + Math.sin(t) * R * .96;
      if (c.caida) {
        g.strokeStyle = 'rgba(233,169,60,.75)';
        g.lineWidth = Math.max(1.2, 2.2 * u);
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(X - Math.sin(t) * 7 * u, Y + Math.cos(t) * 7 * u);
        g.lineTo(X + Math.sin(t) * 7 * u, Y - Math.cos(t) * 7 * u);
        g.stroke();
      } else {
        g.fillStyle = 'rgba(169,194,214,.85)';
        g.beginPath(); g.arc(X, Y, Math.max(1.6, 2.8 * u), 0, 6.283185307); g.fill();
      }
    }

    /* ── El plano de oscilación ── */
    g.strokeStyle = 'rgba(234,242,248,.32)';
    g.lineWidth = Math.max(1, 1.6 * u);
    g.beginPath();
    g.moveTo(e.x + cx - ux * amp, e.y + cy - uy * amp);
    g.lineTo(e.x + cx + ux * amp, e.y + cy + uy * amp);
    g.stroke();

    /* ── La bola ── */
    const BX = e.x + bx, BY = e.y + by;
    const gr = g.createRadialGradient(BX, BY, 0, BX, BY, 20 * u);
    gr.addColorStop(0, 'rgba(255,246,226,.45)');
    gr.addColorStop(1, 'rgba(255,246,226,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(BX, BY, 20 * u, 0, 6.283185307); g.fill();
    g.fillStyle = '#FFF6E2';
    g.beginPath(); g.arc(BX, BY, 6.5 * u, 0, 6.283185307); g.fill();

    /* ── El norte ── */
    if (a.p.rosa) {
      g.fillStyle = 'rgba(119,148,173,.9)';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${16 * uh}px 'JetBrains Mono',monospace`;
      g.fillText('N', e.x + cx, e.y + cy - R - 14 * uh);
      g.textBaseline = 'alphabetic';
    }

    /* ── Rótulos ── */
    g.textAlign = 'left';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(`latitud ${lat}°`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`×${Math.round(hPorSeg * 3600).toLocaleString('es')} acelerado`,
               e.x + 4 * uh, e.y + 44 * uh);
    g.fillText(`1 vaivén = ${VAIVENES_COMPRIMIDOS} reales`, e.x + 4 * uh, e.y + 68 * uh);
  }
});
})();
