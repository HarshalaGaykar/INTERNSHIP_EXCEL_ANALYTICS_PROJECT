import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import VisualizeData from "./components/VisualizeData";
import { useState, useEffect } from "react";

function App() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(history));
  }, [history]);

  const addToHistory = (message) => {
    const now = new Date();
    const entry = {
      timestamp: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      message: message,
    };
    setHistory((prev) => [...prev, entry]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#1C1C2D] text-[#FFFFFF] font-[Arial, sans-serif] overflow-hidden hover:bg-[#2A2A3D] transition duration-300">
        <div className="w-full bg-[#2A2A3D] p-4 flex justify-center shadow-lg">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
            <g>
              <text x="30" y="25" font-family="Arial, sans-serif" font-size="16" fill="#4A90E2" font-weight="bold">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="user">
                <UserDashboard history={history} addToHistory={addToHistory} setHistory={setHistory} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visualize"
            element={
              <ProtectedRoute role="user">
                <VisualizeData addToHistory={addToHistory} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div className="text-center p-4 bg-[#2A2A3D] rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105">404 - Page Not Found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;