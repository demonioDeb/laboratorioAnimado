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

/* Una sala entera dibujada donde se le diga: sirve para la vista normal
   y para las tres latitudes en paralelo. */
function dibujaSala(g, e, cx, cy, R, rad, sen, u, lat) {
  const X = e.x + cx, Y = e.y + cy;
  g.strokeStyle = 'rgba(42,88,120,.5)';
  g.lineWidth = Math.max(1, 1.2 * u);
  g.beginPath(); g.arc(X, Y, R, 0, 6.283185307); g.stroke();

  const ux = Math.cos(rad), uy = Math.sin(rad), amp = R * .9;
  g.strokeStyle = 'rgba(234,242,248,.28)';
  g.lineWidth = Math.max(1, 1.4 * u);
  g.beginPath();
  g.moveTo(X - ux * amp, Y - uy * amp);
  g.lineTo(X + ux * amp, Y + uy * amp);
  g.stroke();

  /* la dirección de partida, para ver cuánto se ha ido */
  g.strokeStyle = 'rgba(169,194,214,.30)';
  g.setLineDash([5 * u, 5 * u]);
  g.beginPath(); g.moveTo(X - amp, Y); g.lineTo(X + amp, Y); g.stroke();
  g.setLineDash([]);

  const bx = X + ux * amp * sen, by = Y + uy * amp * sen;
  const gr = g.createRadialGradient(bx, by, 0, bx, by, 14 * u);
  gr.addColorStop(0, 'rgba(255,246,226,.45)');
  gr.addColorStop(1, 'rgba(255,246,226,0)');
  g.fillStyle = gr;
  g.beginPath(); g.arc(bx, by, 14 * u, 0, 6.283185307); g.fill();
  g.fillStyle = '#FFF6E2';
  g.beginPath(); g.arc(bx, by, 4.5 * u, 0, 6.283185307); g.fill();
  g.fillStyle = 'rgba(119,148,173,.8)';
  g.beginPath(); g.arc(X, Y, 2.4 * u, 0, 6.283185307); g.fill();
}

function pintarRotulos(g, e, uh, a, hPorSeg) {
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
  g.fillStyle = 'rgba(233,169,60,.95)';
  g.fillText(`latitud ${a.p.lat}°`, e.x + 4 * uh, e.y + 20 * uh);
  g.fillStyle = 'rgba(119,148,173,.95)';
  g.fillText(`×${Math.round(hPorSeg * 3600).toLocaleString('es')} acelerado`,
             e.x + 4 * uh, e.y + 44 * uh);
  g.fillText(`1 vaivén = ${VAIVENES_COMPRIMIDOS} reales`, e.x + 4 * uh, e.y + 68 * uh);
}

/* ── El disco que gira ──
   Trazar una recta sobre un disco en movimiento: la mano va derecha y
   sale una curva. Es la inercia contada sin una sola fórmula. */
let discoAng = 0;
const trazoDisco = [];

function pintarDisco(g, e, u, uh, dt, vel) {
  const R = Math.min(e.w, e.h) * .40;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;

  if (dt > 0) {
    discoAng += dt * vel;
    /* la mano baja recta, a ritmo constante, y vuelve a empezar */
    const T = 3.2;
    const f = ((performance.now() / 1000) % T) / T;
    const y = (f * 2 - 1) * R * .88;
    /* el punto en coordenadas del disco: lo que queda dibujado en él */
    const a = -discoAng;
    trazoDisco.push([Math.cos(a) * 0 - Math.sin(a) * y, Math.sin(a) * 0 + Math.cos(a) * y, f]);
    if (trazoDisco.length > 900) trazoDisco.shift();
    if (f < .02) trazoDisco.length = 0;
  }

  g.strokeStyle = 'rgba(42,88,120,.55)';
  g.lineWidth = Math.max(1, 1.4 * u);
  g.beginPath(); g.arc(cx, cy, R, 0, 6.283185307); g.stroke();

  /* marcas del disco, para que se vea que gira */
  g.strokeStyle = 'rgba(90,150,200,.16)';
  for (let k = 0; k < 12; k++) {
    const t = discoAng + 6.283185307 * k / 12;
    g.beginPath();
    g.moveTo(cx + Math.cos(t) * R * .18, cy + Math.sin(t) * R * .18);
    g.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R);
    g.stroke();
  }

  /* la línea que la mano cree estar trazando: recta */
  g.strokeStyle = 'rgba(169,194,214,.30)';
  g.setLineDash([6 * u, 6 * u]);
  g.beginPath(); g.moveTo(cx, cy - R * .88); g.lineTo(cx, cy + R * .88); g.stroke();
  g.setLineDash([]);

  /* lo que queda dibujado en el disco: curvo */
  g.lineWidth = Math.max(1.4, 2.6 * u);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath();
  trazoDisco.forEach(([x, y], i) => {
    const c = Math.cos(discoAng), sn = Math.sin(discoAng);
    const X = cx + (x * c - y * sn), Y = cy + (x * sn + y * c);
    i ? g.lineTo(X, Y) : g.moveTo(X, Y);
  });
  g.strokeStyle = '#E9A93C';
  g.stroke();

  /* la punta */
  if (trazoDisco.length) {
    const [x, y] = trazoDisco[trazoDisco.length - 1];
    const c = Math.cos(discoAng), sn = Math.sin(discoAng);
    const X = cx + (x * c - y * sn), Y = cy + (x * sn + y * c);
    g.fillStyle = '#FFF6E2';
    g.beginPath(); g.arc(X, Y, 5 * u, 0, 6.283185307); g.fill();
  }

  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `${17 * uh}px 'JetBrains Mono',monospace`;
  g.fillStyle = 'rgba(169,194,214,.75)';
  g.fillText('la mano va recta', cx, cy - R - 26 * uh);
  g.fillStyle = 'rgba(233,169,60,.95)';
  g.fillText('el disco guarda una curva', cx, cy + R + 30 * uh);
}

/* ── Desde el espacio ──
   El plano se queda quieto apuntando a las estrellas y el globo rota
   debajo. Es lo mismo de siempre, visto desde fuera. */
let globoAz = 0;

function pintarOrbita(g, e, u, uh, dt, lat, tSimSeg) {
  const R = Math.min(e.w, e.h) * .34;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (dt > 0) globoAz += dt * .9;

  const tilt = .42, ct = Math.cos(tilt), st = Math.sin(tilt);
  const proy = (x, y, z) => {
    const xr = x * Math.cos(globoAz) - y * Math.sin(globoAz);
    const yr = x * Math.sin(globoAz) + y * Math.cos(globoAz);
    return [cx + xr * R, cy - (z * ct - yr * st) * R, yr * ct + z * st];
  };
  const punto = (colat, f) => [Math.sin(colat) * Math.cos(f),
                               Math.sin(colat) * Math.sin(f),
                               Math.cos(colat)];

  g.lineWidth = Math.max(.6, 1 * u);
  for (let m = 0; m < 16; m++) {
    const f = 6.283185307 * m / 16;
    g.beginPath();
    for (let k = 0; k <= 60; k++) {
      const [X, Y] = proy(...punto(Math.PI * k / 60, f));
      k ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.strokeStyle = 'rgba(90,150,200,.15)'; g.stroke();
  }
  for (let pz = 1; pz < 10; pz++) {
    const c = Math.PI * pz / 10;
    g.beginPath();
    for (let k = 0; k <= 90; k++) {
      const [X, Y] = proy(...punto(c, 6.283185307 * k / 90));
      k ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.strokeStyle = 'rgba(90,150,200,.15)'; g.stroke();
  }
  g.strokeStyle = 'rgba(42,88,120,.5)';
  g.lineWidth = Math.max(1, 1.3 * u);
  g.beginPath(); g.arc(cx, cy, R, 0, 6.283185307); g.stroke();

  /* dónde cuelga el péndulo */
  const colat = Math.PI/2 - lat * Math.PI/180;
  const q = punto(colat, 0);
  const [PX, PY, pd] = proy(...q);
  g.fillStyle = pd > 0 ? '#E9A93C' : 'rgba(233,169,60,.3)';
  g.beginPath(); g.arc(PX, PY, 5 * u, 0, 6.283185307); g.fill();

  /* el plano, quieto respecto a las estrellas */
  const largo = R * .55;
  const vai = Math.sin(performance.now() / 420);
  g.strokeStyle = 'rgba(234,242,248,.85)';
  g.lineWidth = Math.max(1.6, 2.8 * u);
  g.beginPath();
  g.moveTo(PX - largo, PY - largo * .18);
  g.lineTo(PX + largo, PY + largo * .18);
  g.stroke();
  g.fillStyle = '#FFF6E2';
  g.beginPath();
  g.arc(PX + largo * vai, PY + largo * .18 * vai, 6 * u, 0, 6.283185307);
  g.fill();

  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `${17 * uh}px 'JetBrains Mono',monospace`;
  g.fillStyle = 'rgba(234,242,248,.8)';
  g.fillText('el plano no se mueve', cx, cy - R - 26 * uh);
  g.fillStyle = 'rgba(119,148,173,.9)';
  g.fillText('la Tierra sí', cx, cy + R + 30 * uh);
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

    { id:'vista', tipo:'opciones', label:'¿Quién gira?', valor:'suelo',
      opciones:[{v:'suelo',t:'Gira el péndulo'},{v:'cielo',t:'Gira el suelo'},
                {v:'tres',t:'Tres latitudes'},{v:'disco',t:'El disco'},
                {v:'orbita',t:'Desde el espacio'}] },

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
    ['¿Quién gira?', 'La misma física contada de varias formas. «El disco» es la analogía: una mano que traza recto sobre algo que gira deja una curva. «Desde el espacio» enseña el plano quieto y la Tierra rotando.'],
    ['Vistas', 'La misma física contada de dos formas. «Gira el péndulo» es lo que ves desde la sala; «gira el suelo» es lo que pasa de verdad. «Tres latitudes» las compara en paralelo.'],
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
      al:a => { a.set('vista','suelo'); a.set('lat',49); a.set('horas',14);
                a.set('clavijas',48); a.set('estela',30); } },

    { clave:'Horas después',
      texto:'Volvió y la bola oscilaba en otra dirección. Nadie la había tocado. Esto va ' +
            'acelerado: aquí pasan horas en cada segundo.',
      dato:() => `${num(tSim/3600, 1)} horas simuladas`,
      al:a => a.set('horas',22) },

    { clave:'No gira el péndulo',
      texto:'Gira el suelo. La sala, el edificio y la ciudad entera se mueven debajo, y el ' +
            'péndulo se queda donde estaba. Míralo así.',
      dato:() => 'la Tierra pasa por debajo',
      al:a => { a.set('vista','cielo'); a.set('horas',30); a.set('estela',36); } },

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

    { clave:'Las tres a la vez',
      texto:'Polo, tu ciudad y el ecuador, en paralelo. Arriba da una vuelta al día; abajo ' +
            'no se mueve nunca.',
      dato:() => '24 h · 32 h · nunca',
      al:a => { a.set('vista','tres'); a.set('lat',49); a.set('horas',60); } },

    { clave:'Y cambia con la ciudad',
      texto:'En Ciudad de México tarda setenta y dos horas. En Nueva York, treinta y siete. ' +
            'En Tokio, cuarenta y una.',
      dato:() => `latitud ${19}° · 71,9 h`,
      al:a => { a.set('vista','suelo'); a.set('lat',19); a.set('horas',60); } },

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

  /* ── Guion largo · unos cuatro minutos ──
     Cada parada lleva su vista, para que no se haga monótono. */
  guionLargo: [
    { clave:'Mira esto', titulo:'Una bola colgada sabe dónde estás',
      texto:'Una bola pesada colgada de un cable larguísimo. La empujas y se pone a ir y ' +
            'venir en línea recta.',
      dato:() => 'sin trucos',
      al:a => { a.set('vista','suelo'); a.set('lat',49); a.set('horas',10);
                a.set('clavijas',48); a.set('estela',30); a.set('inicial',true); } },

    { clave:'Pasan las horas',
      texto:'Déjala unas horas y vuelve. Sigue yendo y viniendo en línea recta, pero la ' +
            'línea ya no es la misma. Se ha girado.',
      dato:() => `${num(tSim/3600,1)} horas · ${num(Math.abs(anguloPlano(49,tSim)),0)}°`,
      al:a => a.set('horas',20) },

    { clave:'El reloj',
      texto:'Para no fiarse del ojo se pone una corona de clavijas. El péndulo las va ' +
            'tumbando una a una, y ahí ya no hay discusión.',
      dato:() => `${caidas} clavijas tumbadas`,
      al:a => { a.set('clavijas',64); a.set('horas',28); } },

    { clave:'La pregunta',
      texto:'¿Quién la ha girado? No hay viento, no hay motor, nadie la ha tocado. Y aun ' +
            'así, cada hora apunta a otro sitio.',
      dato:() => 'nadie la tocó',
      al:a => a.set('horas',34) },

    { clave:'París · 1851',
      texto:'Léon Foucault colgó una bola de veintiocho kilos de un cable de sesenta y siete ' +
            'metros, dentro de un edificio de París, y la dejó oscilar.',
      dato:() => 'Léon Foucault · 1851',
      al:a => { a.set('horas',22); a.set('estela',34); } },

    { clave:'La gente miraba',
      texto:'Se llenó de curiosos. No estaban viendo moverse una bola: estaban viendo, por ' +
            'primera vez, moverse el suelo bajo sus pies.',
      dato:() => 'la primera prueba directa',
      al:a => a.set('horas',30) },

    { clave:'Lo que demostró',
      texto:'Que la Tierra gira. Todo el mundo lo daba por hecho desde hacía siglos, pero ' +
            'siempre mirando al cielo. Foucault lo probó desde dentro de una sala.',
      dato:() => 'sin mirar por la ventana',
      al:a => a.set('horas',36) },

    { clave:'La clave: la inercia',
      texto:'A la bola le da igual que la Tierra gire. Una vez lanzada, quiere seguir yendo ' +
            'y viniendo en la misma dirección del espacio.',
      dato:() => 'la inercia',
      al:a => a.set('vista','disco') },

    { clave:'Como en un disco',
      texto:'Imagina que intentas trazar una línea recta sobre un disco que gira. Tu mano va ' +
            'derecha, sin desviarse ni un milímetro.',
      dato:() => 'la mano va recta',
      al:a => a.set('vista','disco') },

    { clave:'Y sale una curva',
      texto:'Pero lo que queda dibujado en el disco es una curva. No porque tu mano se torciera: ' +
            'porque el papel se movió debajo.',
      dato:() => 'el disco guarda una curva',
      al:a => a.set('vista','disco') },

    { clave:'Desde fuera',
      texto:'Visto desde el espacio se entiende de golpe. El plano del péndulo se queda quieto, ' +
            'apuntando siempre a las mismas estrellas.',
      dato:() => 'el plano no se mueve',
      al:a => a.set('vista','orbita') },

    { clave:'La que gira eres tú',
      texto:'Y la Tierra rota debajo, contigo, con la sala y con las clavijas. El péndulo no ' +
            'gira: giramos nosotros a su alrededor.',
      dato:() => 'giramos nosotros',
      al:a => a.set('vista','orbita') },

    { clave:'Pero hay una trampa',
      texto:'Si fuera solo eso, el péndulo daría una vuelta completa cada veinticuatro horas ' +
            'en cualquier sitio. Y no es así.',
      dato:() => 'no todas las latitudes igual',
      al:a => { a.set('vista','suelo'); a.set('lat',49); a.set('horas',44); } },

    { clave:'Las tres a la vez',
      texto:'Mira lo mismo en tres sitios. Arriba, cerca del polo. En medio, París. Abajo, ' +
            'justo en el ecuador.',
      dato:() => 'polo · París · ecuador',
      al:a => { a.set('vista','tres'); a.set('lat',49); a.set('horas',60); } },

    { clave:'El polo',
      texto:'En el polo el suelo gira entero bajo el péndulo. Vuelta completa en un día ' +
            'exacto: veinticuatro horas.',
      dato:() => 'latitud 90° · 23,9 h',
      al:a => a.set('vista','tres') },

    { clave:'El ecuador',
      texto:'Y en el ecuador no gira nunca. Ni un grado. Un péndulo allí oscila en la misma ' +
            'dirección hasta que se pare.',
      dato:() => 'latitud 0° · nunca',
      al:a => a.set('vista','tres') },

    { clave:'Por qué',
      texto:'Porque lo que hace girar el plano es la parte del giro de la Tierra que apunta ' +
            'hacia arriba. En el polo apunta entera hacia arriba.',
      dato:() => 'la componente vertical',
      al:a => { a.set('vista','orbita'); a.set('lat',85); } },

    { clave:'Y en el ecuador',
      texto:'Allí esa parte vale cero: el giro apunta al horizonte, no al cielo. Por eso el ' +
            'péndulo no tiene ningún motivo para moverse.',
      dato:() => 'cero componente vertical',
      al:a => { a.set('vista','orbita'); a.set('lat',0); } },

    { clave:'La cuenta',
      texto:'De ahí sale una fórmula de una línea: quince grados por hora, multiplicado por ' +
            'el seno de tu latitud. Eso es todo.',
      dato:() => '15° por hora × sen(latitud)',
      al:a => { a.set('vista','suelo'); a.set('lat',49); a.set('horas',50); } },

    { clave:'Tu ciudad',
      texto:'En París son treinta y dos horas. En Nueva York, treinta y siete. En Tokio, ' +
            'cuarenta y una. En Ciudad de México, setenta y dos.',
      dato:() => `latitud ${19}° · 71,9 h`,
      al:a => { a.set('lat',19); a.set('horas',60); } },

    { clave:'Cada sitio, su número',
      texto:'Cuanto más te acercas al ecuador, más tarda. Y si bajas del todo, deja de ' +
            'girar. Tu latitud está escrita en el suelo.',
      dato:() => 'la latitud, medida desde dentro',
      al:a => { a.set('lat',5); a.set('horas',70); } },

    { clave:'No es una curiosidad',
      texto:'Así que la próxima vez que veas uno en un museo, no es un adorno lento. Es un ' +
            'instrumento midiendo el planeta entero.',
      dato:() => 'un instrumento, no un adorno',
      al:a => { a.set('vista','cielo'); a.set('lat',49); a.set('horas',40); a.set('estela',36); } },

    { clave:'El remate',
      texto:'Una bola, un cable y paciencia. Con eso se puede saber que la Tierra gira y en ' +
            'qué punto de ella estás parado.',
      dato:() => 'sin salir de la sala',
      al:a => { a.set('vista','orbita'); a.set('lat',49); } },

    { clave:'Ahora te toca',
      texto:'¿Hay un péndulo de Foucault en tu ciudad? Búscalo y cuéntamelo en los ' +
            'comentarios. La simulación está en el enlace de abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('vista','suelo'); a.set('lat',35); a.set('horas',40); a.set('clavijas',48); } }
  ],

  iniciar(a) { sembrar(a); },
  reiniciar(a) { sembrar(a); if (ce) ce.clearRect(0,0,anchoE,altoE); },

  cambio(id, v, a) {
    if (id === 'vista') {
      /* Cada vista pinta cosas distintas sobre el mismo lienzo de
         estela. Sin limpiar, quedan restos de la anterior encima. */
      if (ce) ce.clearRect(0, 0, anchoE, altoE);
      hayPrev = false;
      planoN = 0; planoI = 0; ultimoPlano = 1e9;
      if (typeof trazoDisco !== 'undefined') trazoDisco.length = 0;
      return;
    }
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

    if (a.p.vista === 'disco') {
      pintarDisco(g, e, u, uh, a.dt, 1.1);
      pintarRotulos(g, e, uh, a, hPorSeg);
      return;
    }
    if (a.p.vista === 'orbita') {
      pintarOrbita(g, e, u, uh, a.dt, lat, tSim);
      pintarRotulos(g, e, uh, a, hPorSeg);
      return;
    }

    /* ── Tres latitudes a la vez: polo, aquí y ecuador ── */
    if (a.p.vista === 'tres') {
      const vai = Math.sin(fase);
      const trio = [
        { lat: 85, nombre: 'cerca del polo' },
        { lat: a.p.lat, nombre: 'tu latitud' },
        { lat: 0,  nombre: 'en el ecuador' }
      ];
      const apaisado = W > H;
      const ancho = apaisado ? W / 3 : W;
      const alto  = apaisado ? H : H / 3;
      trio.forEach((t, i) => {
        const ox = apaisado ? i * ancho : 0;
        const oy = apaisado ? 0 : i * alto;
        const R2 = Math.min(ancho, alto) * .34;
        const cx2 = ox + ancho / 2, cy2 = oy + alto / 2;
        const an2 = anguloPlano(t.lat, tSim) * Math.PI / 180;
        dibujaSala(g, e, cx2, cy2, R2, an2, vai, u, t.lat);
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = `${17 * uh}px 'JetBrains Mono',monospace`;
        g.fillStyle = 'rgba(119,148,173,.95)';
        g.fillText(t.nombre, e.x + cx2, e.y + cy2 - R2 - 26 * uh);
        g.fillStyle = 'rgba(233,169,60,.95)';
        const hh = Math.abs(Math.sin(t.lat * Math.PI/180)) > .008
                 ? num(23.934 / Math.abs(Math.sin(t.lat * Math.PI/180)), 1) + ' h'
                 : 'nunca';
        g.fillText(hh, e.x + cx2, e.y + cy2 + R2 + 30 * uh);
      });
      pintarRotulos(g, e, uh, a, hPorSeg);
      return;
    }

    /* ── Encaje ── */
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * .40;
    /* Dos formas de contar lo mismo. En «gira el suelo» el plano se queda
       fijo y lo que da vueltas es la sala, que es lo que ocurre de verdad. */
    const giroSala = a.p.vista === 'cielo' ? -ang : 0;
    const rad = (a.p.vista === 'cielo' ? 0 : ang) * Math.PI / 180;
    const ux = Math.cos(rad), uy = Math.sin(rad);
    const gs = giroSala * Math.PI / 180;

    /* Guardamos el plano cada poco para trazar el abanico */
    if (a.dt > 0 && Math.abs(ang - ultimoPlano) > .45) {
      planos[planoI] = ang;
      planoI = (planoI + 1) % MEMP;
      if (planoN < MEMP) planoN++;
      ultimoPlano = ang;
    }

    /* Declarado antes de repartir el dibujo: lo usan varios bloques */
    const amp = R * .90;
    const vaiv = Math.sin(fase);

    /* En «gira el suelo» todo lo que pertenece al suelo rota */
    if (gs) { g.save(); g.translate(e.x + cx, e.y + cy); g.rotate(gs); g.translate(-(e.x + cx), -(e.y + cy)); }

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

    if (gs) g.restore();

    /* El abanico enseña por dónde pasó el plano. En «gira el suelo» el
       plano no se mueve, así que no hay abanico que enseñar. Y ni él ni
       la estela pertenecen al suelo: van fuera de la rotación. */
    if (!gs) {
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

    }

    /* ── Rastro del vaivén: la roseta ── */
    const bx = cx + ux * amp * vaiv, by = cy + uy * amp * vaiv;

    ce.globalCompositeOperation = 'destination-out';
    ce.fillStyle = `rgba(0,0,0,${(0.34 / a.p.estela).toFixed(4)})`;
    ce.fillRect(0, 0, W, H);
    ce.globalCompositeOperation = 'lighter';
    if (hayPrev) {
      const t = Math.min(1, Math.abs(vaiv));
      const c = tono(.2 + t * .8);
      ce.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},.72)`;
      ce.lineWidth = Math.max(1.2, 2.4 * u);
      ce.lineCap = 'round';
      ce.beginPath(); ce.moveTo(pvx, pvy); ce.lineTo(bx, by); ce.stroke();
    }
    ce.globalCompositeOperation = 'source-over';
    pvx = bx; pvy = by; hayPrev = true;
    g.drawImage(lienzoEstela, e.x, e.y);


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
