// Listado completo de adopciones con buscador y filtro por semaforo.
import { supabase, fotoPublica } from '../js/supabase.js';
import { esc, fechaCorta, TEXTOS } from '../js/comun.js';
import { iniciarPanel, textoSilencio, mostrarError, ESTADO_ADOPCION } from './panel.js';

await iniciarPanel('adopciones');

const listaActivas = document.getElementById('activas');
const listaTerminadas = document.getElementById('terminadas');
const seccionTerminadas = document.getElementById('seccion-terminadas');
const buscador = document.getElementById('buscar');
const form = document.getElementById('form-filtros');
const conteo = document.getElementById('conteo');

const normalizar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

form.addEventListener('submit', (e) => e.preventDefault());

const [sem, otras] = await Promise.all([
  supabase.from('vista_semaforo').select('*'),
  supabase.from('adopciones')
    .select('id, fecha_adopcion, estado, perro:perros(nombre, codigo, foto_ruta), familia:perfiles(nombre_completo, distrito)')
    .neq('estado', 'activa')
    .order('fecha_adopcion', { ascending: false }),
]);

let activas = [];
let terminadas = [];

if (sem.error) {
  mostrarError(listaActivas, sem.error);
} else {
  activas = (sem.data || []).sort((a, b) => a.prioridad - b.prioridad || b.dias_sin_reporte - a.dias_sin_reporte);
  terminadas = otras.error ? [] : (otras.data || []);
  const n = { rojo: 0, ambar: 0, verde: 0 };
  activas.forEach((a) => { n[a.estado] += 1; });
  document.getElementById('resumen-adopciones').textContent =
    `${activas.length} adopciones activas: ${n.rojo} necesitan una llamada, ${n.ambar} hace tiempo que no sabemos y ${n.verde} van bien.`;
  // Filtro desde la URL (por ejemplo adopciones.html?estado=rojo)
  const inicial = new URLSearchParams(location.search).get('estado');
  const radio = inicial && document.querySelector(`[name="filtro"][value="${CSS.escape(inicial)}"]`);
  if (radio) radio.checked = true;
  pintar();
}

form.addEventListener('input', pintar);
form.addEventListener('change', pintar);

function coincide(texto, ...campos) {
  if (!texto) return true;
  return normalizar(campos.join(' ')).includes(texto);
}

function pintar() {
  const texto = normalizar(buscador.value.trim());
  const filtro = form.querySelector('[name="filtro"]:checked')?.value || 'todos';

  const visibles = activas.filter((a) =>
    (filtro === 'todos' || a.estado === filtro)
    && coincide(texto, a.perro_nombre, a.familia_nombre, a.familia_distrito, a.perro_codigo));

  listaActivas.innerHTML = visibles.length
    ? visibles.map((a) => `
      <li class="card">
        <a class="fila-adopcion" href="caso.html?id=${encodeURIComponent(a.adopcion_id)}">
          <img class="foto-redonda borde-semaforo semaforo-${a.estado} foto-mini" src="${esc(fotoPublica(a.perro_foto_ruta))}" alt="Foto de ${esc(a.perro_nombre)}" width="64" height="64" loading="lazy">
          <div class="min-w-0">
            <p class="fw-bold fs-5 mb-0 texto-cortado">${esc(a.perro_nombre)} <span class="fw-normal text-suave fs-6">${esc(a.perro_codigo)}</span></p>
            <p class="mb-0 texto-cortado">${esc(a.familia_nombre)}${a.familia_distrito ? ` · ${esc(a.familia_distrito)}` : ''}</p>
            <p class="small text-suave mb-0">${esc(textoSilencio(a.dias_sin_reporte, Boolean(a.ultimo_reporte)))}${a.vacuna_vencida ? ' · vacuna vencida' : ''}</p>
          </div>
          <div class="lado">
            <span class="insignia-semaforo semaforo-${a.estado}">${esc(TEXTOS.semaforo[a.estado])}</span>
            <i class="bi bi-chevron-right text-suave d-none d-md-inline" aria-hidden="true"></i>
          </div>
        </a>
      </li>`).join('')
    : `<li class="estado-vacio"><i class="bi bi-search" aria-hidden="true"></i>${activas.length
      ? (filtro === 'rojo' && !texto ? 'Hoy ninguna familia necesita una llamada.' : 'No encontramos adopciones con esa búsqueda.')
      : 'Todavía no hay adopciones activas.'}</li>`;

  const terminadasVisibles = filtro === 'todos'
    ? terminadas.filter((t) => coincide(texto, t.perro?.nombre, t.familia?.nombre_completo, t.familia?.distrito, t.perro?.codigo))
    : [];
  seccionTerminadas.hidden = !terminadasVisibles.length;
  listaTerminadas.innerHTML = terminadasVisibles.map((t) => `
    <li class="card">
      <a class="fila-adopcion" href="caso.html?id=${encodeURIComponent(t.id)}">
        <img class="foto-redonda foto-mini" src="${esc(fotoPublica(t.perro?.foto_ruta))}" alt="Foto de ${esc(t.perro?.nombre || 'el perro')}" width="64" height="64" loading="lazy">
        <div class="min-w-0">
          <p class="fw-bold fs-5 mb-0 texto-cortado">${esc(t.perro?.nombre || '')} <span class="fw-normal text-suave fs-6">${esc(t.perro?.codigo || '')}</span></p>
          <p class="mb-0 texto-cortado">${esc(t.familia?.nombre_completo || '')}${t.familia?.distrito ? ` · ${esc(t.familia.distrito)}` : ''}</p>
          <p class="small text-suave mb-0">Adoptó el ${esc(fechaCorta(t.fecha_adopcion))}</p>
        </div>
        <div class="lado"><span class="badge text-bg-secondary">${esc(ESTADO_ADOPCION[t.estado])}</span></div>
      </a>
    </li>`).join('');

  conteo.textContent = `${visibles.length} ${visibles.length === 1 ? 'adopción activa coincide' : 'adopciones activas coinciden'}.`;
}
