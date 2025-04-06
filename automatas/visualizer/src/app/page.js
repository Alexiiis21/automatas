'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function Home() {
    const [automata, setAutomata] = useState(null);

    const handleFileUpload = (data) => {
        if (validateAutomata(data)) {
            setAutomata(data);
        } else {
            alert('Invalid automata format. Please check your JSON file structure.');
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

    return (
        <main className="container mx-auto px-4 py-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10 py-8">
                    <h1 className="text-5xl font-bold text-blue-800 mb-4">Visualizador de Autómatas</h1>
                    <p className="text-xl text-gray-600">Carga un archivo JSON con una quíntupla para generar y visualizar tu autómata</p>
                </header>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-10">
                    <h2 className="text-2xl font-semibold text-blue-700 mb-4">
                        Subir Archivo JSON
                    </h2>
                    <p className="text-gray-600 mb-6">
                        El archivo debe contener la representación de la quíntupla (Q, Σ, δ, q0, F) en formato JSON.
                    </p>
                    <FileUpload onFileUpload={handleFileUpload} />
                </div>

                {automata && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 text-blue-700">
                                Quíntupla
                            </h2>
                            <QuintupleDisplay automata={automata} />
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 text-blue-700">
                                Representación Visual
                            </h2>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={automata} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}