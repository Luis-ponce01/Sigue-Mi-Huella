// Utilidades compartidas por las cuatro pantallas del portal del adoptante.
import { supabase } from '../js/supabase.js';
import { requerirSesion, activarCerrarSesion } from '../js/auth.js';
import { pintarPie, esc } from '../js/comun.js';

// Verifica la sesion del adoptante, conecta el boton Salir y pinta el pie.
export async function iniciarPortal() {
  const { sesion, perfil } = await requerirSesion('adoptante');
  activarCerrarSesion();
  pintarPie();
  return { sesion, perfil, uid: sesion.user.id };
}

// Adopcion activa del usuario con su perro. Devuelve null si no tiene una.
export async function cargarAdopcion(uid) {
  const { data, error } = await supabase
    .from('adopciones')
    .select('id, fecha_adopcion, estado, perro:perros(*)')
    .eq('adoptante_id', uid)
    .eq('estado', 'activa')
    .order('fecha_adopcion', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.perro) return null;
  return { adopcion: data, perro: data.perro };
}

export function primerNombre(perfil) {
  const nombre = String(perfil?.nombre_completo || '').trim().split(/\s+/)[0];
  return nombre || '';
}

// Concordancia de genero para los textos: "verla" / "verlo", "cuidada" / "cuidado"
export function genero(perro) {
  const hembra = perro?.sexo === 'hembra';
  return { lo: hembra ? 'la' : 'lo', o: hembra ? 'a' : 'o', el: hembra ? 'ella' : 'él' };
}

// Mes en formato 'AAAA-MM' de una fecha 'AAAA-MM-DD'
export const mesDe = (fecha) => String(fecha || '').slice(0, 7);

// Mensaje amable cuando la cuenta todavia no tiene una adopcion activa
export function htmlSinAdopcion() {
  return `
    <div class="estado-vacio fundido">
      <i class="bi bi-house-heart" aria-hidden="true"></i>
      <h1 class="h3 text-body">Todavía no vemos una adopción en tu cuenta</h1>
      <p class="mb-0">Cuando el albergue registre la adopción de tu perro, aquí podrás ver su carnet y contarnos cada mes cómo está. Si crees que ya debería aparecer, escríbele al albergue y lo revisan contigo.</p>
    </div>`;
}

export function htmlErrorCarga(texto) {
  return `
    <div class="estado-vacio fundido" role="alert">
      <i class="bi bi-cloud-slash" aria-hidden="true" style="color: var(--smh-terracota)"></i>
      <p class="mb-3">${esc(texto)}</p>
      <button type="button" class="btn btn-outline-primary" onclick="location.reload()">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Intentar de nuevo
      </button>
    </div>`;
}
