// Edge Function: crear-adoptante
// La llama el panel del albergue al registrar una adopcion nueva.
// Corre en los servidores de Supabase: aqui si existe la clave de servicio
// (variable de entorno que Supabase inyecta), nunca en el navegador.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responder(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function claveTemporal() {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return "Huella-" + Array.from(bytes, (b) => letras[b % letras.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "metodo_no_permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const servicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, servicio, { auth: { persistSession: false } });

  // 1. Verificar que quien llama es del equipo del albergue
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: quien, error: errQuien } = await admin.auth.getUser(jwt);
  if (errQuien || !quien?.user) return responder({ error: "sin_sesion" }, 401);

  const { data: perfil } = await admin.from("perfiles").select("rol").eq("id", quien.user.id).single();
  if (perfil?.rol !== "albergue") return responder({ error: "sin_permiso" }, 403);

  // 2. Validar datos
  let datos: { correo?: string; nombre_completo?: string; telefono?: string; distrito?: string };
  try {
    datos = await req.json();
  } catch {
    return responder({ error: "datos_invalidos" }, 400);
  }
  const correo = (datos.correo ?? "").trim().toLowerCase();
  const nombre = (datos.nombre_completo ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || nombre.length < 3) {
    return responder({ error: "datos_invalidos" }, 400);
  }

  // 3. Crear la cuenta (o reutilizar la existente si la familia ya adopto antes)
  let id: string | null = null;
  let clave: string | null = claveTemporal();
  const { data: creado, error: errCrear } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { nombre_completo: nombre, telefono: datos.telefono ?? null, distrito: datos.distrito ?? null },
  });

  if (errCrear) {
    const { data: existente } = await admin.rpc("buscar_usuario_por_correo", { p_correo: correo });
    if (!existente) return responder({ error: "no_se_pudo_crear" }, 400);
    id = existente as string;
    clave = null; // ya tenia cuenta: conserva su contrasena
  } else {
    id = creado.user!.id;
  }

  // 4. Completar el perfil (el disparador ya lo creo como adoptante)
  await admin.from("perfiles").upsert({
    id,
    nombre_completo: nombre,
    telefono: datos.telefono ?? null,
    distrito: datos.distrito ?? null,
  });

  return responder({ id, clave_temporal: clave, cuenta_existente: clave === null });
});
