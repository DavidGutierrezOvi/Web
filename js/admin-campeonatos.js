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
 * Carga los datos de campeonatos desde el archivo JSON
 */
function cargarDatosCampeonatos() {
    fetch('../data/campeonatos_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de campeonatos');
            }
            return response.json();
        })
        .then(data => {
            // Cargar parejas y partidos para cada tipo de campeonato
            cargarParejas('mus', data.parejas.mus);
            cargarParejas('tute', data.parejas.tute);
            cargarParejas('parchis', data.parejas.parchis);
            
            cargarPartidas('mus', data);
            cargarPartidas('tute', data);
            cargarPartidas('parchis', data);
        })
        .catch(error => {
            console.error('Error:', error);
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
    const contenedor = document.getElementById(`partidas-${tipo}`);
    const campeonato = data.datos[tipo];
    const parejas = data.parejas[tipo];
    
    // Si no hay partidas
    if (!campeonato || Object.keys(campeonato).length === 0) {
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
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Asegurarse de que las estructuras existen
            if (!data.parejas) data.parejas = {};
            if (!data.parejas[tipo]) data.parejas[tipo] = {};
            
            // Comprobar si ya existe una pareja con ese número
            if (data.parejas[tipo][numero]) {
                if (!confirm(`Ya existe una pareja con el número ${numero}. ¿Quieres sobrescribirla?`)) {
                    return;
                }
            }
            
            // Añadir la nueva pareja
            data.parejas[tipo][numero] = {
                nombre1: nombre1,
                nombre2: nombre2
            };
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las parejas
                    cargarParejas(tipo, data.parejas[tipo]);
                    
                    // Limpiar el formulario
                    numeroInput.value = '';
                    nombre1Input.value = '';
                    nombre2Input.value = '';
                    
                    mostrarExito(`Pareja #${numero} añadida correctamente`);
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
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
    
    // Cargar datos actuales
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Comprobar si la pareja existe
            if (!data.parejas[tipo][numero]) {
                mostrarError(`No existe una pareja con el número ${numero}`);
                return;
            }
            
            // Eliminar la pareja
            delete data.parejas[tipo][numero];
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las parejas
                    cargarParejas(tipo, data.parejas[tipo]);
                    mostrarExito(`Pareja #${numero} eliminada correctamente`);
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
        });
}

/**
 * Crea un nuevo campeonato vacío
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function crearCampeonato(tipo) {
    // Cargar datos actuales
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Asegurarse de que las estructuras existen
            if (!data.datos) data.datos = {};
            
            // Comprobar si ya existe un campeonato
            if (data.datos[tipo] && Object.keys(data.datos[tipo]).length > 0) {
                if (!confirm(`Ya existe un campeonato de ${tipo}. ¿Quieres sobrescribirlo?`)) {
                    return;
                }
            }
            
            // Crear el campeonato con una primera ronda vacía
            data.datos[tipo] = {
                "1": []
            };
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las partidas
                    cargarPartidas(tipo, data);
                    mostrarExito(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente`);
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
        });
}

/**
 * Reinicia un campeonato eliminando todos sus datos
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function reiniciarCampeonato(tipo) {
    // Cargar datos actuales
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Eliminar el campeonato
            if (data.datos && data.datos[tipo]) {
                data.datos[tipo] = {};
            }
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las partidas
                    cargarPartidas(tipo, data);
                    mostrarExito(`Campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} reiniciado correctamente`);
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
        });
}

/**
 * Añade una nueva ronda al campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {number} numeroRonda - Número de la nueva ronda
 */
function añadirRonda(tipo, numeroRonda) {
    // Cargar datos actuales
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Asegurarse de que las estructuras existen
            if (!data.datos) data.datos = {};
            if (!data.datos[tipo]) data.datos[tipo] = {};
            
            // Añadir la nueva ronda
            data.datos[tipo][numeroRonda.toString()] = [];
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las partidas
                    cargarPartidas(tipo, data);
                    mostrarExito(`Ronda ${numeroRonda} añadida correctamente`);
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
        });
}

/**
 * Añade un nuevo partido a una ronda del campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {string} ronda - Número de ronda
 */
function añadirPartido(tipo, ronda) {
    // Cargar datos actuales
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            // Asegurarse de que las estructuras existen
            if (!data.datos) data.datos = {};
            if (!data.datos[tipo]) data.datos[tipo] = {};
            if (!data.datos[tipo][ronda]) data.datos[tipo][ronda] = [];
            
            // Añadir el nuevo partido
            data.datos[tipo][ronda].push({
                p1: null,
                p2: null,
                estado: "pendiente"
            });
            
            // Guardar los datos actualizados
            guardarDatos(data)
                .then(() => {
                    // Recargar las partidas
                    cargarPartidas(tipo, data);
                    mostrarExito('Partido añadido correctamente');
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarError('Error al guardar los datos: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos: ' + error.message);
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
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            const partido = data.datos[tipo][ronda][partidoIndex];
            const parejas = data.parejas[tipo];
            
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
                partido.p1 = p1Select.value ? parseInt(p1Select.value) : null;
                partido.p2 = p2Select.value ? parseInt(p2Select.value) : null;
                partido.estado = estadoSelect.value;
                partido.ganador = ganadorSelect.value || null;
                
                // Guardar los datos actualizados
                guardarDatos(data)
                    .then(() => {
                        // Cerrar el modal
                        document.body.removeChild(modalElement);
                        
                        // Recargar las partidas
                        cargarPartidas(tipo, data);
                        
                        // Actualizar los árboles si hay un ganador
                        if (partido.ganador && partido.estado === 'completado') {
                            actualizarSiguienteRonda(tipo, ronda, partidoIndex, partido.ganador === 'p1' ? partido.p1 : partido.p2, data);
                        }
                        
                        mostrarExito('Partido actualizado correctamente');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        mostrarError('Error al guardar los datos: ' + error.message);
                    });
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
    if (!data.datos[tipo][siguienteRonda]) {
        return;
    }
    
    // Calcular en qué partido de la siguiente ronda debe ir el ganador
    const siguientePartidoIndex = Math.floor(partidoIndex / 2);
    
    // Comprobar si existe el partido en la siguiente ronda
    if (!data.datos[tipo][siguienteRonda][siguientePartidoIndex]) {
        // Si no existe, lo creamos
        data.datos[tipo][siguienteRonda][siguientePartidoIndex] = {
            p1: null,
            p2: null,
            estado: "pendiente"
        };
    }
    
    // Determinar si el ganador va como p1 o p2
    const esP1 = partidoIndex % 2 === 0;
    
    // Actualizar el partido de la siguiente ronda
    if (esP1) {
        data.datos[tipo][siguienteRonda][siguientePartidoIndex].p1 = ganador;
    } else {
        data.datos[tipo][siguienteRonda][siguientePartidoIndex].p2 = ganador;
    }
    
    // Guardar los datos actualizados
    guardarDatos(data);
}

/**
 * Guarda los datos en el archivo JSON
 * @param {Object} data - Datos a guardar
 * @returns {Promise} Promesa que se resuelve cuando los datos se han guardado
 */
function guardarDatos(data) {
    // Aquí simularíamos una llamada a la API para guardar los datos
    // En un entorno real, esto enviaría una petición POST/PUT a un endpoint que actualizaría el archivo JSON
    
    return new Promise((resolve, reject) => {
        // Simulamos una petición a una API con fetch
        fetch('../api/guardar-campeonatos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al guardar los datos');
            }
            resolve();
        })
        .catch(error => {
            console.error('Error al guardar los datos:', error);
            
            // En caso de error, mostramos una advertencia pero simulamos éxito
            // SOLO PARA DEMO - En producción, esto debería rechazar la promesa
            alert('Error al guardar los datos. En un entorno real, los cambios no se guardarían.');
            
            // Simular éxito para la demo
            resolve();
        });
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