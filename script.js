// Funcionalidad principal del sitio
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Inicializar el calendario si estamos en la página de fiestas
        if (document.querySelector('.calendario-grid')) {
            inicializarCalendario();
        }

        // Mostrar eventos solo si no estamos en la página de fiestas y existe el contenedor
        if (!document.querySelector('.calendario-grid') && document.querySelector('.events-container')) {
            await mostrarEventos();
        }

        // Si estamos en la página de eventos del día
        const urlParams = new URLSearchParams(window.location.search);
        const fecha = urlParams.get('fecha');
        if (fecha) {
            document.getElementById('fecha-seleccionada').textContent = 
                new Date(fecha).toLocaleDateString('es', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                });
            await mostrarEventosDia(fecha);
        }
        
        // Funcionalidad para el menú móvil
        configurarMenuMovil();
        
        // Configurar funcionalidad para carteles
        configurarCarteles();
        
    } catch (error) {
        console.error('Error al inicializar las funcionalidades:', error);
    }
});

// Función para configurar el menú móvil
function configurarMenuMovil() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav');
    
    if (!menuToggle || !navMenu) return;
    
    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });
    
    // Cerrar el menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });
    
    // Cerrar el menú al hacer clic fuera
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });
}

// Función para configurar la funcionalidad de los carteles
function configurarCarteles() {
    // Funcionalidad para los carteles (vista ampliada)
    const carteles = document.querySelectorAll('.cartel-item');
    carteles.forEach(cartel => {
        cartel.addEventListener('click', function() {
            mostrarCartelAmpliado(
                this.querySelector('img').src,
                this.querySelector('.cartel-year').textContent
            );
        });
    });
    
    // Funcionalidad para el cartel destacado
    const cartelDestacado = document.querySelector('.cartel-destacado img');
    if (cartelDestacado) {
        cartelDestacado.style.cursor = 'pointer';
        cartelDestacado.addEventListener('click', function() {
            mostrarCartelAmpliado(this.src, '2024');
        });
    }
}

// Función para mostrar un cartel ampliado
function mostrarCartelAmpliado(imgSrc, year) {
    // Crear el elemento de vista ampliada
    const ampliado = document.createElement('div');
    ampliado.className = 'cartel-ampliado';
    
    ampliado.innerHTML = `
        <span class="cerrar">&times;</span>
        <img src="${imgSrc}" alt="Cartel ${year}">
        <div class="year">${year}</div>
    `;
    
    // Añadir al body
    document.body.appendChild(ampliado);
    
    // Mostrar con una pequeña animación
    setTimeout(() => ampliado.classList.add('activo'), 10);
    
    // Prevenir scroll
    document.body.style.overflow = 'hidden';
    
    // Cerrar al hacer clic
    ampliado.addEventListener('click', function(e) {
        if (e.target === ampliado || e.target.className === 'cerrar') {
            cerrarCartelAmpliado(ampliado);
        }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', function escKeyHandler(e) {
        if (e.key === 'Escape' && ampliado.classList.contains('activo')) {
            cerrarCartelAmpliado(ampliado);
            document.removeEventListener('keydown', escKeyHandler);
        }
    });
}

// Función para cerrar un cartel ampliado
function cerrarCartelAmpliado(elemento) {
    elemento.classList.remove('activo');
    document.body.style.overflow = 'auto';
    setTimeout(() => elemento.remove(), 300);
}

// Función para generar el calendario
async function generarCalendario(mes, año) {
    const calendarioGrid = document.querySelector('.calendario-grid');
    const mesActualElement = document.querySelector('.mes-actual');
    
    if (!calendarioGrid || !mesActualElement) {
        console.error('No se encontraron los elementos del calendario');
        return;
    }
    
    // Cargar categorías para marcar en el calendario
    let categorias = [];
    try {
        const response = await fetch('data/categorias.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de categorías');
        }
        const data = await response.json();
        categorias = data.categorias;
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
    
    // Actualizar el título del mes
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    mesActualElement.textContent = `${nombresMeses[mes]} ${año}`;
    
    // Limpiar el calendario
    calendarioGrid.innerHTML = '';
    
    // Añadir los días de la semana
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    diasSemana.forEach(dia => {
        const diaElement = document.createElement('div');
        diaElement.className = 'dia-semana';
        diaElement.textContent = dia;
        calendarioGrid.appendChild(diaElement);
    });
    
    // Obtener el primer día del mes (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const primerDia = new Date(año, mes, 1).getDay();
    // Ajustar para que la semana comience en lunes (0 = Lunes, ..., 6 = Domingo)
    const primerDiaAjustado = primerDia === 0 ? 6 : primerDia - 1;
    
    // Obtener el número de días en el mes
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    
    // Añadir espacios en blanco para los días anteriores al primer día del mes
    for (let i = 0; i < primerDiaAjustado; i++) {
        const espacioVacio = document.createElement('div');
        espacioVacio.className = 'dia vacio';
        calendarioGrid.appendChild(espacioVacio);
    }
    
    // Obtener la fecha actual para marcar el día actual
    const fechaActual = new Date();
    const diaActual = fechaActual.getDate();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    // Añadir los días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const diaElement = document.createElement('div');
        diaElement.className = 'dia';
        diaElement.textContent = dia;
        
        // Marcar el día actual si estamos en el mes y año actual
        if (dia === diaActual && mes === mesActual && año === añoActual) {
            diaElement.classList.add('dia-actual');
        }
        
        // Crear fecha en formato YYYY-MM-DD
        const fechaDia = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verificar si el día pertenece a alguna categoría
        for (const categoria of categorias) {
            if (categoria.dias.includes(fechaDia)) {
                diaElement.classList.add('tiene-evento');
                diaElement.classList.add('categoria-' + categoria.nombre);
                
                // Añadir evento de clic para redirigir a la página de la categoría
                diaElement.addEventListener('click', function() {
                    window.location.href = categoria.pagina;
                });
                
                break; // Salir del bucle una vez que se ha encontrado la categoría
            }
        }
        
        calendarioGrid.appendChild(diaElement);
    }
    
    // Añadir leyenda del calendario si no existe
    generarLeyendaCalendario(categorias);
}

// Función para generar la leyenda del calendario
function generarLeyendaCalendario(categorias) {
    if (!document.querySelector('.calendario-leyenda')) {
        const leyenda = document.createElement('div');
        leyenda.className = 'calendario-leyenda';
        
        let leyendaHTML = '';
        categorias.forEach(categoria => {
            leyendaHTML += `
                <div class="leyenda-item">
                    <span class="leyenda-color" style="background-color: ${categoria.color}"></span>
                    <span>${categoria.titulo}</span>
                </div>
            `;
        });
        
        leyenda.innerHTML = leyendaHTML;
        
        // Añadir la leyenda después del calendario
        const calendarioContainer = document.querySelector('.calendario-eventos');
        if (calendarioContainer) {
            calendarioContainer.appendChild(leyenda);
        }
    }
}

// Función para mostrar los eventos de un día específico
async function mostrarEventosDia(fecha) {
    // Filtrar eventos por fecha
    const eventos = await cargarEventos();
    const eventosDia = eventos.filter(evento => evento.fecha.split('T')[0] === fecha);
    
    if (eventosDia.length > 0) {
        // Hacer scroll hasta la sección de eventos
        document.querySelector('.eventos-section').scrollIntoView({ behavior: 'smooth' });
        
        // Resaltar los eventos del día seleccionado
        const eventosCards = document.querySelectorAll('.event-card');
        eventosCards.forEach(card => {
            card.classList.remove('destacado');
        });
        
        eventosDia.forEach(eventoDia => {
            const eventoCard = document.querySelector(`.event-card[data-id="${eventoDia.id}"]`);
            if (eventoCard) {
                eventoCard.classList.add('destacado');
            }
        });
    }
}

// Función para inicializar el calendario
function inicializarCalendario() {
    const fechaActual = new Date();
    let mesActual = fechaActual.getMonth();
    let añoActual = fechaActual.getFullYear();
    
    // Generar el calendario inicial
    generarCalendario(mesActual, añoActual);
    
    // Configurar los botones de navegación
    const btnMesAnterior = document.querySelector('.btn-mes-anterior');
    const btnMesSiguiente = document.querySelector('.btn-mes-siguiente');
    
    if (btnMesAnterior && btnMesSiguiente) {
        btnMesAnterior.addEventListener('click', function() {
            mesActual--;
            if (mesActual < 0) {
                mesActual = 11;
                añoActual--;
            }
            generarCalendario(mesActual, añoActual);
        });
        
        btnMesSiguiente.addEventListener('click', function() {
            mesActual++;
            if (mesActual > 11) {
                mesActual = 0;
                añoActual++;
            }
            generarCalendario(mesActual, añoActual);
        });
    }
}

// Función para cargar eventos desde el archivo JSON
async function cargarEventos() {
    try {
        const response = await fetch('data/eventos.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de eventos');
        }
        const data = await response.json();
        return data.eventos; // Accedemos a la propiedad "eventos" del objeto JSON
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        return [];
    }
}

// Función para mostrar eventos en la página
async function mostrarEventos() {
    const eventos = await cargarEventos();
    const contenedorEventos = document.querySelector('.events-container');
    
    if (!contenedorEventos) return;
    
    // Limpiar contenedor
    contenedorEventos.innerHTML = '';
    
    if (eventos.length === 0) {
        contenedorEventos.innerHTML = '<p>No hay eventos programados.</p>';
        return;
    }
    
    // Ordenar eventos por fecha
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Mostrar cada evento
    eventos.forEach(evento => {
        const eventoHTML = `
            <div class="event-card" data-category="${evento.categoria}" data-id="${evento.id}">
                <div class="event-date">
                    <span class="day">${evento.dia}</span>
                    <span class="month">${evento.mes}</span>
                </div>
                <div class="event-details">
                    <h3>${evento.titulo}</h3>
                    <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${evento.ubicacion}</p>
                    <p class="event-time"><i class="far fa-clock"></i> ${evento.hora}</p>
                    <p class="event-description">${evento.descripcion}</p>
                </div>
            </div>
        `;
        
        contenedorEventos.innerHTML += eventoHTML;
    });
    
    configurarFiltrosEventos();
}

// Función para configurar los filtros de eventos
function configurarFiltrosEventos() {
    const botonesFiltro = document.querySelectorAll('.filter-btn');
    const tarjetasEventos = document.querySelectorAll('.event-card');
    
    if (botonesFiltro.length) {
        botonesFiltro.forEach(boton => {
            boton.addEventListener('click', function() {
                // Quitar clase activa de todos los botones
                botonesFiltro.forEach(b => b.classList.remove('active'));
                
                // Añadir clase activa al botón clickeado
                this.classList.add('active');
                
                // Obtener categoría a filtrar
                const filtro = this.getAttribute('data-filter');
                
                // Mostrar/ocultar eventos según el filtro
                tarjetasEventos.forEach(tarjeta => {
                    if (filtro === 'all' || tarjeta.getAttribute('data-category') === filtro) {
                        tarjeta.style.display = 'flex';
                    } else {
                        tarjeta.style.display = 'none';
                    }
                });
            });
        });
    }
}

// Función para actualizar los eventos próximos
async function actualizarEventosProximos() {
    try {
        // Obtener eventos
        const eventos = await cargarEventos();
        
        // Filtrar solo eventos futuros
        const fechaActual = new Date();
        const eventosProximos = eventos.filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            return fechaEvento >= fechaActual;
        });
        
        // Ordenar por fecha (más próximos primero)
        eventosProximos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        // Limitar a los 5 eventos más próximos
        const proximosEventos = eventosProximos.slice(0, 5);
        
        // Actualizar el contenedor de eventos próximos si existe
        const contenedorProximos = document.querySelector('.proximos-eventos');
        if (contenedorProximos) {
            if (proximosEventos.length === 0) {
                contenedorProximos.innerHTML = '<p>No hay eventos próximos programados.</p>';
            } else {
                contenedorProximos.innerHTML = proximosEventos.map(evento => `
                    <div class="evento-proximo">
                        <div class="fecha-evento">
                            <span class="dia">${new Date(evento.fecha).getDate()}</span>
                            <span class="mes">${new Date(evento.fecha).toLocaleString('es', {month: 'short'})}</span>
                        </div>
                        <div class="detalles-evento">
                            <h4>${evento.titulo}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${evento.ubicacion}</p>
                            <p><i class="far fa-clock"></i> ${evento.hora}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al actualizar eventos próximos:', error);
    }
}