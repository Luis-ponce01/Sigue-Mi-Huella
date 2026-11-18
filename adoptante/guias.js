// Guias de cuidado: agrupadas por categoria, con buscador y de tres en tres.
import { supabase } from '../js/supabase.js';
import { esc, TEXTOS, mensajeError } from '../js/comun.js';
import { iniciarRevelado } from '../js/movimiento.js';
import { iniciarPortal, htmlErrorCarga } from './portal.js';

const vista = document.getElementById('vista');
const POR_TANDA = 3; // la veterinaria pidio no abrumar a la familia

const CATEGORIAS = {
  alimentacion: 'bi-egg-fried',
  salud: 'bi-heart-pulse',
  higiene: 'bi-droplet',
  conducta: 'bi-hearts',
};
const ORDEN_CATEGORIAS = Object.keys(CATEGORIAS);

const estado = {
  guias: [],
  termino: '',
  categoria: null,
  visibles: POR_TANDA,
  abiertas: new Set(),
};

// Sin tildes ni mayusculas, para que "vacuna" encuentre "Vacunación"
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function principal() {
  await iniciarPortal();

  const param = new URLSearchParams(location.search).get('categoria');
  if (param && CATEGORIAS[param]) estado.categoria = param;

  const { data, error } = await supabase
    .from('guias')
    .select('id, titulo, categoria, contenido, validado_por, orden')
    .eq('publicada', true)
    .order('orden', { ascending: true });
  if (error) {
    vista.innerHTML = htmlErrorCarga(mensajeError(error));
    return;
  }
  estado.guias = (data || [])
    .map((g) => ({ ...g, _texto: normalizar(`${g.titulo} ${g.contenido}`) }))
    .sort((a, b) => (ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria)) || (a.orden - b.orden));

  vista.innerHTML = `
    <header class="mb-4">
      <p class="antetitulo mb-1 revelar">Consejos de la veterinaria</p>
      <h1 class="h2 mb-2 revelar">Guías de cuidado</h1>
      <p class="text-suave mb-0 revelar">Cortas y directas, revisadas por nuestra veterinaria aliada. Te mostramos tres a la vez para que no sea demasiado.</p>
    </header>

    <form class="mb-3 revelar" role="search" id="form-buscar">
      <label class="form-label" for="buscar">Buscar en las guías</label>
      <div class="buscador-guias">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" id="buscar" class="form-control" placeholder="Por ejemplo: vacuna, baño, ladra" autocomplete="off">
      </div>
    </form>

    <div id="filtro-categoria"></div>
    <p id="conteo" class="text-suave small mb-3" aria-live="polite"></p>
    <div id="lista-guias"></div>
    <div class="text-center mt-4">
      <button type="button" id="ver-mas" class="btn btn-outline-primary" hidden>
        <i class="bi bi-plus-circle" aria-hidden="true"></i> Ver más
      </button>
    </div>
  `;

  const buscar = document.getElementById('buscar');
  let espera;
  document.getElementById('form-buscar').addEventListener('submit', (e) => e.preventDefault());
  buscar.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      estado.termino = normalizar(buscar.value.trim());
      estado.visibles = POR_TANDA;
      pintarLista({ animar: false });
    }, 150);
  });

  document.getElementById('ver-mas').addEventListener('click', () => {
    const antes = estado.visibles;
    estado.visibles += POR_TANDA;
    pintarLista({ desde: antes });
  });

  document.getElementById('filtro-categoria').addEventListener('click', (e) => {
    if (!e.target.closest('[data-todas]')) return;
    estado.categoria = null;
    estado.visibles = POR_TANDA;
    history.replaceState(null, '', location.pathname);
    pintarLista({ animar: false });
    buscar.focus();
  });

  const lista = document.getElementById('lista-guias');
  lista.addEventListener('shown.bs.collapse', (e) => estado.abiertas.add(e.target.id));
  lista.addEventListener('hidden.bs.collapse', (e) => estado.abiertas.delete(e.target.id));

  pintarLista({ desde: 0 });
  iniciarRevelado();
}

function filtradas() {
  return estado.guias.filter((g) =>
    (!estado.categoria || g.categoria === estado.categoria) &&
    (!estado.termino || estado.termino.split(/\s+/).every((p) => g._texto.includes(p)))
  );
}

function pintarLista({ desde = 0, animar = true } = {}) {
  const todas = filtradas();
  const mostradas = todas.slice(0, estado.visibles);
  const lista = document.getElementById('lista-guias');
  const verMas = document.getElementById('ver-mas');
  const conteo = document.getElementById('conteo');

  document.getElementById('filtro-categoria').innerHTML = estado.categoria ? `
    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
      <span class="fw-semibold">Guías de ${esc(TEXTOS.categoria[estado.categoria])}</span>
      <button type="button" class="btn btn-link btn-sm px-2" data-todas>Ver todas las guías</button>
    </div>` : '';

  if (!todas.length) {
    lista.innerHTML = `
      <div class="estado-vacio">
        <i class="bi bi-search" aria-hidden="true" style="color: var(--smh-terracota)"></i>
        No encontramos guías con esa palabra. Prueba con otra, por ejemplo "vacuna" o "baño".
      </div>`;
    conteo.textContent = '';
    verMas.hidden = true;
    return;
  }

  conteo.textContent = `Mostrando ${mostradas.length} de ${todas.length} ${todas.length === 1 ? 'guía' : 'guías'}`;

  // Agrupar lo visible por categoria, respetando el orden
  const grupos = new Map();
  mostradas.forEach((g, i) => {
    if (!grupos.has(g.categoria)) grupos.set(g.categoria, []);
    grupos.get(g.categoria).push({ g, i });
  });

  lista.innerHTML = [...grupos.entries()].map(([cat, items]) => `
    <section aria-labelledby="cat-${cat}">
      <h2 id="cat-${cat}" class="titulo-categoria">
        <span class="icono-circulo" style="width:2.5rem;height:2.5rem;font-size:1.1rem"><i class="bi ${CATEGORIAS[cat] || 'bi-book'}" aria-hidden="true"></i></span>
        ${esc(TEXTOS.categoria[cat] || cat)}
      </h2>
      <div class="accordion" id="acordeon-${cat}">
        ${items.map(({ g, i }) => itemGuia(g, cat, animar && i >= desde)).join('')}
      </div>
    </section>`).join('');

  verMas.hidden = mostradas.length >= todas.length;
  if (animar) iniciarRevelado(lista);

  // Al pedir mas, llevar el foco a la primera guia nueva
  if (desde > 0) {
    const nueva = mostradas[desde];
    if (nueva) document.querySelector(`[data-bs-target="#guia-${nueva.id}"]`)?.focus();
  }
}

function itemGuia(g, cat, revelar) {
  const id = `guia-${g.id}`;
  const abierta = estado.abiertas.has(id);
  const parrafos = String(g.contenido || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return `
    <div class="accordion-item ${revelar ? 'revelar' : ''}">
      <h3 class="accordion-header">
        <button class="accordion-button ${abierta ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse"
          data-bs-target="#${id}" aria-expanded="${abierta}" aria-controls="${id}">
          <span>
            <span class="titulo-guia">${esc(g.titulo)}</span>
            ${g.validado_por ? `<span class="insignia-validada"><i class="bi bi-patch-check-fill" aria-hidden="true"></i> Validada por ${esc(g.validado_por)}</span>` : ''}
          </span>
        </button>
      </h3>
      <div id="${id}" class="accordion-collapse collapse ${abierta ? 'show' : ''}" data-bs-parent="#acordeon-${cat}">
        <div class="accordion-body">
          ${parrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>
      </div>
    </div>`;
}

principal();
