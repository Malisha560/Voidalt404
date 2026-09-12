const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const pool = require("./config/db");

const app = express();

const student = { name: "Ram Sharma", studentId: "ST001", course: "BSc Computer Science" };
const exams = [
  { id: "database-systems", subject: "Database Systems", dateLabel: "20 September 2026", startLabel: "10:00 AM", endLabel: "12:00 PM", startTime: "2026-09-20T10:00:00+05:45", building: "Block A", room: "A204", seat: "A204-01" },
  { id: "web-development", subject: "Web Development", dateLabel: "23 September 2026", startLabel: "10:00 AM", endLabel: "12:00 PM", startTime: "2026-09-23T10:00:00+05:45", building: "Block B", room: "B102", seat: "B102-14" },
  { id: "artificial-intelligence", subject: "Artificial Intelligence", dateLabel: "26 September 2026", startLabel: "2:00 PM", endLabel: "4:00 PM", startTime: "2026-09-26T14:00:00+05:45", building: "Block A", room: "A206", seat: "A206-08" }
];
const qrTokens = new Map();

function getFeeStatus(req) {
  return String(req.query.feeStatus || "CLEAR").toUpperCase() === "UNCLEAR" ? "UNCLEAR" : "CLEAR";
}

function findExam(req, res) {
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    res.status(404).json({ message: "Examination not found" });
    return null;
  }
  return exam;
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Exam Entry System API is running"
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL connected successfully",
      data: rows
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

app.get("/api/student/admit-cards", (req, res) => {
  const feeStatus = getFeeStatus(req);
  res.json({ feeStatus, exams: feeStatus === "CLEAR" ? exams : [] });
});

app.get("/api/student/exams/:id/admit-card", (req, res) => {
  const exam = findExam(req, res);
  if (!exam) return;
  res.json({ ...exam, student, feeStatus: getFeeStatus(req) });
});

app.get("/api/student/exams/:id/qr", (req, res) => {
  const exam = findExam(req, res);
  if (!exam) return;
  if (getFeeStatus(req) !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });

  const availableAt = new Date(new Date(exam.startTime).getTime() - (2 * 60 * 60 * 1000));
  if (Date.now() < availableAt.getTime()) {
    return res.status(403).json({ available: false, availableAt: availableAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
  }

  if (!qrTokens.has(exam.id)) qrTokens.set(exam.id, crypto.randomBytes(32).toString("hex"));
  return res.json({ available: true, token: qrTokens.get(exam.id) });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});