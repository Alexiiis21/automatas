"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { toPng } from "html-to-image";
import DownloadOptions from "./DownloadOptions";

const AutomataVisualizer = ({ automata }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Función para descargar la quíntupla como JSON
  const downloadQuintuple = () => {
    if (!automata) return;

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(automata, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "automata.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Función para descargar la imagen del autómata
  const downloadImage = () => {
    if (!svgRef.current) return;

    toPng(svgRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "automata.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Error generando imagen:", error);
        alert(
          "Hubo un error al generar la imagen. Por favor intenta de nuevo."
        );
      });
  };

  useEffect(() => {
    if (!automata || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 500;
    const nodeRadius = 30;

    // Add zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create a container for all elements
    const g = svg.append("g");

    // Create simulation with improved forces
    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(180)
      )
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius * 2));

    // Prepare data
    const nodes = automata.states.map((state) => ({
      id: state,
      isInitial: state === automata.initialState,
      isFinal: automata.finalStates.includes(state),
    }));

    // Process transitions to handle multiple transitions between same states
    const transitionGroups = {};
    automata.transitions.forEach((t) => {
      const key = `${t.from}-${t.to}`;
      if (!transitionGroups[key]) {
        transitionGroups[key] = [];
      }
      transitionGroups[key].push(t.symbol);
    });

    const links = Object.entries(transitionGroups).map(([key, symbols], i) => {
      const [source, target] = key.split("-");
      return {
        id: `link-${i}`,
        source,
        target,
        symbols,
        isSelfLoop: source === target,
      };
    });

    // Create beautiful gradient for the background
    const defs = g.append("defs");

    // Create gradient for nodes
    const nodeGradient = defs
      .append("linearGradient")
      .attr("id", "nodeGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    nodeGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#67B7D1");

    nodeGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4891D9");

    // Create gradient for final states
    const finalStateGradient = defs
      .append("linearGradient")
      .attr("id", "finalStateGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    finalStateGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#FAD02E");

    finalStateGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#F9A826");

    // Create arrow marker with better styling
    defs
    .append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 0)  // Cambiado para que la punta de la flecha termine exactamente en el borde
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#555");

    // Special arrow for initial state
    defs
.append("marker")
.attr("id", "arrowhead")
.attr("viewBox", "0 -5 10 10")
.attr("refX", 10)  // Aumentado para alejar la flecha del final del path
.attr("refY", 0)
.attr("markerWidth", 6)
.attr("markerHeight", 6)
.attr("orient", "auto")
.append("path")
.attr("d", "M0,-5L10,0L0,5")
.attr("fill", "#555");

    // Create links
    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("g")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link");

    // Create paths with different curvature for multiple transitions between same nodes
    const path = link
      .append("path")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)")
      .attr("class", "transition-path");

    // Link text for transition symbols
    const linkText = link
      .append("text")
      .text((d) => d.symbols.join(", "))
      .attr("font-size", 12)
      .attr("font-family", "Arial, sans-serif")
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("dy", -5)
      .attr("class", "transition-label");

    // Adjust label background size after text has been rendered
    linkText.each(function () {
      try {
        const bbox = this.getBBox();
        const parent = d3.select(this.parentNode);
        parent
          .select("rect")
          .attr("width", bbox.width + 8)
          .attr("height", bbox.height + 4);
      } catch (e) {
        console.log("Error getting bounding box:", e);
      }
    });

    // Create nodes
    const nodeGroup = g.append("g").attr("class", "nodes");

    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add shadows to nodes for 3D effect
    node
      .append("circle")
      .attr("r", nodeRadius + 2)
      .attr("fill", "#000")
      .attr("opacity", 0.3)
      .attr("transform", "translate(3, 3)");

    // Create circles for states with gradient fill
    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) =>
        d.isFinal ? "url(#finalStateGradient)" : "url(#nodeGradient)"
      )
      .attr("stroke", "#2D3748")
      .attr("stroke-width", 2);

    // Create inner circle for final states
    node
      .filter((d) => d.isFinal)
      .append("circle")
      .attr("r", nodeRadius - 6)
      .attr("stroke", "#2D3748")
      .attr("stroke-width", 2)
      .attr("fill", "none");

    // Arrow for initial state
    node
      .filter((d) => d.isInitial)
      .each(function (d) {
        g.append("path")
          .attr("class", "initial-arrow")
          .attr("d", `M0,0 L0,0`)
          .attr("stroke", "#2D3748")
          .attr("stroke-width", 2.5)
          .attr("marker-end", "url(#initial-arrow)")
          .datum(d);
      });

    // Add state labels with better contrast
    node
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#fff")
      .attr("pointer-events", "none");

    // Update positions on tick
    simulation.nodes(nodes).on("tick", () => {
      // Update link paths with better curves
      path.attr("d", (d) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
      
        // Handle self-loops with better appearance
        if (d.isSelfLoop) {
            // Hacer un loop más grande y ajustado al nodo
            const rx = nodeRadius * 1.8,  // Aumentado para hacer el loop más grande
                  ry = nodeRadius * 1.8;
            
            // Calcular puntos de inicio y fin para que el loop se vea bien y la flecha no se encime
            return `M${d.source.x},${d.source.y - nodeRadius} 
                    A${rx},${ry} 0 1,1 ${d.source.x + nodeRadius * 0.7},${d.source.y - nodeRadius * 0.7}`;
          }
      
        // Calculate where the path should end - exactly at the edge of the target node
        const length = Math.sqrt(dx * dx + dy * dy);
if (length === 0) return "M0,0 L0,0";

// Calculate unit vector and end point slightly before node edge
const unitX = dx / length;
const unitY = dy / length;
// Añadir un margen de 5px antes del borde del nodo
const margin = 5;
const targetX = d.target.x - unitX * (nodeRadius + margin);
const targetY = d.target.y - unitY * (nodeRadius + margin);

// Create curved path ending before node's edge
return `M${d.source.x},${d.source.y} A${dr * 1.2},${dr * 1.2} 0 0,1 ${targetX},${targetY}`;
      });

      // Update label positions
      linkText
        .attr("x", (d) => {
          if (d.isSelfLoop) {
            return d.source.x;
          }
          return (d.source.x + d.target.x) / 2;
        })
        .attr("y", (d) => {
          if (d.isSelfLoop) {
            return d.source.y - nodeRadius - 15;
          }
          return (d.source.y + d.target.y) / 2 - 10;
        });

      // Update node positions
      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

      // Update initial state arrow
      g.selectAll(".initial-arrow").attr("d", (d) => {
        const angle = Math.PI; // Point from left side
        const startX = d.x - nodeRadius - 40;
        const startY = d.y;
        const endX = d.x - nodeRadius - 10;
        const endY = d.y;
        return `M${startX},${startY} L${endX},${endY}`;
      });
    });

    simulation.force("link").links(links);

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep nodes fixed where user dragged them
      // d.fx = null;
      // d.fy = null;
    }

    // Add controls
    const controls = svg
      .append("g")
      .attr("transform", "translate(20, 20)")
      .attr("class", "controls");

    controls
      .append("rect")
      .attr("width", 100)
      .attr("height", 70)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "white")
      .attr("stroke", "#ddd");

    controls
      .append("text")
      .attr("x", 50)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Zoom Controls");

    // Zoom in button
    const zoomIn = controls.append("g").attr("transform", "translate(25, 40)");
    zoomIn
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#eee")
      .attr("stroke", "#ddd");
    zoomIn.append("text").attr("text-anchor", "middle").attr("dy", 4).text("+");
    zoomIn.style("cursor", "pointer");
    zoomIn.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    // Zoom out button
    const zoomOut = controls.append("g").attr("transform", "translate(75, 40)");
    zoomOut
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#eee")
      .attr("stroke", "#ddd");
    zoomOut
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .text("-");
    zoomOut.style("cursor", "pointer");
    zoomOut.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    // Center the graph initially with a small animation
    setTimeout(() => {
      svg
        .transition()
        .duration(500)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(0.9)
            .translate(-width / 2, -height / 2)
        );
    }, 200);
  }, [automata]);

  return (
    <div className="automata-visualizer" ref={containerRef}>
      <DownloadOptions
        onDownloadQuintuple={downloadQuintuple}
        onDownloadImage={downloadImage}
      />
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          background: "linear-gradient(to bottom right, #f8f9fa, #e9ecef)",
        }}
      ></svg>
    </div>
  );
};

export default AutomataVisualizer;
