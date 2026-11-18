"""
Genera y sube las imagenes de marcador de posicion (SVG) de Sigue mi Huella.

Uso:
    set SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
    set SUPABASE_SERVICE_KEY=...   (clave de servicio, solo en tu computadora)
    python herramientas/marcadores.py

La clave de servicio se lee de una variable de entorno y NUNCA debe escribirse
en este archivo ni en ningun archivo del sitio. Cuando el albergue tenga fotos
reales, reemplacelas desde el panel (Catalogo de perros) y este script deja
de ser necesario.
"""
import json
import os
import urllib.request

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]

FONDOS = ["#a4521a", "#c47a2c", "#7a4a2a", "#8e6b3e", "#b5533f", "#5f6f4a", "#9a5b34", "#6b4f3a"]

SILUETA = """
<g fill="{tinta}">
  <path d="M30 90 C27 70 31 52 45 45 C56 40 63 48 65 60 L67 90 Z"/>
  <circle cx="62" cy="32" r="13"/>
  <ellipse cx="75" cy="36" rx="9" ry="6"/>
  <path d="M52 22 C46 29 46 41 52 45 C57 38 58 29 52 22 Z"/>
  <path d="M33 85 C18 86 13 75 17 66 C20 74 26 79 35 78 Z"/>
  <rect x="55" y="58" width="8" height="32" rx="3"/>
</g>
<circle cx="83.5" cy="34" r="2.2" fill="{fondo}"/>
<circle cx="65" cy="29" r="1.8" fill="{fondo}"/>
"""


def svg(nombre, fondo, subtitulo=""):
    sub = (
        f'<text x="200" y="372" text-anchor="middle" font-family="Georgia, serif" '
        f'font-size="20" fill="#f6e7d2" opacity="0.85">{subtitulo}</text>'
        if subtitulo
        else ""
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">
<rect width="400" height="400" fill="{fondo}"/>
<circle cx="200" cy="170" r="120" fill="#ffffff" opacity="0.08"/>
<g transform="translate(95 60) scale(2.1)">{SILUETA.format(tinta="#f6e7d2", fondo=fondo)}</g>
<text x="200" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="38" font-weight="700" fill="#fffaf2">{nombre}</text>
{sub}
</svg>"""


def logo(texto, fondo):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<rect width="200" height="200" rx="40" fill="{fondo}"/>
<text x="100" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#fffaf2">{texto}</text>
</svg>"""


def subir(cubeta, ruta, contenido):
    req = urllib.request.Request(
        f"{URL}/storage/v1/object/{cubeta}/{ruta}",
        method="POST",
        data=contenido.encode("utf-8"),
        headers={
            "apikey": KEY,
            "Authorization": "Bearer " + KEY,
            "Content-Type": "image/svg+xml",
            "x-upsert": "true",
        },
    )
    urllib.request.urlopen(req).read()


def consultar(tabla, params):
    req = urllib.request.Request(
        f"{URL}/rest/v1/{tabla}?{params}",
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY},
    )
    return json.load(urllib.request.urlopen(req))


MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]

if __name__ == "__main__":
    perros = consultar("perros", "select=id,codigo,nombre,foto_ruta&order=codigo")
    for i, p in enumerate(perros):
        if p["foto_ruta"]:
            subir("perros", p["foto_ruta"], svg(p["nombre"], FONDOS[i % len(FONDOS)]))
    print("catalogo:", len(perros))

    nombres = {p["id"]: p["nombre"] for p in perros}
    adop = consultar("adopciones", "select=id,perro_id")
    perro_de = {a["id"]: a["perro_id"] for a in adop}
    reportes = consultar("reportes", "select=adopcion_id,fecha,foto_ruta")
    for j, r in enumerate(reportes):
        if not r["foto_ruta"]:
            continue
        nombre = nombres.get(perro_de.get(r["adopcion_id"]), "")
        a, m, d = r["fecha"].split("-")
        subir("reportes", r["foto_ruta"], svg(nombre, FONDOS[(j * 3) % len(FONDOS)], f"{int(d)} {MESES[int(m) - 1]} {a}"))
    print("reportes:", len(reportes))

    aliados = consultar("aliados", "select=nombre,logo_ruta")
    for k, al in enumerate(aliados):
        if al["logo_ruta"]:
            iniciales = "".join(w[0] for w in al["nombre"].replace("Clínica Veterinaria ", "").split()[:2]).upper()
            subir("perros", al["logo_ruta"], logo(iniciales, FONDOS[(k * 2) % len(FONDOS)]))
    print("aliados:", len(aliados))
