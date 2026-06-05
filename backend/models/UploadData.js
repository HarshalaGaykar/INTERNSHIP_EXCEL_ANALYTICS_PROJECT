const mongoose = require("mongoose");

const uploadDataSchema = new mongoose.Schema({
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: "Upload", required: true },
  rowData: { type: Object, required: true },
});

// Index to quickly fetch data for a specific upload
uploadDataSchema.index({ uploadId: 1 });

module.exports = mongoose.model("UploadData", uploadDataSchema);
