# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

"Sigue mi Huella": plataforma de seguimiento post-adopción para el albergue Emilia Rescata (Huancayo, Perú). Sitio estático (HTML + ES modules, sin build) sobre Supabase (Postgres + Auth + Storage + una Edge Function). La especificación original completa está en `Sigue mi Huella - Prompt completo con Supabase.md`; `README.md` tiene la configuración desde cero y el esquema; `GUION-DEMO.md` el guion de la presentación.

Datos del albergue: el nombre oficial es **"Emilia Rescata"** (sin "n"). Los datos reales de contacto (WhatsApp, sitio, redes, formulario de adopción, página de donaciones) viven en `ALBERGUE` de `js/config.js`; el albergue no publica correo. El apadrinamiento usa sus membresías en USD (5/10/15). Las donaciones se enlazan a su página oficial y nunca se copian números de cuenta. El botón de adoptar lleva a su formulario de Google. Lo que no está publicado (dirección, horario, Yape/Plin, RUC, etc.) está en `DATOS-PENDIENTES.md`: nunca inventar esos datos; dejar el bloque fuera o marcar con `PENDIENTE:` en el código. La contraseña de prueba `Emiliana2026!` es una credencial real de Auth, no el nombre del albergue.

## Comandos

- Servir en local: `python -m http.server 8080` y abrir `http://localhost:8080` (no funciona con `file://` porque usa módulos ES).
- Revisar sintaxis de un módulo: `node --check js/comun.js` (no hay linter ni bundler).
- Pruebas de seguridad RLS: ejecutar `pruebas/rls.sql` en el SQL Editor de Supabase (o vía Management API `database/query`). Corre dentro de una transacción con `rollback`, simula roles con `request.jwt.claims` + `set local role`, y cada fila debe salir `ok = true`.
- Migraciones: `supabase/migraciones/001..005_*.sql` en orden. `004_datos_prueba.sql` requiere que las cuentas de Auth ya existan (los correos están en el propio archivo) y usa fechas relativas a hoy.
- Edge Function: `supabase functions deploy crear-adoptante`.
- Imágenes de marcador de posición: `python herramientas/marcadores.py` con `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` en variables de entorno (nunca en archivos).

## Arquitectura

- **Tres zonas por rol**: público (`index.html`, `apadrinar.html`, `privacidad.html`, páginas de acceso), `adoptante/` (portal de la familia) y `albergue/` (panel del albergue). Cada página protegida llama `requerirSesion(rol)` de `js/auth.js`, que redirige según `perfiles.rol`. `albergue/panel.js` (`iniciarPanel`) y `adoptante/portal.js` montan la navegación común de cada zona.
- **Módulos compartidos en `js/`**: `config.js` (URL y clave publicable de Supabase, datos de contacto del albergue), `supabase.js` (cliente, `ruta()` relativa a la raíz vía `import.meta.url` para que las rutas funcionen desde subcarpetas, URLs públicas/firmadas de Storage), `comun.js` (escape HTML `esc`, fechas en español, `TEXTOS` que traduce enums de la BD a texto de pantalla, `mensajeError` que traduce errores de Supabase, `aviso`, `enlaceWhatsApp`, `pintarPie`, `reducirImagen`), `movimiento.js` (motor de animación).
- **Seguridad en la base, no en el cliente**: RLS en todas las tablas. Las políticas usan funciones `security definer` `es_albergue()`, `es_mi_adopcion(uuid, solo_activa)` y `es_mi_perro(uuid)` (`003_seguridad.sql`). Las vistas `vista_semaforo` y `vista_indicadores` son `security_invoker`, así que heredan la RLS. Un trigger crea el perfil al registrarse siempre con rol `adoptante`; el rol `albergue` solo se asigna por SQL. Índice único parcial impide dos adopciones activas del mismo perro.
- **Storage**: `perros` pública; `reportes` privada con carpeta por id de usuario; `actas` privada solo albergue. Las fotos privadas se muestran con URLs firmadas (`fotosFirmadas`).
- **Alta de familias**: `supabase/functions/crear-adoptante` (Deno) verifica que quien llama sea albergue, crea la cuenta ya confirmada con clave temporal (se imprime en el acta) usando la service key del lado del servidor, y si el correo ya existe recurre a la RPC `buscar_usuario_por_correo` (solo service_role).
- **Semáforo**: lógica de estado verde/ámbar/rojo y prioridad vive en `vista_semaforo` (días sin reporte, vacunas vencidas), no en JS.
- **Animación**: un solo IntersectionObserver global (`observar`, `iniciarRevelado`). El estado oculto inicial solo aplica bajo la clase `js-movimiento` en `<html>`, así el contenido es visible sin JS o con `prefers-reduced-motion`.
- **Estilos**: Bootstrap 5.3.3 + Bootstrap Icons desde CDN, personalizado con variables en `css/tema.css`; `css/movimiento.css` para animaciones; CSS propio por zona (`adoptante/adoptante.css`, `albergue/albergue.css`, `css/portada.css`). `guia-visual.html` muestra el sistema visual.

## Reglas del proyecto (de la especificación)

- Cero emojis en todo (código, textos, commits, docs); todo símbolo es un Bootstrap Icon. Única excepción: la huella de la marca (`img/huella.svg`, Bootstrap Icons no tiene huella), que va en la cabecera y el pie como `<span class="marca-huella">` (máscara CSS en `css/tema.css`), es el favicon de todas las páginas y la usa el video de lanzamiento.
- Interfaz en español sin anglicismos: el check-in mensual se llama "reporte del mes".
- Animaciones: solo `transform` y `opacity`, máximo 600 ms (salvo la entrada de la portada), todo desactivado con `prefers-reduced-motion`.
- Todo funciona desde 360 px de ancho; botones de al menos 48 px de alto; texto base de al menos 17 px.
- El reporte del adoptante es una foto + tres toques: los botones de la tercera pregunta envían el reporte directamente (sin botón "enviar").
- La pantalla de ayuda (`adoptante/ayuda.html`) no puede contener "fracaso", "incumplimiento" ni "falta".
- En archivos del cliente solo va la clave publicable. La service key y el token personal nunca se escriben en el código, README, comentarios ni commits; el token solo vive en `.mcp.json`, que está en `.gitignore` (`.mcp.json.ejemplo` es la plantilla).
- Cumplimiento de la Ley 29733 (datos personales): consentimiento en el registro y política en `privacidad.html`.
