'use client'
import AutomataVisualizer from '@/components/AutomataVisualizer';
import FileUpload from '@/components/FileUpload';
import QuintupleDisplay from '@/components/QuintupleDisplay';
import { useState } from 'react';

export default function ComplementPage() {
    const [automata, setAutomata] = useState(null);
    const [complementResult, setComplementResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = (data) => {
        if (validateAutomata(data)) {
            setAutomata(data);
        } else {
            alert('Formato de autómata inválido. Por favor verifica la estructura del archivo JSON.');
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

    const performComplement = () => {
        if (!automata) {
            alert('Debes cargar un autómata para calcular su complemento');
            return;
        }
    
        setIsProcessing(true);
    
        try {
            // Verificar que el autómata es un AFD
            if (!isAFD(automata)) {
                alert('Esta operación requiere que el autómata sea un AFD');
                setIsProcessing(false);
                return;
            }
    
            // Crear una copia del autómata para trabajar
            let workingAutomata = JSON.parse(JSON.stringify(automata));
            
            // Verificar si el autómata es completo
            const missingTransitions = findMissingTransitions(workingAutomata);
            
            // Si hay transiciones faltantes, completamos el autómata
            if (missingTransitions.length > 0) {
                workingAutomata = makeAutomataComplete(workingAutomata);
            }
            
            // Para calcular el complemento, invertimos los estados finales y no finales
            const newFinalStates = workingAutomata.states.filter(
                state => !workingAutomata.finalStates.includes(state)
            );
            
            // El complemento tiene los mismos estados, alfabeto, estado inicial y transiciones
            // Sólo cambian los estados finales
            const result = {
                states: [...workingAutomata.states],
                alphabet: [...workingAutomata.alphabet],
                transitions: [...workingAutomata.transitions],
                initialState: workingAutomata.initialState,
                finalStates: newFinalStates
            };
            
            setComplementResult(result);
        } catch (error) {
            console.error('Error al calcular el complemento:', error);
            alert('Error al calcular el complemento del autómata: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Función para verificar si un autómata es un AFD
    const isAFD = (automaton) => {
        // Para cada estado y cada símbolo del alfabeto, debe haber exactamente una transición
        for (const state of automaton.states) {
            for (const symbol of automaton.alphabet) {
                const transitions = automaton.transitions.filter(
                    t => t.from === state && t.symbol === symbol
                );
                
                // En un AFD, debe haber exactamente una transición para cada par (estado, símbolo)
                if (transitions.length > 1) {
                    return false; // Más de una transición - no es determinista
                }
            }
        }
        return true; // Todas las verificaciones pasaron
    };
    
    // Función más eficiente para encontrar transiciones faltantes
    const findMissingTransitions = (automaton) => {
        const missingTransitions = [];
        
        for (const state of automaton.states) {
            for (const symbol of automaton.alphabet) {
                const hasTransition = automaton.transitions.some(
                    t => t.from === state && t.symbol === symbol
                );
                
                if (!hasTransition) {
                    missingTransitions.push({ state, symbol });
                }
            }
        }
        
        return missingTransitions;
    };
    
    // Función mejorada para completar un autómata
    const makeAutomataComplete = (automaton) => {
        // Crear una copia profunda del autómata
        const result = {
            states: [...automaton.states],
            alphabet: [...automaton.alphabet],
            transitions: [...automaton.transitions],
            initialState: automaton.initialState,
            finalStates: [...automaton.finalStates]
        };
        
        // Crear un nombre único para el estado sumidero
        let sinkState = "sink";
        let counter = 0;
        while (result.states.includes(sinkState)) {
            counter++;
            sinkState = `sink${counter}`;
        }
        
        // Añadir el estado sumidero
        result.states.push(sinkState);
        
        // Encontrar las transiciones faltantes
        const missingTransitions = findMissingTransitions(automaton);
        
        // Añadir transiciones faltantes al estado sumidero
        for (const { state, symbol } of missingTransitions) {
            result.transitions.push({
                from: state,
                symbol: symbol,
                to: sinkState
            });
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

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Complemento de un Autómata</h1>
                    <p className="text-gray-600">Carga un autómata para calcular su complemento</p>
                </header>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                        Autómata de Entrada
                    </h2>
                    <div className="mb-6">
                        <FileUpload onFileUpload={handleFileUpload} />
                    </div>
                    
                    {automata && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                <QuintupleDisplay automata={automata} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                <div className="border border-gray-200 rounded-md">
                                    <AutomataVisualizer automata={automata} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Botón para calcular el complemento */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={performComplement}
                        disabled={!automata || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Calcular Complemento'}
                    </button>
                </div>
                
                {/* Resultado del complemento */}
                {complementResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado del Complemento
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={complementResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md">
                                <AutomataVisualizer automata={complementResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}