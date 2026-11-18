-- 004_datos_prueba.sql
-- Datos de prueba realistas para Huancayo.
-- Requisito: los usuarios de prueba deben existir en auth.users antes de ejecutar
-- (ver README, seccion "Configurar Supabase desde cero").
-- Todas las fechas son relativas a current_date para que el semaforo siempre muestre
-- los tres estados el dia en que se carguen los datos.

do $$
declare
  hoy date := current_date;
  u_albergue uuid;
  a record;
begin
  select id into u_albergue from auth.users where email = 'albergue@siguemihuella.example';
  update perfiles set rol = 'albergue' where id = u_albergue;

  -- -------------------------------------------------------------
  -- Aliados
  -- -------------------------------------------------------------
  insert into aliados (nombre, tipo, descuento, direccion, telefono, logo_ruta, activo) values
    ('Clínica Veterinaria Lobo Gris', 'veterinaria', '20 % en consultas y vacunas para perros adoptados en Emilia Rescata', 'Jr. Ancash 845, Huancayo', '964 000 101', 'aliados/lobo-gris.svg', true),
    ('Patitas del Valle', 'pet_shop', '10 % en alimento balanceado y collares', 'Av. Huancavelica 1320, El Tambo', '964 000 202', 'aliados/patitas.svg', true),
    ('Agroveterinaria Mantaro', 'veterinaria', 'Desparasitación a precio de costo', 'Av. Ferrocarril 560, Chilca', '964 000 303', 'aliados/mantaro.svg', true),
    ('Panificadora Wanka', 'empresa', 'Dona el 2 % de sus ventas de los sábados', 'Calle Real 1012, Huancayo', '964 000 404', 'aliados/wanka.svg', true);

  -- -------------------------------------------------------------
  -- Perros: 12 adoptados y 6 buscando hogar
  -- -------------------------------------------------------------
  insert into perros (codigo, nombre, sexo, tamano, fecha_nacimiento_aprox, fecha_rescate, historia, esterilizado, estado, foto_ruta) values
    ('EMR-001', 'Canela', 'hembra', 'mediano', hoy - 1300, hoy - 420, 'La encontraron bajo la lluvia frente al mercado de Chilca, con una pata lastimada. Hoy corre más rápido que nadie.', true, 'adoptado', 'catalogo/EMR-001.svg'),
    ('EMR-002', 'Rocky', 'macho', 'grande', hoy - 1800, hoy - 500, 'Vivía amarrado en un terreno baldío de El Tambo. Le costó confiar, pero ahora busca caricias a cada rato.', true, 'adoptado', 'catalogo/EMR-002.svg'),
    ('EMR-003', 'Luna', 'hembra', 'pequeno', hoy - 900, hoy - 380, 'Llegó con sus tres cachorros en una caja de cartón. Todos encontraron familia.', true, 'adoptado', 'catalogo/EMR-003.svg'),
    ('EMR-004', 'Toby', 'macho', 'mediano', hoy - 1100, hoy - 360, 'Lo rescataron de la carretera Central después de un atropello. Se recuperó por completo.', true, 'adoptado', 'catalogo/EMR-004.svg'),
    ('EMR-005', 'Manchas', 'macho', 'grande', hoy - 2000, hoy - 450, 'Un vecino de Pilcomayo avisó que llevaba días sin comer. Es tranquilo y muy noble.', true, 'adoptado', 'catalogo/EMR-005.svg'),
    ('EMR-006', 'Nina', 'hembra', 'pequeno', hoy - 700, hoy - 300, 'Apareció en la puerta del albergue una mañana de helada. Se quedó dormida en la primera manta que vio.', true, 'adoptado', 'catalogo/EMR-006.svg'),
    ('EMR-007', 'Bruno', 'macho', 'grande', hoy - 1500, hoy - 330, 'Lo dejaron en la plaza de Huancán. Es el guardián más dulce que hemos tenido.', true, 'adoptado', 'catalogo/EMR-007.svg'),
    ('EMR-008', 'Chispa', 'hembra', 'mediano', hoy - 800, hoy - 280, 'Rescatada de un techo en San Agustín de Cajas. Tiene energía para todo el barrio.', true, 'adoptado', 'catalogo/EMR-008.svg'),
    ('EMR-009', 'Pelusa', 'hembra', 'pequeno', hoy - 1200, hoy - 260, 'Tenía el pelo tan enredado que no se le veían los ojos. Después del baño, nadie la reconocía.', true, 'adoptado', 'catalogo/EMR-009.svg'),
    ('EMR-010', 'Max', 'macho', 'mediano', hoy - 1000, hoy - 250, 'Lo encontraron siguiendo a los escolares camino al colegio. Sigue siendo igual de sociable.', true, 'adoptado', 'catalogo/EMR-010.svg'),
    ('EMR-011', 'Kira', 'hembra', 'grande', hoy - 1400, hoy - 240, 'Estuvo meses en el albergue porque era tímida. Su familia tuvo paciencia y valió la pena.', true, 'adoptado', 'catalogo/EMR-011.svg'),
    ('EMR-012', 'Firulais', 'macho', 'pequeno', hoy - 600, hoy - 200, 'El más pequeño de una camada abandonada junto al río Shullcas.', true, 'adoptado', 'catalogo/EMR-012.svg'),
    ('EMR-013', 'Paquita', 'hembra', 'mediano', hoy - 1000, hoy - 90, 'Vivía en el paradero de combis de El Tambo. Saluda a todos moviendo la cola.', true, 'en_adopcion', 'catalogo/EMR-013.svg'),
    ('EMR-014', 'Tronco', 'macho', 'grande', hoy - 2200, hoy - 120, 'Un perro mayor y sereno. Ideal para una familia tranquila que quiera compañía.', true, 'en_adopcion', 'catalogo/EMR-014.svg'),
    ('EMR-015', 'Mía', 'hembra', 'pequeno', hoy - 400, hoy - 60, 'Juguetona y curiosa. La encontraron dentro de una llanta en Chilca.', false, 'en_adopcion', 'catalogo/EMR-015.svg'),
    ('EMR-016', 'Coco', 'macho', 'mediano', hoy - 900, hoy - 75, 'Llegó con miedo a las personas. Hoy ya se sienta cuando se lo piden.', true, 'en_adopcion', 'catalogo/EMR-016.svg'),
    ('EMR-017', 'Estrella', 'hembra', 'grande', hoy - 1600, hoy - 150, 'Tiene una mancha blanca en la frente y una paciencia infinita con los niños.', true, 'en_adopcion', 'catalogo/EMR-017.svg'),
    ('EMR-018', 'Pancho', 'macho', 'pequeno', hoy - 500, hoy - 45, 'Pequeño, valiente y comilón. Rescatado en la feria dominical de Huancayo.', false, 'en_adopcion', 'catalogo/EMR-018.svg');

  -- -------------------------------------------------------------
  -- Adopciones: cada adoptante con un perro
  -- -------------------------------------------------------------
  insert into adopciones (perro_id, adoptante_id, fecha_adopcion, consentimiento_datos, consentimiento_fecha, estado)
  select p.id, u.id, hoy - x.dias, true, (hoy - x.dias)::timestamptz, 'activa'
  from (values
    ('EMR-001', 'rosa.quispe@siguemihuella.example', 200),
    ('EMR-002', 'carlos.mendoza@siguemihuella.example', 180),
    ('EMR-003', 'maria.huaman@siguemihuella.example', 170),
    ('EMR-004', 'jorge.poma@siguemihuella.example', 160),
    ('EMR-005', 'lucia.ccanto@siguemihuella.example', 150),
    ('EMR-006', 'pedro.ramos@siguemihuella.example', 140),
    ('EMR-007', 'ana.cardenas@siguemihuella.example', 130),
    ('EMR-008', 'miguel.taipe@siguemihuella.example', 120),
    ('EMR-009', 'sofia.vilchez@siguemihuella.example', 110),
    ('EMR-010', 'diego.paucar@siguemihuella.example', 100),
    ('EMR-011', 'elena.yupanqui@siguemihuella.example', 150),
    ('EMR-012', 'raul.chuco@siguemihuella.example', 75)
  ) as x(codigo, email, dias)
  join perros p on p.codigo = x.codigo
  join auth.users u on u.email = x.email;

  -- -------------------------------------------------------------
  -- Reportes. Dias desde hoy de cada reporte, por perro.
  -- Verdes: EMR-001..007. Ambar: EMR-008, 009, 010. Rojos: EMR-011 (mas de 60 dias
  -- y vacuna vencida) y EMR-012 (ningun reporte desde la entrega).
  -- -------------------------------------------------------------
  insert into reportes (adopcion_id, fecha, foto_ruta, come_bien, vacunas_al_dia, problema, comentario, creado_en)
  select ad.id, hoy - r.dias,
         ad.adoptante_id::text || '/' || to_char(hoy - r.dias, 'YYYY-MM-DD') || '.svg',
         r.come::respuesta_alimentacion, r.vac::respuesta_vacunas, r.prob::respuesta_problema, r.coment,
         (hoy - r.dias)::timestamptz + interval '10 hours'
  from (values
    ('EMR-001', 5,   'si', 'si', 'todo_bien', 'Ya aprendió a dar la pata.'),
    ('EMR-001', 35,  'si', 'si', 'todo_bien', null),
    ('EMR-001', 65,  'si', 'si', 'todo_bien', 'Le encanta pasear por el parque de la Identidad.'),
    ('EMR-001', 95,  'mas_o_menos', 'si', 'tengo_duda', 'Estuvo un poco desganada con el frío.'),
    ('EMR-001', 125, 'si', 'si', 'todo_bien', null),
    ('EMR-001', 160, 'si', 'si', 'todo_bien', 'Primera semana en casa.'),
    ('EMR-002', 12,  'si', 'si', 'todo_bien', null),
    ('EMR-002', 45,  'si', 'si', 'todo_bien', null),
    ('EMR-002', 80,  'si', 'no_seguro', 'todo_bien', null),
    ('EMR-002', 140, 'si', 'si', 'todo_bien', null),
    ('EMR-003', 8,   'si', 'si', 'todo_bien', 'Duerme con los chicos.'),
    ('EMR-003', 40,  'si', 'si', 'todo_bien', null),
    ('EMR-003', 100, 'si', 'si', 'todo_bien', null),
    ('EMR-004', 20,  'si', 'si', 'todo_bien', null),
    ('EMR-004', 50,  'mas_o_menos', 'si', 'todo_bien', null),
    ('EMR-004', 110, 'si', 'si', 'todo_bien', null),
    ('EMR-005', 3,   'si', 'si', 'todo_bien', 'Ya no le teme a la moto del vecino.'),
    ('EMR-005', 33,  'si', 'si', 'todo_bien', null),
    ('EMR-005', 90,  'si', 'si', 'todo_bien', null),
    ('EMR-006', 15,  'si', 'si', 'todo_bien', null),
    ('EMR-006', 60,  'si', 'si', 'todo_bien', null),
    ('EMR-007', 25,  'si', 'si', 'tengo_duda', 'Rasca mucho la puerta cuando salimos.'),
    ('EMR-007', 70,  'si', 'si', 'todo_bien', null),
    ('EMR-008', 38,  'si', 'si', 'todo_bien', null),
    ('EMR-008', 85,  'si', 'si', 'todo_bien', null),
    ('EMR-009', 47,  'mas_o_menos', 'no_seguro', 'todo_bien', null),
    ('EMR-009', 90,  'si', 'si', 'todo_bien', null),
    ('EMR-010', 55,  'si', 'si', 'tengo_duda', 'Ladra mucho de noche.'),
    ('EMR-011', 85,  'si', 'no', 'todo_bien', null),
    ('EMR-011', 130, 'si', 'si', 'todo_bien', null)
  ) as r(codigo, dias, come, vac, prob, coment)
  join perros p on p.codigo = r.codigo
  join adopciones ad on ad.perro_id = p.id and ad.estado = 'activa';

  -- -------------------------------------------------------------
  -- Vacunas: aplicadas en el pasado y proximas en el futuro
  -- -------------------------------------------------------------
  insert into vacunas (perro_id, tipo, fecha_aplicada, fecha_proxima, aplicada, aliado_id)
  select p.id, v.tipo, case when v.aplicada then hoy - v.dias end,
         case when v.aplicada then null else hoy + v.dias end, v.aplicada,
         (select id from aliados where nombre like 'Clínica Veterinaria Lobo Gris')
  from perros p
  cross join (values
    ('Séxtuple (refuerzo)', true, 150),
    ('Antirrábica', true, 120),
    ('Desparasitación interna', true, 45),
    ('Desparasitación interna', false, 45),
    ('Antirrábica', false, 245)
  ) as v(tipo, aplicada, dias)
  where p.estado = 'adoptado';

  -- Proxima desparasitacion cercana para Canela (el adoptante de prueba la verá)
  update vacunas set fecha_proxima = hoy + 12
  where tipo = 'Desparasitación interna' and not aplicada
    and perro_id = (select id from perros where codigo = 'EMR-001');

  -- Vacuna vencida para Kira (rojo)
  update vacunas set fecha_proxima = hoy - 18
  where tipo = 'Desparasitación interna' and not aplicada
    and perro_id = (select id from perros where codigo = 'EMR-011');

  -- -------------------------------------------------------------
  -- Solicitudes de ayuda: una por motivo distinto
  -- -------------------------------------------------------------
  insert into solicitudes_ayuda (adopcion_id, motivo, detalle, estado, creado_en, resuelto_en)
  select ad.id, s.motivo::motivo_ayuda, s.detalle, s.estado::estado_solicitud,
         now() - (s.dias || ' days')::interval,
         case when s.estado = 'resuelta' then now() - ((s.dias - 3) || ' days')::interval end
  from (values
    ('EMR-010', 'conducta', 'Ladra toda la noche y los vecinos se quejan.', 'nueva', 2),
    ('EMR-009', 'dinero', null, 'en_proceso', 6),
    ('EMR-007', 'mudanza', 'Nos mudamos a Lima en marzo y no sabemos si podemos llevarlo.', 'resuelta', 20)
  ) as s(codigo, motivo, detalle, estado, dias)
  join perros p on p.codigo = s.codigo
  join adopciones ad on ad.perro_id = p.id and ad.estado = 'activa';

  -- -------------------------------------------------------------
  -- Notas internas y contactos
  -- -------------------------------------------------------------
  for a in
    select ad.id, p.codigo from adopciones ad join perros p on p.id = ad.perro_id
    where p.codigo in ('EMR-011', 'EMR-012', 'EMR-009', 'EMR-007')
  loop
    if a.codigo = 'EMR-011' then
      insert into notas_internas (adopcion_id, autor_id, texto, creado_en) values
        (a.id, u_albergue, 'La familia trabaja en turnos largos. Ofrecerle la desparasitación en Lobo Gris con descuento.', now() - interval '10 days');
      insert into contactos (adopcion_id, autor_id, medio, resultado, creado_en) values
        (a.id, u_albergue, 'llamada', 'No contestó. Volver a intentar el fin de semana.', now() - interval '9 days');
    elsif a.codigo = 'EMR-012' then
      insert into notas_internas (adopcion_id, autor_id, texto, creado_en) values
        (a.id, u_albergue, 'Adopción reciente. Raúl dijo que no tiene buena señal en Cajas; probar por WhatsApp.', now() - interval '20 days');
    elsif a.codigo = 'EMR-009' then
      insert into contactos (adopcion_id, autor_id, medio, resultado, creado_en) values
        (a.id, u_albergue, 'whatsapp', 'Pidió apoyo con alimento. Se coordinó una bolsa del fondo de padrinos.', now() - interval '5 days');
    else
      insert into contactos (adopcion_id, autor_id, medio, resultado, creado_en) values
        (a.id, u_albergue, 'visita', 'Conversamos sobre la mudanza. Se lo llevan a Lima, ya tienen departamento con patio.', now() - interval '17 days');
      insert into notas_internas (adopcion_id, autor_id, texto, creado_en) values
        (a.id, u_albergue, 'Pedir la nueva dirección en Lima cuando se muden.', now() - interval '17 days');
    end if;
  end loop;

  -- -------------------------------------------------------------
  -- Guias de cuidado (validadas por Lobo Gris)
  -- -------------------------------------------------------------
  insert into guias (titulo, categoria, contenido, validado_por, orden, publicada) values
    ('Cuánto y cuándo darle de comer', 'alimentacion',
     E'Un perro adulto come dos veces al día, a la misma hora. La rutina lo tranquiliza y ayuda a su digestión.\n\nLa cantidad depende de su tamaño: revisa la tabla del empaque y ajústala si notas que sube o baja de peso.\n\nNo le des huesos cocidos, chocolate, uva, cebolla ni comida muy condimentada. Pueden enfermarlo de gravedad.\n\nSiempre debe tener agua limpia a su alcance, también en invierno.', 'Clínica Veterinaria Lobo Gris', 1, true),
    ('Cambiar de alimento sin problemas', 'alimentacion',
     E'Si vas a cambiarle la marca o el tipo de comida, hazlo de a pocos durante una semana.\n\nMezcla un cuarto de la comida nueva con tres cuartos de la anterior, y aumenta la proporción cada dos días.\n\nSi tiene diarrea o vómitos por más de un día, consulta con la veterinaria.', 'Clínica Veterinaria Lobo Gris', 2, true),
    ('El calendario de vacunas', 'salud',
     E'La vacuna antirrábica es obligatoria y se repite cada año. La séxtuple protege contra enfermedades graves como el moquillo y el parvovirus.\n\nGuarda el carnet y revisa en Sigue mi Huella cuándo toca la próxima. Te avisaremos con tiempo.\n\nSi se te pasó una fecha, no pasa nada: llévalo apenas puedas y avísanos.', 'Clínica Veterinaria Lobo Gris', 3, true),
    ('Señales de que algo no anda bien', 'salud',
     E'Fíjate si deja de comer más de un día, si está decaído, si tose, si vomita o si tiene diarrea con sangre.\n\nTambién son señales de alerta que cojee, que se rasque sin parar o que beba mucha más agua de lo normal.\n\nAnte cualquiera de estas señales, consulta pronto. Es más barato atender a tiempo que tratar una enfermedad avanzada.', 'Clínica Veterinaria Lobo Gris', 4, true),
    ('El baño justo', 'higiene',
     E'Con un baño al mes es suficiente. Bañarlo seguido le reseca la piel.\n\nUsa champú para perros y agua tibia. Sécalo bien, sobre todo en los días fríos de Huancayo.\n\nCepíllalo una o dos veces por semana: le quita el pelo muerto y te ayuda a revisar si tiene pulgas o heridas.', 'Clínica Veterinaria Lobo Gris', 5, true),
    ('Pulgas y garrapatas', 'higiene',
     E'Revisa detrás de las orejas, entre los dedos y en la base de la cola.\n\nLa desparasitación externa se hace cada uno a tres meses, según el producto. Pregunta en la veterinaria cuál le conviene.\n\nLava su cama o manta cada dos semanas con agua caliente.', 'Clínica Veterinaria Lobo Gris', 6, true),
    ('Los primeros días en casa', 'conducta',
     E'Es normal que los primeros días esté nervioso, se esconda o no quiera comer. Dale espacio y tiempo.\n\nPrepárale un rincón tranquilo con su cama y agua. Ese será su lugar seguro.\n\nNo lo regañes si hace sus necesidades dentro: llévalo afuera después de comer y felicítalo cuando lo haga bien.', 'Clínica Veterinaria Lobo Gris', 7, true),
    ('Si ladra o llora cuando se queda solo', 'conducta',
     E'Muchos perros rescatados extrañan a su familia cuando salen. No es malcriadez, es ansiedad.\n\nAcostúmbralo de a pocos: sal cinco minutos, regresa sin hacer fiesta, y ve alargando el tiempo.\n\nDéjale un juguete o una prenda con tu olor. Un paseo antes de salir lo ayuda a descansar.\n\nSi sigue igual después de unas semanas, escríbenos: podemos orientarte.', 'Clínica Veterinaria Lobo Gris', 8, true);

  -- -------------------------------------------------------------
  -- Movimientos: seis meses
  -- -------------------------------------------------------------
  insert into movimientos (tipo, concepto, monto, fecha, categoria)
  select m.tipo::tipo_movimiento, m.concepto, m.monto, least(hoy, (date_trunc('month', hoy) - (m.mes || ' months')::interval + interval '9 days')::date), m.categoria
  from (values
    ('ingreso', 'Donaciones por Yape y Plin', 980, 5, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 450, 5, 'Padrinazgos'),
    ('egreso', 'Alimento balanceado', 820, 5, 'Alimento'),
    ('egreso', 'Vacunas y consultas', 390, 5, 'Veterinaria'),
    ('ingreso', 'Donaciones por Yape y Plin', 760, 4, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 480, 4, 'Padrinazgos'),
    ('ingreso', 'Rifa solidaria', 600, 4, 'Actividades'),
    ('egreso', 'Alimento balanceado', 850, 4, 'Alimento'),
    ('egreso', 'Campaña de esterilización', 700, 4, 'Esterilización'),
    ('ingreso', 'Donaciones por Yape y Plin', 1120, 3, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 510, 3, 'Padrinazgos'),
    ('egreso', 'Alimento balanceado', 880, 3, 'Alimento'),
    ('egreso', 'Cirugía de Toby', 540, 3, 'Veterinaria'),
    ('ingreso', 'Donaciones por Yape y Plin', 890, 2, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 540, 2, 'Padrinazgos'),
    ('egreso', 'Alimento balanceado', 860, 2, 'Alimento'),
    ('egreso', 'Mantas y casitas para el invierno', 320, 2, 'Albergue'),
    ('ingreso', 'Donaciones por Yape y Plin', 1040, 1, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 570, 1, 'Padrinazgos'),
    ('ingreso', 'Aporte de Panificadora Wanka', 280, 1, 'Aliados'),
    ('egreso', 'Alimento balanceado', 900, 1, 'Alimento'),
    ('egreso', 'Vacunas y consultas', 450, 1, 'Veterinaria'),
    ('ingreso', 'Donaciones por Yape y Plin', 930, 0, 'Donaciones'),
    ('ingreso', 'Padrinos mensuales', 600, 0, 'Padrinazgos'),
    ('egreso', 'Alimento balanceado', 910, 0, 'Alimento'),
    ('egreso', 'Transporte a la veterinaria', 180, 0, 'Transporte')
  ) as m(tipo, concepto, monto, mes, categoria);

  -- Padrinazgos de ejemplo
  insert into padrinazgos (perro_id, nombre_padrino, correo_padrino, monto_mensual, estado)
  select id, 'Padrino de ejemplo', 'padrino@siguemihuella.example', 30, 'activo'
  from perros where codigo in ('EMR-014', 'EMR-017');
end;
$$;
