"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDFA = runDFA;
function runDFA(dfa, s) {
    var state = dfa.startState;
    for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
        var c = s_1[_i];
        state = dfa.rules[state][c];
    }
    return dfa.acceptStates.includes(state);
}
