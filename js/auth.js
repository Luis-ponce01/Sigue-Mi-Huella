// Sesion, roles y proteccion de paginas internas.
import { supabase, ruta } from './supabase.js';

export async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function obtenerPerfil(idUsuario) {
  const { data } = await supabase.from('perfiles').select('*').eq('id', idUsuario).maybeSingle();
  return data;
}

export function paginaInicioDe(rol) {
  return rol === 'albergue' ? ruta('albergue/index.html') : ruta('adoptante/index.html');
}

// Llamar al cargar cada pagina interna. Si no hay sesion, o el rol no
// corresponde, redirige. Devuelve { sesion, perfil } cuando todo esta bien.
export async function requerirSesion(rolRequerido) {
  document.documentElement.classList.add('verificando');
  const sesion = await obtenerSesion();
  if (!sesion) {
    const volver = encodeURIComponent(location.pathname + location.search);
    location.replace(ruta(`ingresar.html?volver=${volver}`));
    return new Promise(() => {}); // detiene la ejecucion de la pagina
  }
  const perfil = await obtenerPerfil(sesion.user.id);
  if (!perfil || (rolRequerido && perfil.rol !== rolRequerido)) {
    location.replace(perfil ? paginaInicioDe(perfil.rol) : ruta('ingresar.html'));
    return new Promise(() => {});
  }
  document.documentElement.classList.remove('verificando');
  return { sesion, perfil };
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
  location.replace(ruta('index.html'));
}

// Conecta cualquier boton con data-cerrar-sesion
export function activarCerrarSesion() {
  document.querySelectorAll('[data-cerrar-sesion]').forEach((b) =>
    b.addEventListener('click', (e) => { e.preventDefault(); cerrarSesion(); })
  );
}
