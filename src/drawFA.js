"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3-selection");
var d3_force_1 = require("d3-force");

var FA = {
    statesNumber: 2,
    rules: [
        { '0': 1, '1': 0 },
        { '0': 1, '1': 1 }
    ],
    startState: 0,
    acceptStates: [0]
};

var width = 800;
var height = 600;

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

var nodes = Array.from({ length: FA.statesNumber }, function (_, i) { return ({ id: i.toString() }); });
var links = [];

for (var i = 0; i < FA.rules.length; i++) {
    for (var char in FA.rules[i]) {
        links.push({
            source: i.toString(),
            target: FA.rules[i][char].toString(),
            label: char
        });
    }
}

var simulation = (0, d3_force_1.forceSimulation)(nodes)
    .force('link', (0, d3_force_1.forceLink)(links).id(function (d) { return d.id; }))
    .force('charge', (0, d3_force_1.forceManyBody)())
    .force('center', (0, d3_force_1.forceCenter)(width / 2, height / 2));

var link = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', 2);

var node = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', 20)
    .attr('fill', function (d) { return FA.acceptStates.includes(parseInt(d.id)) ? 'green' : 'blue'; })
    .call(d3.drag()
        .on('start', function (event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on('drag', function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on('end', function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }));

var text = svg.append('g')
    .attr('class', 'texts')
    .selectAll('text')
    .data(nodes)
    .enter().append('text')
    .attr('dy', 4)
    .attr('dx', -10)
    .text(function (d) { return d.id; });

var linkText = svg.append('g')
    .attr('class', 'link-texts')
    .selectAll('text')
    .data(links)
    .enter().append('text')
    .attr('dy', -5)
    .attr('dx', 5)
    .text(function (d) { return d.label; });

simulation.on('tick', function () {
    link
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });

    node
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });

    text
        .attr('x', function (d) { return d.x; })
        .attr('y', function (d) { return d.y; });

    linkText
        .attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
        .attr('y', function (d) { return (d.source.y + d.target.y) / 2; });
});