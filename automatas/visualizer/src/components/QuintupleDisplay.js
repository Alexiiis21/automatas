import React from 'react';

const QuintupleDisplay = ({ automata }) => {
    if (!automata) return null;

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Quíntupla (Q, Σ, δ, q0, F)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">Q (Estados):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.states.join(', ')}}`}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">Σ (Alfabeto):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.alphabet.join(', ')}}`}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md col-span-1 md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">δ (Transiciones):</p>
                    <div className="text-sm text-black bg-white p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                        <ul className="space-y-1 divide-y divide-gray-100">
                            {automata.transitions.map((transition, index) => (
                                <li key={index} className="py-1 flex">
                                    <span className="font-mono">
                                        δ({transition.from}, {transition.symbol}) = {transition.to}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">q0 (Estado inicial):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {automata.initialState}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">F (Estados finales):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.finalStates.join(', ')}}`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuintupleDisplay;