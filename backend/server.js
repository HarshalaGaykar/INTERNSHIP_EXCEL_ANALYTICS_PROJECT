const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
require("dotenv").config();

const requiredEnvironmentVariables = ["MONGO_URI", "JWT_SECRET"];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter((name) => !process.env[name]);
if (missingEnvironmentVariables.length) {
  throw new Error(`Missing environment variables: ${missingEnvironmentVariables.join(", ")}`);
}

const app = express();
const allowedOrigins = (
  process.env.CLIENT_URL ||
  "http://localhost:5173,http://localhost:3000,https://internship-excel-analytics-project-1.onrender.com"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Increased limit for large base64 images
app.use(express.urlencoded({ limit: "10mb", extended: true }));

connectDB(); // Connect to MongoDB

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("API running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((error, req, res, next) => {
  if (error instanceof require("multer").MulterError) {
    return res.status(400).json({ msg: error.code === "LIMIT_FILE_SIZE" ? "File must be 5 MB or smaller" : error.message });
  }
  if (error) return res.status(400).json({ msg: "Invalid upload request" });
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
