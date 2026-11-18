// Piezas comunes del panel del albergue: barra de navegacion, sesion,
// pie de pagina y pequenas utilidades compartidas por sus pantallas.
import { supabase } from '../js/supabase.js';
import { requerirSesion, activarCerrarSesion } from '../js/auth.js';
import { esc, pintarPie, aviso, mensajeError } from '../js/comun.js';
import { ALBERGUE } from '../js/config.js';

const ENLACES = [
  { id: 'inicio', href: 'index.html', icono: 'bi-house-heart', texto: 'Inicio' },
  { id: 'adopciones', href: 'adopciones.html', icono: 'bi-people', texto: 'Adopciones' },
  { id: 'solicitudes', href: 'solicitudes.html', icono: 'bi-life-preserver', texto: 'Solicitudes' },
  { id: 'perros', href: 'perros.html', icono: 'bi-grid-3x3-gap', texto: 'Perros' },
  { id: 'nueva', href: 'nueva-adopcion.html', icono: 'bi-pen', texto: 'Nueva adopción' },
];

function pintarMenu(activo) {
  const destino = document.getElementById('menu-panel');
  if (!destino) return;
  const items = ENLACES.map((e) => `
      <li class="nav-item">
        <a class="nav-link${e.id === activo ? ' active' : ''}" href="${e.href}"${e.id === activo ? ' aria-current="page"' : ''}>
          <i class="bi ${e.icono}" aria-hidden="true"></i> ${e.texto}${e.id === 'solicitudes' ? ' <span class="badge text-bg-primary ms-1" id="contador-solicitudes" hidden></span>' : ''}
        </a>
      </li>`).join('');
  destino.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-smh sticky-top no-imprimir" aria-label="Menú del panel">
      <div class="container">
        <a class="marca" href="index.html"><i class="bi bi-heart-pulse" aria-hidden="true"></i> Sigue mi Huella <span class="etiqueta-panel">Panel</span></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-panel-enlaces"
          aria-controls="menu-panel-enlaces" aria-expanded="false" aria-label="Abrir el menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu-panel-enlaces">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            ${items}
            <li class="nav-item">
              <a class="nav-link" href="#" data-cerrar-sesion><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Salir</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>`;
}

async function pintarContadorSolicitudes() {
  const { count, error } = await supabase
    .from('solicitudes_ayuda')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'nueva');
  const el = document.getElementById('contador-solicitudes');
  if (error || !el || !count) return;
  el.textContent = count;
  el.setAttribute('aria-label', `${count} ${count === 1 ? 'nueva' : 'nuevas'}`);
  el.hidden = false;
}

// Llamar al inicio de cada pantalla del panel.
export async function iniciarPanel(activo) {
  pintarMenu(activo);
  pintarPie();
  const datos = await requerirSesion('albergue');
  activarCerrarSesion();
  pintarContadorSolicitudes();
  return datos;
}

// ---------------------------------------------------------------------
// Utilidades del panel
// ---------------------------------------------------------------------
export const ESTADO_PERRO = {
  en_albergue: 'En el albergue',
  en_adopcion: 'Buscando hogar',
  adoptado: 'Adoptado',
  devuelto: 'Devuelto',
  fallecido: 'Fallecido',
};

export const ESTADO_ADOPCION = { activa: 'Activa', devuelta: 'Devuelta', cerrada: 'Cerrada' };

export function primerNombre(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0] || '';
}

// Dias completos entre una fecha (o timestamp) y hoy
export function diasDesde(valor) {
  if (!valor) return null;
  const f = /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? new Date(...valor.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
    : new Date(valor);
  f.setHours(0, 0, 0, 0);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoy - f) / 86400000));
}

export function haceTexto(dias) {
  if (dias === null || dias === undefined) return '';
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

export function textoSilencio(dias, conReporte = true) {
  const base = `${dias} ${dias === 1 ? 'día' : 'días'} sin noticias`;
  return conReporte ? base : `${base} desde la entrega`;
}

export function mensajeWhatsApp(familia, perro, { vacunaVencida = false } = {}) {
  const nombre = primerNombre(familia);
  let texto = `Hola, ${nombre}. Somos de ${ALBERGUE.nombre}. Nos acordamos mucho de ${perro} y queríamos saber cómo está. Cuando puedas, ¿nos mandas una fotito?`;
  if (vacunaVencida) {
    texto += ` También queríamos recordarte que ya le toca una de sus vacunas; si te ayuda, en la Clínica Lobo Gris tienen descuento para nuestros perros.`;
  }
  return `${texto} Gracias por todo el cariño que le das.`;
}

export function enlaceTelefono(telefono) {
  let num = String(telefono || '').replace(/\D/g, '');
  if (num.length === 9) num = '51' + num;
  return num ? `tel:+${num}` : '';
}

// Anota un contacto para que el equipo no repita llamadas
export async function registrarContacto(adopcionId, autorId, medio, resultado) {
  const { data, error } = await supabase
    .from('contactos')
    .insert({ adopcion_id: adopcionId, autor_id: autorId, medio, resultado })
    .select()
    .single();
  if (error) { aviso(mensajeError(error), 'error'); return null; }
  return data;
}

export function mostrarError(contenedor, error) {
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="alert alert-warning d-flex gap-2 align-items-start" role="alert">
      <i class="bi bi-exclamation-circle mt-1" aria-hidden="true"></i>
      <div>${esc(mensajeError(error))}</div>
    </div>`;
}
