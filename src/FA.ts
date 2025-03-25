export type StateId = number
export type Char = '0' | '1'

export interface FA {
    statesNumber: number
    rules: Record<Char, StateId>[]
    startState: StateId
    acceptStates: StateId[]
}

export function runFA(FA: FA, s: Char[] | string): boolean {
    let state = FA.startState
    for (const c of s) {
        state = FA.rules[state][c as Char]
    }
    return FA.acceptStates.includes(state)

}

const FA: FA = {
    statesNumber: 2,
    rules: [
        { '0': 1, '1': 0 },
        { '0': 1, '1': 1 }
    ],
    startState: 0,
    acceptStates: [0]
};

console.log(runFA(FA, '0011'))

console.log('RUNNING FA')

