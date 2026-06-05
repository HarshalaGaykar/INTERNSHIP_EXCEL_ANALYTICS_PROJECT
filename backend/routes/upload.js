const express = require("express");
const router = express.Router();
const multer = require("multer");
const readXlsxFile = require("read-excel-file/node");
const Upload = require("../models/Upload");
const UploadData = require("../models/UploadData");
const UploadVisualization = require("../models/UploadVisualization");
const auth = require("../middleware/auth");

const storage = multer.memoryStorage();
const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const hasExcelExtension = /\.xlsx$/i.test(file.originalname);
    callback(null, hasExcelExtension && allowedMimeTypes.has(file.mimetype));
  },
});

// Initialize a multipart upload and obtain an uploadId
router.post("/upload/init", auth, (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ msg: "Filename required" });
  const { randomUUID } = require("crypto");
  const uploadId = randomUUID();
  // No persistent storage; client will use this ID for all chunks
  res.json({ uploadId, filename });
});

// Chunked file upload endpoint
router.post("/upload/chunk", [auth, upload.single("file")], async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, filename } = req.body;
    if (!uploadId || !chunkIndex || !totalChunks || !filename) {
      return res.status(400).json({ msg: "Missing upload metadata" });
    }
    const idx = parseInt(chunkIndex, 10);
    const total = parseInt(totalChunks, 10);
    if (isNaN(idx) || isNaN(total)) {
      return res.status(400).json({ msg: "Invalid chunk indices" });
    }
    const path = require("path");
    const fs = require("fs");
    const tmpDir = path.join(__dirname, "../../backend/uploads/tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const chunkPath = path.join(tmpDir, `${uploadId}_${idx}`);
    // Save the chunk buffer to disk
    fs.writeFileSync(chunkPath, req.file.buffer);
    // If this is the last chunk, assemble and process the file
    if (idx === total) {
      const buffers = [];
      for (let i = 1; i <= total; i++) {
        const partPath = path.join(tmpDir, `${uploadId}_${i}`);
        if (!fs.existsSync(partPath)) {
          return res.status(400).json({ msg: `Missing chunk ${i}` });
        }
        buffers.push(fs.readFileSync(partPath));
        fs.unlinkSync(partPath);
      }
      const combinedBuffer = Buffer.concat(buffers);

      // Process the combined Excel file (same logic as normal upload)
      const rows = await readXlsxFile(combinedBuffer);
      if (rows.length < 2) return res.status(400).json({ msg: "The first worksheet is empty" });

      const columnCount = Math.max(...rows.map((row) => row.length));
      const headers = Array.from({ length: columnCount }, (_, index) =>
        String(rows[0][index] || `Column ${index + 1}`)
      );
      const data = rows.slice(1).flatMap((row) => {
        const item = {};
        let hasValue = false;
        headers.forEach((header, index) => {
          const rawValue = row[index];
          const value = rawValue instanceof Date ? rawValue.toISOString() : rawValue ?? "";
          item[header] = value;
          if (value !== "") hasValue = true;
        });
        return hasValue ? [item] : [];
      });
      if (!data.length) return res.status(400).json({ msg: "The first worksheet is empty" });

      const upload = new Upload({ filename, userId: req.user.id });
      await upload.save();
      const rowDocs = data.map((row) => ({ uploadId: upload._id, rowData: row }));
      await UploadData.insertMany(rowDocs);

      // Cleanup temp folder
      if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
        fs.rmdirSync(tmpDir);
      }
      return res.json({ msg: "File uploaded successfully", uploadId: upload._id });
    }
    // Not the last chunk – acknowledge receipt
    return res.json({ msg: `Chunk ${idx} received` });
  } catch (error) {
    console.error("Chunk upload error:", error);
    res.status(500).json({ msg: "Unable to process the spreadsheet" });
  }
});

// Existing single-file upload endpoint
router.post("/upload", [auth, upload.single("file")], async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const rows = await readXlsxFile(req.file.buffer);
    if (rows.length < 2) return res.status(400).json({ msg: "The first worksheet is empty" });

    const columnCount = Math.max(...rows.map((row) => row.length));
    const headers = Array.from(
      { length: columnCount },
      (_, index) => String(rows[0][index] || `Column ${index + 1}`)
    );
    const data = rows.slice(1).flatMap((row) => {
      const item = {};
      let hasValue = false;
      headers.forEach((header, index) => {
        const rawValue = row[index];
        const value = rawValue instanceof Date ? rawValue.toISOString() : rawValue ?? "";
        item[header] = value;
        if (value !== "") hasValue = true;
      });
      return hasValue ? [item] : [];
    });
    if (!data.length) return res.status(400).json({ msg: "The first worksheet is empty" });

    const upload = new Upload({
      filename: req.file.originalname,
      userId: req.user.id,
    });

    await upload.save();

    const rowDocs = data.map((row) => ({ uploadId: upload._id, rowData: row }));
    await UploadData.insertMany(rowDocs);

    res.json({ msg: "File uploaded successfully", uploadId: upload._id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Unable to process the spreadsheet" });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    if (req.query.search) {
      query.filename = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.dateFrom || req.query.dateTo) {
      query.uploadedAt = {};
      if (req.query.dateFrom) query.uploadedAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const toDate = new Date(req.query.dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.uploadedAt.$lte = toDate;
      }
    }

    const uploads = await Upload.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Upload.countDocuments(query);

    res.json({
      uploads,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUploads: total
    });
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/latest", auth, async (req, res) => {
  try {
    const latest = await Upload.findOne({ userId: req.user.id }).sort({ uploadedAt: -1 });
    if (!latest) return res.status(404).json({ msg: "No uploads found" });

    const dataDocs = await UploadData.find({ uploadId: latest._id });
    const data = dataDocs.map((doc) => doc.rowData);

    const columns = Object.keys(data[0] || {});
    const numericColumn = columns.find((column) =>
      data.some((row) => Number.isFinite(Number(row[column])))
    );
    const labelColumn = columns.find((column) => column !== numericColumn) || columns[0];

    res.json({
      uploadId: latest._id,
      data: {
        labels: data.map((row, index) => row[labelColumn] ?? `Row ${index + 1}`),
        data: data.map((row) => Number(row[numericColumn]) || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/visualize/:uploadId", auth, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { type, data, image, xAxis, yAxis } = req.body;

    if (!uploadId || !type || !xAxis || !yAxis || !image) {
      return res.status(400).json({ msg: "Missing required fields: type, xAxis, yAxis, or image" });
    }

    const upload = await Upload.findOne({ _id: uploadId, userId: req.user.id });
    if (!upload) return res.status(404).json({ msg: "Upload not found" });

    const normalizedData = Array.isArray(data) ? data : [data];

    const visualization = new UploadVisualization({
      uploadId: upload._id,
      type,
      data: normalizedData,
      visualizationImage: image,
      xAxis,
      yAxis,
    });

    await visualization.save();
    
    const visualizations = await UploadVisualization.find({ uploadId: upload._id });
    res.json({ msg: "Visualization saved", visualizations });
  } catch (error) {
    console.error("Visualization save error:", error);
    res.status(500).json({ msg: "Failed to save visualization" });
  }
});

router.get("/:uploadId", auth, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.uploadId, userId: req.user.id });
    if (!upload) return res.status(404).json({ msg: "Upload not found" });
    
    const dataDocs = await UploadData.find({ uploadId: upload._id });
    const visualizations = await UploadVisualization.find({ uploadId: upload._id });

    res.json({
      filename: upload.filename,
      data: dataDocs.map(doc => doc.rowData),
      visualizations: visualizations,
    });
  } catch (error) {
    console.error("Upload fetch error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/export/:uploadId", auth, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const format = req.query.format || "csv"; // csv, json, xlsx
    
    const upload = await Upload.findOne({ _id: uploadId, userId: req.user.id });
    if (!upload) return res.status(404).json({ msg: "Upload not found" });
    
    const dataDocs = await UploadData.find({ uploadId: upload._id });
    const data = dataDocs.map(doc => doc.rowData);
    
    if (data.length === 0) {
      return res.status(400).json({ msg: "No data available to export" });
    }

    if (format === "json") {
      res.setHeader("Content-Disposition", `attachment; filename="${upload.filename}.json"`);
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(data, null, 2));
    } else if (format === "csv") {
      const { Parser } = require("json2csv");
      const fields = Object.keys(data[0]);
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);
      res.setHeader("Content-Disposition", `attachment; filename="${upload.filename}.csv"`);
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    } else if (format === "xlsx") {
      const xl = require("excel4node");
      const wb = new xl.Workbook();
      const ws = wb.addWorksheet("Data");
      
      const columns = Object.keys(data[0]);
      columns.forEach((col, idx) => {
        ws.cell(1, idx + 1).string(col);
      });
      
      data.forEach((row, rowIdx) => {
        columns.forEach((col, colIdx) => {
          const val = row[col];
          if (val !== undefined && val !== null) {
            ws.cell(rowIdx + 2, colIdx + 1).string(String(val));
          }
        });
      });
      
      res.setHeader("Content-Disposition", `attachment; filename="${upload.filename}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return wb.writeToBuffer().then((buffer) => {
        res.send(buffer);
      });
    } else {
      return res.status(400).json({ msg: "Invalid format" });
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
