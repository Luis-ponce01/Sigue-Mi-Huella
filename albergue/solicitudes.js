// Solicitudes del canal de ayuda, con la accion sugerida segun el motivo.
import { supabase, fotoPublica } from '../js/supabase.js';
import { esc, fechaLarga, TEXTOS, mensajeError, aviso, enlaceWhatsApp } from '../js/comun.js';
import { ALBERGUE } from '../js/config.js';
import { iniciarPanel, primerNombre, diasDesde, haceTexto, mostrarError, registrarContacto } from './panel.js';

const { perfil } = await iniciarPanel('solicitudes');
const zona = document.getElementById('solicitudes');

const ACCION = {
  conducta: {
    icono: 'bi-heart-pulse',
    texto: 'Derivar a la Clínica Veterinaria Lobo Gris para una orientación de conducta. Muchas veces bastan unos consejos y una rutina nueva.',
  },
  dinero: {
    icono: 'bi-basket',
    texto: 'Ofrecer apoyo con alimento del fondo de padrinos y recordarle los descuentos de nuestros aliados en vacunas y alimento.',
  },
  mudanza: {
    icono: 'bi-truck',
    texto: 'Conversar para planificar el traslado junto con el perro o, si no es posible, buscar con tiempo una nueva familia.',
  },
  no_puedo_seguir: {
    icono: 'bi-arrow-repeat',
    texto: 'Coordinar una devolución responsable, sin juicio. Agradecer que avisó a tiempo: eso protege al perro.',
  },
};

const MENSAJE = {
  conducta: (n, p) => `Hola, ${n}. Somos de ${ALBERGUE.nombre}. Recibimos tu mensaje sobre ${p}. Esto le pasa a muchas familias y tiene solución: ¿te parece si coordinamos una orientación con la Clínica Lobo Gris?`,
  dinero: (n, p) => `Hola, ${n}. Somos de ${ALBERGUE.nombre}. Gracias por avisarnos. Queremos ayudarte con ${p}: podemos apoyarte con alimento y contarte los descuentos de nuestros aliados. ¿Cuándo podemos conversar?`,
  mudanza: (n, p) => `Hola, ${n}. Somos de ${ALBERGUE.nombre}. Gracias por contarnos lo de la mudanza. Queremos ayudarte a planificar lo mejor para ${p}. ¿Cuándo podemos conversar?`,
  no_puedo_seguir: (n, p) => `Hola, ${n}. Somos de ${ALBERGUE.nombre}. Gracias por avisarnos a tiempo, de verdad. Vamos a coordinar juntos lo mejor para ${p}, sin ningún apuro. ¿Cuándo podemos conversar?`,
};

const ORDEN_ESTADO = { nueva: 0, en_proceso: 1, resuelta: 2 };
let solicitudes = [];

const { data, error } = await supabase
  .from('solicitudes_ayuda')
  .select('*, adopcion:adopciones(id, perro:perros(nombre, foto_ruta), familia:perfiles(nombre_completo, telefono, distrito))')
  .order('creado_en', { ascending: false });

if (error) {
  mostrarError(zona, error);
} else {
  solicitudes = data || [];
  pintar();
}

function pintar() {
  if (!solicitudes.length) {
    zona.innerHTML = `<div class="estado-vacio"><i class="bi bi-sun" aria-hidden="true"></i>No hay solicitudes de ayuda. Cuando una familia pida una mano, aparecerá aquí.</div>`;
    return;
  }
  const ordenadas = [...solicitudes].sort((a, b) =>
    ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || String(b.creado_en).localeCompare(String(a.creado_en)));

  zona.innerHTML = ordenadas.map((s) => {
    const familia = s.adopcion?.familia || {};
    const perro = s.adopcion?.perro || {};
    const accion = ACCION[s.motivo];
    const clase = s.estado === 'nueva' ? 'border-primary' : '';
    const mensaje = MENSAJE[s.motivo]?.(primerNombre(familia.nombre_completo), perro.nombre || 'tu perro') || '';
    return `
      <article class="card ${clase}" aria-labelledby="sol-${esc(s.id)}">
        <div class="card-body">
          <div class="d-flex flex-wrap gap-3 align-items-start">
            <img class="foto-redonda" src="${esc(fotoPublica(perro.foto_ruta))}" alt="Foto de ${esc(perro.nombre || 'el perro')}" width="72" height="72" loading="lazy">
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                ${s.estado === 'nueva' ? '<span class="badge text-bg-primary">Nueva</span>' : ''}
                <span class="fw-semibold texto-terracota"><i class="bi ${accion?.icono || 'bi-life-preserver'}" aria-hidden="true"></i> ${esc(TEXTOS.motivo[s.motivo] || s.motivo)}</span>
              </div>
              <h2 class="h4 mb-1 texto-cortado" id="sol-${esc(s.id)}">${esc(familia.nombre_completo || 'Familia')} <span class="fw-normal text-suave fs-6">con ${esc(perro.nombre || 'su perro')}</span></h2>
              <p class="text-suave mb-0">${esc(fechaLarga(s.creado_en))} · ${esc(haceTexto(diasDesde(s.creado_en)))}${familia.distrito ? ` · ${esc(familia.distrito)}` : ''}</p>
            </div>
          </div>

          ${s.detalle ? `<p class="mt-3 mb-0"><i class="bi bi-chat-left-quote text-suave" aria-hidden="true"></i> «${esc(s.detalle)}»</p>` : '<p class="mt-3 mb-0 text-suave">La familia no dejó detalle, y está bien así.</p>'}

          ${accion ? `<div class="accion-sugerida mt-3"><p class="fw-bold mb-1">Qué podemos hacer</p><p class="mb-0">${esc(accion.texto)}</p></div>` : ''}

          <div class="row g-3 align-items-end mt-1">
            <div class="col-sm-6 col-lg-4">
              <label class="form-label" for="estado-${esc(s.id)}">Estado</label>
              <select class="form-select" id="estado-${esc(s.id)}" data-solicitud="${esc(s.id)}">
                ${Object.entries(TEXTOS.estado_solicitud).map(([v, t]) => `<option value="${v}"${v === s.estado ? ' selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="col-sm-6 col-lg-8 d-flex flex-wrap gap-2 justify-content-lg-end">
              ${familia.telefono ? `<a class="btn btn-whatsapp" href="${esc(enlaceWhatsApp(familia.telefono, mensaje))}" target="_blank" rel="noopener" data-whatsapp="${esc(s.adopcion?.id || '')}"><i class="bi bi-whatsapp" aria-hidden="true"></i> Escribir</a>` : ''}
              ${s.adopcion?.id ? `<a class="btn btn-suave" href="caso.html?id=${encodeURIComponent(s.adopcion.id)}"><i class="bi bi-folder2-open" aria-hidden="true"></i> Ver caso</a>` : ''}
            </div>
          </div>
          ${s.estado === 'resuelta' && s.resuelto_en ? `<p class="small text-suave mt-2 mb-0">Resuelta el ${esc(fechaLarga(s.resuelto_en))}</p>` : ''}
        </div>
      </article>`;
  }).join('');
}

zona.addEventListener('change', async (e) => {
  const select = e.target.closest('[data-solicitud]');
  if (!select) return;
  const id = select.dataset.solicitud;
  const estado = select.value;
  const cambios = { estado, resuelto_en: estado === 'resuelta' ? new Date().toISOString() : null };
  select.disabled = true;
  const { error: err } = await supabase.from('solicitudes_ayuda').update(cambios).eq('id', id);
  select.disabled = false;
  if (err) {
    aviso(mensajeError(err), 'error');
    select.value = solicitudes.find((s) => s.id === id)?.estado || 'nueva';
    return;
  }
  const s = solicitudes.find((x) => x.id === id);
  if (s) Object.assign(s, cambios);
  aviso(estado === 'resuelta' ? 'Solicitud marcada como resuelta.' : 'Estado actualizado.');
  pintar();
  const contador = document.getElementById('contador-solicitudes');
  if (contador) {
    const nuevas = solicitudes.filter((x) => x.estado === 'nueva').length;
    contador.textContent = nuevas;
    contador.setAttribute('aria-label', `${nuevas} ${nuevas === 1 ? 'nueva' : 'nuevas'}`);
    contador.hidden = nuevas === 0;
  }
  document.getElementById(`estado-${id}`)?.focus();
});

zona.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-whatsapp]');
  if (boton?.dataset.whatsapp) {
    registrarContacto(boton.dataset.whatsapp, perfil.id, 'whatsapp', 'Mensaje enviado desde solicitudes de ayuda');
  }
});
