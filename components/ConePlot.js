'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ConePlot() {
  const [data, setData] = useState(null);
  const backend = process.env.NEXT_PUBLIC_PLOT_BACKEND_URL;

  useEffect(() => {
    fetch(`${backend}/cone`)
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  if (!data) return <p>Loading 3D plot...</p>;

  return (
    <div style={{ border: '2px solid #ccc', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
      <h3>3D Cone Visualization</h3>
      <Plot
        data={data.data}
        layout={{ ...data.layout, responsive: true }}
        config={{ displayModeBar: true }}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
}
