// Gestion del catalogo de perros: listado, alta, edicion y foto.
import { supabase, fotoPublica } from '../js/supabase.js';
import { esc, edadAprox, TEXTOS, mensajeError, aviso, cargando, reducirImagen } from '../js/comun.js';
import { iniciarPanel, mostrarError, ESTADO_PERRO } from './panel.js';

await iniciarPanel('perros');

const lista = document.getElementById('perros');
const filtro = document.getElementById('filtro-estado');
const buscador = document.getElementById('buscar-perro');
const conteo = document.getElementById('conteo-perros');
const form = document.getElementById('form-perro');
const modalEl = document.getElementById('modal-perro');
const modal = new window.bootstrap.Modal(modalEl);
const campoFoto = document.getElementById('perro-foto');
const vistaFoto = document.getElementById('vista-foto');
const zonaError = document.getElementById('perro-error');

const campos = {
  codigo: document.getElementById('perro-codigo'),
  nombre: document.getElementById('perro-nombre'),
  sexo: document.getElementById('perro-sexo'),
  tamano: document.getElementById('perro-tamano'),
  estado: document.getElementById('perro-estado'),
  fecha_nacimiento_aprox: document.getElementById('perro-nacimiento'),
  fecha_rescate: document.getElementById('perro-rescate'),
  historia: document.getElementById('perro-historia'),
};
const esterilizado = document.getElementById('perro-esterilizado');

let perros = [];
let editando = null; // perro que se edita, o null si es alta
let urlVista = null;

const normalizar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const filtroInicial = new URLSearchParams(location.search).get('estado');
if (filtroInicial && ESTADO_PERRO[filtroInicial]) filtro.value = filtroInicial;

await cargar();

async function cargar() {
  const { data, error } = await supabase.from('perros').select('*').order('codigo');
  if (error) { mostrarError(lista, error); return; }
  perros = data || [];
  pintar();
}

function pintar() {
  const estado = filtro.value;
  const texto = normalizar(buscador.value.trim());
  const visibles = perros.filter((p) =>
    (!estado || p.estado === estado) && (!texto || normalizar(`${p.nombre} ${p.codigo}`).includes(texto)));
  conteo.textContent = `${visibles.length} ${visibles.length === 1 ? 'perro' : 'perros'}`;
  if (!visibles.length) {
    lista.innerHTML = `<li class="col-12"><div class="estado-vacio"><i class="bi bi-search" aria-hidden="true"></i>${perros.length ? 'No hay perros con ese filtro.' : 'Todavía no hay perros en el catálogo. Agrega el primero.'}</div></li>`;
    return;
  }
  lista.innerHTML = visibles.map((p) => `
    <li class="col-sm-6 col-lg-4 col-xl-3">
      <article class="card h-100 overflow-hidden">
        <img class="foto-perro" src="${esc(fotoPublica(p.foto_ruta))}" alt="Foto de ${esc(p.nombre)}" loading="lazy">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <h2 class="h4 mb-0 texto-cortado">${esc(p.nombre)}</h2>
            <span class="text-suave small">${esc(p.codigo)}</span>
          </div>
          <p class="text-suave mb-2">${esc(TEXTOS.sexo[p.sexo] || '')} · ${esc(TEXTOS.tamano[p.tamano] || '')}${p.fecha_nacimiento_aprox ? ` · ${esc(edadAprox(p.fecha_nacimiento_aprox))}` : ''}</p>
          <p class="mb-3"><span class="badge ${p.estado === 'en_adopcion' ? 'text-bg-primary' : 'text-bg-light border'}">${esc(ESTADO_PERRO[p.estado] || p.estado)}</span>
            ${p.esterilizado ? '<span class="small text-suave ms-1">Esterilizado</span>' : ''}</p>
          <button class="btn btn-suave mt-auto" type="button" data-editar="${esc(p.id)}">
            <i class="bi bi-pencil" aria-hidden="true"></i> Editar <span class="visually-hidden">a ${esc(p.nombre)}</span>
          </button>
        </div>
      </article>
    </li>`).join('');
}

filtro.addEventListener('change', pintar);
buscador.addEventListener('input', pintar);

// ---------------------------------------------------------------------
// Modal de alta y edicion
// ---------------------------------------------------------------------
function siguienteCodigo() {
  const numeros = perros.map((p) => Number((p.codigo.match(/(\d+)$/) || [])[1] || 0));
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `EMR-${String(siguiente).padStart(3, '0')}`;
}

function limpiarVista() {
  if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
}

function abrir(perro) {
  editando = perro || null;
  form.reset();
  limpiarVista();
  zonaError.hidden = true;
  document.getElementById('modal-perro-titulo').textContent = perro ? `Editar a ${perro.nombre}` : 'Agregar perro';
  if (perro) {
    for (const [k, el] of Object.entries(campos)) el.value = perro[k] ?? '';
    esterilizado.checked = Boolean(perro.esterilizado);
  } else {
    campos.codigo.value = siguienteCodigo();
    campos.estado.value = 'en_albergue';
    campos.tamano.value = 'mediano';
  }
  vistaFoto.src = fotoPublica(perro?.foto_ruta);
  vistaFoto.alt = perro ? `Foto actual de ${perro.nombre}` : 'Sin foto todavía';
  modal.show();
}

modalEl.addEventListener('shown.bs.modal', () => campos.nombre.focus());
modalEl.addEventListener('hidden.bs.modal', limpiarVista);

document.getElementById('btn-nuevo').addEventListener('click', () => abrir(null));
lista.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-editar]');
  if (boton) abrir(perros.find((p) => p.id === boton.dataset.editar));
});

campoFoto.addEventListener('change', () => {
  limpiarVista();
  const archivo = campoFoto.files[0];
  if (!archivo) { vistaFoto.src = fotoPublica(editando?.foto_ruta); return; }
  if (!archivo.type.startsWith('image/')) {
    mostrarAviso('Ese archivo no es una imagen. Elige una foto JPG, PNG o WEBP.');
    campoFoto.value = '';
    return;
  }
  urlVista = URL.createObjectURL(archivo);
  vistaFoto.src = urlVista;
  vistaFoto.alt = 'Vista previa de la nueva foto';
});

function mostrarAviso(texto) {
  zonaError.textContent = texto;
  zonaError.hidden = false;
}

function validar(datos) {
  if (!datos.codigo) return ['codigo', 'Escribe un código para el perro, por ejemplo EMR-019.'];
  if (!/^[A-Za-z0-9-]+$/.test(datos.codigo)) return ['codigo', 'El código solo puede tener letras, números y guiones.'];
  if (!datos.nombre) return ['nombre', 'Escribe el nombre del perro.'];
  if (datos.fecha_nacimiento_aprox && datos.fecha_rescate && datos.fecha_rescate < datos.fecha_nacimiento_aprox) {
    return ['fecha_rescate', 'La fecha de rescate no puede ser anterior a la de nacimiento.'];
  }
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  zonaError.hidden = true;
  const datos = {
    codigo: campos.codigo.value.trim().toUpperCase(),
    nombre: campos.nombre.value.trim(),
    sexo: campos.sexo.value,
    tamano: campos.tamano.value,
    estado: campos.estado.value,
    fecha_nacimiento_aprox: campos.fecha_nacimiento_aprox.value || null,
    fecha_rescate: campos.fecha_rescate.value || null,
    historia: campos.historia.value.trim() || null,
    esterilizado: esterilizado.checked,
  };
  const problema = validar(datos);
  if (problema) { mostrarAviso(problema[1]); campos[problema[0]].focus(); return; }

  const boton = document.getElementById('btn-guardar-perro');
  cargando(boton, true, 'Guardando...');
  try {
    // 1. Guardar los datos
    const consulta = editando
      ? supabase.from('perros').update(datos).eq('id', editando.id).select().single()
      : supabase.from('perros').insert(datos).select().single();
    const { data: guardado, error } = await consulta;
    if (error) throw error;

    // 2. Subir la foto, si se eligio una
    const archivo = campoFoto.files[0];
    if (archivo) {
      const reducida = await reducirImagen(archivo);
      const extension = reducida.type === 'image/png' ? 'png' : reducida.type === 'image/webp' ? 'webp' : 'jpg';
      const rutaFoto = `catalogo/${guardado.codigo}-${Date.now()}.${extension}`;
      const { error: errSubir } = await supabase.storage.from('perros')
        .upload(rutaFoto, reducida, { contentType: reducida.type || 'image/jpeg', upsert: false });
      if (errSubir) {
        aviso('Los datos se guardaron, pero la foto no se pudo subir. ' + mensajeError(errSubir), 'error');
      } else {
        const { error: errRuta } = await supabase.from('perros').update({ foto_ruta: rutaFoto }).eq('id', guardado.id);
        if (errRuta) aviso(mensajeError(errRuta), 'error');
      }
    }
    modal.hide();
    aviso(editando ? `Datos de ${datos.nombre} actualizados.` : `${datos.nombre} ya está en el catálogo.`);
    await cargar();
  } catch (err) {
    mostrarAviso(mensajeError(err));
  } finally {
    cargando(boton, false);
  }
});
