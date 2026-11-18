# Sigue mi Huella

Plataforma de acompañamiento después de la adopción para el albergue de rescate animal **Emilia Rescata**, de Huancayo (Junín, Perú).

Proyecto del curso de Liderazgo e Innovación de la Universidad Continental, desarrollado con metodología Design Thinking y construido para que el albergue lo use de verdad.

---

## El problema

El albergue no tiene cómo saber qué pasa con los perros después de la adopción. Según su fundadora, solo cerca del 30 % de las adopciones recibe buen cuidado; del resto, los perros se pierden, son atropellados o mueren. El albergue lo sostienen tres personas y su límite real es el tiempo.

El insight que guía el producto: **el albergue concentra todo su rigor en elegir bien al adoptante y ninguna de sus fuerzas en acompañarlo después**, porque el vínculo se diseñó para terminar en la entrega. El abandono no es crueldad: es el resultado previsible de una relación que nadie sostuvo.

## Qué hace

- **Adoptante:** una vez al mes envía una foto y responde tres preguntas de un toque (tres toques en total además de la foto). Ve el carnet de su perro con el calendario de vacunas y la galería de todas sus fotos, lee guías de cuidado validadas por la Clínica Veterinaria Lobo Gris y puede pedir ayuda sin tener que justificarse.
- **Albergue:** en una sola pantalla ve cuántas adopciones van bien, cuáles necesitan una llamada (semáforo verde, ámbar y rojo) y escribe a la familia por WhatsApp con un mensaje ya redactado. Registra adopciones nuevas con un acta firmada en pantalla que incluye la cláusula de seguimiento y el consentimiento de datos.
- **Público:** portada narrativa animada, catálogo de perros que buscan hogar, apadrinamiento y transparencia de ingresos y gastos.

## Stack

| Parte | Tecnología |
|---|---|
| Interfaz | HTML, CSS y JavaScript (ES modules), sin compilación |
| Diseño | Bootstrap 5.3 (CDN) personalizado en `css/tema.css` |
| Íconos | Bootstrap Icons 1.11 (cero emojis en todo el proyecto) |
| Animación | CSS + `IntersectionObserver` (`css/movimiento.css`, `js/movimiento.js`) |
| Datos, autenticación y archivos | Supabase (PostgreSQL, Auth, Storage, Edge Functions) con `@supabase/supabase-js` v2 desde CDN |
| Tipografía | Fraunces (títulos) y Figtree (texto), de Google Fonts |

El sitio se publica gratis como archivos estáticos.

## Estructura

```
index.html               Portada pública animada
apadrinar.html           Apadrinamiento y transparencia
ingresar.html            Ingreso con correo y contraseña
registro.html            Crear cuenta de adoptante
recuperar.html           Recuperar contraseña
privacidad.html          Política de privacidad (Ley 29733)
guia-visual.html         Paleta, tipografía y componentes
adoptante/               Portal del adoptante (inicio con reporte del mes, carnet, guías, ayuda)
albergue/                Panel del albergue (inicio, caso, adopciones, solicitudes, perros, nueva adopción)
css/                     tema.css, movimiento.css y estilos por sección
js/config.js             URL y clave PÚBLICA de Supabase (único archivo a cambiar)
js/supabase.js           Cliente de Supabase y utilidades de archivos
js/auth.js               Sesión, roles y protección de páginas
js/comun.js              Fechas, textos, mensajes de error, pie de página
js/movimiento.js         Motor de animación
img/                     Imágenes de marcador de posición
supabase/migraciones/    Historial SQL numerado
supabase/functions/      Edge Function crear-adoptante
pruebas/rls.sql          Pruebas de las políticas de seguridad
herramientas/            Script para generar y subir imágenes de marcador
```

---

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Albergue | `albergue@siguemihuella.example` | `Emiliana2026!` |
| Adoptante (Rosa, perra Canela) | `rosa.quispe@siguemihuella.example` | `Huella2026!` |

Los otros once adoptantes de prueba tienen contraseñas aleatorias; si necesitan entrar con alguno, cambien su contraseña desde **Authentication > Users** en el panel de Supabase.

Antes de que el albergue lo use con familias reales, borren o cambien estas cuentas.

---

## Configurar Supabase desde cero en una cuenta nueva

1. Creen una cuenta gratuita en [supabase.com](https://supabase.com) y un proyecto nuevo (región sugerida: South America, São Paulo). Guarden la contraseña de la base de datos.
2. En **SQL Editor**, ejecuten en orden:
   - `supabase/migraciones/001_esquema.sql`
   - `supabase/migraciones/002_vistas.sql`
   - `supabase/migraciones/003_seguridad.sql`
   - `supabase/migraciones/005_funcion_buscar_usuario.sql`
3. En **Authentication > Users > Add user**, creen las trece cuentas de prueba marcando *Auto Confirm User*. Los correos están en `supabase/migraciones/004_datos_prueba.sql` (el primero es `albergue@siguemihuella.example`). Si solo quieren el mínimo, creen al menos el del albergue y el de Rosa; las adopciones de los demás no se cargarán.
4. Ejecuten `supabase/migraciones/004_datos_prueba.sql`. Esto convierte la cuenta del albergue en rol `albergue` y carga perros, adopciones, reportes, vacunas, aliados, guías, solicitudes y movimientos.
5. Ejecuten `pruebas/rls.sql`. Todas las filas deben salir con `ok = true`.
6. Publiquen la Edge Function con la [CLI de Supabase](https://supabase.com/docs/guides/cli):
   ```
   supabase login
   supabase link --project-ref TU_PROJECT_REF
   supabase functions deploy crear-adoptante
   ```
   La función usa la clave de servicio que Supabase le inyecta en el servidor; no hay que configurar nada.
7. Suban las imágenes de marcador de posición:
   ```
   set SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
   set SUPABASE_SERVICE_KEY=la_clave_de_servicio
   python herramientas/marcadores.py
   ```
   La clave de servicio está en **Project Settings > API Keys**. Úsenla solo en su computadora y nunca la escriban en un archivo del proyecto.
8. Copien la **URL del proyecto** y la **clave publicable** (*publishable* o *anon*) en `js/config.js`.
9. En **Authentication > URL Configuration**, pongan como *Site URL* la dirección donde publicarán el sitio y agreguen en *Redirect URLs* esa dirección con `/**` al final (y `http://localhost:8080/**` para pruebas locales). Sin esto, el enlace de recuperación de contraseña no vuelve al sitio.

### Antes de comprimir o compartir la carpeta

`.mcp.json` guarda el token personal de Supabase. Está en `.gitignore`, pero eso no lo protege cuando se comprime la carpeta: el archivo se va dentro del zip. **Antes de comprimir o compartir el proyecto, borren `.mcp.json`** (`.mcp.json.ejemplo` sirve de plantilla para volver a crearlo). Si un zip con ese archivo ya salió del equipo, roten el token en el panel de Supabase (**Account Settings > Access Tokens**): revoquen el actual y generen uno nuevo.

### Sobre los correos

Supabase incluye un servidor de correo de prueba con límite de pocos envíos por hora. Para que lleguen con normalidad los correos de confirmación de registro y de recuperación de contraseña, configuren un SMTP propio en **Authentication > Emails > SMTP Settings** (por ejemplo, el de una cuenta de Gmail del albergue o un servicio como Resend o Brevo).

Las familias que registra el albergue desde **Nueva adopción** no necesitan confirmar el correo: la Edge Function crea su cuenta ya activa y el acta impresa muestra su contraseña temporal.

---

## Correr el proyecto en local

No hay que instalar nada más que un servidor de archivos estáticos. Desde la carpeta del proyecto:

```
python -m http.server 8080
```

y abran `http://localhost:8080`. Con Node también sirve `npx serve -l 8080`.

Abrir los archivos con doble clic (`file://`) no funciona, porque los navegadores bloquean los módulos de JavaScript fuera de un servidor.

---

## Esquema de la base de datos

Todas las tablas usan `uuid` como clave primaria y `creado_en` con la fecha de creación. Todas tienen Row Level Security activa.

| Tabla | Para qué sirve |
|---|---|
| `perfiles` | Extiende a cada usuario de Auth con nombre, teléfono, distrito y rol (`albergue` o `adoptante`). Un disparador lo crea al registrarse, siempre como adoptante. |
| `perros` | Catálogo: código, nombre, sexo, tamaño, fechas, historia, esterilización, estado y foto. |
| `adopciones` | Une perro y familia. Guarda la firma del acta y el consentimiento de datos con su fecha. Un índice único parcial impide dos adopciones activas del mismo perro. |
| `reportes` | El reporte del mes: foto y las tres respuestas (come bien, vacunas al día, algún problema). |
| `vacunas` | Calendario sanitario de cada perro: aplicadas y próximas. |
| `solicitudes_ayuda` | Pedidos del canal de ayuda: motivo, detalle opcional y estado. |
| `aliados` | Veterinarias, tiendas y empresas que ofrecen descuentos. |
| `guias` | Guías de cuidado por categoría, validadas por la veterinaria. |
| `padrinazgos` | Compromisos de aporte mensual. Cualquiera puede crear uno; solo el albergue los lee. |
| `movimientos` | Ingresos y gastos publicados en la sección de transparencia. |
| `notas_internas` | Notas del equipo sobre cada adopción. Solo el albergue. |
| `contactos` | Registro de llamadas, mensajes y visitas, para que los tres administradores no repitan gestiones. Solo el albergue. |

**Vistas**

- `vista_semaforo`: por cada adopción activa, el perro, la familia, el último reporte, los días sin noticias, si hay vacunas vencidas y el estado: **verde** (reportó en los últimos 30 días y sin vacunas vencidas), **ámbar** (31 a 60 días) o **rojo** (más de 60 días o una vacuna vencida). Sin reportes, los días se cuentan desde la adopción.
- `vista_indicadores`: perros adoptados, reportes del mes, casos en rojo y porcentaje con vacunas al día.

Ambas vistas usan `security_invoker`, así que respetan los permisos de quien consulta.

**Permisos (resumen)**

- Visitante sin cuenta: lee perros en adopción, aliados activos, guías publicadas y movimientos. Puede registrar un padrinazgo.
- Adoptante: lee su perfil, su adopción, su perro, sus vacunas, sus reportes y sus solicitudes. Crea reportes y solicitudes solo sobre su adopción activa. No puede modificar ni borrar un reporte enviado.
- Albergue: lee y escribe todo.
- Archivos: cubeta `perros` pública; cubeta `reportes` privada, donde cada adoptante solo usa la carpeta con su identificador; cubeta `actas` solo para el albergue.

---

## Datos del albergue

Los datos de contacto del albergue viven en el objeto `ALBERGUE` de `js/config.js` y salen de su página oficial, https://www.emiliarescataanimales.org:

- WhatsApp +51 955 646 940 (el albergue no publica correo; su canal es WhatsApp).
- Redes: [Facebook](https://www.facebook.com/Emiliarescata), [Instagram](https://www.instagram.com/emiliarescataanimaleshuancayo) y [TikTok](https://www.tiktok.com/@emiliarescata).
- **Adopción:** el botón de adoptar de la portada lleva al [formulario oficial de Google](https://docs.google.com/forms/d/e/1FAIpQLScHEohB9ejWm6yKkDnHEGjm1-myaN8jXKIytwVZHroGsFryYw/viewform) del albergue. Sigue mi Huella se ocupa de lo que pasa después de la adopción.
- **Apadrinamiento:** membresías mensuales del albergue, en dólares: USD 5 (cachorros rescatados), USD 10 (perritos mayores) y USD 15 (perros con enfermedades). Donación única: USD 5 (alimento), USD 10 (esterilizaciones) y USD 15 (gastos veterinarios).
- **Donaciones:** el sitio enlaza a https://www.emiliarescataanimales.org/donaciones y no copia sus cuentas bancarias ni su PayPal, para que haya una sola fuente de verdad y ningún número mal transcrito desvíe un aporte.

Los datos que el albergue no publica (dirección, horario, Yape o Plin, RUC, entre otros) están en `DATOS-PENDIENTES.md`. No se inventan: mientras falten, el sitio deja el bloque fuera o los marca con `PENDIENTE:` en el código.

## Reemplazar las fotos de marcador de posición

Las fotos actuales son siluetas generadas en SVG.

- **Perros del catálogo:** ingresen como albergue, vayan a **Perros**, editen cada perro y suban su foto real. Se guarda en la cubeta pública `perros` y reemplaza a la silueta.
- **Fotos de los reportes:** se reemplazan solas a medida que las familias envíen sus reportes reales. Para empezar limpio, borren los datos de prueba (ver abajo).
- **Logotipos de aliados:** súbanlos a la cubeta `perros` en **Storage** dentro de la carpeta `aliados/` con el mismo nombre de archivo, o cambien la columna `logo_ruta` del aliado.
- **Fotografía de la portada:** reemplacen `img/portada.svg` por una foto real del albergue (por ejemplo `img/portada.jpg`, horizontal, de al menos 1920 px de ancho y menos de 400 KB) y actualicen la ruta en `index.html` y en `css/acceso.css`.

Para quitar todos los datos de prueba antes de usar el sistema de verdad, en **SQL Editor**:

```sql
truncate reportes, solicitudes_ayuda, notas_internas, contactos, vacunas, adopciones, padrinazgos, movimientos restart identity cascade;
delete from perros;
```

y borren las cuentas de prueba en **Authentication > Users**.

---

## Publicar el sitio

Todas las rutas son relativas, así que el sitio funciona en la raíz de un dominio o dentro de un subdirectorio.

**Netlify (lo más simple)**
1. Entren a [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastren la carpeta del proyecto. En segundos les da una dirección pública.

**Vercel**
1. Suban el proyecto a GitHub (verifiquen antes que `.mcp.json` no esté incluido).
2. En [vercel.com](https://vercel.com), *Add New > Project*, elijan el repositorio, *Framework Preset: Other*, sin comando de compilación, y *Deploy*.

**GitHub Pages**
1. Suban el proyecto a un repositorio de GitHub.
2. En *Settings > Pages*, elijan *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. El sitio queda en `https://USUARIO.github.io/REPOSITORIO/`.

**Después de publicar:** agreguen la dirección pública en Supabase, en **Authentication > URL Configuration** (*Site URL* y *Redirect URLs* con `/**`).

### Seguridad antes de publicar

- `.mcp.json` contiene el token personal de Supabase y está en `.gitignore`. Verifiquen con `git status` que no aparezca antes del primer commit. Si alguna vez se sube por error, revoquen el token de inmediato en **Account Settings > Access Tokens**.
- El sitio solo contiene la clave pública de Supabase, que está diseñada para estar en el navegador. Los permisos reales los imponen las políticas de la base de datos.
- Cuando terminen el proyecto, revoquen el token de acceso personal. La aplicación publicada no lo necesita.

---

## Equipo

- Luis Eduardo Ponce Alcocer
- Abigail Sarai Carlos Mendoza
- Lenin Andy Villanueva Aucallanchi
- Yasmany Santos Meza

Universidad Continental · Liderazgo e Innovación · Huancayo, 2026.

Con el acompañamiento del albergue Emilia Rescata y de la Clínica Veterinaria Lobo Gris.
