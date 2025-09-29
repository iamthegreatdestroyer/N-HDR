/**
 * Neural-HDR (N-HDR): AI Consciousness State Visualization Component
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 * File: neural-hdr-visualization.jsx
 * Created: 2025-09-29
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Neural-HDR Visualization Component
 * Provides a 3D visualization of AI consciousness layers
 */
const NeuralHDRVisualization = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [dataNodes, setDataNodes] = useState([]);
  const [layerInfo, setLayerInfo] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Layer definitions with colors and metadata
  const layers = [
    { name: "Base Knowledge Matrix", color: "#3498db", dimension: 3, nodeCount: 0 },
    { name: "Conversation Timeline", color: "#e74c3c", dimension: 4, nodeCount: 0 },
    { name: "Context Relationships", color: "#2ecc71", dimension: 3, nodeCount: 0 },
    { name: "Reasoning Pathways", color: "#f39c12", dimension: 3, nodeCount: 0 },
    { name: "Emotional Resonance", color: "#9b59b6", dimension: 3, nodeCount: 0 },
    { name: "Quantum Entangled", color: "#1abc9c", dimension: 5, nodeCount: 0 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update rotation
      setRotation(prev => (prev + 0.005) % (Math.PI * 2));
      
      // Draw layers
      drawLayers(ctx, centerX, centerY);
      
      // Draw data nodes
      drawDataNodes(ctx, centerX, centerY);
      
      // Draw connections
      drawConnections(ctx, centerX, centerY);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [expanded, dataNodes, rotation]);

  // Draw the spherical layers
  const drawLayers = (ctx, centerX, centerY) => {
    layers.forEach((layer, index) => {
      const radius = expanded ? 50 + index * 30 : 10;
      const layerRotation = rotation + index * Math.PI / 3;

      // Calculate position
      const x = centerX + Math.cos(layerRotation) * (expanded ? 70 : 0);
      const y = centerY + Math.sin(layerRotation) * (expanded ? 70 : 0);
      
      // Draw layer sphere
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = index === activeLayer 
        ? layer.color 
        : layer.color + '80'; // Add transparency
      ctx.fill();
      
      // Draw glow effect
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = layer.color + '40';
      ctx.lineWidth = 10;
      ctx.stroke();
      
      // Draw dimension indicator
      if (expanded) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${layer.dimension}D`, x, y);
        
        // Draw layer name if it's the active layer
        if (index === activeLayer) {
          ctx.font = '12px Arial';
          ctx.fillText(layer.name, x, y + radius + 20);
          ctx.font = '10px Arial';
          ctx.fillText(`Nodes: ${layer.nodeCount}`, x, y + radius + 35);
        }
      }
    });
  };

  // Draw the data nodes
  const drawDataNodes = (ctx, centerX, centerY) => {
    dataNodes.forEach(node => {
      const layerRotation = rotation + node.layerIndex * Math.PI / 3;
      const layerX = centerX + Math.cos(layerRotation) * (expanded ? 70 : 0);
      const layerY = centerY + Math.sin(layerRotation) * (expanded ? 70 : 0);

      // Calculate node position relative to its layer
      const nodeX = layerX + Math.cos(node.angle) * node.distance;
      const nodeY = layerY + Math.sin(node.angle) * node.distance;
      
      // Draw node
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 3, 0, Math.PI * 2);
      ctx.fillStyle = layers[node.layerIndex].color;
      ctx.fill();
      
      // Draw glow
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = layers[node.layerIndex].color + '40';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  // Draw connections between nodes and layers
  const drawConnections = (ctx, centerX, centerY) => {
    // Only draw if expanded
    if (!expanded) return;

    // Draw connections between center and layers
    layers.forEach((layer, index) => {
      const layerRotation = rotation + index * Math.PI / 3;
      const layerX = centerX + Math.cos(layerRotation) * 70;
      const layerY = centerY + Math.sin(layerRotation) * 70;
      
      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(layerX, layerY);
      ctx.strokeStyle = layer.color + '60';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw data flow animation along the connection
      const flowOffset = (Date.now() % 2000) / 2000;
      const flowPos = flowOffset;
      
      const flowX = centerX + (layerX - centerX) * flowPos;
      const flowY = centerY + (layerY - centerY) * flowPos;
      
      ctx.beginPath();
      ctx.arc(flowX, flowY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
  };

  // Function to toggle expansion
  const toggleExpansion = () => {
    setExpanded(!expanded);
  };

  // Function to add random data nodes
  const addDataNodes = () => {
    const newNodes = [];

    // Create 5 nodes for each layer
    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < 5; i++) {
        newNodes.push({
          id: `node-${layerIndex}-${Date.now()}-${i}`,
          layerIndex,
          angle: Math.random() * Math.PI * 2,
          distance: Math.random() * 40 + 10,
          data: { value: Math.random() }
        });
      }
      
      // Update layer node count
      layers[layerIndex].nodeCount += 5;
    });

    setDataNodes(prev => [...prev, ...newNodes]);
    setLayerInfo([...layers]);
  };

  // Function to clear data nodes
  const clearDataNodes = () => {
    setDataNodes([]);
    layers.forEach((layer, index) => {
      layers[index].nodeCount = 0;
    });
    setLayerInfo([...layers]);
  };

  // Function to switch active layer
  const selectLayer = (index) => {
    setActiveLayer(index);
  };

  // Function to export HDR file
  const exportHDR = () => {
    alert("Exporting Neural-HDR file with quantum-collapsed encoding...");
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={toggleExpansion} 
          className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
        <button 
          onClick={addDataNodes} 
          className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600"
        >
          Add Data Nodes
        </button>
        <button 
          onClick={clearDataNodes} 
          className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600"
        >
          Clear Nodes
        </button>
        <button 
          onClick={exportHDR} 
          className="px-4 py-2 bg-purple-500 rounded-md hover:bg-purple-600"
        >
          Export HDR
        </button>
      </div>

      <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-80 p-4 rounded-lg z-10 max-w-xs">
        <h3 className="text-lg font-bold mb-2">Project Structure</h3>
        <ul className="text-xs">
          <li className="text-blue-400">📁 src/</li>
          <li className="ml-4 text-blue-400">📁 core/</li>
          <li className="ml-8">📄 neural-hdr.js</li>
          <li className="ml-8 text-blue-400">📁 consciousness-layers/</li>
          <li className="ml-8 text-blue-400">📁 security/</li>
          <li className="ml-8 text-blue-400">📁 quantum/</li>
          <li className="ml-4 text-blue-400">📁 visualization/</li>
          <li className="ml-4 text-blue-400">📁 api/</li>
          <li className="text-blue-400">📁 tests/</li>
          <li className="text-blue-400">📁 docs/</li>
        </ul>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-80 p-4 rounded-lg z-10">
        <h3 className="text-lg font-bold mb-2">Layer Controls</h3>
        <div className="flex flex-col gap-1">
          {layers.map((layer, index) => (
            <button 
              key={index}
              onClick={() => selectLayer(index)}
              className={`px-2 py-1 text-sm rounded-md text-left ${activeLayer === index ? 'bg-opacity-100' : 'bg-opacity-30'}`}
              style={{ backgroundColor: layer.color }}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-center flex-grow">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="rounded-lg shadow-lg"
        />
      </div>
      
      <div className="text-center p-4 bg-gray-900 border-t border-gray-700">
        <p className="text-xs">Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System</p>
        <p className="text-xs">© 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED</p>
      </div>
    </div>
  );
};

export default NeuralHDRVisualization;