import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/signup", {
        username,
        password,
      });
      console.log("Signup response:", res.status, res.data);
      if (res.status === 201 || res.status === 200 || res.data.token) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        alert("Signup successful! You are now logged in.");
        navigate("/dashboard");
      } else {
        throw new Error(res.data.msg || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data?.msg || error.message);
      if (error.response?.status === 500) {
        alert("Signup failed: Server error. Please try again later.");
      } else if (error.response?.data?.msg === "Username already exists") {
        alert("Sign Up failed: Username already exists");
      } else {
        alert("Sign Up failed: " + (error.response?.data?.msg || error.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C2D] via-[#2A2A3D] to-[#3A3A4D] text-[#FFFFFF] overflow-hidden font-[Arial, sans-serif]">
      <nav className="bg-gradient-to-r from-[#2A2A3D] to-[#3A3A4D] p-4 shadow-lg fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
            <g>
              <text x="30" y="25" font-family="Arial, sans-serif" font-size="16" fill="#4A90E2" font-weight="bold">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
          <Link to="/login" className="px-4 py-2 bg-[#2A2A3D] text-[#FFFFFF] rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
            Login
          </Link>
        </div>
      </nav>

      <main className="container mx-auto pt-24 pb-16 flex items-center justify-center">
        <div className="bg-[#2A2A3D] p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>
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
              Sign Up
            </button>
          </form>
          <p className="mt-4 text-center text-[#B0B0B0]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#4A90E2] underline hover:text-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
              Log In
            </Link>
          </p>
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
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default SignUp;
