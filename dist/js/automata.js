// Definición del autómata finito inicial para visualización
let automaton = {
    states: ['q10', 'q1'],
    alphabet: ['0', '1'],
    transitions: [
        { source: 'q10', input: '0', target: 'q1' },
        { source: 'q10', input: '1', target: 'q10' },
        { source: 'q1', input: '0', target: 'q10' },
        { source: 'q1', input: '1', target: 'q1' }
    ],
    initialState: 'q10',
    acceptStates: ['q1']
};

// Función para cargar un autómata desde archivo
function loadAutomatonFromFile() {
    let fileInput = document.getElementById('file-input');
    
    // Si no existe, lo creamos
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // Eliminamos listener previo y clonamos el input
    const newFileInput = fileInput.cloneNode(true);
    if (fileInput.parentNode) {
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
    }
    
    // Añadir nuevo listener
    const handleFileLoad = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validar la estructura del autómata
                if (validateAutomatonStructure(jsonData)) {
                    // Actualizar el autómata global
                    automaton = jsonData;
                    
                    // Actualizar la visualización
                    d3.select('#automaton').selectAll('*').remove();
                    initializeVisualization(automaton);
                    
                    // Mostrar mensaje de éxito
                    alert(`Autómata cargado con éxito: ${automaton.states.length} estados, ${automaton.transitions.length} transiciones`);
                    
                    // Añadir botones de descarga
                    window.addDownloadButtons();
                }
            } catch (error) {
                alert('Error al cargar el archivo: ' + error.message);
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // Eliminar el evento para evitar múltiples asociaciones
        newFileInput.removeEventListener('change', handleFileLoad);
    };
    
    newFileInput.addEventListener('change', handleFileLoad);
    newFileInput.click();
}

// Función para validar la estructura del autómata
function validateAutomatonStructure(data) {
    // Verificar que tenga todas las propiedades necesarias
    if (!data.states || !Array.isArray(data.states) || data.states.length === 0) {
        alert('Error: El autómata debe tener una lista de estados no vacía');
        return false;
    }
    
    if (!data.alphabet || !Array.isArray(data.alphabet) || data.alphabet.length === 0) {
        alert('Error: El autómata debe tener un alfabeto no vacío');
        return false;
    }
    
    if (!data.transitions || !Array.isArray(data.transitions)) {
        alert('Error: El autómata debe tener una lista de transiciones');
        return false;
    }
    
    if (!data.initialState || !data.states.includes(data.initialState)) {
        alert('Error: El autómata debe tener un estado inicial válido');
        return false;
    }
    
    if (!data.acceptStates || !Array.isArray(data.acceptStates)) {
        alert('Error: El autómata debe tener una lista de estados de aceptación');
        return false;
    }
    
    // Verificar que los estados de aceptación estén en la lista de estados
    for (const state of data.acceptStates) {
        if (!data.states.includes(state)) {
            alert(`Error: El estado de aceptación ${state} no está en la lista de estados`);
            return false;
        }
    }
    
    // Verificar que las transiciones tengan el formato correcto
    for (const transition of data.transitions) {
        if (!transition.source || !transition.input || !transition.target) {
            alert('Error: Todas las transiciones deben tener source, input y target');
            return false;
        }
        
        if (!data.states.includes(transition.source)) {
            alert(`Error: El estado origen ${transition.source} no está en la lista de estados`);
            return false;
        }
        
        if (!data.states.includes(transition.target)) {
            alert(`Error: El estado destino ${transition.target} no está en la lista de estados`);
            return false;
        }
        
        if (!data.alphabet.includes(transition.input)) {
            alert(`Error: El símbolo ${transition.input} no está en el alfabeto`);
            return false;
        }
    }
    
    return true;
}

// Configuración de la visualización
const width = 800;
const height = 600;
const nodeRadius = 40;

// Función para inicializar la visualización del autómata
function initializeVisualization(automaton) {
    // Preparar datos para D3
    const nodes = automaton.states.map(id => ({
        id,
        isInitial: id === automaton.initialState,
        isAccept: automaton.acceptStates.includes(id)
    }));

    // Asignar posiciones iniciales en círculo
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
    });

    // Crear enlaces a partir de transiciones
    const links = [];
    const transitionLabels = {};

    // Organizar transiciones múltiples entre los mismos estados
    automaton.transitions.forEach(t => {
        const linkKey = `${t.source}-${t.target}`;
        
        if (transitionLabels[linkKey]) {
            transitionLabels[linkKey] += `,${t.input}`;
        } else {
            transitionLabels[linkKey] = t.input;
            links.push({
                source: t.source,
                target: t.target,
                id: linkKey,
                isSelfLoop: t.source === t.target
            });
        }
    });

    // Crear SVG
    const svg = d3.select('#automaton')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', (event) => {
            g.attr('transform', event.transform);
        }));

    // Grupo principal para aplicar zoom
    const g = svg.append('g');

    // Definir flechas para las transiciones normales
    g.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', nodeRadius + 6)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#555');

    // Definir flechas para los bucles
    g.append('defs').append('marker')
        .attr('id', 'loop-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 0)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#555');

    // Crear simulación de fuerzas con parámetros mejorados
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(200).strength(0.7))
        .force('charge', d3.forceManyBody().strength(-1000))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(nodeRadius * 2.5))
        .alpha(0.8)
        .alphaDecay(0.01);

    // Dibujar bucles como arcos
    const loops = g.append('g')
        .attr('class', 'loops')
        .selectAll('path')
        .data(links.filter(l => l.isSelfLoop))
        .enter().append('path')
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#loop-arrow)');

    // Dibujar enlaces normales
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links.filter(l => !l.isSelfLoop))
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrowhead)');

    // Dibujar estados (nodos)
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter().append('g');

    // Círculo para cada estado con borde más notorio
    node.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', d => d.isAccept ? '#b7e1cd' : '#c9daf8')
        .attr('stroke', '#333')
        .attr('stroke-width', 3);

    // Segundo círculo para estados de aceptación
    node.filter(d => d.isAccept)
        .append('circle')
        .attr('r', nodeRadius - 7)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 2.5);

    // Marcador para estado inicial más visible
    node.filter(d => d.isInitial)
        .append('path')
        .attr('class', 'initial-state-marker')
        .attr('d', `M ${-nodeRadius - 25} 0 L ${-nodeRadius - 5} 0`)
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrowhead)');
        
    // Agregar símbolo "+" para estado inicial
    node.filter(d => d.isInitial)
        .append('text')
        .attr('class', 'initial-state-symbol')
        .attr('x', -nodeRadius - 30)
        .attr('y', 0)
        .attr('dy', '0.3em')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('+');

    // Etiquetas para los estados más grandes
    node.append('text')
        .attr('class', 'state-label')
        .attr('dy', '.35em')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(d => d.id);

    // Etiquetas para las transiciones con mejor visibilidad
    const linkLabels = g.append('g')
        .selectAll('text')
        .data(links)
        .enter().append('text')
        .attr('class', 'transition-label')
        .attr('dy', -8)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(d => transitionLabels[d.id]);

    // Funcionalidad de arrastrar nodos
    node.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Actualizar posiciones en cada tick de la simulación
    simulation.on('tick', () => {
        // Actualizar bucles
        loops.attr('d', d => {
            const x = d.source.x;
            const y = d.source.y;
            return `M ${x-nodeRadius},${y-nodeRadius/2} 
                    A ${nodeRadius*1.5},${nodeRadius*1.5} 0 1,1 ${x+nodeRadius},${y-nodeRadius/2}`;
        });

        // Actualizar enlaces normales
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => calculateEndpoint(d.source.x, d.source.y, d.target.x, d.target.y).x)
            .attr('y2', d => calculateEndpoint(d.source.x, d.source.y, d.target.x, d.target.y).y);
        
        // Actualizar posición de nodos
        node
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
        
        // Actualizar posición de etiquetas de transiciones
        linkLabels
            .attr('x', d => {
                if (d.isSelfLoop) {
                    return d.source.x;
                } else {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    return d.source.x + dx/2 + (dy !== 0 ? 15 * dy/Math.abs(dy) : 0);
                }
            })
            .attr('y', d => {
                if (d.isSelfLoop) {
                    return d.source.y - nodeRadius * 2.5;
                } else {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    return d.source.y + dy/2 - (dx !== 0 ? 15 * dx/Math.abs(dx) : 0);
                }
            });
    });

    // Función para calcular punto de conexión en el borde del círculo
    function calculateEndpoint(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: x2, y: y2 };
        
        // Ajustar para que la línea termine en el borde del círculo
        const ratio = (distance - nodeRadius) / distance;
        
        return {
            x: x1 + dx * ratio,
            y: y1 + dy * ratio
        };
    }

    // Funciones para arrastrar nodos
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // Mantener la posición fija después de arrastrar
        // Para liberar, descomenta las siguientes líneas
        // d.fx = null;
        // d.fy = null;
    }

    // Agregar botón para cargar desde archivo
    const controlDiv = document.querySelector('.controls') || document.createElement('div');
    if (!controlDiv.classList.contains('controls')) {
        controlDiv.className = 'controls';
        controlDiv.style.margin = '20px 0';
        document.body.insertBefore(controlDiv, document.getElementById('automaton'));
    }

    // Verificar si ya existe un botón de cargar archivo
    if (!document.getElementById('load-file-btn')) {
        // Agregar input para seleccionar archivo (oculto)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Agregar botón para cargar archivo
        const loadFileBtn = document.createElement('button');
        loadFileBtn.id = 'load-file-btn';
        loadFileBtn.textContent = 'Cargar desde Archivo';
        loadFileBtn.style.marginLeft = '10px';
        controlDiv.appendChild(loadFileBtn);
        
        // Evento para el botón de cargar archivo
        loadFileBtn.addEventListener('click', loadAutomatonFromFile);
    }

    // Agregar botón para descargar ejemplo JSON
    if (!document.getElementById('download-example-btn')) {
        const downloadExampleBtn = document.createElement('button');
        downloadExampleBtn.id = 'download-example-btn';
        downloadExampleBtn.textContent = 'Descargar Ejemplo';
        downloadExampleBtn.style.marginLeft = '10px';
        controlDiv.appendChild(downloadExampleBtn);
        
        // Evento para el botón de descargar ejemplo
        downloadExampleBtn.addEventListener('click', function() {
            const exampleAutomaton = {
                states: ['q0', 'q1', 'q2'],
                alphabet: ['0', '1'],
                transitions: [
                    { source: 'q0', input: '0', target: 'q1' },
                    { source: 'q0', input: '1', target: 'q0' },
                    { source: 'q1', input: '0', target: 'q2' },
                    { source: 'q1', input: '1', target: 'q0' },
                    { source: 'q2', input: '0', target: 'q2' },
                    { source: 'q2', input: '1', target: 'q2' }
                ],
                initialState: 'q0',
                acceptStates: ['q2']
            };
            
            const jsonString = JSON.stringify(exampleAutomaton, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'automaton-example.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Configurar botones de control
    if (document.getElementById('reset-zoom')) {
        document.getElementById('reset-zoom').addEventListener('click', () => {
            svg.transition().duration(750).call(
                d3.zoom().transform,
                d3.zoomIdentity
            );
        });
    }

    if (document.getElementById('randomize')) {
        document.getElementById('randomize').addEventListener('click', () => {
            nodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
            simulation.alpha(1).restart();
        });
    }

    // Retornar objetos importantes para actualización futura
    return { svg, g, simulation };
}

// Función para actualizar la visualización con un nuevo autómata
window.updateVisualization = function(newAutomaton) {
    // Limpiar visualización anterior
    d3.select('#automaton').selectAll('*').remove();
    
    // Inicializar con el nuevo autómata
    automaton = newAutomaton;
    const viz = initializeVisualization(automaton);
    
    // Mostrar información del autómata resultante
    const resultInfo = document.createElement('div');
    resultInfo.className = 'result-info';
    resultInfo.style.marginTop = '20px';
    resultInfo.style.padding = '10px';
    resultInfo.style.backgroundColor = '#f8f9fa';
    resultInfo.style.border = '1px solid #ddd';
    
    resultInfo.innerHTML = `
        <h3>Autómata Resultante</h3>
        <p><strong>Estados:</strong> ${automaton.states.join(', ')}</p>
        <p><strong>Alfabeto:</strong> ${automaton.alphabet.join(', ')}</p>
        <p><strong>Estado inicial:</strong> ${automaton.initialState}</p>
        <p><strong>Estados de aceptación:</strong> ${automaton.acceptStates.join(', ')}</p>
        <p><strong>Número de estados:</strong> ${automaton.states.length}</p>
        <p><strong>Número de transiciones:</strong> ${automaton.transitions.length}</p>
    `;
    
    document.getElementById('automaton').appendChild(resultInfo);
    
    // Añadir botones de descarga
    window.addDownloadButtons();
};

// Función para descargar la imagen del autómata
window.downloadAutomatonImage = function() {
    try {
        // Obtener el SVG
        const svgElement = document.querySelector('#automaton svg');
        if (!svgElement) {
            alert('No se encontró la visualización del autómata');
            return;
        }
        
        // Clonar el SVG para no modificar el original
        const svgClone = svgElement.cloneNode(true);
        
        // Aplicar estilos directamente al SVG
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .nodes circle { fill: #c9daf8; }
            .accept-state { stroke: #333; stroke-width: 2px; }
            .links line { stroke: #999; stroke-opacity: 0.6; }
            .transition-label { font-size: 14px; fill: #333; }
            .state-label { font-size: 16px; font-weight: bold; text-anchor: middle; }
            .initial-state-symbol { fill: #d62728; }
        `;
        svgClone.insertBefore(styleElement, svgClone.firstChild);
        
        // Configurar atributos para SVG independiente
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgClone.setAttribute('version', '1.1');
        
        // Convertir a cadena de texto
        const svgString = new XMLSerializer().serializeToString(svgClone);
        
        // Crear una imagen a partir del SVG
        const img = new Image();
        img.onload = function() {
            // Crear un canvas para dibujar la imagen
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.width.baseVal.value;
            canvas.height = svgElement.height.baseVal.value;
            
            // Dibujar fondo blanco y la imagen
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convertir canvas a URL de datos
            try {
                const dataUrl = canvas.toDataURL('image/png');
                
                // Crear enlace para descargar
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'automata.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                console.error('Error al convertir a PNG:', e);
                downloadSVG(svgString);
            }
        };
        
        // Manejar errores en la carga de la imagen
        img.onerror = function() {
            console.error('Error al cargar la imagen desde SVG');
            downloadSVG(svgString);
        };
        
        // Convertir SVG a data URL e iniciar la carga
        const blob = new Blob([svgString], {type: 'image/svg+xml'});
        img.src = URL.createObjectURL(blob);
        
    } catch (error) {
        console.error('Error al descargar la imagen:', error);
        alert('Error al descargar la imagen: ' + error.message);
    }
};

// Función para descargar el SVG directamente
function downloadSVG(svgString) {
    const blob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automata.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Se ha descargado como SVG en lugar de PNG debido a limitaciones técnicas.');
}

// Función para descargar la quintupla del autómata como texto
window.downloadAutomatonText = function() {
    try {
        // Formatear la quintupla del autómata como texto
        let text = '=== QUINTUPLA DEL AUTÓMATA FINITO DETERMINISTA ===\n\n';
        
        text += '1. CONJUNTO DE ESTADOS (Q):\n';
        text += `   ${automaton.states.join(', ')}\n\n`;
        
        text += '2. ALFABETO (Σ):\n';
        text += `   ${automaton.alphabet.join(', ')}\n\n`;
        
        text += '3. FUNCIÓN DE TRANSICIÓN (δ: Q × Σ → Q):\n';
        // Organizar transiciones por estado origen para mejor legibilidad
        const transitionsBySource = {};
        automaton.states.forEach(state => {
            transitionsBySource[state] = [];
        });
        
        automaton.transitions.forEach(t => {
            transitionsBySource[t.source].push(`δ(${t.source}, ${t.input}) = ${t.target}`);
        });
        
        for (const state in transitionsBySource) {
            transitionsBySource[state].forEach(transition => {
                text += `   ${transition}\n`;
            });
        }
        text += '\n';
        
        text += '4. ESTADO INICIAL (q₀):\n';
        text += `   ${automaton.initialState}\n\n`;
        
        text += '5. CONJUNTO DE ESTADOS DE ACEPTACIÓN (F):\n';
        text += `   ${automaton.acceptStates.join(', ')}\n\n`;
        
        text += '=== INFORMACIÓN ADICIONAL ===\n\n';
        text += `• Número total de estados: ${automaton.states.length}\n`;
        text += `• Tamaño del alfabeto: ${automaton.alphabet.length}\n`;
        text += `• Número total de transiciones: ${automaton.transitions.length}\n`;
        
        // Crear blob y descargar
        const blob = new Blob([text], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'automata-quintupla.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error al descargar el texto:', error);
        alert('Error al descargar el texto: ' + error.message);
    }
};

// Función para añadir botones de descarga
window.addDownloadButtons = function() {
    // Verificar que no existan ya los botones
    const existingContainer = document.getElementById('download-buttons-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Contenedor para los botones de descarga
    const downloadContainer = document.createElement('div');
    downloadContainer.id = 'download-buttons-container';
    downloadContainer.style.marginTop = '20px';
    downloadContainer.style.textAlign = 'center';
    
    // Botón para descargar imagen
    const downloadImageBtn = document.createElement('button');
    downloadImageBtn.textContent = 'Descargar Imagen del Autómata';
    downloadImageBtn.style.margin = '10px';
    downloadImageBtn.style.padding = '10px 20px';
    downloadImageBtn.style.backgroundColor = '#2196F3';
    downloadImageBtn.style.color = 'white';
    downloadImageBtn.style.border = 'none';
    downloadImageBtn.style.borderRadius = '4px';
    downloadImageBtn.style.cursor = 'pointer';
    
    // Botón para descargar quintupla
    const downloadTextBtn = document.createElement('button');
    downloadTextBtn.textContent = 'Descargar Quintupla (TXT)';
    downloadTextBtn.style.margin = '10px';
    downloadTextBtn.style.padding = '10px 20px';
    downloadTextBtn.style.backgroundColor = '#4CAF50';
    downloadTextBtn.style.color = 'white';
    downloadTextBtn.style.border = 'none';
    downloadTextBtn.style.borderRadius = '4px';
    downloadTextBtn.style.cursor = 'pointer';
    
    // Añadir botones al contenedor
    downloadContainer.appendChild(downloadImageBtn);
    downloadContainer.appendChild(downloadTextBtn);
    
    // Añadir el contenedor después del automaton
    const automatonDiv = document.getElementById('automaton');
    if (automatonDiv) {
        automatonDiv.appendChild(downloadContainer);
    } else {
        document.body.appendChild(downloadContainer);
    }
    
    // Evento para descargar imagen
    downloadImageBtn.addEventListener('click', window.downloadAutomatonImage);
    
    // Evento para descargar texto
    downloadTextBtn.addEventListener('click', window.downloadAutomatonText);
};

// Inicializar la visualización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Asegurarse de que existe el contenedor para el autómata
    if (!document.getElementById('automaton')) {
        const automatonDiv = document.createElement('div');
        automatonDiv.id = 'automaton';
        document.body.appendChild(automatonDiv);
    }
    
    // Conectar botones de exportación del HTML con las funciones de descarga
    if (document.getElementById('export-quintuple-btn')) {
        document.getElementById('export-quintuple-btn').addEventListener('click', function() {
            window.downloadAutomatonText();
        });
    }
    
    if (document.getElementById('export-png-btn')) {
        document.getElementById('export-png-btn').addEventListener('click', function() {
            window.downloadAutomatonImage();
        });
    }
    
    // Conectar el botón de carga de archivo del HTML
    if (document.getElementById('load-file-btn')) {
        document.getElementById('load-file-btn').addEventListener('click', loadAutomatonFromFile);
    }
    
    // Crear los botones de control si no existen
    if (!document.querySelector('.controls')) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        controlsDiv.style.margin = '20px 0';
        
        const resetZoomBtn = document.createElement('button');
        resetZoomBtn.id = 'reset-zoom';
        resetZoomBtn.textContent = 'Restablecer Zoom';
        controlsDiv.appendChild(resetZoomBtn);
        
        const randomizeBtn = document.createElement('button');
        randomizeBtn.id = 'randomize';
        randomizeBtn.textContent = 'Reorganizar';
        randomizeBtn.style.marginLeft = '10px';
        controlsDiv.appendChild(randomizeBtn);
        
        document.body.insertBefore(controlsDiv, document.getElementById('automaton'));
    }
    
    initializeVisualization(automaton);
});