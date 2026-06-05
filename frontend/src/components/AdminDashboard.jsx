import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsersLoggedIn: 0,
    totalFilesUploaded: 0,
    mostUsedChartTypes: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to login at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
          navigate("/login");
          return;
        }

        const userRes = await api.get("/auth/me", {
          headers: { "x-auth-token": token },
        });
        console.log("User response:", userRes.data);
        const userRole = userRes.data.role; // Extract role
        if (!userRole || userRole !== "admin") {
          console.log("Non-admin role or undefined role detected, redirecting to dashboard at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
          navigate("/dashboard");
          return;
        }

        const statsRes = await api.get("/admin/stats", {
          headers: { "x-auth-token": token },
        });
        setStats({
          totalUsersLoggedIn: statsRes.data.totalUsersLoggedIn || 0,
          totalFilesUploaded: statsRes.data.totalFilesUploaded || 0,
          mostUsedChartTypes: statsRes.data.mostUsedChartTypes || [],
        });

        const usersRes = await api.get("/admin/users", {
          headers: { "x-auth-token": token },
        });
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Error fetching admin data:", err.message, err.response?.data);
        setError("Failed to load admin data. Check server or permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    console.log("Logging out at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    localStorage.removeItem("token");
    navigate("/login");
  };

  const blockUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/admin/users/${userId}/block`,
        {},
        { headers: { "x-auth-token": token } }
      );
      setUsers(users.map((user) => (user._id === userId ? { ...user, isBlocked: true } : user)));
      console.log(`User ${userId} blocked at`, new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err) {
      console.error("Error blocking user:", err.message);
      setError("Failed to block user.");
    }
  };

  const unblockUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/admin/users/${userId}/unblock`,
        {},
        { headers: { "x-auth-token": token } }
      );
      setUsers(users.map((user) => (user._id === userId ? { ...user, isBlocked: false } : user)));
      console.log(`User ${userId} unblocked at`, new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err) {
      console.error("Error unblocking user:", err.message);
      setError("Failed to unblock user.");
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/admin/users/${userId}`, {
        headers: { "x-auth-token": token },
      });
      setUsers(users.filter((user) => user._id !== userId));
      console.log(`User ${userId} deleted at`, new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err) {
      console.error("Error deleting user:", err.message);
      setError("Failed to delete user.");
    }
  };

  if (loading) return <div className="text-center p-4 text-[#FFFFFF] font-[Arial, sans-serif]">Loading...</div>;
  if (error) return <div className="text-center p-4 text-[#FF4D4D] font-[Arial, sans-serif]">{error}</div>;

  return (
    <div className="min-h-screen bg-[#1C1C2D] text-[#FFFFFF] fontFamily-[Arial, sans-serif] overflow-hidden hover:bg-[#2A2A3D] transition duration-300">
      <nav className="bg-[#2A2A3D] p-4 shadow-lg fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="excel-logo">
            <g>
              <text x="30" y="25" className="logo-text">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-transparent border-2 border-[#4A90E2] text-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="container mx-auto pt-24 pb-16 animate-fade-in-up">
        <header className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <h1 className="text-3xl font-bold text-center">Admin Dashboard</h1>
          <p className="mt-2 text-[#B0B0B0] text-center font-[Arial, sans-serif] text-sm">Manage users and view platform statistics.</p>
        </header>

        <section className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-[#4A90E2] mb-4 font-[Arial, sans-serif]">User Management</h2>
            <div className="space-y-4">
              <div className="bg-[#2A2A3D] p-4 rounded-lg border border-[#4A90E2]">
                <h3 className="text-lg font-medium">Total Users Logged In</h3>
                <p className="text-2xl text-[#4A90E2] font-[Arial, sans-serif]">{stats.totalUsersLoggedIn}</p>
              </div>
              {users.length > 0 ? (
                <div className="overflow-y-auto max-h-64 space-y-2">
                  <table className="w-full text-left border-collapse border border-[#4A90E2]">
                    <thead>
                      <tr className="bg-[#2A2A3D]">
                        <th className="p-2 border-b border-[#4A90E2] text-[#FFFFFF] font-[Arial, sans-serif] text-sm">Index</th>
                        <th className="p-2 border-b border-[#4A90E2] text-[#FFFFFF] font-[Arial, sans-serif] text-sm">Username</th>
                        <th className="p-2 border-b border-[#4A90E2] text-[#FFFFFF] font-[Arial, sans-serif] text-sm">Status</th>
                        <th className="p-2 border-b border-[#4A90E2] text-[#FFFFFF] font-[Arial, sans-serif] text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={user._id} className="hover:bg-[#2A2A3D]">
                          <td className="p-2 border-b border-[#4A90E2] text-[#B0B0B0] font-[Arial, sans-serif] text-sm">{index + 1}</td>
                          <td className="p-2 border-b border-[#4A90E2] text-[#B0B0B0] font-[Arial, sans-serif] text-sm">{user.username}</td>
                          <td className="p-2 border-b border-[#4A90E2] text-[#B0B0B0] font-[Arial, sans-serif] text-sm">{user.isBlocked ? "Blocked" : "Active"}</td>
                          <td className="p-2 border-b border-[#4A90E2] text-[#B0B0B0] font-[Arial, sans-serif] text-sm">
                            <div className="space-x-2">
                              <button
                                onClick={() => (user.isBlocked ? unblockUser(user._id) : blockUser(user._id))}
                                className={`px-2 py-1 rounded ${user.isBlocked ? "bg-[#4A90E2] hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]" : "bg-[#FF4D4D] hover:bg-[#FF6666] focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"} text-[#FFFFFF] font-[Arial, sans-serif] text-sm transition duration-300 transform hover:scale-105`}
                              >
                                {user.isBlocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="px-2 py-1 bg-[#FFCC00] hover:bg-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-[#FFFFFF] font-[Arial, sans-serif] text-sm rounded transition duration-300 transform hover:scale-105"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#B0B0B0] font-[Arial, sans-serif] text-sm">No users to manage.</p>
              )}
            </div>
          </div>

          <div className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-[#4A90E2] mb-4 font-[Arial, sans-serif]">Statistics</h2>
            <div className="space-y-4">
              <div className="bg-[#2A2A3D] p-4 rounded-lg border border-[#4A90E2]">
                <h3 className="text-lg font-medium">Total Files Uploaded</h3>
                <p className="text-2xl text-[#4A90E2] font-[Arial, sans-serif]">{stats.totalFilesUploaded}</p>
              </div>
              <div className="bg-[#2A2A3D] p-4 rounded-lg border border-[#4A90E2]">
                <h3 className="text-lg font-medium">Total Users Logged In</h3>
                <p className="text-2xl text-[#4A90E2] font-[Arial, sans-serif]">{stats.totalUsersLoggedIn}</p>
              </div>
              <div className="bg-[#2A2A3D] p-4 rounded-lg border border-[#4A90E2]">
                <h3 className="text-lg font-medium">Most Used Chart Types</h3>
                <ul className="text-[#B0B0B0] font-[Arial, sans-serif] text-sm">
                  {stats.mostUsedChartTypes.map((type, index) => (
                    <li key={index}>{type.type}: {type.count} times</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
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

export default AdminDashboard;
