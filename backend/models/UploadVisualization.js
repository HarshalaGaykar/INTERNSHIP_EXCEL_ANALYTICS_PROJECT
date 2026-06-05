const mongoose = require("mongoose");

const uploadVisualizationSchema = new mongoose.Schema({
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: "Upload", required: true },
  type: { type: String, required: true },
  data: { type: [Object], required: true },
  createdAt: { type: Date, default: Date.now },
  visualizationImage: { type: String }, // Base64 image string
  xAxis: { type: String },
  yAxis: { type: String },
  filename: { type: String },
});

// Index to quickly fetch visualizations for a specific upload
uploadVisualizationSchema.index({ uploadId: 1 });

module.exports = mongoose.model("UploadVisualization", uploadVisualizationSchema);
