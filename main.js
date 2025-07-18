import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3'; // Import D3.js

const App = () => {
    // State for input parameters
    const [sourcePrompt, setSourcePrompt] = useState("Harry");
    const [targetPrompt, setTargetPrompt] = useState("Respond only with the completion to this pattern: Man -> man, Car -> car, x ->");
    const [sourceTokenIndex, setSourceTokenIndex] = useState("-1");
    const [sourceLayerIndex, setSourceLayerIndex] = useState("2");
    const [targetTokenIndex, setTargetTokenIndex] = useState("-3");
    const [targetLayerIndex, setTargetLayerIndex] = useState("2");
    const [nTokens, setNTokens] = useState("1");

    // State for results and loading
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Ref for the D3 visualization container
    const d3Container = useRef(null);

    // Simulate backend call for patching
    const runPatching = async () => {
        setLoading(true);
        setError(null);
        setResults(null); // Clear previous results

        try {
            // In a real application, you would make a fetch call to your backend here:
            // const response = await fetch('/api/patchify', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         sourcePrompt,
            //         targetPrompt,
            //         sourceTokenIndex: parseInt(sourceTokenIndex),
            //         sourceLayerIndex: parseInt(sourceLayerIndex),
            //         targetTokenIndex: parseInt(targetTokenIndex),
            //         targetLayerIndex: parseInt(targetLayerIndex),
            //         nTokens: parseInt(nTokens),
            //     }),
            // });
            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }
            // const data = await response.json();
            // setResults(data);

            // --- SIMULATED BACKEND RESPONSE (for demonstration) ---
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            const dummyResults = {
                source_tokens_output: "Harry",
                target_tokens_output: "man", // Original output for "x ->" might be "y" or something generic
                target_tokens_patched_output: "Harry", // Patched output should be "Harry"
                parameters: {
                    sourcePrompt,
                    targetPrompt,
                    sourceTokenIndex: parseInt(sourceTokenIndex),
                    sourceLayerIndex: parseInt(sourceLayerIndex),
                    targetTokenIndex: parseInt(targetTokenIndex),
                    targetLayerIndex: parseInt(targetLayerIndex),
                    nTokens: parseInt(nTokens),
                }
            };
            setResults(dummyResults);
            // --- END SIMULATED BACKEND RESPONSE ---

        } catch (err) {
            console.error("Error during patching:", err);
            setError("Failed to run patching. Please check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // D3.js visualization effect
    useEffect(() => {
        if (results && d3Container.current) {
            // Clear previous SVG content
            d3.select(d3Container.current).selectAll("*").remove();

            const width = d3Container.current.clientWidth;
            const height = 400; // Fixed height for the visualization
            const margin = { top: 20, right: 20, bottom: 20, left: 20 };

            const svg = d3.select(d3Container.current)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("preserveAspectRatio", "xMidYMid meet"); // Make it responsive

            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const vizWidth = width - margin.left - margin.right;
            const vizHeight = height - margin.top - margin.bottom;

            // Define colors
            const colorSource = "#4CAF50"; // Green for source
            const colorTarget = "#2196F3"; // Blue for target
            const colorPatched = "#FF9800"; // Orange for patched
            const colorArrow = "#F44336"; // Red for arrow

            // Title
            g.append("text")
                .attr("x", vizWidth / 2)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .attr("font-size", "1.2em")
                .attr("font-weight", "bold")
                .text("Patching Visualization");

            // --- Source Prompt & Output ---
            g.append("text")
                .attr("x", 0)
                .attr("y", 30)
                .attr("font-weight", "bold")
                .text("Source Prompt:");
            g.append("text")
                .attr("x", 120)
                .attr("y", 30)
                .text(results.parameters.sourcePrompt);

            g.append("text")
                .attr("x", 0)
                .attr("y", 60)
                .attr("font-weight", "bold")
                .text("Source Output:");
            g.append("text")
                .attr("x", 120)
                .attr("y", 60)
                .text(results.source_tokens_output)
                .attr("fill", colorSource);

            // --- Target Prompt & Outputs ---
            g.append("text")
                .attr("x", 0)
                .attr("y", 100)
                .attr("font-weight", "bold")
                .text("Target Prompt:");
            g.append("text")
                .attr("x", 120)
                .attr("y", 100)
                .text(results.parameters.targetPrompt);

            g.append("text")
                .attr("x", 0)
                .attr("y", 130)
                .attr("font-weight", "bold")
                .text("Original Target Output:");
            g.append("text")
                .attr("x", 180)
                .attr("y", 130)
                .text(results.target_tokens_output)
                .attr("fill", colorTarget);

            g.append("text")
                .attr("x", 0)
                .attr("y", 160)
                .attr("font-weight", "bold")
                .text("Patched Target Output:");
            g.append("text")
                .attr("x", 180)
                .attr("y", 160)
                .text(results.target_tokens_patched_output)
                .attr("fill", colorPatched);

            // --- Simplified Layer Diagram ---
            const layerBoxHeight = 40;
            const layerBoxWidth = vizWidth * 0.8;
            const layerYStart = 220;
            const layerSpacing = 60;

            // Source Layer Box
            g.append("rect")
                .attr("x", (vizWidth - layerBoxWidth) / 2)
                .attr("y", layerYStart)
                .attr("width", layerBoxWidth)
                .attr("height", layerBoxHeight)
                .attr("fill", colorSource)
                .attr("rx", 8)
                .attr("ry", 8)
                .attr("opacity", 0.2);
            g.append("text")
                .attr("x", vizWidth / 2)
                .attr("y", layerYStart + layerBoxHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .attr("fill", colorSource)
                .attr("font-weight", "bold")
                .text(`Source Layer ${results.parameters.sourceLayerIndex}`);

            // Target Layer Box
            g.append("rect")
                .attr("x", (vizWidth - layerBoxWidth) / 2)
                .attr("y", layerYStart + layerSpacing + layerBoxHeight)
                .attr("width", layerBoxWidth)
                .attr("height", layerBoxHeight)
                .attr("fill", colorTarget)
                .attr("rx", 8)
                .attr("ry", 8)
                .attr("opacity", 0.2);
            g.append("text")
                .attr("x", vizWidth / 2)
                .attr("y", layerYStart + layerSpacing + layerBoxHeight + layerBoxHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .attr("fill", colorTarget)
                .attr("font-weight", "bold")
                .text(`Target Layer ${results.parameters.targetLayerIndex}`);

            // Patching Arrow
            const arrowStartX = vizWidth / 2;
            const arrowStartY = layerYStart + layerBoxHeight;
            const arrowEndX = vizWidth / 2;
            const arrowEndY = layerYStart + layerSpacing + layerBoxHeight;

            g.append("line")
                .attr("x1", arrowStartX)
                .attr("y1", arrowStartY)
                .attr("x2", arrowEndX)
                .attr("y2", arrowEndY)
                .attr("stroke", colorArrow)
                .attr("stroke-width", 3)
                .attr("marker-end", "url(#arrowhead)");

            // Arrowhead definition
            svg.append("defs").append("marker")
                .attr("id", "arrowhead")
                .attr("viewBox", "-0 -5 10 10")
                .attr("refX", 5)
                .attr("refY", 0)
                .attr("orient", "auto")
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("xoverflow", "visible")
                .append("path")
                .attr("d", "M 0,-5 L 10,0 L 0,5 Z")
                .attr("fill", colorArrow)
                .style("stroke", "none");

            // Text for the patching action
            g.append("text")
                .attr("x", vizWidth / 2)
                .attr("y", arrowStartY + (arrowEndY - arrowStartY) / 2)
                .attr("text-anchor", "middle")
                .attr("dy", "-0.5em")
                .attr("font-size", "0.9em")
                .attr("fill", colorArrow)
                .text(`Patching token ${results.parameters.sourceTokenIndex} from Source to token ${results.parameters.targetTokenIndex} in Target`);

        }
    }, [results]); // Re-run effect when results change

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-sans">
            <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 space-y-6">
                <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
                    Patchscopes Interactive Visualization
                </h1>

                {/* Input Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sourcePrompt" className="block text-sm font-medium text-gray-700">Source Prompt</label>
                        <input
                            type="text"
                            id="sourcePrompt"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={sourcePrompt}
                            onChange={(e) => setSourcePrompt(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="targetPrompt" className="block text-sm font-medium text-gray-700">Target Prompt</label>
                        <input
                            type="text"
                            id="targetPrompt"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={targetPrompt}
                            onChange={(e) => setTargetPrompt(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="sourceTokenIndex" className="block text-sm font-medium text-gray-700">Source Token Index</label>
                        <input
                            type="number"
                            id="sourceTokenIndex"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={sourceTokenIndex}
                            onChange={(e) => setSourceTokenIndex(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="sourceLayerIndex" className="block text-sm font-medium text-gray-700">Source Layer Index</label>
                        <input
                            type="number"
                            id="sourceLayerIndex"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={sourceLayerIndex}
                            onChange={(e) => setSourceLayerIndex(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="targetTokenIndex" className="block text-sm font-medium text-gray-700">Target Token Index</label>
                        <input
                            type="number"
                            id="targetTokenIndex"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={targetTokenIndex}
                            onChange={(e) => setTargetTokenIndex(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="targetLayerIndex" className="block text-sm font-medium text-gray-700">Target Layer Index</label>
                        <input
                            type="number"
                            id="targetLayerIndex"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={targetLayerIndex}
                            onChange={(e) => setTargetLayerIndex(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="nTokens" className="block text-sm font-medium text-gray-700">Number of New Tokens to Generate</label>
                        <input
                            type="number"
                            id="nTokens"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={nTokens}
                            onChange={(e) => setNTokens(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={runPatching}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all duration-300
                            ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
                    >
                        {loading ? 'Running Patching...' : 'Run Patching'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
                        {error}
                    </div>
                )}

                {/* Visualization Area */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Visualization</h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                        {loading && (
                            <div className="flex flex-col items-center text-gray-600">
                                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2">Loading results...</p>
                            </div>
                        )}
                        {!loading && !results && (
                            <p className="text-gray-500">Enter parameters and click "Run Patching" to see the visualization.</p>
                        )}
                        {!loading && results && (
                            <div ref={d3Container} className="w-full h-full">
                                {/* D3.js will render here */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
