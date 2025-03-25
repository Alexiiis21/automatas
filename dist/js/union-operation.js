document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de unión usando hash
    if (window.location.hash !== '#/union') {
        return;
    }
});

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
        
        // Evento para cargar archivo
        loadBtn.addEventListener('click', function() {
            loadAutomatonFromFile(`file-input-${automatonId}`, function(data) {
                if (automatonId === 1) {
                    afd1Data = data;
                } else {
                    afd2Data = data;
                }
                console.log(`Autómata ${automatonId} cargado:`, data);
            });
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
    
    // Agregar evento al botón de unión
    unionButton.addEventListener('click', function() {
        try {
            if (!afd1Data || !afd2Data) {
                alert('Debes cargar ambos autómatas antes de realizar la unión.');
                return;
            }
            
            const unionResult = automataOperations.union(afd1Data, afd2Data);
            console.log('Resultado de la unión:', unionResult);
            
            // Mostrar mensaje de éxito
            alert(`Unión realizada con éxito. El autómata resultante tiene ${unionResult.states.length} estados y ${unionResult.transitions.length} transiciones.`);
            // Actualizar la visualización
            window.updateVisualization(unionResult);
        } catch (error) {
            console.error('Error al realizar la unión:', error);
            alert('Error al realizar la unión: ' + error.message);
        }
    });
});