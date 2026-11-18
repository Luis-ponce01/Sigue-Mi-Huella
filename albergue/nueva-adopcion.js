// Registro de una adopcion nueva en tres pasos: perro, familia y acta firmada.
import { supabase, fotoPublica, ruta } from '../js/supabase.js';
import { esc, fechaLarga, hoyISO, edadAprox, TEXTOS, mensajeError, cargando } from '../js/comun.js';
import { ALBERGUE } from '../js/config.js';
import { iniciarPanel } from './panel.js';

const { perfil } = await iniciarPanel('nueva');

const form = document.getElementById('form-adopcion');
const selectPerro = document.getElementById('perro');
const perroElegido = document.getElementById('perro-elegido');
const campos = {
  nombre: document.getElementById('fam-nombre'),
  dni: document.getElementById('fam-dni'),
  telefono: document.getElementById('fam-telefono'),
  correo: document.getElementById('fam-correo'),
  distrito: document.getElementById('fam-distrito'),
};

let perros = [];
let pasoActual = 1;

// Lo ya guardado, para que un reintento no repita pasos completados
const progreso = { adoptante: null, correo: null, adopcion: null, firma: false, perro: false };

// ---------------------------------------------------------------------
// Paso 1: perros disponibles
// ---------------------------------------------------------------------
const { data: lista, error: errPerros } = await supabase
  .from('perros')
  .select('id, codigo, nombre, sexo, tamano, fecha_nacimiento_aprox, esterilizado, estado, foto_ruta')
  .in('estado', ['en_albergue', 'en_adopcion'])
  .order('nombre');

if (errPerros) {
  selectPerro.innerHTML = '<option value="">No se pudieron cargar los perros</option>';
  mostrarErrorPaso(1, mensajeError(errPerros));
} else {
  perros = lista || [];
  if (!perros.length) {
    selectPerro.innerHTML = '<option value="">No hay perros disponibles</option>';
    mostrarErrorPaso(1, 'No hay perros en el albergue ni buscando hogar. Agrégalos o cambia su estado en la sección Perros.');
  } else {
    selectPerro.innerHTML = '<option value="">Elige el perro que se entrega</option>' + perros.map((p) =>
      `<option value="${esc(p.id)}">${esc(p.nombre)} (${esc(p.codigo)})${p.estado === 'en_albergue' ? ' · en el albergue' : ''}</option>`).join('');
    const preseleccion = new URLSearchParams(location.search).get('perro');
    if (preseleccion && perros.some((p) => p.id === preseleccion)) { selectPerro.value = preseleccion; pintarPerro(); }
  }
}

function perroSeleccionado() {
  return perros.find((p) => p.id === selectPerro.value) || null;
}

function pintarPerro() {
  const p = perroSeleccionado();
  if (!p) { perroElegido.hidden = true; perroElegido.innerHTML = ''; return; }
  perroElegido.innerHTML = `
    <img class="foto-redonda" src="${esc(fotoPublica(p.foto_ruta))}" alt="Foto de ${esc(p.nombre)}" width="120" height="120">
    <div class="min-w-0">
      <p class="h4 mb-1">${esc(p.nombre)}</p>
      <p class="mb-0 text-suave">${esc(TEXTOS.sexo[p.sexo] || '')} · ${esc(TEXTOS.tamano[p.tamano] || '')}${p.fecha_nacimiento_aprox ? ` · ${esc(edadAprox(p.fecha_nacimiento_aprox))}` : ''}</p>
      <p class="mb-0 text-suave">${p.esterilizado ? 'Esterilizado' : 'Sin esterilizar'} · Código ${esc(p.codigo)}</p>
    </div>`;
  perroElegido.hidden = false;
}

selectPerro.addEventListener('change', () => { pintarPerro(); ocultarErrorPaso(1); });

// ---------------------------------------------------------------------
// Navegacion entre pasos con validacion
// ---------------------------------------------------------------------
function mostrarErrorPaso(n, texto) {
  const el = document.getElementById(`error-paso-${n}`);
  el.innerHTML = `<i class="bi bi-exclamation-circle" aria-hidden="true"></i> ${esc(texto)}`;
  el.hidden = false;
}
function ocultarErrorPaso(n) { document.getElementById(`error-paso-${n}`).hidden = true; }

function marcar(campo, invalido) {
  campo.classList.toggle('is-invalid', invalido);
  campo.setAttribute('aria-invalid', invalido ? 'true' : 'false');
}

const soloDigitos = (t) => String(t || '').replace(/\D/g, '');
function telefonoNormalizado(t) {
  let d = soloDigitos(t);
  if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
  return d;
}

function validarPaso(n) {
  if (n === 1) {
    marcar(selectPerro, !selectPerro.value);
    if (!selectPerro.value) return [selectPerro, 'Elige el perro que se entrega para continuar.'];
    return null;
  }
  if (n === 2) {
    Object.values(campos).forEach((c) => marcar(c, false));
    const nombre = campos.nombre.value.trim();
    const dni = campos.dni.value.trim();
    const tel = telefonoNormalizado(campos.telefono.value);
    const correo = campos.correo.value.trim();
    const distrito = campos.distrito.value.trim();
    if (nombre.length < 3 || !nombre.includes(' ')) return [campos.nombre, 'Escribe el nombre completo de la persona que adopta (nombre y apellido).'];
    if (dni && !/^\d{8}$/.test(dni)) return [campos.dni, 'El DNI debe tener 8 números. Si no lo tienes a mano, puedes dejarlo vacío.'];
    if (!/^9\d{8}$/.test(tel)) return [campos.telefono, 'Escribe un celular de 9 dígitos que empiece con 9, por ejemplo 987 654 321.'];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return [campos.correo, 'Revisa el correo: debe tener la forma nombre@ejemplo.com.'];
    if (distrito.length < 3) return [campos.distrito, 'Escribe o elige el distrito donde vivirá el perro.'];
    return null;
  }
  if (n === 3) {
    const faltan = [...form.querySelectorAll('[data-compromiso]')].filter((c) => !c.checked);
    if (faltan.length) return [faltan[0], faltan.length === 1
      ? 'Falta aceptar un compromiso del acta. Léanlo juntos y marquen la casilla.'
      : `Faltan aceptar ${faltan.length} compromisos del acta. Cada uno se marca por separado.`];
    const datos = document.getElementById('acepta-datos');
    if (!datos.checked) return [datos, 'Para registrar la adopción, la familia debe dar su consentimiento para el tratamiento de sus datos personales.'];
    if (!firma.tieneFirma()) return [lienzo, 'Falta la firma. Pide a la familia que firme dentro del recuadro.'];
    return null;
  }
  return null;
}

function irAPaso(n) {
  pasoActual = n;
  [1, 2, 3].forEach((i) => {
    document.getElementById(`paso-${i}`).hidden = i !== n;
    const ind = document.querySelector(`[data-indicador-paso="${i}"]`);
    ind.classList.toggle('hecho', i < n);
    if (i === n) ind.setAttribute('aria-current', 'step'); else ind.removeAttribute('aria-current');
  });
  if (n === 3) { pintarActa(); firma.ajustar(); }
  const titulo = document.getElementById(`t-paso-${n}`);
  titulo.focus({ preventScroll: true });
  titulo.closest('section').scrollIntoView({ block: 'start', behavior: 'auto' });
  window.scrollBy(0, -80);
}

form.addEventListener('click', (e) => {
  const sig = e.target.closest('[data-siguiente]');
  const ant = e.target.closest('[data-anterior]');
  if (sig) {
    const problema = validarPaso(pasoActual);
    if (problema) { mostrarErrorPaso(pasoActual, problema[1]); problema[0].focus(); return; }
    ocultarErrorPaso(pasoActual);
    irAPaso(Number(sig.dataset.siguiente));
  } else if (ant) {
    ocultarErrorPaso(pasoActual);
    irAPaso(Number(ant.dataset.anterior));
  }
});

form.addEventListener('input', (e) => {
  if (e.target.classList.contains('is-invalid')) marcar(e.target, false);
});

// ---------------------------------------------------------------------
// Texto del acta (pantalla e impresion usan el mismo)
// ---------------------------------------------------------------------
function datosFamilia() {
  return {
    nombre: campos.nombre.value.trim().replace(/\s+/g, ' '),
    dni: campos.dni.value.trim(),
    telefono: telefonoNormalizado(campos.telefono.value).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
    correo: campos.correo.value.trim().toLowerCase(),
    distrito: campos.distrito.value.trim(),
  };
}

function htmlClausula(p, f, fecha) {
  return `
    <p>En Huancayo, el ${esc(fechaLarga(fecha))}, el albergue <strong>${esc(ALBERGUE.nombre)}</strong> entrega en adopción a
      <strong>${esc(p.nombre)}</strong> (código ${esc(p.codigo)}) a <strong>${esc(f.nombre)}</strong>${f.dni ? `, con DNI ${esc(f.dni)}` : ''},
      quien vivirá con el perro en el distrito de ${esc(f.distrito)}.</p>
    <p class="fw-semibold mb-1">Cláusula de seguimiento. La familia adoptante se compromete a:</p>
    <ol>
      <li>Enviar cada mes un reporte con una foto de ${esc(p.nombre)} a través de Sigue mi Huella: una foto y tres preguntas.</li>
      <li>Mantener al día su calendario sanitario de vacunas y desparasitaciones.</li>
      <li>Avisar al albergue antes de ceder o devolver a ${esc(p.nombre)}, para buscar juntos la mejor salida.</li>
    </ol>
    <p class="mb-0">Por su parte, ${esc(ALBERGUE.nombre)} se compromete a acompañar y orientar a la familia: responder sus dudas, recordarle las fechas de vacunas, conectarla con la veterinaria aliada y ayudarla si atraviesa una dificultad. Este seguimiento es un acompañamiento, no una fiscalización.</p>`;
}

function textoConsentimiento(f) {
  return `Yo, ${f.nombre || 'la persona que adopta'}, autorizo a ${ALBERGUE.nombre} a tratar mis datos personales (nombre, correo, celular, distrito y las fotos y respuestas que envíe) con la única finalidad de acompañar esta adopción, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento. Sé que puedo ejercer en cualquier momento mis derechos de acceso, rectificación, cancelación y oposición.`;
}

function pintarActa() {
  const p = perroSeleccionado();
  const f = datosFamilia();
  if (!p) return;
  document.getElementById('texto-acta').innerHTML = `<h3 class="h5">Acta de adopción con cláusula de seguimiento</h3>${htmlClausula(p, f, hoyISO())}`;
  document.getElementById('texto-consentimiento').textContent = textoConsentimiento(f);
  document.querySelectorAll('[data-nombre-perro]').forEach((el) => { el.textContent = p.nombre; });
}

// ---------------------------------------------------------------------
// Firma en canvas: pointer events, ajuste a devicePixelRatio
// Los trazos se guardan en coordenadas relativas (0 a 1) para redibujarlos
// sin deformarse si cambia el tamano del recuadro.
// ---------------------------------------------------------------------
const lienzo = document.getElementById('lienzo-firma');
const estadoFirma = document.getElementById('estado-firma');

const firma = (() => {
  const ctx = lienzo.getContext('2d');
  let trazos = [];
  let actual = null;
  let ancho = 0;
  let alto = 0;

  function estilo() {
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c1410';
    ctx.fillStyle = '#1c1410';
  }

  function redibujar() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.restore();
    estilo();
    for (const t of trazos) dibujarTrazo(t);
  }

  function dibujarTrazo(t) {
    if (!t.length) return;
    if (t.length === 1) {
      ctx.beginPath();
      ctx.arc(t[0].x * ancho, t[0].y * alto, 1.4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(t[0].x * ancho, t[0].y * alto);
    for (let i = 1; i < t.length; i++) ctx.lineTo(t[i].x * ancho, t[i].y * alto);
    ctx.stroke();
  }

  function ajustar() {
    const r = lienzo.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = window.devicePixelRatio || 1;
    ancho = r.width;
    alto = r.height;
    lienzo.width = Math.round(r.width * dpr);
    lienzo.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redibujar();
  }

  function punto(e) {
    const r = lienzo.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function actualizarEstado() {
    estadoFirma.textContent = tieneFirma() ? 'Firma lista' : 'Aún sin firma';
    if (tieneFirma()) ocultarErrorPaso(3);
  }

  function tieneFirma() {
    return trazos.reduce((n, t) => n + t.length, 0) >= 6;
  }

  lienzo.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    lienzo.setPointerCapture?.(e.pointerId);
    actual = [punto(e)];
    trazos.push(actual);
    estilo();
    dibujarTrazo(actual);
  });

  lienzo.addEventListener('pointermove', (e) => {
    if (!actual) return;
    e.preventDefault();
    const eventos = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const previo = actual[actual.length - 1];
    for (const ev of (eventos.length ? eventos : [e])) actual.push(punto(ev));
    ctx.beginPath();
    ctx.moveTo(previo.x * ancho, previo.y * alto);
    for (let i = actual.indexOf(previo) + 1; i < actual.length; i++) ctx.lineTo(actual[i].x * ancho, actual[i].y * alto);
    ctx.stroke();
  });

  const terminar = () => { if (actual) { actual = null; actualizarEstado(); } };
  lienzo.addEventListener('pointerup', terminar);
  lienzo.addEventListener('pointercancel', terminar);
  lienzo.addEventListener('lostpointercapture', terminar);

  if ('ResizeObserver' in window) new ResizeObserver(() => ajustar()).observe(lienzo);
  else window.addEventListener('resize', ajustar);

  function borrar() { trazos = []; actual = null; redibujar(); actualizarEstado(); }

  // Imagen final con fondo blanco, para que se vea bien en cualquier visor
  function aBlob() {
    const salida = document.createElement('canvas');
    salida.width = lienzo.width;
    salida.height = lienzo.height;
    const c = salida.getContext('2d');
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, salida.width, salida.height);
    c.drawImage(lienzo, 0, 0);
    return new Promise((resolver) => salida.toBlob((b) => resolver({ blob: b, url: salida.toDataURL('image/png') }), 'image/png'));
  }

  return { ajustar, borrar, tieneFirma, aBlob };
})();

document.getElementById('btn-borrar-firma').addEventListener('click', () => firma.borrar());

// ---------------------------------------------------------------------
// Guardar: cuenta de la familia, adopcion, firma y perro
// ---------------------------------------------------------------------
const MENSAJES_FUNCION = {
  sin_sesion: 'Tu sesión venció. Vuelve a ingresar e inténtalo otra vez.',
  sin_permiso: 'Tu cuenta no tiene permiso para registrar adopciones.',
  datos_invalidos: 'Revisa el nombre y el correo de la familia en el paso 2.',
  no_se_pudo_crear: 'No pudimos crear la cuenta de la familia con ese correo. Revísalo en el paso 2.',
};

async function crearAdoptante(f) {
  const { data, error } = await supabase.functions.invoke('crear-adoptante', {
    body: { correo: f.correo, nombre_completo: f.nombre, telefono: f.telefono, distrito: f.distrito },
  });
  let codigo = data?.error;
  if (!codigo && error?.context && typeof error.context.json === 'function') {
    try { codigo = (await error.context.json())?.error; } catch { /* respuesta sin cuerpo JSON */ }
  }
  if (codigo || error || !data?.id) {
    throw new Error(MENSAJES_FUNCION[codigo] || mensajeError(error || codigo));
  }
  return data;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (pasoActual !== 3) return;
  // Se revalidan todos los pasos por si algo cambio
  for (const n of [1, 2, 3]) {
    const problema = validarPaso(n);
    if (problema) {
      if (n !== 3) irAPaso(n);
      mostrarErrorPaso(n, problema[1]);
      problema[0].focus();
      problema[0].scrollIntoView({ block: 'center' });
      return;
    }
  }
  ocultarErrorPaso(3);

  const p = perroSeleccionado();
  const f = datosFamilia();
  const boton = document.getElementById('btn-guardar');
  const atras = document.getElementById('btn-atras-3');
  cargando(boton, true, 'Guardando...');

  try {
    // 1. Cuenta de la familia (se repite solo si cambio el correo)
    if (!progreso.adoptante || progreso.correo !== f.correo) {
      progreso.adoptante = await crearAdoptante(f);
      progreso.correo = f.correo;
    }

    // 2. Adopcion
    if (!progreso.adopcion) {
      const { data, error } = await supabase.from('adopciones').insert({
        perro_id: p.id,
        adoptante_id: progreso.adoptante.id,
        fecha_adopcion: hoyISO(),
        consentimiento_datos: true,
        consentimiento_fecha: new Date().toISOString(),
        estado: 'activa',
      }).select().single();
      if (error) throw new Error(mensajeError(error));
      progreso.adopcion = data;
      atras.disabled = true; // ya existe la adopcion: no se vuelve a pasos anteriores
    }

    // 3. Firma en la cubeta privada de actas
    const { blob, url: firmaURL } = await firma.aBlob();
    if (!progreso.firma) {
      if (!blob) throw new Error('No pudimos preparar la imagen de la firma. Bórrala y vuelve a firmar.');
      const rutaFirma = `${progreso.adopcion.id}/firma.png`;
      const { error: errSubir } = await supabase.storage.from('actas')
        .upload(rutaFirma, blob, { contentType: 'image/png', upsert: true });
      if (errSubir) throw new Error(`La adopción se guardó, pero la firma no se pudo subir. ${mensajeError(errSubir)} Toca "Guardar adopción" otra vez para reintentar.`);
      const { error: errRuta } = await supabase.from('adopciones')
        .update({ firma_ruta: rutaFirma, acta_ruta: rutaFirma })
        .eq('id', progreso.adopcion.id);
      if (errRuta) throw new Error(`La firma se subió, pero no pudimos enlazarla a la adopción. ${mensajeError(errRuta)} Toca "Guardar adopción" otra vez.`);
      progreso.firma = true;
    }

    // 4. El perro pasa a adoptado
    if (!progreso.perro) {
      const { error: errPerro } = await supabase.from('perros').update({ estado: 'adoptado' }).eq('id', p.id);
      if (errPerro) throw new Error(`Falta marcar a ${p.nombre} como adoptado. ${mensajeError(errPerro)} Toca "Guardar adopción" otra vez.`);
      progreso.perro = true;
    }

    mostrarResultado(p, f, firmaURL);
  } catch (err) {
    mostrarErrorPaso(3, err.message || mensajeError(err));
    document.getElementById('error-paso-3').scrollIntoView({ block: 'center' });
  } finally {
    cargando(boton, false);
  }
});

// ---------------------------------------------------------------------
// Resumen imprimible del acta
// ---------------------------------------------------------------------
function mostrarResultado(p, f, firmaURL) {
  const adopcion = progreso.adopcion;
  const clave = progreso.adoptante.clave_temporal;
  const fechaConsentimiento = new Date(adopcion.consentimiento_fecha);
  const horaConsentimiento = fechaConsentimiento.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('resultado-texto').textContent = clave
    ? `${p.nombre} ya tiene familia. Imprime el acta y entrégale a ${f.nombre.split(' ')[0]} sus datos de ingreso para que envíe su reporte del mes.`
    : `${p.nombre} ya tiene familia. ${f.nombre.split(' ')[0]} ya tenía una cuenta: puede ingresar con su correo y su contraseña de siempre.`;
  document.getElementById('enlace-caso').href = `caso.html?id=${encodeURIComponent(adopcion.id)}`;

  document.getElementById('hoja-acta').innerHTML = `
    <header class="d-flex justify-content-between flex-wrap gap-2 align-items-start mb-3">
      <div>
        <p class="antetitulo mb-1">${esc(ALBERGUE.nombre)} · ${esc(ALBERGUE.ciudad)}</p>
        <h2 class="mb-0">Acta de adopción con cláusula de seguimiento</h2>
      </div>
      <p class="mb-0 text-suave">Fecha: ${esc(fechaLarga(adopcion.fecha_adopcion))}</p>
    </header>

    <h3>El perro</h3>
    <dl>
      <dt>Nombre</dt><dd>${esc(p.nombre)}</dd>
      <dt>Código</dt><dd>${esc(p.codigo)}</dd>
      <dt>Sexo y tamaño</dt><dd>${esc(TEXTOS.sexo[p.sexo] || '')}, ${esc((TEXTOS.tamano[p.tamano] || '').toLowerCase())}</dd>
      ${p.fecha_nacimiento_aprox ? `<dt>Edad aproximada</dt><dd>${esc(edadAprox(p.fecha_nacimiento_aprox))}</dd>` : ''}
      <dt>Esterilizado</dt><dd>${p.esterilizado ? 'Sí' : 'No'}</dd>
    </dl>

    <h3>La familia adoptante</h3>
    <dl>
      <dt>Nombre completo</dt><dd>${esc(f.nombre)}</dd>
      ${f.dni ? `<dt>DNI</dt><dd>${esc(f.dni)}</dd>` : ''}
      <dt>Celular</dt><dd>${esc(f.telefono)}</dd>
      <dt>Correo</dt><dd>${esc(f.correo)}</dd>
      <dt>Distrito</dt><dd>${esc(f.distrito)}</dd>
    </dl>

    <h3>Acuerdo</h3>
    ${htmlClausula(p, f, adopcion.fecha_adopcion)}
    <p class="mt-2 mb-0"><i class="bi bi-check2-square" aria-hidden="true"></i> La familia aceptó cada uno de los tres compromisos.</p>

    <h3>Consentimiento informado de datos personales</h3>
    <p class="mb-1">${esc(textoConsentimiento(f))}</p>
    <p class="mb-0"><i class="bi bi-check2-square" aria-hidden="true"></i> Aceptado el ${esc(fechaLarga(adopcion.fecha_adopcion))} a las ${esc(horaConsentimiento)}. Política de privacidad: ${esc(ruta('privacidad.html'))}</p>

    <div class="row g-4 mt-2 firma-bloque">
      <div class="col-sm-6">
        <img class="firma-impresa" src="${esc(firmaURL)}" alt="Firma de ${esc(f.nombre)}">
        <p class="mb-0 mt-1 fw-semibold">${esc(f.nombre)}</p>
        <p class="mb-0 small">${f.dni ? `DNI ${esc(f.dni)} · ` : ''}Familia adoptante</p>
      </div>
      <div class="col-sm-6">
        <div class="firma-impresa" style="height: 110px" aria-hidden="true"></div>
        <p class="mb-0 mt-1 fw-semibold">${esc(perfil.nombre_completo || '')}</p>
        <p class="mb-0 small">Por ${esc(ALBERGUE.nombre)}</p>
      </div>
    </div>

    ${clave ? `
    <section class="credenciales p-3 mt-4" aria-labelledby="t-credenciales">
      <h3 class="mt-0" id="t-credenciales"><i class="bi bi-key" aria-hidden="true"></i> Datos para ingresar a Sigue mi Huella</h3>
      <p class="mb-2">Con estos datos ${esc(f.nombre.split(' ')[0])} podrá enviar el reporte del mes de ${esc(p.nombre)} y ver su carnet de salud.</p>
      <dl>
        <dt>Dirección</dt><dd>${esc(ruta('ingresar.html'))}</dd>
        <dt>Correo</dt><dd><code>${esc(f.correo)}</code></dd>
        <dt>Clave temporal</dt><dd><code>${esc(clave)}</code></dd>
      </dl>
      <p class="mb-0 mt-2 small">Al ingresar por primera vez, cambia esta clave por una propia desde la opción "Olvidé mi contraseña" de la pantalla de ingreso.</p>
    </section>` : `
    <p class="mt-4 mb-0 small">La familia ya tenía una cuenta en Sigue mi Huella: ingresa en ${esc(ruta('ingresar.html'))} con su correo y su contraseña de siempre.</p>`}`;

  document.getElementById('asistente').hidden = true;
  const resultado = document.getElementById('resultado');
  resultado.hidden = false;
  document.getElementById('t-resultado').focus();
  window.scrollTo(0, 0);
}

document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
