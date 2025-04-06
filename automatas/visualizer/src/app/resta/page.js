'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function RestaPage() {
    const [automata1, setAutomata1] = useState(null);
    const [automata2, setAutomata2] = useState(null);
    const [restaResult, setRestaResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload1 = (data) => {
        if (validateAutomata(data)) {
            setAutomata1(data);
        } else {
            alert('Formato de autómata 1 inválido. Por favor verifica la estructura del archivo JSON.');
        }
    };

    const handleFileUpload2 = (data) => {
        if (validateAutomata(data)) {
            setAutomata2(data);
        } else {
            alert('Formato de autómata 2 inválido. Por favor verifica la estructura del archivo JSON.');
        }
    };

    const validateAutomata = (data) => {
        // Check if data has all required fields
        if (!data.states || !Array.isArray(data.states) || 
            !data.alphabet || !Array.isArray(data.alphabet) ||
            !data.transitions || !Array.isArray(data.transitions) ||
            !data.initialState || 
            !data.finalStates || !Array.isArray(data.finalStates)) {
            return false;
        }

        // Check if initial state is in states array
        if (!data.states.includes(data.initialState)) return false;

        // Check if all final states are in states array
        for (const finalState of data.finalStates) {
            if (!data.states.includes(finalState)) return false;
        }

        // Check if all transitions reference valid states and symbols
        for (const transition of data.transitions) {
            if (!transition.from || !transition.to || !transition.symbol) return false;
            if (!data.states.includes(transition.from)) return false;
            if (!data.states.includes(transition.to)) return false;
            if (!data.alphabet.includes(transition.symbol)) return false;
        }

        return true;
    };

    const performResta = () => {
        if (!automata1 || !automata2) {
            alert('Debes cargar dos autómatas para realizar la resta');
            return;
        }

        setIsProcessing(true);

        try {
            // Paso 1: Calcular el complemento del segundo autómata
            const complementoAutomata2 = calcularComplemento(automata2);
            
            // Paso 2: Realizar la intersección entre el primer autómata y el complemento del segundo
            const resultado = calcularInterseccion(automata1, complementoAutomata2);
            
            setRestaResult(resultado);
        } catch (error) {
            console.error('Error al realizar la resta:', error);
            alert('Error al realizar la resta de autómatas: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Función para calcular el complemento de un autómata
    const calcularComplemento = (automata) => {
        // Primero verificamos si el autómata es completo
        const isComplete = checkIfAutomataIsComplete(automata);
        
        let completeAutomata;
        
        if (!isComplete) {
            // Si no es completo, lo completamos añadiendo un estado sumidero
            completeAutomata = makeAutomataComplete(automata);
        } else {
            // Si ya es completo, lo usamos directamente
            completeAutomata = JSON.parse(JSON.stringify(automata));
        }
        
        // Para calcular el complemento, invertimos los estados finales y no finales
        const nonFinalStates = completeAutomata.states.filter(
            state => !completeAutomata.finalStates.includes(state)
        );
        
        // Creamos el autómata complemento
        return {
            states: completeAutomata.states,
            alphabet: completeAutomata.alphabet,
            initialState: completeAutomata.initialState,
            finalStates: nonFinalStates,
            transitions: completeAutomata.transitions
        };
    };
    
    // Verifica si el autómata es completo (tiene transiciones definidas para cada estado y símbolo)
    const checkIfAutomataIsComplete = (automata) => {
        for (const state of automata.states) {
            for (const symbol of automata.alphabet) {
                const transitionExists = automata.transitions.some(
                    t => t.from === state && t.symbol === symbol
                );
                
                if (!transitionExists) {
                    return false;
                }
            }
        }
        return true;
    };
    
    // Hace que el autómata sea completo añadiendo un estado sumidero
    const makeAutomataComplete = (automata) => {
        const result = JSON.parse(JSON.stringify(automata));
        
        // Añadir un estado sumidero
        const sinkState = "sink";
        if (!result.states.includes(sinkState)) {
            result.states.push(sinkState);
        }
        
        // Añadir las transiciones faltantes al estado sumidero
        for (const state of result.states) {
            for (const symbol of result.alphabet) {
                const transitionExists = result.transitions.some(
                    t => t.from === state && t.symbol === symbol
                );
                
                if (!transitionExists) {
                    result.transitions.push({
                        from: state,
                        symbol: symbol,
                        to: sinkState
                    });
                }
            }
        }
        
        // Añadir transiciones del estado sumidero a sí mismo para todos los símbolos
        for (const symbol of result.alphabet) {
            result.transitions.push({
                from: sinkState,
                symbol: symbol,
                to: sinkState
            });
        }
        
        return result;
    };

    // Función para calcular la intersección entre dos autómatas
    const calcularInterseccion = (automata1, automata2) => {
        // Encontrar el alfabeto común (intersección de alfabetos)
        const commonAlphabet = automata1.alphabet.filter(symbol => 
            automata2.alphabet.includes(symbol)
        );
        
        if (commonAlphabet.length === 0) {
            throw new Error('Los autómatas no tienen símbolos en común en sus alfabetos.');
        }

        // Crear estados como pares (q1,q2)
        const productStates = [];
        const stateMap = {}; // Para mapear pares de estados a nombres únicos
        
        automata1.states.forEach(state1 => {
            automata2.states.forEach(state2 => {
                const statePair = `(${state1},${state2})`;
                productStates.push(statePair);
                stateMap[statePair] = { state1, state2 };
            });
        });
        
        // Estado inicial: par de los estados iniciales
        const initialState = `(${automata1.initialState},${automata2.initialState})`;
        
        // Estados finales: pares donde ambos componentes son estados finales
        const finalStates = productStates.filter(statePair => {
            const { state1, state2 } = stateMap[statePair];
            return automata1.finalStates.includes(state1) && 
                   automata2.finalStates.includes(state2);
        });
        
        // Crear las transiciones del producto
        const transitions = [];
        
        productStates.forEach(fromStatePair => {
            const { state1: fromState1, state2: fromState2 } = stateMap[fromStatePair];
            
            commonAlphabet.forEach(symbol => {
                // Buscar transiciones en el primer autómata
                const transitionsA1 = automata1.transitions.filter(t => 
                    t.from === fromState1 && t.symbol === symbol
                );
                
                // Buscar transiciones en el segundo autómata
                const transitionsA2 = automata2.transitions.filter(t => 
                    t.from === fromState2 && t.symbol === symbol
                );
                
                // Si ambos autómatas tienen transiciones con este símbolo
                if (transitionsA1.length > 0 && transitionsA2.length > 0) {
                    transitionsA1.forEach(t1 => {
                        transitionsA2.forEach(t2 => {
                            const toStatePair = `(${t1.to},${t2.to})`;
                            
                            transitions.push({
                                from: fromStatePair,
                                symbol: symbol,
                                to: toStatePair
                            });
                        });
                    });
                }
            });
        });
        
        // Construir el autómata resultante
        const result = {
            states: productStates,
            alphabet: commonAlphabet,
            initialState: initialState,
            finalStates: finalStates,
            transitions: transitions
        };
        
        // Optimización: eliminar estados inalcanzables
        return removeUnreachableStates(result);
    };

    // Función para eliminar estados inalcanzables desde el estado inicial
    const removeUnreachableStates = (automata) => {
        const reachable = new Set([automata.initialState]);
        let oldSize = 0;
        
        // Encontrar todos los estados alcanzables en un bucle de punto fijo
        while (reachable.size !== oldSize) {
            oldSize = reachable.size;
            
            automata.transitions.forEach(t => {
                if (reachable.has(t.from)) {
                    reachable.add(t.to);
                }
            });
        }
        
        // Filtrar el autómata para mantener solo los estados alcanzables
        return {
            states: automata.states.filter(s => reachable.has(s)),
            alphabet: automata.alphabet,
            initialState: automata.initialState,
            finalStates: automata.finalStates.filter(s => reachable.has(s)),
            transitions: automata.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to))
        };
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Resta de Autómatas</h1>
                    <p className="text-gray-600">Carga dos autómatas para realizar A - B (resta)</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Autómata 1 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                            Autómata A
                        </h2>
                        <div className="mb-6">
                            <FileUpload onFileUpload={handleFileUpload1} />
                        </div>
                        
                        {automata1 && (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                    <QuintupleDisplay automata={automata1} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <AutomataVisualizer automata={automata1} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Autómata 2 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
                            Autómata B
                        </h2>
                        <div className="mb-6">
                            <FileUpload onFileUpload={handleFileUpload2} />
                        </div>
                        
                        {automata2 && (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                    <QuintupleDisplay automata={automata2} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <AutomataVisualizer automata={automata2} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Botón para realizar la resta */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={performResta}
                        disabled={!automata1 || !automata2 || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Realizar A - B'}
                    </button>
                </div>
                
                {/* Resultado de la resta */}
                {restaResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado de A - B
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={restaResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={restaResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}