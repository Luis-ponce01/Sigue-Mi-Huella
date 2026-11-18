// =====================================================================
// Portada publica de Sigue mi Huella (index.html)
// Usa el motor de js/movimiento.js: un unico IntersectionObserver,
// scroll siempre por requestAnimationFrame y reduccion de movimiento.
// Supabase y las utilidades comunes se cargan de forma dinamica: si la
// red falla, la narrativa animada sigue funcionando igual.
// =====================================================================

import {
  observar, iniciarRevelado, contar, progresoSeccion, alHacerScroll,
  revelarPalabras, prepararLineas, esperar, reduceMovimiento,
} from './movimiento.js';

window.portadaLista = true;

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const quieto = reduceMovimiento();
const pantallaGrande = window.matchMedia('(min-width: 992px)');

// ---------------------------------------------------------------------
// Portada: entrada, efecto fijo con desvanecido y barra de navegacion
// ---------------------------------------------------------------------
function iniciarPortada() {
  const portada = $('#portada');
  const foto = $('.portada-foto');
  const contenido = $('.portada-contenido');
  const indicador = $('.indicador-scroll');
  const testigo = $('.portada-testigo');
  const barra = $('#barra');

  revelarPalabras($('#titulo-portada'), { intervalo: 80, inmediato: true });

  // La imagen entra con escala 1.1 -> 1.0 cuando ya esta lista para pintarse
  if (quieto) {
    portada.classList.add('lista');
  } else {
    const entrar = () => {
      foto.style.willChange = 'transform';
      requestAnimationFrame(() => requestAnimationFrame(() => portada.classList.add('lista')));
      setTimeout(() => { foto.style.willChange = ''; }, 1700);
    };
    const lista = foto.decode ? foto.decode().catch(() => {}) : Promise.resolve();
    Promise.race([lista, esperar(700)]).then(entrar);
  }

  let ultimo = null;
  const limpiar = () => {
    contenido.style.opacity = '';
    contenido.style.transform = '';
    contenido.style.willChange = '';
    indicador.style.opacity = '';
    portada.style.visibility = '';
  };

  alHacerScroll(() => {
    // La barra aparece al pasar la portada (con reduccion de movimiento, siempre visible)
    const pasada = window.scrollY > window.innerHeight * 0.85;
    barra.classList.toggle('mostrar', quieto || pasada);

    // Efecto fijo solo en pantallas grandes y sin reduccion de movimiento
    if (quieto || !pantallaGrande.matches) {
      if (ultimo !== 'limpio') { limpiar(); ultimo = 'limpio'; }
      return;
    }
    const p = progresoSeccion(testigo);
    if (p === ultimo) return;
    ultimo = p;
    const opacidad = Math.max(0, 1 - p * 1.6);
    contenido.style.opacity = opacidad.toFixed(3);
    contenido.style.transform = `translate3d(0, ${(-p * 10).toFixed(2)}vh, 0) scale(${(1 - p * 0.06).toFixed(4)})`;
    contenido.style.willChange = p > 0 && p < 1 ? 'transform, opacity' : '';
    indicador.style.opacity = Math.max(0, 1 - p * 4).toFixed(3);
    // Totalmente cubierta: se retira del pintado y del orden de tabulacion
    portada.style.visibility = p >= 1 ? 'hidden' : '';
  });

  // En celular, cerrar el menu al elegir un enlace
  const menu = $('#menu-principal');
  $$('a', menu).forEach((a) => a.addEventListener('click', () => {
    if (menu.classList.contains('show') && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  }));
}

// ---------------------------------------------------------------------
// Momento 1: diez siluetas, siete se apagan, contador hasta 3
// El HTML ya trae el estado final (3 de 10) para quien no tiene
// JavaScript o prefiere menos movimiento.
// ---------------------------------------------------------------------
const APAGAR = [0, 2, 3, 4, 6, 7, 9]; // quedan a color la 2, la 6 y la 9

function iniciarSiluetas() {
  const escena = $('#siluetas-escena');
  const siluetas = $$('.silueta', escena);
  const contador = $('#contador-siluetas');

  if (quieto) {
    escena.classList.add('terminada');
    observar(escena);
    return;
  }

  // Estado inicial de la animacion: las diez a color
  siluetas.forEach((s) => s.classList.remove('apagada'));
  contador.textContent = '10';

  observar(escena, async () => {
    escena.classList.add('animando');
    // Paso 1: aparecen escalonadas (400 ms cada una, 45 ms entre ellas)
    await esperar(700);
    // Paso 2: siete se apagan una tras otra (450 ms cada una, 170 ms entre ellas)
    for (let k = 0; k < APAGAR.length; k += 1) {
      siluetas[APAGAR[k]].classList.add('apagada');
      contador.textContent = String(9 - k);
      await esperar(170);
    }
    // Paso 3: cuando termina la ultima, aparece la frase (500 ms)
    await esperar(330);
    escena.classList.add('terminada');
    await esperar(800);
    escena.classList.remove('animando');
  });
}

// ---------------------------------------------------------------------
// Momento 3: cifras que cuentan
// ---------------------------------------------------------------------
function iniciarCifras() {
  const personas = $('#cifra-personas');
  const registros = $('#cifra-registros');
  if (!quieto) personas.textContent = '0';
  observar($('#cifras-recursos'), () => {
    contar(personas, 3, { duracion: 600 });
    contar(registros, 0, { duracion: 600 });
  });
}

// ---------------------------------------------------------------------
// Como funciona: celular fijo con cuatro pantallas
// ---------------------------------------------------------------------
function iniciarComoFunciona() {
  const seccion = $('#como-funciona');
  const pasos = $('#pasos');
  const pantallas = $$('#celular-pantalla .pantalla');
  const bloques = $$('.bloque', pasos);

  // Copia cada pantalla dentro de su bloque para la vista apilada
  // (celulares y tabletas, o reduccion de movimiento)
  $$('.bloque-celular', pasos).forEach((destino) => {
    const original = pantallas[Number(destino.dataset.pantalla)];
    if (!original) return;
    const copia = original.cloneNode(true);
    copia.classList.add('activa');
    destino.innerHTML = '<div class="celular" aria-hidden="true"><div class="celular-pantalla"></div></div>';
    $('.celular-pantalla', destino).append(copia);
  });

  if (quieto) {
    seccion.classList.add('apilado');
    return;
  }

  seccion.classList.add('con-tramos');
  let actual = -1;
  let temporizador = 0;
  const activar = (n) => {
    if (n === actual) return;
    actual = n;
    seccion.classList.add('cambiando');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => seccion.classList.remove('cambiando'), 550);
    pantallas.forEach((p, i) => p.classList.toggle('activa', i === n));
    bloques.forEach((b, i) => b.classList.toggle('activo', i === n));
  };
  activar(0);

  alHacerScroll(() => {
    if (!pantallaGrande.matches) return; // en pantallas pequenas no hay tramos
    const p = progresoSeccion(pasos);
    activar(Math.min(3, Math.floor(p * 4)));
  });
}

// ---------------------------------------------------------------------
// Semaforo: barra que baja de 100 a 5
// ---------------------------------------------------------------------
function iniciarBarra() {
  const foco = $('#barra-foco');
  const cuenta = $('#cuenta-barra');
  if (quieto) return; // ya trae el estado final

  foco.classList.remove('reducida');
  cuenta.textContent = '100';
  observar(foco, async () => {
    foco.classList.add('animando');
    await esperar(150);
    foco.classList.add('reducida');
    contar(cuenta, 5, { desde: 100, duracion: 600 });
    await esperar(700);
    foco.classList.remove('animando');
  });
}

// ---------------------------------------------------------------------
// Datos reales desde Supabase
// ---------------------------------------------------------------------
let modulos = null;
async function cargarModulos() {
  if (!modulos) {
    modulos = Promise.all([import('./supabase.js'), import('./comun.js')])
      .then(([sb, comun]) => ({ ...sb, ...comun }))
      .catch((e) => { modulos = null; throw e; });
  }
  return modulos;
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function mensajeAmable(contenedor, { icono, texto, reintentar }) {
  contenedor.setAttribute('aria-busy', 'false');
  contenedor.innerHTML = `
    <div class="col-12">
      <div class="estado-vacio" role="status">
        <i class="bi ${icono}" aria-hidden="true"></i>
        <p class="mb-0">${esc(texto)}</p>
        ${reintentar ? '<button type="button" class="btn btn-outline-primary mt-3" data-reintentar>Intentar de nuevo</button>' : ''}
      </div>
    </div>`;
  if (reintentar) $('[data-reintentar]', contenedor).addEventListener('click', reintentar, { once: true });
}

function datosPerro(p, TEXTOS, edadAprox) {
  const sexo = TEXTOS.sexo[p.sexo] || '';
  let tamano = TEXTOS.tamano[p.tamano] || '';
  if (p.sexo === 'hembra') tamano = tamano.replace(/o$/, 'a');
  const edad = edadAprox(p.fecha_nacimiento_aprox);
  return [sexo, tamano, edad].filter(Boolean).join(' · ');
}

async function cargarPerros() {
  const galeria = $('#galeria-perros');
  try {
    const { supabase, fotoPublica, ruta, TEXTOS, edadAprox } = await cargarModulos();
    const { data, error } = await supabase
      .from('perros')
      .select('id, nombre, sexo, tamano, fecha_nacimiento_aprox, historia, foto_ruta')
      .eq('estado', 'en_adopcion')
      .order('nombre');
    if (error) throw error;
    if (!data || !data.length) {
      mensajeAmable(galeria, {
        icono: 'bi-house-heart',
        texto: 'Hoy todos nuestros perros ya tienen familia. Vuelve pronto: siempre llegan nuevos rescatados.',
      });
      return;
    }
    galeria.innerHTML = data.map((p) => `
      <div class="col-sm-6 col-lg-4 revelar">
        <article class="card card-elevable tarjeta-perro h-100 overflow-hidden">
          <img class="foto-perro" src="${esc(fotoPublica(p.foto_ruta))}" alt="Foto de ${esc(p.nombre)}" width="600" height="600" loading="lazy" decoding="async">
          <div class="card-body d-flex flex-column">
            <h3 class="h4 mb-1">${esc(p.nombre)}</h3>
            <p class="text-suave mb-3">${esc(datosPerro(p, TEXTOS, edadAprox))}</p>
            ${p.historia ? `<p class="historia-corta mb-4">${esc(p.historia)}</p>` : ''}
            <a class="btn btn-outline-primary mt-auto align-self-start" href="apadrinar.html?perro=${encodeURIComponent(p.id)}">
              <i class="bi bi-heart" aria-hidden="true"></i> Apadrinar a ${esc(p.nombre)}
            </a>
          </div>
        </article>
      </div>`).join('');
    galeria.setAttribute('aria-busy', 'false');
    $$('img', galeria).forEach((img) => img.addEventListener('error', () => {
      img.src = ruta('img/sin-foto.svg');
    }, { once: true }));
    iniciarRevelado(galeria.parentElement);
  } catch {
    mensajeAmable(galeria, {
      icono: 'bi-cloud-slash',
      texto: 'No pudimos cargar a los perros en este momento. Revisa tu conexión e inténtalo otra vez.',
      reintentar: cargarPerros,
    });
  }
}

const TIPO_ALIADO = { veterinaria: 'Veterinaria', pet_shop: 'Tienda de mascotas', empresa: 'Empresa amiga' };
const ICONO_ALIADO = { veterinaria: 'bi-heart-pulse', pet_shop: 'bi-bag-heart', empresa: 'bi-building' };

async function cargarAliados() {
  const lista = $('#lista-aliados');
  try {
    const { supabase, fotoPublica } = await cargarModulos();
    const { data, error } = await supabase
      .from('aliados')
      .select('id, nombre, tipo, descuento, direccion, logo_ruta')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    if (!data || !data.length) {
      mensajeAmable(lista, {
        icono: 'bi-people',
        texto: 'Pronto presentaremos aquí a los negocios que acompañan al albergue.',
      });
      return;
    }
    lista.innerHTML = data.map((a) => `
      <div class="col-sm-6 col-lg-3 revelar">
        <article class="card h-100">
          <div class="card-body d-flex flex-column">
            <div class="mb-3">
              ${a.logo_ruta
                ? `<img class="logo-aliado" src="${esc(fotoPublica(a.logo_ruta))}" alt="Logotipo de ${esc(a.nombre)}" width="72" height="72" loading="lazy" data-icono="${ICONO_ALIADO[a.tipo] || 'bi-shop'}">`
                : `<span class="icono-circulo"><i class="bi ${ICONO_ALIADO[a.tipo] || 'bi-shop'}" aria-hidden="true"></i></span>`}
            </div>
            <p class="small fw-semibold text-suave mb-1">${esc(TIPO_ALIADO[a.tipo] || '')}</p>
            <h3 class="h5 mb-2">${esc(a.nombre)}</h3>
            ${a.descuento ? `<p class="mb-3">${esc(a.descuento)}</p>` : ''}
            ${a.direccion ? `<p class="small text-suave mb-0 mt-auto"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${esc(a.direccion)}</p>` : ''}
          </div>
        </article>
      </div>`).join('');
    lista.setAttribute('aria-busy', 'false');
    $$('img.logo-aliado', lista).forEach((img) => img.addEventListener('error', () => {
      const icono = document.createElement('span');
      icono.className = 'icono-circulo';
      icono.innerHTML = `<i class="bi ${img.dataset.icono}" aria-hidden="true"></i>`;
      img.replaceWith(icono);
    }, { once: true }));
    iniciarRevelado(lista.parentElement);
  } catch {
    mensajeAmable(lista, {
      icono: 'bi-cloud-slash',
      texto: 'No pudimos cargar a los aliados en este momento. Inténtalo otra vez en unos minutos.',
      reintentar: cargarAliados,
    });
  }
}

async function pintarPieComun() {
  try {
    const { pintarPie } = await cargarModulos();
    pintarPie();
  } catch {
    // Sin conexion: el pie queda vacio, el resto de la portada sigue funcionando
  }
}

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------
iniciarPortada();
iniciarSiluetas();
iniciarCifras();
iniciarComoFunciona();
iniciarBarra();
prepararLineas($('#frase-cierre'));
iniciarRevelado();

pintarPieComun();
cargarPerros();
cargarAliados();
