// Inicio del adoptante: la pregunta del mes y el reporte en la misma pantalla.
// Flujo: foto (selector) + toque 1 (come bien) + toque 2 (vacunas) + toque 3
// (algun problema). El tercer toque envia directamente: no hay boton aparte.
import { supabase, fotoPublica, fotosFirmadas } from '../js/supabase.js';
import { esc, fechaLarga, diasHasta, hoyISO, mensajeError, aviso, reducirImagen, cargando } from '../js/comun.js';
import { iniciarRevelado, reduceMovimiento } from '../js/movimiento.js';
import { iniciarPortal, cargarAdopcion, primerNombre, genero, mesDe, htmlSinAdopcion, htmlErrorCarga } from './portal.js';

const vista = document.getElementById('vista');

const estado = {
  uid: null,
  adopcion: null,
  perro: null,
  archivo: null,      // foto elegida
  vistaPrevia: null,  // URL local de la foto elegida
  enviando: false,
};

async function principal() {
  const { perfil, uid } = await iniciarPortal();
  estado.uid = uid;
  const nombre = primerNombre(perfil);
  const saludo = `<p class="saludo mb-2 revelar">Hola${nombre ? `, ${esc(nombre)}` : ''}</p>`;

  let datos;
  try {
    datos = await cargarAdopcion(uid);
  } catch (e) {
    vista.innerHTML = htmlErrorCarga(mensajeError(e));
    return;
  }
  if (!datos) {
    vista.innerHTML = saludo + htmlSinAdopcion();
    iniciarRevelado();
    return;
  }
  estado.adopcion = datos.adopcion;
  estado.perro = datos.perro;

  const [rControl, rUltimo] = await Promise.all([
    supabase.from('vacunas')
      .select('tipo, fecha_proxima')
      .eq('perro_id', estado.perro.id)
      .eq('aplicada', false)
      .not('fecha_proxima', 'is', null)
      .order('fecha_proxima', { ascending: true })
      .limit(1),
    supabase.from('reportes')
      .select('id, fecha, foto_ruta')
      .eq('adopcion_id', estado.adopcion.id)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false })
      .limit(1),
  ]);
  if (rControl.error || rUltimo.error) {
    aviso(mensajeError(rControl.error || rUltimo.error), 'error');
  }
  const control = rControl.data?.[0] || null;
  const ultimo = rUltimo.data?.[0] || null;
  const yaReporto = ultimo && mesDe(ultimo.fecha) === mesDe(hoyISO());

  let fotoUltima = null;
  if (yaReporto && ultimo.foto_ruta) {
    const firmadas = await fotosFirmadas('reportes', [ultimo.foto_ruta]);
    fotoUltima = firmadas[ultimo.foto_ruta] || null;
  }

  pintar({ saludo, control, ultimo: yaReporto ? ultimo : null, fotoUltima });
}

function pintar({ saludo, control, ultimo, fotoUltima }) {
  const p = estado.perro;
  const g = genero(p);
  const nombre = esc(p.nombre);
  const fotoSrc = fotoUltima || fotoPublica(p.foto_ruta);
  const fotoAlt = fotoUltima
    ? `Última foto de ${p.nombre}, enviada el ${fechaLarga(ultimo.fecha)}`
    : `Foto de ${p.nombre}`;

  vista.innerHTML = `
    ${saludo}
    <section aria-labelledby="pregunta-mes">
      <div class="marco-foto revelar mb-4">
        <img id="foto-principal" class="foto-perro" src="${esc(fotoSrc)}" alt="${esc(fotoAlt)}">
        <span class="etiqueta-foto" id="etiqueta-foto" ${fotoUltima ? '' : 'hidden'}>
          <i class="bi bi-camera" aria-hidden="true"></i>
          <span id="texto-etiqueta">${fotoUltima ? `Su foto del ${esc(fechaLarga(ultimo.fecha).replace(/ de \d{4}$/, ''))}` : 'Tu foto de hoy'}</span>
        </span>
      </div>

      <h1 id="pregunta-mes" class="pregunta-mes mb-3 revelar">¿Cómo está ${nombre} este mes?</h1>

      ${ultimo ? `
        <div class="tarjeta-calida p-3 mb-3 d-flex gap-3 align-items-start revelar">
          <span class="icono-circulo" style="background: var(--smh-papel); color: var(--smh-verde)"><i class="bi bi-heart" aria-hidden="true"></i></span>
          <div>
            <p class="fw-bold mb-1">Ya nos contaste cómo está este mes. ¡Gracias!</p>
            <p class="mb-0">El ${esc(fechaLarga(ultimo.fecha))} supimos de ${nombre}${ultimo.foto_ruta ? ' y vimos su foto' : ''}. Si quieres compartir otra novedad, puedes hacerlo cuando gustes.</p>
          </div>
        </div>` : ''}

      <form id="form-reporte" class="revelar" novalidate>
        <input type="file" id="foto" class="selector-foto" accept="image/*" capture="environment">
        <label for="foto" class="boton-foto" id="boton-foto">
          <i class="bi bi-camera" aria-hidden="true"></i>
          <span id="texto-boton-foto">${ultimo ? 'Enviar otra foto' : `Tómale una foto a ${nombre}`}</span>
        </label>
        <div class="text-center mt-1" id="zona-sin-foto">
          <button type="button" class="enlace-discreto" id="sin-foto">Esta vez sin foto</button>
        </div>

        <div id="preguntas" class="preguntas-reporte mt-3" hidden>
          <fieldset>
            <legend>¿Come bien?</legend>
            <div class="opciones-toque">
              ${opcion('come_bien', 'si', 'bi-hand-thumbs-up', 'Sí')}
              ${opcion('come_bien', 'mas_o_menos', 'bi-dash-circle', 'Más o menos')}
              ${opcion('come_bien', 'no', 'bi-hand-thumbs-down', 'No')}
            </div>
          </fieldset>

          <fieldset>
            <legend>¿Vacunas al día?</legend>
            <div class="opciones-toque">
              ${opcion('vacunas_al_dia', 'si', 'bi-shield-check', 'Sí')}
              ${opcion('vacunas_al_dia', 'no', 'bi-shield-exclamation', 'No')}
              ${opcion('vacunas_al_dia', 'no_seguro', 'bi-question-circle', 'No estoy seguro')}
            </div>
          </fieldset>

          <details class="comentario-plegado mb-3">
            <summary><i class="bi bi-pencil" aria-hidden="true"></i> Agregar un comentario (opcional) <i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
            <label class="form-label mt-2" for="comentario">Cuéntanos algo de ${nombre}, si quieres</label>
            <textarea id="comentario" class="form-control" maxlength="500" rows="3" placeholder="Por ejemplo: ya aprendió a dar la pata."></textarea>
          </details>

          <fieldset class="mb-0">
            <legend>¿Algún problema?</legend>
            <div class="opciones-toque" id="opciones-problema">
              ${botonProblema('todo_bien', 'bi-sun', 'Todo bien')}
              ${botonProblema('tengo_duda', 'bi-chat-heart', 'Tengo una duda')}
              ${botonProblema('necesito_ayuda', 'bi-life-preserver', 'Necesito ayuda', 'opcion-ayuda')}
            </div>
            <p class="indicacion-amable" id="indicacion" aria-live="polite">
              <i class="bi bi-info-circle" aria-hidden="true"></i>
              <span id="texto-indicacion">Cuando respondas las dos preguntas de arriba, elige una opción y listo: se envía al toque.</span>
            </p>
          </fieldset>
        </div>
      </form>
    </section>

    ${htmlControl(control, g)}
  `;

  conectarFormulario();
  iniciarRevelado();
}

function opcion(nombre, valor, icono, texto) {
  const id = `${nombre}-${valor}`;
  return `
    <div class="opcion-toque">
      <input type="radio" name="${nombre}" id="${id}" value="${valor}">
      <label for="${id}"><i class="bi ${icono}" aria-hidden="true"></i>${texto}</label>
    </div>`;
}

function botonProblema(valor, icono, texto, clase = '') {
  return `
    <div class="opcion-toque">
      <button type="button" class="${clase}" data-problema="${valor}" aria-describedby="indicacion" disabled>
        <i class="bi ${icono}" aria-hidden="true"></i><span>${texto}</span>
      </button>
    </div>`;
}

function htmlControl(control, g) {
  let detalle;
  if (!control) {
    detalle = `<p class="mb-0">No hay controles pendientes por ahora. Su calendario completo está en el carnet.</p>`;
  } else {
    const dias = diasHasta(control.fecha_proxima);
    let cuando;
    if (dias > 1) cuando = `Faltan ${dias} días`;
    else if (dias === 1) cuando = 'Es mañana';
    else if (dias === 0) cuando = 'Es hoy';
    else cuando = `Estaba previsto hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}. Lléva${g.lo} apenas puedas`;
    detalle = `
      <p class="fw-semibold mb-0">${esc(control.tipo)}</p>
      <p class="text-suave mb-1">${cuando} · ${esc(fechaLarga(control.fecha_proxima))}</p>`;
  }
  return `
    <section class="card mt-4 revelar" aria-labelledby="titulo-control">
      <div class="card-body d-flex gap-3 align-items-start">
        <span class="icono-circulo"><i class="bi bi-calendar2-heart" aria-hidden="true"></i></span>
        <div class="flex-grow-1">
          <h2 id="titulo-control" class="h5 mb-1">Próximo control</h2>
          ${detalle}
          <a class="d-inline-flex align-items-center gap-1 py-2" href="carnet.html#calendario">Ver su calendario <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
        </div>
      </div>
    </section>`;
}

function conectarFormulario() {
  const form = document.getElementById('form-reporte');
  const input = document.getElementById('foto');
  const preguntas = document.getElementById('preguntas');

  form.addEventListener('submit', (e) => e.preventDefault());

  input.addEventListener('change', () => {
    const archivo = input.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/') && !/\.(heic|heif)$/i.test(archivo.name)) {
      aviso('Ese archivo no parece una foto. Prueba con otra.', 'error');
      input.value = '';
      return;
    }
    estado.archivo = archivo;
    if (estado.vistaPrevia) URL.revokeObjectURL(estado.vistaPrevia);
    estado.vistaPrevia = URL.createObjectURL(archivo);

    const img = document.getElementById('foto-principal');
    img.src = estado.vistaPrevia;
    img.alt = `Vista previa de tu foto de ${estado.perro.nombre}`;
    document.getElementById('etiqueta-foto').hidden = false;
    document.getElementById('texto-etiqueta').textContent = 'Tu foto de hoy';

    const boton = document.getElementById('boton-foto');
    boton.classList.add('con-foto');
    boton.innerHTML = `
      <img class="miniatura-reporte" style="width:44px;height:44px" src="${esc(estado.vistaPrevia)}" alt="">
      <span>Cambiar la foto</span>`;
    document.getElementById('zona-sin-foto').hidden = true;
    mostrarPreguntas();
  });

  document.getElementById('sin-foto').addEventListener('click', () => {
    document.getElementById('zona-sin-foto').hidden = true;
    mostrarPreguntas();
  });

  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') actualizarTercera();
  });

  document.getElementById('opciones-problema').addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-problema]');
    if (boton && !boton.disabled) enviar(boton.dataset.problema, boton);
  });

  function mostrarPreguntas() {
    if (!preguntas.hidden) return;
    preguntas.hidden = false;
    preguntas.classList.add('fundido');
    requestAnimationFrame(() => {
      preguntas.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
}

function respuestas() {
  return {
    come_bien: document.querySelector('input[name="come_bien"]:checked')?.value || null,
    vacunas_al_dia: document.querySelector('input[name="vacunas_al_dia"]:checked')?.value || null,
  };
}

function actualizarTercera() {
  const r = respuestas();
  const listas = Boolean(r.come_bien && r.vacunas_al_dia);
  document.querySelectorAll('#opciones-problema button').forEach((b) => { b.disabled = !listas || estado.enviando; });
  const texto = document.getElementById('texto-indicacion');
  if (listas) {
    texto.textContent = 'Elige una opción y listo: se envía al toque.';
  } else if (r.come_bien || r.vacunas_al_dia) {
    texto.textContent = r.come_bien
      ? 'Solo queda contarnos lo de las vacunas.'
      : 'Solo queda contarnos cómo está comiendo.';
  } else {
    texto.textContent = 'Cuando respondas las dos preguntas de arriba, elige una opción y listo: se envía al toque.';
  }
}

function extension(tipo) {
  return { 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heic' }[tipo] || 'jpg';
}

function aleatorio() {
  return (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36))
    .replace(/-/g, '').slice(0, 10);
}

async function enviar(problema, boton) {
  if (estado.enviando) return;
  const r = respuestas();
  if (!r.come_bien || !r.vacunas_al_dia) return;
  estado.enviando = true;
  document.querySelectorAll('#opciones-problema button').forEach((b) => { b.disabled = true; });
  cargando(boton, true, 'Enviando...');

  try {
    let fotoRuta = null;
    if (estado.archivo) {
      const reducido = await reducirImagen(estado.archivo);
      const tipo = reducido.type || 'image/jpeg';
      fotoRuta = `${estado.uid}/${hoyISO()}-${aleatorio()}.${extension(tipo)}`;
      const { error: errorFoto } = await supabase.storage
        .from('reportes')
        .upload(fotoRuta, reducido, { contentType: tipo, upsert: false });
      if (errorFoto) throw errorFoto;
    }

    const comentario = document.getElementById('comentario').value.trim() || null;
    const { data: reporte, error } = await supabase
      .from('reportes')
      .insert({
        adopcion_id: estado.adopcion.id,
        fecha: hoyISO(),
        foto_ruta: fotoRuta,
        come_bien: r.come_bien,
        vacunas_al_dia: r.vacunas_al_dia,
        problema,
        comentario,
      })
      .select()
      .single();
    if (error) throw error;

    if (problema === 'necesito_ayuda') {
      // Directo al canal de ayuda, sin preguntas adicionales
      location.href = 'ayuda.html?reporte=1';
      return;
    }
    mostrarConfirmacion(reporte);
  } catch (e) {
    estado.enviando = false;
    cargando(boton, false);
    actualizarTercera();
    aviso(mensajeError(e), 'error');
  }
}

function mostrarConfirmacion(reporte) {
  const p = estado.perro;
  const g = genero(p);
  const nombre = esc(p.nombre);
  const conFoto = Boolean(reporte.foto_ruta && estado.vistaPrevia);

  let mensaje;
  if (reporte.problema === 'tengo_duda') {
    mensaje = `Gracias por contarnos cómo está. Alguien del albergue te escribirá pronto para conversar sobre tu duda. Mientras tanto, quizás te sirva alguna de las <a href="guias.html">guías de cuidado</a>.`;
  } else {
    mensaje = conFoto
      ? `Qué bueno ver${g.lo} tan bien. Su foto ya está en su carnet, junto a las de los otros meses.`
      : `Qué bueno saber que está bien. Ya lo guardamos en su carnet.`;
  }
  const extras = [];
  if (reporte.come_bien === 'no' || reporte.come_bien === 'mas_o_menos') {
    extras.push(`Si sigue con poco apetito, en las <a href="guias.html?categoria=alimentacion">guías de alimentación</a> hay consejos de la veterinaria, y siempre puedes escribirnos.`);
  }
  if (reporte.vacunas_al_dia !== 'si') {
    extras.push(`Su <a href="carnet.html#calendario">calendario de vacunas</a> está en el carnet, por si quieres revisarlo.`);
  }

  vista.innerHTML = `
    <section class="confirmacion-reporte fundido py-3" aria-labelledby="titulo-gracias">
      <svg class="check-dibujado" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle cx="28" cy="28" r="26"></circle>
        <path d="M17 29.5l7.5 7.5L40 21"></path>
      </svg>
      <h1 id="titulo-gracias" class="h2 mb-3" tabindex="-1">Gracias por cuidar a ${nombre}</h1>
      <p class="lead mb-3">${mensaje}</p>
      ${extras.map((t) => `<p class="text-suave mb-2">${t}</p>`).join('')}
      ${conFoto ? `<img class="foto-confirmacion my-3" src="${esc(estado.vistaPrevia)}" alt="La foto de ${nombre} que acabas de enviar">` : ''}
      <div class="d-grid gap-2 col-sm-8 mx-auto mt-3">
        <a class="btn btn-primary btn-lg" href="carnet.html#galeria"><i class="bi bi-images" aria-hidden="true"></i> Ver su carnet</a>
        <a class="btn btn-suave" href="index.html"><i class="bi bi-house-heart" aria-hidden="true"></i> Volver al inicio</a>
      </div>
    </section>`;
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.getElementById('titulo-gracias').focus({ preventScroll: true });
}

principal();
