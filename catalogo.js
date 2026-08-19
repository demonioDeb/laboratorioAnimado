/* ══════════════════════════════════════════════════════════
   CATÁLOGO · el único archivo que tocas al publicar
   Pega el id de YouTube y los enlaces. Nada más.
   `youtube` es el short; `youtubeLargo`, la versión de YouTube larga.
   Es un .js y no un .json a propósito: así la galería también
   funciona abriendo el archivo con doble clic, sin servidor.
   ══════════════════════════════════════════════════════════ */

/* Dónde viven las animaciones dentro del sitio.
   ''              → riemann.html
   'animaciones/'  → animaciones/riemann.html
   Cámbialo aquí y se corrige en la galería, en los enlaces para
   compartir y en los textos para publicar, todo a la vez. */
window.LAB_RUTA_ANIM = 'animaciones/';

/* Dirección del sitio. Solo se usa al abrir los archivos en local;
   publicado, el enlace se toma de la barra del navegador. */
window.LAB_SITIO = 'https://demoniodeb.github.io/laboratorioAnimado';

/* Enlace del «invítame a un café». Vacío = el botón no aparece. */
window.LAB_CAFE = '';

/* En la galería va SIEMPRE la portada propia, generada en 16:9.
   Ponlo en false si prefieres tirar de la miniatura de YouTube
   cuando falte la portada: ojo, los vídeos son verticales y en
   una ficha apaisada salen recortados. */
window.LAB_SOLO_PORTADA = true;

window.CATALOGO = [
  {
    id:'bisel',
    titulo:'El aro de tu reloj sabe multiplicar',
    resumen:'Ese anillo lleno de números diminutos no es un adorno: multiplica, convierte unidades y calcula cuánta gasolina te queda.',
    categoria:'Cálculo',
    publicado:'2026-08-19',
    youtube:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'costa',
    titulo:'España decía 1214 km. Portugal decía 987',
    resumen:'La misma frontera, medida por los dos vecinos, con 23 % de diferencia. Ninguno se equivocaba: usaron reglas distintas.',
    categoria:'Geometría',
    publicado:'2026-08-19',
    youtube:'RUGWsQTkp70',
    tiktok:'',
    facebook:''
  },
  {
    id:'aureo',
    titulo:'Se lo inventó en 1855',
    resumen:'El número áureo no está en el Partenón ni en las conchas. Donde sí está, en un girasol, es por una razón mejor que el mito.',
    categoria:'Geometría',
    publicado:'2026-08-19',
    youtube:'rPErDTpvpls',
    tiktok:'',
    facebook:''
  },
  {
    id:'pendulo',
    titulo:'Una bola colgada sabe dónde estás',
    resumen:'Cuelga una bola de un cable largo y déjala oscilar. Al cabo de una hora oscila en otra dirección, y nadie la ha tocado.',
    categoria:'Física',
    publicado:'2026-08-15',
    youtube:'L0MgE7xZHp4',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'foucault',
    titulo:'La flecha que nadie giró',
    resumen:'Paseas una flecha por un círculo sin girarla nunca y vuelve apuntando a otro lado. Con eso Foucault demostró que la Tierra gira.',
    categoria:'Geometría',
    publicado:'2026-08-15',
    youtube:'Q1ppzstGBQU',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'mercurio',
    titulo:'Mercurio delató a Newton',
    resumen:'La órbita de Mercurio giraba 43 segundos de arco por siglo y nadie sabía por qué. Inventaron un planeta invisible para explicarlo.',
    categoria:'Física',
    publicado:'2026-08-15',
    youtube:'OWGDJZfSNx4',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'caminos',
    titulo:'70 caminos contra uno',
    resumen:'Al centro del tablero llegan setenta recorridos distintos. Al borde, uno solo. Ahí está toda la explicación de la campana.',
    categoria:'Probabilidad',
    publicado:'2026-08-14',
    youtube:'5Lnjc0hN9_o',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'tablas',
    titulo:'La tabla del 2 dibuja un corazón',
    resumen:'Une cada número con su doble alrededor de un círculo. Solo hay líneas rectas, y aun así aparece un corazón.',
    categoria:'Geometría',
    publicado:'2026-08-14',
    youtube:'JMDBT40QM7E',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'vortices',
    titulo:'Vórtices',
    resumen:'Miles de partículas arrastradas por remolinos que se empujan entre sí. Nadie dibuja el resultado.',
    categoria:'Fluidos',
    publicado:'2026-08-13',
    youtube:'TkKL5ck1DF8',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  },
  {
    id:'riemann',
    titulo:'Sumas de Riemann',
    resumen:'El área bajo una curva, medida con rectángulos que se estrechan hasta desaparecer.',
    categoria:'Cálculo',
    publicado:'2026-08-12',
    youtube:'duvG_n96orc',
    youtubeLargo:'',
    tiktok:'',
    facebook:''
  }
];
