/* ══════════════════════════════════════════════════════════
   El aro de tu reloj sabe multiplicar

   Dos escalas logarítmicas enfrentadas. Girar una contra otra
   suma distancias, y sumar logaritmos es multiplicar. El aro no
   resuelve una cuenta: fija una razón, y con ella quedan resueltas
   todas las de esa proporción a la vez.

   Los resultados no están escritos a mano: se leen de la posición
   real del anillo, así que si el aro miente, el número miente.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";
const num = LabShell.num;

const posLog = v => ((Math.log10(v) % 1) + 1) % 1;    /* 0…1 de vuelta */

/* Los seis problemas son el mismo problema: una razón */
const CASOS = {
  libre:   { k: 2,     a: 3,   pre:'Gira el aro y lee',        ua:'',      ub:'' },
  mult:    { k: 4,     a: 12,  pre:'12 × 4',                   ua:'',      ub:'' },
  millas:  { k: 0.621, a: 100, pre:'100 km en millas',         ua:' km',   ub:' mi' },
  tiempo:  { k: 2,     a: 90,  pre:'A 120 km/h, 90 minutos',   ua:' min',  ub:' km' },
  consumo: { k: 1/12,  a: 30,  pre:'Gasta 12 l/h, quedan 30 l',ua:' l',    ub:' h' },
  cambio:  { k: 1.08,  a: 240, pre:'240 € a 1,08 el dólar',    ua:' €',    ub:' $' },
  porcien: { k: 0.15,  a: 80,  pre:'El 15 % de 80',            ua:'',      ub:'' }
};

/* Marcas de una escala logarítmica, como en un bisel de verdad */
function marcas(densidad) {
  const m = [];
  const paso1 = densidad > 1 ? .1 : .5;
  for (let v = 1; v < 10; v += (v < 2 ? .1 : v < 5 ? .2 : .5)) {
    const grande = Math.abs(v - Math.round(v)) < 1e-9;
    if (!grande && densidad < 1) continue;
    m.push({ v, grande });
  }
  if (densidad > 1.5) {
    for (let v = 1; v < 2; v += .02) m.push({ v, grande:false, fina:true });
    for (let v = 2; v < 5; v += .05) m.push({ v, grande:false, fina:true });
    for (let v = 5; v < 10; v += .1)  m.push({ v, grande:false, fina:true });
  }
  return m;
}

let giro = 0, destino = 0, brilloAl = 0;

function ajustarGiro(k) {
  destino = posLog(k) * 6.283185307;
}

LabShell.registrar({

  meta: {
    id:'bisel',
    titulo:'El aro de tu reloj sabe multiplicar',
    subtitulo:'Una sola cosa, y por eso sirve para todo',
    categoria:'Cálculo',
    lecturaPrincipal:'lee',
    etiquetaPrincipal:'El aro dice',
    gancho:'Casi nadie sabe para qué sirve ese aro con números',
    etiquetas:['matematicas','relojes','aviacion','historia','stem']
  },

  portal: {
    texto:'Muchos relojes de aviador llevan un aro lleno de números que casi nadie usa. No es ' +
          'un adorno: es una calculadora. Tiene dos escalas logarítmicas enfrentadas, y al ' +
          'girar una contra otra las distancias se suman. Sumar logaritmos es multiplicar, ' +
          'así que ese aro multiplica, divide, convierte unidades y calcula cuánto te queda ' +
          'de gasolina. Todo con el mismo gesto.',
    pruebas: [
      { t:'Alinea el 1 con el 2',
        d:'Y todos los dobles del círculo quedan alineados a la vez.',
        al:a => { a.set('caso','mult'); a.set('densidad',100); } },
      { t:'Kilómetros a millas',
        d:'Un giro fijo y ya tienes la tabla entera.',
        al:a => { a.set('caso','millas'); a.set('densidad',100); } },
      { t:'Cuánta gasolina queda',
        d:'Lo que hacía un piloto antes de las calculadoras.',
        al:a => { a.set('caso','consumo'); a.set('densidad',160); } }
    ]
  },

  params: [
    { id:'caso', tipo:'opciones', label:'Qué calculamos', valor:'mult',
      opciones:[{v:'libre',t:'Libre'},{v:'mult',t:'Multiplicar'},{v:'millas',t:'Millas'},
                {v:'tiempo',t:'Distancia'},{v:'consumo',t:'Gasolina'},
                {v:'cambio',t:'Moneda'},{v:'porcien',t:'Porcentaje'}] },
    { id:'razon', tipo:'rango', label:'Giro del aro', min:100, max:999, paso:1, valor:400,
      fmt:v => '× ' + num(v / 100, 2) },
    { id:'dato', tipo:'rango', label:'Valor de entrada', min:100, max:999, paso:1, valor:120,
      fmt:v => num(v / 10, 1) },
    { id:'densidad', tipo:'rango', label:'Marcas del aro', min:40, max:200, paso:10, valor:100,
      fmt:v => v < 80 ? 'pocas' : v < 140 ? 'como un reloj' : 'todas' },

    { id:'pares',  tipo:'interruptor', label:'Todas las parejas', valor:true, grupo:'vista' },
    { id:'aguja',  tipo:'interruptor', label:'Señalar la lectura', valor:true, grupo:'vista' },
    { id:'caja',   tipo:'interruptor', label:'El reloj', valor:true, grupo:'vista' }
  ],

  lecturas: [
    { id:'lee',   label:'El aro dice', acento:true },
    { id:'op',    label:'La cuenta', video:true },
    { id:'raz',   label:'Razón fijada', video:true },
    { id:'grados',label:'Giro' }
  ],

  ayuda: [
    ['Qué calculamos', 'Seis problemas distintos que el aro resuelve con el mismo gesto: girar hasta fijar una razón.'],
    ['Giro del aro', 'La proporción entre las dos escalas. Es lo único que se ajusta.'],
    ['Todas las parejas', 'Marca todas las lecturas válidas a la vez. Ese es el truco: no resuelves una cuenta, resuelves todas.'],
    ['Marcas del aro', 'Un bisel real lleva muchísimas. Aquí puedes quitarlas para ver el mecanismo y volver a ponerlas.'],
    ['El aro dice', 'Se lee de la posición real del anillo. Si el aro estuviera mal puesto, el número saldría mal.']
  ],

  guion: [
    { clave:'Ese aro', titulo:'El aro de tu reloj sabe multiplicar',
      texto:'Muchos relojes llevan un anillo lleno de números diminutos. Casi nadie lo usa ' +
            'ni sabe para qué sirve.',
      dato:() => 'no es un adorno',
      al:a => { a.set('caso','libre'); a.set('densidad',160); a.set('pares',false);
                a.set('caja',true); } },

    { clave:'No es decoración',
      texto:'Es una calculadora. Dos escalas enfrentadas donde los números no van a distancias ' +
            'iguales, sino según su logaritmo.',
      dato:() => 'dos escalas logarítmicas',
      al:a => { a.set('densidad',100); a.set('caja',false); } },

    { clave:'El truco',
      texto:'Y ahí está el truco: en una escala así, sumar distancias es multiplicar números. ' +
            'Girar el aro suma distancias.',
      dato:() => 'girar = multiplicar',
      al:a => { a.set('caso','mult'); a.set('pares',false); } },

    { clave:'Mira',
      texto:'Alineo el uno con el dos. Y en ese momento no he resuelto una cuenta: todos los ' +
            'dobles del círculo se han alineado a la vez.',
      dato:() => 'todas las parejas, de golpe',
      al:a => { a.set('caso','mult'); a.set('pares',true); } },

    { clave:'Kilómetros a millas',
      texto:'Cambio el giro y ya no multiplico: convierto. Cien kilómetros son sesenta y dos ' +
            'millas, y la tabla entera queda hecha.',
      dato:() => '100 km = 62,1 millas',
      al:a => a.set('caso','millas') },

    { clave:'Cuánto falta',
      texto:'Otro giro. A ciento veinte por hora, noventa minutos son ciento ochenta ' +
            'kilómetros. Y cualquier otro tiempo, también.',
      dato:() => '90 min = 180 km',
      al:a => a.set('caso','tiempo') },

    { clave:'La gasolina',
      texto:'Uno más. Si gasta doce litros por hora y quedan treinta, te queda dos horas y ' +
            'media de vuelo. Esto es lo que salvaba pilotos.',
      dato:() => '30 litros = 2,5 horas',
      al:a => { a.set('caso','consumo'); a.set('densidad',160); } },

    { clave:'Siempre lo mismo',
      texto:'Multiplicar, convertir, repartir, sacar un porcentaje. El aro solo hace ' +
            'proporciones, y casi todo es una proporción.',
      dato:() => 'una sola operación',
      al:a => { a.set('caso','porcien'); a.set('pares',true); } },

    { clave:'1952',
      texto:'Breitling lo puso en el Navitimer en 1952. Uno estuvo en órbita diez años ' +
            'después, en la muñeca de Scott Carpenter.',
      dato:() => 'Navitimer · 1952',
      al:a => { a.set('caso','libre'); a.set('densidad',200); a.set('caja',true); } },

    { clave:'Ahora te toca',
      texto:'Hoy llevas en la muñeca algo que calcula millones de veces más rápido. ¿Para qué ' +
            'lo has usado hoy? Cuéntamelo en los comentarios.',
      dato:() => 'laboratorio animado',
      al:a => { a.set('caso','mult'); a.set('densidad',120); a.set('pares',true); } }
  ],

  iniciar(a) {
    const c = CASOS[a.p.caso] || CASOS.libre;
    ajustarGiro(c.k);
    giro = destino;
  },
  reiniciar(a) {
    const c = CASOS[a.p.caso] || CASOS.libre;
    ajustarGiro(c.k);
    giro = destino;
  },

  cambio(id, v, a) {
    if (id === 'caso') {
      const c = CASOS[v] || CASOS.libre;
      ajustarGiro(c.k);
      a.set('razon', Math.round(((Math.log10(c.k) % 1 + 1) % 1 === 0 ? 1 : Math.pow(10, (Math.log10(c.k) % 1 + 1) % 1)) * 100));
      a.set('dato', Math.round(Math.pow(10, posLog(c.a)) * 10));
      brilloAl = 1;
    }
    if (id === 'razon') ajustarGiro(v / 100);
  },

  dibujar(g, a) {
    const e = a.escena, u = a.u, uh = a.uh;
    if (e.w < 40 || e.h < 40) return;

    const caso = CASOS[a.p.caso] || CASOS.libre;

    /* El giro se acerca a su destino: el movimiento es la explicación */
    if (a.p.caso === 'libre') ajustarGiro(a.p.razon / 100);
    let d = destino - giro;
    while (d >  Math.PI) d -= 6.283185307;
    while (d < -Math.PI) d += 6.283185307;
    giro += d * (1 - Math.exp(-a.dtr * 3.4));
    brilloAl = Math.max(0, brilloAl - a.dtr * .7);

    /* La razón real que marca el anillo, no la pedida */
    const k = Math.pow(10, ((giro / 6.283185307) % 1 + 1) % 1);
    const entrada = a.p.caso === 'libre' ? a.p.dato / 10 : caso.a;
    const salida = entrada * (a.p.caso === 'libre' ? k : caso.k);

    const fmt = v => v >= 100 ? num(v, 0) : v >= 10 ? num(v, 1) : num(v, 2);
    a.leer('lee',    fmt(salida) + caso.ub);
    a.leer('op',     caso.pre);
    a.leer('raz',    '× ' + num(k, 3));
    a.leer('grados', num(giro * 180 / Math.PI, 0) + '°');

    /* ── Encaje ── */
    const R = Math.min(e.w, e.h) * .42;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const rExt = R, rInt = R * .78, rDial = R * .62;

    /* ── La caja del reloj ── */
    if (a.p.caja) {
      g.strokeStyle = 'rgba(90,150,200,.30)';
      g.lineWidth = Math.max(2, 7 * u);
      g.beginPath(); g.arc(cx, cy, R + 12 * u, 0, 6.283185307); g.stroke();
      g.strokeStyle = 'rgba(42,88,120,.5)';
      g.lineWidth = Math.max(1, 2 * u);
      g.beginPath(); g.arc(cx, cy, R + 19 * u, 0, 6.283185307); g.stroke();
    }

    g.fillStyle = 'rgba(10,24,38,.55)';
    g.beginPath(); g.arc(cx, cy, rExt, 0, 6.283185307); g.fill();

    const dens = a.p.densidad / 100;
    const M = marcas(dens);

    /* ── Escala interior: fija, es el dial ── */
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const m of M) {
      const t = posLog(m.v) * 6.283185307 - Math.PI / 2;
      const largo = m.grande ? 13 * u : m.fina ? 4 * u : 8 * u;
      g.strokeStyle = m.grande ? 'rgba(169,194,214,.85)' : 'rgba(119,148,173,.4)';
      g.lineWidth = Math.max(.6, (m.grande ? 1.8 : 1) * u);
      g.beginPath();
      g.moveTo(cx + Math.cos(t) * rDial, cy + Math.sin(t) * rDial);
      g.lineTo(cx + Math.cos(t) * (rDial + largo), cy + Math.sin(t) * (rDial + largo));
      g.stroke();
      if (m.grande) {
        g.fillStyle = 'rgba(169,194,214,.9)';
        g.font = `${15 * uh}px 'JetBrains Mono',monospace`;
        const rr = rDial - 12 * u;
        g.fillText(String(m.v), cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
      }
    }

    /* ── Escala exterior: la que gira ── */
    for (const m of M) {
      const t = posLog(m.v) * 6.283185307 + giro - Math.PI / 2;
      const largo = m.grande ? 14 * u : m.fina ? 4 * u : 8 * u;
      g.strokeStyle = m.grande ? 'rgba(233,169,60,.9)' : 'rgba(233,169,60,.35)';
      g.lineWidth = Math.max(.6, (m.grande ? 1.8 : 1) * u);
      g.beginPath();
      g.moveTo(cx + Math.cos(t) * rInt, cy + Math.sin(t) * rInt);
      g.lineTo(cx + Math.cos(t) * (rInt + largo), cy + Math.sin(t) * (rInt + largo));
      g.stroke();
      if (m.grande) {
        g.fillStyle = 'rgba(233,169,60,.95)';
        g.font = `${16 * uh}px 'JetBrains Mono',monospace`;
        const rr = rInt + largo + 12 * u;
        g.fillText(String(m.v), cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
      }
    }

    /* ── Todas las parejas alineadas a la vez ── */
    if (a.p.pares) {
      g.strokeStyle = `rgba(255,246,226,${(.16 + brilloAl * .35).toFixed(3)})`;
      g.lineWidth = Math.max(.7, 1.2 * u);
      for (let v = 1; v < 10; v += .5) {
        const t = posLog(v) * 6.283185307 + giro - Math.PI / 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(t) * rDial, cy + Math.sin(t) * rDial);
        g.lineTo(cx + Math.cos(t) * (rInt + 14 * u), cy + Math.sin(t) * (rInt + 14 * u));
        g.stroke();
      }
    }

    /* ── La lectura de este ejemplo ── */
    if (a.p.aguja) {
      const t = posLog(entrada) * 6.283185307 + giro - Math.PI / 2;
      g.strokeStyle = '#FFF6E2';
      g.lineWidth = Math.max(1.6, 3 * u);
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx + Math.cos(t) * (rDial - 4 * u), cy + Math.sin(t) * (rDial - 4 * u));
      g.lineTo(cx + Math.cos(t) * (rInt + 20 * u), cy + Math.sin(t) * (rInt + 20 * u));
      g.stroke();
      g.fillStyle = '#FFF6E2';
      g.beginPath();
      g.arc(cx + Math.cos(t) * (rInt + 20 * u), cy + Math.sin(t) * (rInt + 20 * u),
            4.5 * u, 0, 6.283185307);
      g.fill();
    }

    /* ── Lo que se está resolviendo, en el centro ── */
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${17 * uh}px 'Public Sans',system-ui,sans-serif`;
    g.fillStyle = 'rgba(169,194,214,.85)';
    g.fillText(caso.pre, cx, cy - 16 * uh);
    g.font = `${34 * uh}px 'Instrument Serif',Georgia,serif`;
    g.fillStyle = '#FFD98A';
    g.fillText(fmt(salida) + caso.ub, cx, cy + 18 * uh);

    /* ── Rótulos ── */
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    g.fillStyle = 'rgba(233,169,60,.95)';
    g.fillText(`× ${num(k, 3)}`, e.x + 4 * uh, e.y + 20 * uh);
    g.fillStyle = 'rgba(119,148,173,.95)';
    g.fillText(`aro girado ${num(giro * 180 / Math.PI, 0)}°`, e.x + 4 * uh, e.y + 44 * uh);
  }
});
})();
