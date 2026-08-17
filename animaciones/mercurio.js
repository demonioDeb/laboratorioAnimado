/* ══════════════════════════════════════════════════════════
   Mercurio delató a Newton

   La órbita se integra con una corrección al cuadrado inverso,
   que es lo que produce el avance del perihelio. El avance no
   se calcula con una fórmula: se MIDE en la propia simulación,
   detectando cada paso por el perihelio.

   El avance real de Mercurio son 43 segundos de arco por siglo:
   invisible. Por eso hay un control de exageración, y el número
   de cuánto estamos exagerando está siempre en pantalla.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

/* Avance real de Mercurio, en grados por vuelta */
const REAL_GRADOS = 2.875e-5;

const MU = 1;
let e0 = .2056, B = 0;
let x = 0, y = 0, vx = 0, vy = 0;
let rAnt = 0, rAnt2 = 0, angPer = null, avanceMedido = 0, vueltas = 0, reloj = 0;
let aOrb = 1, elipse = null;

let lienzoEstela = null, ce = null, anchoE = 0, altoE = 0;
let pvx = 0, pvy = 0, hayPrev = false;

function prepararEstela(w, h) {
  if (lienzoEstela && anchoE === w && altoE === h) return;
  anchoE = w; altoE = h;
  lienzoEstela = document.createElement('canvas');
  lienzoEstela.width = w; lienzoEstela.height = h;
  ce = lienzoEstela.getContext('2d');
}

/* B se elige para que el avance salga el que pide el deslizador.
   La relación es aproximada, por eso luego se mide de verdad. */
function fijarB(gradosPorVuelta, e) {
  const p = 1 - e * e;
  B = gradosPorVuelta * Math.PI / 180 * MU * p * p / (2 * Math.PI);
}

function sembrar(a) {
  e0 = a.p.excen / 100;
  fijarB(a.p.avance / 100, e0);
  aOrb = 1;
  const p = 1 - e0 * e0, L = Math.sqrt(MU * p);
  x = 1 - e0; y = 0;
  vx = 0; vy = L / x;
  rAnt = rAnt2 = x;
  angPer = null; avanceMedido = 0; vueltas = 0; reloj = 0;
  hayPrev = false;

  /* La elipse de Newton: la que habría si nada la hiciera girar */
  elipse = [];
  for (let k = 0; k <= 240; k++) {
    const th = 6.283185307 * k / 240;
    const r = p / (1 + e0 * Math.cos(th));
    elipse.push([r * Math.cos(th), r * Math.sin(th)]);
  }
}

function paso(h) {
  const r2 = x * x + y * y, r = Math.sqrt(r2);
  const f = -(MU / (r2 * r) + B / (r2 * r2 * r));
  const ax = f * x, ay = f * y;
  const nx = x + vx * h + .5 * ax * h * h;
  const ny = y + vy * h + .5 * ay * h * h;
  const nr2 = nx * nx + ny * ny, nr = Math.sqrt(nr2);
  const nf = -(MU / (nr2 * nr) + B / (nr2 * nr2 * nr));
  vx += .5 * (ax + nf * nx) * h;
  vy += .5 * (ay + nf * ny) * h;
  x = nx; y = ny;

  /* Perihelio: mínimo local de la distancia al Sol */
  if (rAnt < rAnt2 && rAnt < nr) {
    const ang = Math.atan2(y, x);
    if (angPer !== null) {
      let d = ang - angPer;
      while (d >  Math.PI) d -= 6.283185307;
      while (d < -Math.PI) d += 6.283185307;
      avanceMedido += (d * 180 / Math.PI - avanceMedido) * .25;
      vueltas++;
    }
    angPer = ang;
  }
  rAnt2 = rAnt; rAnt = nr;
}

/* Anillos a la misma distancia propia: en un espacio curvo se
   apelotonan cerca de la masa. Eso es la curvatura, dibujada. */
let anillos = [], rsCache = -1;
function calcularAnillos(rs) {
  if (rs === rsCache) return;
  rsCache = rs;
  anillos = [];
  const paso = .0015;
  let s = 0, prox = .11;
  for (let r = rs * 1.02 + .02; r < 1.9; r += paso) {
    s += paso / Math.sqrt(Math.max(1e-4, 1 - rs / r));
    if (s >= prox) { anillos.push(r); prox += .11; }
  }
}

LabShell.registrar({

  meta: {
    id:'mercurio',
    titulo:'Mercurio delató a Newton',
    subtitulo:'Cuarenta y tres segundos de arco por siglo',
    categoria:'Física',
    lecturaPrincipal:'avance',
    etiquetaPrincipal:'Avance por vuelta',
    gancho:'El mismo hombre que descubrió Neptuno inventó un planeta que no existía',
    etiquetas:['fisica','relatividad','einstein','astronomia','stem']
  },

  portal: {
    texto:'La órbita de Mercurio no se cierra: cada vuelta acaba girada un poquito respecto ' +
          'a la anterior. Muy poquito, cuarenta y tres segundos de arco por siglo, tan poco ' +
          'que costó cincuenta y seis años entender por qué. Aquí puedes exagerarlo hasta ' +
          'verlo, y el número de cuánto estás exagerando sale siempre en pantalla.',
    pruebas: [
      { t:'Sin avance: la órbita de Newton',
        d:'La elipse se cierra sobre sí misma, para siempre.',
        al:a => { a.set('avance',0); a.set('excen',21); a.set('estela',24); } },
      { t:'Exagerado hasta verlo',
        d:'La misma órbita, girando. Aparece una roseta.',
        al:a => { a.set('avance',500); a.set('excen',21); a.set('estela',26); } },
      { t:'Una órbita muy alargada',
        d:'Cuanto más excéntrica, más se nota el giro.',
        al:a => { a.set('avance',700); a.set('excen',50); } }
    ]
  },

  params: [
    { id:'avance', tipo:'rango', label:'Avance por vuelta', min:0, max:1500, paso:5, valor:500,
      fmt:v => num(v/100, 2) + '°' },
    { id:'excen', tipo:'rango', label:'Excentricidad', min:0, max:60, paso:1, valor:21,
      fmt:v => num(v/100, 2) },
    { id:'curva', tipo:'rango', label:'Curvatura de la malla', min:0, max:90, paso:1, valor:42,
      fmt:v => num(v/100, 2) },
    { id:'veloc', tipo:'rango', label:'Velocidad', min:2, max:30, paso:1, valor:12,
      fmt:v => num(v/10, 1) + '×' },
    { id:'estela', tipo:'rango', label:'Estela', min:1, max:30, paso:1, valor:24 },

    { id:'malla',  tipo:'interruptor', label:'Malla',            valor:true,  grupo:'vista' },
    { id:'newton', tipo:'interruptor', label:'Órbita de Newton', valor:true,  grupo:'vista' },
    { id:'rastro', tipo:'interruptor', label:'Estela',           valor:true,  grupo:'vista' }
  ],

  lecturas: [
    { id:'avance', label:'Avance por vuelta', acento:true },
    { id:'exag',   label:'Exageración', video:true },
    { id:'real',   label:'Lo real',     video:true },
    { id:'v',      label:'Vueltas' }
  ],

  ayuda: [
    ['Avance por vuelta', 'Cuánto gira la órbita en cada pasada. El valor real de Mercurio es tan pequeño que haría falta esperar tres millones de años para ver una vuelta completa.'],
    ['Exageración', 'Cuántas veces estás ampliando el efecto real. Se calcula sobre los 43 segundos de arco por siglo medidos en el cielo.'],
    ['Excentricidad', 'Cuánto se aparta la órbita de un círculo. La de Mercurio es 0,21, la más alargada de los planetas.'],
    ['Curvatura de la malla', 'Los anillos están a la misma distancia real unos de otros. Se apelotonan cerca del Sol porque ahí el espacio está estirado.'],
    ['Órbita de Newton', 'Dónde estaría el planeta si la gravedad fuera una fuerza y no una curvatura.']
  ],

  guion: [
    { clave:'1846', titulo:'Mercurio delató a Newton',
      texto:'Urbain Le Verrier predijo un planeta entero con papel y lápiz. Esa noche lo ' +
            'encontraron donde había dicho. Lo llamaron Neptuno: el mayor triunfo de Newton.',
      dato:() => 'Le Verrier · 1846',
      al:a => { a.set('avance',0); a.set('excen',21); a.set('estela',26); a.set('newton',true); } },

    { clave:'1859',
      texto:'Trece años después hizo la misma cuenta con Mercurio y no le salió. La órbita ' +
            'giraba más de lo que Newton permitía: cuarenta y tres segundos de arco por siglo.',
      dato:() => '43 segundos de arco por siglo',
      al:a => { a.set('avance',300); a.set('estela',28); } },

    { clave:'Es poquísimo',
      texto:'A ese ritmo la órbita tardaría tres millones de años en dar una vuelta entera. ' +
            'Lo que ves aquí está exagerado más de cien mil veces; si no, no se vería nada.',
      dato:() => `exageración ×${Math.round(Math.abs(avanceMedido) / REAL_GRADOS).toLocaleString('es')}`,
      al:a => a.set('avance',600) },

    { clave:'El planeta que no existía',
      texto:'Le Verrier repitió lo que le funcionó con Neptuno: dedujo que faltaba un planeta ' +
            'escondido junto al Sol. Lo llamó Vulcano.',
      dato:() => 'Vulcano',
      al:a => { a.set('avance',700); a.set('excen',34); } },

    { clave:'Cincuenta años buscándolo',
      texto:'Decenas de astrónomos juraron haber visto Vulcano. Se publicaron órbitas y ' +
            'tamaños. No existía. Ni una sola vez.',
      dato:() => `${vueltas} vueltas · sigue girando`,
      al:a => a.set('avance',900) },

    { clave:'Einstein · noviembre de 1915',
      texto:'Albert Einstein llevaba ocho años detrás de otra idea muy distinta: que la ' +
            'gravedad no es una fuerza, sino la forma que toma el espacio junto a una masa.',
      dato:() => 'ocho años de trabajo',
      al:a => { a.set('avance',500); a.set('curva',70); a.set('malla',true); } },

    { clave:'Cuarenta y tres',
      texto:'Einstein hizo la cuenta para Mercurio y le salieron cuarenta y tres. Exactos. ' +
            'Escribió que se le aceleró el corazón y estuvo días sin poder trabajar.',
      dato:() => 'sin inventar ningún planeta',
      al:a => { a.set('avance',400); a.set('excen',21); } },

    { clave:'Ahora te toca',
      texto:'No faltaba un planeta. El Sol curva el espacio, y Mercurio es el que más lo ' +
            'nota. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('avance',350); a.set('curva',50); a.set('estela',24); } }
  ],

  iniciar(a) { sembrar(a); },
  reiniciar(a) { sembrar(a); if (ce) ce.clearRect(0,0,anchoE,altoE); },

  cambio(id, v, a) {
    if (id === 'avance' || id === 'excen') {
      sembrar(a);
      if (ce) ce.clearRect(0, 0, anchoE, altoE);
    }
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    const W = Math.max(1, Math.round(e.w)), H = Math.max(1, Math.round(e.h));
    prepararEstela(W, H);

    /* ── Física ── */
    if (a.dt > 0) {
      const total = Math.min(a.dt, .033) * (a.p.veloc / 10) * .9;
      const sub = Math.max(1, Math.min(400, Math.ceil(total / 4e-4)));
      const h = total / sub;
      for (let k = 0; k < sub; k++) paso(h);
      reloj += total;
    }

    /* La exageración sale del avance MEDIDO, no del pedido */
    const exag = Math.abs(avanceMedido) > 1e-6 ? Math.abs(avanceMedido) / REAL_GRADOS : 0;
    a.leer('avance', num(Math.abs(avanceMedido), 3) + '°');
    a.leer('exag',   exag ? '×' + Math.round(exag).toLocaleString('es') : 'sin exagerar');
    a.leer('real',   '43″ por siglo');
    a.leer('v',      String(vueltas));

    /* ── Encaje ── */
    const cx = W / 2, cy = H / 2;
    const esc = Math.min(W, H) * .44 / Math.max(1.25, 1 + e0 + .08);
    const PX = v => cx + v * esc, PY = v => cy + v * esc;

    /* ── La malla: anillos a igual distancia propia ── */
    if (a.p.malla) {
      calcularAnillos(a.p.curva / 100 * .55);
      g.strokeStyle = 'rgba(90,150,200,.16)';
      g.lineWidth = Math.max(.6, 1 * u);
      for (const r of anillos) {
        g.beginPath();
        g.arc(e.x + cx, e.y + cy, r * esc, 0, 6.283185307);
        g.stroke();
      }
      g.strokeStyle = 'rgba(90,150,200,.10)';
      for (let k = 0; k < 24; k++) {
        const th = 6.283185307 * k / 24;
        g.beginPath();
        g.moveTo(e.x + PX(Math.cos(th) * .10), e.y + PY(Math.sin(th) * .10));
        g.lineTo(e.x + PX(Math.cos(th) * 1.85), e.y + PY(Math.sin(th) * 1.85));
        g.stroke();
      }
    }

    /* ── La elipse que predijo Newton ── */
    if (a.p.newton && elipse) {
      g.strokeStyle = 'rgba(169,194,214,.42)';
      g.lineWidth = Math.max(1, 1.5 * u);
      g.setLineDash([7 * u, 6 * u]);
      g.beginPath();
      elipse.forEach(([px, py], i) =>
        i ? g.lineTo(e.x + PX(px), e.y + PY(py)) : g.moveTo(e.x + PX(px), e.y + PY(py)));
      g.closePath(); g.stroke();
      g.setLineDash([]);
    }

    /* ── Estela: la roseta ── */
    const bx = PX(x), by = PY(y);
    if (a.p.rastro) {
      ce.globalCompositeOperation = 'destination-out';
      ce.fillStyle = `rgba(0,0,0,${(0.26 / a.p.estela).toFixed(4)})`;
      ce.fillRect(0, 0, W, H);
      ce.globalCompositeOperation = 'lighter';
      if (hayPrev) {
        const dx = bx - pvx, dy = by - pvy;
        if (dx*dx + dy*dy < 90000) {
          const rap = Math.min(1, Math.hypot(vx, vy) / 2.2);
          ce.strokeStyle = `rgba(${Math.round(95 + rap*160)},${Math.round(198 - rap*30)},${Math.round(218 - rap*160)},.75)`;
          ce.lineWidth = Math.max(1.2, 2.2 * u);
          ce.lineCap = 'round';
          ce.beginPath(); ce.moveTo(pvx, pvy); ce.lineTo(bx, by); ce.stroke();
        }
      }
      ce.globalCompositeOperation = 'source-over';
      pvx = bx; pvy = by; hayPrev = true;
      g.drawImage(lienzoEstela, e.x, e.y);
    } else { pvx = bx; pvy = by; hayPrev = true; }

    /* ── El Sol ── */
    const SX = e.x + cx, SY = e.y + cy;
    const rs = 30 * u;
    const gr = g.createRadialGradient(SX, SY, 0, SX, SY, rs);
    gr.addColorStop(0, 'rgba(233,169,60,.55)');
    gr.addColorStop(1, 'rgba(233,169,60,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(SX, SY, rs, 0, 6.283185307); g.fill();
    g.fillStyle = '#FFD98A';
    g.beginPath(); g.arc(SX, SY, 8 * u, 0, 6.283185307); g.fill();

    /* ── Mercurio ── */
    const MX = e.x + bx, MY = e.y + by;
    g.fillStyle = 'rgba(95,198,218,.30)';
    g.beginPath(); g.arc(MX, MY, 13 * u, 0, 6.283185307); g.fill();
    g.fillStyle = '#EAF2F8';
    g.beginPath(); g.arc(MX, MY, 5 * u, 0, 6.283185307); g.fill();

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(exag ? '×' + Math.round(exag).toLocaleString('es') + ' exagerado' : 'sin exagerar',
               e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`${vueltas} vueltas`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
