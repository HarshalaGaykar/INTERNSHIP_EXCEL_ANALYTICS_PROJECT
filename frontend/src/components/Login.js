import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await api.post("/auth/login", { username, password });
    // After successful login, fetch user role via /auth/me
    const meRes = await api.get("/auth/me");
    const role = meRes.data.role?.toLowerCase();
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  } catch (error) {
    console.error("Login error:", error.response?.data?.msg || error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    alert("Login failed: " + (error.response?.data?.msg || error.message));
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C2D] via-[#2A2A3D] to-[#3A3A4D] text-[#FFFFFF] overflow-hidden fontFamily-[Arial, sans-serif]">
      <nav className="bg-gradient-to-r from-[#2A2A3D] to-[#3A3A4D] p-4 shadow-lg fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="excel-logo">
            <g>
              <text x="30" y="25" className="logo-text">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
          <Link to="/signup" className="px-4 py-2 bg-[#2A2A3D] text-[#FFFFFF] rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="container mx-auto pt-24 pb-16 flex items-center justify-center">
        <div className="bg-[#2A2A3D] p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-[#3A3A4D] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#3A3A4D] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="mt-2 text-[#B0B0B0]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#4A90E2] underline hover:text-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-[#2A2A3D] p-4 mt-auto text-center">
        <p className="text-sm text-[#B0B0B0] font-[Arial, sans-serif]">© 2025 Excel Analytics Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Animations
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 1s ease-out;
  }
  .excel-logo .logo-text {
    font-family: Arial, sans-serif;
    font-size: 16px;
    fill: #4A90E2;
    font-weight: bold;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Login;
