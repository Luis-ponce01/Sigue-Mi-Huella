// Cliente unico de Supabase para todo el sitio.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_CLAVE_PUBLICA } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Raiz del sitio, calculada desde la ubicacion de este archivo (js/).
// Permite publicar el sitio en un subdirectorio sin cambiar rutas.
export const RAIZ = new URL('../', import.meta.url);
export const ruta = (relativa) => new URL(relativa, RAIZ).href;

// URL publica de un archivo de la cubeta "perros"
export function fotoPublica(rutaArchivo) {
  if (!rutaArchivo) return ruta('img/sin-foto.svg');
  if (/^https?:/.test(rutaArchivo)) return rutaArchivo;
  return supabase.storage.from('perros').getPublicUrl(rutaArchivo).data.publicUrl;
}

// URLs firmadas (temporales) para archivos de cubetas privadas
export async function fotosFirmadas(cubeta, rutas, segundos = 3600) {
  const validas = [...new Set(rutas.filter(Boolean))];
  if (!validas.length) return {};
  const { data, error } = await supabase.storage.from(cubeta).createSignedUrls(validas, segundos);
  if (error || !data) return {};
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}
