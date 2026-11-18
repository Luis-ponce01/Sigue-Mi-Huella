// Pantalla diaria del albergue: cifras, casos que necesitan atencion y galeria.
import { supabase, fotoPublica, fotosFirmadas } from '../js/supabase.js';
import { esc, fechaLarga, fechaCorta, hoyISO, TEXTOS, enlaceWhatsApp, aviso } from '../js/comun.js';
import { contar, iniciarRevelado } from '../js/movimiento.js';
import {
  iniciarPanel, primerNombre, diasDesde, haceTexto, textoSilencio,
  mensajeWhatsApp, registrarContacto, mostrarError,
} from './panel.js';

const { perfil } = await iniciarPanel('inicio');

document.getElementById('fecha-hoy').textContent = fechaLarga(hoyISO());
const nombre = primerNombre(perfil.nombre_completo);
if (nombre) document.getElementById('saludo').textContent = `Hola, ${nombre}. Así están nuestros perros hoy`;

const listaAtencion = document.getElementById('atencion');
const zonaTranquilidad = document.getElementById('tranquilidad');
const galeria = document.getElementById('galeria');

const [indicadores, semaforo] = await Promise.all([
  supabase.from('vista_indicadores').select('*').maybeSingle(),
  supabase.from('vista_semaforo').select('*'),
]);

// ---------------------------------------------------------------------
// Cifras: cuentan una sola vez al cargar, en 400 ms
// ---------------------------------------------------------------------
if (indicadores.error) {
  aviso('No pudimos cargar las cifras del resumen.', 'error');
} else {
  const fila = indicadores.data || {};
  document.querySelectorAll('[data-indicador]').forEach((el) => {
    const valor = Number(fila[el.dataset.indicador] || 0);
    contar(el, valor, { duracion: 400, sufijo: el.dataset.sufijo || '' });
  });
}

if (semaforo.error) {
  listaAtencion.innerHTML = '';
  mostrarError(zonaTranquilidad, semaforo.error);
  iniciarRevelado();
} else {
  await pintarTodo(semaforo.data || []);
}

async function pintarTodo(filas) {
  const atencion = filas
    .filter((f) => f.estado === 'rojo' || f.estado === 'ambar')
    .sort((a, b) => a.prioridad - b.prioridad || b.dias_sin_reporte - a.dias_sin_reporte);

  const ids = atencion.map((f) => f.adopcion_id);
  const perrosVencidos = atencion.filter((f) => f.vacuna_vencida).map((f) => f.perro_id);

  const [contactos, vencidas, firmadas] = await Promise.all([
    ids.length
      ? supabase.from('contactos').select('adopcion_id, medio, creado_en').in('adopcion_id', ids).order('creado_en', { ascending: false })
      : Promise.resolve({ data: [] }),
    perrosVencidos.length
      ? supabase.from('vacunas').select('perro_id, tipo, fecha_proxima').in('perro_id', perrosVencidos)
          .eq('aplicada', false).lt('fecha_proxima', hoyISO()).order('fecha_proxima')
      : Promise.resolve({ data: [] }),
    fotosFirmadas('reportes', filas.map((f) => f.ultima_foto_ruta)),
  ]);

  const ultimoContacto = {};
  for (const c of contactos.data || []) if (!ultimoContacto[c.adopcion_id]) ultimoContacto[c.adopcion_id] = c;
  const vacunaDe = {};
  for (const v of vencidas.data || []) if (!vacunaDe[v.perro_id]) vacunaDe[v.perro_id] = v;

  pintarAtencion(atencion, ultimoContacto, vacunaDe);
  pintarGaleria(filas, firmadas);
  iniciarRevelado();
}

// ---------------------------------------------------------------------
// Lo que necesita atencion hoy
// ---------------------------------------------------------------------
function textoContacto(c) {
  if (!c) return '';
  return `Último contacto: ${haceTexto(diasDesde(c.creado_en))} por ${TEXTOS.medio[c.medio] || c.medio}`;
}

function pintarAtencion(casos, ultimoContacto, vacunaDe) {
  const hayRojos = casos.some((c) => c.estado === 'rojo');
  zonaTranquilidad.innerHTML = hayRojos ? '' : `
    <div class="estado-vacio mb-3">
      <i class="bi bi-sun" aria-hidden="true"></i>
      <strong class="d-block text-body mb-1">Hoy ninguna familia necesita una llamada.</strong>
      ${casos.length ? 'Solo hay algunas familias de las que hace tiempo no sabemos; un saludo basta.' : 'Todas las familias nos mandaron noticias hace poco. Todo va bien.'}
    </div>`;

  listaAtencion.innerHTML = casos.map((c, i) => {
    const vacuna = vacunaDe[c.perro_id];
    const motivoVacuna = c.vacuna_vencida
      ? `<p class="motivo-vacuna mb-1"><i class="bi bi-shield-exclamation" aria-hidden="true"></i> ${vacuna
          ? `Vacuna vencida: ${esc(vacuna.tipo)} (desde el ${esc(fechaCorta(vacuna.fecha_proxima))})`
          : 'Tiene una vacuna vencida'}</p>`
      : '';
    const contacto = ultimoContacto[c.adopcion_id];
    const silencio = c.dias_sin_reporte > 30 || !c.vacuna_vencida || !c.ultimo_reporte
      ? `<p class="dato-silencio mb-1">${esc(textoSilencio(c.dias_sin_reporte, Boolean(c.ultimo_reporte)))}</p>`
      : `<p class="text-suave mb-1">Su último reporte fue ${esc(haceTexto(c.dias_sin_reporte))}</p>`;
    const mensaje = mensajeWhatsApp(c.familia_nombre, c.perro_nombre, { vacunaVencida: c.vacuna_vencida });
    return `
      <li class="revelar" style="--i:${i}">
        <article class="tarjeta-semaforo semaforo-${c.estado} caso-atencion">
          <img class="foto-redonda borde-semaforo foto-caso" src="${esc(fotoPublica(c.perro_foto_ruta))}"
            alt="Foto de ${esc(c.perro_nombre)}" loading="lazy" width="112" height="112">
          <div class="min-w-0">
            <span class="insignia-semaforo mb-2">${esc(TEXTOS.semaforo[c.estado])}</span>
            <h3 class="h4 mb-1 texto-cortado">${esc(c.perro_nombre)} <span class="fw-normal text-suave fs-6">con ${esc(c.familia_nombre)}</span></h3>
            ${silencio}
            ${motivoVacuna}
            <p class="ultimo-contacto mb-0" data-contacto="${esc(c.adopcion_id)}">${esc(textoContacto(contacto))}</p>
          </div>
          <div class="acciones">
            ${c.familia_telefono ? `
            <a class="btn btn-whatsapp" href="${esc(enlaceWhatsApp(c.familia_telefono, mensaje))}" target="_blank" rel="noopener"
              data-whatsapp="${esc(c.adopcion_id)}">
              <i class="bi bi-whatsapp" aria-hidden="true"></i> Escribir a ${esc(primerNombre(c.familia_nombre))}
            </a>` : '<span class="text-suave">Sin teléfono registrado</span>'}
            <a class="btn btn-suave" href="caso.html?id=${encodeURIComponent(c.adopcion_id)}">
              <i class="bi bi-folder2-open" aria-hidden="true"></i> Ver caso
            </a>
          </div>
        </article>
      </li>`;
  }).join('');
}

// Al escribir por WhatsApp, se anota el contacto para el resto del equipo
listaAtencion.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-whatsapp]');
  if (!boton) return;
  const id = boton.dataset.whatsapp;
  const nuevo = await registrarContacto(id, perfil.id, 'whatsapp', 'Mensaje enviado desde el panel');
  if (!nuevo) return;
  const linea = listaAtencion.querySelector(`[data-contacto="${CSS.escape(id)}"]`);
  if (linea) linea.textContent = textoContacto(nuevo);
  aviso('Anotamos el mensaje para que el equipo no repita el contacto.');
});

// ---------------------------------------------------------------------
// Galeria: la foto mas reciente de cada perro, con el borde de su semaforo
// ---------------------------------------------------------------------
function pintarGaleria(filas, firmadas) {
  if (!filas.length) {
    galeria.outerHTML = `<div class="estado-vacio"><i class="bi bi-camera" aria-hidden="true"></i>Todavía no hay adopciones con seguimiento. Cuando registres una, su foto aparecerá aquí.</div>`;
    return;
  }
  const ordenadas = [...filas].sort((a, b) => String(b.ultimo_reporte || '').localeCompare(String(a.ultimo_reporte || '')));
  galeria.innerHTML = ordenadas.map((f) => {
    const firmada = f.ultima_foto_ruta && firmadas[f.ultima_foto_ruta];
    const src = firmada || fotoPublica(f.perro_foto_ruta);
    const fecha = firmada
      ? `Foto del ${fechaCorta(f.ultimo_reporte)}`
      : (f.ultimo_reporte ? `Último reporte: ${fechaCorta(f.ultimo_reporte)}` : 'Foto del catálogo; aún sin reportes');
    return `
      <li>
        <a href="caso.html?id=${encodeURIComponent(f.adopcion_id)}">
          <figure class="semaforo-${f.estado}">
            <img class="borde-semaforo" src="${esc(src)}" alt="Foto reciente de ${esc(f.perro_nombre)}" loading="lazy">
            <figcaption>
              <span class="nombre">${esc(f.perro_nombre)}</span>
              <span class="fecha">${esc(fecha)}</span>
              <span class="visually-hidden">. Estado: ${esc(TEXTOS.semaforo[f.estado])}</span>
            </figcaption>
          </figure>
        </a>
      </li>`;
  }).join('');
}
