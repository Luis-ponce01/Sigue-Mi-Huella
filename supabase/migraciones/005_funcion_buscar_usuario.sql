-- 005_funcion_buscar_usuario.sql
-- Usada solo por la Edge Function crear-adoptante (con clave de servicio)
-- para reutilizar la cuenta de una familia que ya adopto antes.

create or replace function buscar_usuario_por_correo(p_correo text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_correo) limit 1;
$$;

revoke all on function buscar_usuario_por_correo(text) from public, anon, authenticated;
grant execute on function buscar_usuario_por_correo(text) to service_role;
