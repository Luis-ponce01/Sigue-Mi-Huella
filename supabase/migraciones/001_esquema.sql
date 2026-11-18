-- 001_esquema.sql
-- Sigue mi Huella: tipos, tablas, disparadores e indices.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------
create type rol_usuario as enum ('albergue', 'adoptante');
create type estado_perro as enum ('en_albergue', 'en_adopcion', 'adoptado', 'devuelto', 'fallecido');
create type tamano_perro as enum ('pequeno', 'mediano', 'grande');
create type estado_adopcion as enum ('activa', 'devuelta', 'cerrada');
create type respuesta_alimentacion as enum ('si', 'mas_o_menos', 'no');
create type respuesta_vacunas as enum ('si', 'no', 'no_seguro');
create type respuesta_problema as enum ('todo_bien', 'tengo_duda', 'necesito_ayuda');
create type motivo_ayuda as enum ('conducta', 'dinero', 'mudanza', 'no_puedo_seguir');
create type estado_solicitud as enum ('nueva', 'en_proceso', 'resuelta');
create type categoria_guia as enum ('alimentacion', 'salud', 'higiene', 'conducta');
create type tipo_aliado as enum ('veterinaria', 'pet_shop', 'empresa');
create type tipo_movimiento as enum ('ingreso', 'egreso');

-- ---------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------
create table perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null default '',
  telefono text,
  distrito text,
  rol rol_usuario not null default 'adoptante',
  creado_en timestamptz not null default now()
);

create table perros (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  sexo text not null check (sexo in ('macho', 'hembra')),
  tamano tamano_perro not null,
  fecha_nacimiento_aprox date,
  fecha_rescate date,
  historia text,
  esterilizado boolean not null default false,
  estado estado_perro not null default 'en_albergue',
  foto_ruta text,
  creado_en timestamptz not null default now()
);

create table adopciones (
  id uuid primary key default gen_random_uuid(),
  perro_id uuid not null references perros (id) on delete restrict,
  adoptante_id uuid not null references perfiles (id) on delete restrict,
  fecha_adopcion date not null default current_date,
  acta_ruta text,
  firma_ruta text,
  consentimiento_datos boolean not null default false,
  consentimiento_fecha timestamptz,
  estado estado_adopcion not null default 'activa',
  creado_en timestamptz not null default now()
);

-- Un perro no puede tener dos adopciones activas a la vez
create unique index adopciones_un_activa_por_perro
  on adopciones (perro_id) where estado = 'activa';

create table reportes (
  id uuid primary key default gen_random_uuid(),
  adopcion_id uuid not null references adopciones (id) on delete cascade,
  fecha date not null default current_date,
  foto_ruta text,
  come_bien respuesta_alimentacion not null,
  vacunas_al_dia respuesta_vacunas not null,
  problema respuesta_problema not null,
  comentario text,
  creado_en timestamptz not null default now()
);

create table aliados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo tipo_aliado not null,
  descuento text,
  direccion text,
  telefono text,
  logo_ruta text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table vacunas (
  id uuid primary key default gen_random_uuid(),
  perro_id uuid not null references perros (id) on delete cascade,
  tipo text not null,
  fecha_aplicada date,
  fecha_proxima date,
  aplicada boolean not null default false,
  aliado_id uuid references aliados (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table solicitudes_ayuda (
  id uuid primary key default gen_random_uuid(),
  adopcion_id uuid not null references adopciones (id) on delete cascade,
  motivo motivo_ayuda not null,
  detalle text,
  estado estado_solicitud not null default 'nueva',
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create table guias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria categoria_guia not null,
  contenido text not null,
  validado_por text,
  orden int not null default 0,
  publicada boolean not null default true,
  creado_en timestamptz not null default now()
);

create table padrinazgos (
  id uuid primary key default gen_random_uuid(),
  perro_id uuid references perros (id) on delete set null,
  nombre_padrino text not null,
  correo_padrino text not null,
  monto_mensual numeric(10, 2) not null check (monto_mensual > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'cancelado')),
  creado_en timestamptz not null default now()
);

create table movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_movimiento not null,
  concepto text not null,
  monto numeric(10, 2) not null check (monto >= 0),
  fecha date not null default current_date,
  categoria text not null,
  creado_en timestamptz not null default now()
);

create table notas_internas (
  id uuid primary key default gen_random_uuid(),
  adopcion_id uuid not null references adopciones (id) on delete cascade,
  autor_id uuid references perfiles (id) on delete set null,
  texto text not null,
  creado_en timestamptz not null default now()
);

create table contactos (
  id uuid primary key default gen_random_uuid(),
  adopcion_id uuid not null references adopciones (id) on delete cascade,
  autor_id uuid references perfiles (id) on delete set null,
  medio text not null check (medio in ('whatsapp', 'llamada', 'visita', 'otro')),
  resultado text,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Perfil automatico al registrarse (siempre como adoptante)
-- ---------------------------------------------------------------
create or replace function crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre_completo, telefono, distrito, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', ''),
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'distrito',
    'adoptante'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------
-- Indices en claves foraneas y fechas de ordenamiento
-- ---------------------------------------------------------------
create index on adopciones (perro_id);
create index on adopciones (adoptante_id);
create index on adopciones (fecha_adopcion);
create index on reportes (adopcion_id);
create index on reportes (fecha desc);
create index on vacunas (perro_id);
create index on vacunas (aliado_id);
create index on vacunas (fecha_proxima);
create index on solicitudes_ayuda (adopcion_id);
create index on solicitudes_ayuda (creado_en desc);
create index on padrinazgos (perro_id);
create index on movimientos (fecha desc);
create index on notas_internas (adopcion_id);
create index on notas_internas (autor_id);
create index on notas_internas (creado_en desc);
create index on contactos (adopcion_id);
create index on contactos (autor_id);
create index on contactos (creado_en desc);
create index on guias (orden);
