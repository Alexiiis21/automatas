// Router SPA - Carga contenido dinámicamente sin cambiar de página
class Router {
  constructor() {
    this.routes = {
      '#/': { title: 'Visualización de Autómatas', component: 'main' },
      '#/union': { title: 'Unión de Autómatas Finitos', component: 'union' },
      '#/intersection': { title: 'Intersección de Autómatas', component: 'intersection' },
      '#/complement': { title: 'Complemento de Autómatas', component: 'complement' }
    };
    
    // Elemento donde se mostrará el contenido dinámico
    this.container = document.querySelector('.container');
    
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Inicializar navegación
    document.addEventListener('DOMContentLoaded', () => {
      this.initNavigation();
      this.setupMainContent();
      
      // Manejar ruta inicial
      if (!window.location.hash) {
        window.location.hash = '#/';
      } else {
        this.handleRoute();
      }
    });
  }
  
  // Inicialización de navegación
  initNavigation() {
    document.querySelectorAll('.navbar a:not(.disabled)').forEach(link => {
      const href = link.getAttribute('href');
      // Asegurarse de que los href empiezan con #
      const hashPath = href.startsWith('#') ? href : `#${href}`;
      
      // Actualizar el href para asegurar formato correcto
      link.setAttribute('href', hashPath);
    });
  }
  
  // Manejo de cambio de ruta
  handleRoute() {
    const hash = window.location.hash || '#/';
    const route = this.routes[hash];
    
    if (!route) {
      console.warn('Ruta no encontrada:', hash);
      return;
    }
    
    // Actualizar enlaces activos
    this.updateActiveLinks(hash);
    
    // Ocultar todas las secciones
    document.querySelectorAll('section[id$="-section"]').forEach(section => {
      section.style.display = 'none';
    });
    
    // Mostrar la sección correspondiente o crearla si no existe
    const sectionId = `${route.component}-section`;
    let section = document.getElementById(sectionId);
    
    if (!section) {
      // Crear la sección si no existe
      this.createSection(route.component).then(newSection => {
        if (newSection) {
          newSection.style.display = 'block';
        }
      });
    } else {
      section.style.display = 'block';
    }
  }
  
  // Actualizar enlaces activos
  updateActiveLinks(hash) {
    document.querySelectorAll('.navbar a').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  // Preparar contenido principal
  setupMainContent() {
    const mainSection = document.getElementById('main-section');
    if (mainSection) {
      // Ya existe, asegurarse de que tenga el contenido correcto
      console.log('Sección principal ya configurada');
    } else {
      console.log('Configurando sección principal');
      // Podría crear el contenido principal si no existiera
    }
  }
  
  // Crear una sección basada en el componente
  async createSection(component) {
    // Si es la sección principal, ya debe existir
    if (component === 'main') {
      return document.getElementById('main-section');
    }
    
    // Crear elementos para otros componentes
    const section = document.createElement('section');
    section.id = `${component}-section`;
    
    switch (component) {
      case 'union':
        section.innerHTML = `
          <h2>Operación de Unión de Autómatas</h2>
          <div class="automata-inputs">
            <div class="input-group">
              <button id="load-afd1-btn">Cargar AFD 1</button>
              <button id="load-afd2-btn">Cargar AFD 2</button>
              <button id="union-btn">Realizar Unión</button>
            </div>
          </div>
          <div class="automata-status">
            <div id="afd1-status" style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 4px;">
              <strong>AFD 1:</strong> No cargado
            </div>
            <div id="afd2-status" style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 4px;">
              <strong>AFD 2:</strong> No cargado
            </div>
          </div>
          <div id="automaton"></div>
        `;
        this.container.appendChild(section);
        
        try {
          // Primero cargamos D3.js si no está disponible
          if (!window.d3) {
            await this.loadScript('https://d3js.org/d3.v7.min.js');
          }
          
          // Cargar automata.js
          console.log('Cargando script de automata.js...');
          await this.loadScript('js/automata.js');
          
          // Definir las funciones necesarias para la unión
          console.log('Definiendo funciones para unión...');
          this.defineUnionFunctions();
          
          // Inicializar los botones
          this.initUnionButtons();
          
        } catch (error) {
          console.error('Error cargando scripts para unión:', error);
          section.innerHTML += `
            <div class="error-message" style="color: red; margin-top: 20px;">
              <strong>Error:</strong> No se pudieron cargar los scripts necesarios. 
              Por favor, recarga la página o intenta más tarde.
            </div>
          `;
        }
        break;
        
      case 'intersection':
        section.innerHTML = `
          <h2>Operación de Intersección (Próximamente)</h2>
          <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
        `;
        this.container.appendChild(section);
        break;
        
      case 'complement':
        section.innerHTML = `
          <h2>Operación de Complemento (Próximamente)</h2>
          <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
        `;
        this.container.appendChild(section);
        break;
    }
    
    return section;
  }
  
  // Definir las funciones para la operación de unión
  defineUnionFunctions() {
    // Variables para almacenar los autómatas
    window.automaton1 = null;
    window.automaton2 = null;
    
    // Funciones de validación y utilidades
    window.validateAutomatonStructure = function(data) {
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
      
      return true;
    };
    
    // Función para cargar AFD 1
    window.loadAFD1 = function() {
      console.log('Ejecutando loadAFD1');
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.click();
      
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (window.validateAutomatonStructure(data)) {
              window.automaton1 = data;
              
              // Actualizar status
              const statusElem = document.getElementById('afd1-status');
              if (statusElem) {
                statusElem.innerHTML = `
                  <strong>AFD 1:</strong> Cargado correctamente<br>
                  <small>Estados: ${data.states.length}, Alfabeto: [${data.alphabet.join(', ')}]</small>
                `;
                statusElem.style.background = '#e6ffec';
              }
              
              console.log('AFD 1 cargado:', data);
              alert('AFD 1 cargado correctamente');
            }
          } catch (err) {
            console.error('Error al procesar el archivo:', err);
            alert('Error al procesar el archivo');
          }
        };
        reader.readAsText(file);
      };
    };
    
    // Función para cargar AFD 2
    window.loadAFD2 = function() {
      console.log('Ejecutando loadAFD2');
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.click();
      
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (window.validateAutomatonStructure(data)) {
              window.automaton2 = data;
              
              // Actualizar status
              const statusElem = document.getElementById('afd2-status');
              if (statusElem) {
                statusElem.innerHTML = `
                  <strong>AFD 2:</strong> Cargado correctamente<br>
                  <small>Estados: ${data.states.length}, Alfabeto: [${data.alphabet.join(', ')}]</small>
                `;
                statusElem.style.background = '#e6ffec';
              }
              
              console.log('AFD 2 cargado:', data);
              alert('AFD 2 cargado correctamente');
            }
          } catch (err) {
            console.error('Error al procesar el archivo:', err);
            alert('Error al procesar el archivo');
          }
        };
        reader.readAsText(file);
      };
    };
    
    // Función para realizar la unión
    window.performUnion = function() {
      console.log('Ejecutando performUnion');
      
      if (!window.automaton1 || !window.automaton2) {
        alert('Debes cargar los dos autómatas primero');
        return;
      }
      
      try {
        // Obtener los autómatas cargados
        const afd1 = window.automaton1;
        const afd2 = window.automaton2;
        
        // Realizar la unión (algoritmo simplificado para este ejemplo)
        // Crear el autómata resultante de la unión
        const resultAlphabet = [...new Set([...afd1.alphabet, ...afd2.alphabet])];
        
        // Renombrar estados del segundo autómata para evitar conflictos
        const afd2StatesMap = {};
        afd2.states.forEach(state => {
          afd2StatesMap[state] = `${state}_2`;
        });
        
        const unionAutomaton = {
          states: [
            ...afd1.states,
            ...afd2.states.map(s => `${s}_2`),
            'q_union' // Estado inicial nuevo
          ],
          alphabet: resultAlphabet,
          initialState: 'q_union',
          acceptStates: [
            ...afd1.acceptStates,
            ...afd2.acceptStates.map(s => `${s}_2`)
          ],
          transitions: [
            ...afd1.transitions,
            ...afd2.transitions.map(t => ({
              source: `${t.source}_2`,
              input: t.input,
              target: `${t.target}_2`
            })),
            // Transiciones desde el nuevo estado inicial (epsilon transiciones)
            {
              source: 'q_union',
              input: 'ε',
              target: afd1.initialState
            },
            {
              source: 'q_union',
              input: 'ε',
              target: `${afd2.initialState}_2`
            }
          ]
        };
      
        console.log('Autómata de unión creado:', unionAutomaton);
        
        // Verificar si existe la función de visualización
        if (typeof window.visualizeAutomaton === 'function') {
          window.visualizeAutomaton(unionAutomaton);
          alert('Unión realizada exitosamente');
        } else {
          // Intentar usar updateVisualization si está disponible
          if (typeof window.updateVisualization === 'function') {
            window.updateVisualization(unionAutomaton);
            alert('Unión realizada exitosamente');
          } else {
            console.error('Función de visualización no disponible');
            alert('Error: No se encontró la función de visualización');
          }
        }
      } catch (error) {
        console.error('Error al realizar la unión:', error);
        alert('Error al realizar la unión: ' + error.message);
      }
    };
    
    console.log('Funciones de unión definidas correctamente');
    console.log('- loadAFD1:', typeof window.loadAFD1);
    console.log('- loadAFD2:', typeof window.loadAFD2);
    console.log('- performUnion:', typeof window.performUnion);
  }
  
  // Inicializar botones para la unión de autómatas
  initUnionButtons() {
    console.log('Inicializando botones de unión...');
    
    // Verificar qué funciones están disponibles
    console.log('Funciones disponibles:');
    console.log('- loadAFD1:', typeof window.loadAFD1 === 'function');
    console.log('- loadAFD2:', typeof window.loadAFD2 === 'function');
    console.log('- performUnion:', typeof window.performUnion === 'function');
    
    const loadAfd1Btn = document.getElementById('load-afd1-btn');
    const loadAfd2Btn = document.getElementById('load-afd2-btn');
    const unionBtn = document.getElementById('union-btn');
    
    if (loadAfd1Btn) {
      loadAfd1Btn.addEventListener('click', () => {
        console.log('Botón Cargar AFD 1 clickeado');
        if (typeof window.loadAFD1 === 'function') {
          window.loadAFD1();
        } else {
          console.error('Función loadAFD1 no disponible');
          alert('Error: La función para cargar el primer autómata no está disponible');
        }
      });
    }
    
    if (loadAfd2Btn) {
      loadAfd2Btn.addEventListener('click', () => {
        console.log('Botón Cargar AFD 2 clickeado');
        if (typeof window.loadAFD2 === 'function') {
          window.loadAFD2();
        } else {
          console.error('Función loadAFD2 no disponible');
          alert('Error: La función para cargar el segundo autómata no está disponible');
        }
      });
    }
    
    if (unionBtn) {
      unionBtn.addEventListener('click', () => {
        console.log('Botón Realizar Unión clickeado');
        if (typeof window.performUnion === 'function') {
          window.performUnion();
        } else {
          console.error('Función performUnion no disponible');
          alert('Error: La función para realizar la unión no está disponible');
        }
      });
    }
  }
  
  // Cargar un script dinámicamente (versión mejorada)
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      const scriptName = src.split('/').pop();
      const existingScript = document.querySelector(`script[src*="${scriptName}"]`);
      
      if (existingScript) {
        console.log(`Script ${scriptName} ya cargado`);
        return resolve();
      }
      
      console.log(`Cargando script: ${src}`);
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      
      script.onload = () => {
        console.log(`Script ${src} cargado exitosamente`);
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`Error al cargar script ${src}:`, error);
        script.remove();
        reject(error);
      };
      
      document.body.appendChild(script);
    });
  }
}

// Inicializar el router (nombre diferente para evitar conflictos)
const appRouter = new Router();