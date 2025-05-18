'use client';

import React, { useEffect, useRef, useState } from 'react';

type PlotlyGraphProps = {
  data: Partial<Plotly.PlotData>[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
};

const PlotlyGraph = ({ data, layout, config }: PlotlyGraphProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [isPlotlyReady, setIsPlotlyReady] = useState(false);

  useEffect(() => {
    const checkPlotly = () => {
      if (typeof window !== 'undefined' && typeof window.Plotly !== 'undefined') {
        setIsPlotlyReady(true);
      } else {
        setTimeout(checkPlotly, 100); // retry every 100ms until Plotly is loaded
      }
    };

    checkPlotly();
  }, []);

  useEffect(() => {
    if (isPlotlyReady && plotRef.current) {
      console.log(`Logging in file B data layout`);
      console.log(data);
      console.log(layout);
      window.Plotly.newPlot(plotRef.current, data, layout, config);
    }
  }, [isPlotlyReady, data, layout, config]);

  return <div ref={plotRef}>{!isPlotlyReady && <p>Loading chart...</p>}</div>;
};

export default PlotlyGraph;
