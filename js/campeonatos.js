/**
 * Script para la visualización de campeonatos de Mus, Tute y Parchís
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gestionar las pestañas de campeonatos
    const tabs = document.querySelectorAll('.campeonato-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Desactivar todas las pestañas y contenidos
            document.querySelectorAll('.campeonato-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activar la pestaña y contenido seleccionados
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Cargar datos de campeonatos
    cargarDatosCampeonatos();

    // Configurar el buscador de parejas
    document.getElementById('buscar-pareja').addEventListener('click', buscarPareja);
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
            // Generar árboles de campeonatos
            generarArbolCampeonato('mus', data);
            generarArbolCampeonato('tute', data);
            generarArbolCampeonato('parchis', data);
        })
        .catch(error => {
            console.error('Error:', error);
            ['mus', 'tute', 'parchis'].forEach(tipo => {
                document.getElementById(`${tipo}-bracket`).innerHTML = `
                    <div class="error-container" style="text-align: center; padding: 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #d32f2f;"></i>
                        <h3>Error al cargar los datos</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
        });
}

/**
 * Genera el árbol del campeonato en el HTML
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 * @param {Object} data - Datos de los campeonatos
 */
function generarArbolCampeonato(tipo, data) {
    const bracket = document.getElementById(`${tipo}-bracket`);
    const campeonato = data.datos[tipo];
    const parejas = data.parejas[tipo];
    
    if (!campeonato || Object.keys(campeonato).length === 0) {
        bracket.innerHTML = `
            <div class="no-campeonato" style="text-align: center; padding: 20px;">
                <i class="fas fa-calendar-times" style="font-size: 2rem; color: #757575;"></i>
                <h3>No hay campeonato disponible</h3>
                <p>Todavía no se ha configurado el campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
            </div>
        `;
        return;
    }

    // Ordenar las rondas por número
    const rondas = Object.keys(campeonato).sort((a, b) => parseInt(a) - parseInt(b));
    const totalRondas = rondas.length;
    
    let html = '';
    
    // Para cada ronda
    rondas.forEach(ronda => {
        const partidasRonda = campeonato[ronda];
        const nombreRonda = getNombreRonda(ronda, totalRondas);
        
        html += `
            <div class="round">
                <div class="match-container">
                    <div class="round-title">${nombreRonda}</div>
        `;
        
        // Para cada partido de la ronda
        partidasRonda.forEach((partido, index) => {
            const estadoClase = getEstadoClase(partido.estado);
            const estadoTexto = getEstadoTexto(partido.estado);
            
            html += `
                <div class="match ${estadoClase}" data-round="${ronda}" data-match="${index}">
                    <div class="match-status ${estadoClase}">${estadoTexto}</div>
                    <div class="match-teams">
            `;
            
            // Equipo 1
            if (partido.p1 !== null) {
                const pareja1 = parejas[partido.p1];
                html += `
                    <div class="team ${partido.ganador === 'p1' ? 'winner' : ''}">
                        <span class="team-number">#${partido.p1}</span>
                        <span class="team-names">${pareja1 ? pareja1.nombre1 + ' / ' + pareja1.nombre2 : 'Por determinar'}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="team">
                        <span>Por determinar</span>
                    </div>
                `;
            }
            
            // Equipo 2
            if (partido.p2 !== null) {
                const pareja2 = parejas[partido.p2];
                html += `
                    <div class="team ${partido.ganador === 'p2' ? 'winner' : ''}">
                        <span class="team-number">#${partido.p2}</span>
                        <span class="team-names">${pareja2 ? pareja2.nombre1 + ' / ' + pareja2.nombre2 : 'Por determinar'}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="team">
                        <span>Por determinar</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    bracket.innerHTML = html;
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
 * Devuelve la clase CSS según el estado de la partida
 * @param {string} estado - Estado de la partida
 * @returns {string} Clase CSS
 */
function getEstadoClase(estado) {
    switch(estado) {
        case 'pendiente':
            return 'pending';
        case 'jugando':
            return 'active';
        case 'completado':
            return 'completed';
        default:
            return 'pending';
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
 * Busca la pareja por su número y muestra su próximo partido
 */
function buscarPareja() {
    const numeroPareja = document.getElementById('pareja-numero').value;
    const tipoCampeonato = document.getElementById('campeonato-selector').value;
    const resultadoDiv = document.getElementById('search-result');
    
    if (!numeroPareja) {
        resultadoDiv.innerHTML = '<p style="color: #d32f2f;"><i class="fas fa-exclamation-circle"></i> Introduce un número de pareja</p>';
        resultadoDiv.style.display = 'block';
        return;
    }
    
    fetch('../data/campeonatos_data.json')
        .then(response => response.json())
        .then(data => {
            const campeonato = data.datos[tipoCampeonato];
            const parejas = data.parejas[tipoCampeonato];
            
            // Comprobar si existe la pareja
            if (!parejas[numeroPareja]) {
                resultadoDiv.innerHTML = `<p style="color: #d32f2f;"><i class="fas fa-exclamation-circle"></i> La pareja #${numeroPareja} no existe en este campeonato</p>`;
                resultadoDiv.style.display = 'block';
                return;
            }
            
            // Buscar el partido de la pareja
            let partidoEncontrado = false;
            let html = '';
            
            // Recorremos todas las rondas
            for (const ronda in campeonato) {
                const partidasRonda = campeonato[ronda];
                
                // Recorremos todos los partidos de la ronda
                partidasRonda.forEach((partido, index) => {
                    // Si la pareja está en este partido
                    if (partido.p1 == numeroPareja || partido.p2 == numeroPareja) {
                        const rival = partido.p1 == numeroPareja ? partido.p2 : partido.p1;
                        const nombreRival = rival !== null ? 
                            (parejas[rival] ? `${parejas[rival].nombre1} / ${parejas[rival].nombre2}` : 'Por determinar') : 
                            'Por determinar';
                        
                        html += `
                            <h4><i class="fas fa-trophy"></i> Tu próximo partido</h4>
                            <p><strong>Campeonato:</strong> ${tipoCampeonato.charAt(0).toUpperCase() + tipoCampeonato.slice(1)}</p>
                            <p><strong>Ronda:</strong> ${getNombreRonda(ronda, Object.keys(campeonato).length)}</p>
                            <p><strong>Estado:</strong> <span class="estado-badge estado-${partido.estado}">${getEstadoTexto(partido.estado)}</span></p>
                            <p><strong>Tu pareja:</strong> #${numeroPareja} - ${parejas[numeroPareja].nombre1} / ${parejas[numeroPareja].nombre2}</p>
                            <p><strong>Rival:</strong> ${rival !== null ? `#${rival} - ` : ''}${nombreRival}</p>
                        `;
                        
                        partidoEncontrado = true;
                        return;
                    }
                });
                
                if (partidoEncontrado) break;
            }
            
            if (!partidoEncontrado) {
                html = `<p><i class="fas fa-info-circle"></i> No se encontró ningún partido pendiente para la pareja #${numeroPareja}</p>`;
            }
            
            resultadoDiv.innerHTML = html;
            resultadoDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            resultadoDiv.innerHTML = `<p style="color: #d32f2f;"><i class="fas fa-exclamation-circle"></i> Error al buscar la pareja: ${error.message}</p>`;
            resultadoDiv.style.display = 'block';
        });
} 