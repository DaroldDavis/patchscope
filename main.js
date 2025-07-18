import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
// Mock tokenizer and model behavior for client-side simulation
// In a real app, this would be handled by your Python backend.
const mockTokenizer = (text) => {
  // Simple tokenization: split by space and punctuation
  return text.split(/(\s+|[,.!?])/).filter(t => t.trim() !== '');
};

const mockPatchify = (
  sourcePrompt,
  targetPrompt,
  sourceTokenIndex,
  sourceLayerIndex,
  targetTokenIndex,
  targetLayerIndex,
  nTokens
) => {
  const sourceTokens = mockTokenizer(sourcePrompt);
  const targetTokens = mockTokenizer(targetPrompt);

  // Simulate outputs
  const sourceOutput = `Original source output for "${sourcePrompt}"`;
  const targetOutput = `Original target output for "${targetPrompt}"`;

  // Simulate patched output based on the source token
  let patchedText = '';
  if (sourceTokenIndex >= 0 && sourceTokenIndex < sourceTokens.length) {
    const patchedToken = sourceTokens[sourceTokenIndex];
    patchedText = `Patched output: The model now thinks "${patchedToken}" after patching.`;
  } else {
    patchedText = `Patched output: No valid source token index.`;
  }

  return {
    sourceTokens: sourceTokens.map((t, i) => ({ text: t, index: i })),
    targetTokens: targetTokens.map((t, i) => ({ text: t, index: i })),
    sourceOutput,
    targetOutput,
    patchedOutput: patchedText,
  };
};

export default function Home() {
  const [sourcePrompt, setSourcePrompt] = useState("Harry");
  const [targetPrompt, setTargetPrompt] = useState("Respond only with the completion to this pattern: Man -> man, Car -> car, x ->");
  const [sourceTokenIndex, setSourceTokenIndex] = useState("-1"); // Using string for input
  const [sourceLayerIndex, setSourceLayerIndex] = useState("2");
  const [targetTokenIndex, setTargetTokenIndex] = useState("-3");
  const [targetLayerIndex, setTargetLayerIndex] = useState("2");
  const [nTokens, setNTokens] = useState("1");

  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const svgRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real application, you would make a fetch call to your Python backend here:
    // const response = await fetch('/api/patchify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     sourcePrompt,
    //     targetPrompt,
    //     sourceTokenIndex: parseInt(sourceTokenIndex),
    //     sourceLayerIndex: parseInt(sourceLayerIndex),
    //     targetTokenIndex: parseInt(targetTokenIndex),
    //     targetLayerIndex: parseInt(targetLayerIndex),
    //     nTokens: parseInt(nTokens),
    //   }),
    // });
    // const data = await response.json();
    // setSimulationResults(data);

    // For this demo, we'll use the mock function directly:
    const data = mockPatchify(
      sourcePrompt,
      targetPrompt,
      parseInt(sourceTokenIndex),
      parseInt(sourceLayerIndex),
      parseInt(targetTokenIndex),
      parseInt(targetLayerIndex),
      parseInt(nTokens)
    );
    setSimulationResults(data);
    setLoading(false);
  };

  const drawVisualization = useCallback(() => {
    if (!simulationResults) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawings

    const width = svgRef.current.clientWidth;
    const height = 600; // Fixed height for visualization
    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Layer heights and spacing
    const layerHeight = 80;
    const layerSpacing = 120; // Space between source and target layers

    // Token spacing
    const tokenWidth = 80;
    const tokenSpacing = 10;

    const sourceLayerY = margin.top;
    const targetLayerY = sourceLayerY + layerHeight + layerSpacing;

    // Adjust for negative token indices
    const getActualTokenIndex = (tokens, index) => {
      return index < 0 ? tokens.length + index : index;
    };

    const actualSourceTokenIndex = getActualTokenIndex(simulationResults.sourceTokens, parseInt(sourceTokenIndex));
    const actualTargetTokenIndex = getActualTokenIndex(simulationResults.targetTokens, parseInt(targetTokenIndex));

    // Group for the entire visualization
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Draw Source Prompt and Layer ---
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("class", "text-lg font-semibold")
      .text("Source Prompt & Activation");

    // Source Layer Rectangle
    g.append("rect")
      .attr("x", 0)
      .attr("y", sourceLayerY)
      .attr("width", chartWidth)
      .attr("height", layerHeight)
      .attr("fill", "#e0f7fa") // Light blue
      .attr("stroke", "#00bcd4") // Cyan
      .attr("stroke-width", 2)
      .attr("rx", 8) // Rounded corners
      .attr("ry", 8);

    g.append("text")
      .attr("x", 10)
      .attr("y", sourceLayerY + layerHeight / 2)
      .attr("dy", "0.35em")
      .attr("class", "text-sm text-gray-700")
      .text(`Layer ${sourceLayerIndex}`);

    // Source Tokens
    const sourceTokensGroup = g.selectAll(".source-token")
      .data(simulationResults.sourceTokens)
      .enter()
      .append("g")
      .attr("class", "source-token")
      .attr("transform", (d, i) => `translate(${i * (tokenWidth + tokenSpacing) + 100}, ${sourceLayerY + layerHeight / 2})`);

    sourceTokensGroup.append("rect")
      .attr("x", -tokenWidth / 2)
      .attr("y", -15)
      .attr("width", tokenWidth)
      .attr("height", 30)
      .attr("fill", (d, i) => i === actualSourceTokenIndex ? "#ffeb3b" : "#b2ebf2") // Yellow for source token, light cyan for others
      .attr("stroke", (d, i) => i === actualSourceTokenIndex ? "#fbc02d" : "#0097a7")
      .attr("stroke-width", 1)
      .attr("rx", 5)
      .attr("ry", 5);

    sourceTokensGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("class", "text-xs font-medium")
      .text(d => d.text);

    // --- Draw Target Prompt and Layer ---
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", targetLayerY - 20)
      .attr("text-anchor", "middle")
      .attr("class", "text-lg font-semibold")
      .text("Target Prompt & Patched Activation");

    // Target Layer Rectangle
    g.append("rect")
      .attr("x", 0)
      .attr("y", targetLayerY)
      .attr("width", chartWidth)
      .attr("height", layerHeight)
      .attr("fill", "#e8f5e9") // Light green
      .attr("stroke", "#4caf50") // Green
      .attr("stroke-width", 2)
      .attr("rx", 8)
      .attr("ry", 8);

    g.append("text")
      .attr("x", 10)
      .attr("y", targetLayerY + layerHeight / 2)
      .attr("dy", "0.35em")
      .attr("class", "text-sm text-gray-700")
      .text(`Layer ${targetLayerIndex}`);

    // Target Tokens
    const targetTokensGroup = g.selectAll(".target-token")
      .data(simulationResults.targetTokens)
      .enter()
      .append("g")
      .attr("class", "target-token")
      .attr("transform", (d, i) => `translate(${i * (tokenWidth + tokenSpacing) + 100}, ${targetLayerY + layerHeight / 2})`);

    targetTokensGroup.append("rect")
      .attr("x", -tokenWidth / 2)
      .attr("y", -15)
      .attr("width", tokenWidth)
      .attr("height", 30)
      .attr("fill", (d, i) => i === actualTargetTokenIndex ? "#ffccbc" : "#c8e6c9") // Light orange for target token, light green for others
      .attr("stroke", (d, i) => i === actualTargetTokenIndex ? "#ff7043" : "#66bb6a")
      .attr("stroke-width", 1)
      .attr("rx", 5)
      .attr("ry", 5);

    targetTokensGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("class", "text-xs font-medium")
      .text(d => d.text);

    // --- Draw Patching Arrow ---
    if (sourceLayerIndex === targetLayerIndex) {
      const sourceTokenX = actualSourceTokenIndex * (tokenWidth + tokenSpacing) + 100;
      const targetTokenX = actualTargetTokenIndex * (tokenWidth + tokenSpacing) + 100;

      g.append("path")
        .attr("d", d3.line()([
          [sourceTokenX, sourceLayerY + layerHeight - 15],
          [sourceTokenX, sourceLayerY + layerHeight + layerSpacing / 2],
          [targetTokenX, targetLayerY - 15]
        ]))
        .attr("stroke", "#ef5350") // Red
        .attr("stroke-width", 3)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrowhead)");

      g.append("text")
        .attr("x", (sourceTokenX + targetTokenX) / 2)
        .attr("y", sourceLayerY + layerHeight + layerSpacing / 2 - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#ef5350")
        .attr("class", "text-xs font-bold")
        .text("Patch Activation");

    } else {
      // If layers are different, draw a more general arrow
      const sourceTokenX = actualSourceTokenIndex * (tokenWidth + tokenSpacing) + 100;
      const targetTokenX = actualTargetTokenIndex * (tokenWidth + tokenSpacing) + 100;

      g.append("line")
        .attr("x1", sourceTokenX)
        .attr("y1", sourceLayerY + layerHeight / 2)
        .attr("x2", targetTokenX)
        .attr("y2", targetLayerY + layerHeight / 2)
        .attr("stroke", "#ef5350") // Red
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrowhead)");

      g.append("text")
        .attr("x", (sourceTokenX + targetTokenX) / 2)
        .attr("y", (sourceLayerY + layerHeight / 2 + targetLayerY + layerHeight / 2) / 2 - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#ef5350")
        .attr("class", "text-xs font-bold")
        .text("Patch Activation (Cross-Layer)");
    }

    // Define arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("refX", 6)
      .attr("refY", 6)
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 12 6 L 0 12 z")
      .attr("fill", "#ef5350");

  }, [simulationResults, sourceTokenIndex, sourceLayerIndex, targetTokenIndex, targetLayerIndex]);

  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]); // Redraw when simulationResults change

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 font-inter">
      {/* Removed: <Head> component and its content */}
      <main className="container mx-auto p-6 bg-white shadow-lg rounded-xl w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Patchscopes Visualizer</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col">
            <label htmlFor="sourcePrompt" className="mb-2 text-gray-700 font-medium">Source Prompt:</label>
            <input
              type="text"
              id="sourcePrompt"
              value={sourcePrompt}
              onChange={(e) => setSourcePrompt(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="targetPrompt" className="mb-2 text-gray-700 font-medium">Target Prompt:</label>
            <input
              type="text"
              id="targetPrompt"
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="sourceTokenIndex" className="mb-2 text-gray-700 font-medium">Source Token Index:</label>
            <input
              type="number"
              id="sourceTokenIndex"
              value={sourceTokenIndex}
              onChange={(e) => setSourceTokenIndex(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., -1 for last token"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="sourceLayerIndex" className="mb-2 text-gray-700 font-medium">Source Layer Index:</label>
            <input
              type="number"
              id="sourceLayerIndex"
              value={sourceLayerIndex}
              onChange={(e) => setSourceLayerIndex(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="targetTokenIndex" className="mb-2 text-gray-700 font-medium">Target Token Index:</label>
            <input
              type="number"
              id="targetTokenIndex"
              value={targetTokenIndex}
              onChange={(e) => setTargetTokenIndex(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., -3 for 'x' in 'x ->'"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="targetLayerIndex" className="mb-2 text-gray-700 font-medium">Target Layer Index:</label>
            <input
              type="number"
              id="targetLayerIndex"
              value={targetLayerIndex}
              onChange={(e) => setTargetLayerIndex(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label htmlFor="nTokens" className="mb-2 text-gray-700 font-medium">Number of Tokens to Generate:</label>
            <input
              type="number"
              id="nTokens"
              value={nTokens}
              onChange={(e) => setNTokens(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              disabled={loading}
            >
              {loading ? 'Simulating...' : 'Run Patchify Simulation'}
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center text-blue-600 text-lg my-4">
            Loading... Please wait for the simulation results.
          </div>
        )}

        {simulationResults && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Simulation Results:</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Original Source Output:</h3>
              <p className="text-gray-900">{simulationResults.sourceOutput}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Original Target Output:</h3>
              <p className="text-gray-900">{simulationResults.targetOutput}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Patched Target Output:</h3>
              <p className="text-blue-900 font-bold">{simulationResults.patchedOutput}</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Patching Visualization</h2>
            <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
              <svg ref={svgRef} className="w-full" height="600"></svg>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
