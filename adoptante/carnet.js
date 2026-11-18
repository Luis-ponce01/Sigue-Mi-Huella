// Carnet digital: datos del perro, historia, calendario sanitario y galeria.
import { supabase, fotoPublica, fotosFirmadas } from '../js/supabase.js';
import { esc, fechaLarga, mesAnio, diasHasta, edadAprox, TEXTOS, mensajeError, aviso } from '../js/comun.js';
import { iniciarRevelado } from '../js/movimiento.js';
import { iniciarPortal, cargarAdopcion, genero, mesDe, htmlSinAdopcion, htmlErrorCarga } from './portal.js';

const vista = document.getElementById('vista');

// Textos de las respuestas, vistos desde la familia
const RESPUESTAS = {
  come_bien: {
    si: ['bi-egg-fried', 'Come bien'],
    mas_o_menos: ['bi-egg-fried', 'Come más o menos'],
    no: ['bi-egg-fried', 'Poco apetito'],
  },
  vacunas_al_dia: {
    si: ['bi-shield-check', 'Vacunas al día'],
    no: ['bi-shield', 'Vacunas por ponerse al día'],
    no_seguro: ['bi-shield', 'Vacunas por revisar'],
  },
  problema: {
    todo_bien: ['bi-sun', 'Todo bien'],
    tengo_duda: ['bi-chat-heart', 'Tenías una duda'],
    necesito_ayuda: ['bi-life-preserver', 'Pediste apoyo'],
  },
};

async function principal() {
  const { uid } = await iniciarPortal();
  let datos;
  try {
    datos = await cargarAdopcion(uid);
  } catch (e) {
    vista.innerHTML = htmlErrorCarga(mensajeError(e));
    return;
  }
  if (!datos) {
    vista.innerHTML = htmlSinAdopcion();
    return;
  }
  const { adopcion, perro } = datos;

  const [rVacunas, rReportes] = await Promise.all([
    supabase.from('vacunas').select('id, tipo, fecha_aplicada, fecha_proxima, aplicada').eq('perro_id', perro.id),
    supabase.from('reportes')
      .select('id, fecha, foto_ruta, come_bien, vacunas_al_dia, problema, comentario, creado_en')
      .eq('adopcion_id', adopcion.id)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false }),
  ]);
  if (rVacunas.error || rReportes.error) aviso(mensajeError(rVacunas.error || rReportes.error), 'error');
  const vacunas = rVacunas.data || [];
  const reportes = rReportes.data || [];
  const fotos = await fotosFirmadas('reportes', reportes.map((r) => r.foto_ruta));

  vista.innerHTML = `
    ${htmlFicha(perro, adopcion)}
    <div class="row g-4 mt-0">
      <div class="col-lg-5">${htmlHistoria(perro)}</div>
      <div class="col-lg-7">${htmlCalendario(vacunas, perro)}</div>
    </div>
    ${htmlGaleria(reportes, fotos, perro)}
  `;
  iniciarRevelado();

  // Si se llego con un ancla (#calendario o #galeria), ubicarla ya pintada
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ block: 'start' });
}

function htmlFicha(perro, adopcion) {
  const g = genero(perro);
  const juntos = edadAprox(adopcion.fecha_adopcion);
  const desde = juntos.startsWith('0 ') ? 'desde este mes' : `hace ${juntos}`;
  const datos = [
    ['Código', perro.codigo],
    ['Sexo', TEXTOS.sexo[perro.sexo] || perro.sexo],
    ['Tamaño', TEXTOS.tamano[perro.tamano] || perro.tamano],
    ['Edad aproximada', edadAprox(perro.fecha_nacimiento_aprox) || 'Sin dato'],
    ['Esterilizad' + g.o, perro.esterilizado ? 'Sí' : 'Todavía no'],
    ['Fecha de adopción', fechaLarga(adopcion.fecha_adopcion)],
  ];
  return `
    <section class="ficha-perro row g-4 align-items-center" aria-labelledby="nombre-perro">
      <div class="col-md-5 revelar">
        <img class="foto-perro" src="${esc(fotoPublica(perro.foto_ruta))}" alt="Foto de ${esc(perro.nombre)}">
      </div>
      <div class="col-md-7">
        <p class="antetitulo mb-1 revelar">Carnet de</p>
        <h1 id="nombre-perro" class="titulo-seccion mb-2 revelar">${esc(perro.nombre)}</h1>
        <p class="text-suave mb-4 revelar">En tu familia ${esc(desde)}.</p>
        <dl class="datos-perro escalonado">
          ${datos.map(([t, v]) => `<div class="revelar"><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}
        </dl>
      </div>
    </section>`;
}

function htmlHistoria(perro) {
  return `
    <section aria-labelledby="titulo-historia" class="revelar">
      <h2 id="titulo-historia" class="h3 mb-3"><i class="bi bi-heart texto-terracota" aria-hidden="true"></i> Su historia</h2>
      ${perro.historia
        ? `<p class="historia-rescate mb-3">${esc(perro.historia)}</p>`
        : `<p class="text-suave">El albergue todavía no ha escrito su historia.</p>`}
      ${perro.fecha_rescate ? `<p class="text-suave mb-0">Rescatad${genero(perro).o} el ${esc(fechaLarga(perro.fecha_rescate))}.</p>` : ''}
    </section>`;
}

function htmlCalendario(vacunas, perro) {
  const g = genero(perro);
  const hitos = vacunas
    .map((v) => {
      const fecha = v.aplicada ? v.fecha_aplicada : v.fecha_proxima;
      let clase, insignia, detalle, icono;
      if (v.aplicada) {
        clase = 'semaforo-verde'; insignia = 'Aplicada'; icono = 'bi-check-lg';
        detalle = fecha ? `Aplicada el ${fechaLarga(fecha)}.` : 'Aplicada.';
      } else {
        const dias = diasHasta(fecha);
        if (dias !== null && dias < 0) {
          clase = 'semaforo-rojo'; insignia = 'Pendiente'; icono = 'bi-exclamation';
          detalle = `Estaba prevista para el ${fechaLarga(fecha)}. Lléva${g.lo} apenas puedas; si necesitas apoyo, escríbenos.`;
        } else {
          clase = 'semaforo-ambar'; insignia = 'Próxima'; icono = 'bi-clock';
          detalle = fecha
            ? `Toca el ${fechaLarga(fecha)}${dias === 0 ? ', hoy' : dias === 1 ? ', mañana' : `, en ${dias} días`}.`
            : 'Fecha por definir con el albergue.';
        }
      }
      return { fecha: fecha || '', clase, insignia, detalle, icono, tipo: v.tipo };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const cuerpo = hitos.length
    ? `
      <div class="linea-tiempo" data-al-revelar data-umbral="0.2">
        <span class="eje" aria-hidden="true"></span>
        <ol class="list-unstyled m-0 p-0">
        ${hitos.map((h, i) => `
          <li class="hito ${h.clase}" style="--i:${i}">
            <span class="punto" aria-hidden="true"><i class="bi ${h.icono}"></i></span>
            <div class="contenido-hito">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                <h3 class="h6 mb-0">${esc(h.tipo)}</h3>
                <span class="insignia-semaforo">${h.insignia}</span>
              </div>
              <p class="mb-0">${esc(h.detalle)}</p>
            </div>
          </li>`).join('')}
        </ol>
      </div>`
    : `<div class="estado-vacio"><i class="bi bi-calendar2-heart" aria-hidden="true"></i>El albergue todavía no ha cargado su calendario sanitario.</div>`;

  return `
    <section id="calendario" aria-labelledby="titulo-calendario">
      <h2 id="titulo-calendario" class="h3 mb-3 revelar"><i class="bi bi-shield-check texto-terracota" aria-hidden="true"></i> Calendario sanitario</h2>
      ${cuerpo}
    </section>`;
}

function chips(r) {
  return ['come_bien', 'vacunas_al_dia', 'problema'].map((campo) => {
    const par = RESPUESTAS[campo][r[campo]];
    if (!par) return '';
    return `<li><i class="bi ${par[0]}" aria-hidden="true"></i>${esc(par[1])}</li>`;
  }).join('');
}

function tarjetaFoto(r, url, perro, destacada = false) {
  const fecha = fechaLarga(r.fecha);
  const imagen = url
    ? `<a class="enlace-foto" href="${esc(url)}" target="_blank" rel="noopener">
         <img src="${esc(url)}" alt="${esc(perro.nombre)} el ${esc(fecha)}" ${destacada ? '' : 'loading="lazy"'}>
         <span class="visually-hidden">(abre la foto en grande)</span>
       </a>`
    : `<div class="sin-foto"><i class="bi bi-camera" aria-hidden="true"></i><span>Ese día nos contaste sin foto</span></div>`;
  return `
    <article class="foto-reporte ${destacada ? 'foto-destacada' : ''}">
      ${destacada ? `<div class="row g-0 h-100">
        <div class="col-md-7">${imagen}</div>
        <div class="col-md-5 d-flex"><div class="cuerpo p-4 align-self-center">
          <p class="antetitulo mb-1">Lo más reciente</p>
          <h3 class="h3 mb-1">${esc(fecha)}</h3>
          <ul class="respuestas">${chips(r)}</ul>
          ${r.comentario ? `<p class="comentario-reporte">"${esc(r.comentario)}"</p>` : ''}
        </div></div>
      </div>` : `
        ${imagen}
        <div class="cuerpo">
          <p class="fw-bold mb-0">${esc(fecha)}</p>
          <ul class="respuestas">${chips(r)}</ul>
          ${r.comentario ? `<p class="comentario-reporte">"${esc(r.comentario)}"</p>` : ''}
        </div>`}
    </article>`;
}

function htmlGaleria(reportes, fotos, perro) {
  const g = genero(perro);
  let contenido;
  if (!reportes.length) {
    contenido = `
      <div class="estado-vacio revelar">
        <i class="bi bi-images" aria-hidden="true" style="color: var(--smh-terracota)"></i>
        <p class="mb-3">Aquí irán apareciendo las fotos de ${esc(perro.nombre)} que nos envíes cada mes.</p>
        <a class="btn btn-primary" href="index.html"><i class="bi bi-camera" aria-hidden="true"></i> Enviar su primera foto</a>
      </div>`;
  } else {
    const [primero, ...resto] = reportes;
    const meses = new Map();
    for (const r of resto) {
      const clave = mesDe(r.fecha);
      if (!meses.has(clave)) meses.set(clave, []);
      meses.get(clave).push(r);
    }
    contenido = `
      <div class="revelar mb-5">${tarjetaFoto(primero, fotos[primero.foto_ruta], perro, true)}</div>
      ${[...meses.entries()].map(([clave, lista]) => `
        <section class="galeria-mes" aria-label="Fotos de ${esc(mesAnio(clave + '-01'))}">
          <h3 class="titulo-mes revelar">${esc(mesAnio(clave + '-01'))}</h3>
          <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4 escalonado">
            ${lista.map((r) => `<div class="col revelar">${tarjetaFoto(r, fotos[r.foto_ruta], perro)}</div>`).join('')}
          </div>
        </section>`).join('')}`;
  }
  const veces = reportes.length;
  return `
    <section id="galeria" class="mt-5 pt-4" aria-labelledby="titulo-galeria">
      <div class="mb-4 revelar">
        <p class="antetitulo mb-1">Mes a mes</p>
        <h2 id="titulo-galeria" class="titulo-seccion mb-2" style="font-size: var(--smh-t-h2)">Sus fotos contigo</h2>
        ${veces ? `<p class="lead text-suave mb-0">Nos has contado de ${esc(perro.nombre)} ${veces} ${veces === 1 ? 'vez' : 'veces'}. Cada foto cuenta cómo ha crecido a tu lado.</p>` : ''}
      </div>
      ${contenido}
    </section>`;
}

principal();
