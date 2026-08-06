/**
 * Script para la administración de campeonatos de Mus, Tute y Parchís
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gestionar las pestañas de administración
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab, .admin-content').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`admin-${tabId}`).classList.add('active');
        });
    });

    // Configurar formularios y botones
    ['mus', 'tute', 'parchis'].forEach(tipo => {
        document.getElementById(`form-parejas-${tipo}`).addEventListener('submit', (e) => {
            e.preventDefault();
            añadirPareja(tipo);
        });
        
        document.getElementById(`crear-campeonato-${tipo}`).addEventListener('click', () => {
            crearCampeonato(tipo);
        });
    });

    // Cargar datos iniciales
    cargarDatosCampeonatos();
});

/**
 * Carga y configura los datos de campeonatos desde Firebase
 */
function cargarDatosCampeonatos() {
    const campeonatosRef = database.ref('campeonatos');
    
    // Listener principal para cambios en los datos
    campeonatosRef.on('value', (snapshot) => {
        const data = snapshot.val() || initializeData();
        
        // Asegurar que existen todas las estructuras necesarias
        ['mus', 'tute', 'parchis'].forEach(tipo => {
            if (!data.parejas[tipo]) data.parejas[tipo] = {};
            if (!data.datos[tipo]) data.datos[tipo] = {};
            
            cargarParejas(tipo, data.parejas[tipo]);
            cargarPartidas(tipo, data);
        });
    });
}

/**
 * Inicializa la estructura de datos básica
 */
function initializeData() {
    const data = {
        parejas: { mus: {}, tute: {}, parchis: {} },
        datos: { mus: {}, tute: {}, parchis: {} }
    };
    
    database.ref('campeonatos').set(data)
        .then(() => console.log('Estructura inicial creada'))
        .catch(error => console.error('Error al crear estructura:', error));
    
    return data;
}

/**
 * Carga las parejas en la tabla correspondiente
 */
function cargarParejas(tipo, parejas) {
    const tabla = document.getElementById(`tabla-parejas-${tipo}`).querySelector('tbody');
    
    if (!parejas || Object.keys(parejas).length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4">
                    No hay parejas registradas
                </td>
            </tr>
        `;
        return;
    }
    
    tabla.innerHTML = Object.entries(parejas)
        .map(([numero, pareja]) => `
            <tr>
                <td>${numero}</td>
                <td>${pareja.nombre1}</td>
                <td>${pareja.nombre2}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarPareja('${tipo}', ${numero})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
}

/**
 * Carga las partidas en el contenedor correspondiente
 */
function cargarPartidas(tipo, data) {
    const contenedor = document.getElementById(`partidas-${tipo}`);
    const campeonato = data.datos[tipo];
    const parejas = data.parejas[tipo] || {};
    
    if (!campeonato || Object.keys(campeonato).length === 0) {
        contenedor.innerHTML = `
            <div class="text-center p-4">
                No hay partidas configuradas
                <div class="mt-3">
                    <button id="crear-campeonato-${tipo}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Crear Campeonato
                    </button>
                </div>
            </div>
        `;
        
        // Añadir event listener para crear campeonato
        document.getElementById(`crear-campeonato-${tipo}`).addEventListener('click', function() {
            crearCampeonato(tipo);
        });
        
        return;
    }
    
    // Generar HTML con la estructura original
    let html = `
        <div class="mb-3">
                    <button id="generar-pdf-${tipo}" class="btn btn-success">                    <i class="fas fa-file-pdf"></i> Generar PDF                </button>
                    <button id="generar-excel-arbol-${tipo}" class="btn btn-success">                    <i class="fas fa-file-excel"></i> Excel Árbol                </button>
        </div>
    `;
    
    // Ordenar las rondas por número
    const rondas = Object.keys(campeonato).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Para cada ronda
    rondas.forEach(ronda => {
        const partidasRonda = campeonato[ronda];
        const nombreRonda = getNombreRonda(ronda, rondas.length);
        
        html += `
            <div class="ronda-container" data-ronda="${ronda}">
                <h3>${nombreRonda}</h3>
        `;
        
        // Para cada partido de la ronda
        partidasRonda.forEach((partido, index) => {
            const pareja1 = partido.p1 !== null ? parejas[partido.p1] : null;
            const pareja2 = partido.p2 !== null ? parejas[partido.p2] : null;
            
            html += `
                <div class="match-row" data-ronda="${ronda}" data-partido="${index}">
                    <div class="match-info">
                        <div class="match-status estado-badge estado-${partido.estado}">${getEstadoTexto(partido.estado)}</div>
                        <div class="match-teams">
                            <div>
                                Pareja 1: 
                                ${partido.p1 !== null ? 
                                    `#${partido.p1} - ${pareja1 ? pareja1.nombre1 + ' / ' + pareja1.nombre2 : 'Por definir'}` : 
                                    'Por definir'}
                                ${partido.ganador === 'p1' ? ' <i class="fas fa-crown" style="color: gold;"></i>' : ''}
                            </div>
                            <div>
                                Pareja 2: 
                                ${partido.p2 !== null ? 
                                    `#${partido.p2} - ${pareja2 ? pareja2.nombre1 + ' / ' + pareja2.nombre2 : 'Por definir'}` : 
                                    'Por definir'}
                                ${partido.ganador === 'p2' ? ' <i class="fas fa-crown" style="color: gold;"></i>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="btn btn-primary editar-partido" data-tipo="${tipo}" data-ronda="${ronda}" data-partido="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    contenedor.innerHTML = html;
    
    // Añadir event listeners    
    document.getElementById(`generar-pdf-${tipo}`).addEventListener('click', function() {
        database.ref(`campeonatos/datos/${tipo}`).once('value')
            .then(snapshot => {
                const rondas = snapshot.val();
                database.ref(`campeonatos/parejas/${tipo}`).once('value')
                    .then(snapshotParejas => {
                        generarPDFCampeonato(tipo, rondas, snapshotParejas.val() || {});
                    });
            });
    });
    
    document.getElementById(`generar-excel-arbol-${tipo}`).addEventListener('click', function() {
        console.log(`Click en botón Excel Árbol para ${tipo}`);
        try {
            // Verificar que XLSX esté disponible
            if (typeof XLSX === 'undefined') {
                mostrarError('La biblioteca Excel no está disponible. Recargando la página...');
                setTimeout(() => {
                    location.reload();
                }, 1000);
                return;
            }
            
            database.ref(`campeonatos/datos/${tipo}`).once('value')
                .then(snapshot => {
                    const rondas = snapshot.val();
                    if (rondas && Object.keys(rondas).length > 0) {
                        generarExcelArbol(tipo, rondas);
                    } else {
                        mostrarError('No hay datos de campeonato disponibles');
                    }
                })
                .catch(error => {
                    console.error('Error al obtener datos para Excel:', error);
                    mostrarError('Error al generar Excel: ' + error.message);
                });
        } catch (error) {
            console.error('Error en evento click Excel:', error);
            mostrarError('Error inesperado: ' + error.message);
        }
    });
    
    document.querySelectorAll(`.editar-partido[data-tipo="${tipo}"]`).forEach(btn => {
        btn.addEventListener('click', function() {
            const ronda = this.getAttribute('data-ronda');
            const partidoIndex = this.getAttribute('data-partido');
            editarPartido(tipo, ronda, partidoIndex);
        });
    });
}

/**
 * Añade una nueva pareja al campeonato
 */
function añadirPareja(tipo) {
    const form = document.getElementById(`form-parejas-${tipo}`);
    const numeroInput = form.querySelector('[name="numero"]').value.trim();
    const nombre1 = form.querySelector('[name="nombre1"]').value.trim();
    const nombre2 = form.querySelector('[name="nombre2"]').value.trim();
    
    if (!numeroInput || !nombre1 || !nombre2) {
        mostrarError('Por favor, introduce el número de pareja y los nombres de ambos jugadores');
        return;
    }
    
    // Convertir a número entero
    const numero = parseInt(numeroInput);
    
    // Verificar que sea un número válido
    if (isNaN(numero) || numero <= 0) {
        mostrarError('El número de pareja debe ser un valor numérico positivo');
        return;
    }
    
    // Verificar si ya existe una pareja con ese número
    database.ref(`campeonatos/parejas/${tipo}/${numero}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                if (!confirm(`Ya existe una pareja con el número ${numero}. ¿Deseas sobrescribirla?`)) {
                    return Promise.reject(new Error('Operación cancelada por el usuario'));
                }
            }
            
            // Guardar la pareja con el número especificado
            return database.ref(`campeonatos/parejas/${tipo}/${numero}`).set({
                nombre1,
                nombre2
            });
        })
        .then(() => {
            form.reset();
            // Cargar las parejas actualizadas inmediatamente
            database.ref(`campeonatos/parejas/${tipo}`).once('value')
                .then(snapshot => {
                    const parejas = snapshot.val() || {};
                    cargarParejas(tipo, parejas);
                });
            mostrarExito('Pareja añadida correctamente');
        })
        .catch(error => {
            if (error.message !== 'Operación cancelada por el usuario') {
                mostrarError('Error al añadir la pareja: ' + error.message);
            }
        });
}

/**
 * Elimina una pareja del campeonato
 */
function eliminarPareja(tipo, numero) {
    // Eliminamos sin preguntar
    database.ref(`campeonatos/parejas/${tipo}/${numero}`).remove()
        .then(() => {
            // Cargar las parejas actualizadas inmediatamente
            database.ref(`campeonatos/parejas/${tipo}`).once('value')
                .then(snapshot => {
                    const parejas = snapshot.val() || {};
                    cargarParejas(tipo, parejas);
                });
            mostrarExito('Pareja eliminada correctamente');
        })
        .catch(error => mostrarError('Error al eliminar la pareja: ' + error.message));
}

/**
 * Genera un número aleatorio entre min y max (inclusive)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mezcla un array de forma aleatoria (algoritmo Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Calcula el número de rondas necesarias basado en el número de parejas
 */
function calcularNumeroRondas(numParejas) {
    return Math.ceil(Math.log2(Math.max(numParejas, 2)));
}

/**
 * Crea un nuevo campeonato
 */
function crearCampeonato(tipo) {
    console.log('Iniciando creación de campeonato de', tipo);
    
    // Solicitar confirmación antes de crear el campeonato
    if (!confirm(`¿Estás seguro que deseas crear un nuevo campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}?`)) {
        console.log('Creación de campeonato cancelada por el usuario');
        return;
    }
    
    // Obtener las parejas actuales
    database.ref(`campeonatos/parejas/${tipo}`).once('value')
        .then(snapshot => {
            const parejas = snapshot.val() || {};
            console.log('Parejas obtenidas:', parejas);
            
            if (!parejas || Object.keys(parejas).length < 2) {
                throw new Error('Se necesitan al menos 2 parejas para crear un campeonato');
            }
            
            // Comprobar si ya existe un campeonato
            return database.ref(`campeonatos/datos/${tipo}`).once('value')
                .then(snapshot => {
                    const campeonatoExistente = snapshot.val();
                    console.log('Campeonato existente:', campeonatoExistente);
                    
                    if (snapshot.exists() && Object.keys(snapshot.val()).length > 0) {
                        // Ya no preguntamos, procedemos automáticamente
                        console.log(`Ya existe un campeonato de ${tipo}. Se reiniciará con nuevos emparejamientos.`);
                        return Promise.resolve();
                    }
                })
                .then(() => {
                    // Generar emparejamientos aleatorios
                    console.log('Generando emparejamientos...');
                    const rondasGeneradas = generarEmparejamientos(parejas);
                    console.log('Emparejamientos generados:', rondasGeneradas);
                    
                    // Procesar las rondas generadas para asegurarnos de que no haya undefined como string
                    for (const ronda in rondasGeneradas) {
                        if (rondasGeneradas.hasOwnProperty(ronda)) {
                            rondasGeneradas[ronda] = rondasGeneradas[ronda].map(partido => {
                                // Convertir "undefined" (string) a null
                                if (partido.p1 === "undefined") partido.p1 = null;
                                if (partido.p2 === "undefined") partido.p2 = null;
                                return partido;
                            });
                        }
                    }
                    
                    // Guardar el campeonato en Firebase
                    console.log('Guardando en Firebase...');
                    return database.ref(`campeonatos/datos/${tipo}`).set(rondasGeneradas)
                        .then(() => {
                            console.log('Campeonato guardado exitosamente');
                            // Solo log de consola, sin alerta
                            console.log(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente con emparejamientos aleatorios`);
                            
                            // Ya no mostramos resumen de emparejamientos
                            // Recargar partidas con los datos actualizados
                            database.ref('campeonatos').once('value').then(snapshot => {
                                const dataActualizada = snapshot.val();
                                if (dataActualizada) {
                                    cargarPartidas(tipo, dataActualizada);
                                }
                            });
                        });
                });
        })
        .catch(error => {
            console.error('Error en crearCampeonato:', error);
            mostrarError(error.message);
        });
}

/**
 * Genera los emparejamientos para un campeonato
 */
function generarEmparejamientos(parejas) {
    console.log('Iniciando generación de emparejamientos con parejas:', parejas);
    
    // Convertir las parejas en un array y mezclarlo
    const parejasArray = Object.keys(parejas).map(Number);
    const numParejas = parejasArray.length;
    
    console.log('Número de parejas:', numParejas);
    
    if (numParejas < 2) {
        throw new Error('Se necesitan al menos 2 parejas para crear un campeonato');
    }
    
    // Mezclar las parejas aleatoriamente
    const parejasMezcladas = shuffleArray([...parejasArray]);
    console.log('Parejas mezcladas:', parejasMezcladas);
    
    // Estructura para almacenar las rondas
    const rondas = {};

    const crearPartido = (p1 = null, p2 = null) => ({
        p1,
        p2,
        estado: "pendiente",
        ganador: null
    });

    const esPotenciaDeDos = (n) => n > 0 && (n & (n - 1)) === 0;

    if (esPotenciaDeDos(numParejas)) {
        console.log('Creando primera ronda sin preliminares');
        rondas["1"] = [];

        for (let i = 0; i < parejasMezcladas.length; i += 2) {
            rondas["1"].push(crearPartido(Number(parejasMezcladas[i]), Number(parejasMezcladas[i + 1])));
        }
    } else {
        console.log('Creando ronda preliminar y cuadro principal equilibrado');

        // Potencia de 2 inmediatamente inferior: tamaño objetivo tras preliminares.
        const baseEquipos = Math.pow(2, Math.floor(Math.log2(numParejas)));
        const numPartidosPreliminar = numParejas - baseEquipos;
        const equiposEnPreliminar = numPartidosPreliminar * 2;

        const preliminares = parejasMezcladas.slice(0, equiposEnPreliminar).map(Number);
        const directos = parejasMezcladas.slice(equiposEnPreliminar).map(Number);

        console.log('Base del cuadro tras preliminar:', baseEquipos);
        console.log('Partidos preliminar:', numPartidosPreliminar);
        console.log('Parejas en preliminar:', preliminares);
        console.log('Parejas directas:', directos);

        rondas["0"] = [];
        for (let i = 0; i < preliminares.length; i += 2) {
            rondas["0"].push(crearPartido(preliminares[i], preliminares[i + 1]));
        }

        // En la ronda 1 deben quedar exactamente baseEquipos participantes.
        // Orden visual solicitado:
        // 1) Arriba del todo: ganador preliminar vs ganador preliminar
        // 2) Si sobra uno de preliminar: ganador preliminar vs directo
        // 3) Después: directos entre sí
        const placeholders = Array.from({ length: numPartidosPreliminar }, (_, prelimIndex) => ({
            esPlaceholder: true,
            prelimIndex
        }));

        rondas["1"] = [];

        let idxPlaceholder = 0;
        let idxDirecto = 0;

        const tomarPlaceholder = () => placeholders[idxPlaceholder++] || null;
        const tomarDirecto = () => {
            const valor = directos[idxDirecto++];
            return Number.isInteger(valor) ? valor : null;
        };

        const crearPartidoRonda1 = (entrada1, entrada2) => {
            const partidoIndex = rondas["1"].length;
            const p1 = typeof entrada1 === 'number' ? entrada1 : null;
            const p2 = typeof entrada2 === 'number' ? entrada2 : null;
            rondas["1"].push(crearPartido(p1, p2));

            if (entrada1 && typeof entrada1 === 'object' && entrada1.esPlaceholder) {
                rondas["0"][entrada1.prelimIndex].destino = {
                    ronda: "1",
                    partido: partidoIndex,
                    posicion: "p1"
                };
            }

            if (entrada2 && typeof entrada2 === 'object' && entrada2.esPlaceholder) {
                rondas["0"][entrada2.prelimIndex].destino = {
                    ronda: "1",
                    partido: partidoIndex,
                    posicion: "p2"
                };
            }
        };

        // 1) Emparejar preliminares entre sí en la parte alta.
        const partidosPreliminarEntreSi = Math.floor(numPartidosPreliminar / 2);
        for (let i = 0; i < partidosPreliminarEntreSi; i++) {
            crearPartidoRonda1(tomarPlaceholder(), tomarPlaceholder());
        }

        // 2) Si sobra un ganador de preliminar, se cruza con un directo.
        if (numPartidosPreliminar % 2 === 1) {
            crearPartidoRonda1(tomarPlaceholder(), tomarDirecto());
        }

        // 3) Completar con directos entre sí.
        while (idxDirecto < directos.length) {
            crearPartidoRonda1(tomarDirecto(), tomarDirecto());
        }

        // Seguridad: completar con partidos vacíos solo si hay algún desajuste.
        const partidosEsperadosRonda1 = baseEquipos / 2;
        while (rondas["1"].length < partidosEsperadosRonda1) {
            crearPartidoRonda1(null, null);
        }
    }

    // Crear rondas siguientes hasta dejar solo una final.
    let rondaActual = 2;
    let numPartidosRondaAnterior = rondas["1"].length;

    while (numPartidosRondaAnterior > 1) {
        const numPartidosRondaActual = Math.ceil(numPartidosRondaAnterior / 2);
        rondas[String(rondaActual)] = [];

        for (let i = 0; i < numPartidosRondaActual; i++) {
            rondas[String(rondaActual)].push(crearPartido());
        }

        numPartidosRondaAnterior = numPartidosRondaActual;
        rondaActual++;
    }

    // Añadir destino explícito para todos los partidos que no lo tengan.
    const rondasOrdenadas = Object.keys(rondas).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    for (let i = 0; i < rondasOrdenadas.length - 1; i++) {
        const ronda = rondasOrdenadas[i];
        const siguienteRonda = rondasOrdenadas[i + 1];
        const partidosRonda = rondas[ronda];
        const partidosSiguiente = rondas[siguienteRonda];

        partidosRonda.forEach((partido, index) => {
            if (partido.destino) {
                return;
            }

            const destinoPartido = Math.floor(index / 2);
            if (!partidosSiguiente[destinoPartido]) {
                return;
            }

            partido.destino = {
                ronda: siguienteRonda,
                partido: destinoPartido,
                posicion: index % 2 === 1 ? 'p2' : 'p1'
            };
        });
    }
    
    console.log('Estructura final de rondas:', rondas);
    return rondas;
}

/**
 * Abre un modal para editar un partido
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} ronda - Número de ronda
 * @param {number} partidoIndex - Índice del partido en la ronda
 */
function editarPartido(tipo, ronda, partidoIndex) {
    console.log(`Editando partido: tipo=${tipo}, ronda=${ronda}, partido=${partidoIndex}`);
    
    // Cargar datos actuales
    Promise.all([
        database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}`).once('value'),
        database.ref(`campeonatos/parejas/${tipo}`).once('value')
    ])
    .then(([partidoSnapshot, parejasSnapshot]) => {
        const partido = partidoSnapshot.val();
        const parejas = parejasSnapshot.val() || {};
        
        console.log('Datos del partido:', partido);
        console.log('Parejas disponibles:', parejas);
        
        // Crear el HTML del modal
        const modalHTML = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background-color: #fff; border-radius: 8px; padding: 20px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <h3>Editar Partido</h3>
                    <div class="form-group">
                        <label for="edit-p1">Pareja 1</label>
                        <select id="edit-p1" class="form-control">
                            <option value="">-- Seleccionar --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-p2">Pareja 2</label>
                        <select id="edit-p2" class="form-control">
                            <option value="">-- Seleccionar --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-estado">Estado</label>
                        <select id="edit-estado" class="form-control">
                            <option value="pendiente">Pendiente</option>
                            <option value="jugando">En juego</option>
                            <option value="completado">Completado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-ganador">Ganador</label>
                        <select id="edit-ganador" class="form-control">
                            <option value="">Sin ganador</option>
                            <option value="p1">Pareja 1</option>
                            <option value="p2">Pareja 2</option>
                        </select>
                    </div>
                    <div class="form-actions" style="display: flex; justify-content: space-between; margin-top: 20px;">
                        <button id="btn-cancelar" class="btn btn-danger">Cancelar</button>
                        <button id="btn-guardar" class="btn btn-primary">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir el modal al DOM
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement);
        
        // Obtener referencias a los selectores
        const p1Select = document.getElementById('edit-p1');
        const p2Select = document.getElementById('edit-p2');
        const estadoSelect = document.getElementById('edit-estado');
        const ganadorSelect = document.getElementById('edit-ganador');
        
        // Llenar los selectores de parejas
        for (const numero in parejas) {
            const pareja = parejas[numero];
            if (pareja && pareja.nombre1 && pareja.nombre2) {
                // Crear opciones para pareja 1
                const opcionP1 = document.createElement('option');
                opcionP1.value = numero;
                opcionP1.textContent = `#${numero} - ${pareja.nombre1} / ${pareja.nombre2}`;
                p1Select.appendChild(opcionP1);
                
                // Crear opciones para pareja 2
                const opcionP2 = document.createElement('option');
                opcionP2.value = numero;
                opcionP2.textContent = `#${numero} - ${pareja.nombre1} / ${pareja.nombre2}`;
                p2Select.appendChild(opcionP2);
            }
        }
        
        // Establecer los valores actuales
        if (partido.p1 !== null && partido.p1 !== undefined) {
            console.log('Estableciendo pareja 1:', partido.p1);
            p1Select.value = String(partido.p1);
        }
        
        if (partido.p2 !== null && partido.p2 !== undefined) {
            console.log('Estableciendo pareja 2:', partido.p2);
            p2Select.value = String(partido.p2);
        }
        
        estadoSelect.value = partido.estado || 'pendiente';
        
        if (partido.ganador) {
            ganadorSelect.value = partido.ganador;
        }
        
        // Configurar los botones
        document.getElementById('btn-cancelar').addEventListener('click', () => {
            document.body.removeChild(modalElement);
        });
        
        document.getElementById('btn-guardar').addEventListener('click', () => {
            // Obtener los valores actualizados
            const p1Value = p1Select.value ? Number(p1Select.value) : null;
            const p2Value = p2Select.value ? Number(p2Select.value) : null;
            const estadoValue = estadoSelect.value;
            const ganadorValue = ganadorSelect.value || null;
            
            console.log('Guardando con valores:', {
                p1: p1Value,
                p2: p2Value,
                estado: estadoValue,
                ganador: ganadorValue
            });
            
            // Actualizar los datos del partido
            const actualizaciones = {
                p1: p1Value,
                p2: p2Value,
                estado: estadoValue,
                ganador: ganadorValue
            };
            
            const ganadorId = (ganadorValue && estadoValue === 'completado')
                ? (ganadorValue === 'p1' ? p1Value : p2Value)
                : null;

            // Guardar los datos actualizados
            database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}`).update(actualizaciones)
                .then(() => {
                    // Cerrar el modal
                    document.body.removeChild(modalElement);

                    return sincronizarSiguienteRonda(tipo, ronda, partidoIndex, ganadorId);
                })
                .then(() => {
                    // Recargar los datos
                    database.ref('campeonatos').once('value')
                        .then(snapshot => {
                            const data = snapshot.val();
                            if (data) {
                                cargarPartidas(tipo, data);
                            }
                        });
                    
                    mostrarExito('Partido actualizado correctamente');
                })
                .catch(error => {
                    console.error('Error al actualizar el partido:', error);
                    mostrarError('Error al actualizar el partido: ' + error.message);
                });
        });
    })
    .catch(error => {
        console.error('Error al cargar datos para editar partido:', error);
        mostrarError('Error al cargar datos: ' + error.message);
    });
}

/**
 * Obtiene la casilla exacta de la siguiente ronda que depende de un partido.
 */
function obtenerDestinoSiguienteRonda(campeonato, rondaActual, partidoIndex) {
    const partidoNum = parseInt(partidoIndex, 10);
    const rondaNum = parseInt(rondaActual, 10);
    const rondaPartidos = campeonato[String(rondaActual)];
    const partidoActual = Array.isArray(rondaPartidos) ? rondaPartidos[partidoNum] : null;

    if (partidoActual && partidoActual.destino) {
        const destino = partidoActual.destino;
        const destinoRonda = String(destino.ronda);
        const destinoPartido = parseInt(destino.partido, 10);
        const destinoPosicion = destino.posicion === 'p2' ? 'p2' : 'p1';
        const rondaDestinoPartidos = campeonato[destinoRonda];

        if (Array.isArray(rondaDestinoPartidos) && rondaDestinoPartidos[destinoPartido]) {
            return {
                ronda: destinoRonda,
                partidoIndex: destinoPartido,
                posicion: destinoPosicion
            };
        }
    }

    const siguienteRonda = String(rondaNum + 1);
    const rondaSiguientePartidos = campeonato[siguienteRonda];

    if (!Array.isArray(rondaSiguientePartidos) || rondaSiguientePartidos.length === 0) {
        return null;
    }

    // En ronda preliminar (0), cada partido alimenta p1 del partido equivalente en ronda 1.
    if (rondaNum === 0 && partidoNum < rondaSiguientePartidos.length) {
        return {
            ronda: siguienteRonda,
            partidoIndex: partidoNum,
            posicion: 'p1'
        };
    }

    const siguientePartidoIndex = Math.floor(partidoNum / 2);
    if (!rondaSiguientePartidos[siguientePartidoIndex]) {
        return null;
    }

    return {
        ronda: siguienteRonda,
        partidoIndex: siguientePartidoIndex,
        posicion: partidoNum % 2 === 1 ? 'p2' : 'p1'
    };
}

/**
 * Sincroniza el avance del ganador (o limpia casilla) en la siguiente ronda.
 */
function sincronizarSiguienteRonda(tipo, rondaActual, partidoIndex, ganadorId) {
    return database.ref(`campeonatos/datos/${tipo}`).once('value')
        .then(snapshot => {
            const campeonato = snapshot.val() || {};
            const destino = obtenerDestinoSiguienteRonda(campeonato, rondaActual, partidoIndex);

            if (!destino) {
                return null;
            }

            const valor = Number.isInteger(ganadorId) ? ganadorId : null;

            return database.ref(`campeonatos/datos/${tipo}/${destino.ronda}/${destino.partidoIndex}`)
                .update({ [destino.posicion]: valor })
                .then(() => {
                    if (valor === null) {
                        console.log(`Casilla ${destino.posicion} de ronda ${destino.ronda}, partido ${destino.partidoIndex} limpiada`);
                    } else {
                        console.log(`Pareja #${valor} avanzada a ronda ${destino.ronda}, partido ${destino.partidoIndex}, ${destino.posicion}`);
                    }
                });
        });
}

/**
 * Actualiza la siguiente ronda después de completar un partido
 */
function actualizarSiguienteRonda(tipo, rondaActual, partidoIndex) {
    database.ref(`campeonatos/datos/${tipo}`).once('value')
        .then(snapshot => {
            const campeonato = snapshot.val() || {};
            const rondaPartidos = campeonato[rondaActual];

            if (!Array.isArray(rondaPartidos)) return null;

            const partido = rondaPartidos[partidoIndex];

            if (!partido) return null;

            const ganadorId = partido.ganador ? (partido.ganador === 'p1' ? partido.p1 : partido.p2) : null;
            return sincronizarSiguienteRonda(tipo, rondaActual, partidoIndex, ganadorId);
        })
        .then(() => {
            console.log('Siguiente ronda actualizada correctamente');
        })
        .catch(error => console.error('Error al actualizar siguiente ronda:', error));
}

/**
 * Reinicia un campeonato eliminando todos sus datos
 */
function reiniciarCampeonato(tipo) {
    database.ref(`campeonatos/datos/${tipo}`).set({})
        .then(() => mostrarExito(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} reiniciado correctamente`))
        .catch(error => mostrarError('Error al reiniciar el campeonato: ' + error.message));
}

/**
 * Muestra un resumen de los emparejamientos generados
 */
function mostrarResumenEmparejamientos(tipo, parejas) {
    // Función ahora vacía para evitar alertas adicionales
    console.log(`Emparejamientos generados para ${tipo}`);
}

/**
 * Devuelve el nombre de la ronda según su número
 */
function getNombreRonda(ronda, totalRondas) {
    return `Ronda ${ronda}`;
}

/**
 * Devuelve el texto del estado según el estado de la partida
 */
function getEstadoTexto(estado) {
    switch(estado) {
        case 'pendiente': return 'Pendiente';
        case 'jugando': return 'En juego';
        case 'completado': return 'Completado';
        default: return 'Pendiente';
    }
}

/**
 * Genera un PDF con el cuadro del campeonato y listado de parejas
 */
function generarPDFCampeonato(tipo, rondas, parejas) {
    // Verificar si la biblioteca jsPDF está disponible
    if (typeof jspdf === 'undefined') {
        // Si no está disponible, cargarla dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            // Cargar AutoTable como complemento para tablas
            const scriptAutoTable = document.createElement('script');
            scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
            scriptAutoTable.onload = function() {
                generarPDF(tipo, rondas, parejas);
            };
            document.head.appendChild(scriptAutoTable);
        };
        document.head.appendChild(script);
    } else {
        // Si ya está disponible, generar directamente
        generarPDF(tipo, rondas, parejas);
    }
}

/**
 * Función interna para generar el PDF
 */
function generarPDF(tipo, rondas, parejas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait'); // Formato vertical
    
    // Configuración básica
    const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const titulo = `Campeonato de ${tipoCapitalizado} - Peña El Cuervo`;
    const fecha = new Date().toLocaleDateString('es-ES');
    
    // Configuración de la página
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(titulo, 105, 15, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 105, 22, { align: 'center' });
    
    // Generar listado de parejas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Listado de Parejas", 105, 35, { align: 'center' });
    
    // Preparar datos para la tabla de parejas
    const parejasData = [];
    for (const numero in parejas) {
        const pareja = parejas[numero];
        if (pareja && pareja.nombre1 && pareja.nombre2) {
            parejasData.push([numero, `${pareja.nombre1}`, `${pareja.nombre2}`]);
        }
    }
    
    // Generar tabla de parejas en la primera página
    doc.autoTable({
        startY: 40,
        head: [['Núm.', 'Jugador 1', 'Jugador 2']],
        body: parejasData,
        headStyles: { fillColor: [80, 80, 80] },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 80 },
            2: { cellWidth: 80 }
        },
        margin: { top: 40, right: 14, bottom: 20, left: 14 },
        didDrawPage: function(data) {
            // Encabezado en cada página de la tabla
            doc.setFontSize(10);
            doc.text(`Campeonato de ${tipoCapitalizado} - Peña El Cuervo`, 105, 10, { align: 'center' });
        }
    });
    
    // Pie de página en cada página
    let paginaActual = doc.internal.getNumberOfPages();
    for (let i = 1; i <= paginaActual; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Campeonato organizado por la Peña El Cuervo", 105, 285, { align: 'center' });
        doc.text(`Página ${i} de ${paginaActual}`, 195, 285, { align: 'right' });
    }
    
    // Guardar el PDF
    doc.save(`parejas_${tipo}_${fecha.replace(/\//g, '-')}.pdf`);
    
    mostrarExito('PDF con listado de parejas generado correctamente. Descarga iniciada.');
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
    console.error('Error:', mensaje);
}

/**
 * Muestra un mensaje de éxito
 */
function mostrarExito(mensaje) {
    console.log('Éxito:', mensaje);
}

/**
 * Genera un Excel con el árbol del campeonato según diseño solicitado
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {Object} rondas - Datos de las rondas y partidos
 */
function generarExcelArbol(tipo, rondas) {
    console.log("Generando Excel para", tipo, "con rondas:", rondas);

    const wb = XLSX.utils.book_new();
    const ws = {};

    const rondasOrdenadas = Object.keys(rondas).sort((a, b) => parseInt(a) - parseInt(b));
    const numRondas = rondasOrdenadas.length;

    // Generar las posiciones iniciales: 1, 2, 4, 8, ...
    const primerasFilas = [];
    for (let i = 0; i < numRondas + 1; i++) { // +1 para la columna extra
        primerasFilas.push(Math.pow(2, i));
    }

    // Separaciones entre partidos por ronda: 1, 3, 7, 15, ...
    function calcularSeparacion(ronda) {
        return Math.pow(2, ronda + 1) - 1;
    }

    const separaciones = [];
    for (let i = 0; i < numRondas; i++) {
        separaciones[i] = calcularSeparacion(i);
    }

    let minRow = 100000, maxRow = 0, minCol = 100000, maxCol = 0;

    rondasOrdenadas.forEach((rondaKey, i) => {
        const partidosOriginal = rondas[rondaKey] || [];
        const partidosDuplicados = partidosOriginal.concat(partidosOriginal); // duplicamos la info
        const colBase = i * 2;

        const filaInicial = primerasFilas[i];
        const espaciado = separaciones[i];

        for (let p = 0; p < partidosDuplicados.length; p++) {
            const fila = filaInicial + p * (espaciado + 1);
            const cell = XLSX.utils.encode_cell({ r: fila, c: colBase });

            ws[cell] = {
                v: '', // O partidosDuplicados[p] si quieres mostrar texto
                t: 's',
                s: {
                    border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } }
                    }
                }
            };

            minRow = Math.min(minRow, fila);
            maxRow = Math.max(maxRow, fila);
            minCol = Math.min(minCol, colBase);
            maxCol = Math.max(maxCol, colBase);
        }
    });

    // Añadir columna extra con una única celda siguiendo la serie de primerasFilas
    const colExtra = numRondas * 2;
    const filaExtra = primerasFilas[numRondas]; // sigue la serie

    const cellExtra = XLSX.utils.encode_cell({ r: filaExtra, c: colExtra });

    ws[cellExtra] = {
        v: '', // puedes poner un texto aquí si quieres
        t: 's',
        s: {
            border: {
                top: { style: 'thin', color: { rgb: "000000" } },
                bottom: { style: 'thin', color: { rgb: "000000" } },
                left: { style: 'thin', color: { rgb: "000000" } },
                right: { style: 'thin', color: { rgb: "000000" } }
            }
        }
    };

    minRow = Math.min(minRow, filaExtra);
    maxRow = Math.max(maxRow, filaExtra);
    minCol = Math.min(minCol, colExtra);
    maxCol = Math.max(maxCol, colExtra);

    // Establecer rango visible
    ws['!ref'] = XLSX.utils.encode_range({
        s: { c: minCol, r: minRow },
        e: { c: maxCol, r: maxRow }
    });

    // Columnas pequeñas (solo para número)
    ws['!cols'] = Array(numRondas * 2 + 1).fill({ wch: 10 });

    XLSX.utils.book_append_sheet(wb, ws, "Árbol de Torneo");
    XLSX.writeFile(wb, `arbol_torneo_${tipo}.xlsx`);

    console.log("Excel generado y guardado correctamente");
    mostrarExito("Excel con árbol generado correctamente");
}






