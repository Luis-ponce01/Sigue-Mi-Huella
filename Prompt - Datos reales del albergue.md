# Prompt para Claude Code — Datos reales del albergue

Pégalo completo en Claude Code, dentro de la carpeta del proyecto Sigue mi Huella.

---

> Vamos a reemplazar los datos de marcador de posición del albergue por los datos reales, que obtuve de su página oficial `https://www.emiliarescataanimales.org`. Trabaja por partes y detente donde te lo pido.
>
> ## 1. Corrección del nombre, antes que nada
>
> El albergue **no se llama "Emiliana Rescata"**. Su nombre oficial es **"Emilia Rescata"**, sin la "n". Así aparece en su dominio, en su web, en sus redes y en su aviso de copyright. En todo el proyecto lo escribimos mal.
>
> Busca todas las apariciones de "Emiliana" en el repositorio, incluyendo `index.html`, `apadrinar.html`, `ingresar.html`, `registro.html`, `privacidad.html`, `js/config.js`, `README.md`, `CLAUDE.md`, `GUION-DEMO.md`, los textos de las páginas de `adoptante/` y `albergue/`, y los datos de prueba en `supabase/migraciones/004_datos_prueba.sql`. Reemplázalas por "Emilia".
>
> Ten cuidado con dos casos que **no** debes tocar: el nombre propio de la fundadora si aparece como persona dentro de los datos de prueba, y los correos de las cuentas de prueba (`albergue@siguemihuella.example`), que son ficticios a propósito. Cuando termines, dime cuántas apariciones cambiaste y en qué archivos, y detente para que yo lo revise antes de seguir.
>
> ## 2. Datos de contacto reales
>
> Actualiza el objeto `ALBERGUE` en `js/config.js` con esto:
>
> - Nombre: Emilia Rescata
> - Ciudad: Huancayo, Junín, Perú
> - WhatsApp: `51955646940` (en pantalla se muestra como +51 955 646 940)
> - Sitio oficial: `https://www.emiliarescataanimales.org`
> - Facebook: `https://www.facebook.com/Emiliarescata`
> - Instagram: `https://www.instagram.com/emiliarescataanimaleshuancayo`
> - TikTok: `https://www.tiktok.com/@emiliarescata`
> - Formulario oficial de adopción: `https://docs.google.com/forms/d/e/1FAIpQLScHEohB9ejWm6yKkDnHEGjm1-myaN8jXKIytwVZHroGsFryYw/viewform`
>
> Agrega las claves que falten en el objeto y usa esos valores en el pie de página que arma `js/comun.js`, en la portada y en la página de apadrinamiento. Donde hoy haya un correo de marcador (`contacto@emilianarescata.example`), quítalo: el albergue no publica correo, su canal es WhatsApp.
>
> ## 3. Apadrinamiento: usar las membresías reales
>
> El albergue ya tiene un esquema de apadrinamiento publicado, con montos **en dólares**, y es distinto al que inventamos. Reemplaza nuestros montos por los suyos en `apadrinar.html`:
>
> - Membresía de 5 USD al mes: apadrina cachorros rescatados.
> - Membresía de 10 USD al mes: apadrina perritos mayores.
> - Membresía de 15 USD al mes: apadrina perros con enfermedades, cubriendo su atención médica.
>
> Y para donaciones de una sola vez, también en dólares:
>
> - 5 USD: alimento.
> - 10 USD: esterilizaciones.
> - 15 USD: gastos veterinarios.
>
> ## 4. Donaciones: enlazar, no duplicar
>
> El albergue publica sus cuentas bancarias y su PayPal en su propia web. **No copies los números de cuenta a nuestro sitio.** En su lugar, en la sección de donación pon un botón que lleve a `https://www.emiliarescataanimales.org/donaciones`, con un texto que explique que el aporte se hace en los canales oficiales del albergue y llega directamente a ellos.
>
> La razón es práctica: si nuestro prototipo muestra números de cuenta y alguno cambia o se transcribe mal, el dinero de una persona termina donde no debe, y la responsabilidad sería nuestra. Enlazar a su página oficial evita ese riesgo y además mantiene una sola fuente de verdad. Deja esa justificación como comentario en el código para que quede registrada la decisión.
>
> ## 5. Adopción: usar su formulario
>
> En la portada, el botón de adoptar debe llevar al formulario oficial de Google que ya usa el albergue, no a un formulario nuestro. Nuestro sistema se ocupa de lo que pasa **después** de la adopción, que es el problema que estamos resolviendo; el ingreso de solicitudes ya lo tienen resuelto y duplicarlo solo les crea trabajo.
>
> ## 6. Datos que todavía no tenemos
>
> Estos no están publicados en ninguna parte de su web y no debes inventarlos. Crea un archivo `DATOS-PENDIENTES.md` en la raíz, con esta lista y un espacio para completar cada uno, para que el equipo se los pida directamente al albergue:
>
> - Dirección física del albergue y distrito.
> - Nombre completo de la fundadora y de las dos personas que la acompañan.
> - Año de fundación.
> - Número de perros rescatados hasta hoy y número de adopciones al año.
> - Si la organización está formalizada y, de ser así, su RUC o número de registro.
> - Horario de atención y si reciben visitas.
> - Si tienen Yape o Plin, además de las cuentas bancarias.
> - Confirmación de la grafía exacta del nombre: "Emilia Rescata" o "Emilia Rescata Animales".
>
> Donde el sitio necesite alguno de esos datos y no lo tengamos, **no pongas un valor inventado**: deja el bloque fuera o escribe un marcador visible en el código con el prefijo `PENDIENTE:`, nunca un dato falso en pantalla. Un prototipo que muestra una dirección inventada de un albergue real es un problema serio, no un detalle.
>
> ## 7. Atribución
>
> El sitio oficial del albergue fue hecho por Foo Talent Group y lleva su aviso de copyright de 2024. Nuestro proyecto es independiente y académico. Agrega en el pie de nuestro sitio una línea que diga que es un proyecto académico de la Universidad Continental desarrollado para el albergue Emilia Rescata, con enlace a su sitio oficial, para que nadie confunda nuestro prototipo con su web institucional.
>
> ## 8. Al terminar
>
> Actualiza `README.md` y `CLAUDE.md` con el nombre corregido y los datos reales, y dime en un resumen qué cambiaste, qué quedó pendiente y si encontraste alguna mención del nombre antiguo que no supiste si tocar.

---

## Nota para el equipo, fuera del prompt

El cambio de nombre no es solo del sitio web. **"Emiliana Rescata" aparece también en el informe, en la presentación del pitch, en el Excel de captación de ideas y en el mapa mental.** Hay que corregirlo en todos antes de entregar, porque el docente puede entrar a la web del albergue y ver que el nombre no coincide.

Conviene confirmarlo con la fundadora por WhatsApp antes de cambiar todo: puede que la organización se llame "Emilia Rescata" y que ella se llame Emiliana, o al revés. Una pregunta de treinta segundos lo resuelve y evita corregir dos veces.

Lo mismo con el nombre que figura como titular de las cuentas de donación en su web, Ana Carhuamaca Mesias: podría ser la fundadora, una colaboradora o una tesorera. Pregúntenlo antes de citarlo como fuente en el informe.
