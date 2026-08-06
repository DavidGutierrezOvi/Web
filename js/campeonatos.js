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

    html += renderizarArbolHorizontal(tipo, campeonato, parejas, rondas);

    bracket.innerHTML = html;

    const horizontalSection = bracket.querySelector('.horizontal-bracket-section');
    if (horizontalSection) {
        inicializarLienzoHorizontal(horizontalSection);
    }
}

/**
 * Renderiza el árbol horizontal del campeonato
 * @param {string} tipo - Tipo de campeonato
 * @param {Object} campeonato - Datos del campeonato
 * @param {Object} parejas - Datos de las parejas
 * @param {Array} rondas - Rondas ordenadas
 * @returns {string} HTML del árbol horizontal
 */
function renderizarArbolHorizontal(tipo, campeonato, parejas, rondas) {
    const layout = calcularLayoutHorizontal(campeonato, rondas);

    if (!layout.nodes.length) {
        return '';
    }

    const titulo = `Árbol horizontal de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const ancho = layout.width + 80;
    const alto = layout.height + 80;

    const encabezadosRonda = rondas.map((ronda, index) => {
        const x = layout.leftMargin + (index * layout.roundGap);
        return `
            <div class="horizontal-round-header" style="left:${x}px; width:${layout.nodeWidth}px;">
                ${getNombreRonda(ronda, rondas.length)}
            </div>
        `;
    }).join('');

    const svgPaths = layout.connectors.map(connector => `
        <path d="${connector.path}" class="horizontal-connector ${connector.estadoClase}" />
    `).join('');

    const nodos = layout.nodes.map(node => {
        const partido = node.partido || {};
        const estadoClase = getEstadoClase(partido.estado);
        const estadoTexto = getEstadoTexto(partido.estado);
        const numero1 = isValidValue(partido.p1) ? partido.p1 : '—';
        const numero2 = isValidValue(partido.p2) ? partido.p2 : '—';
        const ganador1 = partido.ganador === 'p1';
        const ganador2 = partido.ganador === 'p2';

        return `
            <article class="horizontal-match ${estadoClase}" style="left:${node.x}px; top:${node.y}px; width:${node.width}px; height:${node.height}px;">
                <div class="horizontal-match-head">
                    <div class="horizontal-match-badge">${estadoTexto}</div>
                </div>
                <div class="horizontal-match-teams">
                    <span class="horizontal-team-number ${ganador1 ? 'winner' : ''}">#${numero1}</span>
                    <span class="horizontal-team-number ${ganador2 ? 'winner' : ''}">#${numero2}</span>
                </div>
            </article>
        `;
    }).join('');

    return `
        <div class="horizontal-bracket-section" data-horizontal-canvas="${tipo}">
            <div class="horizontal-bracket-header">
                <h3>${titulo}</h3>
                <p>Arrastra para mover el árbol y usa la rueda del ratón para ampliar o reducir la vista.</p>
                <div class="horizontal-bracket-controls">
                    <button type="button" class="horizontal-control-btn" data-action="zoom-out">-</button>
                    <button type="button" class="horizontal-control-btn" data-action="fit">Ajustar</button>
                    <button type="button" class="horizontal-control-btn" data-action="reset">Reset</button>
                    <button type="button" class="horizontal-control-btn" data-action="zoom-in">+</button>
                </div>
            </div>
            <div class="horizontal-bracket-viewport">
                <div class="horizontal-bracket-stage" data-stage="${tipo}" style="width:${ancho}px; height:${alto}px;">
                    <div class="horizontal-round-headers">
                        ${encabezadosRonda}
                    </div>
                    <svg class="horizontal-connector-layer" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="none" aria-hidden="true">
                        ${svgPaths}
                    </svg>
                    ${nodos}
                </div>
            </div>
        </div>
    `;
}

/**
 * Inicializa los controles de la vista horizontal tipo lienzo
 * @param {HTMLElement} section - Sección del árbol horizontal
 */
function inicializarLienzoHorizontal(section) {
    const viewport = section.querySelector('.horizontal-bracket-viewport');
    const stage = section.querySelector('.horizontal-bracket-stage');
    const controls = section.querySelectorAll('.horizontal-control-btn');

    if (!viewport || !stage) {
        return;
    }

    const state = {
        scale: 1,
        panX: 0,
        panY: 0,
        minScale: 0.35,
        maxScale: 2.5,
        dragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragOriginX: 0,
        dragOriginY: 0
    };

    section._horizontalState = state;

    const applyTransform = () => {
        stage.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    };

    const fitToViewport = () => {
        const viewportRect = viewport.getBoundingClientRect();
        const stageWidth = parseFloat(stage.style.width) || stage.offsetWidth;
        const stageHeight = parseFloat(stage.style.height) || stage.offsetHeight;
        const padding = 48;
        const fitScale = Math.min(
            (viewportRect.width - padding) / stageWidth,
            (viewportRect.height - padding) / stageHeight,
            1
        );
        state.scale = Math.max(state.minScale, Math.min(fitScale, state.maxScale));
        const visibleWidth = stageWidth * state.scale;
        const visibleHeight = stageHeight * state.scale;
        state.panX = Math.max((viewportRect.width - visibleWidth) / 2, 24);
        state.panY = Math.max((viewportRect.height - visibleHeight) / 2, 24);
        applyTransform();
    };

    const zoomAtPoint = (factor, clientX, clientY) => {
        const rect = viewport.getBoundingClientRect();
        const pointX = clientX - rect.left;
        const pointY = clientY - rect.top;
        const oldScale = state.scale;
        const newScale = Math.max(state.minScale, Math.min(oldScale * factor, state.maxScale));

        const worldX = (pointX - state.panX) / oldScale;
        const worldY = (pointY - state.panY) / oldScale;

        state.scale = newScale;
        state.panX = pointX - (worldX * newScale);
        state.panY = pointY - (worldY * newScale);
        applyTransform();
    };

    controls.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            const rect = viewport.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            switch (action) {
                case 'zoom-in':
                    zoomAtPoint(1.15, centerX, centerY);
                    break;
                case 'zoom-out':
                    zoomAtPoint(0.87, centerX, centerY);
                    break;
                case 'fit':
                    fitToViewport();
                    break;
                case 'reset':
                    state.scale = 1;
                    state.panX = 0;
                    state.panY = 0;
                    applyTransform();
                    break;
                default:
                    break;
            }
        });
    });

    viewport.addEventListener('wheel', (event) => {
        event.preventDefault();
        const factor = event.deltaY < 0 ? 1.1 : 0.9;
        zoomAtPoint(factor, event.clientX, event.clientY);
    }, { passive: false });

    viewport.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) {
            return;
        }

        state.dragging = true;
        state.dragStartX = event.clientX;
        state.dragStartY = event.clientY;
        state.dragOriginX = state.panX;
        state.dragOriginY = state.panY;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', (event) => {
        if (!state.dragging) {
            return;
        }

        state.panX = state.dragOriginX + (event.clientX - state.dragStartX);
        state.panY = state.dragOriginY + (event.clientY - state.dragStartY);
        applyTransform();
    });

    const stopDragging = (event) => {
        if (!state.dragging) {
            return;
        }

        state.dragging = false;
        viewport.classList.remove('is-dragging');

        if (viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }
    };

    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);
    viewport.addEventListener('mouseleave', () => {
        state.dragging = false;
        viewport.classList.remove('is-dragging');
    });

    window.addEventListener('resize', fitToViewport, { once: true });
    setTimeout(fitToViewport, 0);
}

/**
 * Calcula posiciones y conexiones del árbol horizontal
 * @param {Object} campeonato - Datos del campeonato
 * @param {Array} rondas - Rondas ordenadas
 * @returns {Object} Layout calculado
 */
function calcularLayoutHorizontal(campeonato, rondas) {
    const NODE_WIDTH = 210;
    const NODE_HEIGHT = 108;
    const ROUND_GAP = 250;
    const VERTICAL_GAP = 30;
    const HEADER_SPACE = 44;
    const TOP_MARGIN = 20 + HEADER_SPACE;
    const LEFT_MARGIN = 20;
    const MIN_SEPARATION = NODE_HEIGHT + VERTICAL_GAP;

    const nodes = [];
    const nodesPorRonda = {};
    const nodeByKey = {};
    const incomingByDestination = {};
    const links = [];
    const connectors = [];
    let maxBottom = 0;

    const getKey = (ronda, matchIndex) => `${String(ronda)}:${matchIndex}`;

    const obtenerDestinoPartido = (ronda, matchIndex, partido) => {
        if (partido && partido.destino) {
            const destinoRonda = String(partido.destino.ronda);
            const destinoPartido = parseInt(partido.destino.partido, 10);
            const destinoPosicion = partido.destino.posicion === 'p2' ? 'p2' : 'p1';

            if (campeonato[destinoRonda] && campeonato[destinoRonda][destinoPartido]) {
                return {
                    ronda: destinoRonda,
                    matchIndex: destinoPartido,
                    posicion: destinoPosicion,
                    porDestinoExplicito: true
                };
            }
        }

        const rondaNum = parseInt(ronda, 10);
        const siguienteRonda = String(rondaNum + 1);
        const partidosSiguiente = campeonato[siguienteRonda];
        if (!Array.isArray(partidosSiguiente) || partidosSiguiente.length === 0) {
            return null;
        }

        if (rondaNum === 0 && matchIndex < partidosSiguiente.length) {
            return {
                ronda: siguienteRonda,
                matchIndex,
                posicion: 'p1',
                porDestinoExplicito: false
            };
        }

        const destinoPartido = Math.floor(matchIndex / 2);
        if (!partidosSiguiente[destinoPartido]) {
            return null;
        }

        return {
            ronda: siguienteRonda,
            matchIndex: destinoPartido,
            posicion: matchIndex % 2 === 1 ? 'p2' : 'p1',
            porDestinoExplicito: false
        };
    };

    // Crear nodos con posición base por índice (de arriba hacia abajo).
    rondas.forEach((ronda, roundIndex) => {
        const partidos = campeonato[ronda] || [];
        nodesPorRonda[ronda] = [];

        partidos.forEach((partido, matchIndex) => {
            const node = {
                ronda,
                roundIndex,
                matchIndex,
                partido,
                x: LEFT_MARGIN + roundIndex * ROUND_GAP,
                y: TOP_MARGIN + matchIndex * (NODE_HEIGHT + VERTICAL_GAP),
                width: NODE_WIDTH,
                height: NODE_HEIGHT
            };

            nodes.push(node);
            nodesPorRonda[ronda].push(node);
            nodeByKey[getKey(ronda, matchIndex)] = node;
        });
    });

    // Construir grafo de relaciones reales entre partidos.
    rondas.forEach((ronda, roundIndex) => {
        if (roundIndex >= rondas.length - 1) {
            return;
        }

        const partidos = campeonato[ronda] || [];
        partidos.forEach((partido, matchIndex) => {
            const sourceKey = getKey(ronda, matchIndex);
            const destino = obtenerDestinoPartido(ronda, matchIndex, partido);

            if (!destino) {
                return;
            }

            const destKey = getKey(destino.ronda, destino.matchIndex);
            if (!nodeByKey[destKey]) {
                return;
            }

            if (!incomingByDestination[destKey]) {
                incomingByDestination[destKey] = [];
            }

            incomingByDestination[destKey].push({ sourceKey, posicion: destino.posicion });
            links.push({ sourceKey, destKey });
        });
    });

    const alinearRondaPorOrigen = (nodesRonda) => {
        nodesRonda.forEach((node) => {
            const destKey = getKey(node.ronda, node.matchIndex);
            const incoming = incomingByDestination[destKey] || [];

            if (!incoming.length) {
                return;
            }

            const centros = incoming
                .map(link => nodeByKey[link.sourceKey])
                .filter(Boolean)
                .map(sourceNode => sourceNode.y + (NODE_HEIGHT / 2));

            if (!centros.length) {
                return;
            }

            const mediaCentro = centros.reduce((acc, value) => acc + value, 0) / centros.length;
            node.y = mediaCentro - (NODE_HEIGHT / 2);
        });
    };

    const resolverColisionesSinReordenar = (nodesRonda) => {
        if (!nodesRonda.length) {
            return;
        }

        // Mantener orden natural del cuadro (matchIndex), solo corrigiendo alturas.
        const ordenados = [...nodesRonda].sort((a, b) => a.matchIndex - b.matchIndex);

        // Empuje hacia abajo.
        for (let i = 1; i < ordenados.length; i++) {
            const previo = ordenados[i - 1];
            const actual = ordenados[i];
            const minY = previo.y + MIN_SEPARATION;

            if (actual.y < minY) {
                actual.y = minY;
            }
        }

        // Ajuste global para no dejar la columna fuera del margen superior.
        const desplazamiento = TOP_MARGIN - ordenados[0].y;
        if (desplazamiento > 0) {
            ordenados.forEach(node => {
                node.y += desplazamiento;
            });
        }
    };

    // Calcular Y por propagación de izquierda a derecha, respetando orden natural en cada ronda.
    for (let roundIndex = 1; roundIndex < rondas.length; roundIndex++) {
        const ronda = rondas[roundIndex];
        const nodesRonda = nodesPorRonda[ronda] || [];

        alinearRondaPorOrigen(nodesRonda);
        resolverColisionesSinReordenar(nodesRonda);
    }

    // Generar líneas con las posiciones ya corregidas.
    links.forEach(link => {
        const source = nodeByKey[link.sourceKey];
        const destination = nodeByKey[link.destKey];

        if (!source || !destination) {
            return;
        }

        const startX = source.x + NODE_WIDTH;
        const startY = source.y + NODE_HEIGHT / 2;
        const endX = destination.x;
        const endY = destination.y + NODE_HEIGHT / 2;
        const elbowX = startX + ((endX - startX) / 2);
        const estadoClase = getEstadoClase(destination.partido && destination.partido.estado);

        connectors.push({
            path: `M ${startX} ${startY} H ${elbowX} V ${endY} H ${endX}`,
            estadoClase
        });
    });

    nodes.forEach(node => {
        maxBottom = Math.max(maxBottom, node.y + NODE_HEIGHT);
    });

    return {
        nodes,
        connectors,
        width: LEFT_MARGIN + ((rondas.length - 1) * ROUND_GAP) + NODE_WIDTH + LEFT_MARGIN,
        height: maxBottom + TOP_MARGIN,
        leftMargin: LEFT_MARGIN,
        roundGap: ROUND_GAP,
        nodeWidth: NODE_WIDTH,
        headerSpace: HEADER_SPACE
    };
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
    // Si estamos en la ronda 1, verificamos si existe una ronda "0" o "preliminar"
    if (rondaActual === "1" || rondaActual === 1) {
        // Verificar si existe una ronda "0" o "preliminar"
        if (campeonato["0"] || campeonato["preliminar"]) {
            const rondaPrevia = campeonato["0"] ? "0" : "preliminar";
            
            // Calcular el índice del partido en la ronda preliminar
            // Esta lógica puede variar según la estructura del torneo
            let partidoPrevioIndice = posicionRival === 'p1' ? partidoActual * 2 : partidoActual * 2 + 1;
            
            // Verificar si existe ese partido en la ronda preliminar
            if (!campeonato[rondaPrevia][partidoPrevioIndice]) {
                // Probar con fórmulas alternativas si es necesario
                partidoPrevioIndice = Math.floor(partidoActual / 2);
                
                if (!campeonato[rondaPrevia][partidoPrevioIndice]) {
                    return null;
                }
            }
            
            const partidoPrevio = campeonato[rondaPrevia][partidoPrevioIndice];
            
            // Asegurarnos que el partido previo existe y tiene la estructura correcta
            if (!partidoPrevio) return null;
            
            // Verificar y corregir p1 y p2 si son "undefined"
            if (partidoPrevio.p1 === "undefined") partidoPrevio.p1 = null;
            if (partidoPrevio.p2 === "undefined") partidoPrevio.p2 = null;
            
            return {
                ronda: rondaPrevia,
                indice: partidoPrevioIndice,
                partido: partidoPrevio,
                equipo1: partidoPrevio.p1,
                equipo2: partidoPrevio.p2,
                posicion: posicionRival
            };
        }
        
        return null;
    }
    
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
                                        ${ronda === "1" || ronda === 1 ? 
                                        `<p>Tu rival aún no está definido. En la primera ronda, los rivales suelen asignarse directamente por la organización del torneo.</p>` :
                                        `<p>Tu rival aún no está definido. Espera a que se complete la ronda anterior.</p>`}
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