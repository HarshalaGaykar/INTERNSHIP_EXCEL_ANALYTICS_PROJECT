const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if already connected to avoid multiple connections
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    } else {
      console.log("MongoDB already connected");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;