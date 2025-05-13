// Add Plotly to the Window interface
declare global {
  interface Window {
    Plotly: {
      newPlot: (id: string, data: any[], layout: Record<string, any>) => void;
      purge: (id: string) => void;
    }
  }
}

import React, { useState, useEffect, useRef } from 'react';

// Define TypeScript interfaces for component props
interface PlotlyGraphProps {
  data: any[]; // Could be more specific depending on your Plotly data structure
  layout?: Record<string, any>;
  graphVisible?: boolean;
}

const PlotlyGraph: React.FC<PlotlyGraphProps> = ({ 
  data, 
  layout = {}, 
  graphVisible = true 
}) => {
  // Generate a unique ID for the graph container
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  // Create a unique graph ID using useState to keep it stable across renders
  const [graphId] = useState<string>(`graph-${generateId()}`);
  
  // Create a ref to access the DOM element
  const graphRef = useRef<HTMLDivElement>(null);
  
  // Initialize or update the Plotly graph when data, layout, or visibility changes
  useEffect(() => {
    // Only create the plot if the component is visible and we have data
    if (graphVisible && data && graphRef.current) {
      // Check if Plotly is available in the window object
      if (window.Plotly) {
        // Create a new plot or update existing one
        window.Plotly.newPlot(graphId, data, layout || {});
        
        // Clean up function to be called when component unmounts
        return () => {
          if (document.getElementById(graphId)) {
            window.Plotly.purge(graphId);
          }
        };
      }
    }
  }, [graphId, data, layout, graphVisible]);

  // Only render the graph container if graphVisible is true
  return (
    <div>
      {graphVisible && (
        <div className="border border-gray-200 rounded-md bg-white">
          <div id={graphId} ref={graphRef} className="w-full h-96 p-4"></div>
        </div>
      )}
    </div>
  );
};

export default PlotlyGraph;
