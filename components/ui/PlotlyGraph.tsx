'use client';
import React, { useState, useEffect, useRef } from 'react';
interface PlotlyGraphProps {
  graphId: string;
  data: any[]; 
  layout?: Record<string, any>;
  graphVisible?: boolean;
}

const PlotlyGraph: React.FC<PlotlyGraphProps> = ({
  graphId,
  data, 
  layout = {}, 
  graphVisible = true 
}) => {
  const graphRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!graphVisible) return;
    const renderPlot = async () => {
    // Only create the plot if the component is visible and we have data
    if (graphVisible && data && graphRef.current) {
      console.log(`Is graph visible?`);
      console.log(graphVisible);
      console.log(`What is graphRef.current  ?`);
      console.log(graphRef.current);
      // Check if Plotly is available in the window object
      const plotly = (window as any).Plotly;
      if (plotly) {
        // Create a new plot or update existing one
        plotly.newPlot(graphId, data, layout || {});
        console.log(`plotly object description`);
        console.log(plotly);
        console.log(`Props Description : graphId, data, layout`);
        console.log(graphId);
        console.log(data);
        console.log(layout);
      }
    }
    
    
        // Clean up function to be called when component unmounts
        return () => {
          if (typeof window !== 'undefined' && plotly) {
            plotly.purge(graphId);
          }
        };
    }
  }, [graphId, data, layout, graphVisible]);

  // Only render the graph container if graphVisible is true
  return (
    <div>
      {graphVisible && (
        <div className="border border-gray-200 rounded-md bg-white">
          <div id={graphId} ref={graphRef} className="w-full h-96 p-4">
            Graph to be displayed here {graphId}

          
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotlyGraph;
