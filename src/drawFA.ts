import * as d3 from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

export type StateId = number;
export type Char = '0' | '1';

export interface FA {
    statesNumber: number;
    rules: Array<{ [key in Char]: StateId }>;
    startState: StateId;
    acceptStates: StateId[];
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

const width = 800;
const height = 600;

const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

interface CustomNodeDatum extends SimulationNodeDatum {
    id: string;
}

interface CustomLinkDatum extends SimulationLinkDatum<CustomNodeDatum> {
    label: string;
}

const nodes: CustomNodeDatum[] = Array.from({ length: FA.statesNumber }, (_, i) => ({ id: i.toString() }));
const links: CustomLinkDatum[] = [];

for (let i = 0; i < FA.rules.length; i++) {
    for (const char in FA.rules[i]) {
        links.push({
            source: i.toString(),
            target: FA.rules[i][char as Char].toString(),
            label: char
        });
    }
}

const simulation = forceSimulation<CustomNodeDatum>(nodes)
    .force('link', forceLink<CustomNodeDatum, CustomLinkDatum>(links).id((d: CustomNodeDatum) => d.id))
    .force('charge', forceManyBody())
    .force('center', forceCenter(width / 2, height / 2));

const link = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 2);