/**
 * Script para la administración de campeonatos de Mus, Tute y Parchís
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gestionar las pestañas de administración
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Desactivar todas las pestañas y contenidos
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            
            // Activar la pestaña y contenido seleccionados
            tab.classList.add('active');
            document.getElementById(`admin-${tabId}`).classList.add('active');
        });
    });

    // Cargar datos de campeonatos
    cargarDatosCampeonatos();

    // Configurar formularios para añadir parejas
    document.getElementById('form-parejas-mus').addEventListener('submit', (e) => {
        e.preventDefault();
        añadirPareja('mus');
    });

    document.getElementById('form-parejas-tute').addEventListener('submit', (e) => {
        e.preventDefault();
        añadirPareja('tute');
    });

    document.getElementById('form-parejas-parchis').addEventListener('submit', (e) => {
        e.preventDefault();
        añadirPareja('parchis');
    });
});

/**
 * Carga los datos de campeonatos desde Firebase
 */
function cargarDatosCampeonatos() {
    const campeonatosRef = database.ref('campeonatos');
    
    campeonatosRef.on('value', (snapshot) => {
        console.log('Datos cargados desde Firebase:', snapshot.val());
        
        // Si no hay datos, inicializar la estructura
        if (!snapshot.exists()) {
            console.log('Inicializando estructura de datos en Firebase');
            // Crear la estructura básica
            const datosIniciales = {
                parejas: {
                    mus: {},
                    tute: {},
                    parchis: {}
                },
                datos: {
                    mus: {},
                    tute: {},
                    parchis: {}
                }
            };
            
            database.ref('campeonatos').set(datosIniciales)
                .then(() => {
                    console.log('Estructura inicial creada en Firebase');
                    return;
                })
                .catch(error => {
                    console.error('Error al crear estructura inicial:', error);
                });
            
            return;
        }
        
        const data = snapshot.val();
        
        // Asegurarse de que todas las estructuras necesarias existen
        if (!data.parejas) data.parejas = { mus: {}, tute: {}, parchis: {} };
        if (!data.datos) data.datos = { mus: {}, tute: {}, parchis: {} };
        if (!data.parejas.mus) data.parejas.mus = {};
        if (!data.parejas.tute) data.parejas.tute = {};
        if (!data.parejas.parchis) data.parejas.parchis = {};
        if (!data.datos.mus) data.datos.mus = {};
        if (!data.datos.tute) data.datos.tute = {};
        if (!data.datos.parchis) data.datos.parchis = {};
        
        // Cargar parejas y partidos para cada tipo de campeonato
        cargarParejas('mus', data.parejas.mus);
        cargarParejas('tute', data.parejas.tute);
        cargarParejas('parchis', data.parejas.parchis);
        
        cargarPartidas('mus', data);
        cargarPartidas('tute', data);
        cargarPartidas('parchis', data);
    }, (error) => {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar los datos de campeonatos: ' + error.message);
    });
}

/**
 * Carga las parejas en la tabla correspondiente
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {Object} parejas - Datos de parejas del campeonato
 */
function cargarParejas(tipo, parejas) {
    const tabla = document.getElementById(`tabla-parejas-${tipo}`).querySelector('tbody');
    tabla.innerHTML = '';
    
    // Si no hay parejas
    if (!parejas || Object.keys(parejas).length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">
                    No hay parejas registradas
                </td>
            </tr>
        `;
        return;
    }
    
    // Añadir cada pareja a la tabla
    for (const numero in parejas) {
        const pareja = parejas[numero];
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${numero}</td>
            <td>${pareja.nombre1}</td>
            <td>${pareja.nombre2}</td>
            <td>
                <button class="btn btn-danger btn-sm eliminar-pareja" data-tipo="${tipo}" data-numero="${numero}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tabla.appendChild(fila);
    }
    
    // Añadir event listeners para eliminar parejas
    document.querySelectorAll(`.eliminar-pareja[data-tipo="${tipo}"]`).forEach(btn => {
        btn.addEventListener('click', function() {
            const numeroPareja = this.getAttribute('data-numero');
            eliminarPareja(tipo, numeroPareja);
        });
    });
}

/**
 * Carga las partidas en el contenedor correspondiente
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {Object} data - Datos completos de campeonatos
 */
function cargarPartidas(tipo, data) {
    console.log(`Cargando partidas de ${tipo}`, data);
    const contenedor = document.getElementById(`partidas-${tipo}`);
    
    // Verificar que las estructuras de datos existan
    if (!data || !data.datos || !data.parejas || !data.datos[tipo]) {
        console.log(`No hay datos para el campeonato de ${tipo}`);
        // No hay datos del campeonato, mostrar botón de crear
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 20px;">
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
    
    const campeonato = data.datos[tipo];
    const parejas = data.parejas[tipo] || {};
    
    // Si no hay partidas o el campeonato está vacío
    if (!campeonato || Object.keys(campeonato).length === 0) {
        console.log(`Campeonato de ${tipo} sin partidas`);
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 20px;">
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
    
    let html = `
        <div class="mb-3">
            <button id="reset-campeonato-${tipo}" class="btn btn-danger">
                <i class="fas fa-trash"></i> Reiniciar Campeonato
            </button>
            <button id="crear-ronda-${tipo}" class="btn btn-primary">
                <i class="fas fa-plus"></i> Añadir Ronda
            </button>
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
                                    `#${partido.p1} - ${pareja1 ? pareja1.nombre1 + ' / ' + pareja1.nombre2 : 'Por determinar'}` : 
                                    'Por determinar'}
                                ${partido.ganador === 'p1' ? ' <i class="fas fa-crown" style="color: gold;"></i>' : ''}
                            </div>
                            <div>
                                Pareja 2: 
                                ${partido.p2 !== null ? 
                                    `#${partido.p2} - ${pareja2 ? pareja2.nombre1 + ' / ' + pareja2.nombre2 : 'Por determinar'}` : 
                                    'Por determinar'}
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
        
        html += `
                <div class="mt-2 mb-4">
                    <button class="btn btn-success añadir-partido" data-tipo="${tipo}" data-ronda="${ronda}">
                        <i class="fas fa-plus"></i> Añadir Partido
                    </button>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
    
    // Añadir event listeners
    document.getElementById(`reset-campeonato-${tipo}`).addEventListener('click', function() {
        if (confirm(`¿Estás seguro de que quieres reiniciar el campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}? Se perderán todos los datos.`)) {
            reiniciarCampeonato(tipo);
        }
    });
    
    document.getElementById(`crear-ronda-${tipo}`).addEventListener('click', function() {
        añadirRonda(tipo, rondas.length + 1);
    });
    
    document.querySelectorAll(`.añadir-partido[data-tipo="${tipo}"]`).forEach(btn => {
        btn.addEventListener('click', function() {
            const ronda = this.getAttribute('data-ronda');
            añadirPartido(tipo, ronda);
        });
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
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function añadirPareja(tipo) {
    const numeroInput = document.getElementById(`numero-pareja-${tipo}`);
    const nombre1Input = document.getElementById(`nombre1-${tipo}`);
    const nombre2Input = document.getElementById(`nombre2-${tipo}`);
    
    const numero = numeroInput.value;
    const nombre1 = nombre1Input.value;
    const nombre2 = nombre2Input.value;
    
    if (!numero || !nombre1 || !nombre2) {
        mostrarError('Por favor, completa todos los campos');
        return;
    }
    
    // Cargar datos actuales
    database.ref(`campeonatos/parejas/${tipo}/${numero}`).set({
        nombre1: nombre1,
        nombre2: nombre2
    })
    .then(() => {
        mostrarExito(`Pareja #${numero} añadida correctamente`);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al guardar los datos: ' + error.message);
    });
}

/**
 * Elimina una pareja del campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} numero - Número de la pareja a eliminar
 */
function eliminarPareja(tipo, numero) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la pareja #${numero}?`)) {
        return;
    }
    
    database.ref(`campeonatos/parejas/${tipo}/${numero}`).remove()
    .then(() => {
        mostrarExito(`Pareja #${numero} eliminada correctamente`);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al guardar los datos: ' + error.message);
    });
}

/**
 * Genera un número aleatorio entre min y max (inclusive)
 * @param {number} min - Número mínimo
 * @param {number} max - Número máximo
 * @returns {number} Número aleatorio
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mezcla un array de forma aleatoria (algoritmo Fisher-Yates)
 * @param {Array} array - Array a mezclar
 * @returns {Array} Array mezclado
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
 * @param {number} numParejas - Número total de parejas
 * @returns {number} Número de rondas necesarias
 */
function calcularNumeroRondas(numParejas) {
    return Math.ceil(Math.log2(numParejas));
}

/**
 * Genera los emparejamientos iniciales para el campeonato
 * @param {Object} parejas - Objeto con las parejas del campeonato
 * @returns {Object} Estructura de rondas con los emparejamientos
 */
function generarEmparejamientos(parejas) {
    console.log('Iniciando generación de emparejamientos con parejas:', parejas);
    
    // Convertir las parejas en un array y mezclarlo
    const parejasArray = Object.keys(parejas);
    const numParejas = parejasArray.length;
    
    console.log('Número de parejas:', numParejas);
    
    if (numParejas < 2) {
        throw new Error('Se necesitan al menos 2 parejas para crear un campeonato');
    }
    
    // Calcular el número de rondas necesarias
    const numRondas = calcularNumeroRondas(numParejas);
    const partidosPorRonda = Math.pow(2, numRondas - 1);
    
    console.log('Número de rondas:', numRondas);
    console.log('Partidos por ronda:', partidosPorRonda);
    
    // Mezclar las parejas aleatoriamente
    const parejasMezcladas = shuffleArray([...parejasArray]);
    console.log('Parejas mezcladas:', parejasMezcladas);
    
    // Estructura para almacenar las rondas
    const rondas = {};
    
    // Si el número de parejas no es potencia de 2, necesitamos ronda preliminar
    if (numParejas > partidosPorRonda && numParejas < partidosPorRonda * 2) {
        console.log('Creando ronda preliminar');
        // Calcular cuántas parejas necesitan jugar la preliminar
        const parejasEnPreliminar = (numParejas - partidosPorRonda) * 2;
        const preliminares = parejasMezcladas.slice(0, parejasEnPreliminar);
        const directos = parejasMezcladas.slice(parejasEnPreliminar);
        
        console.log('Parejas en preliminar:', preliminares);
        console.log('Parejas directas:', directos);
        
        // Crear ronda preliminar
        rondas["0"] = [];
        for (let i = 0; i < preliminares.length; i += 2) {
            rondas["0"].push({
                p1: parseInt(preliminares[i]),
                p2: parseInt(preliminares[i + 1]),
                estado: "pendiente",
                ganador: null
            });
        }
        
        // Primera ronda con ganadores de preliminar y parejas directas
        rondas["1"] = [];
        let indiceDirectos = 0;
        
        // Añadir espacios para los ganadores de preliminar
        for (let i = 0; i < rondas["0"].length; i++) {
            rondas["1"].push({
                p1: null, // Se llenará con el ganador de la preliminar
                p2: parseInt(directos[indiceDirectos++]),
                estado: "pendiente",
                ganador: null
            });
        }
        
        // Añadir parejas restantes
        while (indiceDirectos < directos.length) {
            rondas["1"].push({
                p1: parseInt(directos[indiceDirectos++]),
                p2: indiceDirectos < directos.length ? parseInt(directos[indiceDirectos++]) : null,
                estado: "pendiente",
                ganador: null
            });
        }
    } else {
        console.log('Creando primera ronda sin preliminares');
        // Primera ronda normal sin preliminares
        rondas["1"] = [];
        for (let i = 0; i < parejasMezcladas.length; i += 2) {
            rondas["1"].push({
                p1: parseInt(parejasMezcladas[i]),
                p2: i + 1 < parejasMezcladas.length ? parseInt(parejasMezcladas[i + 1]) : null,
                estado: "pendiente",
                ganador: null
            });
        }
    }
    
    // Crear el resto de rondas vacías
    for (let ronda = 2; ronda <= numRondas; ronda++) {
        rondas[ronda] = [];
        const numPartidos = Math.ceil(rondas[ronda - 1].length / 2);
        for (let i = 0; i < numPartidos; i++) {
            rondas[ronda].push({
                p1: null,
                p2: null,
                estado: "pendiente",
                ganador: null
            });
        }
    }
    
    console.log('Estructura final de rondas:', rondas);
    return rondas;
}

/**
 * Crea un nuevo campeonato con emparejamientos aleatorios
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function crearCampeonato(tipo) {
    console.log('Iniciando creación de campeonato de', tipo);
    
    // Obtener las parejas actuales
    database.ref(`campeonatos/parejas/${tipo}`).once('value')
        .then(snapshot => {
            const parejas = snapshot.val();
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
                        return new Promise((resolve, reject) => {
                            if (confirm(`Ya existe un campeonato de ${tipo}. ¿Quieres reiniciarlo con nuevos emparejamientos?`)) {
                                resolve();
                            } else {
                                reject(new Error('Operación cancelada por el usuario'));
                            }
                        });
                    }
                })
                .then(() => {
                    try {
                        // Generar emparejamientos aleatorios
                        console.log('Generando emparejamientos...');
                        const rondas = generarEmparejamientos(parejas);
                        console.log('Emparejamientos generados:', rondas);
                        
                        // Guardar el campeonato en Firebase
                        console.log('Guardando en Firebase...');
                        return database.ref(`campeonatos/datos/${tipo}`).set(rondas);
                    } catch (error) {
                        console.error('Error al generar emparejamientos:', error);
                        throw error;
                    }
                })
                .then(() => {
                    console.log('Campeonato guardado exitosamente');
                    mostrarExito(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente con emparejamientos aleatorios`);
                    
                    // Mostrar resumen de emparejamientos
                    mostrarResumenEmparejamientos(tipo, parejas);
                    
                    // Recargar la vista
                    cargarPartidas(tipo, { datos: { [tipo]: rondas }, parejas: { [tipo]: parejas } });
                });
        })
        .catch(error => {
            console.error('Error en crearCampeonato:', error);
            mostrarError(error.message);
        });
}

/**
 * Muestra un resumen de los emparejamientos generados
 * @param {string} tipo - Tipo de campeonato
 * @param {Object} parejas - Objeto con las parejas del campeonato
 */
function mostrarResumenEmparejamientos(tipo, parejas) {
    database.ref(`campeonatos/datos/${tipo}`).once('value')
        .then(snapshot => {
            const rondas = snapshot.val();
            let mensaje = '¡Emparejamientos generados!\n\n';
            
            if (rondas["0"]) {
                mensaje += 'Ronda Preliminar:\n';
                rondas["0"].forEach((partido, index) => {
                    mensaje += `Partido ${index + 1}: Pareja #${partido.p1} vs Pareja #${partido.p2}\n`;
                });
                mensaje += '\n';
            }
            
            mensaje += 'Primera Ronda:\n';
            rondas["1"].forEach((partido, index) => {
                const p1 = partido.p1 ? `Pareja #${partido.p1}` : 'Pendiente';
                const p2 = partido.p2 ? `Pareja #${partido.p2}` : 'Pendiente';
                mensaje += `Partido ${index + 1}: ${p1} vs ${p2}\n`;
            });
            
            alert(mensaje);
        });
}

/**
 * Reinicia un campeonato eliminando todos sus datos
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function reiniciarCampeonato(tipo) {
    // Cargar datos actuales
    database.ref(`campeonatos/datos/${tipo}`).set({})
    .then(() => {
        mostrarExito(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} reiniciado correctamente`);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al guardar los datos: ' + error.message);
    });
}

/**
 * Añade una nueva ronda al campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {number} numeroRonda - Número de la nueva ronda
 */
function añadirRonda(tipo, numeroRonda) {
    // Cargar datos actuales
    database.ref(`campeonatos/datos/${tipo}/${numeroRonda.toString()}`).set([])
    .then(() => {
        mostrarExito(`Ronda ${numeroRonda} añadida correctamente`);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al guardar los datos: ' + error.message);
    });
}

/**
 * Añade un nuevo partido a una ronda del campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} ronda - Número de ronda
 */
function añadirPartido(tipo, ronda) {
    // Cargar datos actuales
    database.ref(`campeonatos/datos/${tipo}/${ronda}/${ronda.length}`).set({
        p1: null,
        p2: null,
        estado: "pendiente"
    })
    .then(() => {
        mostrarExito('Partido añadido correctamente');
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al guardar los datos: ' + error.message);
    });
}

/**
 * Abre un modal para editar un partido
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} ronda - Número de ronda
 * @param {number} partidoIndex - Índice del partido en la ronda
 */
function editarPartido(tipo, ronda, partidoIndex) {
    // Cargar datos actuales
    database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}`).once('value')
    .then(snapshot => {
        const partido = snapshot.val();
        const parejas = database.ref(`campeonatos/parejas/${tipo}`).val();
        
        // Crear un string con las opciones de parejas disponibles
        let opcionesParejas = '<option value="">-- Seleccionar --</option>';
        for (const numero in parejas) {
            opcionesParejas += `<option value="${numero}">${numero} - ${parejas[numero].nombre1} / ${parejas[numero].nombre2}</option>`;
        }
        
        // Crear el HTML del modal
        const modalHTML = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background-color: #fff; border-radius: 8px; padding: 20px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <h3>Editar Partido</h3>
                    <div class="form-group">
                        <label for="edit-p1">Pareja 1</label>
                        <select id="edit-p1" class="form-control">
                            ${opcionesParejas}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-p2">Pareja 2</label>
                        <select id="edit-p2" class="form-control">
                            ${opcionesParejas}
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
        
        // Configurar los valores iniciales
        const p1Select = document.getElementById('edit-p1');
        const p2Select = document.getElementById('edit-p2');
        const estadoSelect = document.getElementById('edit-estado');
        const ganadorSelect = document.getElementById('edit-ganador');
        
        if (partido.p1 !== null) p1Select.value = partido.p1;
        if (partido.p2 !== null) p2Select.value = partido.p2;
        estadoSelect.value = partido.estado;
        if (partido.ganador) ganadorSelect.value = partido.ganador;
        
        // Configurar los botones
        document.getElementById('btn-cancelar').addEventListener('click', () => {
            document.body.removeChild(modalElement);
        });
        
        document.getElementById('btn-guardar').addEventListener('click', () => {
            // Actualizar los datos del partido
            database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}/p1`).set(p1Select.value ? parseInt(p1Select.value) : null);
            database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}/p2`).set(p2Select.value ? parseInt(p2Select.value) : null);
            database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}/estado`).set(estadoSelect.value);
            database.ref(`campeonatos/datos/${tipo}/${ronda}/${partidoIndex}/ganador`).set(ganadorSelect.value || null);
            
            // Recargar las partidas
            cargarPartidas(tipo, database.ref(`campeonatos/datos/${tipo}`).val());
            
            // Actualizar los árboles si hay un ganador
            if (ganadorSelect.value && estadoSelect.value === 'completado') {
                actualizarSiguienteRonda(tipo, ronda, partidoIndex, ganadorSelect.value === 'p1' ? partido.p1 : partido.p2, database.ref(`campeonatos/datos/${tipo}`).val());
            }
            
            // Cerrar el modal
            document.body.removeChild(modalElement);
            
            mostrarExito('Partido actualizado correctamente');
        });
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    });
}

/**
 * Actualiza la siguiente ronda con el ganador del partido actual
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} rondaActual - Número de la ronda actual
 * @param {number} partidoIndex - Índice del partido en la ronda
 * @param {number} ganador - Número de la pareja ganadora
 * @param {Object} data - Datos completos de campeonatos
 */
function actualizarSiguienteRonda(tipo, rondaActual, partidoIndex, ganador, data) {
    const siguienteRonda = (parseInt(rondaActual) + 1).toString();
    
    // Comprobar si existe la siguiente ronda
    if (!data[siguienteRonda]) {
        return;
    }
    
    // Calcular en qué partido de la siguiente ronda debe ir el ganador
    const siguientePartidoIndex = Math.floor(partidoIndex / 2);
    
    // Comprobar si existe el partido en la siguiente ronda
    if (!data[siguienteRonda][siguientePartidoIndex]) {
        // Si no existe, lo creamos
        data[siguienteRonda][siguientePartidoIndex] = {
            p1: null,
            p2: null,
            estado: "pendiente"
        };
    }
    
    // Determinar si el ganador va como p1 o p2
    const esP1 = partidoIndex % 2 === 0;
    
    // Actualizar el partido de la siguiente ronda
    if (esP1) {
        data[siguienteRonda][siguientePartidoIndex].p1 = ganador;
    } else {
        data[siguienteRonda][siguientePartidoIndex].p2 = ganador;
    }
    
    // Guardar los datos actualizados
    database.ref(`campeonatos/datos/${tipo}/${siguienteRonda}/${siguientePartidoIndex}`).set(data[siguienteRonda][siguientePartidoIndex]);
}

/**
 * Guarda los datos en Firebase
 * @param {Object} data - Datos a guardar
 * @returns {Promise} Promesa que se resuelve cuando los datos se han guardado
 */
function guardarDatos(data) {
    return database.ref('campeonatos').set(data)
        .then(() => {
            // El guardado fue exitoso
            return Promise.resolve();
        })
        .catch((error) => {
            console.error('Error al guardar los datos:', error);
            return Promise.reject(error);
        });
}

/**
 * Devuelve el nombre de la ronda según su número
 * @param {string} ronda - Número de ronda
 * @param {number} totalRondas - Número total de rondas
 * @returns {string} Nombre de la ronda
 */
function getNombreRonda(ronda, totalRondas) {
    const numRonda = parseInt(ronda);
    
    if (numRonda === totalRondas) {
        return 'Final';
    } else if (numRonda === totalRondas - 1) {
        return 'Semifinales';
    } else if (numRonda === totalRondas - 2) {
        return 'Cuartos de final';
    } else if (numRonda === totalRondas - 3) {
        return 'Octavos de final';
    } else {
        return `Ronda ${numRonda}`;
    }
}

/**
 * Devuelve el texto del estado según el estado de la partida
 * @param {string} estado - Estado de la partida
 * @returns {string} Texto del estado
 */
function getEstadoTexto(estado) {
    switch(estado) {
        case 'pendiente':
            return 'Pendiente';
        case 'jugando':
            return 'En juego';
        case 'completado':
            return 'Completado';
        default:
            return 'Pendiente';
    }
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

/**
 * Muestra un mensaje de éxito
 * @param {string} mensaje - Mensaje de éxito
 */
function mostrarExito(mensaje) {
    alert('Éxito: ' + mensaje);
} 