import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Home = () => {
  const sampleChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Sample Sales Data",
        data: [12, 19, 3, 5, 2],
        borderColor: "rgba(74, 144, 226, 1)", // #4A90E2
        backgroundColor: "rgba(74, 144, 226, 0.2)", // #4A90E2 with opacity
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#FFFFFF" } },
      title: { display: true, text: "Sample Data Visualization", color: "#FFFFFF" },
    },
    scales: {
      x: { ticks: { color: "#FFFFFF" } },
      y: { ticks: { color: "#FFFFFF" } },
    },
  };

  const particlesRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const animateElements = () => {
      const elements = document.querySelectorAll(".fade-in");
      elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.2}s`;
        el.classList.add("animate-fade-in");
      });
    };
    animateElements();

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (particlesRef.current) {
      particlesRef.current.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    let particlesArray = [];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.fillStyle = `rgba(74, 144, 226, ${Math.random() * 0.5 + 0.2})`; // #4A90E2
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      for (let i = 0; i < 100; i++) {
        particlesArray.push(new Particle());
      }
    };
    init();

    const animate = () => {
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update();
          particlesArray[i].draw();
        }
        requestAnimationFrame(animate);
      }
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleScroll = () => {
      const featuresSection = featuresRef.current;
      if (featuresSection) {
        const rect = featuresSection.getBoundingClientRect();
        const isOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
        if (isOutOfView) {
          featuresSection.style.opacity = "0";
          featuresSection.style.transition = "opacity 0.5s";
        } else {
          featuresSection.style.opacity = "1";
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (particlesRef.current && canvas.parentNode === particlesRef.current) {
        particlesRef.current.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C2D] via-[#2A2A3D] to-[#3A3A4D] text-[#FFFFFF] overflow-hidden relative font-[Arial, sans-serif]">
      <div ref={particlesRef} className="absolute inset-0 z-0 opacity-30 pointer-events-none" />
      <main className="container mx-auto pt-24 pb-16 relative z-10">
        <section className="text-center px-4">
          <motion.div
            className="mb-6 fade-in"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
              <g>
                {/* Gradient text for better visibility */}
                <defs>
                  <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#4A90E2" }} />
                    <stop offset="100%" style={{ stopColor: "#FFD1DC" }} />
                  </linearGradient>
                </defs>
                <text
                  x="40"
                  y="40"
                  fontFamily="Arial, sans-serif"
                  fontSize="24"
                  fontWeight="bold"
                  fill="url(#textGradient)"
                >
                  Excel Analytics
                </text>
                {/* Repositioned rectangles to avoid text overlap */}
                <rect x="10" y="10" width="5" height="40" fill="#4A90E2" />
                <rect x="20" y="15" width="5" height="35" fill="#4A90E2" />
                <rect x="30" y="5" width="5" height="45" fill="#4A90E2" />
              </g>
            </svg>
          </motion.div>
          <motion.p
            className="text-xl mb-8 fade-in max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Transform your Excel data into stunning 2D/3D visualizations with ease. Upload files, analyze trends and manage your platform—designed for users and admins alike with secure, intuitive features.
          </motion.p>
          <motion.div
            className="mb-10 fade-in relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="w-full max-w-2xl mx-auto h-64 bg-[#2A2A3D] rounded-lg p-4 shadow-lg transform hover:scale-105 transition duration-300">
              <Line data={sampleChartData} options={chartOptions} />
            </div>
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#2A2A3D]/50 to-[#3A3A4D]/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-[#FFFFFF] font-bold"
              whileHover={{ opacity: 1 }}
            >
              Click to Explore More!
            </motion.div>
          </motion.div>
          <motion.div
            className="space-x-4 fade-in flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              to="/login"
              className="px-6 py-3 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
            
          </motion.div>
        </section>

        <section ref={featuresRef} className="mt-16 text-center fade-in">
          <motion.h2
            className="text-3xl font-semibold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <motion.div
              className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              <h3 className="text-xl font-bold text-[#4A90E2] mb-2">Data Upload</h3>
              <p className="text-[#B0B0B0]">Easily upload Excel files and start visualizing your data instantly.</p>
            </motion.div>
            <motion.div
              className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              whileHover={{ scale: 1.05, rotate: -1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <h3 className="text-xl font-bold text-[#4A90E2] mb-2">Advanced Visuals</h3>
              <p className="text-[#B0B0B0]">Create 2D and 3D charts with customizable axes and styles.</p>
            </motion.div>
            <motion.div
              className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <h3 className="text-xl font-bold text-[#4A90E2] mb-2">User Management</h3>
              <p className="text-[#B0B0B0]">Admins can manage users with secure access controls.</p>
            </motion.div>
          </div>
        </section>

        <section className="mt-16 text-center fade-in">
          <motion.h2
            className="text-3xl font-semibold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            Get Involved
          </motion.h2>
          <motion.div
            className="flex justify-center space-x-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <Link
              to="/login"
              className="px-6 py-3 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Sign Up
            </Link>
          </motion.div>
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
    animation: fadeIn 1s ease-out forwards;
  }
  .fade-in {
    opacity: 0;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Home;