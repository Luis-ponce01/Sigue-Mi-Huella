// Utilidades compartidas por todas las pantallas.
import { ruta } from './supabase.js';
import { ALBERGUE } from './config.js';

// Escapa texto antes de insertarlo como HTML
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

// Convierte 'AAAA-MM-DD' o timestamp en fecha local sin desfase de zona horaria
function aFecha(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(valor);
}

export function fechaLarga(valor) {
  const f = aFecha(valor);
  return f ? `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}` : '';
}
export function fechaCorta(valor) {
  const f = aFecha(valor);
  return f ? `${f.getDate()} ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}` : '';
}
export function mesAnio(valor) {
  const f = aFecha(valor);
  return f ? `${MESES[f.getMonth()]} ${f.getFullYear()}` : '';
}
export function diasHasta(valor) {
  const f = aFecha(valor);
  if (!f) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((f - hoy) / 86400000);
}
export function hoyISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}
export function edadAprox(valor) {
  const f = aFecha(valor);
  if (!f) return '';
  const meses = Math.max(0, Math.round((Date.now() - f) / (30.44 * 86400000)));
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
}
export function soles(monto) {
  return 'S/ ' + Number(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Textos legibles de los valores de la base de datos
export const TEXTOS = {
  tamano: { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' },
  sexo: { macho: 'Macho', hembra: 'Hembra' },
  come_bien: { si: 'Come bien', mas_o_menos: 'Come más o menos', no: 'No está comiendo bien' },
  vacunas_al_dia: { si: 'Vacunas al día', no: 'Vacunas pendientes', no_seguro: 'No sabe si tiene las vacunas al día' },
  problema: { todo_bien: 'Todo bien', tengo_duda: 'Tiene una duda', necesito_ayuda: 'Necesita ayuda' },
  motivo: { conducta: 'Conducta', dinero: 'Dinero', mudanza: 'Mudanza', no_puedo_seguir: 'No puede seguir cuidándolo' },
  estado_solicitud: { nueva: 'Nueva', en_proceso: 'En proceso', resuelta: 'Resuelta' },
  categoria: { alimentacion: 'Alimentación', salud: 'Salud', higiene: 'Higiene', conducta: 'Conducta' },
  semaforo: { verde: 'Todo bien', ambar: 'Hace tiempo que no sabemos', rojo: 'Necesita una llamada' },
  medio: { whatsapp: 'WhatsApp', llamada: 'Llamada', visita: 'Visita', otro: 'Otro' },
};

// Traduce los errores de Supabase a mensajes comprensibles
export function mensajeError(error) {
  const m = String(error?.message || error || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.';
  if (m.includes('email not confirmed')) return 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese correo. Prueba ingresar o recuperar tu contraseña.';
  if (m.includes('password should be') || m.includes('weak')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Hiciste varios intentos seguidos. Espera un minuto e inténtalo de nuevo.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  if (m.includes('row-level security') || m.includes('permission')) return 'No tienes permiso para hacer esto con tu cuenta.';
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) return 'La foto es muy pesada. Prueba con otra.';
  if (m.includes('mime') || m.includes('invalid_mime')) return 'Ese tipo de archivo no es una imagen válida.';
  if (m.includes('duplicate key') && m.includes('adopciones_un_activa')) return 'Ese perro ya tiene una adopción activa.';
  if (m.includes('duplicate key')) return 'Ese dato ya está registrado.';
  return 'Algo no salió bien. Inténtalo de nuevo en un momento.';
}

// Aviso breve y accesible en la esquina inferior
export function aviso(texto, tipo = 'exito') {
  let zona = document.getElementById('zona-avisos');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'zona-avisos';
    zona.className = 'zona-avisos';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  const icono = tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle';
  const el = document.createElement('div');
  el.className = `aviso aviso-${tipo}`;
  el.innerHTML = `<i class="bi ${icono}" aria-hidden="true"></i><span>${esc(texto)}</span>`;
  zona.append(el);
  setTimeout(() => el.remove(), 4500);
}

// Enlace de WhatsApp con mensaje redactado
export function enlaceWhatsApp(telefono, mensaje) {
  let num = String(telefono || '').replace(/\D/g, '');
  if (num.length === 9) num = '51' + num;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}

// Pie de pagina comun: politica de privacidad y nota academica
export function pintarPie(destino = document.getElementById('pie')) {
  if (!destino) return;
  destino.innerHTML = `
    <div class="container py-5">
      <div class="row g-4 align-items-start">
        <div class="col-md-5">
          <a class="marca-pie" href="${ruta('index.html')}"><span class="marca-huella" aria-hidden="true"></span> Sigue mi Huella</a>
          <p class="mt-2 mb-0">Acompañamiento después de la adopción para el albergue ${esc(ALBERGUE.nombre)}, ${esc(ALBERGUE.ciudad)}.</p>
        </div>
        <nav class="col-md-4" aria-label="Enlaces del pie">
          <ul class="list-unstyled mb-0 d-grid gap-2">
            <li><a href="${ruta('apadrinar.html')}">Apadrina un perro</a></li>
            <li><a href="${ruta('privacidad.html')}">Política de privacidad y datos personales</a></li>
            <li><a href="${ruta('ingresar.html')}">Ingresar</a></li>
          </ul>
        </nav>
        <div class="col-md-3">
          <p class="mb-2"><a href="https://wa.me/${esc(ALBERGUE.whatsapp)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i> ${esc(ALBERGUE.whatsappVisible)}</a></p>
          <ul class="list-unstyled d-flex flex-wrap gap-3 mb-0 fs-4">
            <li><a href="${esc(ALBERGUE.sitio)}" target="_blank" rel="noopener" aria-label="Sitio oficial del albergue"><i class="bi bi-globe" aria-hidden="true"></i></a></li>
            <li><a href="${esc(ALBERGUE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook del albergue"><i class="bi bi-facebook" aria-hidden="true"></i></a></li>
            <li><a href="${esc(ALBERGUE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram del albergue"><i class="bi bi-instagram" aria-hidden="true"></i></a></li>
            <li><a href="${esc(ALBERGUE.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok del albergue"><i class="bi bi-tiktok" aria-hidden="true"></i></a></li>
          </ul>
        </div>
      </div>
      <div class="border-top mt-4 pt-4">
        <p class="small mb-0">Proyecto académico de la Universidad Continental, desarrollado para el albergue ${esc(ALBERGUE.nombre)}. No es la web institucional del albergue: su sitio oficial es <a href="${esc(ALBERGUE.sitio)}" target="_blank" rel="noopener">emiliarescataanimales.org</a>.</p>
      </div>
    </div>`;
}

// Activa un boton con indicador de carga
export function cargando(boton, activo, texto = 'Enviando...') {
  if (!boton) return;
  if (activo) {
    boton.dataset.original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${esc(texto)}`;
  } else {
    boton.disabled = false;
    if (boton.dataset.original) boton.innerHTML = boton.dataset.original;
  }
}

// Reduce una foto en el navegador antes de subirla (menos datos moviles)
export async function reducirImagen(archivo, ladoMax = 1600, calidad = 0.82) {
  if (!archivo || !archivo.type.startsWith('image/') || archivo.type === 'image/svg+xml') return archivo;
  try {
    const bmp = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(bmp.width * escala);
    lienzo.height = Math.round(bmp.height * escala);
    lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise((r) => lienzo.toBlob(r, 'image/jpeg', calidad));
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : archivo;
  } catch {
    return archivo; // formatos no soportados (p. ej. HEIC en algunos navegadores)
  }
}
