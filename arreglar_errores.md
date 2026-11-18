# Prompt para Claude Code — Arreglar los tres errores del panel del albergue

Pégalo completo en Claude Code, dentro de la carpeta del proyecto.

---

> Hay tres errores de JavaScript que rompen tres pantallas del panel del albergue. Todos son el mismo problema: el módulo llama a una función en el nivel superior antes de que se haya inicializado un `const` que esa función usa, así que al cargar la página sale `ReferenceError: Cannot access '...' before initialization` y la pantalla queda en blanco.
>
> Los tres casos:
>
> 1. **`albergue/caso.js`** — la línea 46 hace `await Promise.all([cargarVacunas(), cargarReportes(), cargarContactos(), cargarNotas()]);`, pero `const listaVacunas = document.getElementById('vacunas');` está declarado en la línea 114. Rompe la ficha del caso.
> 2. **`albergue/adopciones.js`** — la línea 41 llama a `pintar();`, pero `const normalizar = ...` está en la línea 47 y `function pintar()` en la 54. Rompe la lista de adopciones.
> 3. **`albergue/perros.js`** — la línea 44 llama a `pintar();`, pero `const normalizar = ...` está en la línea 47 y `function pintar()` en la 49. Rompe el catálogo de perros.
>
> Arréglalos moviendo las declaraciones de `const` (las referencias al DOM y los ayudantes como `normalizar`) arriba, antes de la primera llamada que las use. Mantén el orden lógico del archivo: primero las referencias al DOM y los ayudantes, después las funciones, al final el arranque. No cambies la lógica ni el comportamiento, solo el orden.
>
> Revisa además si el mismo patrón se repite en los otros módulos de `albergue/` y de `adoptante/`: busca llamadas en el nivel superior del módulo que ocurran antes de las declaraciones `const` o `let` que esas funciones leen. Si encuentras más, arréglalos igual.
>
> Cuando termines, verifica cada archivo con `node --check` y luego abre las seis pantallas del albergue en el navegador con la consola abierta: panel, ficha del caso, solicitudes, adopciones, perros y nueva adopción. Las seis tienen que cargar sin ningún error en consola. Dime qué archivos cambiaste y confírmame que las seis pantallas quedan limpias.
>
> Una cosa aparte, de seguridad: el archivo `.mcp.json` tiene el token personal de Supabase y, aunque está en `.gitignore`, se va adentro cuando comprimimos la carpeta para compartirla. Agrega una nota en el `README.md`, en la sección de configuración, que diga que antes de comprimir o compartir el proyecto hay que borrar `.mcp.json`, y que el token debe rotarse en el panel de Supabase si el zip ya salió del equipo.

---

## Nota para el equipo, fuera del prompt

Después de que Claude Code arregle esto, abran las seis pantallas del albergue una por una con la consola del navegador abierta (F12) antes de la presentación. Es el único chequeo que hace falta y toma dos minutos.
