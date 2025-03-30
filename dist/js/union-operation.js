document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de unión usando hash
    if (window.location.hash !== '#/union') {
        return;
    }
});

// Funciones para realizar la operación de unión entre autómatas
const automataOperations = {
    /**
     * Realiza la unión de dos AFDs.
     * @param {Object} afd1 - Primer autómata finito determinista
     * @param {Object} afd2 - Segundo autómata finito determinista
     * @returns {Object} - AFD resultante de la unión
     */
    
    union: function(afd1, afd2) {
        // Verificar que ambos autómatas compartan el mismo alfabeto
        const alphabet = [...new Set([...afd1.alphabet, ...afd2.alphabet])];
        
        const result = {
            states: [],
            alphabet: alphabet,
            transitions: [],
            initialState: null,
            acceptStates: []
        };

        // Crear el producto cartesiano de estados
        const stateMap = new Map(); // Para mapear pares de estados a nuevos IDs
        let stateId = 0;

        // Crear el estado inicial
        const initialStatePair = `${afd1.initialState},${afd2.initialState}`;
        result.initialState = `q${stateId}`;
        stateMap.set(initialStatePair, `q${stateId}`);
        result.states.push(`q${stateId}`);
        
        // Si cualquiera de los estados iniciales es de aceptación, el estado combinado es de aceptación
        if (afd1.acceptStates.includes(afd1.initialState) || afd2.acceptStates.includes(afd2.initialState)) {
            result.acceptStates.push(`q${stateId}`);
        }
        
        stateId++;
        
        // Procesar estados usando BFS
        const queue = [initialStatePair];
        const visited = new Set([initialStatePair]);
        
        while (queue.length > 0) {
            const currentPair = queue.shift();
            const [state1, state2] = currentPair.split(',');
            const currentStateId = stateMap.get(currentPair);
            
            // Por cada símbolo en el alfabeto
            for (const symbol of alphabet) {
                let nextState1 = this.getTransition(afd1, state1, symbol) || 'dead';
                let nextState2 = this.getTransition(afd2, state2, symbol) || 'dead';
                
                // Crear el siguiente par de estados
                const nextPair = `${nextState1},${nextState2}`;
                
                // Verificar si este par ya ha sido procesado
                if (!stateMap.has(nextPair)) {
                    const newStateId = `q${stateId++}`;
                    stateMap.set(nextPair, newStateId);
                    result.states.push(newStateId);
                    
                    // Determinar si es un estado de aceptación
                    if (afd1.acceptStates.includes(nextState1) || afd2.acceptStates.includes(nextState2)) {
                        result.acceptStates.push(newStateId);
                    }
                    
                    // Añadir a la cola para procesar sus transiciones
                    if (!visited.has(nextPair)) {
                        queue.push(nextPair);
                        visited.add(nextPair);
                    }
                }
                
                // Añadir la transición
                const nextStateId = stateMap.get(nextPair);
                result.transitions.push({
                    source: currentStateId,
                    input: symbol,
                    target: nextStateId
                });
            }
        }
        
        return result;
    },
    
    /**
     * Obtiene el estado destino para una transición dada
     * @param {Object} afd - Autómata finito determinista
     * @param {string} state - Estado actual
     * @param {string} symbol - Símbolo de entrada
     * @returns {string|null} - Estado destino o null si no existe la transición
     */
    getTransition: function(afd, state, symbol) {
        if (state === 'dead') return 'dead';
        
        const transition = afd.transitions.find(t => 
            t.source === state && t.input === symbol
        );
        
        return transition ? transition.target : null;
    },
    
    /**
     * Convierte el resultado de la unión a un formato adecuado para visualización
     * @param {Object} afd - Autómata finito resultante de la unión
     * @returns {Object} - Objeto con formato para visualización D3
     */
    formatForVisualization: function(afd) {
        return {
            states: afd.states,
            alphabet: afd.alphabet,
            transitions: afd.transitions,
            initialState: afd.initialState,
            acceptStates: afd.acceptStates
        };
    },
    
    /**
     * Genera una representación de quintupla formal del autómata
     * @param {Object} automaton - Autómata a convertir
     * @returns {string} - Representación de quintupla del autómata
     */
    generateQuintuple: function(automaton) {
        // Crear la quintupla M = (Q, Σ, δ, q0, F)
        let quintuple = "Quintupla formal del autómata finito:\n\n";
        quintuple += "M = (Q, Σ, δ, q0, F)\n\n";
        
        // Conjunto de estados Q
        quintuple += "Q = {" + automaton.states.join(", ") + "}\n\n";
        
        // Alfabeto Σ
        quintuple += "Σ = {" + automaton.alphabet.join(", ") + "}\n\n";
        
        // Función de transición δ
        quintuple += "δ: Q × Σ → Q\n";
        
        // Tabla de transiciones
        quintuple += "Tabla de transiciones:\n";
        quintuple += "Estado\t| " + automaton.alphabet.map(symbol => `δ(q,${symbol})`).join("\t| ") + "\n";
        quintuple += "-".repeat(80) + "\n";
        
        // Para cada estado, mostrar sus transiciones
        for (const state of automaton.states) {
            let row = state + "\t| ";
            
            for (const symbol of automaton.alphabet) {
                const transition = automaton.transitions.find(t => 
                    t.source === state && t.input === symbol
                );
                row += (transition ? transition.target : "-") + "\t| ";
            }
            
            quintuple += row.trim() + "\n";
        }
        
        quintuple += "\n";
        
        // Estado inicial q0
        quintuple += "q0 = " + automaton.initialState + "\n\n";
        
        // Conjunto de estados de aceptación F
        quintuple += "F = {" + automaton.acceptStates.join(", ") + "}\n";
        
        return quintuple;
    }
};

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

// Función para exportar la quintupla como archivo TXT
function exportQuintupleTxt(automaton, filename) {
    const quintuple = automataOperations.generateQuintuple(automaton);
    const blob = new Blob([quintuple], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'automaton_quintuple.txt';
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Función para exportar el autómata como imagen PNG
function exportAutomatonAsPNG(automatonElement, filename) {
    if (!automatonElement) {
        console.error('No se encontró el elemento del autómata');
        alert('Error: No se pudo encontrar la visualización del autómata');
        return;
    }
    
    // Verificar que d3 esté disponible
    if (!window.d3) {
        console.error('d3.js no está disponible');
        alert('Error: No se pudo generar la imagen. d3.js no está disponible.');
        return;
    }
    
    try {
        // Crear un canvas temporal
        const svgElement = automatonElement.querySelector('svg');
        if (!svgElement) {
            console.error('No se encontró el elemento SVG');
            alert('Error: No se pudo encontrar la visualización SVG del autómata');
            return;
        }
        
        // Obtener el contenido SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Configurar las dimensiones del canvas
        const svgRect = svgElement.getBoundingClientRect();
        canvas.width = svgRect.width;
        canvas.height = svgRect.height;
        
        // Crear imagen desde SVG
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            // Dibujar en el canvas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convertir a PNG y descargar
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = filename || 'automaton.png';
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        };
        
        img.src = url;
    } catch (error) {
        console.error('Error al exportar como PNG:', error);
        alert('Error al generar la imagen: ' + error.message);
    }
}

// Función para cargar un autómata desde archivo
function loadAutomatonFromFile(inputId, callback) {
    const fileInput = document.getElementById(inputId);
    
    const handleFileLoad = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validar la estructura del autómata
                if (validateAutomatonStructure(jsonData)) {
                    callback(jsonData);
                    // Mostrar mensaje de éxito
                    const automatonId = inputId.includes('1') ? 1 : 2;
                    const dataContainer = document.getElementById(`data-container-${automatonId}`);
                    if (dataContainer) {
                        dataContainer.innerHTML = `
                            <h4>Datos cargados:</h4>
                            <p><strong>Estados:</strong> ${jsonData.states.join(', ')}</p>
                            <p><strong>Alfabeto:</strong> ${jsonData.alphabet.join(', ')}</p>
                            <p><strong>Estado inicial:</strong> ${jsonData.initialState}</p>
                            <p><strong>Estados de aceptación:</strong> ${jsonData.acceptStates.join(', ')}</p>
                        `;
                    }
                }
            } catch (error) {
                alert('Error al cargar el archivo: ' + error.message);
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // Eliminar el evento para evitar múltiples asociaciones
        fileInput.removeEventListener('change', handleFileLoad);
    };
    
    fileInput.addEventListener('change', handleFileLoad);
    fileInput.click();
}

// Ahora debes agregar la interfaz para que el usuario pueda ingresar dos autómatas
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de unión
    if (window.location.pathname !== '/union' && !window.location.pathname.includes('union.html')) {
        return;
    }
    
    // Crear contenedor para la interfaz
    const container = document.createElement('div');
    container.className = 'automata-operations';
    container.style.margin = '20px';
    container.style.padding = '20px';
    container.style.border = '1px solid #ddd';
    container.style.borderRadius = '5px';
    container.style.backgroundColor = '#f9f9f9';
    
    // Insertar en el contenedor correcto
    const unionContainer = document.getElementById('union-container');
    if (unionContainer) {
        unionContainer.appendChild(container);
    }
    
    
    // Título
    const title = document.createElement('h2');
    title.textContent = 'Operación de Unión de AFDs';
    title.style.marginBottom = '20px';
    container.appendChild(title);
    
    // Descripción
    const description = document.createElement('p');
    description.textContent = 'Carga dos autómatas desde archivos JSON y realiza la operación de unión para obtener un autómata que acepte ambos lenguajes.';
    description.style.marginBottom = '20px';
    container.appendChild(description);
    
    // Contenedor para los autómatas
    const automataContainer = document.createElement('div');
    automataContainer.className = 'automata-inputs';
    automataContainer.style.display = 'flex';
    automataContainer.style.justifyContent = 'space-between';
    automataContainer.style.flexWrap = 'wrap';
    container.appendChild(automataContainer);
    
    // Crear contenedor para el primer autómata
    const afd1Container = document.createElement('div');
    afd1Container.className = 'afd-input';
    afd1Container.style.width = '48%';
    afd1Container.style.minWidth = '300px';
    afd1Container.style.marginBottom = '20px';
    afd1Container.style.padding = '15px';
    afd1Container.style.border = '1px solid #ddd';
    afd1Container.style.borderRadius = '5px';
    afd1Container.style.backgroundColor = '#fff';
    
    // Crear contenedor para el segundo autómata
    const afd2Container = document.createElement('div');
    afd2Container.className = 'afd-input';
    afd2Container.style.width = '48%';
    afd2Container.style.minWidth = '300px';
    afd2Container.style.marginBottom = '20px';
    afd2Container.style.padding = '15px';
    afd2Container.style.border = '1px solid #ddd';
    afd2Container.style.borderRadius = '5px';
    afd2Container.style.backgroundColor = '#fff';
    
    automataContainer.appendChild(afd1Container);
    automataContainer.appendChild(afd2Container);
    
    // Variables para almacenar los autómatas cargados
    let afd1Data = null;
    let afd2Data = null;
    
    // Crear sección para cargar autómatas desde archivos
    function createAutomataSection(container, automatonId) {
        const title = document.createElement('h3');
        title.textContent = `Autómata ${automatonId}`;
        container.appendChild(title);
        
        // Crear inputs ocultos para los archivos
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = `file-input-${automatonId}`;
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        container.appendChild(fileInput);
        
        // Contenedor para los botones
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.marginBottom = '15px';
        container.appendChild(buttonsContainer);
        
        // Botón para cargar archivo
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Cargar desde archivo JSON';
        loadBtn.style.marginRight = '10px';
        loadBtn.style.padding = '8px 12px';
        loadBtn.style.backgroundColor = '#4CAF50';
        loadBtn.style.color = 'white';
        loadBtn.style.border = 'none';
        loadBtn.style.borderRadius = '4px';
        loadBtn.style.cursor = 'pointer';
        buttonsContainer.appendChild(loadBtn);
        
        // Botones para exportar quintupla y PNG (solo disponibles después de cargar)
        const exportQuintupleBtn = document.createElement('button');
        exportQuintupleBtn.textContent = 'Exportar Quintupla (TXT)';
        exportQuintupleBtn.style.marginRight = '10px';
        exportQuintupleBtn.style.padding = '8px 12px';
        exportQuintupleBtn.style.backgroundColor = '#607D8B';
        exportQuintupleBtn.style.color = 'white';
        exportQuintupleBtn.style.border = 'none';
        exportQuintupleBtn.style.borderRadius = '4px';
        exportQuintupleBtn.style.cursor = 'pointer';
        exportQuintupleBtn.style.display = 'none'; // Inicialmente oculto
        buttonsContainer.appendChild(exportQuintupleBtn);
        
        const exportPngBtn = document.createElement('button');
        exportPngBtn.textContent = 'Exportar Autómata (PNG)';
        exportPngBtn.style.padding = '8px 12px';
        exportPngBtn.style.backgroundColor = '#FF9800';
        exportPngBtn.style.color = 'white';
        exportPngBtn.style.border = 'none';
        exportPngBtn.style.borderRadius = '4px';
        exportPngBtn.style.cursor = 'pointer';
        exportPngBtn.style.display = 'none'; // Inicialmente oculto
        buttonsContainer.appendChild(exportPngBtn);
        
        // Contenedor para mostrar los datos cargados
        const dataContainer = document.createElement('div');
        dataContainer.id = `data-container-${automatonId}`;
        dataContainer.style.marginTop = '15px';
        dataContainer.style.padding = '10px';
        dataContainer.style.backgroundColor = '#f5f5f5';
        dataContainer.style.borderRadius = '4px';
        dataContainer.style.fontSize = '14px';
        dataContainer.innerHTML = '<p>No hay datos cargados aún.</p>';
        container.appendChild(dataContainer);
        
        // Crear un contenedor para la visualización del autómata
        const visualizationContainer = document.createElement('div');
        visualizationContainer.id = `visualization-${automatonId}`;
        visualizationContainer.style.marginTop = '20px';
        visualizationContainer.style.width = '100%';
        visualizationContainer.style.height = '200px';
        visualizationContainer.style.border = '1px dashed #ccc';
        visualizationContainer.style.display = 'none'; // Inicialmente oculto
        container.appendChild(visualizationContainer);
        
        // Evento para cargar archivo
        loadBtn.addEventListener('click', function() {
            loadAutomatonFromFile(`file-input-${automatonId}`, function(data) {
                if (automatonId === 1) {
                    afd1Data = data;
                } else {
                    afd2Data = data;
                }
                console.log(`Autómata ${automatonId} cargado:`, data);
                
                // Mostrar botones de exportación
                exportQuintupleBtn.style.display = 'inline-block';
                exportPngBtn.style.display = 'inline-block';
                
                // Visualizar el autómata si es posible
                if (typeof window.visualizeAutomaton === 'function') {
                    visualizationContainer.style.display = 'block';
                    window.visualizeAutomaton(data, visualizationContainer);
                }
            });
        });
        
        // Evento para exportar quintupla
        exportQuintupleBtn.addEventListener('click', function() {
            const automaton = automatonId === 1 ? afd1Data : afd2Data;
            if (automaton) {
                exportQuintupleTxt(automaton, `automaton${automatonId}_quintuple.txt`);
            } else {
                alert('No hay autómata cargado para exportar.');
            }
        });
        
        // Evento para exportar PNG
        exportPngBtn.addEventListener('click', function() {
            const visContainer = document.getElementById(`visualization-${automatonId}`);
            if (visContainer && visContainer.style.display !== 'none') {
                exportAutomatonAsPNG(visContainer, `automaton${automatonId}.png`);
            } else {
                alert('No hay visualización disponible para exportar.');
            }
        });
    }
    
    // Crear secciones para ambos autómatas
    createAutomataSection(afd1Container, 1);
    createAutomataSection(afd2Container, 2);
    
    // Botón para realizar la unión
    const unionButton = document.createElement('button');
    unionButton.textContent = 'Realizar Unión de AFDs';
    unionButton.style.display = 'block';
    unionButton.style.margin = '20px auto';
    unionButton.style.padding = '12px 24px';
    unionButton.style.fontSize = '16px';
    unionButton.style.backgroundColor = '#673AB7';
    unionButton.style.color = 'white';
    unionButton.style.border = 'none';
    unionButton.style.borderRadius = '4px';
    unionButton.style.cursor = 'pointer';
    container.appendChild(unionButton);
    
    // Crear contenedor para el resultado
    const resultContainer = document.createElement('div');
    resultContainer.id = 'resultContainer';
    resultContainer.style.marginTop = '30px';
    resultContainer.style.padding = '20px';
    resultContainer.style.border = '1px solid #ddd';
    resultContainer.style.borderRadius = '5px';
    resultContainer.style.backgroundColor = '#f0f4f8';
    resultContainer.style.display = 'none'; 
    container.appendChild(resultContainer);
    
    // Título del resultado
    const resultTitle = document.createElement('h3');
    resultTitle.textContent = 'Resultado de la Unión';
    resultTitle.style.marginBottom = '15px';
    resultContainer.appendChild(resultTitle);
    
    // Contenedor para los botones del resultado
    const resultButtonsContainer = document.createElement('div');
    resultButtonsContainer.style.marginBottom = '20px';
    resultContainer.appendChild(resultButtonsContainer);
    
    // Botones para exportar la quintupla y PNG del resultado
    const exportResultQuintupleBtn = document.createElement('button');
    exportResultQuintupleBtn.textContent = 'Exportar Quintupla Resultado (TXT)';
    exportResultQuintupleBtn.style.marginRight = '15px';
    exportResultQuintupleBtn.style.padding = '8px 12px';
    exportResultQuintupleBtn.style.backgroundColor = '#607D8B';
    exportResultQuintupleBtn.style.color = 'white';
    exportResultQuintupleBtn.style.border = 'none';
    exportResultQuintupleBtn.style.borderRadius = '4px';
    exportResultQuintupleBtn.style.cursor = 'pointer';
    resultButtonsContainer.appendChild(exportResultQuintupleBtn);
    
    const exportResultPngBtn = document.createElement('button');
    exportResultPngBtn.textContent = 'Exportar Resultado (PNG)';
    exportResultPngBtn.style.padding = '8px 12px';
    exportResultPngBtn.style.backgroundColor = '#FF9800';
    exportResultPngBtn.style.color = 'white';
    exportResultPngBtn.style.border = 'none';
    exportResultPngBtn.style.borderRadius = '4px';
    exportResultPngBtn.style.cursor = 'pointer';
    resultButtonsContainer.appendChild(exportResultPngBtn);
    
    // Contenedor para la visualización del resultado
    const resultVisualizationContainer = document.createElement('div');
    resultVisualizationContainer.id = 'result-visualization';
    resultVisualizationContainer.style.width = '100%';
    resultVisualizationContainer.style.height = '300px';
    resultVisualizationContainer.style.border = '1px solid #ccc';
    resultContainer.appendChild(resultVisualizationContainer);
    
    // Variable para almacenar el autómata resultante
    let unionResult = null;
    
    // Agregar evento al botón de unión
    unionButton.addEventListener('click', function() {
        try {
            if (!afd1Data || !afd2Data) {
                alert('Debes cargar ambos autómatas antes de realizar la unión.');
                return;
            }
            
            const unionResult = automataOperations.union(afd1Data, afd2Data);
            console.log('Resultado de la unión:', unionResult);
            
            // Mostrar el contenedor de resultado
            resultContainer.style.display = 'block';
            
            // Visualizar el resultado
            if (typeof window.visualizeAutomaton === 'function') {
                window.visualizeAutomaton(unionResult, resultVisualizationContainer);
            } else if (typeof window.updateVisualization === 'function') {
                window.updateVisualization(unionResult);
            }
            
            // Mensaje de éxito
            alert(`Unión realizada con éxito. El autómata resultante tiene ${unionResult.states.length} estados y ${unionResult.transitions.length} transiciones.`);
            window.updateVisualization(unionResult);
        } catch (error) {
            console.error('Error al realizar la unión:', error);
            alert('Error al realizar la unión: ' + error.message);
        }
    });
    
    // Evento para exportar quintupla del resultado
    exportResultQuintupleBtn.addEventListener('click', function() {
        if (window.unionResult) {
            exportQuintupleTxt(window.unionResult, 'union_result_quintuple.txt');
        } else {
            alert('No hay resultado de unión para exportar.');
        }
    });
    
    // Evento para exportar PNG del resultado
    exportResultPngBtn.addEventListener('click', function() {
        if (window.unionResult && document.getElementById('result-visualization')) {
            exportAutomatonAsPNG(document.getElementById('result-visualization'), 'union_result.png');
        } else {
            alert('No hay visualización de resultado disponible para exportar.');
        }
    });
});

// Exportar las funciones necesarias al ámbito global
window.loadAFD1 = function() {
    const loadBtn = document.querySelector('.afd-input:first-child button');
    if (loadBtn) loadBtn.click();
};

window.loadAFD2 = function() {
    const loadBtn = document.querySelector('.afd-input:last-child button');
    if (loadBtn) loadBtn.click();
};

window.performUnion = function() {
    const unionBtn = document.querySelector('button:contains("Realizar Unión")');
    if (unionBtn) unionBtn.click();
};

window.validateAutomatonStructure = validateAutomatonStructure;
/**
 * Visualiza un autómata en un elemento contenedor usando D3.js
 * @param {Object} automaton - El autómata a visualizar
 * @param {HTMLElement} container - El elemento contenedor donde se dibujará el autómata
 */
function visualizeAutomaton(automaton, container) {
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Verificar que d3 esté disponible
    if (!window.d3) {
        container.innerHTML = '<p style="color: red;">Error: d3.js no está disponible.</p>';
        console.error('d3.js no está disponible para la visualización');
        return;
    }
    
    // Ancho y alto del SVG
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Crear el elemento SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Añadir una definición para las marcas de flechas
    svg.append('defs')
        .append('marker')
        .attr('id', `arrowhead-${container.id}`) // Usar ID único
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)  // Posición donde termina la flecha
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#666');
    
    // Crear un layout de fuerzas para posicionar los nodos
    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));
    
    // Preparar los datos para D3
    const nodes = automaton.states.map(state => ({
        id: state,
        isInitial: state === automaton.initialState,
        isAccept: automaton.acceptStates.includes(state)
    }));
    
    // Enlaces para transiciones
    const links = [];
    automaton.transitions.forEach(t => {
        // Verificar si ya existe un enlace entre estos nodos
        const existingLinkIndex = links.findIndex(link => 
            link.source === t.source && link.target === t.target
        );
        
        if (existingLinkIndex >= 0) {
            // Si ya existe un enlace, solo añadir este símbolo
            links[existingLinkIndex].symbols.push(t.input);
        } else {
            // Si no, crear un nuevo enlace
            links.push({
                source: t.source,
                target: t.target,
                symbols: [t.input]
            });
        }
    });
    
    // Crear bordes (transiciones)
    const link = svg.append('g')
        .selectAll('path')
        .data(links)
        .enter()
        .append('path')
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('marker-end', `url(#arrowhead-${container.id})`);
    
    // Crear nodos (estados)
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Círculo para cada estado
    node.append('circle')
        .attr('r', 20)
        .attr('fill', d => d.isAccept ? '#fff' : '#ccc')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    
    // Círculo adicional para estados de aceptación
    node.filter(d => d.isAccept)
        .append('circle')
        .attr('r', 16)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    
    // Flecha para el estado inicial
    node.filter(d => d.isInitial)
        .append('path')
        .attr('d', 'M-40,0L-25,0')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .attr('marker-end', `url(#arrowhead-${container.id})`);
    
    // Etiquetas de los estados
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '12px')
        .text(d => d.id);
    
    // Etiquetas de las transiciones
    const linkLabels = svg.append('g')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('dy', -5)
        .text(d => d.symbols.join(', '));
    
    // Actualizar posiciones en cada iteración
    simulation
        .nodes(nodes)
        .on('tick', ticked);
    
    simulation.force('link')
        .links(links);
    
    // Función para actualizar posiciones
    function ticked() {
        // Actualizar posición de los enlaces
        link.attr('d', function(d) {
            // Gestionar auto-bucles y enlaces entre los mismos nodos
            if (d.source.id === d.target.id) {
                const x = d.source.x;
                const y = d.source.y;
                return `M${x},${y-20} A20,20 0 1,1 ${x+0.1},${y-20.1}`;
            }
            
            // Enlaces normales con curvaturas
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            
            return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        
        // Actualizar posición de los nodos
        node.attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Actualizar posición de las etiquetas de enlaces
        linkLabels.attr('transform', function(d) {
            if (d.source.id === d.target.id) {
                // Etiqueta para auto-bucles
                return `translate(${d.source.x},${d.source.y - 40})`;
            }
            
            // Etiqueta para enlaces normales
            return `translate(${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2})`;
        });
    }
    
    // Funciones para el arrastre de nodos
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
        d.fx = null;
        d.fy = null;
    }
    
    return svg.node();
}

// Actualiza la función generateQuintuple para usar el nuevo formato
automataOperations.generateQuintuple = function(automaton) {
    // Cabecera
    let quintuple = "=== QUINTUPLA DEL AUTÓMATA FINITO DETERMINISTA ===\n\n";
    
    // 1. Conjunto de estados Q
    quintuple += "1. CONJUNTO DE ESTADOS (Q):\n   ";
    quintuple += automaton.states.join(", ") + "\n\n";
    
    // 2. Alfabeto Σ
    quintuple += "2. ALFABETO (Σ):\n   ";
    quintuple += automaton.alphabet.join(", ") + "\n\n";
    
    // 3. Función de transición δ
    quintuple += "3. FUNCIÓN DE TRANSICIÓN (δ: Q × Σ → Q):\n";
    
    // Para cada estado y símbolo, mostrar su transición
    for (const state of automaton.states) {
        for (const symbol of automaton.alphabet) {
            const transition = automaton.transitions.find(t => 
                t.source === state && t.input === symbol
            );
            
            if (transition) {
                quintuple += `   δ(${state}, ${symbol}) = ${transition.target}\n`;
            }
        }
    }
    quintuple += "\n";
    
    // 4. Estado inicial q0
    quintuple += "4. ESTADO INICIAL (q₀):\n   ";
    quintuple += automaton.initialState + "\n\n";
    
    // 5. Conjunto de estados de aceptación F
    quintuple += "5. CONJUNTO DE ESTADOS DE ACEPTACIÓN (F):\n   ";
    quintuple += automaton.acceptStates.join(", ") + "\n\n";
    
    // Información adicional
    quintuple += "=== INFORMACIÓN ADICIONAL ===\n\n";
    quintuple += `• Número total de estados: ${automaton.states.length}\n`;
    quintuple += `• Tamaño del alfabeto: ${automaton.alphabet.length}\n`;
    quintuple += `• Número total de transiciones: ${automaton.transitions.length}\n`;
    
    return quintuple;
};

// Modifica el evento del botón de unión para almacenar correctamente el resultado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página correcta
    if (window.location.hash !== '#/union' && 
        window.location.pathname !== '/union' && 
        !window.location.pathname.includes('union.html')) {
        console.log('No estamos en la página de unión');
        return;
    }
    
    console.log('Iniciando interfaz de unión de autómatas');
    
    // El resto del código permanece igual, solo modificamos la función del botón de unión
    
    // Crea una variable global para almacenar el resultado de la unión
    window.unionResult = null;
    
    // Reemplazar la función del botón de unión cuando se crea
    setTimeout(() => {
        const unionButton = document.querySelector('button');
        if (unionButton && unionButton.textContent.includes('Realizar Unión')) {
            unionButton.addEventListener('click', function() {
                try {
                    if (!afd1Data || !afd2Data) {
                        alert('Debes cargar ambos autómatas antes de realizar la unión.');
                        return;
                    }
                    
                    window.unionResult = automataOperations.union(afd1Data, afd2Data);
                    console.log('Resultado de la unión:', window.unionResult);
                    
                    // Mostrar el contenedor de resultado
                    const resultContainer = document.getElementById('resultontainer');
                    if (resultContainer) resultContainer.style.display = 'block';
                    
                    // Visualizar el resultado
                    const resultVisualizationContainer = document.getElementById('result-visualization');
                    if (resultVisualizationContainer) {
                        visualizeAutomaton(window.unionResult, resultVisualizationContainer);
                    }
                    
                    // Mensaje de éxito
                    alert(`Unión realizada con éxito. El autómata resultante tiene ${window.unionResult.states.length} estados y ${window.unionResult.transitions.length} transiciones.`);
                    
                } catch (error) {
                    console.error('Error al realizar la unión:', error);
                    alert('Error al realizar la unión: ' + error.message);
                }
            }, { once: true });  // Usar once: true para evitar múltiples listeners
        }
    }, 1000);  // Esperar a que el DOM esté completamente cargado
});

// Exportar funciones al ámbito global
window.visualizeAutomaton = visualizeAutomaton;

// Corrige la función performUnion
window.performUnion = function() {
    // Buscar el botón por su texto
    const allButtons = document.querySelectorAll('button');
    let unionButton = null;
    
    for (const btn of allButtons) {
        if (btn.textContent.includes('Realizar Unión')) {
            unionButton = btn;
            break;
        }
    }
    
    if (unionButton) {
        unionButton.click();
    } else {
        console.error('No se encontró el botón de realizar unión');
        alert('Error: No se encontró el botón para realizar la unión');
    }
};

// Corrige la exportación de quintupla para el resultado
