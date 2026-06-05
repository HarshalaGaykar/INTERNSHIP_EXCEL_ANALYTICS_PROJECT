import { useEffect, useRef } from "react";
import Plotly from "plotly.js-gl3d-dist-min";

const PlotlyChart = ({ data, layout, style }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;

    Plotly.react(chart, data, layout, { responsive: true, displaylogo: false });
    return () => Plotly.purge(chart);
  }, [data, layout]);

  return <div ref={chartRef} style={style} />;
};

export default PlotlyChart;
