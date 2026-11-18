// Canal de ayuda. Movimiento muy contenido: solo fundidos de 200 ms,
// sin marcas animadas ni celebraciones. Tono sin juicio en todos los textos.
import { supabase } from '../js/supabase.js';
import { ALBERGUE } from '../js/config.js';
import { esc, mensajeError, aviso, cargando, enlaceWhatsApp } from '../js/comun.js';
import { iniciarRevelado } from '../js/movimiento.js';
import { iniciarPortal, cargarAdopcion, primerNombre, genero, htmlErrorCarga } from './portal.js';

const vista = document.getElementById('vista');

const MOTIVOS = [
  { valor: 'conducta', icono: 'bi-chat-square-heart', texto: 'Su conducta me preocupa' },
  { valor: 'dinero', icono: 'bi-wallet2', texto: 'Me está costando económicamente' },
  { valor: 'mudanza', icono: 'bi-truck', texto: 'Me voy a mudar' },
  { valor: 'no_puedo_seguir', icono: 'bi-people', texto: 'Ya no puedo seguir cuidándolo' },
];

// Salida concreta que se ofrece segun el motivo
function salida(motivo, perro) {
  const n = esc(perro?.nombre || 'tu perro');
  const g = genero(perro);
  const L = g.lo === 'la' ? 'La' : 'Lo';
  switch (motivo) {
    case 'conducta':
      return {
        icono: 'bi-heart-pulse',
        titulo: 'Orientación de la Clínica Veterinaria Lobo Gris',
        texto: `Muchos cambios de conducta tienen solución con pequeños ajustes en la rutina. Coordinaremos contigo una orientación con la Clínica Veterinaria Lobo Gris, nuestra veterinaria aliada.`,
        pasos: [
          `Te escribimos para entender mejor qué está pasando con ${n}.`,
          'Lobo Gris te orienta, con el descuento que ofrece a las familias del albergue.',
          `Seguimos en contacto hasta que ${n} y tu familia estén más tranquilos.`,
        ],
        enlace: { href: 'guias.html?categoria=conducta', texto: 'Ver las guías de conducta', icono: 'bi-book' },
      };
    case 'dinero':
      return {
        icono: 'bi-basket',
        titulo: 'Apoyo del albergue',
        texto: 'Cuidar a un perro cuesta, y hay meses más difíciles que otros. No tienes que pasarlo solo: para esto existe el albergue.',
        pasos: [
          'Podemos apoyarte con alimento del fondo de padrinos.',
          'Nuestros aliados ofrecen descuentos en consultas, vacunas y alimento para perros adoptados.',
          'Conversamos contigo para ver qué te ayuda más en este momento.',
        ],
        enlace: null,
      };
    case 'mudanza':
      return {
        icono: 'bi-signpost-split',
        titulo: 'Planificamos juntos el traslado',
        texto: `Una mudanza no tiene por qué separarte de ${n}. Te ayudamos a planificar el viaje y su llegada al nuevo hogar.`,
        pasos: [
          'Conversamos sobre la fecha y el lugar al que te mudas.',
          `Te damos consejos para el viaje y para que ${n} se adapte pronto a la nueva casa.`,
          `Si ${n} no pudiera ir contigo, buscamos juntos una nueva familia, con el mismo cuidado con que te elegimos a ti.`,
        ],
        enlace: null,
      };
    default:
      return {
        icono: 'bi-house-heart',
        titulo: 'Una devolución responsable, sin juicios',
        texto: `Gracias por avisarnos. Tomar esta decisión no es fácil, y hacerlo así también es cuidar a ${n}. El albergue ${g.lo} recibe de vuelta y nadie te va a juzgar.`,
        pasos: [
          'Te llamamos para coordinar un día y una hora que te acomoden.',
          `Llevas a ${n} al albergue con su carnet y sus cosas, si las tiene. Si no puedes trasladar${g.lo}, vemos juntos cómo hacerlo.`,
          `${L} cuidamos y le buscamos una nueva familia. Si quieres, te contamos cómo le va.`,
        ],
        nota: 'Si en el camino descubres que lo que pesa es el dinero, la conducta o una mudanza, también podemos ayudarte con eso.',
        enlace: null,
      };
  }
}

function botonWhatsApp(nombre, perro, texto = 'Escribir al albergue por WhatsApp') {
  const quien = nombre ? `Hola, soy ${nombre}` : 'Hola';
  const deQuien = perro ? ` y adopté a ${perro.nombre}` : '';
  const mensaje = `${quien}${deQuien}. Les escribo desde Sigue mi Huella porque me gustaría conversar con ustedes.`;
  return `
    <a class="btn btn-whatsapp" href="${esc(enlaceWhatsApp(ALBERGUE.whatsapp, mensaje))}" target="_blank" rel="noopener">
      <i class="bi bi-whatsapp" aria-hidden="true"></i> ${esc(texto)}
    </a>`;
}

async function principal() {
  const { perfil, uid } = await iniciarPortal();
  const nombre = primerNombre(perfil);

  let datos;
  try {
    datos = await cargarAdopcion(uid);
  } catch (e) {
    vista.innerHTML = htmlErrorCarga(mensajeError(e));
    return;
  }
  const perro = datos?.perro || null;
  const desdeReporte = new URLSearchParams(location.search).get('reporte') === '1';
  const textoNoPuedo = perro?.sexo === 'hembra' ? 'Ya no puedo seguir cuidándola' : 'Ya no puedo seguir cuidándolo';

  vista.innerHTML = `
    <div class="fundido">
      <header class="mb-4">
        <span class="icono-circulo mb-3"><i class="bi bi-life-preserver" aria-hidden="true"></i></span>
        <h1 class="h2 mb-3">Estamos para darte una mano</h1>
        ${desdeReporte && perro ? `<p class="tarjeta-calida p-3 mb-3">Ya guardamos cómo está ${esc(perro.nombre)}. Ahora cuéntanos qué está pasando y vemos juntos cómo ayudarte.</p>` : ''}
        <p class="lead mb-2">Esto le pasa a muchas familias. Preferimos que nos avises a tiempo: juntos siempre encontramos una salida, y nadie te va a juzgar.</p>
        <p class="text-suave mb-0">No tienes que explicar nada si no quieres. Elige lo que más se parece a lo que estás viviendo.</p>
      </header>

      ${datos ? `
      <form id="form-ayuda" novalidate>
        <fieldset class="mb-4">
          <legend class="h5 mb-3">¿Qué está pasando?</legend>
          <div class="opciones-toque motivos-ayuda">
            ${MOTIVOS.map((m) => `
              <div class="opcion-toque">
                <input type="radio" name="motivo" id="motivo-${m.valor}" value="${m.valor}">
                <label for="motivo-${m.valor}"><i class="bi ${m.icono}" aria-hidden="true"></i>${esc(m.valor === 'no_puedo_seguir' ? textoNoPuedo : m.texto)}</label>
              </div>`).join('')}
          </div>
        </fieldset>

        <div class="mb-4">
          <label class="form-label" for="detalle">
            Si quieres, cuéntanos un poco más
            <span class="badge ms-1" style="background: var(--smh-arena); color: var(--smh-texto-suave); border: 1px solid var(--smh-borde)">Opcional</span>
          </label>
          <textarea id="detalle" class="form-control" rows="4" maxlength="1000" aria-describedby="ayuda-detalle"></textarea>
          <p id="ayuda-detalle" class="small text-suave mt-1 mb-0">Puedes dejarlo en blanco. Lo que escribas solo lo lee el equipo del albergue.</p>
        </div>

        <p id="indicacion-ayuda" class="indicacion-amable mb-2" aria-live="polite">
          <i class="bi bi-info-circle" aria-hidden="true"></i><span>Elige una de las cuatro opciones y podrás enviarlo.</span>
        </p>
        <button type="submit" id="enviar-ayuda" class="btn btn-primary btn-lg w-100" disabled aria-describedby="indicacion-ayuda">
          <i class="bi bi-send" aria-hidden="true"></i> Enviar al albergue
        </button>
      </form>` : `
      <div class="estado-vacio mb-3">
        <i class="bi bi-house-heart" aria-hidden="true"></i>
        Todavía no vemos una adopción registrada en tu cuenta. Igual puedes escribirle al albergue cuando quieras.
      </div>`}

      <div class="text-center mt-4 pt-2">
        <p class="text-suave mb-2">¿Prefieres conversar ahora mismo?</p>
        ${botonWhatsApp(nombre, perro)}
      </div>
    </div>`;
  iniciarRevelado();

  const form = document.getElementById('form-ayuda');
  if (!form) return;
  const boton = document.getElementById('enviar-ayuda');

  form.addEventListener('change', () => {
    const elegido = form.querySelector('input[name="motivo"]:checked');
    boton.disabled = !elegido;
    document.querySelector('#indicacion-ayuda span').textContent = elegido
      ? 'Cuando quieras, envíalo. Te responderemos pronto.'
      : 'Elige una de las cuatro opciones y podrás enviarlo.';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const motivo = form.querySelector('input[name="motivo"]:checked')?.value;
    if (!motivo) return;
    cargando(boton, true, 'Enviando...');
    const detalle = document.getElementById('detalle').value.trim() || null;
    const { error } = await supabase
      .from('solicitudes_ayuda')
      .insert({ adopcion_id: datos.adopcion.id, motivo, detalle });
    if (error) {
      cargando(boton, false);
      aviso(mensajeError(error), 'error');
      return;
    }
    mostrarConfirmacion(motivo, perro, nombre);
  });
}

function mostrarConfirmacion(motivo, perro, nombre) {
  const s = salida(motivo, perro);
  vista.innerHTML = `
    <section class="fundido" aria-labelledby="titulo-recibido">
      <h1 id="titulo-recibido" class="h2 mb-3" tabindex="-1">Gracias por contarnos</h1>
      <p class="lead mb-4">Ya recibimos tu mensaje. Alguien del equipo del albergue se comunicará contigo pronto.</p>

      <div class="salida-ayuda p-4 mb-4">
        <div class="d-flex align-items-center gap-3 mb-3">
          <span class="icono-circulo"><i class="bi ${s.icono}" aria-hidden="true"></i></span>
          <h2 class="h4 mb-0">${esc(s.titulo)}</h2>
        </div>
        <p>${s.texto}</p>
        <h3 class="h6">Lo que sigue</h3>
        <ol class="pasos-salida mb-0">
          ${s.pasos.map((p) => `<li>${p}</li>`).join('')}
        </ol>
        ${s.nota ? `<p class="text-suave mt-3 mb-0">${esc(s.nota)}</p>` : ''}
        ${s.enlace ? `<a class="btn btn-outline-primary mt-3" href="${s.enlace.href}"><i class="bi ${s.enlace.icono}" aria-hidden="true"></i> ${esc(s.enlace.texto)}</a>` : ''}
      </div>

      <div class="d-grid gap-2">
        ${botonWhatsApp(nombre, perro, 'Conversar ahora por WhatsApp')}
        <a class="btn btn-suave" href="index.html"><i class="bi bi-house-heart" aria-hidden="true"></i> Volver al inicio</a>
      </div>
    </section>`;
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.getElementById('titulo-recibido').focus({ preventScroll: true });
}

principal();
