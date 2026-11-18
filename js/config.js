// =====================================================================
// Configuracion publica de Supabase. Es el UNICO archivo que hay que
// cambiar para apuntar el sitio a otro proyecto.
//
// ADVERTENCIA: aqui solo va la clave PUBLICA (publishable / anon).
// Esa clave esta pensada para vivir en el navegador: los permisos reales
// los imponen las politicas de Row Level Security de la base de datos.
//
// JAMAS escribas en este archivo, ni en ningun otro archivo del sitio:
//   - la clave de servicio (service_role / sb_secret_...)
//   - el token de acceso personal de Supabase (sbp_...)
// Cualquiera que abra el sitio podria leerlas y tomar control de la base.
// =====================================================================

export const SUPABASE_URL = 'https://ushecotfztyydzutryqt.supabase.co';
export const SUPABASE_CLAVE_PUBLICA = 'sb_publishable_W_1V10QfAYb3B3YiU20sOQ_sLC997CA';

// Datos de contacto del albergue que aparecen en el sitio.
// Fuente: su pagina oficial, https://www.emiliarescataanimales.org
// El albergue no publica correo: su canal de contacto es WhatsApp.
// PENDIENTE: direccion fisica, horario y si tienen Yape o Plin
// (ver DATOS-PENDIENTES.md). No inventar valores para esos datos.
export const ALBERGUE = {
  nombre: 'Emilia Rescata',
  ciudad: 'Huancayo, Junín, Perú',
  whatsapp: '51955646940', // formato internacional, sin signos
  whatsappVisible: '+51 955 646 940',
  sitio: 'https://www.emiliarescataanimales.org',
  donaciones: 'https://www.emiliarescataanimales.org/donaciones',
  facebook: 'https://www.facebook.com/Emiliarescata',
  instagram: 'https://www.instagram.com/emiliarescataanimaleshuancayo',
  tiktok: 'https://www.tiktok.com/@emiliarescata',
  formularioAdopcion: 'https://docs.google.com/forms/d/e/1FAIpQLScHEohB9ejWm6yKkDnHEGjm1-myaN8jXKIytwVZHroGsFryYw/viewform',
};
