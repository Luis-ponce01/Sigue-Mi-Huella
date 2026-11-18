-- pruebas/rls.sql
-- Verifica las politicas de Row Level Security simulando a cada tipo de usuario.
-- Se ejecuta dentro de una transaccion que se revierte: no deja rastro.
-- Resultado esperado: todas las filas con ok = true.

begin;

create temp table resultados (prueba text, obtenido text, esperado text, ok boolean);
grant all on resultados to anon, authenticated;

select set_config('pruebas.rosa', (select id::text from auth.users where email = 'rosa.quispe@siguemihuella.example'), true);
select set_config('pruebas.albergue', (select id::text from auth.users where email = 'albergue@siguemihuella.example'), true);
select set_config('pruebas.adopcion_ajena', (
  select a.id::text from adopciones a join auth.users u on u.id = a.adoptante_id
  where u.email = 'carlos.mendoza@siguemihuella.example'), true);

-- ---------------------------------------------------------------
-- Adoptante (Rosa)
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', current_setting('pruebas.rosa'), 'role', 'authenticated')::text, true);
set local role authenticated;

insert into resultados
select '1. Adoptante lee reportes de otras familias', count(*)::text, '0', count(*) = 0
from reportes r join adopciones a on a.id = r.adopcion_id
where a.adoptante_id::text <> current_setting('pruebas.rosa');

insert into resultados
select '1b. Adoptante lee sus propios reportes', count(*)::text, 'mayor a 0', count(*) > 0 from reportes;

insert into resultados
select '2. Adoptante lee notas internas', count(*)::text, '0', count(*) = 0 from notas_internas;

insert into resultados
select '2b. Adoptante lee registro de contactos', count(*)::text, '0', count(*) = 0 from contactos;

insert into resultados
select '2c. Adoptante ve adopciones ajenas', count(*)::text, '0', count(*) = 0
from adopciones where adoptante_id::text <> current_setting('pruebas.rosa');

insert into resultados
select '2d. Adoptante ve filas del semaforo ajenas', count(*)::text, '0', count(*) = 0
from vista_semaforo where adoptante_id::text <> current_setting('pruebas.rosa');

do $$
begin
  begin
    insert into reportes (adopcion_id, come_bien, vacunas_al_dia, problema)
    values (current_setting('pruebas.adopcion_ajena')::uuid, 'si', 'si', 'todo_bien');
    insert into resultados values ('2e. Adoptante crea reporte en adopcion ajena', 'permitido', 'rechazado', false);
  exception when others then
    insert into resultados values ('2e. Adoptante crea reporte en adopcion ajena', 'rechazado', 'rechazado', true);
  end;
end $$;

with cambiados as (
  update reportes set comentario = 'modificado' returning 1
)
insert into resultados
select '2f. Adoptante modifica un reporte enviado', count(*)::text, '0', count(*) = 0 from cambiados;

with borrados as (
  delete from reportes returning 1
)
insert into resultados
select '2g. Adoptante borra un reporte enviado', count(*)::text, '0', count(*) = 0 from borrados;

reset role;

-- ---------------------------------------------------------------
-- Visitante anonimo
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
declare n int;
begin
  begin
    select count(*) into n from adopciones;
    insert into resultados values ('3. Anonimo lee adopciones', n::text, '0 o sin permiso', n = 0);
  exception when insufficient_privilege then
    insert into resultados values ('3. Anonimo lee adopciones', 'sin permiso', '0 o sin permiso', true);
  end;
  begin
    select count(*) into n from vista_semaforo;
    insert into resultados values ('3b. Anonimo lee el semaforo', n::text, '0 o sin permiso', n = 0);
  exception when insufficient_privilege then
    insert into resultados values ('3b. Anonimo lee el semaforo', 'sin permiso', '0 o sin permiso', true);
  end;
  begin
    select count(*) into n from padrinazgos;
    insert into resultados values ('3c. Anonimo lee padrinazgos', n::text, '0 o sin permiso', n = 0);
  exception when insufficient_privilege then
    insert into resultados values ('3c. Anonimo lee padrinazgos', 'sin permiso', '0 o sin permiso', true);
  end;
end $$;

insert into resultados
select '3d. Anonimo lee perros en adopcion', count(*)::text, 'mayor a 0', count(*) > 0 from perros;
insert into resultados
select '3e. Anonimo ve perros ya adoptados', count(*)::text, '0', count(*) = 0 from perros where estado <> 'en_adopcion';

reset role;

-- ---------------------------------------------------------------
-- Equipo del albergue
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', current_setting('pruebas.albergue'), 'role', 'authenticated')::text, true);
set local role authenticated;

insert into resultados
select '4. Albergue lee todas las adopciones', count(*)::text, '12 o mas', count(*) >= 12 from adopciones;
insert into resultados
select '4b. Albergue lee notas internas', count(*)::text, 'mayor a 0', count(*) > 0 from notas_internas;

reset role;

select * from resultados order by prueba;

rollback;
