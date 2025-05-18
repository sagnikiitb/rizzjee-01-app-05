'use client';

import React, { useEffect, useRef, useState } from 'react';

type PlotlyGraphProps = {
  data: Partial<Plotly.PlotData>[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
};

const PlotlyGraph = ({ data, layout, config }: PlotlyGraphProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [graphVisible, setGraphVisible] = useState(false);
  console.log(`In File B`);

  useEffect(() => {
    const checkPlotly = () => {
      if (typeof window !== 'undefined' && typeof window.Plotly !== 'undefined') {
        setGraphVisible(true);
      } else {
        setTimeout(checkPlotly, 100); // retry every 100ms until Plotly is loaded
      }
    };

    checkPlotly();
  }, []);

  useEffect(() => {
    if (graphVisible && plotRef.current) {
      console.log(`Logging in file B data layout`);
      console.log(data);
      console.log(layout);
      window.Plotly.newPlot(plotRef.current, data, layout, config);
    }
  }, [graphVisible, data, layout, config]);

  return <div ref={plotRef}>{!graphVisible && <p>Loading chart...</p>}</div>;
};

export default PlotlyGraph;
