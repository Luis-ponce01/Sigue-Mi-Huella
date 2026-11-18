# Prompt completo — Sigue mi Huella

Aplicación web publicable con Supabase, Bootstrap 5 y narración animada
Proyecto: albergue Emiliana Rescata · Huancayo, Junín, Perú

---

## Antes de pegar el prompt: un solo dato

Documentación oficial del servidor MCP de Supabase: **https://supabase.com/docs/guides/ai-tools/mcp**

El `.mcp.json` no se descarga de ningún lado: es un archivo que se crea en la raíz del proyecto, y el prompt le pide a Claude Code que lo escriba. Lo único que ustedes consiguen antes es el token:

**Personal Access Token.** Creen una cuenta gratuita en `supabase.com`, entren a **Account Settings**, sección **Access Tokens**, y generen uno nuevo. Cópienlo apenas aparezca: Supabase lo muestra una sola vez y después ya no se puede volver a ver.

No hace falta que creen el proyecto: con ese token, Claude Code crea el proyecto en Supabase, las tablas, las políticas de seguridad, las cubetas de imágenes y los datos de prueba, sin que ustedes entren al panel. Si ya tienen un proyecto creado, también sirve: el prompt les preguntará y usará ese.

El archivo que escribirá Claude Code queda así, con los dos valores reemplazados:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF",
      "headers": {
        "Authorization": "Bearer TU_TOKEN"
      }
    }
  }
}
```

**Una advertencia que importa.** Ese token da acceso a su cuenta de Supabase, así que el archivo nunca debe subirse a GitHub. El prompt ya incluye la instrucción de agregarlo al `.gitignore`, pero verifíquenlo ustedes antes del primer commit. Si alguna vez lo suben por error, entren a Access Tokens y revóquenlo de inmediato: no basta con borrar el archivo, porque queda en el historial del repositorio.

Cuando terminen la entrega, revoquen el token en Access Tokens. La aplicación publicada no lo necesita para funcionar: solo lo usaba Claude Code para construirla.

La alternativa sin token es iniciar sesión desde el navegador con `/mcp` y la opción "Authenticate", que evita tener la credencial en un archivo. Si más adelante quieren cambiarse a eso, basta con quitar el bloque de `headers`.

---

## Cómo usarlo

Peguen el bloque completo de abajo en Claude Code, de una sola vez. Está organizado en fases y Claude Code las irá recorriendo en orden, deteniéndose donde el prompt le pide confirmación. Es largo a propósito: al tener todo el contexto desde el inicio, las decisiones que toma en la fase 2 ya consideran lo que viene en la fase 9.

Si en algún momento se desvía o quieren corregir algo, no repitan el prompt: descríbanle el problema en una frase y siga desde ahí.

---

# EL PROMPT

> Eres el desarrollador principal de este proyecto. Vas a construir una aplicación web completa, funcional y publicable, de principio a fin. Lee todo antes de empezar y trabaja por fases, en el orden en que están. Al terminar cada fase, dime en dos líneas qué hiciste y continúa con la siguiente sin esperarme, salvo en las fases donde explícitamente te pido que te detengas.
>
> ---
>
> ## 1. Contexto del proyecto
>
> **Qué es:** "Sigue mi Huella", plataforma de seguimiento post-adopción para el albergue de rescate animal **Emiliana Rescata**, de Huancayo (Junín, Perú). Es un proyecto universitario del curso de Liderazgo e Innovación de la Universidad Continental, desarrollado con metodología Design Thinking, pero debe quedar en condiciones de que el albergue lo use de verdad.
>
> **El problema, con datos de las entrevistas realizadas:** el albergue no tiene cómo verificar el bienestar de los perros después de la adopción. Según su fundadora, solo cerca del 30 % de las adopciones recibe buen cuidado; del resto, los perros se pierden, son atropellados o mueren. El albergue lo sostienen tres personas y su límite real es el tiempo. Depende de donaciones irregulares.
>
> **El insight central que gobierna cada decisión de diseño:** el albergue concentra todo su rigor en elegir bien al adoptante y ninguna de sus fuerzas en acompañarlo después, porque el vínculo se diseñó para terminar en la entrega y no para empezar en ella. El abandono no es crueldad: es el resultado previsible de una relación que nadie sostuvo.
>
> **La pregunta que orienta el producto:** ¿cómo podríamos transformar la adopción de un acto que termina en la entrega a un vínculo que continúa en el tiempo, de modo que el albergue sepa con un solo vistazo cómo está cada perro, el adoptante se sienta acompañado y no vigilado, y pedir ayuda a tiempo sea más fácil que abandonar?
>
> **Los tres usuarios, con sus frases textuales de las entrevistas:**
>
> *La fundadora del albergue.* Pidió literalmente "una notificación y una foto para saber que mis perros tienen un buen hogar; sería fácil solo llegar y ver la foto del perrito". No quiere fiscalizar, quiere tranquilidad. Administra con dos colaboradores y no tiene formación técnica. Sobre el seguimiento dijo: "El tiempo, porque hay demasiado trabajo por hacer".
>
> *El adoptante.* Dijo que un seguimiento lo haría sentir "acompañado, no vigilado", que una vez se le pasó una fecha de vacuna, y que quiere algo "fácil y rápido, sin llenar formularios largos".
>
> *La veterinaria aliada, Clínica Lobo Gris.* Señaló que la causa del descuido es la falta de tiempo y el costo, no la crueldad, y que el descuido se detecta por deterioro físico, falta de higiene y cambios de conducta. Advirtió que las guías deben ser directas y preventivas, "sin abrumar a la familia".
>
> **Las excusas que recibe el albergue cuando una adopción fracasa** son siempre las mismas: "lo atropellaron", "se perdió", "se murió". Todas son accidentes, ninguna es responsabilidad. Eso nos dijo que el silencio previo al abandono no es indiferencia, es vergüenza, y por eso existe el canal de ayuda.
>
> **Cinco principios de producto, en orden de prioridad:**
> 1. El check-in del adoptante no puede tomar más de cinco segundos: una foto y tres preguntas. Nunca formularios largos.
> 2. El albergue entiende el estado de todas sus adopciones de un vistazo, sin menús ni navegación profunda.
> 3. El tono es de acompañamiento, nunca de vigilancia ni de sanción. Se reconoce a quien cumple; no se castiga a quien falla.
> 4. Pedir ayuda debe ser más fácil que abandonar.
> 5. Lenguaje cotidiano peruano. Prohibidos los anglicismos en la interfaz: nada de "dashboard", "onboarding", "KPI", "login" ni "check-in" visible al usuario (internamente puedes llamarlo así en el código, pero en pantalla di "reporte del mes").
>
> ---
>
> ## 2. Stack obligatorio
>
> - **Bootstrap 5.3** como base de todo el diseño, desde CDN, personalizado con variables CSS propias. No uses otro framework de interfaz ni Tailwind.
> - **Bootstrap Icons** para absolutamente todos los íconos. **Prohibido el uso de emojis** en cualquier parte: ni en la interfaz, ni en los textos, ni en los commits, ni en la documentación. Donde necesites un símbolo, usa un ícono de Bootstrap Icons.
> - **Supabase** para base de datos PostgreSQL, autenticación y almacenamiento de imágenes, usando `@supabase/supabase-js` versión 2 desde CDN.
> - **HTML, CSS y JavaScript modernos (ES modules)**, sin React, Vue ni ningún framework de componentes. Sin paso de compilación: el sitio debe poder servirse como archivos estáticos.
> - Las animaciones se hacen con **CSS e IntersectionObserver**, sin librerías de animación.
>
> Esta elección es deliberada: el proyecto debe poder publicarse gratis como sitio estático y seguir siendo mantenible por estudiantes.
>
> ---
>
> ## 3. Fase 0 — Conexión con Supabase
>
> Antes de escribir una línea de aplicación, deja la conexión funcionando. **Tú te encargas de todo lo de Supabase**: yo solo te doy el token y no voy a entrar al panel a hacer nada manualmente. Si en algún momento necesitas que yo haga algo ahí, detente y dime exactamente qué, en lugar de suponerlo.
>
> **Primero, lo que necesito que me pidas.** Pídeme mi token de acceso personal de Supabase y espera mi respuesta. No inventes un valor ni sigas sin él. Pregúntame también si ya tengo un proyecto creado en Supabase o si quieres crearlo tú.
>
> **Si todavía no hay proyecto**, créalo tú. Escribe primero el `.mcp.json` sin el parámetro de proyecto, para que el servidor te habilite las herramientas de cuenta:
>
> ```json
> {
>   "mcpServers": {
>     "supabase": {
>       "type": "http",
>       "url": "https://mcp.supabase.com/mcp",
>       "headers": {
>         "Authorization": "Bearer AQUI_EL_TOKEN"
>       }
>     }
>   }
> }
> ```
>
> Pídeme que reinicie la sesión para que cargue el servidor, lista mis organizaciones de Supabase, y crea un proyecto nuevo llamado `sigue-mi-huella` en el plan gratuito, eligiendo la región más cercana a Perú, que es South America (São Paulo). Genera tú una contraseña segura para la base de datos, muéstramela una sola vez y dime que la guarde. Espera a que el proyecto termine de aprovisionarse, lo que suele tomar un par de minutos, y toma nota del Project Ref resultante.
>
> **Después**, ya con el Project Ref en la mano —el que acabas de crear o el que yo te di—, reescribe el `.mcp.json` para limitar el servidor a ese proyecto:
>
> ```json
> {
>   "mcpServers": {
>     "supabase": {
>       "type": "http",
>       "url": "https://mcp.supabase.com/mcp?project_ref=AQUI_EL_PROJECT_REF",
>       "headers": {
>         "Authorization": "Bearer AQUI_EL_TOKEN"
>       }
>     }
>   }
> }
> ```
>
> Pídeme que reinicie la sesión otra vez para que tome la nueva configuración.
>
> **Cuatro reglas sobre esta configuración.**
>
> El token da acceso a toda mi cuenta de Supabase, así que lo primero que haces, antes incluso de escribirlo en el archivo, es crear el `.gitignore` con `.mcp.json`, `.env` y cualquier archivo de credenciales. Si el `.gitignore` no existe cuando escribas el token, lo estás exponiendo.
>
> Crea también un `.mcp.json.ejemplo` con los marcadores de posición, ese sí versionado, para que mis compañeros de equipo sepan qué configurar.
>
> No incluyas `read_only=true` en la URL todavía, porque el servidor necesita permiso de escritura para crear la base de datos. Cuando el proyecto esté terminado me recordarás agregarlo, y también me recordarás revocar el token en Account Settings, porque la aplicación publicada no lo necesita.
>
> El token nunca sale de `.mcp.json`. No lo escribas en el código de la aplicación, ni en el README, ni en un comentario, ni en un mensaje de commit.
>
> **Si el servidor no conecta**, consulta la documentación vigente en `https://supabase.com/docs/guides/ai-tools/mcp` antes de improvisar, y dime exactamente qué falló. No intentes rutas alternativas con credenciales distintas sin avisarme.
>
> Cuando la conexión funcione, **verifícala listando las tablas del proyecto** y detente ahí: dime que estás conectado, qué proyecto estás usando y qué encontraste, antes de continuar.
>
> ---
>
> ## 4. Fase 1 — Base de datos desde cero
>
> Crea toda la base de datos usando las herramientas del servidor MCP de Supabase, aplicando migraciones reales. Guarda además cada migración como archivo SQL numerado en `/supabase/migraciones/`, para que quede el historial en el repositorio.
>
> Nombra todo en español, en minúsculas y con guion bajo. Usa `uuid` como clave primaria en todas las tablas, con valor por defecto generado, y una columna `creado_en` de tipo `timestamptz` con valor por defecto `now()`.
>
> **Tipos enumerados que necesitas:** rol de usuario (albergue, adoptante), estado del perro (en_albergue, en_adopcion, adoptado, devuelto, fallecido), tamaño (pequeno, mediano, grande), estado de la adopción (activa, devuelta, cerrada), respuesta de alimentación (si, mas_o_menos, no), respuesta de vacunas (si, no, no_seguro), respuesta de problema (todo_bien, tengo_duda, necesito_ayuda), motivo de ayuda (conducta, dinero, mudanza, no_puedo_seguir), estado de solicitud (nueva, en_proceso, resuelta), categoría de guía (alimentacion, salud, higiene, conducta), tipo de aliado (veterinaria, pet_shop, empresa) y tipo de movimiento (ingreso, egreso).
>
> **Tablas:**
>
> `perfiles` — extiende a los usuarios de autenticación. Clave primaria referenciando al usuario de `auth.users`, nombre completo, teléfono, distrito, rol y fecha de creación. Crea un disparador que inserte automáticamente el perfil cuando se registra un usuario nuevo, con rol de adoptante por defecto.
>
> `perros` — código único legible, nombre, sexo, tamaño, fecha aproximada de nacimiento, fecha de rescate, historia del rescate, si está esterilizado, estado, ruta de la foto principal y fecha de creación.
>
> `adopciones` — referencia al perro y al perfil del adoptante, fecha de adopción, ruta del acta firmada, ruta de la imagen de la firma, aceptación del consentimiento de datos con su fecha, estado y fecha de creación. Un perro no puede tener dos adopciones activas a la vez: imponlo con un índice único parcial.
>
> `reportes` — es el check-in mensual. Referencia a la adopción, fecha, ruta de la foto, las tres respuestas, un comentario opcional y fecha de creación.
>
> `vacunas` — referencia al perro, tipo de vacuna o tratamiento, fecha aplicada, fecha de la próxima, si ya fue aplicada y referencia opcional al aliado que la aplicó.
>
> `solicitudes_ayuda` — referencia a la adopción, motivo, detalle opcional, estado, fecha de creación y fecha de resolución.
>
> `aliados` — nombre, tipo, descripción del descuento que ofrece, dirección, teléfono, ruta del logotipo y si está activo.
>
> `guias` — título, categoría, contenido en texto, quién la validó, orden de aparición y si está publicada.
>
> `padrinazgos` — referencia al perro, nombre y correo del padrino, monto mensual, estado y fecha de creación.
>
> `movimientos` — para la sección de transparencia: tipo, concepto, monto, fecha y categoría.
>
> `notas_internas` — referencia a la adopción, autor, texto y fecha. Solo para el equipo del albergue.
>
> `contactos` — registro de las gestiones hechas con cada familia: referencia a la adopción, autor, medio usado, resultado y fecha. Existe para que los tres administradores no repitan llamadas entre ellos.
>
> **Vista del semáforo.** Crea una vista llamada `vista_semaforo` que, por cada adopción activa, devuelva los datos del perro y de la familia, la fecha del último reporte, los días transcurridos desde ese reporte, si hay alguna vacuna vencida, y un campo de estado calculado así: **verde** si reportó en los últimos 30 días y no tiene vacunas vencidas; **ámbar** si lleva entre 31 y 60 días sin reportar; **rojo** si lleva más de 60 días sin reportar o tiene una vacuna vencida. Una adopción sin ningún reporte cuenta los días desde la fecha de adopción.
>
> Crea también una vista `vista_indicadores` con los números que necesita el panel del albergue: perros adoptados, reportes del mes en curso, casos en rojo y porcentaje de perros con vacunas al día.
>
> Añade índices en todas las claves foráneas y en las columnas de fecha que se usan para ordenar.
>
> ---
>
> ## 5. Fase 2 — Seguridad
>
> Activa Row Level Security en **todas** las tablas. Sin excepciones. Una tabla sin políticas queda inaccesible, que es el comportamiento correcto por defecto.
>
> Crea una función auxiliar `es_albergue()`, con `security definer` y `search_path` fijado, que devuelva verdadero si el usuario autenticado tiene rol de albergue. Úsala en las políticas en lugar de repetir la consulta.
>
> **Las reglas de acceso son estas:**
>
> El público sin autenticar puede leer los perros que están en adopción, los aliados activos, las guías publicadas y los movimientos de la sección de transparencia. Nada más.
>
> El adoptante autenticado puede leer su propio perfil, su adopción, su perro, las vacunas de su perro y sus propios reportes y solicitudes. Puede insertar reportes y solicitudes de ayuda únicamente sobre su propia adopción. No puede modificar ni borrar un reporte ya enviado, ni ver los datos de ninguna otra familia.
>
> El equipo del albergue puede leer y escribir todo.
>
> Las notas internas y los registros de contacto son exclusivos del albergue: el adoptante no debe poder leerlos bajo ninguna circunstancia. Verifica esta política con especial cuidado.
>
> Cualquiera puede insertar un padrinazgo, pero solo el albergue puede leerlos.
>
> **Almacenamiento.** Crea tres cubetas: `perros` de lectura pública para las fotos del catálogo; `reportes` privada, donde cada adoptante solo puede subir y ver archivos dentro de una carpeta con su propio identificador de usuario, y donde el albergue puede leer todo; y `actas` privada, accesible solo para el albergue. Escribe las políticas de almacenamiento correspondientes.
>
> **Al terminar esta fase, detente y pruébalo.** Escribe un script en `/pruebas/rls.sql` o usa las herramientas del MCP para verificar que un adoptante no puede leer los reportes de otro adoptante, que no puede leer las notas internas, y que un visitante anónimo no puede leer ninguna adopción. Dime los resultados de esas tres pruebas antes de seguir. Si alguna falla, corrígela antes de avanzar.
>
> ---
>
> ## 6. Fase 3 — Datos de prueba
>
> Carga datos de prueba realistas, en español peruano, con nombres y distritos creíbles de Huancayo (El Tambo, Chilca, Pilcomayo, Huancán, San Agustín de Cajas).
>
> Doce perros, doce adoptantes con sus adopciones, y un historial de reportes repartido de forma que el semáforo muestre los tres estados: la mayoría en verde, dos o tres en ámbar, y dos en rojo, uno de ellos sin ningún reporte desde la entrega. Añade vacunas con fechas pasadas y futuras, incluida alguna vencida. Tres solicitudes de ayuda, una por cada motivo distinto. Cuatro aliados, encabezados por la Clínica Veterinaria Lobo Gris. Ocho guías de cuidado de no más de cuatro párrafos cortos cada una, directas y preventivas, todas marcadas como validadas por Lobo Gris. Seis meses de movimientos para la sección de transparencia.
>
> Para las fotos, genera imágenes de marcador de posición en SVG con una silueta de perro sobre un fondo de la paleta del proyecto y el nombre del perro, y súbelas a la cubeta correspondiente. Deja documentado en el README cómo reemplazarlas por las fotos reales del albergue.
>
> Crea dos usuarios de prueba y dímelos al terminar: uno con rol de albergue y otro con rol de adoptante, con sus contraseñas, para que yo pueda probar y para usarlos en la exposición.
>
> ---
>
> ## 7. Fase 4 — Sistema visual sobre Bootstrap 5
>
> Personaliza Bootstrap en lugar de usarlo con su apariencia de fábrica. Un sitio que se ve "a Bootstrap por defecto" no cumple el objetivo.
>
> En `css/tema.css`, sobrescribe las variables CSS de Bootstrap:
>
> - **Paleta cálida de tonos tierra y ámbar**, que transmita cercanía y no frialdad institucional. Nada de azul corporativo. Redefine el color primario, el de fondo, el de texto y los de borde. Define además un fondo oscuro cálido, casi negro con matiz marrón, para las secciones narrativas de la portada.
> - **Colores del semáforo** en versiones suaves, que informen sin parecer una alarma de sistema. No uses los verde, amarillo y rojo saturados que trae Bootstrap.
> - **Escala tipográfica con mucho contraste:** títulos de portada entre 3 y 7 rem usando `clamp()` para que escalen solos, y texto base nunca menor a 17 píxeles, porque la fundadora y varios adoptantes no son usuarios jóvenes ni técnicos. Usa una tipografía de Google Fonts legible y con personalidad, cargada con `display=swap`.
> - **Radio de esquinas más generoso** que el de Bootstrap y sombras suaves en las tarjetas.
> - **Botones** con altura mínima de 48 píxeles.
> - Espaciado amplio: al menos 8 rem de separación vertical entre las secciones narrativas en pantallas grandes.
>
> Trabaja siempre con el sistema de rejilla y las utilidades de Bootstrap. No escribas media queries propias si una clase responsiva de Bootstrap resuelve lo mismo.
>
> **Todos los íconos salen de Bootstrap Icons.** Repito la regla porque es la que más se incumple: cero emojis en todo el proyecto.
>
> Construye `guia-visual.html`, una página que muestre la paleta, la escala tipográfica, los botones, las tarjetas, los estados del semáforo y los íconos elegidos. **Detente ahí y pídeme que valide el estilo antes de construir pantallas.**
>
> ---
>
> ## 8. Fase 5 — Motor de animación
>
> La portada pública es una pieza narrativa, con animaciones al estilo de los sitios de producto de las grandes marcas de tecnología. Pero rige una regla: **el movimiento explica algo, nunca decora**. Si una animación no aporta al argumento, no va.
>
> Cuatro restricciones innegociables: nada dura más de 600 milisegundos salvo la entrada inicial de la portada; solo se animan `transform` y `opacity`, jamás propiedades que provoquen recálculo de diseño; todo el movimiento se desactiva por completo cuando el usuario tiene activada la preferencia de reducción de movimiento; y las pantallas internas de la aplicación son sobrias, con transiciones funcionales de 200 milisegundos, porque son herramientas de uso diario y no una vitrina.
>
> En `css/movimiento.css` define como variables las curvas de aceleración —la principal debe ser una salida muy suave y decidida, del tipo `cubic-bezier(0.16, 1, 0.3, 1)`—, las tres duraciones, las clases de revelado al entrar en pantalla (desde abajo, con escala, desde los lados), la clase de revelado escalonado controlada por una variable de índice, y el bloque que anula todo bajo reducción de movimiento.
>
> En `js/movimiento.js` escribe el motor: un único `IntersectionObserver` para toda la página que añada la clase de visible y deje de observar cada elemento después de animarlo, porque las animaciones ocurren una sola vez y repetirlas al subir y bajar se siente barato; un contador numérico que cuente desde cero con desaceleración usando `requestAnimationFrame`; una función que devuelva el progreso de scroll de una sección entre 0 y 1 para las secciones fijas; y un revelado de titulares palabra por palabra.
>
> ---
>
> ## 9. Fase 6 — Portada pública animada
>
> Construye `index.html`. Es lo primero que verá el jurado en la exposición, proyectado, y lo que verá cualquier persona que llegue al sitio.
>
> **Portada a pantalla completa.** Fotografía de fondo con degradado oscuro encima, el nombre "Sigue mi Huella" en tipografía enorme, la frase "Que ninguna adopción termine en abandono", y dos botones: "Soy adoptante" y "Soy del albergue". En el borde inferior, un indicador de scroll con un ícono de Bootstrap Icons que se mueve suavemente en bucle. Al cargar, la imagen entra con una escala de 1.1 que se asienta en 1.0 durante un segundo y medio, y el título aparece palabra por palabra con 80 milisegundos entre palabras. Al hacer scroll, la portada queda fija y su contenido se desvanece mientras la siguiente sección sube por encima, implementado con `position: sticky` y la función de progreso.
>
> **El problema, en tres momentos.** Fondo oscuro cálido.
>
> Primero, diez siluetas de perro en SVG en una fila. Al entrar en pantalla aparecen escalonadas y luego, una tras otra, siete se desvanecen hasta quedar casi transparentes y en gris, mientras tres permanecen a color. En paralelo, un contador llega a 3. Al terminar aparece el texto "Solo 3 de cada 10 adopciones reciben buen cuidado". La secuencia completa dura unos dos segundos y medio: el espectador tiene que ver cómo desaparecen.
>
> Segundo, las tres excusas apareciendo una tras otra con medio segundo de diferencia: "Lo atropellaron", "Se perdió", "Se murió". Cuando las tres están visibles, aparece debajo, más pequeña, la observación del equipo: "Todas son accidentes. Ninguna es responsabilidad". Dale aire y tiempo: esta frase es nuestro insight puesto en escena.
>
> Tercero, el contraste de recursos: dos cifras que cuentan hacia arriba, las tres personas que sostienen el albergue y los cero registros de seguimiento que existen hoy, con la frase de la fundadora entrecomillada y grande debajo.
>
> **Cómo funciona, con un celular fijo.** Una sección de unas cuatro pantallas de alto. A la izquierda, un marco de celular dibujado en CSS que queda fijo mientras se recorre la sección. A la derecha, cuatro bloques de texto que van pasando. Dentro del celular, cuatro pantallas que se cruzan en fundido sincronizadas con el bloque activo: el adoptante envía su foto, el sistema avisa de las vacunas, el albergue ve todo de un vistazo, y el canal de ayuda. El bloque activo va a plena opacidad y los demás quedan al 30 %. Divide el recorrido en cuatro tramos usando la función de progreso. En pantallas menores a 992 píxeles, abandona el diseño fijo y apila el celular arriba y los bloques debajo: un efecto fijo en celular se siente atrapado.
>
> **El semáforo.** Tres tarjetas que aparecen escalonadas y cuyo color se enciende con una transición. Debajo, una barra que decrece de 100 a 5 ilustrando que el albergue deja de perseguir a cien adoptantes para atender solo a los que están en riesgo.
>
> **Perros que buscan hogar.** Galería real desde la base de datos, con revelado escalonado y elevación suave al pasar el cursor.
>
> **Apadrina, aliados y cierre.** Los montos de apadrinamiento en tarjetas, los aliados desde la base de datos, y una sección final de fondo oscuro con una sola frase revelada línea por línea: "El abandono no es un acto de crueldad. Es el resultado previsible de una relación que nadie sostuvo." Esta es la última impresión del jurado: déjala respirar, sin nada alrededor.
>
> Añade una barra de navegación de Bootstrap que esté oculta al principio y aparezca deslizándose cuando el usuario pase la portada.
>
> ---
>
> ## 10. Fase 7 — Autenticación
>
> Implementa el ingreso con correo y contraseña usando Supabase Auth, en `/ingresar.html` y `/registro.html`, con Bootstrap.
>
> Después de ingresar, redirige según el rol: el albergue a su panel, el adoptante al suyo. Protege todas las páginas internas verificando la sesión al cargar y redirigiendo a quien no tenga permiso. Implementa recuperación de contraseña y cierre de sesión.
>
> La clave anónima de Supabase va en el código del cliente, que es su propósito, pero **jamás incluyas la clave de servicio ni el token de acceso personal en ningún archivo del cliente**. Ponlo como comentario de advertencia en el archivo de configuración.
>
> Los mensajes de error deben estar en español y ser comprensibles. Nada de mostrar el error crudo de la API.
>
> ---
>
> ## 11. Fase 8 — Portal del adoptante
>
> La pantalla más importante del producto. Si el reporte no se siente inmediato, el proyecto falla.
>
> `/adoptante/index.html` — al entrar, el adoptante ve un saludo con su nombre, la foto de su perro en grande, una sola pregunta destacada, "¿Cómo está [nombre] este mes?", con un botón grande, y debajo el próximo control pendiente con los días que faltan.
>
> **El reporte del mes** es una sola pantalla, sin pasos ni navegación: un botón grande para tomar o subir una foto con vista previa inmediata, y tres preguntas que se responden de un toque, nunca escribiendo. "¿Come bien?" con las opciones sí, más o menos y no. "¿Vacunas al día?" con sí, no y no estoy seguro. "¿Algún problema?" con todo bien, tengo una duda y necesito ayuda. Un botón de enviar.
>
> La foto se sube a la cubeta de reportes, dentro de la carpeta del usuario, y el registro se guarda en la tabla. Al enviar, muestra una confirmación cálida con una marca de verificación dibujada con `stroke-dasharray` que dure menos de un segundo, y un mensaje que reconozca el cuidado del adoptante. Nunca uses lenguaje de control: nada de "reporte registrado" ni "obligación cumplida".
>
> Si responde "necesito ayuda", llévalo directamente al canal de ayuda sin preguntas adicionales.
>
> Cronometra el flujo: desde que entra hasta que envía no puede haber más de tres toques además de la foto. Si te salen cuatro, simplifícalo.
>
> `/adoptante/carnet.html` — el carnet digital: datos del perro, historia de rescate, calendario sanitario en línea de tiempo vertical que se dibuja progresivamente al entrar en pantalla, y la galería cronológica con todas las fotos enviadas mes a mes, de la más reciente a la más antigua. Esta galería es el premio emocional del seguimiento: dale espacio y cuidado visual.
>
> `/adoptante/guias.html` — las guías agrupadas por categoría, en acordeones de Bootstrap, cada una mostrando que fue validada por la Clínica Veterinaria Lobo Gris, con buscador por palabra. Muestra tres a la vez antes de pedir "ver más": la veterinaria advirtió que abrumar con información produce el efecto contrario.
>
> `/adoptante/ayuda.html` — el canal de ayuda. Existe porque el silencio previo al abandono es vergüenza, no indiferencia. Abre con un texto breve que desarme la culpa, en el tono de "esto le pasa a muchas familias y preferimos que nos avises a tiempo". Cuatro motivos seleccionables de un toque, sin obligar a explicar nada, un campo de texto marcado claramente como opcional, y un botón de enviar. Según el motivo, la confirmación ofrece una salida concreta: orientación de la veterinaria aliada, apoyo del albergue, o el proceso de devolución responsable, explicado sin juicio. El movimiento aquí es especialmente contenido: nada brusco, nada que sobresalte, sin celebración. **Prohibidas las palabras "fracaso", "incumplimiento" y "falta" en toda esta pantalla.**
>
> Añade una barra de navegación inferior fija, estilo aplicación móvil, con íconos de Bootstrap Icons: inicio, carnet, guías y ayuda.
>
> ---
>
> ## 12. Fase 9 — Panel del albergue
>
> `/albergue/index.html` — la pantalla que usa la fundadora todos los días. Tiene que resolver lo que ella pidió: "sería fácil solo llegar y ver la foto del perrito".
>
> Una sola pantalla, sin pestañas. Arriba, cuatro números grandes desde la vista de indicadores, que cuentan hacia arriba una sola vez al cargar, en 400 milisegundos. Debajo, lo que necesita atención: los casos en rojo y ámbar desde la vista del semáforo, ordenados por urgencia, cada uno con la foto del perro, el nombre de la familia, los días de silencio y un botón de contacto directo por WhatsApp con un mensaje ya redactado y cordial. Si no hay casos en rojo, muestra un mensaje de tranquilidad, nunca una tabla vacía. Más abajo, la galería: las fotos más recientes de todos los perros adoptados en una cuadrícula grande, con el borde del color de su semáforo.
>
> El movimiento aquí es mínimo: un escalonado corto al cargar y nada más. La fundadora abrirá esto a diario y una animación vistosa estorba a la tercera visita.
>
> Debe entenderse el estado completo de las adopciones en menos de diez segundos y sin hacer un solo clic.
>
> `/albergue/caso.html` — detalle de una adopción: datos del perro y la familia con contacto directo, historial completo de reportes con las fotos en línea de tiempo, estado sanitario con lo vencido destacado, notas internas del equipo y el registro de contactos realizados.
>
> `/albergue/solicitudes.html` — las solicitudes del canal de ayuda, con motivo, familia, fecha y estado modificable, y la acción sugerida según el motivo.
>
> `/albergue/adopciones.html` — listado completo con buscador y filtro por estado del semáforo.
>
> `/albergue/perros.html` — gestión del catálogo: alta, edición y carga de fotos a la cubeta pública.
>
> `/albergue/nueva-adopcion.html` — el registro de una adopción nueva, que es donde el seguimiento deja de ser un favor y pasa a ser un acuerdo. Un formulario en tres pasos: el perro entregado, los datos de la familia, y el **acta de adopción con cláusula de seguimiento**, que establece el compromiso de enviar un reporte mensual con foto, mantener el calendario sanitario al día y avisar al albergue antes de ceder o devolver al perro. Con casillas de aceptación y firma dibujada con el dedo o el mouse sobre un `canvas`, que se guarda como imagen en la cubeta de actas. Al guardar, crea la cuenta del adoptante y su adopción, y genera un resumen del acta imprimible mediante una hoja de estilos de impresión, sin librerías de PDF.
>
> ---
>
> ## 13. Fase 10 — Apadrinamiento y transparencia
>
> `/apadrinar.html` — galería de perros apadrinables con su historia, tres montos mensuales sugeridos y un campo para otro monto, formulario corto del padrino que guarda en la base de datos, y confirmación que explique que el aporte va directamente a la cuenta del albergue, con los datos de Yape y Plin como marcadores de posición claramente señalados.
>
> Incluye la sección de **transparencia**: lo recaudado en los últimos seis meses y en qué se usó, desde la tabla de movimientos, en una tabla de Bootstrap y un gráfico de barras dibujado en SVG cuyas barras crecen desde cero al entrar en pantalla. No instales ninguna librería de gráficos.
>
> Deja comentado en el código dónde se conectaría una pasarela de pago real, pero no implementes ninguna.
>
> ---
>
> ## 14. Fase 11 — Cumplimiento legal
>
> El proyecto trata datos personales de ciudadanos peruanos, así que debe cumplir la **Ley 29733 de Protección de Datos Personales del Perú** y su reglamento.
>
> Crea `/privacidad.html` con la política completa en lenguaje claro: qué datos se recogen, con qué finalidad, cuánto tiempo se conservan, quién puede acceder a ellos, y cómo ejercer los derechos de acceso, rectificación, cancelación y oposición, con el contacto del albergue.
>
> Incluye el consentimiento informado explícito dentro del acta de adopción, no como una casilla marcada por defecto, y registra su aceptación con fecha en la base de datos.
>
> Enlaza la política desde el pie de todas las páginas y desde el registro.
>
> Añade en el pie una nota de que es un proyecto académico de la Universidad Continental.
>
> ---
>
> ## 15. Fase 12 — Revisión de calidad
>
> Antes de publicar, revisa y corrige:
>
> **Rendimiento de las animaciones.** Verifica que ninguna anime propiedades distintas de `transform` y `opacity`; que haya un solo observador global y no uno por elemento; que nada pesado corra dentro del evento de scroll sin pasar por `requestAnimationFrame`; y que `will-change` se retire de los elementos que ya terminaron.
>
> **Reducción de movimiento.** Actívala y recorre todo el sitio: nada debe moverse y todo el contenido debe quedar visible. Si algo desaparece porque dependía de la animación para hacerse visible, está mal construido.
>
> **Adaptación a pantallas.** Prueba a 360, 768, 1024, 1440 y 1920 píxeles de ancho. Ningún texto cortado, ningún desbordamiento horizontal, ningún botón menor a 48 píxeles de alto, y los efectos fijos desactivados en celular. Verifica también que se vea bien proyectado, porque la exposición será con proyector.
>
> **Accesibilidad.** Contraste suficiente en todo el texto, texto alternativo en todas las imágenes, navegación completa con teclado, etiquetas correctas en todos los campos, y atributos de accesibilidad en los íconos que comunican información.
>
> **Lenguaje.** Recorre todos los textos visibles y elimina anglicismos, tecnicismos y cualquier palabra de vigilancia, control o sanción. Verifica que no haya quedado ni un solo emoji en ninguna parte del proyecto, ni en el código ni en la documentación.
>
> **Seguridad.** Confirma que no hay credenciales en el código del cliente, que `.mcp.json` está en `.gitignore` y que las políticas de seguridad de la fase 2 siguen funcionando después de todos los cambios.
>
> Dame un resumen de qué encontraste y qué corregiste.
>
> ---
>
> ## 16. Fase 13 — Publicación y documentación
>
> Prepara el proyecto para publicarse como sitio estático en Vercel, Netlify o GitHub Pages. Verifica que todas las rutas sean relativas y que funcione servido desde un subdirectorio. Configura las variables públicas de Supabase de modo que sean fáciles de cambiar en un solo archivo.
>
> Escribe `README.md` con: qué es Sigue mi Huella y qué problema resuelve, el stack, cómo configurar Supabase desde cero en una cuenta nueva, cómo correr el proyecto en local, el esquema de la base de datos explicado, las credenciales de los usuarios de prueba, cómo reemplazar las fotos de marcador de posición por las reales, los pasos exactos de despliegue y los créditos del equipo: Luis Eduardo Ponce Alcocer, Abigail Sarai Carlos Mendoza, Lenin Andy Villanueva Aucallanchi y Yasmany Santos Meza, Universidad Continental.
>
> Escribe `GUION-DEMO.md` con un recorrido de cinco minutos para la exposición: en qué orden mostrar las pantallas, qué decir en cada una, y en qué momento detenerse en los tres momentos que tienen que recordar, que son la animación de las diez siluetas, el celular que cambia de pantalla y el reporte de cinco segundos.
>
> Recuérdame al final agregar `&read_only=true` al final de la URL del `.mcp.json`, ahora que la base de datos ya está creada, para que el servidor no pueda volver a modificarla por accidente.
>
> ---
>
> ## 17. Reglas que no se negocian
>
> Cero emojis en todo el proyecto; todos los símbolos son Bootstrap Icons. Cero anglicismos en la interfaz. Ninguna credencial en el código del cliente. Row Level Security activa en todas las tablas. Nada que se mueva más de 600 milisegundos salvo la entrada de la portada. Todo el movimiento desactivable por preferencia del sistema. Todas las pantallas funcionando desde 360 píxeles de ancho. Y el reporte del adoptante resuelto en tres toques y una foto.
>
> ## 18. Cómo sabré que está terminado
>
> Un visitante entra al sitio en su celular, recorre la portada y entiende el problema sin leer una sola línea de documentación. Un adoptante ingresa, envía su reporte con foto en menos de cinco segundos y lo ve aparecer en su carnet. La fundadora ingresa, ve de inmediato qué familias necesitan una llamada hoy y contacta a una por WhatsApp sin salir de la pantalla. Un adoptante en apuros pide ayuda sin tener que justificarse y el albergue la recibe. Y todo eso funciona sobre una base de datos real, con los permisos correctos, desplegado en una dirección pública que puedo compartir.
>
> Empieza por la fase 0 y pídeme el Project Ref y el token.

---

## Después de pegarlo

Claude Code se detendrá tres veces esperando su respuesta: al pedir las credenciales de Supabase, al terminar las pruebas de seguridad y al mostrar la guía visual. Esas tres pausas son a propósito: son los puntos donde un error temprano cuesta caro más adelante.

Si una animación no les convence, descríbanla en sus propias palabras —"se siente lenta", "aparece de golpe", "no entiendo qué me muestra"— en lugar de dar instrucciones técnicas. La descripción del problema suele dar mejores resultados que la de la solución.

Y antes de exponer, prueben el sitio en un celular real y ensayen con el proyector: las secciones con efecto fijo necesitan que uno baje despacio, y si durante la exposición se hace scroll rápido, la narración se pierde.
