// Detalle de una adopcion: familia, perro, salud, reportes, contactos y notas.
import { supabase, fotoPublica, fotosFirmadas } from '../js/supabase.js';
import {
  esc, fechaLarga, fechaCorta, diasHasta, hoyISO, edadAprox, TEXTOS,
  mensajeError, aviso, enlaceWhatsApp, cargando,
} from '../js/comun.js';
import {
  iniciarPanel, primerNombre, diasDesde, haceTexto, textoSilencio, mensajeWhatsApp,
  enlaceTelefono, registrarContacto, mostrarError, ESTADO_ADOPCION,
} from './panel.js';

const { perfil } = await iniciarPanel('adopciones');

const id = new URLSearchParams(location.search).get('id');
const zonaError = document.getElementById('error-caso');
const caso = document.getElementById('caso');
const listaVacunas = document.getElementById('vacunas');
const formVacuna = document.getElementById('form-vacuna');
const etiquetaFecha = document.getElementById('vac-fecha-etiqueta');
const selectEstado = document.getElementById('estado-adopcion');
const confirmar = document.getElementById('confirmar-estado');
const textoConfirmar = document.getElementById('confirmar-estado-texto');

const EXPLICACION = {
  activa: 'La adopción vuelve a estar activa y el perro figurará como adoptado. Volverá a aparecer en el semáforo.',
  devuelta: 'El perro volvió al albergue: la adopción deja de estar activa y el perro figurará como devuelto. La familia ya no verá el reporte del mes.',
  cerrada: 'La adopción se cierra y deja de aparecer en el semáforo. El historial se conserva.',
};

let adopcion = null;
let semaforo = null;

if (!id) {
  zonaError.innerHTML = `<div class="estado-vacio"><i class="bi bi-search" aria-hidden="true"></i>No encontramos el caso que buscas. Vuelve al listado de adopciones y elige uno.</div>`;
} else {
  await cargarCaso();
}

async function cargarCaso() {
  const [a, s] = await Promise.all([
    supabase.from('adopciones')
      .select('*, perro:perros(*), familia:perfiles(id, nombre_completo, telefono, distrito)')
      .eq('id', id).maybeSingle(),
    supabase.from('vista_semaforo').select('*').eq('adopcion_id', id).maybeSingle(),
  ]);
  if (a.error) { mostrarError(zonaError, a.error); return; }
  if (!a.data) {
    zonaError.innerHTML = `<div class="estado-vacio"><i class="bi bi-search" aria-hidden="true"></i>No encontramos este caso. Puede que se haya borrado.</div>`;
    return;
  }
  adopcion = a.data;
  semaforo = s.data || null;
  pintarCabecera();
  pintarFamilia();
  pintarPerro();
  document.getElementById('estado-adopcion').value = adopcion.estado;
  caso.hidden = false;
  await Promise.all([cargarVacunas(), cargarReportes(), cargarContactos(), cargarNotas()]);
}

// ---------------------------------------------------------------------
// Cabecera, familia y perro
// ---------------------------------------------------------------------
function pintarCabecera() {
  const p = adopcion.perro;
  document.title = `${p.nombre} con ${adopcion.familia?.nombre_completo || 'su familia'} | Sigue mi Huella`;
  document.getElementById('caso-titulo').textContent = `${p.nombre} con ${adopcion.familia?.nombre_completo || 'su familia'}`;
  const foto = document.getElementById('caso-foto');
  foto.src = fotoPublica(p.foto_ruta);
  foto.alt = `Foto de ${p.nombre}`;
  foto.className = `foto-redonda borde-semaforo ${semaforo ? `semaforo-${semaforo.estado}` : ''}`;
  const insignias = [];
  if (semaforo) {
    insignias.push(`<span class="insignia-semaforo semaforo-${semaforo.estado}">${esc(TEXTOS.semaforo[semaforo.estado])}</span>`);
    insignias.push(`<span class="text-suave">${esc(textoSilencio(semaforo.dias_sin_reporte, Boolean(semaforo.ultimo_reporte)))}</span>`);
  } else {
    insignias.push(`<span class="badge text-bg-secondary">Adopción ${esc(ESTADO_ADOPCION[adopcion.estado].toLowerCase())}</span>`);
  }
  document.getElementById('caso-insignias').innerHTML = insignias.join('');
}

function pintarFamilia() {
  const f = adopcion.familia || {};
  const p = adopcion.perro;
  document.getElementById('familia-datos').innerHTML = `
    <p class="fw-bold fs-5 mb-1 texto-cortado">${esc(f.nombre_completo || 'Sin nombre registrado')}</p>
    <p class="mb-1"><i class="bi bi-geo-alt text-suave" aria-hidden="true"></i> ${esc(f.distrito || 'Distrito no registrado')}</p>
    <p class="mb-1"><i class="bi bi-telephone text-suave" aria-hidden="true"></i> ${esc(f.telefono || 'Sin teléfono')}</p>
    <p class="mb-0 text-suave">Adoptó el ${esc(fechaLarga(adopcion.fecha_adopcion))}</p>`;
  const contacto = document.getElementById('familia-contacto');
  if (!f.telefono) { contacto.innerHTML = ''; return; }
  const mensaje = mensajeWhatsApp(f.nombre_completo, p.nombre, { vacunaVencida: Boolean(semaforo?.vacuna_vencida) });
  contacto.innerHTML = `
    <a class="btn btn-whatsapp" href="${esc(enlaceWhatsApp(f.telefono, mensaje))}" target="_blank" rel="noopener" id="btn-whatsapp">
      <i class="bi bi-whatsapp" aria-hidden="true"></i> Escribir a ${esc(primerNombre(f.nombre_completo))}
    </a>
    <a class="btn btn-outline-primary" href="${esc(enlaceTelefono(f.telefono))}">
      <i class="bi bi-telephone" aria-hidden="true"></i> Llamar
    </a>`;
  document.getElementById('btn-whatsapp').addEventListener('click', async () => {
    const nuevo = await registrarContacto(adopcion.id, perfil.id, 'whatsapp', 'Mensaje enviado desde el panel');
    if (nuevo) { aviso('Anotamos el mensaje en los contactos.'); cargarContactos(); }
  });
}

function pintarPerro() {
  const p = adopcion.perro;
  const datos = [
    ['Código', p.codigo],
    ['Sexo', TEXTOS.sexo[p.sexo]],
    ['Tamaño', TEXTOS.tamano[p.tamano]],
    ['Edad aproximada', edadAprox(p.fecha_nacimiento_aprox) || 'Sin dato'],
    ['Esterilizado', p.esterilizado ? 'Sí' : 'No'],
    ['Rescatado', p.fecha_rescate ? fechaLarga(p.fecha_rescate) : 'Sin dato'],
  ];
  document.getElementById('perro-datos').innerHTML = `
    <dl class="row mb-0">
      ${datos.map(([k, v]) => `<dt class="col-6 fw-semibold">${esc(k)}</dt><dd class="col-6">${esc(v)}</dd>`).join('')}
    </dl>
    ${p.historia ? `<p class="mt-2 mb-0 text-suave">${esc(p.historia)}</p>` : ''}`;
}

// ---------------------------------------------------------------------
// Estado sanitario
// ---------------------------------------------------------------------
async function cargarVacunas() {
  const { data, error } = await supabase.from('vacunas').select('*').eq('perro_id', adopcion.perro.id);
  if (error) { mostrarError(listaVacunas, error); return; }
  const hoy = hoyISO();
  const vencida = (v) => !v.aplicada && v.fecha_proxima && v.fecha_proxima < hoy;
  const orden = (v) => (vencida(v) ? 0 : v.aplicada ? 2 : 1);
  const filas = (data || []).sort((a, b) => orden(a) - orden(b)
    || (orden(a) === 2
      ? String(b.fecha_aplicada || '').localeCompare(String(a.fecha_aplicada || ''))
      : String(a.fecha_proxima || '').localeCompare(String(b.fecha_proxima || ''))));

  if (!filas.length) {
    listaVacunas.innerHTML = `<li class="estado-vacio"><i class="bi bi-shield" aria-hidden="true"></i>Aún no hay vacunas registradas para ${esc(adopcion.perro.nombre)}.</li>`;
    return;
  }
  listaVacunas.innerHTML = filas.map((v) => {
    let detalle;
    let clase = 'border';
    if (vencida(v)) {
      const dias = -diasHasta(v.fecha_proxima);
      detalle = `<strong>Vencida</strong> desde el ${esc(fechaCorta(v.fecha_proxima))} (hace ${dias} ${dias === 1 ? 'día' : 'días'})`;
      clase = 'vacuna-vencida';
    } else if (!v.aplicada) {
      const dias = v.fecha_proxima ? diasHasta(v.fecha_proxima) : null;
      detalle = v.fecha_proxima
        ? `Le toca el ${esc(fechaCorta(v.fecha_proxima))} (${dias === 0 ? 'hoy' : `faltan ${dias} ${dias === 1 ? 'día' : 'días'}`})`
        : 'Pendiente, sin fecha';
    } else {
      detalle = `Aplicada${v.fecha_aplicada ? ` el ${esc(fechaCorta(v.fecha_aplicada))}` : ''}`;
    }
    const icono = vencida(v) ? 'bi-shield-exclamation' : v.aplicada ? 'bi-shield-check' : 'bi-calendar-event';
    return `
      <li class="${clase} rounded-4 p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
        <div class="min-w-0">
          <p class="fw-bold mb-0 titulo-vacuna"><i class="bi ${icono}" aria-hidden="true"></i> ${esc(v.tipo)}</p>
          <p class="mb-0">${detalle}</p>
        </div>
        ${v.aplicada ? '' : `<button class="btn btn-suave btn-sm" type="button" data-aplicar="${esc(v.id)}"><i class="bi bi-check2" aria-hidden="true"></i> Marcar como aplicada</button>`}
      </li>`;
  }).join('');
}

listaVacunas.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-aplicar]');
  if (!boton) return;
  cargando(boton, true, 'Guardando...');
  const { error } = await supabase.from('vacunas')
    .update({ aplicada: true, fecha_aplicada: hoyISO() })
    .eq('id', boton.dataset.aplicar);
  if (error) { cargando(boton, false); aviso(mensajeError(error), 'error'); return; }
  aviso('Vacuna marcada como aplicada hoy.');
  cargarVacunas();
});

formVacuna.addEventListener('change', (e) => {
  if (e.target.name === 'vac-situacion') {
    etiquetaFecha.textContent = e.target.value === 'aplicada' ? 'Fecha en que se aplicó' : 'Fecha en que le toca';
  }
});
formVacuna.addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = document.getElementById('vac-error');
  const tipo = document.getElementById('vac-tipo').value.trim();
  const fecha = document.getElementById('vac-fecha').value;
  const aplicada = formVacuna.querySelector('[name="vac-situacion"]:checked').value === 'aplicada';
  if (!tipo) { error.textContent = 'Escribe qué vacuna o tratamiento es.'; return; }
  if (!fecha) { error.textContent = 'Elige la fecha.'; return; }
  error.textContent = '';
  const boton = formVacuna.querySelector('[type="submit"]');
  cargando(boton, true, 'Guardando...');
  const { error: err } = await supabase.from('vacunas').insert({
    perro_id: adopcion.perro.id,
    tipo,
    aplicada,
    fecha_aplicada: aplicada ? fecha : null,
    fecha_proxima: aplicada ? null : fecha,
  });
  cargando(boton, false);
  if (err) { error.textContent = mensajeError(err); return; }
  formVacuna.reset();
  etiquetaFecha.textContent = 'Fecha en que le toca';
  aviso('Vacuna guardada.');
  cargarVacunas();
});

// ---------------------------------------------------------------------
// Reportes en linea de tiempo
// ---------------------------------------------------------------------
async function cargarReportes() {
  const zona = document.getElementById('reportes');
  const { data, error } = await supabase.from('reportes').select('*')
    .eq('adopcion_id', adopcion.id)
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false });
  if (error) { mostrarError(zona, error); return; }
  if (!data.length) {
    zona.innerHTML = `<div class="estado-vacio"><i class="bi bi-camera" aria-hidden="true"></i>La familia todavía no ha enviado reportes desde la entrega. Un saludo cordial suele bastar para empezar.</div>`;
    return;
  }
  const firmadas = await fotosFirmadas('reportes', data.map((r) => r.foto_ruta));
  const nombre = adopcion.perro.nombre;
  zona.innerHTML = `<ol class="linea-tiempo">${data.map((r) => {
    const foto = r.foto_ruta && firmadas[r.foto_ruta];
    const alerta = r.problema !== 'todo_bien' || r.come_bien !== 'si' || r.vacunas_al_dia !== 'si';
    return `
      <li>
        <p class="fw-bold mb-2">${esc(fechaLarga(r.fecha))} <span class="fw-normal text-suave">· ${esc(haceTexto(diasDesde(r.fecha)))}</span></p>
        ${foto ? `<img class="foto-reporte mb-2" src="${esc(foto)}" alt="Foto de ${esc(nombre)} enviada el ${esc(fechaLarga(r.fecha))}" loading="lazy">` : '<p class="text-suave mb-2">Reporte sin foto</p>'}
        <ul class="list-inline mb-1">
          <li class="list-inline-item ${r.come_bien === 'si' ? 'etiqueta-reporte' : 'etiqueta-reporte atencion'}">${esc(TEXTOS.come_bien[r.come_bien])}</li>
          <li class="list-inline-item ${r.vacunas_al_dia === 'si' ? 'etiqueta-reporte' : 'etiqueta-reporte atencion'}">${esc(TEXTOS.vacunas_al_dia[r.vacunas_al_dia])}</li>
          <li class="list-inline-item ${r.problema === 'todo_bien' ? 'etiqueta-reporte' : 'etiqueta-reporte atencion'}">${esc(TEXTOS.problema[r.problema])}</li>
        </ul>
        ${r.comentario ? `<p class="mb-0"><i class="bi bi-chat-left-quote text-suave" aria-hidden="true"></i> «${esc(r.comentario)}»</p>` : ''}
        ${alerta ? '<p class="small text-suave mb-0">Vale la pena conversar con la familia sobre este reporte.</p>' : ''}
      </li>`;
  }).join('')}</ol>`;
}

// ---------------------------------------------------------------------
// Contactos
// ---------------------------------------------------------------------
async function cargarContactos() {
  const lista = document.getElementById('contactos');
  const { data, error } = await supabase.from('contactos')
    .select('*, autor:perfiles(nombre_completo)')
    .eq('adopcion_id', adopcion.id)
    .order('creado_en', { ascending: false });
  if (error) { mostrarError(lista, error); return; }
  if (!data.length) {
    lista.innerHTML = '<li class="text-suave">Todavía no se ha anotado ningún contacto con esta familia.</li>';
    return;
  }
  const iconos = { whatsapp: 'bi-whatsapp', llamada: 'bi-telephone', visita: 'bi-house-door', otro: 'bi-chat-dots' };
  lista.innerHTML = data.map((c) => `
    <li class="border rounded-4 p-3">
      <p class="fw-semibold mb-1"><i class="bi ${iconos[c.medio] || 'bi-chat-dots'}" aria-hidden="true"></i> ${esc(TEXTOS.medio[c.medio] || c.medio)}
        <span class="fw-normal text-suave">· ${esc(fechaCorta(c.creado_en))} (${esc(haceTexto(diasDesde(c.creado_en)))}) · ${esc(c.autor?.nombre_completo || 'Equipo del albergue')}</span></p>
      <p class="mb-0">${esc(c.resultado || 'Sin detalle')}</p>
    </li>`).join('');
}

document.getElementById('form-contacto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = document.getElementById('contacto-error');
  const resultado = document.getElementById('contacto-resultado').value.trim();
  if (!resultado) { error.textContent = 'Cuéntanos en pocas palabras cómo fue.'; return; }
  error.textContent = '';
  const boton = e.target.querySelector('[type="submit"]');
  cargando(boton, true, 'Guardando...');
  const nuevo = await registrarContacto(adopcion.id, perfil.id, document.getElementById('contacto-medio').value, resultado);
  cargando(boton, false);
  if (!nuevo) return;
  e.target.reset();
  aviso('Contacto anotado.');
  cargarContactos();
});

// ---------------------------------------------------------------------
// Notas internas
// ---------------------------------------------------------------------
async function cargarNotas() {
  const lista = document.getElementById('notas');
  const { data, error } = await supabase.from('notas_internas')
    .select('*, autor:perfiles(nombre_completo)')
    .eq('adopcion_id', adopcion.id)
    .order('creado_en', { ascending: false });
  if (error) { mostrarError(lista, error); return; }
  if (!data.length) {
    lista.innerHTML = '<li class="text-suave">Aún no hay notas sobre esta adopción.</li>';
    return;
  }
  lista.innerHTML = data.map((n) => `
    <li class="border rounded-4 p-3 bg-white">
      <p class="mb-1" style="white-space: pre-line">${esc(n.texto)}</p>
      <p class="small text-suave mb-0">${esc(n.autor?.nombre_completo || 'Equipo del albergue')} · ${esc(fechaCorta(n.creado_en))}</p>
    </li>`).join('');
}

document.getElementById('form-nota').addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = document.getElementById('nota-error');
  const texto = document.getElementById('nota-texto').value.trim();
  if (!texto) { error.textContent = 'Escribe la nota antes de guardarla.'; return; }
  error.textContent = '';
  const boton = e.target.querySelector('[type="submit"]');
  cargando(boton, true, 'Guardando...');
  const { error: err } = await supabase.from('notas_internas')
    .insert({ adopcion_id: adopcion.id, autor_id: perfil.id, texto });
  cargando(boton, false);
  if (err) { error.textContent = mensajeError(err); return; }
  e.target.reset();
  aviso('Nota guardada.');
  cargarNotas();
});

// ---------------------------------------------------------------------
// Cambio de estado con confirmacion dentro de la pagina
// ---------------------------------------------------------------------
document.getElementById('btn-cambiar-estado').addEventListener('click', () => {
  const nuevo = selectEstado.value;
  if (nuevo === adopcion.estado) { aviso('La adopción ya tiene ese estado.'); return; }
  textoConfirmar.innerHTML = `¿Cambiar la adopción de <strong>${esc(adopcion.perro.nombre)}</strong> a <strong>${esc(ESTADO_ADOPCION[nuevo].toLowerCase())}</strong>? ${esc(EXPLICACION[nuevo])}`;
  confirmar.hidden = false;
  document.getElementById('btn-confirmar-estado').focus();
});

document.getElementById('btn-cancelar-estado').addEventListener('click', () => {
  confirmar.hidden = true;
  selectEstado.value = adopcion.estado;
  selectEstado.focus();
});

document.getElementById('btn-confirmar-estado').addEventListener('click', async (e) => {
  const nuevo = selectEstado.value;
  const boton = e.currentTarget;
  cargando(boton, true, 'Guardando...');
  const { error } = await supabase.from('adopciones').update({ estado: nuevo }).eq('id', adopcion.id);
  if (error) { cargando(boton, false); aviso(mensajeError(error), 'error'); return; }
  const estadoPerro = nuevo === 'devuelta' ? 'devuelto' : nuevo === 'activa' ? 'adoptado' : null;
  if (estadoPerro) {
    const { error: errPerro } = await supabase.from('perros').update({ estado: estadoPerro }).eq('id', adopcion.perro.id);
    if (errPerro) aviso('El estado de la adopción cambió, pero no pudimos actualizar al perro en el catálogo.', 'error');
  }
  cargando(boton, false);
  confirmar.hidden = true;
  aviso('Estado de la adopción actualizado.');
  await cargarCaso();
});
