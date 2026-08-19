/* ══════════════════════════════════════════════════════════
   LABORATORIO ANIMADO · shell común
   Toda la infraestructura compartida vive aquí. Una animación
   solo declara su escena, sus controles y su guion.
   ══════════════════════════════════════════════════════════ */
(function () {
"use strict";

const $ = s => document.querySelector(s);
const crear = (t, c, txt) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (txt != null) e.textContent = txt;
  return e;
};

/* Zonas seguras, en fracción del fotograma 9:16.
   Verifícalas de vez en cuando: las apps las cambian. */
const ZONAS = {
  fb   : { t:.115, b:.219, l:.06, r:.185, ar: 9/16, tag:'Facebook Reels' },
  yt   : { t:.094, b:.198, l:.06, r:.167, ar: 9/16, tag:'YouTube Shorts' },
  tt   : { t:.104, b:.260, l:.06, r:.231, ar: 9/16, tag:'TikTok' },
  todas: { t:.115, b:.260, l:.06, r:.231, ar: 9/16, tag:'Zona segura común' },
  /* Vídeo largo: apaisado, sin interfaz encima salvo la barra de tiempo */
  largo: { t:.055, b:.115, l:.045, r:.045, ar:16/9, tag:'YouTube horizontal' }
};
const LIBRE = { t:.05, b:.06, l:.05, r:.05, ar: 9/16 };
const PROPORCION = () => (S.formato ? ZONAS[S.formato].ar : 9/16);

const num = (v, d = 2) =>
  (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d).replace('.', ',');

/* ─────────────────── Estado ─────────────────── */
const S = {
  anim:null, p:{}, def:{},
  reproduciendo:true, t:0, tr:0,
  formato:null, estudio:false, limpio:false, subs:'resalta', tituloVoz:true, calidad:1080, progreso:'marco', guion:'corto',
  duracion:45,
  W:0, H:0, u:1
};

const T = { on:false, k:0, lista:[], frac:[], lim:[], transcurrido:0,
            auto:true, dwell:8, cronometrado:false, total:0, porVoz:false };

const R = { grabando:false, cuenta:0, rec:null, trozos:[], t0:0,
            mime:'', ext:'webm', resolver:null };

let lienzo, ctx, escenario, guias, marco, zonaDiv;
const salidas = {};   /* lecturas numéricas del panel */

/* ─────────────────── Registro ─────────────────── */
function registrar(anim) {
  S.anim = anim;
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
}

/* ─────────────────── Construcción ─────────────────── */
function arrancar() {
  const a = S.anim;
  document.title = a.meta.titulo + ' · Laboratorio Animado';
  S.estudio = new URLSearchParams(location.search).has('studio');
  document.body.classList.toggle('estudio', S.estudio);


  construirDOM();
  construirPanel();

  lienzo = $('#lienzo');
  ctx    = lienzo.getContext('2d');
  escenario = $('#escenario');
  guias  = $('#guias');
  marco  = $('#marco');
  zonaDiv= $('#zona');

  addEventListener('resize', ajustar);
  ajustar();

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) S.reproduciendo = false;

  a.iniciar && a.iniciar(API);
  requestAnimationFrame(bucle);

  montarPortal();
}

/* ─────────────────── Página de entrada ───────────────────
   Quien llega del vídeo entra con ?abrir y se la salta.
   Quien llega de la galería o de una búsqueda, la ve. */
function montarPortal() {
  const m = S.anim.meta, p = S.anim.portal;
  const par = new URLSearchParams(location.search);

  /* Quien llega de una plataforma de vídeo ya vio la explicación: entra
     directo. Se acepta además ?abrir y #abrir por si el enlace se comparte
     a mano o la plataforma borra el referente. */
  const DESDE = /\/\/([^/]*\.)?(youtube|youtu|tiktok|facebook|fb|instagram)\.[a-z.]+/i;
  const deVideo = DESDE.test(document.referrer || '');
  if (par.has('abrir') || location.hash === '#abrir' || deVideo || S.estudio) return;

  const cat = window.CATALOGO && window.CATALOGO.find(c => c.id === m.id);
  const yt = cat && cat.youtube;
  const ytLargo = cat && cat.youtubeLargo;
  const repo = 'https://github.com/demonioDeb/laboratorioAnimado';
  const cafe = window.LAB_CAFE || '';

  const pruebas = (p && p.pruebas) || [];
  const listaPruebas = pruebas.map((x, i) => `
    <button class="prueba" data-prueba="${i}">
      <b>${x.t}</b><span>${x.d || ''}</span>
    </button>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="portal" id="portal">
      <div class="portal-caja">
        <span class="portal-cat">${m.categoria}</span>
        <h1>${m.titulo}</h1>
        <p class="portal-sub">${m.subtitulo || ''}</p>
        ${p && p.texto ? `<p class="portal-txt">${p.texto}</p>` : ''}

        ${pruebas.length ? `<div class="portal-pruebas">
          <h2>Qué puedes probar</h2>${listaPruebas}</div>` : ''}

        <button class="btn solid wide portal-entrar" id="bEntrar">Abrir la simulación</button>

        <div class="portal-enlaces">
          ${yt ? `<a href="https://youtu.be/${yt}" target="_blank" rel="noopener">Ver el short</a>` : ''}
          ${ytLargo ? `<a href="https://youtu.be/${ytLargo}" target="_blank" rel="noopener">Ver el vídeo completo</a>` : ''}
          <button id="bPortalComp">Compartir</button>
          <a href="${repo}" target="_blank" rel="noopener">Ver el código</a>
          ${cafe ? `<a href="${cafe}" target="_blank" rel="noopener">Invítame a un café</a>` : ''}
        </div>
      </div>
    </div>`);

  const portal = $('#portal');
  const cerrar = () => { portal.classList.add('fuera'); setTimeout(() => portal.remove(), 320); };

  $('#bEntrar').onclick = cerrar;
  $('#bPortalComp').onclick = () => {
    navigator.clipboard?.writeText(location.href.split(/[?#]/)[0])
      .then(() => brindis('Enlace copiado')).catch(() => {});
  };
  portal.querySelectorAll('[data-prueba]').forEach(b => b.onclick = () => {
    const x = pruebas[+b.dataset.prueba];
    cerrar();
    if (x.al) x.al(API);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('portal')) cerrar();
  });

  /* La animación corre detrás, pero solo donde sobra músculo */
  if (innerWidth < 900 || matchMedia('(prefers-reduced-motion: reduce)').matches)
    document.body.classList.add('portal-quieto');
}

function construirDOM() {
  const m = S.anim.meta;
  /* Vale para las dos estructuras: plana y por carpetas */
  const galeria = /\/animaciones\//.test(location.pathname) ? '../index.html' : 'index.html';
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="top">
      <div class="brand">Laboratorio <em>animado</em></div>
      <div class="nav-pair">
        <a href="${galeria}" title="Volver a la galería">‹</a>
        <a href="${galeria}" title="Siguiente animación">›</a>
      </div>
      <span class="crumb">${m.categoria} · <b>${m.titulo}</b></span>
      <div class="spacer"></div>
      <button class="tbtn" id="bAyuda">Ayuda</button>
      <button class="tbtn" id="bCompartir">Compartir</button>
      <button class="tbtn" id="bPantalla">Pantalla completa</button>
      ${S.estudio ? '<button class="tbtn on" id="bEstudio">Estudio</button>' : ''}
    </header>

    <main class="stage" id="escenario">
      <canvas id="lienzo"></canvas>
      <div class="guias" id="guias">
        <div class="marco" id="marco"><div class="zona" id="zona" data-tag=""></div></div>
      </div>
    </main>

    <aside class="panel" id="panel"></aside>

    <div class="barra-rec">
      <span class="estado" id="recEstado">listo</span>
      <button class="btn sm" id="bDetener">Detener</button>
      <button class="btn sm" id="bSalirEnc">Salir del encuadre</button>
    </div>

    <div class="modal" id="modalAyuda"><div class="modal-box">
      <h4>${m.titulo}</h4>
      <p class="sub">Qué hace cada control de esta animación</p>
      <dl id="listaAyuda"></dl>
      <button class="btn wide" id="bCerrarAyuda" style="margin-top:22px">Entendido</button>
    </div></div>

    <div class="brindis" id="brindis"></div>
  `);

  const dl = $('#listaAyuda');
  (S.anim.ayuda || []).forEach(([t, d]) => {
    dl.appendChild(crear('dt', null, t));
    dl.appendChild(crear('dd', null, d));
  });
}

function construirPanel() {
  const a = S.anim, panel = $('#panel');
  let n = 0;

  /* Cada sección se pliega desde su título: con el panel lleno, poder
     cerrar lo que no estás usando vale más que esconderlo por modos. */
  const seccion = (titulo, clase) => {
    const s = crear('section', 'sec' + (clase ? ' ' + clase : ''));
    const h = crear('h3');
    h.setAttribute('role', 'button');
    h.setAttribute('tabindex', '0');
    h.setAttribute('aria-expanded', 'true');
    h.appendChild(crear('i', null, String(++n).padStart(2, '0')));
    h.appendChild(document.createTextNode(titulo));
    h.appendChild(crear('u', 'chevron', '⌄'));

    const cuerpo = crear('div', 'sec-cuerpo');
    const plegar = () => {
      const abierta = s.classList.toggle('plegada');
      h.setAttribute('aria-expanded', String(!abierta));
    };
    h.onclick = plegar;
    h.onkeydown = e => {
      if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); plegar(); }
    };

    s.append(h, cuerpo);
    panel.appendChild(s);
    /* Lo que se añada a la sección va dentro del cuerpo plegable */
    s.insertAdjacentHTML = (pos, html) => cuerpo.insertAdjacentHTML('beforeend', html);
    s.appendChild = el => cuerpo.appendChild(el);
    s.querySelector = sel => sel === 'h3' ? h : cuerpo.querySelector(sel);
    return s;
  };

  /* ── Controles propios de la animación ── */
  const grupos = {};
  (a.params || []).forEach(p => {
    S.def[p.id] = p.valor;
    S.p[p.id] = p.valor;
    (grupos[p.grupo || 'controles'] ||= []).push(p);
  });

  let secValores = null;
  if (grupos.controles) {
    const sc = seccion('Controles'); sc.classList.add('sec-param');
    montarParams(secValores = sc, grupos.controles);
  }
  if (grupos.vista) {
    const sv = seccion('Vista'); sv.classList.add('sec-param');
    montarParams(secValores = sv, grupos.vista);
  }
  refrescarParams();

  /* El reinicio de valores vive junto a los valores que reinicia */
  if (secValores) {
    secValores.insertAdjacentHTML('beforeend',
      `<button class="btn sm wide" id="bRestablecer" style="margin-top:14px"
         title="Devuelve todos los controles a su valor original">Restablecer valores</button>`);
  }

  /* ── Lecturas numéricas ── */
  if (a.lecturas && a.lecturas.length) {
    const s = seccion('Lecturas');
    const dl = crear('dl', 'lect');
    a.lecturas.forEach(l => {
      dl.appendChild(crear('dt', null, l.label));
      const dd = crear('dd', l.acento ? 'acento' : null, '—');
      salidas[l.id] = dd;
      dl.appendChild(dd);
    });
    s.appendChild(dl);
  }

  /* ── Visita guiada ── */
  const vis = seccion('Visita guiada');
  vis.insertAdjacentHTML('beforeend', `
    <button class="btn solid wide" id="bVisita">Iniciar visita guiada</button>
    <div id="visitaCtl" style="display:none">
      <div class="transporte">
        <button class="btn" id="bAnt" title="Parada anterior" aria-label="Parada anterior">‹</button>
        <button class="btn principal" id="bPlay">Pausar</button>
        <button class="btn" id="bSig" title="Parada siguiente" aria-label="Parada siguiente">›</button>
      </div>
      <div class="grid2" style="margin-bottom:7px">
        <button class="btn sm" id="bVolverInicio">Volver a la parada 1</button>
        <button class="btn sm" id="bPNG">Capturar imagen</button>
      </div>
      <button class="btn sm wide" id="bSalirVis">Salir del recorrido</button>
      <p class="note">Pausa donde quieras y captura la imagen. Al reanudar, el recorrido sigue.</p>
    </div>`);

  /* ── Estudio ── */
  const est = seccion('Estudio', 'studio');
  est.id = 'secEstudio';
  est.querySelector('h3').insertAdjacentHTML('beforeend',
    ' <span class="tag">solo tú</span>');
  est.insertAdjacentHTML('beforeend', `
    <div class="ctl">
      <label>Voz <b id="vozEstado">sin audio</b></label>
      <div class="suelta" id="zonaAudio" tabindex="0" role="button">
        Arrastra aquí el <b>.mp3</b><span>o pulsa para elegirlo</span>
      </div>
      <input type="file" id="fileAudio" accept="audio/*" hidden>
      <div class="grid2" style="margin-top:6px">
        <button class="btn sm" id="bMarcar" disabled>Marcar tiempos</button>
        <button class="btn sm" id="bEnsayar" disabled>Ensayar</button>
      </div>
      <p class="note" id="notaVoz">Genera la narración fuera y cárgala aquí.
      Sin voz el vídeo sale mudo y todo funciona igual.</p>
      <div id="listaMarcas"></div>
    </div>
    <div class="ctl">
      <label>Subtítulos</label>
      <div class="pills" style="margin-top:5px">
        <button class="pill" data-sub="fijo">Fijo</button>
        <button class="pill" data-sub="escribe">Se escribe</button>
        <button class="pill" data-sub="resalta">Resaltado</button>
      </div>
      <div class="pills" style="margin-top:6px">
        <button class="pill" id="bTitVoz">La voz lee el título</button>
      </div>
      <p class="note">Si tu audio empieza por el título, déjalo activado.
      Si la voz solo dice el texto, apágalo o el resaltado irá por detrás.</p>
    </div>
    <div class="ctl">
      <label>Zona segura</label>
      <div class="grid4" style="margin-top:6px">
        <button class="btn fmt" data-f="fb"    aria-pressed="false">FB<small>Reels</small></button>
        <button class="btn fmt" data-f="yt"    aria-pressed="false">YT<small>Shorts</small></button>
        <button class="btn fmt" data-f="tt"    aria-pressed="false">TT<small>TikTok</small></button>
        <button class="btn fmt" data-f="todas" aria-pressed="false">Todas<small>máx.</small></button>
      </div>
      <button class="btn sm wide" data-f="largo" style="margin-top:5px">Horizontal · vídeo largo</button>
      <button class="btn sm wide" data-f="" style="margin-top:5px">Sin guías</button>
    </div>
    ${(a.guionLargo && a.guionLargo.length) ? `
    <div class="ctl">
      <label>Guion</label>
      <div class="pills" style="margin-top:5px">
        <button class="pill" data-gui="corto">Corto · ${(a.guion||[]).length} paradas</button>
        <button class="pill" data-gui="largo">Largo · ${a.guionLargo.length} paradas</button>
      </div>
    </div>` : ''}
    <div class="ctl">
      <label>Barra de progreso</label>
      <div class="pills" style="margin-top:5px">
        <button class="pill" data-prog="marco">Marco</button>
        <button class="pill" data-prog="barra">Barra</button>
        <button class="pill" data-prog="ambos">Las dos</button>
        <button class="pill" data-prog="ninguno">Ninguna</button>
      </div>
    </div>
    <div class="ctl">
      <label>Resolución de grabación</label>
      <div class="pills" style="margin-top:5px">
        <button class="pill" data-cal="1080">1080 × 1920</button>
        <button class="pill" data-cal="1440">1440 × 2560</button>
        <button class="pill" data-cal="2160">2160 × 3840</button>
      </div>
      <p class="note">Subir con más resolución de la que hace falta mejora lo que
      se ve: las plataformas dan más tasa de bits a los vídeos grandes. Si a
      2160 la grabación va a tirones, baja a 1440.</p>
    </div>
    <div class="ctl">
      <label for="dur">Duración del clip <b id="durV">45 s</b></label>
      <input type="range" id="dur" min="10" max="180" value="45">
    </div>
    <button class="btn rec wide" id="bGrabar" style="margin-bottom:7px">● Grabar</button>
    <div class="grid2" style="margin-bottom:7px">
      <button class="btn sm" id="bGrabar3">Grabar las 3</button>
      <button class="btn sm" id="bPortada">Portada 16:9</button>
    </div>
    <button class="btn sm wide" id="bSRT">Subtítulos .srt</button>
    <button class="btn wide" id="bTextos" style="margin-top:7px">Textos para publicar</button>
    <p class="note" id="notaRec">Se graba limpio: sin panel y sin guías, con el texto quemado.
    Con voz cargada, la narración entra en la pista de audio y marca el ritmo del clip.</p>`);
  est.classList.toggle('oculta', !S.estudio);

  panel.insertAdjacentHTML('beforeend', `
    <div class="foot">
      <kbd>espacio</kbd> pausar · <kbd>G</kbd> visita · <kbd>H</kbd> panel<br>
      <kbd>F</kbd> pantalla completa · <kbd>?studio</kbd> en la url para grabar
    </div>`);

  conectar();
}

function montarParams(sec, lista) {
  lista.forEach(p => {
    const c = crear('div', 'ctl');

    if (p.tipo === 'rango') {
      const lab = crear('label');
      lab.htmlFor = 'p_' + p.id;
      lab.appendChild(document.createTextNode(p.label));
      const b = crear('b', null, '');
      lab.appendChild(b);
      const inp = crear('input');
      Object.assign(inp, { type:'range', id:'p_' + p.id,
        min:p.min, max:p.max, step:p.paso || 1, value:p.valor });
      inp.addEventListener('input', () => fijar(p.id, +inp.value));
      c.append(lab, inp);
      p._out = b; p._inp = inp;

    } else if (p.tipo === 'opciones') {
      c.appendChild(crear('label', null, p.label));
      const box = crear('div', 'pills');
      box.style.marginTop = '5px';
      p._btns = {};
      p.opciones.forEach(o => {
        const b = crear('button', 'pill', o.t);
        b.setAttribute('aria-pressed', String(o.v === p.valor));
        b.onclick = () => fijar(p.id, o.v);
        p._btns[o.v] = b;
        box.appendChild(b);
      });
      c.appendChild(box);

    } else if (p.tipo === 'interruptor') {
      const b = crear('button', 'pill', p.label);
      b.setAttribute('aria-pressed', String(!!p.valor));
      b.onclick = () => fijar(p.id, !S.p[p.id]);
      p._btn = b;
      let box = sec.querySelector('.pills.grupo');
      if (!box) { box = crear('div', 'pills grupo'); sec.appendChild(box); }
      box.appendChild(b);
      return;
    }
    sec.appendChild(c);
  });
}

function fijar(id, v) {
  S.p[id] = v;
  refrescarParams();
  S.anim.cambio && S.anim.cambio(id, v, API);
}

function refrescarParams() {
  (S.anim.params || []).forEach(p => {
    const v = S.p[p.id];
    if (p.tipo === 'rango') {
      if (p._inp && +p._inp.value !== v) p._inp.value = v;
      if (p._out) p._out.textContent = p.fmt ? p.fmt(v) : String(v);
    } else if (p.tipo === 'opciones' && p._btns) {
      for (const k in p._btns) p._btns[k].setAttribute('aria-pressed', String(k === String(v)));
    } else if (p.tipo === 'interruptor' && p._btn) {
      p._btn.setAttribute('aria-pressed', String(!!v));
    }
  });
}

/* ─────────────────── Lienzo y zonas ─────────────────── */
function ajustar() {
  const r = escenario.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);

  if (R.grabando || R.cuenta > 0) {
    const ar = PROPORCION();
    const anchoRec = ar > 1 ? Math.round(S.calidad * ar) : S.calidad;
    const altoRec  = ar > 1 ? S.calidad : Math.round(S.calidad / ar);
    S.W = anchoRec; S.H = altoRec;
    lienzo.width = anchoRec; lienzo.height = altoRec;
    let h = Math.min(r.height - 30, r.width / ar);
    lienzo.style.height = h + 'px';
    lienzo.style.width  = (h * ar) + 'px';
  } else if (S.formato) {
    const ar = PROPORCION();
    let ch = r.height, cw = ch * ar;
    if (cw > r.width) { cw = r.width; ch = cw / ar; }
    S.W = cw * dpr; S.H = ch * dpr;
    lienzo.width = S.W; lienzo.height = S.H;
    lienzo.style.width = cw + 'px'; lienzo.style.height = ch + 'px';
  } else {
    S.W = r.width * dpr; S.H = r.height * dpr;
    lienzo.width = S.W; lienzo.height = S.H;
    lienzo.style.width = r.width + 'px'; lienzo.style.height = r.height + 'px';
  }
  /* Con formato, la referencia es el lado corto: así el texto pesa lo
     mismo en vertical que en apaisado. Sin formato se deja como estaba. */
  S.u = S.formato || R.grabando || R.cuenta > 0
      ? Math.min(S.W, S.H) / 1080
      : S.W / 1080;
  S.dpr = (R.grabando || R.cuenta > 0) ? 1 : dpr;
  colocarGuias();
}

function colocarGuias() {
  const mostrar = S.formato && S.estudio && !R.grabando && R.cuenta === 0;
  guias.classList.toggle('on', !!mostrar);
  if (!mostrar) return;
  const lr = lienzo.getBoundingClientRect(), er = escenario.getBoundingClientRect();
  Object.assign(marco.style, {
    left: (lr.left - er.left) + 'px', top: (lr.top - er.top) + 'px',
    width: lr.width + 'px', height: lr.height + 'px',
    transform: 'none', aspectRatio: 'auto'
  });
  const z = ZONAS[S.formato];
  Object.assign(zonaDiv.style, {
    top: z.t * 100 + '%', bottom: z.b * 100 + '%',
    left: z.l * 100 + '%', right: z.r * 100 + '%'
  });
  zonaDiv.dataset.tag = z.tag;
}

const zonaActual = () => (S.formato ? ZONAS[S.formato] : LIBRE);

/* ─────────────────── Superposición quemada ─────────────────── */
function envolver(texto, ancho) {
  const pal = texto.split(' '), lin = [];
  let l = '';
  for (const w of pal) {
    const p = l ? l + ' ' + w : w;
    if (ctx.measureText(p).width > ancho && l) { lin.push(l); l = w; }
    else l = p;
  }
  if (l) lin.push(l);
  return lin;
}

/* Reparte el texto en líneas, pero devolviendo cada palabra con su
   posición: hace falta para poder pintarlas de distinto color.
   `peso` es cuánto tarda en pronunciarse, aproximado por su longitud:
   «rectángulo» no se dice en el mismo tiempo que «sí». */
function disponerTexto(texto, ancho) {
  const esp = ctx.measureText(' ').width;
  const lineas = [];
  let linea = [], x = 0;
  for (const t of texto.split(' ')) {
    const w = ctx.measureText(t).width;
    if (linea.length && x + esp + w > ancho) { lineas.push(linea); linea = []; x = 0; }
    const px = linea.length ? x + esp : 0;
    /* La voz se para en los signos, y eso no lo dice la longitud.
       Un punto vale por media palabra larga; una coma, por menos. */
    let pausa = 0;
    if (/[.!?:…]$/.test(t))      pausa = 7;
    else if (/[,;)]$/.test(t))   pausa = 3;
    linea.push({ t, x: px, w, peso: t.length + 1.2 + pausa });
    x = px + w;
  }
  if (linea.length) lineas.push(linea);
  return lineas;
}

/* Cuánto se ha consumido de la parada actual, de 0 a 1.
   Aquí es donde se enganchará la voz cuando exista. */
function progresoParada() {
  /* Con voz cargada, el ritmo lo marca el audio */
  if (T.porVoz && VOZ.audio && VOZ.marcas.length > T.k) {
    const t = VOZ.audio.currentTime;
    const a = VOZ.marcas[T.k];
    const b = T.k + 1 < VOZ.marcas.length ? VOZ.marcas[T.k + 1] : (VOZ.dur || a + 4);
    return Math.max(0, Math.min(1, (t - a) / Math.max(.2, b - a)));
  }
  if (T.cronometrado) {
    const g = Math.min(1, (performance.now() - R.t0) / 1000 / S.duracion);
    const f = T.frac[T.k] || 1;
    return Math.max(0, Math.min(1, (g - T.lim[T.k]) / f));
  }
  return Math.max(0, Math.min(1, T.transcurrido / T.dwell));
}

/* El hueco de los rótulos se calcula con la parada MÁS LARGA del guion,
   no con la actual. Si no, cada parada mueve la escena arriba y abajo. */
const cacheNar = { an:-1, n:-1, max:1 };

function lineasMaximas(an) {
  if (cacheNar.an === an && cacheNar.n === T.lista.length) return cacheNar.max;
  let m = 1;
  for (const s of T.lista) m = Math.max(m, envolver(s.texto, an).length);
  cacheNar.an = an; cacheNar.n = T.lista.length; cacheNar.max = m;
  return m;
}

/* Lecturas que la animación quiere ver en el vídeo, aparte de la principal */
function lecturasEnVideo() {
  const pr = S.anim.meta.lecturaPrincipal;
  return (S.anim.lecturas || []).filter(l => l.video && l.id !== pr);
}

function medirCapas() {
  const u = S.u, z = zonaActual();
  const x = z.l * S.W, an = S.W * (1 - z.l - z.r);
  const arriba = z.t * S.H, abajo = S.H * (1 - z.b);

  if (S.limpio) {
    return { x, an, arriba, abajo, altoCab:0, altoNar:0, lineas:null,
             escena:{ x, w:an, y:arriba, h:abajo - arriba } };
  }

  /* La cabecera crece con lo que haya que caber: marca a la izquierda,
     lecturas a la derecha. Se queda con la más alta de las dos. */
  /* uh: como u, pero con suelo de legibilidad al navegar. En vertical y
     al grabar vale exactamente u, para que el vídeo no cambie. */
  const libre = !S.formato && !R.grabando && R.cuenta === 0;
  const uh = libre ? Math.max(u, .92 * (S.dpr || 1)) : u;

  const altoMarca = S.formato ? 58 * uh : 0;
  const altoLect  = (S.anim.meta.lecturaPrincipal ? 46 * uh : 0)
                  + lecturasEnVideo().length * 25 * uh;
  const altoCab = Math.max(altoMarca, altoLect, 30 * uh);

  let altoNar = 0, lineas = null, ut = u;
  if (T.on && T.lista[T.k]) {
    const s = T.lista[T.k];
    ctx.font = `600 ${42 * u}px 'Public Sans',system-ui,sans-serif`;
    lineas = envolver(s.texto, an);
    const bloque = k => (24 + 58 + lineasMaximas(an) * 54 + 30 + 14) * k;

    /* En un lienzo bajo (un móvil apaisado, por ejemplo) el texto se
       encogería hasta comerse la escena. Le ponemos techo. */
    const techo = (abajo - arriba - altoCab) * (S.formato === 'largo' ? .42 : .5);
    if (bloque(u) > techo) ut = u * techo / bloque(u);
    altoNar = bloque(ut);
  }

  return {
    x, an, arriba, abajo, altoCab, altoNar, lineas, ut, uh,
    escena: {
      x, w: an,
      y: arriba + altoCab + 14 * u,
      h: (abajo - altoNar) - (arriba + altoCab + 14 * u)
    }
  };
}

/* Recorrido del borde, empezando arriba en el centro y en sentido
   horario. Devuelve los puntos y la longitud acumulada hasta cada uno,
   para poder dibujar solo una fracción. */
function bordeDelMarco(x0, y0, x1, y1, r, sentido) {
  const P = [];
  const arco = (cx, cy, a0, a1) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (a1 - a0) * i / 8;
      P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  if (sentido > 0) {           /* por la derecha, hasta abajo en el centro */
    P.push([mx, y0]);
    P.push([x1 - r, y0]);      arco(x1 - r, y0 + r, -Math.PI/2, 0);
    P.push([x1, y1 - r]);      arco(x1 - r, y1 - r, 0, Math.PI/2);
    P.push([mx, y1]);
  } else {                     /* por la izquierda */
    P.push([mx, y0]);
    P.push([x0 + r, y0]);      arco(x0 + r, y0 + r, -Math.PI/2, -Math.PI, true);
    P.push([x0, y1 - r]);      arco(x0 + r, y1 - r, Math.PI, Math.PI/2, true);
    P.push([mx, y1]);
  }

  const acum = [0];
  for (let i = 1; i < P.length; i++)
    acum.push(acum[i-1] + Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]));
  return { P, acum, total: acum[acum.length - 1] };
}

function pintarMarco(fraccion) {
  const u = S.u;
  /* Separado del borde: en un móvil con esquinas redondeadas y la barra
     de gestos, lo que va pegado al canto no se ve. */
  const m = 26 * u, r = 34 * u;
  const f = Math.max(0, Math.min(1, fraccion));

  /* Dos recorridos desde el centro de arriba, uno por cada lado.
     Se encuentran abajo justo cuando el clip termina. */
  const lados = [
    bordeDelMarco(m, m, S.W - m, S.H - m, r,  1),
    bordeDelMarco(m, m, S.W - m, S.H - m, r, -1)
  ];

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 4.5 * u;
  ctx.strokeStyle = 'rgba(42,88,120,.45)';
  for (const { P } of lados) {
    ctx.beginPath();
    P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }
  if (f <= 0) return;

  ctx.strokeStyle = '#E9A93C';
  for (const { P, acum, total } of lados) {
    const meta = f * total;
    let px = P[0][0], py = P[0][1], ax = px, ay = py;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let i = 1; i < P.length; i++) {
      if (acum[i] <= meta) { ctx.lineTo(P[i][0], P[i][1]); ax = P[i][0]; ay = P[i][1]; px = ax; py = ay; continue; }
      const t = (meta - acum[i-1]) / Math.max(1e-6, acum[i] - acum[i-1]);
      ax = P[i-1][0] + (P[i][0]-P[i-1][0]) * t;
      ay = P[i-1][1] + (P[i][1]-P[i-1][1]) * t;
      ctx.lineTo(ax, ay);
      px = P[i-1][0]; py = P[i-1][1];
      break;
    }
    ctx.stroke();
    if (f < .999) puntaFlecha(ax, ay, Math.atan2(ay - py, ax - px), 9 * u);
  }
}

/* Punta de flecha en el extremo que avanza */
function puntaFlecha(x, y, ang, tam) {
  ctx.save();
  ctx.fillStyle = '#FFD98A';
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang) * tam, y + Math.sin(ang) * tam);
  ctx.lineTo(x + Math.cos(ang + 2.5) * tam * .85, y + Math.sin(ang + 2.5) * tam * .85);
  ctx.lineTo(x + Math.cos(ang - 2.5) * tam * .85, y + Math.sin(ang - 2.5) * tam * .85);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function pintarCapas(L) {
  if (S.limpio) return;
  const u = S.u;

  /* uh: unidad de la cabecera, con suelo de legibilidad en pantalla */
  const uh = L.uh || u;

  /* Marca: solo en vertical, que es lo que se graba */
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (S.formato) {
    ctx.font = `${32 * uh}px 'Instrument Serif',Georgia,serif`;
    ctx.fillStyle = '#EAF2F8';
    ctx.fillText('Laboratorio animado', L.x, L.arriba + 28 * uh);
    if (S.anim.meta.subtitulo) {
      ctx.font = `${18 * uh}px 'Public Sans',system-ui,sans-serif`;
      ctx.fillStyle = '#7794AD';
      ctx.fillText(S.anim.meta.subtitulo, L.x, L.arriba + 52 * uh);
    }
  }

  /* Lectura principal, arriba a la derecha y en una sola línea */
  const der = L.x + L.an;
  let yl = L.arriba;
  const lp = S.anim.meta.lecturaPrincipal;
  if (lp && salidas[lp]) {
    ctx.textAlign = 'right';
    ctx.font = `500 ${28 * uh}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = '#E9A93C';
    ctx.fillText(salidas[lp].textContent, der, yl + 21 * uh);
    ctx.font = `${14 * uh}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = '#7794AD';
    ctx.fillText((S.anim.meta.etiquetaPrincipal || '').toUpperCase(), der, yl + 39 * uh);
    yl += 46 * uh;
  }

  /* Las demás lecturas que la animación quiera enseñar */
  lecturasEnVideo().forEach(l => {
    const dd = salidas[l.id];
    if (!dd) return;
    yl += 25 * uh;
    ctx.textAlign = 'right';
    ctx.font = `${19 * uh}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = '#EAF2F8';
    ctx.fillText(dd.textContent, der, yl);
    const anchoVal = ctx.measureText(dd.textContent).width;
    ctx.font = `${16 * uh}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = '#7794AD';
    ctx.fillText(l.label, der - anchoVal - 12 * uh, yl);
  });

  if (!T.on) return;

  /* Degradado: el texto nunca se pierde contra la escena */
  const s = T.lista[T.k];
  if (!s) { T.on = false; return; }
  const tope = L.abajo - L.altoNar;
  const g = ctx.createLinearGradient(0, tope - 60 * (L.ut || u), 0, S.H);
  g.addColorStop(0, 'rgba(10,24,38,0)');
  g.addColorStop(.45, 'rgba(10,24,38,.82)');
  g.addColorStop(1, 'rgba(10,24,38,.96)');
  ctx.fillStyle = g;
  ctx.fillRect(0, tope - 60 * (L.ut || u), S.W, S.H - tope + 60 * (L.ut || u));

  /* ut: igual que u, pero encogido si el lienzo es demasiado bajo */
  const ut = L.ut || u;
  let y = tope + 16 * ut;

  /* Capítulo a la izquierda, contador a la derecha: nunca se pisan */
  ctx.textAlign = 'left';
  ctx.font = `${18 * ut}px 'JetBrains Mono',monospace`;
  ctx.fillStyle = '#7794AD';
  ctx.fillText(s.clave.toUpperCase(), L.x, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#E9A93C';
  ctx.fillText(`${T.k + 1}/${T.lista.length}`, L.x + L.an, y);

  /* Título y texto al mismo tamaño: el contraste lo pone el color.
     El barrido cuenta también las palabras del título, porque la voz
     lo lee: si no, el resaltado va por delante toda la parada. */
  ctx.textAlign = 'left';

  ctx.font = `600 ${42 * ut}px 'Public Sans',system-ui,sans-serif`;
  const lin = disponerTexto(s.texto, L.an);

  /* El título se lee una vez y se queda fijo. Solo cambia si una parada
     declara uno nuevo; si no, se arrastra el último. Leer un título por
     segmento rompe el hilo de la narración. */
  let tituloFijo = '', propio = false;
  for (let i = T.k; i >= 0; i--) {
    if (T.lista[i] && T.lista[i].titulo) { tituloFijo = T.lista[i].titulo; propio = (i === T.k); break; }
  }

  ctx.font = `${50 * ut}px 'Instrument Serif',Georgia,serif`;
  const palT = tituloFijo ? (disponerTexto(tituloFijo, 1e6)[0] || []) : [];
  const conTitulo = S.tituloVoz && propio;

  /* El avance se mide en «peso hablado», no en número de palabras */
  let pesoT = 0;
  if (conTitulo) for (const p of palT) pesoT += p.peso;
  let pesoC = 0;
  for (const l of lin) for (const p of l) pesoC += p.peso;

  /* El barrido acompaña a una voz. En la web, sin voz, no hay a quién
     acompañar: el lector va a su ritmo y el texto se queda quieto. */
  const estilo = (S.estudio || R.grabando || T.porVoz) ? S.subs : 'fijo';

  /* El barrido debe acabar casi con la voz, no mucho antes. */
  const tramo = conTitulo ? .96 : .90;
  const pr = progresoParada();
  const meta = Math.max(0, Math.min(1, (pr - .01) / tramo)) * (pesoT + pesoC);

  /* acumulado: la palabra activa es aquella en la que cae `meta` */
  let acc = 0;
  const estadoDe = p => {
    const a = acc, b = acc + p.peso;
    acc = b;
    return meta >= b ? 'leida' : (meta >= a ? 'activa' : 'pendiente');
  };

  y += 54 * ut;
  if (!tituloFijo) {
    y -= 54 * ut;
  } else if (!conTitulo || estilo === 'fijo') {
    ctx.fillStyle = '#E9A93C';
    ctx.fillText(tituloFijo, L.x, y);
  } else {
    for (const p of palT) {
      const est = estadoDe(p);
      if (estilo === 'escribe' && est === 'pendiente') continue;
      ctx.fillStyle = est === 'activa'    ? '#FFF6E2'
                    : est === 'pendiente' ? 'rgba(233,169,60,.34)'
                    : '#E9A93C';
      ctx.fillText(p.t, L.x + p.x, y);
    }
  }

  y += 20 * ut;
  ctx.font = `600 ${42 * ut}px 'Public Sans',system-ui,sans-serif`;

  lin.forEach((linea, i) => {
    const yy = y + (i + 1) * 54 * ut - 14 * ut;
    for (const p of linea) {
      const estado = estadoDe(p);
      if (estilo === 'escribe' && estado === 'pendiente') continue;
      ctx.fillStyle = estilo === 'fijo' ? '#EAF2F8'
                    : estado === 'activa'    ? '#E9A93C'
                    : estado === 'pendiente' ? '#7794AD'
                    : '#EAF2F8';
      ctx.fillText(p.t, L.x + p.x, yy);
    }
  });

  y += lineasMaximas(L.an) * 54 * ut + 12 * ut;
  if (s.dato) {
    ctx.font = `${20 * ut}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = '#7794AD';
    ctx.fillText(typeof s.dato === 'function' ? s.dato(API) : s.dato, L.x, y);
  }

  /* Progreso del recorrido */
  const by = L.abajo - 6 * u;
  if (S.progreso === 'barra' || S.progreso === 'ambos') {
    ctx.fillStyle = 'rgba(42,88,120,.9)';
    ctx.fillRect(L.x, by, L.an, 2 * u);
  }
  const avance = T.porVoz && VOZ.audio && VOZ.dur
    ? Math.min(1, VOZ.audio.currentTime / VOZ.dur)
    : T.cronometrado
    ? Math.min(1, (performance.now() - R.t0) / 1000 / S.duracion)
    : (T.lim[T.k] + T.frac[T.k] * Math.min(1, T.transcurrido / T.dwell));
  if (S.progreso === 'barra' || S.progreso === 'ambos') {
    /* Crece desde el centro hacia los dos lados */
    const mitad = L.an / 2 * avance, medio = L.x + L.an / 2;
    ctx.fillStyle = '#E9A93C';
    ctx.fillRect(medio - mitad, by, mitad * 2, 2 * u);
    if (avance > .01 && avance < .999) {
      ctx.fillStyle = '#FFD98A';
      for (const lado of [-1, 1]) {
        const x = medio + mitad * lado;
        ctx.beginPath();
        ctx.moveTo(x + lado * 7 * u, by + 1 * u);
        ctx.lineTo(x, by - 3.5 * u);
        ctx.lineTo(x, by + 5.5 * u);
        ctx.closePath(); ctx.fill();
      }
    }
  }
  if (S.progreso === 'marco' || S.progreso === 'ambos') pintarMarco(avance);
}

/* ─────────────────── Visita guiada ─────────────────── */
function construirLista() {
  /* Una escena, dos guiones: el corto para redes y el largo para
     YouTube. Se elige en Estudio y todo lo demás sigue igual. */
  const largo = S.anim.guionLargo;
  T.lista = (S.guion === 'largo' && largo && largo.length) ? largo : (S.anim.guion || []);
  const w = T.lista.map(s => (s.titulo + ' ' + s.texto).length);
  const suma = w.reduce((a, b) => a + b, 0) || 1;
  T.frac = w.map(x => x / suma);
  T.lim = []; let acc = 0;
  T.frac.forEach(f => { T.lim.push(acc); acc += f; });
}

const dwellDe = k => T.cronometrado
  ? T.total * T.frac[k]
  : Math.max(5, (T.lista[k].titulo + ' ' + T.lista[k].texto).length * .055);

function mostrar(k) {
  const n = T.lista.length;
  if (!n) { T.on = false; return; }
  T.k = ((k % n) + n) % n;
  T.transcurrido = 0;
  T.dwell = dwellDe(T.k);
  const s = T.lista[T.k];
  if (s && s.al) s.al(API);
}

function iniciarVisita(opts = {}) {
  construirLista();
  if (!T.lista.length) return;
  T.on = true;
  T.cronometrado = !!opts.total;
  T.total = opts.total || 0;
  T.auto = true;
  S.reproduciendo = true;
  $('#bPlay').textContent = 'Pausar';
  $('#bVisita').style.display = 'none';
  $('#visitaCtl').style.display = '';
  bloquearControles(true);
  mostrar(0);
}

/* Durante el recorrido, el guion manda sobre los controles. Dejarlos
   activos hace que el usuario pelee contra la propia animación. */
function bloquearControles(si) {
  document.body.classList.toggle('en-visita', si);
  document.querySelectorAll('.sec-param').forEach(sec => {
    sec.classList.toggle('bloqueada', si);
    sec.querySelectorAll('input, button, select').forEach(el => { el.disabled = si; });
  });
}

function salirVisita() {
  T.on = false; T.cronometrado = false; T.porVoz = false;
  if (VOZ.marcando) {
    VOZ.marcando = false;
    const b = $('#bMarcar'); if (b) b.textContent = 'Marcar tiempos';
    notaVoz('Marcado interrumpido. Vuelve a empezar cuando quieras.');
  }
  if (VOZ.ensayando) { VOZ.ensayando = false; }
  if (VOZ.audio) { try { VOZ.audio.pause(); } catch (e) {} }
  bloquearControles(false);
  $('#bVisita').style.display = '';
  $('#visitaCtl').style.display = 'none';
}

function avanzarVisita(dt) {
  if (T.cronometrado || T.porVoz || !T.auto || !S.reproduciendo) return;
  T.transcurrido += dt;
  if (T.transcurrido >= T.dwell) {
    if (T.k === T.lista.length - 1) T.auto = false;
    else mostrar(T.k + 1);
  }
}

function buscarVisita(pr) {
  let k = 0;
  for (let i = 0; i < T.lim.length; i++) if (pr >= T.lim[i]) k = i;
  if (k !== T.k) mostrar(k);
}

/* ─────────────────── Voz ───────────────────
   La voz se genera fuera (ElevenLabs) y se carga aquí. Un audio
   reproducido dentro de la página SÍ entra en el vídeo grabado,
   a diferencia de la voz sintética del navegador. */
const VOZ = {
  audio:null, url:null, dur:0,
  ctx:null, dest:null,
  marcas:[], marcando:false, activa:false, ensayando:false
};

const vozLista = () => VOZ.audio && VOZ.marcas.length === (S.anim.guion || []).length;

function cargarAudio(archivo) {
  if (!archivo) return;
  if (VOZ.url) URL.revokeObjectURL(VOZ.url);
  soltarVoz();

  VOZ.url = URL.createObjectURL(archivo);
  VOZ.audio = new Audio(VOZ.url);
  VOZ.audio.preload = 'auto';
  VOZ.marcas = [];
  VOZ.activa = false;

  VOZ.audio.addEventListener('loadedmetadata', () => {
    VOZ.dur = VOZ.audio.duration;
    S.duracion = Math.max(10, Math.min(180, Math.ceil(VOZ.dur)));
    const d = $('#dur'); if (d) { d.value = S.duracion; $('#durV').textContent = S.duracion + ' s'; }
    estadoVoz(`${archivo.name} · ${num(VOZ.dur, 1)} s`);
    $('#bMarcar').disabled = false;
    marcarSRT();
    pintarMarcas();
    notaVoz(`Cargado. Ahora marca dónde empieza cada una de las ${(S.anim.guion||[]).length} paradas.`);
  });
  VOZ.audio.addEventListener('ended', () => {
    if (VOZ.marcando) terminarMarcado();
    if (VOZ.ensayando) { VOZ.ensayando = false; salirVisita(); }
  });
}

/* Enrutamos el audio para poder mezclarlo en la pista del vídeo */
function prepararSalidaVoz() {
  if (!VOZ.audio) return null;
  if (VOZ.dest) return VOZ.dest;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  VOZ.ctx = new AC();
  const src = VOZ.ctx.createMediaElementSource(VOZ.audio);
  VOZ.dest = VOZ.ctx.createMediaStreamDestination();
  src.connect(VOZ.dest);
  src.connect(VOZ.ctx.destination);
  return VOZ.dest;
}

function soltarVoz() {
  if (VOZ.audio) { try { VOZ.audio.pause(); } catch (e) {} }
  VOZ.marcando = false; VOZ.ensayando = false;
}

/* ── Marcado: una pulsación por parada ── */
function empezarMarcado() {
  if (!VOZ.audio) return;
  construirLista();
  VOZ.marcas = [0];
  VOZ.marcando = true;
  VOZ.audio.currentTime = 0;
  VOZ.audio.play();
  T.on = true; T.cronometrado = false; T.porVoz = false;
  $('#bVisita').style.display = 'none';
  $('#visitaCtl').style.display = '';
  bloquearControles(true);
  mostrar(0);
  $('#bMarcar').textContent = 'Marcando…';
  notaVoz(`Escucha y pulsa <b>espacio</b> al empezar cada parada. Van ${VOZ.marcas.length} de ${T.lista.length}.`);
}

function marcarAhora() {
  if (!VOZ.marcando) return;
  const n = T.lista.length;
  if (VOZ.marcas.length >= n) return terminarMarcado();
  VOZ.marcas.push(VOZ.audio.currentTime);
  mostrar(VOZ.marcas.length - 1);
  if (VOZ.marcas.length >= n) return terminarMarcado();
  notaVoz(`Van ${VOZ.marcas.length} de ${n}. Sigue pulsando <b>espacio</b>.`);
}

function terminarMarcado() {
  VOZ.marcando = false;
  VOZ.audio.pause();
  $('#bMarcar').textContent = 'Marcar tiempos';
  const n = T.lista.length;
  if (VOZ.marcas.length < n) {
    notaVoz(`Se acabó el audio con ${VOZ.marcas.length} de ${n} paradas. Vuelve a marcar.`);
    VOZ.activa = false;
  } else {
    VOZ.activa = true;
    $('#bEnsayar').disabled = false;
    notaVoz('Listo: <b>' + VOZ.marcas.map(t => num(t, 1)).join(' · ') + '</b> s. Ya puedes grabar.');
    brindis('Tiempos marcados');
  }
  marcarSRT();
  pintarMarcas();
  salirVisita();
}

/* ── Ensayo: ver cómo queda sin grabar ── */
function ensayarVoz() {
  if (!vozLista()) return;
  construirLista();
  T.on = true; T.cronometrado = false; T.porVoz = true; T.auto = false;
  S.reproduciendo = true;
  VOZ.ensayando = true;
  $('#bVisita').style.display = 'none';
  $('#visitaCtl').style.display = '';
  S.anim.reiniciar && S.anim.reiniciar(API);
  S.t = 0;
  bloquearControles(true);
  mostrar(0);
  VOZ.audio.currentTime = 0;
  VOZ.audio.play();
}

const paradaDeVoz = t => {
  let k = 0;
  for (let i = 0; i < VOZ.marcas.length; i++) if (t >= VOZ.marcas[i]) k = i;
  return k;
};

/* Llamado cada fotograma: la voz manda sobre el recorrido */
function seguirVoz() {
  if (!T.porVoz || !VOZ.audio || VOZ.audio.paused) return;
  const k = paradaDeVoz(VOZ.audio.currentTime);
  if (k !== T.k) mostrar(k);
}

/* Con veinte paradas, fallar una y repetir las veinte es inaceptable.
   Aquí se retoca la que sea, o se sigue marcando desde donde quieras. */
function pintarMarcas() {
  const cont = $('#listaMarcas');
  if (!cont) return;
  if (!VOZ.marcas.length || VOZ.marcando) { cont.innerHTML = ''; return; }

  const n = (S.anim.guion || []).length;
  cont.innerHTML = `<p class="pista" style="margin:10px 0 6px">
    Ajusta una marca si entró tarde o pronto, o sigue marcando desde ahí.</p>` +
    VOZ.marcas.map((t, i) => `
      <div class="marca">
        <b>${i + 1}</b>
        <span>${num(t, 2)} s</span>
        <button class="pill" data-mv="${i}:-0.15" title="adelantar">−</button>
        <button class="pill" data-mv="${i}:0.15"  title="atrasar">+</button>
        <button class="pill" data-remar="${i}">desde aquí</button>
      </div>`).join('') +
    (VOZ.marcas.length < n ? `<p class="pista">Faltan ${n - VOZ.marcas.length} paradas.</p>` : '');

  cont.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
    const [i, d] = b.dataset.mv.split(':');
    const k = +i, paso = +d;
    const min = k > 0 ? VOZ.marcas[k-1] + .1 : 0;
    const max = k + 1 < VOZ.marcas.length ? VOZ.marcas[k+1] - .1 : (VOZ.dur || 1e9);
    VOZ.marcas[k] = Math.max(min, Math.min(max, VOZ.marcas[k] + paso));
    pintarMarcas();
  });
  cont.querySelectorAll('[data-remar]').forEach(b => b.onclick = () => {
    retomarMarcado(+b.dataset.remar);
  });
}

/* Volver a marcar a partir de una parada, conservando las anteriores */
function retomarMarcado(desde) {
  if (!VOZ.audio) return;
  construirLista();
  VOZ.marcas = VOZ.marcas.slice(0, Math.max(1, desde));
  VOZ.marcando = true;
  VOZ.activa = false;
  VOZ.audio.currentTime = VOZ.marcas[VOZ.marcas.length - 1] || 0;
  VOZ.audio.play();
  T.on = true; T.cronometrado = false; T.porVoz = false;
  $('#bVisita').style.display = 'none';
  $('#visitaCtl').style.display = '';
  bloquearControles(true);
  mostrar(VOZ.marcas.length - 1);
  $('#bMarcar').textContent = 'Marcando…';
  marcarSRT();
  pintarMarcas();
  notaVoz(`Sigue desde la parada ${VOZ.marcas.length}. Pulsa <b>espacio</b> en cada corte.`);
}

function estadoVoz(txt) { const e = $('#vozEstado'); if (e) e.textContent = txt; }
function notaVoz(html) { const e = $('#notaVoz'); if (e) e.innerHTML = html; }

/* ─────────────────── Bucle ─────────────────── */
let ultimo = performance.now();
let fallos = 0;

/* Fotogramas por segundo: si al grabar caen, el vídeo sale a tirones
   y eso se nota mucho más que cualquier mejora de nitidez. */
const FPS = { cuenta:0, desde:0, valor:60, minimo:60 };
function medirFps(ahora) {
  FPS.cuenta++;
  if (!FPS.desde) { FPS.desde = ahora; return; }
  if (ahora - FPS.desde >= 500) {
    FPS.valor = FPS.cuenta * 1000 / (ahora - FPS.desde);
    FPS.cuenta = 0; FPS.desde = ahora;
    if (R.grabando && FPS.valor < FPS.minimo) FPS.minimo = FPS.valor;
  }
}

function bucle(ahora) {
  /* Pedimos el siguiente fotograma ANTES de trabajar: si algo falla,
     la animación se recupera en vez de congelarse para siempre. */
  requestAnimationFrame(bucle);

  medirFps(ahora);
  const dt = Math.min((ahora - ultimo) / 1000, .05);
  ultimo = ahora;

  try {
    unFotograma(dt);
  } catch (err) {
    if (++fallos <= 3) {
      console.error('Laboratorio · fallo al dibujar:', err);
      brindis('Algo falló al dibujar. Sigue en marcha, pero avísame.');
    }
  }
}

function unFotograma(dt) {
  /* Con el portal delante y en equipos modestos, la escena espera */
  if (document.body.classList.contains('portal-quieto') &&
      document.getElementById('portal')) { renderizar(0); return; }

  if (R.cuenta > 0) {
    R.cuenta -= dt;
    if (R.cuenta <= 0) { R.cuenta = 0; comenzarGrabacion(); }
  }
  if (R.grabando) tickGrabacion();
  seguirVoz();
  if (T.on) avanzarVisita(dt);
  S.tr += dt;
  if (S.reproduciendo) S.t += dt;

  renderizar(dt);
  if (R.cuenta > 0) pintarCuenta();
}

function renderizar(dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0A1826';
  ctx.fillRect(0, 0, S.W, S.H);
  pintarPapel();

  const L = medirCapas();
  API.escena = { ...L.escena, cx: L.escena.x + L.escena.w / 2, cy: L.escena.y + L.escena.h / 2 };
  API.uh = L.uh || S.u;

  /* Dos relojes. El de la simulación se congela al pausar; el de la
     interfaz nunca para, para que los controles sigan respondiendo. */
  API.dt  = S.reproduciendo ? dt : 0;
  API.dtr = dt;
  API.t   = S.t;
  API.tr  = S.tr;
  API.reproduciendo = S.reproduciendo;

  ctx.save();
  S.anim.dibujar(ctx, API);
  ctx.restore();

  pintarCapas(L);
}

function pintarPapel() {
  const p = 16 * S.u, P = 96 * S.u;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(90,150,200,.055)';
  ctx.beginPath();
  for (let x = 0; x < S.W; x += p) { ctx.moveTo(x, 0); ctx.lineTo(x, S.H); }
  for (let y = 0; y < S.H; y += p) { ctx.moveTo(0, y); ctx.lineTo(S.W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,150,200,.10)';
  ctx.beginPath();
  for (let x = 0; x < S.W; x += P) { ctx.moveTo(x, 0); ctx.lineTo(x, S.H); }
  for (let y = 0; y < S.H; y += P) { ctx.moveTo(0, y); ctx.lineTo(S.W, y); }
  ctx.stroke();
}

function pintarCuenta() {
  const n = Math.ceil(R.cuenta);
  ctx.fillStyle = 'rgba(6,16,26,.6)';
  ctx.fillRect(0, 0, S.W, S.H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${260 * S.u}px 'Instrument Serif',Georgia,serif`;
  ctx.fillStyle = `rgba(234,242,248,${(R.cuenta % 1).toFixed(2)})`;
  ctx.fillText(String(n), S.W / 2, S.H / 2);
  ctx.textBaseline = 'alphabetic';
}

/* ─────────────────── Grabación ─────────────────── */
/* El orden importa mucho: avc1.42E01E es perfil Baseline, sin CABAC ni
   fotogramas B, y a igual tasa de bits se ve claramente peor. Primero
   pedimos High (avc1.64xxxx), luego Main, y Baseline solo como último
   recurso. VP9 va antes que Baseline por el mismo motivo. */
/* Subir con más resolución de la necesaria mejora el resultado: YouTube
   reparte más tasa de bits a los vídeos grandes, aunque luego los vea
   alguien a 1080. */
const BITS = { 1080: 18e6, 1440: 32e6, 2160: 65e6 };

const MIMES_MUDO = [
  ['video/mp4;codecs=avc1.640033', 'mp4'],
  ['video/mp4;codecs=avc1.640028', 'mp4'],
  ['video/mp4;codecs=avc1.4D4028', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/mp4;codecs=avc1.42E01E', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm;codecs=vp8', 'webm'],
  ['video/webm', 'webm']
];
const MIMES_VOZ = [
  ['video/mp4;codecs=avc1.640033,mp4a.40.2', 'mp4'],
  ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'mp4'],
  ['video/mp4;codecs=avc1.4D4028,mp4a.40.2', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'],
  ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'],
  ['video/webm;codecs=vp8,opus', 'webm'],
  ['video/webm', 'webm']
];
function elegirMime(conVoz) {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const [m, ext] of (conVoz ? MIMES_VOZ : MIMES_MUDO))
    if (MediaRecorder.isTypeSupported(m)) return { m, ext };
  return null;
}

function grabar(formato) {
  return new Promise(resolver => {
    const e = elegirMime(vozLista());
    if (!e) { brindis('Este navegador no puede grabar. Usa Chrome de escritorio.'); return resolver(); }
    R.mime = e.m; R.ext = e.ext; R.resolver = resolver;
    S.formato = formato || S.formato || 'todas';
    marcarFormato();
    document.body.classList.add('grabando');
    R.cuenta = 3.99;
    ajustar();
  });
}

function comenzarGrabacion() {
  /* Primero la bandera y luego el ajuste: la cuenta atrás ya puso
     R.cuenta a cero, así que sin esto ajustar() cree que no estamos
     grabando y deja el lienzo al tamaño de la ventana. Era la causa
     de que el vídeo saliera en la resolución equivocada. */
  R.grabando = true;
  ajustar();
  S.anim.reiniciar && S.anim.reiniciar(API);
  S.t = 0;

  const flujo = lienzo.captureStream(60);
  const conVoz = vozLista();

  /* La pista de audio se engancha ANTES de crear el grabador, pero la
     voz todavía no suena. Antes se lanzaba aquí y el grabador tardaba
     unos milisegundos más en arrancar: ese hueco se perdía y por eso
     el principio salía cortado. */
  if (conVoz) {
    construirLista();
    T.on = true; T.cronometrado = false; T.porVoz = true; T.auto = false;
    S.reproduciendo = false;          /* quieto hasta que grabe de verdad */
    $('#bVisita').style.display = 'none';
    $('#visitaCtl').style.display = '';
    bloquearControles(true);
    mostrar(0);
    const d = prepararSalidaVoz();
    if (d) d.stream.getAudioTracks().forEach(t => flujo.addTrack(t));
    VOZ.ctx && VOZ.ctx.resume();
    VOZ.audio.pause();
    VOZ.audio.currentTime = 0;
  }

  R.trozos = [];
  try {
    R.rec = new MediaRecorder(flujo, {
      mimeType: R.mime,
      videoBitsPerSecond: BITS[S.calidad] || 16e6,
      audioBitsPerSecond: 160e3 });
  } catch (err) {
    R.grabando = false;
    brindis('No se pudo iniciar: ' + err.message);
    salirEncuadre(); return;
  }
  R.rec.ondataavailable = ev => { if (ev.data.size) R.trozos.push(ev.data); };
  R.rec.onstop = guardarClip;

  /* Arranca el grabador y solo cuando ha empezado de verdad se suelta
     la voz. Los primeros fotogramas del codificador siempre tropiezan;
     que tropiecen sobre silencio y sobre la primera parada quieta. */
  R.soltado = false;
  const soltar = () => {
    if (R.soltado) return;
    R.soltado = true;
    R.t0 = performance.now();
    FPS.minimo = 60;
    S.reproduciendo = true;
    if (conVoz) {
      const p = VOZ.audio.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      iniciarVisita({ total: S.duracion });
    }
  };

  R.rec.onstart = () => setTimeout(soltar, 220);
  R.rec.start(100);
  R.grabando = true;
  R.t0 = performance.now();
  FPS.minimo = 60;

  /* Por si el navegador no dispara onstart */
  setTimeout(() => { if (R.grabando) soltar(); }, 700);
}

function tickGrabacion() {
  const conVoz = T.porVoz && VOZ.audio;
  const el = conVoz ? VOZ.audio.currentTime : (performance.now() - R.t0) / 1000;
  const fin = conVoz ? VOZ.dur : S.duracion;
  if (!conVoz) buscarVisita(Math.min(.9999, el / S.duracion));
  const f = FPS.valor;
  const col = f < 45 ? '#FF6E56' : f < 55 ? '#E9A93C' : '#7FD6A0';
  $('#recEstado').innerHTML =
    `<span class="punto"></span>${num(el, 1)} / ${num(fin, 1)} s · ${S.W}×${S.H}` +
    (conVoz ? ' · voz' : '') +
    ` · <b style="color:${col}">${Math.round(f)} fps</b>`;
  if (el >= fin - .02 || (conVoz && VOZ.audio.ended)) detenerGrabacion();
}

function detenerGrabacion() {
  if (!R.grabando) return;
  R.grabando = false;
  if (VOZ.audio) { try { VOZ.audio.pause(); } catch (e) {} }
  setTimeout(() => { try { R.rec.stop(); } catch (e) {} }, 180);
}

function guardarClip() {
  const blob = new Blob(R.trozos, { type: R.mime });
  const sello = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  descargar(blob, `${S.anim.meta.id}-${S.formato}-${sello}.${R.ext}`);
  brindis(`Guardado · ${(blob.size / 1048576).toFixed(1)} MB · mínimo ${Math.round(FPS.minimo)} fps`);
  salirEncuadre();
  R.resolver && R.resolver();
  R.resolver = null;
}

function salirEncuadre() {
  if (R.grabando) { R.grabando = false; try { R.rec.stop(); } catch (e) {} }
  if (VOZ.audio) { try { VOZ.audio.pause(); } catch (e) {} }
  R.cuenta = 0;
  document.body.classList.remove('grabando');
  salirVisita();
  ajustar();
}

async function grabarLasTres() {
  for (const f of ['fb', 'yt', 'tt']) {
    await grabar(f);
    await new Promise(r => setTimeout(r, 1200));
  }
  brindis('Los tres formatos están descargados.');
}

/* ─────────────────── Exportaciones ─────────────────── */
function descargar(blob, nombre) {
  const a = crear('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function capturarPNG() {
  lienzo.toBlob(b => {
    descargar(b, `${S.anim.meta.id}-${Date.now()}.png`);
    brindis('Imagen descargada');
  }, 'image/png');
}

/* Portada 16:9: solo la escena, sin rótulos ni guías.
   Se separa el dibujo de la descarga para que la galería pueda
   pedir la imagen desde fuera y generarlas todas de una vez. */
function hacerPortada(entrega) {
  const fmt = S.formato, recorrido = T.on;
  S.formato = null; T.on = false; S.limpio = true;

  lienzo.width = 1280; lienzo.height = 720;
  S.W = 1280; S.H = 720; S.u = 1280 / 1080;
  renderizar(0);

  lienzo.toBlob(b => {
    S.limpio = false; S.formato = fmt; T.on = recorrido;
    ajustar();
    entrega(b, `${S.anim.meta.id}-portada.jpg`);
  }, 'image/jpeg', .86);
}

function capturarPortada() {
  hacerPortada((b, nombre) => {
    descargar(b, nombre);
    brindis('Portada lista · déjala junto a los demás archivos');
  });
}

const codigoTiempo = s => {
  const z = (v, n) => String(v).padStart(n, '0');
  return `${z(Math.floor(s / 3600), 2)}:${z(Math.floor(s % 3600 / 60), 2)}:` +
         `${z(Math.floor(s % 60), 2)},${z(Math.round(s % 1 * 1000), 3)}`;
};

function generarSRT() {
  construirLista();
  /* Si hay marcas, mandan ellas: son los tiempos reales de la voz.
     El reparto por longitud de texto solo vale cuando se graba mudo. */
  const conMarcas = vozLista();
  let srt = '';
  T.lista.forEach((s, i) => {
    let a, b;
    if (conMarcas) {
      a = VOZ.marcas[i];
      b = i + 1 < VOZ.marcas.length ? VOZ.marcas[i + 1] : VOZ.dur;
    } else {
      a = T.lim[i] * S.duracion;
      b = a + T.frac[i] * S.duracion;
    }
    srt += `${i + 1}\n${codigoTiempo(a)} --> ${codigoTiempo(b)}\n` +
           `${s.titulo ? s.titulo + '. ' : ''}${s.texto}\n\n`;
  });
  return srt.trimEnd() + '\n';
}

function descargarSRT() {
  descargar(new Blob([generarSRT()], { type: 'text/plain;charset=utf-8' }),
            `${S.anim.meta.id}-${S.duracion}s.srt`);
  brindis('Subtítulos descargados');
}

function abrirSubtitulos() {
  const srt = generarSRT();
  let caja = $('#modalSrt');
  if (caja) caja.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal on" id="modalSrt"><div class="modal-box ancho">
      <h4>Subtítulos</h4>
      <p class="sub">${vozLista()
        ? 'Con los tiempos que marcaste sobre el audio: cuadran con la voz.'
        : 'Sin audio marcado, repartidos por longitud de texto sobre ' + S.duracion + ' s. '
          + 'Carga la voz y marca los tiempos para que cuadren de verdad.'}</p>
      <div class="bloque">
        <div class="bl-cab">
          <span>formato .srt${vozLista() ? ' · según tus marcas' : ' · estimado'}</span>
          <button class="btn sm" id="bCopiarSrt">Copiar</button>
        </div>
        <textarea id="txt_srt" readonly rows="14">${srt.replace(/</g, '&lt;')}</textarea>
      </div>
      <div class="grid2" style="margin-top:18px">
        <button class="btn" id="bBajarSrt">Descargar .srt</button>
        <button class="btn" id="bCerrarSrt">Cerrar</button>
      </div>
    </div></div>`);

  caja = $('#modalSrt');
  $('#bCopiarSrt').onclick = e => {
    const ta = $('#txt_srt');
    navigator.clipboard?.writeText(ta.value)
      .then(() => { e.target.textContent = 'Copiado'; setTimeout(() => e.target.textContent = 'Copiar', 1600); })
      .catch(() => { ta.select(); document.execCommand('copy'); });
  };
  $('#bBajarSrt').onclick  = descargarSRT;
  $('#bCerrarSrt').onclick = () => caja.remove();
  caja.onclick = e => { if (e.target === caja) caja.remove(); };
}

let tempBrindis;
function brindis(msg) {
  const b = $('#brindis');
  b.textContent = msg;
  b.classList.add('on');
  clearTimeout(tempBrindis);
  tempBrindis = setTimeout(() => b.classList.remove('on'), 3200);
}

/* ─────────────────── Textos para publicar ───────────────────
   Nada de esto se inventa: sale del guion que ya escribiste. */

/* La dirección sale de catalogo.js, para no tenerla en dos sitios */
const SITIO = () => (window.LAB_SITIO || '').replace(/\/$/, '');
const RUTA  = () => window.LAB_RUTA_ANIM || '';

/* Las mismas para todas las redes: una descripción sirve para las tres */
const ETIQUETAS_BASE = ['ciencia', 'divulgacion', 'matematicas', 'aprender', 'curiosidades'];

function enlaceAnimacion() {
  /* Publicado, la dirección buena es la de la barra. En local hay que
     construirla, y para eso están LAB_SITIO y LAB_RUTA_ANIM. */
  return location.protocol.startsWith('http')
    ? location.href.split(/[?#]/)[0]
    : `${SITIO()}/${RUTA()}${S.anim.meta.id}.html`;
}

function armarTextos() {
  const m = S.anim.meta, po = S.anim.portal || {};
  const url = enlaceAnimacion();
  const gancho = m.gancho || m.titulo;

  /* Las propias primero: son las que describen esta pieza */
  const lista = [...(m.etiquetas || []), ...ETIQUETAS_BASE];

  /* La descripción NO son los subtítulos. Sale del texto del portal,
     que ya está escrito en prosa y para alguien que no ha visto nada. */
  const cuerpo = po.texto
    ? po.texto.replace(/\s+/g, ' ').trim()
    : (m.subtitulo || '');

  return {
    titulo: `${gancho} #Shorts`,
    descripcion:
`${cuerpo}

▶ Muévelo tú en la simulación: ${url}
Cambia los controles y mira qué pasa.

${lista.map(t => '#' + t.replace(/\s+/g, '')).join(' ')}`,
    /* El campo de etiquetas de YouTube espera comas, no almohadillas */
    etiquetas: lista.join(', '),
    hashtags: lista.map(t => '#' + t.replace(/\s+/g, '')).join(' ')
  };
}

/* El guion tal cual hay que pegarlo en ElevenLabs: sin números, sin
   códigos de tiempo, y con línea en blanco entre paradas para que la
   voz pause justo donde tú vas a marcar. */
function guionParaVoz() {
  construirLista();
  return T.lista.map(s => (s.titulo ? s.titulo + '. ' : '') + s.texto).join('\n\n');
}

function abrirTextos() {
  const t = armarTextos();
  const voz = guionParaVoz();
  const nParadas = T.lista.length;
  let caja = $('#modalTextos');
  if (caja) caja.remove();

  const bloque = (id, etiqueta, valor, filas, pista) => `
    <div class="bloque">
      <div class="bl-cab">
        <span>${etiqueta}</span>
        <button class="btn sm" data-copiar="${id}">Copiar</button>
      </div>
      <textarea id="txt_${id}" readonly rows="${filas}">${valor.replace(/</g, '&lt;')}</textarea>
      ${pista ? `<p class="pista">${pista}</p>` : ''}
    </div>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal on" id="modalTextos"><div class="modal-box ancho">
      <h4>Textos para publicar</h4>
      <p class="sub">Una descripción para las tres redes. Copia y pega.</p>

      <div class="bloque destacado">
        <div class="bl-cab">
          <span>guion para la voz · ${voz.length} caracteres</span>
          <button class="btn sm" data-copiar="voz">Copiar</button>
        </div>
        <textarea id="txt_voz" readonly rows="${Math.min(14, nParadas * 2 + 2)}">${voz}</textarea>
        <p class="pista">Pégalo en ElevenLabs tal cual. Las líneas en blanco le hacen pausar
        entre paradas, que es donde vas a pulsar espacio. Son
        <b>${Math.max(0, nParadas - 1)} pulsaciones</b>.</p>
      </div>

      ${bloque('tit', 'título', t.titulo, 2)}
      ${bloque('des', 'descripción', t.descripcion, 10)}
      ${bloque('eti', 'etiquetas de YouTube', t.etiquetas, 3,
               'Separadas por comas, que es lo que espera el campo de etiquetas. Se pegan todas de una vez.')}
      ${bloque('has', 'hashtags', t.hashtags, 2,
               'Para el pie de TikTok e Instagram. Ya van dentro de la descripción.')}

      <button class="btn wide" id="bCerrarTextos" style="margin-top:20px">Cerrar</button>
    </div></div>`);

  caja = $('#modalTextos');
  caja.querySelectorAll('[data-copiar]').forEach(b => b.onclick = () => {
    const ta = $('#txt_' + b.dataset.copiar);
    navigator.clipboard?.writeText(ta.value)
      .then(() => { b.textContent = 'Copiado'; setTimeout(() => b.textContent = 'Copiar', 1600); })
      .catch(() => { ta.select(); document.execCommand('copy'); });
  });
  $('#bCerrarTextos').onclick = () => caja.remove();
  caja.onclick = e => { if (e.target === caja) caja.remove(); };
}

/* ─────────────────── Conexiones ─────────────────── */
/* El .srt sale distinto según haya marcas o no. Que el botón lo diga
   antes de pulsarlo, y que se bloquee en el único caso peligroso:
   audio cargado pero sin marcar. */
function marcarSRT() {
  const b = $('#bSRT');
  if (!b) return;
  if (!VOZ.audio) {
    b.disabled = false;
    b.textContent = 'Subtítulos .srt';
    b.title = 'Sin audio: los tiempos se reparten por longitud de texto.';
  } else if (!vozLista()) {
    b.disabled = true;
    b.textContent = 'Subtítulos · marca los tiempos';
    b.title = 'Hay audio cargado pero sin marcar. Marca los tiempos y se activa.';
  } else {
    b.disabled = false;
    b.textContent = 'Subtítulos · con tus marcas';
    b.title = 'Los tiempos salen de las marcas que hiciste sobre el audio.';
  }
}

function marcarGuion() {
  document.querySelectorAll('[data-gui]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.gui === S.guion)));
}

function marcarProgreso() {
  document.querySelectorAll('[data-prog]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.prog === S.progreso)));
}

function marcarCalidad() {
  document.querySelectorAll('[data-cal]').forEach(b =>
    b.setAttribute('aria-pressed', String(+b.dataset.cal === S.calidad)));
}

function marcarSubs() {
  document.querySelectorAll('[data-sub]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.sub === S.subs)));
  const t = $('#bTitVoz');
  if (t) t.setAttribute('aria-pressed', String(S.tituloVoz));
}

function marcarFormato() {
  document.querySelectorAll('[data-f]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.f === (S.formato || ''))));
}

function conectar() {
  $('#bPlay').onclick = e => {
    S.reproduciendo = !S.reproduciendo;
    e.target.textContent = S.reproduciendo ? 'Pausar' : 'Reanudar';
  };
  /* Dos reinicios distintos, cada uno en su sitio */
  $('#bRestablecer') && ($('#bRestablecer').onclick = () => {
    for (const k in S.def) S.p[k] = S.def[k];
    refrescarParams();
    S.t = 0;
    S.anim.reiniciar && S.anim.reiniciar(API);
    brindis('Valores restablecidos');
  });

  $('#bVolverInicio').onclick = () => {
    T.auto = true;
    mostrar(0);
    brindis('De vuelta a la parada 1');
  };

  $('#bVisita').onclick   = () => iniciarVisita();
  $('#bSalirVis').onclick = salirVisita;
  $('#bSig').onclick = () => { T.auto = true; mostrar(T.k + 1); };
  $('#bAnt').onclick = () => { T.auto = true; mostrar(T.k - 1); };

  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    S.formato = b.dataset.f || null;
    marcarFormato(); ajustar();
  });

  $('#dur').addEventListener('input', e => {
    S.duracion = +e.target.value;
    $('#durV').textContent = S.duracion + ' s';
  });

  /* ── Voz ── */
  const zona = $('#zonaAudio'), inp = $('#fileAudio');
  zona.onclick = () => inp.click();
  zona.onkeydown = e => { if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); inp.click(); } };
  inp.onchange = e => cargarAudio(e.target.files[0]);
  ['dragenter','dragover'].forEach(ev => zona.addEventListener(ev, e => {
    e.preventDefault(); zona.classList.add('encima');
  }));
  ['dragleave','drop'].forEach(ev => zona.addEventListener(ev, e => {
    e.preventDefault(); zona.classList.remove('encima');
  }));
  zona.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f && /^audio\//.test(f.type)) cargarAudio(f);
    else notaVoz('Eso no es un archivo de audio.');
  });
  $('#bMarcar').onclick  = () => VOZ.marcando ? terminarMarcado() : empezarMarcado();
  $('#bEnsayar').onclick = ensayarVoz;

  $('#bGrabar').onclick  = () => grabar(S.formato || 'todas');
  $('#bGrabar3').onclick = grabarLasTres;
  $('#bPNG').onclick     = capturarPNG;
  $('#bPortada').onclick = capturarPortada;
  $('#bTextos').onclick  = abrirTextos;
  $('#bSRT').onclick     = abrirSubtitulos;
  $('#bDetener').onclick = detenerGrabacion;
  $('#bSalirEnc').onclick = salirEncuadre;

  $('#bEstudio') && ($('#bEstudio').onclick = e => {
    S.estudio = !S.estudio;
    document.body.classList.toggle('estudio', S.estudio);
    e.target.classList.toggle('on', S.estudio);
    e.target.textContent = S.estudio ? 'Estudio' : 'Público';
    $('#secEstudio').classList.toggle('oculta', !S.estudio);
    if (!S.estudio) { S.formato = null; marcarFormato(); }
    ajustar();
  });

  $('#bAyuda').onclick       = () => $('#modalAyuda').classList.add('on');
  $('#bCerrarAyuda').onclick = () => $('#modalAyuda').classList.remove('on');
  $('#modalAyuda').onclick   = e => { if (e.target.id === 'modalAyuda') e.target.classList.remove('on'); };

  $('#bCompartir').onclick = () => {
    navigator.clipboard?.writeText(location.href.split(/[?#]/)[0])
      .then(() => brindis('Enlace copiado'))
      .catch(() => brindis('No se pudo copiar'));
  };
  $('#bPantalla').onclick = () => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  };

  addEventListener('keydown', e => {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (VOZ.marcando) return marcarAhora();
      const p = $('#bPlay'); if (p) p.click();
    }
    else if (e.key === 'g' || e.key === 'G') T.on ? salirVisita() : iniciarVisita();
    else if (e.key === 'h' || e.key === 'H') { document.body.classList.toggle('sin-panel'); ajustar(); }
    else if (e.key === 'f' || e.key === 'F') $('#bPantalla').click();
    else if (e.key === 'Escape') { $('#modalAyuda').classList.remove('on'); if (R.grabando || R.cuenta) salirEncuadre(); }
    else if (T.on && e.key === 'ArrowRight') $('#bSig').click();
    else if (T.on && e.key === 'ArrowLeft')  $('#bAnt').click();
    else S.anim.tecla && S.anim.tecla(e, API);
  });

  document.querySelectorAll('[data-gui]').forEach(b => b.onclick = () => {
    S.guion = b.dataset.gui;
    marcarGuion();
    construirLista();
    VOZ.marcas = []; VOZ.activa = false;
    marcarSRT(); pintarMarcas();
    notaVoz('Guion cambiado: hay que volver a marcar los tiempos.');
    salirVisita();
  });

  document.querySelectorAll('[data-prog]').forEach(b => b.onclick = () => {
    S.progreso = b.dataset.prog;
    marcarProgreso();
  });

  document.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => {
    S.calidad = +b.dataset.cal;
    marcarCalidad();
    ajustar();
  });

  document.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
    S.subs = b.dataset.sub;
    marcarSubs();
  });
  $('#bTitVoz').onclick = () => { S.tituloVoz = !S.tituloVoz; marcarSubs(); };

  marcarFormato();
  marcarSubs();
  marcarCalidad();
  marcarProgreso();
  marcarGuion();
  marcarSRT();
}

/* ─────────────────── API para las animaciones ─────────────────── */
const API = {
  p: S.p,
  escena: { x:0, y:0, w:0, h:0, cx:0, cy:0 },
  dt: 0, dtr: 0, t: 0, tr: 0, uh: 1, reproduciendo: true,
  get u() { return S.u; },
  get W() { return S.W; },
  get H() { return S.H; },
  set(id, v) { fijar(id, v); },
  leer(id, txt) {
    const d = salidas[id];
    if (d && d.textContent !== txt) d.textContent = txt;
  },
  num,
  grabando: () => R.grabando
};

window.LabShell = { registrar, num, hacerPortada };
})();
