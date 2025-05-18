
import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist';

interface PlotlyGraphProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
}

export default function PlotlyGraph({ data, layout }: PlotlyGraphProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, data, layout, { responsive: true });
    }
  }, [data, layout]);

  return <div ref={plotRef} style={{ width: '100%', height: '100%' }} />;
}
