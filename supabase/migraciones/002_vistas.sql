-- 002_vistas.sql
-- Vistas del semaforo y de indicadores.
-- security_invoker = true: las vistas respetan las politicas RLS de quien consulta,
-- por eso en la practica solo el equipo del albergue ve todas las filas.

create or replace view vista_semaforo
with (security_invoker = true)
as
with ultimo as (
  select distinct on (r.adopcion_id)
    r.adopcion_id, r.fecha, r.foto_ruta
  from reportes r
  order by r.adopcion_id, r.fecha desc, r.creado_en desc
),
vencidas as (
  select v.perro_id, count(*) as cantidad
  from vacunas v
  where not v.aplicada and v.fecha_proxima < current_date
  group by v.perro_id
),
base as (
  select
    a.id as adopcion_id,
    a.fecha_adopcion,
    p.id as perro_id,
    p.codigo as perro_codigo,
    p.nombre as perro_nombre,
    p.foto_ruta as perro_foto_ruta,
    f.id as adoptante_id,
    f.nombre_completo as familia_nombre,
    f.telefono as familia_telefono,
    f.distrito as familia_distrito,
    u.fecha as ultimo_reporte,
    u.foto_ruta as ultima_foto_ruta,
    (current_date - coalesce(u.fecha, a.fecha_adopcion))::int as dias_sin_reporte,
    coalesce(vc.cantidad, 0) > 0 as vacuna_vencida
  from adopciones a
  join perros p on p.id = a.perro_id
  join perfiles f on f.id = a.adoptante_id
  left join ultimo u on u.adopcion_id = a.id
  left join vencidas vc on vc.perro_id = p.id
  where a.estado = 'activa'
)
select
  base.*,
  case
    when dias_sin_reporte > 60 or vacuna_vencida then 'rojo'
    when dias_sin_reporte > 30 then 'ambar'
    else 'verde'
  end as estado,
  case
    when dias_sin_reporte > 60 or vacuna_vencida then 1
    when dias_sin_reporte > 30 then 2
    else 3
  end as prioridad
from base;

create or replace view vista_indicadores
with (security_invoker = true)
as
select
  (select count(*) from vista_semaforo)::int as perros_adoptados,
  (select count(*) from reportes
     where date_trunc('month', fecha) = date_trunc('month', current_date))::int as reportes_mes,
  (select count(*) from vista_semaforo where estado = 'rojo')::int as casos_rojo,
  (select case when count(*) = 0 then 100
          else round(100.0 * count(*) filter (where not vacuna_vencida) / count(*))
          end
     from vista_semaforo)::int as porcentaje_vacunas_al_dia;
