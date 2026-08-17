/* ══════════════════════════════════════════════════════════
   La tabla del 2 dibuja un corazón

   Puntos en un círculo, cada uno unido con su múltiplo. Solo
   hay líneas rectas: la curva que aparece es la envolvente,
   una epicicloide de m−1 picos. Con m = 2 sale la cardioide.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const RAMPA = [
  [0.00, '#2F86A8'],
  [0.24, '#5FC6DA'],
  [0.44, '#DDEDDF'],
  [0.62, '#E9A93C'],
  [0.80, '#FF8A5B'],
  [1.00, '#C86BC0']
];
const NB = 18;
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
const COLOR = franjas(1);

/* El multiplicador se acerca a su destino en vez de saltar:
   entre dos tablas hay infinitas formas y merecen verse. */
let mSuave = 2;

const NOMBRES = {
  1:'todo al centro', 2:'cardioide · el corazón', 3:'nefroide · el riñón',
  4:'tres lóbulos', 5:'cuatro lóbulos', 6:'cinco lóbulos', 7:'seis lóbulos'
};

LabShell.registrar({

  meta: {
    id:'tablas',
    titulo:'La tabla del 2 dibuja un corazón',
    subtitulo:'Solo líneas rectas. La curva aparece sola.',
    categoria:'Geometría',
    lecturaPrincipal:'mult',
    etiquetaPrincipal:'Multiplicador',
    gancho:'Une cada número con su doble y aparece un corazón',
    etiquetas:['matematicas','geometria','cardioide','curiosidades','stem']
  },

  portal: {
    texto:'Pon cuatrocientos puntos alrededor de un círculo y numéralos. Ahora une cada ' +
          'número con su doble: el 1 con el 2, el 2 con el 4, el 3 con el 6. Cuando te ' +
          'pases del final, sigues contando desde el principio. Eso es todo lo que hay, ' +
          'y aparece un corazón.',
    pruebas: [
      { t:'La tabla del 2: el corazón',
        d:'La cardioide, hecha solo de líneas rectas.',
        al:a => { a.set('mult',200); a.set('puntos',400); a.set('animar',false); } },
      { t:'La tabla del 3: un riñón',
        d:'La misma curva que ves en el fondo de una taza de café.',
        al:a => { a.set('mult',300); a.set('puntos',600); a.set('animar',false); } },
      { t:'Déjalo correr solo',
        d:'Entre una tabla y la siguiente hay infinitas formas.',
        al:a => { a.set('animar',true); a.set('puntos',700); } }
    ]
  },

  params: [
    { id:'mult', tipo:'rango', label:'Multiplicador', min:100, max:3000, paso:1, valor:200,
      fmt:v => num(v/100, 2) },
    { id:'puntos', tipo:'rango', label:'Puntos', min:60, max:2400, paso:20, valor:400 },
    { id:'brillo', tipo:'rango', label:'Intensidad', min:5, max:60, paso:1, valor:26,
      fmt:v => num(v/100, 2) },

    { id:'animar', tipo:'interruptor', label:'Recorrer solo', valor:false, grupo:'vista' },
    { id:'envolv', tipo:'interruptor', label:'La curva',      valor:false, grupo:'vista' },
    { id:'aro',    tipo:'interruptor', label:'Puntos del aro', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'mult',  label:'Multiplicador', acento:true },
    { id:'picos', label:'Picos',  video:true },
    { id:'fig',   label:'Figura', video:true },
    { id:'lineas',label:'Líneas' }
  ],

  ayuda: [
    ['Multiplicador', 'Con cuánto se une cada número. Con 2, cada número va con su doble.'],
    ['Puntos', 'Cuántas marcas hay alrededor del círculo. Más puntos, curva más nítida.'],
    ['Recorrer solo', 'Sube el multiplicador poco a poco y encadena todas las figuras.'],
    ['La curva', 'Dibuja encima la epicicloide teórica, que es la envolvente de las rectas.'],
    ['Picos', 'Siempre son el multiplicador menos uno. La tabla del 5 da cuatro picos.']
  ],

  guion: [
    { clave:'Una regla de una línea', titulo:'La tabla del 2 dibuja un corazón',
      texto:'Pon cuatrocientos puntos en un círculo y numéralos. Une cada número con su ' +
            'doble: el uno con el dos, el dos con el cuatro. Eso es todo lo que hay.',
      dato:() => 'ni una curva dibujada',
      al:a => { a.set('mult',200); a.set('puntos',400); a.set('animar',false); a.set('envolv',false); } },

    { clave:'Y aparece esto',
      texto:'Nadie ha trazado el corazón. Son cuatrocientas líneas rectas cruzándose, y aun ' +
            'así la curva está ahí, nítida.',
      dato:() => `${Math.round(mSuave * 100) / 100} · ${NOMBRES[2]}`,
      al:a => a.set('puntos',900) },

    { clave:'La tabla del 3',
      texto:'Cambia el doble por el triple y el corazón se parte en dos. Aparece un riñón: ' +
            'los matemáticos la llaman nefroide.',
      dato:() => 'dos picos',
      al:a => a.set('mult',300) },

    { clave:'Tu taza de café',
      texto:'Esa curva brillante que ves en el fondo de una taza al sol es exactamente esta. ' +
            'La luz rebota en la pared curva y traza una nefroide.',
      dato:() => 'la misma figura',
      al:a => { a.set('mult',300); a.set('puntos',1400); } },

    { clave:'La regla',
      texto:'Cada tabla añade un pico. El cuatro da tres lóbulos, el cinco da cuatro. ' +
            'La tabla del ene dibuja ene menos uno.',
      dato:() => `tabla del ${Math.round(mSuave)} · ${Math.max(0, Math.round(mSuave) - 1)} picos`,
      al:a => a.set('mult',600) },

    { clave:'Entre medias',
      texto:'Y si te sales de las tablas, la figura no salta de una a otra: se retuerce. ' +
            'Entre el dos y el tres hay infinitas formas que no tienen nombre.',
      dato:() => `multiplicador ${num(mSuave, 2)}`,
      al:a => { a.set('animar',true); a.set('puntos',1000); } },

    { clave:'Ahora te toca',
      texto:'Mueve el multiplicador despacio y míralas pasar. El enlace está abajo.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('animar',false); a.set('mult',200); a.set('puntos',700); } }
  ],

  iniciar(a) { mSuave = a.p.mult / 100; },
  reiniciar(a) { mSuave = a.p.mult / 100; },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    /* ── El multiplicador ── */
    if (a.p.animar) {
      mSuave += a.dt * .28;
      if (mSuave > 30) mSuave = 1.6;
      a.set('mult', Math.round(mSuave * 100));
    } else {
      const dest = a.p.mult / 100;
      mSuave += (dest - mSuave) * (1 - Math.exp(-a.dtr * 5));
      if (Math.abs(dest - mSuave) < .002) mSuave = dest;
    }

    const m = mSuave, N = a.p.puntos;
    const picos = Math.max(0, Math.round(m) - 1);
    const entera = Math.abs(m - Math.round(m)) < .02;

    a.leer('mult',  num(m, 2));
    a.leer('picos', entera ? String(picos) : 'entre ' + picos + ' y ' + (picos + 1));
    a.leer('fig',   entera ? (NOMBRES[Math.round(m)] || picos + ' lóbulos') : 'sin nombre');
    a.leer('lineas', String(N));

    /* ── Encaje: el círculo nunca toca el borde ── */
    const R = Math.min(e.w, e.h) * .43;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;

    /* ── Las cuerdas, agrupadas por color ── */
    const alfa = a.p.brillo / 100;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = Math.max(.5, .9 * u);
    g.lineCap = 'round';

    const porFranja = Math.ceil(N / NB);
    for (let b = 0; b < NB; b++) {
      const desde = b * porFranja, hasta = Math.min(N, desde + porFranja);
      if (desde >= hasta) continue;
      g.beginPath();
      for (let k = desde; k < hasta; k++) {
        const a1 = 6.283185307 * k / N - 1.5707963;
        const a2 = 6.283185307 * k * m / N - 1.5707963;
        g.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        g.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
      }
      g.strokeStyle = COLOR[b].replace(/,1\)$/, ',' + alfa.toFixed(3) + ')');
      g.stroke();
    }
    g.restore();

    /* ── El aro ── */
    if (a.p.aro) {
      g.strokeStyle = 'rgba(42,88,120,.75)';
      g.lineWidth = Math.max(1, 1.3 * u);
      g.beginPath(); g.arc(cx, cy, R, 0, 6.283185307); g.stroke();

      const salto = N > 260 ? Math.ceil(N / 260) : 1;
      g.fillStyle = 'rgba(169,194,214,.65)';
      const r = Math.max(.7, 1.3 * u);
      for (let k = 0; k < N; k += salto) {
        const t = 6.283185307 * k / N - 1.5707963;
        g.beginPath(); g.arc(cx + Math.cos(t) * R, cy + Math.sin(t) * R, r, 0, 6.283185307); g.fill();
      }
    }

    /* ── La envolvente: (m·e^{iθ} + e^{imθ}) / (m+1) ── */
    if (a.p.envolv) {
      g.strokeStyle = 'rgba(234,242,248,.92)';
      g.lineWidth = 2.4 * u; g.lineJoin = 'round';
      g.beginPath();
      const P = 900;
      for (let k = 0; k <= P; k++) {
        const th = 6.283185307 * k / P;
        const a1 = th - 1.5707963, a2 = m * th - 1.5707963;
        const x = (m * Math.cos(a1) + Math.cos(a2)) / (m + 1);
        const y = (m * Math.sin(a1) + Math.sin(a2)) / (m + 1);
        k ? g.lineTo(cx + x * R, cy + y * R) : g.moveTo(cx + x * R, cy + y * R);
      }
      g.stroke();
    }

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`× ${num(m, 2)}`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillText(`${N} puntos`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
