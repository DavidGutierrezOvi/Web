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
    
    // Configurar botones para generar Excel
    ['mus', 'tute', 'parchis'].forEach(tipo => {
        const botonExcel = document.getElementById(`generar-excel-arbol-${tipo}`);
        if (botonExcel) {
            botonExcel.addEventListener('click', function() {
                generarExcelArbol(tipo);
            });
        }
    });
});

/**
 * Verifica si un valor está definido y válido (no es null ni undefined ni el string "undefined")
 * @param {any} value - Valor a verificar
 * @returns {boolean} - true si el valor es válido, false en caso contrario
 */
function isValidValue(value) {
    return value !== null && value !== undefined && value !== "undefined";
}

/**
 * Carga los datos de campeonatos desde Firebase
 */
function cargarDatosCampeonatos() {
    const campeonatosRef = database.ref('campeonatos');
    
    campeonatosRef.on('value', (snapshot) => {
        const data = snapshot.val() || {
            parejas: { mus: {}, tute: {}, parchis: {} },
            datos: { mus: {}, tute: {}, parchis: {} }
        };
        
        // Asegurarse de que todas las estructuras necesarias existen
        if (!data.parejas) data.parejas = { mus: {}, tute: {}, parchis: {} };
        if (!data.datos) data.datos = { mus: {}, tute: {}, parchis: {} };
        if (!data.parejas.mus) data.parejas.mus = {};
        if (!data.parejas.tute) data.parejas.tute = {};
        if (!data.parejas.parchis) data.parejas.parchis = {};
        if (!data.datos.mus) data.datos.mus = {};
        if (!data.datos.tute) data.datos.tute = {};
        if (!data.datos.parchis) data.datos.parchis = {};
        
        // Generar árboles de campeonatos
        generarArbolCampeonato('mus', data);
        generarArbolCampeonato('tute', data);
        generarArbolCampeonato('parchis', data);
    }, (error) => {
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
    
    // Verificar que las estructuras de datos existan
    if (!data || !data.datos || !data.parejas || !data.datos[tipo] || !data.parejas[tipo]) {
        bracket.innerHTML = `
            <div class="no-campeonato" style="text-align: center; padding: 20px;">
                <i class="fas fa-calendar-times" style="font-size: 2rem; color: #757575;"></i>
                <h3>No hay campeonato disponible</h3>
                <p>Todavía no se ha configurado el campeonato de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
            </div>
        `;
        return;
    }
    
    const campeonato = data.datos[tipo];
    const parejas = data.parejas[tipo] || {};
    
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

    // Asegurarse de que no existan "undefined" como string en los datos
    for (const ronda in campeonato) {
        if (campeonato.hasOwnProperty(ronda)) {
            campeonato[ronda].forEach(partido => {
                // Convertir "undefined" (string) a null
                if (partido.p1 === "undefined") partido.p1 = null;
                if (partido.p2 === "undefined") partido.p2 = null;
            });
        }
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
            if (partido.p1 !== null && partido.p1 !== undefined && partido.p1 !== "undefined") {
                const pareja1 = parejas[partido.p1];
                if (pareja1) {
                    // Si existe la pareja, mostrar su número e información
                    html += `
                        <div class="team ${partido.ganador === 'p1' ? 'winner' : ''}">
                            <span class="team-number">${partido.p1}</span>
                            <span class="team-names">${pareja1.nombre1 || ''} / ${pareja1.nombre2 || ''}</span>
                        </div>
                    `;
                } else {
                    // Si tiene ID pero no existe en la lista de parejas
                    html += `
                        <div class="team ${partido.ganador === 'p1' ? 'winner' : ''}">
                            <span class="team-number">${partido.p1}</span>
                            <span class="team-names">Por definir</span>
                        </div>
                    `;
                }
            } else {
                // Si no tiene ID de pareja (null o undefined) o es "undefined"
                html += `
                    <div class="team">
                        <span>Por definir</span>
                    </div>
                `;
            }
            
            // Equipo 2
            if (partido.p2 !== null && partido.p2 !== undefined && partido.p2 !== "undefined") {
                const pareja2 = parejas[partido.p2];
                if (pareja2) {
                    // Si existe la pareja, mostrar su número e información
                    html += `
                        <div class="team ${partido.ganador === 'p2' ? 'winner' : ''}">
                            <span class="team-number">${partido.p2}</span>
                            <span class="team-names">${pareja2.nombre1 || ''} / ${pareja2.nombre2 || ''}</span>
                        </div>
                    `;
                } else {
                    // Si tiene ID pero no existe en la lista de parejas
                    html += `
                        <div class="team ${partido.ganador === 'p2' ? 'winner' : ''}">
                            <span class="team-number">${partido.p2}</span>
                            <span class="team-names">Por definir</span>
                        </div>
                    `;
                }
            } else {
                // Si no tiene ID de pareja (null o undefined) o es "undefined"
                html += `
                    <div class="team">
                        <span>Por definir</span>
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
    // Simplemente devolver "Ronda X" donde X es el número de ronda
    return `Ronda ${ronda}`;
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
 * Busca de qué partido anterior sale un rival que aún no está determinado
 * @param {Object} campeonato - Datos del campeonato
 * @param {string} rondaActual - Ronda actual
 * @param {number} partidoActual - Índice del partido actual
 * @param {string} posicionRival - Posición del rival (p1 o p2)
 * @returns {Object|null} Información del origen del rival o null
 */
function buscarOrigenRival(campeonato, rondaActual, partidoActual, posicionRival) {
    // Si estamos en la ronda 1, no hay partido anterior
    if (rondaActual === "1" || rondaActual === 1) return null;
    
    const rondaAnterior = (parseInt(rondaActual) - 1).toString();
    
    // No hay ronda anterior
    if (!campeonato[rondaAnterior]) return null;
    
    // Imprimimos logs para depuración
    console.log("Buscando origen del rival:");
    console.log("- Ronda actual:", rondaActual);
    console.log("- Partido actual:", partidoActual);
    console.log("- Posición rival:", posicionRival);
    console.log("- Ronda anterior:", rondaAnterior);
    console.log("- Partidos en ronda anterior:", campeonato[rondaAnterior].length);
    
    // Calcular el índice del partido en la ronda anterior
    // Si estamos buscando p1, el partido anterior es partidoActual*2
    // Si estamos buscando p2, el partido anterior es partidoActual*2+1
    let partidoAnteriorIndice = posicionRival === 'p1' ? partidoActual * 2 : partidoActual * 2 + 1;
    
    // Verificar si existe ese partido en la ronda anterior
    if (!campeonato[rondaAnterior][partidoAnteriorIndice]) {
        console.log("ERROR: El índice calculado está fuera de rango:", partidoAnteriorIndice);
        
        // Si el índice calculado está fuera de rango, probamos con una fórmula alternativa
        // En algunos torneos la relación puede ser diferente
        partidoAnteriorIndice = Math.floor(partidoActual / 2);
        console.log("Probando con índice alternativo:", partidoAnteriorIndice);
        
        if (!campeonato[rondaAnterior][partidoAnteriorIndice]) {
            console.log("ERROR: Tampoco se encontró con el índice alternativo");
            return null;
        }
    }
    
    const partidoAnterior = campeonato[rondaAnterior][partidoAnteriorIndice];
    console.log("Partido anterior encontrado:", partidoAnterior);
    
    // Asegurarnos de que el partido anterior existe y tiene la estructura correcta
    if (!partidoAnterior) return null;
    
    // Verificar y corregir p1 y p2 si son "undefined"
    if (partidoAnterior.p1 === "undefined") partidoAnterior.p1 = null;
    if (partidoAnterior.p2 === "undefined") partidoAnterior.p2 = null;
    
    return {
        ronda: rondaAnterior,
        indice: partidoAnteriorIndice,
        partido: partidoAnterior,
        equipo1: partidoAnterior.p1,
        equipo2: partidoAnterior.p2,
        posicion: posicionRival
    };
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
    
    const campeonatosRef = database.ref('campeonatos');
    
    campeonatosRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (!data) {
                throw new Error('No hay datos disponibles');
            }
            
            const campeonato = data.datos[tipoCampeonato];
            const parejas = data.parejas[tipoCampeonato];
            
            // Comprobar si existe la pareja
            if (!parejas[numeroPareja]) {
                resultadoDiv.innerHTML = `<p style="color: #d32f2f;"><i class="fas fa-exclamation-circle"></i> La pareja ${numeroPareja} no existe en este campeonato</p>`;
                resultadoDiv.style.display = 'block';
                return;
            }
            
            // Buscar el próximo partido pendiente o en juego de la pareja
            let partidoEncontrado = false;
            let html = '';
            
            // Ordenar las rondas para procesarlas en orden
            const rondas = Object.keys(campeonato).sort((a, b) => parseInt(a) - parseInt(b));
            
            // Recorremos todas las rondas
            for (const ronda of rondas) {
                const partidasRonda = campeonato[ronda];
                
                // Recorremos todos los partidos de la ronda
                for (let index = 0; index < partidasRonda.length; index++) {
                    const partido = partidasRonda[index];
                    
                    // Si la pareja está en este partido y el partido no está completado
                    if ((partido.p1 == numeroPareja || partido.p2 == numeroPareja) && partido.estado !== 'completado') {
                        const posicionPareja = partido.p1 == numeroPareja ? 'p1' : 'p2';
                        const posicionRival = posicionPareja === 'p1' ? 'p2' : 'p1';
                        const rival = partido[posicionRival];
                        
                        html += `
                            <h4><i class="fas fa-trophy"></i> Tu próximo partido</h4>
                            <p><strong>Campeonato:</strong> ${tipoCampeonato.charAt(0).toUpperCase() + tipoCampeonato.slice(1)}</p>
                            <p><strong>Ronda:</strong> ${getNombreRonda(ronda, rondas.length)}</p>
                            <p><strong>Estado:</strong> <span class="estado-badge estado-${partido.estado}">${getEstadoTexto(partido.estado)}</span></p>
                            <p><strong>Tu pareja:</strong> ${numeroPareja} - ${parejas[numeroPareja].nombre1 || ''} / ${parejas[numeroPareja].nombre2 || ''}</p>
                        `;
                        
                        // Si el rival está determinado
                        if (isValidValue(rival)) {
                            const parejaRival = parejas[rival];
                            if (parejaRival) {
                                html += `<p><strong>Rival:</strong> ${rival} - ${parejaRival.nombre1 || ''} / ${parejaRival.nombre2 || ''}</p>`;
                            } else {
                                html += `<p><strong>Rival:</strong> ${rival} - Por definir</p>`;
                            }
                        } else {
                            // Intentar buscar de qué partido anterior saldrá el rival
                            const rivalInfo = buscarOrigenRival(campeonato, ronda, index, posicionRival);
                            
                            if (rivalInfo && rivalInfo.partido) {
                                const partidoAnterior = rivalInfo.partido;
                                console.log("Se encontró información del partido anterior:", partidoAnterior);
                                
                                // Determinar el estado del partido anterior
                                let estadoPartidoAnterior = 'estado desconocido';
                                if (partidoAnterior.estado === 'pendiente') {
                                    estadoPartidoAnterior = 'todavía no se está jugando';
                                } else if (partidoAnterior.estado === 'jugando') {
                                    estadoPartidoAnterior = 'se está jugando ahora mismo';
                                } else if (partidoAnterior.estado === 'completado') {
                                    estadoPartidoAnterior = 'ya ha finalizado';
                                }
                                
                                // Información de las parejas del partido anterior
                                let pareja1Info = 'Por definir';
                                let pareja2Info = 'Por definir';
                                
                                // Procesar información de la pareja 1
                                const p1Id = partidoAnterior.p1;
                                if (p1Id !== null && p1Id !== undefined && p1Id !== "undefined") {
                                    const p1 = parejas[p1Id];
                                    if (p1) {
                                        pareja1Info = `${p1Id} - ${p1.nombre1 || ''} / ${p1.nombre2 || ''}`;
                                    } else {
                                        pareja1Info = `${p1Id} - Por definir`;
                                    }
                                }
                                
                                // Procesar información de la pareja 2
                                const p2Id = partidoAnterior.p2;
                                if (p2Id !== null && p2Id !== undefined && p2Id !== "undefined") {
                                    const p2 = parejas[p2Id];
                                    if (p2) {
                                        pareja2Info = `${p2Id} - ${p2.nombre1 || ''} / ${p2.nombre2 || ''}`;
                                    } else {
                                        pareja2Info = `${p2Id} - Por definir`;
                                    }
                                }
                                
                                console.log("Información procesada de parejas anteriores:", 
                                    { p1Id, pareja1Info, p2Id, pareja2Info });
                                
                                // Mostrar información de dónde saldrá el rival
                                html += `
                                    <p><strong>Rival:</strong> Por definir</p>
                                    <div class="rival-info" style="background:#f5f5f5; padding:10px; border-radius:5px; margin-top:10px;">
                                        <p><i class="fas fa-info-circle"></i> <strong>Tu rival saldrá de la partida entre:</strong></p>
                                        <ul style="margin-top: 5px; padding-left: 20px;">
                                            <li>Pareja ${pareja1Info}</li>
                                            <li>Pareja ${pareja2Info}</li>
                                        </ul>
                                        <p style="margin-top: 5px;">El partido entre estas parejas ${estadoPartidoAnterior}.</p>
                                    </div>
                                `;
                            } else {
                                html += `<p><strong>Rival:</strong> Por definir</p>`;
                                
                                // Mostrar información de que no se puede determinar el origen del rival
                                html += `
                                    <div class="rival-info" style="background:#f5f5f5; padding:10px; border-radius:5px; margin-top:10px;">
                                        <p><i class="fas fa-info-circle"></i> <strong>Información del rival:</strong></p>
                                        <p>Tu rival aún no está definido. Espera a que se complete la ronda anterior.</p>
                                    </div>
                                `;
                            }
                        }
                        
                        // Información adicional sobre el estado del partido
                        
                        
                        partidoEncontrado = true;
                        break;
                    }
                }
                
                if (partidoEncontrado) break;
            }
            
            // Si no se encontró un partido pendiente o en juego, buscar el último partido completado
            if (!partidoEncontrado) {
                for (const ronda of [...rondas].reverse()) { // Recorrer las rondas en orden inverso
                    const partidasRonda = campeonato[ronda];
                    
                    for (let index = 0; index < partidasRonda.length; index++) {
                        const partido = partidasRonda[index];
                        
                        // Si la pareja está en este partido y está completado
                        if ((partido.p1 == numeroPareja || partido.p2 == numeroPareja) && partido.estado === 'completado') {
                            const posicionPareja = partido.p1 == numeroPareja ? 'p1' : 'p2';
                            const posicionRival = posicionPareja === 'p1' ? 'p2' : 'p1';
                            const rival = partido[posicionRival];
                            const ganador = partido.ganador === posicionPareja;
                            
                            html += `
                                <h4><i class="fas fa-trophy"></i> Tu último partido</h4>
                                <p><strong>Campeonato:</strong> ${tipoCampeonato.charAt(0).toUpperCase() + tipoCampeonato.slice(1)}</p>
                                <p><strong>Ronda:</strong> ${getNombreRonda(ronda, rondas.length)}</p>
                                <p><strong>Estado:</strong> <span class="estado-badge estado-completado">Completado</span></p>
                                <p><strong>Tu pareja:</strong> ${numeroPareja} - ${parejas[numeroPareja].nombre1 || ''} / ${parejas[numeroPareja].nombre2 || ''}</p>
                            `;
                            
                            if (isValidValue(rival)) {
                                const parejaRival = parejas[rival];
                                if (parejaRival) {
                                    html += `<p><strong>Rival:</strong> ${rival} - ${parejaRival.nombre1 || ''} / ${parejaRival.nombre2 || ''}</p>`;
                                } else {
                                    html += `<p><strong>Rival:</strong> ${rival} - Por definir</p>`;
                                }
                            } else {
                                html += `<p><strong>Rival:</strong> Por definir</p>`;
                            }
                            
                            html += `
                                <p><i class="fas fa-check-circle"></i> Este partido ha finalizado. Resultado: <strong>${ganador ? '¡Has ganado!' : 'Has perdido'}</strong></p>
                                ${ganador && ronda !== rondas[rondas.length - 1] ? '<p><i class="fas fa-arrow-right"></i> Avanzaste a la siguiente ronda.</p>' : ''}
                                ${ganador && ronda === rondas[rondas.length - 1] ? '<p><i class="fas fa-crown" style="color: gold;"></i> <strong>¡Felicidades! Eres el campeón del torneo.</strong></p>' : ''}
                                <p><i class="fas fa-info-circle"></i> No tienes partidos pendientes en este momento.</p>
                            `;
                            
                            partidoEncontrado = true;
                            break;
                        }
                    }
                    
                    if (partidoEncontrado) break;
                }
            }
            
            if (!partidoEncontrado) {
                html = `<p><i class="fas fa-info-circle"></i> No se encontró ningún partido para la pareja ${numeroPareja}</p>`;
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

/**
 * Genera el Excel del árbol del campeonato
 * @param {string} tipo - Tipo de campeonato (mus, tute, parchis)
 */
function generarExcelArbol(tipo) {
    console.log(`Generando Excel del árbol del campeonato de ${tipo}`);
    
    const campeonatosRef = database.ref('campeonatos');
    
    campeonatosRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (!data || !data.datos || !data.parejas || !data.datos[tipo]) {
                throw new Error('No hay datos disponibles para este campeonato');
            }
            
            const campeonato = data.datos[tipo];
            
            // Ordenar las rondas por número
            const rondas = Object.keys(campeonato).sort((a, b) => parseInt(a) - parseInt(b));
            const totalRondas = rondas.length;
            const partidosPrimeraRonda = campeonato[rondas[0]].length;
            
            // Calcular el número total de filas necesario basándonos en la primera ronda
            // Para cada partido en la primera ronda, necesitamos 2 casillas (una para cada pareja)
            // y un espacio entre partidos (excepto después del último)
            const totalFilas = partidosPrimeraRonda * 3 - 1;
            
            // Crear una matriz vacía para nuestro worksheet
            const worksheet = [];
            for (let i = 0; i < totalFilas; i++) {
                worksheet[i] = new Array(totalRondas * 2).fill("");
            }
            
            // Para cada ronda
            for (let rondaIndex = 0; rondaIndex < totalRondas; rondaIndex++) {
                const ronda = rondas[rondaIndex];
                const partidosRonda = campeonato[ronda];
                const columna = rondaIndex * 2; // Usamos columnas pares para los datos
                
                // El espaciado entre grupos de parejas aumenta con cada ronda
                const espaciadoGrupos = Math.pow(2, rondaIndex) * 3;
                
                // Para cada partido en esta ronda
                for (let partidoIndex = 0; partidoIndex < partidosRonda.length; partidoIndex++) {
                    const partido = partidosRonda[partidoIndex];
                    
                    // Calcular la fila base para este partido
                    const filaBase = partidoIndex * espaciadoGrupos;
                    
                    // Añadir pareja 1
                    if (isValidValue(partido.p1)) {
                        worksheet[filaBase][columna] = partido.p1.toString();
                    }
                    
                    // Añadir pareja 2 (una fila debajo)
                    if (isValidValue(partido.p2)) {
                        worksheet[filaBase + 1][columna] = partido.p2.toString();
                    }
                }
            }
            
            // Convertir nuestra matriz a una hoja de Excel
            const ws = XLSX.utils.aoa_to_sheet(worksheet);
            
            // Configurar ancho de columnas uniforme (aproximadamente 6.5 píxeles)
            ws['!cols'] = Array(totalRondas * 2).fill({ width: 6.5 });
            
            // Añadir bordes a todas las celdas que contienen datos
            for (let i = 0; i < totalFilas; i++) {
                for (let j = 0; j < totalRondas * 2; j++) {
                    // Solo añadir bordes a celdas con contenido
                    if (worksheet[i][j]) {
                        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
                        if (!ws[cellRef]) ws[cellRef] = {};
                        if (!ws[cellRef].s) ws[cellRef].s = {};
                        
                        // Añadir estilos de borde y alineación
                        ws[cellRef].s = {
                            border: {
                                top: { style: "thin" },
                                left: { style: "thin" },
                                bottom: { style: "thin" },
                                right: { style: "thin" }
                            },
                            alignment: { horizontal: "center", vertical: "center" }
                        };
                    }
                }
            }
            
            // Crear un libro Excel nuevo
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `Árbol ${tipo}`);
            
            // Generar archivo y descargarlo
            const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
            XLSX.writeFile(wb, `Arbol_${tipo}_${fechaActual}.xlsx`);
            
            console.log('Excel generado exitosamente');
            alert(`Árbol de ${tipo} generado correctamente.`);
        })
        .catch(error => {
            console.error('Error al generar Excel:', error);
            alert(`Error al generar Excel: ${error.message}`);
        });
} 