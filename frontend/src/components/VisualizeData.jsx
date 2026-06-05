import React, { useState, useEffect, useRef } from "react";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import PlotlyChart from "./PlotlyChart";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const VisualizeData = () => {
  const [data, setData] = useState({ rawData: [], labels: [], values: [], filename: "", columns: [] });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const chartRefs = useRef({});
  const graphRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const uploadId = location.state?.uploadId || localStorage.getItem("uploadId");

  useEffect(() => {
    const fetchData = async () => {
      if (!uploadId) {
        console.log("No uploadId, navigating to dashboard");
        navigate("/dashboard");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token, navigating to login");
        navigate("/login");
        return;
      }

      try {
        const res = await api.get(`/upload/${uploadId}`, {
          headers: { "x-auth-token": token },
        });
        if (!res.data.data || res.data.data.length === 0) {
          throw new Error("No data found for the provided uploadId");
        }
        const firstRow = res.data.data[0];
        const columns = Object.keys(firstRow);
        const labels = res.data.data.map((row) => row[columns[0]] || "N/A");
        const values = res.data.data.map((row) => {
          const value = row[columns[1]];
          return isNaN(value) || value === undefined ? 0 : Number(value);
        });
        setData({ rawData: res.data.data, labels, values, filename: res.data.filename || "Unknown", columns });
        console.log("Fetched data:", { rawData: res.data.data, labels, values, columns });
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setData({ rawData: [], labels: [], values: [], filename: "Error loading data", columns: [] });
        alert("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, uploadId]);

  const getNumericalColumns = (data) => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter((key) =>
      data.every((row) => !isNaN(parseFloat(row[key])) && isFinite(row[key]))
    );
  };

  const getChartData = (xAxis, yAxis) => {
    if (!xAxis || !yAxis || !data.rawData.length) return null;
    const labels = data.rawData.map((row) => row[xAxis] || `Row ${data.rawData.indexOf(row) + 1}`);
    const values = data.rawData.map((row) => parseFloat(row[yAxis]) || 0);
    console.log("Chart labels:", labels, "Chart values:", values);
    return {
      labels,
      datasets: [
        {
          label: `${yAxis} vs ${xAxis}`,
          data: values,
          ...(chartType === "2d-bar" && {
            backgroundColor: "rgba(74, 144, 226, 0.2)",
            borderColor: "#4A90E2",
            borderWidth: 1,
          }),
          ...(chartType === "2d-line" && {
            borderColor: "#4A90E2",
            tension: 0.1,
            fill: false,
          }),
          ...(chartType === "2d-pie" && {
            backgroundColor: ["#4A90E2", "#6BB9F4", "#FF6384", "#36A2EB", "#FFCE56", "#9966FF"],
          }),
          ...(chartType === "2d-scatter" && {
            backgroundColor: "rgba(74, 144, 226, 0.6)",
            pointRadius: 5,
          }),
        },
      ],
    };
  };

  const getPlotlyData = (xAxis, yAxis, type) => {
    if (!xAxis || !yAxis || !data.rawData.length) return [];
    const x = data.rawData.map((row) => row[xAxis] || `Row ${data.rawData.indexOf(row) + 1}`);
    const y = data.rawData.map((row) => parseFloat(row[yAxis]) || 0);
    const z = x.map((_, index) => index + 1);
    console.log("Plotly data:", { x, y, z, type });
    return [
      {
        x,
        y,
        z,
        type: "scatter3d",
        mode: type === "3d-line" ? "lines+markers" : "markers",
        marker: { color: y, colorscale: "Blues", size: type === "3d-scatter" ? 8 : 5 },
        line: type === "3d-line" ? { color: "#4A90E2", width: 2 } : undefined,
        name: yAxis,
      },
    ];
  };

  const downloadPNG = () => {
    if (!chartType || !xAxis || !yAxis) {
      alert("Please select chart type and axes before downloading.");
      return;
    }
    const chartElement = chartType.startsWith("2d") ? chartRefs.current[chartType] : document.querySelector("#plotly-chart .js-plotly-plot");
    if (chartElement) {
      chartElement.classList.remove("hidden");
      chartElement.style.position = "absolute";
      chartElement.style.left = "-9999px";
      chartElement.style.display = "block";

      html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#2A2A3D",
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `${data.filename.split(".")[0]}_${chartType}_chart.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        chartElement.classList.add("hidden");
        chartElement.style.position = "";
        chartElement.style.left = "";
        chartElement.style.display = "";
      }).catch((error) => {
        console.error("html2canvas error for PNG:", error);
        alert("Failed to download PNG. Please try again.");
      });
    } else {
      console.error("Chart element not found for chartType:", chartType);
      alert("No chart to download as PNG!");
    }
  };

  const downloadPDF = async () => {
    if (!chartType || !xAxis || !yAxis) {
      alert("Please select chart type and axes before downloading.");
      return;
    }
    const chartElement = chartType.startsWith("2d") ? chartRefs.current[chartType] : document.querySelector("#plotly-chart .js-plotly-plot");
    if (chartElement) {
      chartElement.classList.remove("hidden");
      chartElement.style.position = "absolute";
      chartElement.style.left = "-9999px";
      chartElement.style.display = "block";

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#2A2A3D",
        logging: true,
      });
      chartElement.classList.add("hidden");
      chartElement.style.position = "";
      chartElement.style.left = "";
      chartElement.style.display = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${data.filename.split(".")[0]}_${chartType}_chart.pdf`);
    } else {
      console.error("Chart element not found for chartType:", chartType);
      alert("No chart to download as PDF!");
    }
  };

  const saveVisualization = async () => {
    if (!chartType || !xAxis || !yAxis) {
      alert("Please select chart type and axes before saving.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token || !uploadId) throw new Error("No token or uploadId found");

      let image = "";
      if (chartType.startsWith("2d") && chartRefs.current[chartType]) {
        chartRefs.current[chartType].classList.remove("hidden");
        chartRefs.current[chartType].style.position = "absolute";
        chartRefs.current[chartType].style.left = "-9999px";
        chartRefs.current[chartType].style.display = "block";

        const canvas = await html2canvas(chartRefs.current[chartType], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#2A2A3D",
        });
        image = canvas.toDataURL("image/png");

        chartRefs.current[chartType].classList.add("hidden");
        chartRefs.current[chartType].style.position = "";
        chartRefs.current[chartType].style.left = "";
        chartRefs.current[chartType].style.display = "";
      } else if (chartType.startsWith("3d") && document.querySelector("#plotly-chart .js-plotly-plot")) {
        const chartElement = document.querySelector("#plotly-chart .js-plotly-plot");
        chartElement.classList.remove("hidden");
        chartElement.style.position = "absolute";
        chartElement.style.left = "-9999px";
        chartElement.style.display = "block";

        const canvas = await html2canvas(chartElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#2A2A3D",
        });
        image = canvas.toDataURL("image/png");

        chartElement.classList.add("hidden");
        chartElement.style.position = "";
        chartElement.style.left = "";
        chartElement.style.display = "";
      }

      const vizData = {
        type: chartType,
        data: chartType.startsWith("2d") ? getChartData(xAxis, yAxis)?.datasets : getPlotlyData(xAxis, yAxis, chartType),
        xAxis,
        yAxis,
        image,
        filename: data.filename, // Include filename for history
        createdAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }), // Upload date
      };

      const response = await api.post(
        `/upload/visualize/${uploadId}`,
        vizData,
        { headers: { "x-auth-token": token } }
      );
      console.log("Save response:", response.data);
      alert("Visualization saved!");
    } catch (error) {
      console.error("Error saving visualization:", error.message);
      alert("Failed to save visualization");
    }
  };

  if (loading) return <div className="text-center p-4 text-[#FFFFFF] font-[Arial, sans-serif] text-lg">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1C1C2D] text-[#FFFFFF]">
      <nav className="bg-[#2A2A3D] p-4 shadow-lg fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
            <g>
              <text x="30" y="25" font-family="Arial, sans-serif" font-size="16" fill="#4A90E2" font-weight="bold">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-transparent border-2 border-[#4A90E2] text-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="px-4 py-2 bg-transparent border-2 border-[#4A90E2] text-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto pt-24 pb-16">
        <section className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow animate-fade-in" id="chartSection">
          <h2 className="text-2xl mb-6 font-semibold text-[#FFFFFF] font-[Arial, sans-serif]">{data.filename.split(".")[0] || "Unknown"} Visualization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#2A2A3D] p-4 rounded-lg border border-[#4A90E2]">
              <h3 className="text-lg mb-4 font-medium text-[#FFFFFF] font-[Arial, sans-serif]">Sample Data</h3>
              <table className="w-full text-left border-collapse border border-[#4A90E2]">
                <thead>
                  <tr className="bg-[#3A3A4D]">
                    {data.columns.map((col, index) => (
                      <th key={index} className="p-2 border-b border-[#4A90E2] text-[#FFFFFF] font-[Arial, sans-serif] text-sm">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rawData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-[#3A3A4D]">
                      {data.columns.map((col, colIndex) => (
                        <td key={colIndex} className="p-2 border-b border-[#4A90E2] text-[#B0B0B0] font-[Arial, sans-serif] text-sm">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="p-2 bg-[#2A2A3D] text-[#FFFFFF] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 font-[Arial, sans-serif] text-sm"
                >
                  <option value="">Select X-Axis</option>
                  {data.columns.map((col, index) => (
                    <option key={index} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="p-2 bg-[#2A2A3D] text-[#FFFFFF] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 font-[Arial, sans-serif] text-sm"
                >
                  <option value="">Select Y-Axis</option>
                  {getNumericalColumns(data.rawData).map((col, index) => (
                    <option key={index} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full p-2 bg-[#2A2A3D] text-[#FFFFFF] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 font-[Arial, sans-serif] text-sm"
              >
                <option value="">Select Chart Type</option>
                <option value="2d-line">2D Line Graph</option>
                <option value="2d-bar">2D Bar Graph</option>
                <option value="2d-pie">2D Pie Chart</option>
                <option value="2d-scatter">2D Scatter Plot</option>
                <option value="3d-scatter">3D Scatter Plot</option>
                <option value="3d-line">3D Line Graph</option>
              </select>
              <div className="h-96 bg-[#2A2A3D] rounded-lg border border-[#4A90E2]" style={{ position: "relative", width: "100%", height: "400px" }}>
                {chartType.startsWith("2d") && xAxis && yAxis && (
                  <div className="h-full" ref={(el) => (chartRefs.current[chartType] = el)} id={`${chartType}-chart`}>
                    {chartType === "2d-line" && (
                      <Line
                        data={getChartData(xAxis, yAxis)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#FFFFFF", font: { family: "Arial, sans-serif" } } },
                            title: { display: true, text: `${yAxis} vs ${xAxis} (2D Line)`, color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 24 } },
                            datalabels: { color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 14 } },
                          },
                          scales: {
                            x: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                            y: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                          },
                        }}
                      />
                    )}
                    {chartType === "2d-bar" && (
                      <Bar
                        data={getChartData(xAxis, yAxis)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#FFFFFF", font: { family: "Arial, sans-serif" } } },
                            title: { display: true, text: `${yAxis} vs ${xAxis} (2D Bar)`, color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 24 } },
                            datalabels: { color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 14 } },
                          },
                          scales: {
                            x: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                            y: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                          },
                        }}
                      />
                    )}
                    {chartType === "2d-pie" && (
                      <Pie
                        data={getChartData(xAxis, yAxis)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#FFFFFF", font: { family: "Arial, sans-serif" } } },
                            title: { display: true, text: `${yAxis} vs ${xAxis} (2D Pie)`, color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 24 } },
                            datalabels: { color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 14 } },
                          },
                        }}
                      />
                    )}
                    {chartType === "2d-scatter" && (
                      <Scatter
                        data={getChartData(xAxis, yAxis)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#FFFFFF", font: { family: "Arial, sans-serif" } } },
                            title: { display: true, text: `${yAxis} vs ${xAxis} (2D Scatter)`, color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 24 } },
                            datalabels: { color: "#FFFFFF", font: { family: "Arial, sans-serif", size: 14 } },
                          },
                          scales: {
                            x: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                            y: { ticks: { color: "#B0B0B0", font: { family: "Arial, sans-serif" } } },
                          },
                        }}
                      />
                    )}
                  </div>
                )}
                {chartType.startsWith("3d") && xAxis && yAxis && (
                  <div id="plotly-chart" ref={(el) => (graphRefs.current[chartType] = el)} style={{ width: "100%", height: "400px" }}>
                    <PlotlyChart
                      data={getPlotlyData(xAxis, yAxis, chartType)}
                      layout={{
                        title: { text: `${yAxis} vs ${xAxis} (${chartType.replace("3d-", "3D ")})`, font: { color: "#FFFFFF", family: "Arial, sans-serif", size: 24 } },
                        scene: {
                          xaxis: { title: xAxis, titlefont: { color: "#FFFFFF", family: "Arial, sans-serif" }, tickfont: { color: "#B0B0B0", family: "Arial, sans-serif" } },
                          yaxis: { title: yAxis, titlefont: { color: "#FFFFFF", family: "Arial, sans-serif" }, tickfont: { color: "#B0B0B0", family: "Arial, sans-serif" } },
                          zaxis: { title: "Row", titlefont: { color: "#FFFFFF", family: "Arial, sans-serif" }, tickfont: { color: "#B0B0B0", family: "Arial, sans-serif" } },
                        },
                        margin: { l: 30, r: 30, b: 30, t: 50 },
                        height: 400,
                        paper_bgcolor: "#2A2A3D",
                        plot_bgcolor: "#2A2A3D",
                      }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={downloadPNG}
                  className="px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
                >
                  Download PNG
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
                >
                  Download PDF
                </button>
                <button
                  onClick={saveVisualization}
                  className="px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
                >
                  Save Visualization
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[#B0B0B0] text-center font-[Arial, sans-serif] text-sm">Select axes and chart type to visualize data.</p>
        </section>
      </main>

      <footer className="bg-[#2A2A3D] p-4 mt-auto text-center">
        <p className="text-sm text-[#B0B0B0] font-[Arial, sans-serif]">© 2025 Excel Analytics Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 1s ease-out;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default VisualizeData;
