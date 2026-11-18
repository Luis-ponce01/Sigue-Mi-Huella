-- 003_seguridad.sql
-- Row Level Security en todas las tablas, funcion es_albergue() y almacenamiento.

-- ---------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------
create or replace function es_albergue()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'albergue'
  );
$$;

-- Devuelve verdadero si la adopcion pertenece al usuario autenticado
create or replace function es_mi_adopcion(p_adopcion uuid, solo_activa boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.adopciones
    where id = p_adopcion
      and adoptante_id = auth.uid()
      and (not solo_activa or estado = 'activa')
  );
$$;

-- Devuelve verdadero si el perro fue adoptado por el usuario autenticado
create or replace function es_mi_perro(p_perro uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.adopciones
    where perro_id = p_perro and adoptante_id = auth.uid()
  );
$$;

revoke all on function es_albergue() from public;
revoke all on function es_mi_adopcion(uuid, boolean) from public;
revoke all on function es_mi_perro(uuid) from public;
grant execute on function es_albergue() to anon, authenticated;
grant execute on function es_mi_adopcion(uuid, boolean) to anon, authenticated;
grant execute on function es_mi_perro(uuid) to anon, authenticated;

-- ---------------------------------------------------------------
-- Activar RLS en todas las tablas
-- ---------------------------------------------------------------
alter table perfiles enable row level security;
alter table perros enable row level security;
alter table adopciones enable row level security;
alter table reportes enable row level security;
alter table vacunas enable row level security;
alter table solicitudes_ayuda enable row level security;
alter table aliados enable row level security;
alter table guias enable row level security;
alter table padrinazgos enable row level security;
alter table movimientos enable row level security;
alter table notas_internas enable row level security;
alter table contactos enable row level security;

-- ---------------------------------------------------------------
-- perfiles
-- ---------------------------------------------------------------
create policy perfiles_leer_propio on perfiles
  for select to authenticated using (id = auth.uid());
create policy perfiles_albergue_todo on perfiles
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- perros
-- ---------------------------------------------------------------
create policy perros_publico_en_adopcion on perros
  for select to anon, authenticated using (estado = 'en_adopcion');
create policy perros_adoptante_suyo on perros
  for select to authenticated using (es_mi_perro(id));
create policy perros_albergue_todo on perros
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- adopciones
-- ---------------------------------------------------------------
create policy adopciones_adoptante_suya on adopciones
  for select to authenticated using (adoptante_id = auth.uid());
create policy adopciones_albergue_todo on adopciones
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- reportes: el adoptante lee y crea los suyos; no modifica ni borra
-- ---------------------------------------------------------------
create policy reportes_adoptante_leer on reportes
  for select to authenticated using (es_mi_adopcion(adopcion_id));
create policy reportes_adoptante_crear on reportes
  for insert to authenticated with check (es_mi_adopcion(adopcion_id, true));
create policy reportes_albergue_todo on reportes
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- vacunas
-- ---------------------------------------------------------------
create policy vacunas_adoptante_leer on vacunas
  for select to authenticated using (es_mi_perro(perro_id));
create policy vacunas_albergue_todo on vacunas
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- solicitudes_ayuda
-- ---------------------------------------------------------------
create policy solicitudes_adoptante_leer on solicitudes_ayuda
  for select to authenticated using (es_mi_adopcion(adopcion_id));
create policy solicitudes_adoptante_crear on solicitudes_ayuda
  for insert to authenticated
  with check (es_mi_adopcion(adopcion_id, true) and estado = 'nueva' and resuelto_en is null);
create policy solicitudes_albergue_todo on solicitudes_ayuda
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- aliados, guias, movimientos: lectura publica filtrada
-- ---------------------------------------------------------------
create policy aliados_publico on aliados
  for select to anon, authenticated using (activo);
create policy aliados_albergue_todo on aliados
  for all to authenticated using (es_albergue()) with check (es_albergue());

create policy guias_publico on guias
  for select to anon, authenticated using (publicada);
create policy guias_albergue_todo on guias
  for all to authenticated using (es_albergue()) with check (es_albergue());

create policy movimientos_publico on movimientos
  for select to anon, authenticated using (true);
create policy movimientos_albergue_todo on movimientos
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- padrinazgos: cualquiera inserta, solo el albergue lee
-- ---------------------------------------------------------------
create policy padrinazgos_crear on padrinazgos
  for insert to anon, authenticated with check (estado = 'pendiente');
create policy padrinazgos_albergue_todo on padrinazgos
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- ---------------------------------------------------------------
-- notas_internas y contactos: exclusivos del albergue
-- ---------------------------------------------------------------
create policy notas_solo_albergue on notas_internas
  for all to authenticated using (es_albergue()) with check (es_albergue());
create policy contactos_solo_albergue on contactos
  for all to authenticated using (es_albergue()) with check (es_albergue());

-- Defensa adicional: el rol anonimo no tiene ningun privilegio sobre estas tablas
revoke all on notas_internas, contactos, adopciones, reportes, solicitudes_ayuda, perfiles, vacunas from anon;
revoke select, update, delete on padrinazgos from anon;

-- ---------------------------------------------------------------
-- Almacenamiento
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('perros', 'perros', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('reportes', 'reportes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/svg+xml']),
  ('actas', 'actas', false, 5242880, array['image/png', 'image/jpeg', 'application/pdf'])
on conflict (id) do nothing;

-- perros: lectura publica, escritura solo del albergue
create policy perros_archivos_leer on storage.objects
  for select to anon, authenticated using (bucket_id = 'perros');
create policy perros_archivos_albergue_crear on storage.objects
  for insert to authenticated with check (bucket_id = 'perros' and public.es_albergue());
create policy perros_archivos_albergue_editar on storage.objects
  for update to authenticated using (bucket_id = 'perros' and public.es_albergue());
create policy perros_archivos_albergue_borrar on storage.objects
  for delete to authenticated using (bucket_id = 'perros' and public.es_albergue());

-- reportes: cada adoptante solo en su carpeta; el albergue lee todo
create policy reportes_archivos_adoptante_crear on storage.objects
  for insert to authenticated
  with check (bucket_id = 'reportes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy reportes_archivos_adoptante_leer on storage.objects
  for select to authenticated
  using (bucket_id = 'reportes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy reportes_archivos_albergue on storage.objects
  for all to authenticated
  using (bucket_id = 'reportes' and public.es_albergue())
  with check (bucket_id = 'reportes' and public.es_albergue());

-- actas: solo el albergue
create policy actas_archivos_albergue on storage.objects
  for all to authenticated
  using (bucket_id = 'actas' and public.es_albergue())
  with check (bucket_id = 'actas' and public.es_albergue());
