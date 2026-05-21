const EVENTOS_PASSWORD_HASH = '53ed4c7bc02a94d0e18297cab87b3e2a79309c8bbae5a16d59bcf3e6de718e19';
const AUTH_STORAGE_KEY = 'pena-cuervo-admin-eventos-autorizado';

let eventos = [];
let categorias = [];
let eventosCargados = false;
let categoriaEditandoNombre = null;

document.addEventListener('DOMContentLoaded', () => {
    configurarNavegacion();
    configurarAutenticacion();
    configurarFormulario();

    if (sessionStorage.getItem(AUTH_STORAGE_KEY) === EVENTOS_PASSWORD_HASH) {
        desbloquearPanel();
    }
});

function configurarNavegacion() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
}

function configurarAutenticacion() {
    const form = document.getElementById('form-acceso-eventos');
    const input = document.getElementById('password-eventos');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = input.value.trim();
        if (!password) {
            mostrarMensaje('Introduce la contraseña.', 'error');
            return;
        }

        const hash = await generarHash(password);
        if (hash === EVENTOS_PASSWORD_HASH) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, hash);
            input.value = '';
            desbloquearPanel();
        } else {
            mostrarMensaje('Contraseña incorrecta.', 'error');
        }
    });
}

function configurarFormulario() {
    document.getElementById('btn-nuevo-evento').addEventListener('click', () => prepararNuevoEvento());
    document.getElementById('btn-recargar-eventos').addEventListener('click', () => cargarDatos());
    document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.reload();
    });

    document.getElementById('form-evento').addEventListener('submit', guardarEvento);
    document.getElementById('btn-cancelar-edicion').addEventListener('click', () => prepararNuevoEvento());

    document.getElementById('btn-nueva-categoria').addEventListener('click', () => prepararNuevaCategoria());
    document.getElementById('btn-recargar-categorias').addEventListener('click', () => cargarDatos());
    document.getElementById('form-categoria').addEventListener('submit', guardarCategoria);
    document.getElementById('btn-cancelar-categoria').addEventListener('click', () => prepararNuevaCategoria());
}

async function generarHash(texto) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function desbloquearPanel() {
    document.getElementById('acceso-wrapper').classList.add('hidden');
    document.getElementById('panel-wrapper').classList.remove('hidden');

    if (!eventosCargados) {
        cargarDatos();
    }
}

async function cargarDatos() {
    try {
        const [eventosResponse, categoriasResponse] = await Promise.all([
            fetch('../data/eventos.json'),
            fetch('../data/categorias.json')
        ]);

        if (!eventosResponse.ok) {
            throw new Error('No se pudieron cargar los eventos');
        }

        if (!categoriasResponse.ok) {
            throw new Error('No se pudieron cargar las categorías');
        }

        const eventosData = await eventosResponse.json();
        const categoriasData = await categoriasResponse.json();

        eventos = Array.isArray(eventosData.eventos) ? eventosData.eventos : [];
        categorias = Array.isArray(categoriasData.categorias) ? categoriasData.categorias : [];
        eventosCargados = true;

        rellenarSelectorCategorias();
        renderizarEventos();
        renderizarCategorias();
        prepararNuevoEvento();
        prepararNuevaCategoria();
        mostrarMensaje('Eventos cargados correctamente.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, 'error');
    }
}

function rellenarSelectorCategorias() {
    const select = document.getElementById('evento-categoria');
    const valorActual = select.value;

    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.nombre;
        option.textContent = categoria.titulo;
        select.appendChild(option);
    });

    if (valorActual) {
        select.value = valorActual;
    }
}

function renderizarEventos() {
    const tbody = document.getElementById('eventos-tbody');

    if (!eventos.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay eventos guardados.</td></tr>';
        return;
    }

    const eventosOrdenados = [...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || Number(a.id) - Number(b.id));

    tbody.innerHTML = eventosOrdenados.map(evento => {
        const categoria = categorias.find(item => item.nombre === evento.categoria);
        return `
            <tr>
                <td>${evento.id}</td>
                <td>${evento.titulo}</td>
                <td>${formatearFecha(evento.fecha)}</td>
                <td>${evento.hora || ''}</td>
                <td>${evento.ubicacion || ''}</td>
                <td>${categoria ? categoria.titulo : (evento.categoria || '')}</td>
                <td class="acciones">
                    <button class="btn-secundario" data-accion="editar" data-id="${evento.id}">Editar</button>
                    <button class="btn-peligro" data-accion="eliminar" data-id="${evento.id}">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('button[data-accion="editar"]').forEach(button => {
        button.addEventListener('click', () => editarEvento(Number(button.dataset.id)));
    });

    tbody.querySelectorAll('button[data-accion="eliminar"]').forEach(button => {
        button.addEventListener('click', () => eliminarEvento(Number(button.dataset.id)));
    });
}

function renderizarCategorias() {
    const tbody = document.getElementById('categorias-tbody');

    if (!categorias.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay categorías guardadas.</td></tr>';
        return;
    }

    const categoriasOrdenadas = [...categorias].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

    tbody.innerHTML = categoriasOrdenadas.map(categoria => {
        const dias = Array.isArray(categoria.dias) ? categoria.dias.join(', ') : '';
        const usoEnEventos = contarEventosPorCategoria(categoria.nombre);
        return `
            <tr>
                <td><span class="categoria-color" style="background:${categoria.color || '#999'}"></span></td>
                <td>${categoria.nombre}</td>
                <td>${categoria.titulo}</td>
                <td>${categoria.pagina || ''}</td>
                <td>${dias}</td>
                <td>${usoEnEventos}</td>
                <td class="acciones">
                    <button class="btn-secundario" data-accion="editar-categoria" data-nombre="${categoria.nombre}">Editar</button>
                    <button class="btn-peligro" data-accion="eliminar-categoria" data-nombre="${categoria.nombre}">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('button[data-accion="editar-categoria"]').forEach(button => {
        button.addEventListener('click', () => editarCategoria(button.dataset.nombre));
    });

    tbody.querySelectorAll('button[data-accion="eliminar-categoria"]').forEach(button => {
        button.addEventListener('click', () => eliminarCategoria(button.dataset.nombre));
    });
}

function contarEventosPorCategoria(nombreCategoria) {
    return eventos.filter(evento => evento.categoria === nombreCategoria).length;
}

function prepararNuevaCategoria() {
    categoriaEditandoNombre = null;
    document.getElementById('form-categoria').reset();
    document.getElementById('categoria-nombre').readOnly = false;
    document.getElementById('btn-cancelar-categoria').classList.add('hidden');
    document.getElementById('btn-guardar-categoria').textContent = 'Guardar categoría';
    document.getElementById('categoria-editor-titulo').textContent = 'Nueva categoría';
}

function editarCategoria(nombre) {
    const categoria = categorias.find(item => item.nombre === nombre);
    if (!categoria) {
        mostrarMensaje('No se encontró la categoría seleccionada.', 'error');
        return;
    }

    categoriaEditandoNombre = categoria.nombre;
    document.getElementById('categoria-nombre').value = categoria.nombre || '';
    document.getElementById('categoria-titulo').value = categoria.titulo || '';
    document.getElementById('categoria-color').value = categoria.color || '#38bdf8';
    document.getElementById('categoria-pagina').value = categoria.pagina || '';
    document.getElementById('categoria-dias').value = Array.isArray(categoria.dias) ? categoria.dias.join(', ') : '';
    document.getElementById('categoria-nombre').readOnly = false;
    document.getElementById('btn-cancelar-categoria').classList.remove('hidden');
    document.getElementById('btn-guardar-categoria').textContent = 'Actualizar categoría';
    document.getElementById('categoria-editor-titulo').textContent = `Editar categoría ${categoria.titulo}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function guardarCategoria(event) {
    event.preventDefault();

    const nombre = document.getElementById('categoria-nombre').value.trim();
    const titulo = document.getElementById('categoria-titulo').value.trim();
    const color = document.getElementById('categoria-color').value.trim();
    const pagina = document.getElementById('categoria-pagina').value.trim();
    const diasTexto = document.getElementById('categoria-dias').value.trim();
    const dias = parsearDias(diasTexto);

    if (!nombre || !titulo || !color || !pagina) {
        mostrarMensaje('Nombre, título, color y página son obligatorios.', 'error');
        return;
    }

    const existeDuplicada = categorias.some(categoria => categoria.nombre === nombre && categoria.nombre !== categoriaEditandoNombre);
    if (existeDuplicada) {
        mostrarMensaje('Ya existe una categoría con ese nombre.', 'error');
        return;
    }

    const categoriaAnterior = categoriaEditandoNombre;
    const nuevaCategoria = { nombre, titulo, color, pagina, dias };
    const indiceExistente = categorias.findIndex(item => item.nombre === categoriaAnterior);

    if (indiceExistente >= 0) {
        categorias[indiceExistente] = nuevaCategoria;
    } else {
        categorias.push(nuevaCategoria);
    }

    const categoriaRenombrada = categoriaAnterior && categoriaAnterior !== nombre;
    if (categoriaRenombrada) {
        eventos = eventos.map(evento => evento.categoria === categoriaAnterior ? { ...evento, categoria: nombre } : evento);
    }

    categorias.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || Number(a.id) - Number(b.id));

    try {
        await guardarCategoriasEnServidor();
        if (categoriaRenombrada) {
            await guardarEventosEnServidor();
        }

        rellenarSelectorCategorias();
        renderizarEventos();
        renderizarCategorias();
        prepararNuevaCategoria();
        mostrarMensaje('Categoría guardada correctamente.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, 'error');
    }
}

async function eliminarCategoria(nombre) {
    const categoria = categorias.find(item => item.nombre === nombre);
    if (!categoria) {
        mostrarMensaje('No se encontró la categoría seleccionada.', 'error');
        return;
    }

    const eventosAsociados = contarEventosPorCategoria(nombre);
    if (eventosAsociados > 0) {
        mostrarMensaje('No puedes eliminar una categoría que todavía usan eventos.', 'error');
        return;
    }

    if (!confirm(`¿Quieres eliminar la categoría "${categoria.titulo}"?`)) {
        return;
    }

    categorias = categorias.filter(item => item.nombre !== nombre);

    try {
        await guardarCategoriasEnServidor();
        rellenarSelectorCategorias();
        renderizarEventos();
        renderizarCategorias();
        prepararNuevaCategoria();
        mostrarMensaje('Categoría eliminada correctamente.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, 'error');
    }
}

function parsearDias(texto) {
    if (!texto) {
        return [];
    }

    return texto
        .split(/[\n,]/)
        .map(dia => dia.trim())
        .filter(Boolean);
}

function formatearFecha(fecha) {
    if (!fecha) {
        return '';
    }

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) {
        return fecha;
    }

    return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function prepararNuevoEvento() {
    const siguienteId = eventos.length ? Math.max(...eventos.map(evento => Number(evento.id) || 0)) + 1 : 1;

    document.getElementById('form-evento').reset();
    document.getElementById('evento-id').value = siguienteId;
    document.getElementById('btn-cancelar-edicion').classList.add('hidden');
    document.getElementById('btn-guardar-evento').textContent = 'Guardar evento';
    document.getElementById('editor-titulo').textContent = 'Nuevo evento';
}

function editarEvento(id) {
    const evento = eventos.find(item => Number(item.id) === id);
    if (!evento) {
        mostrarMensaje('No se encontró el evento seleccionado.', 'error');
        return;
    }

    document.getElementById('evento-id').value = evento.id;
    document.getElementById('evento-titulo').value = evento.titulo || '';
    document.getElementById('evento-fecha').value = (evento.fecha || '').split('T')[0];
    document.getElementById('evento-hora').value = evento.hora || '';
    document.getElementById('evento-ubicacion').value = evento.ubicacion || '';
    document.getElementById('evento-descripcion').value = evento.descripcion || '';
    document.getElementById('evento-categoria').value = evento.categoria || '';
    document.getElementById('btn-cancelar-edicion').classList.remove('hidden');
    document.getElementById('btn-guardar-evento').textContent = 'Actualizar evento';
    document.getElementById('editor-titulo').textContent = `Editar evento #${evento.id}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function guardarEvento(event) {
    event.preventDefault();

    const id = Number(document.getElementById('evento-id').value);
    const titulo = document.getElementById('evento-titulo').value.trim();
    const fecha = document.getElementById('evento-fecha').value;
    const hora = document.getElementById('evento-hora').value.trim();
    const ubicacion = document.getElementById('evento-ubicacion').value.trim();
    const descripcion = document.getElementById('evento-descripcion').value.trim();
    const categoria = document.getElementById('evento-categoria').value;

    if (!titulo || !fecha || !categoria) {
        mostrarMensaje('Título, fecha y categoría son obligatorios.', 'error');
        return;
    }

    const fechaFormateada = `${fecha}T00:00:00`;
    const fechaObj = new Date(fechaFormateada);
    const mesCorto = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');

    const nuevoEvento = {
        id,
        titulo,
        fecha: fechaFormateada,
        dia: String(fechaObj.getDate()),
        mes: mesCorto.charAt(0).toUpperCase() + mesCorto.slice(1),
        hora: hora || '',
        ubicacion,
        descripcion,
        categoria
    };

    const indiceExistente = eventos.findIndex(item => Number(item.id) === id);
    if (indiceExistente >= 0) {
        eventos[indiceExistente] = nuevoEvento;
    } else {
        eventos.push(nuevoEvento);
    }

    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || Number(a.id) - Number(b.id));

    try {
        await guardarEventosEnServidor();
        renderizarEventos();
        prepararNuevoEvento();
        mostrarMensaje('Evento guardado correctamente.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, 'error');
    }
}

async function eliminarEvento(id) {
    const evento = eventos.find(item => Number(item.id) === id);
    if (!evento) {
        mostrarMensaje('No se encontró el evento seleccionado.', 'error');
        return;
    }

    if (!confirm(`¿Quieres eliminar el evento "${evento.titulo}"?`)) {
        return;
    }

    eventos = eventos.filter(item => Number(item.id) !== id);

    try {
        await guardarEventosEnServidor();
        renderizarEventos();
        prepararNuevoEvento();
        mostrarMensaje('Evento eliminado correctamente.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, 'error');
    }
}

async function guardarEventosEnServidor() {
    const response = await fetch('../api/guardar-eventos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventos })
    });

    const resultado = await response.json();
    if (!response.ok) {
        throw new Error(resultado.details || resultado.error || 'No se pudo guardar el archivo');
    }
}

async function guardarCategoriasEnServidor() {
    const response = await fetch('../api/guardar-categorias.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categorias })
    });

    const resultado = await response.json();
    if (!response.ok) {
        throw new Error(resultado.details || resultado.error || 'No se pudo guardar el archivo de categorías');
    }
}

function mostrarMensaje(texto, tipo) {
    const contenedor = document.getElementById('estado-panel');
    contenedor.textContent = texto;
    contenedor.className = `estado-panel ${tipo}`;
}