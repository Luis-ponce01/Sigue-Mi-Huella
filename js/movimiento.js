// =====================================================================
// Motor de animacion de Sigue mi Huella
// - Un unico IntersectionObserver para toda la pagina.
// - Cada elemento se anima una sola vez y deja de observarse.
// - Contador numerico con requestAnimationFrame.
// - Progreso de scroll de una seccion (0 a 1) para las secciones fijas.
// - Revelado de titulares palabra por palabra.
// Con reduccion de movimiento activada, nada se oculta ni se mueve.
// =====================================================================

const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reduceMovimiento = () => consulta.matches;

// La clase activa los estados ocultos iniciales definidos en movimiento.css
if (!reduceMovimiento()) document.documentElement.classList.add('js-movimiento');
consulta.addEventListener?.('change', () => {
  document.documentElement.classList.toggle('js-movimiento', !reduceMovimiento());
});

const SELECTOR = '.revelar, .revelar-escala, .revelar-izquierda, .revelar-derecha, .palabras, .lineas, [data-al-revelar]';
const acciones = new WeakMap(); // elemento -> funcion a ejecutar al entrar en pantalla

function alEntrar(el) {
  el.classList.add('visible');
  const accion = acciones.get(el);
  if (accion) { acciones.delete(el); accion(el); }
}

// Observador global unico
const observador = 'IntersectionObserver' in window
  ? new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const umbral = Number(e.target.dataset.umbral || 0.15);
        const alto = window.innerHeight;
        // Elementos muy altos nunca alcanzan el umbral: basta con que su borde superior entre al 60 %
        if (e.intersectionRatio >= umbral || e.boundingClientRect.top < alto * 0.6) {
          observador.unobserve(e.target);
          alEntrar(e.target);
        }
      }
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.75], rootMargin: '0px 0px -5% 0px' })
  : null;

// Observa un elemento. "accion" es opcional y se ejecuta una sola vez.
export function observar(el, accion) {
  if (!el) return;
  if (accion) acciones.set(el, accion);
  if (!observador || reduceMovimiento()) { alEntrar(el); return; }
  observador.observe(el);
}

// Asigna --i a los hijos de cada contenedor .escalonado y observa todo
export function iniciarRevelado(raiz = document) {
  raiz.querySelectorAll('.escalonado').forEach((cont) => {
    [...cont.children].forEach((hijo, i) => {
      if (!hijo.style.getPropertyValue('--i')) hijo.style.setProperty('--i', i);
    });
  });
  raiz.querySelectorAll(SELECTOR).forEach((el) => {
    if (!el.classList.contains('visible')) observar(el);
  });
}

// ---------------------------------------------------------------------
// Contador numerico con desaceleracion
// ---------------------------------------------------------------------
const desacelerar = (t) => 1 - Math.pow(1 - t, 4);

export function contar(el, hasta, { duracion = 1200, desde = 0, decimales = 0, prefijo = '', sufijo = '' } = {}) {
  if (!el) return Promise.resolve();
  const formato = (v) => prefijo + Number(v).toLocaleString('es-PE', {
    minimumFractionDigits: decimales, maximumFractionDigits: decimales,
  }) + sufijo;
  if (reduceMovimiento() || duracion <= 0) { el.textContent = formato(hasta); return Promise.resolve(); }
  return new Promise((resolver) => {
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      el.textContent = formato(desde + (hasta - desde) * desacelerar(t));
      if (t < 1) requestAnimationFrame(paso); else resolver();
    };
    requestAnimationFrame(paso);
  });
}

// ---------------------------------------------------------------------
// Progreso de scroll de una seccion: 0 cuando su borde superior toca el
// borde superior de la ventana, 1 cuando su borde inferior toca el inferior.
// ---------------------------------------------------------------------
export function progresoSeccion(el) {
  const r = el.getBoundingClientRect();
  const recorrido = r.height - window.innerHeight;
  if (recorrido <= 0) return r.top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -r.top / recorrido));
}

// Escucha el scroll pasando siempre por requestAnimationFrame
export function alHacerScroll(funcion) {
  let pendiente = false;
  const correr = () => { pendiente = false; funcion(); };
  const pedir = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(correr); } };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir, { passive: true });
  pedir();
  return () => { window.removeEventListener('scroll', pedir); window.removeEventListener('resize', pedir); };
}

// ---------------------------------------------------------------------
// Titulares palabra por palabra
// El texto completo queda en aria-label para lectores de pantalla.
// ---------------------------------------------------------------------
export function revelarPalabras(el, { intervalo = 80, inmediato = false } = {}) {
  if (!el || el.dataset.partido) return;
  const texto = el.textContent.trim().replace(/\s+/g, ' ');
  el.dataset.partido = '1';
  el.setAttribute('aria-label', texto);
  el.classList.add('palabras');
  el.style.setProperty('--intervalo-palabra', `${intervalo}ms`);
  el.innerHTML = texto.split(' ').map((p, i) =>
    `<span class="palabra" aria-hidden="true" style="--i:${i}">${p}</span>`
  ).join(' ');
  if (inmediato || reduceMovimiento()) {
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
  } else {
    observar(el);
  }
}

// Divide un parrafo en lineas a partir de etiquetas <span class="linea">
export function prepararLineas(el) {
  if (!el) return;
  el.classList.add('lineas');
  el.querySelectorAll('.linea').forEach((l, i) => l.style.setProperty('--i', i));
  observar(el);
}

// Espera (respeta reduccion de movimiento)
export const esperar = (ms) => new Promise((r) => setTimeout(r, reduceMovimiento() ? 0 : ms));
