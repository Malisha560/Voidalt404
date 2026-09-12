const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const { authenticateToken, requireRole } = require("./middleware/auth");

const app = express();

const exams = [
  { id: "database-systems", subject: "Database Systems", dateLabel: "20 September 2026", startLabel: "10:00 AM", endLabel: "12:00 PM", startTime: "2026-09-20T10:00:00+05:45", building: "Block A", room: "A204", seat: "A204-01" },
  { id: "web-development", subject: "Web Development", dateLabel: "23 September 2026", startLabel: "10:00 AM", endLabel: "12:00 PM", startTime: "2026-09-23T10:00:00+05:45", building: "Block B", room: "B102", seat: "B102-14" },
  { id: "artificial-intelligence", subject: "Artificial Intelligence", dateLabel: "26 September 2026", startLabel: "2:00 PM", endLabel: "4:00 PM", startTime: "2026-09-26T14:00:00+05:45", building: "Block A", room: "A206", seat: "A206-08" }
];
const qrTokens = new Map();

async function getStudent(studentId) {
  const [[studentRecord]] = await pool.query(`
    SELECT s.id, s.student_id AS studentId, s.name, s.email, s.phone_number AS phoneNumber,
           s.course, s.year, COALESCE(f.status, 'UNCLEAR') AS feeStatus
    FROM students s
    LEFT JOIN fee_status f ON f.student_id = s.id
    WHERE s.student_id = ?
    LIMIT 1
  `, [studentId || "ST001"]);
  return studentRecord;
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
app.use("/api/auth", authRoutes);

app.get("/api/admin/students", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT s.id, s.student_id AS studentId, s.name, s.email, s.phone_number AS phoneNumber,
             s.course, s.year, COALESCE(f.status, 'UNCLEAR') AS feeStatus
      FROM students s
      LEFT JOIN fee_status f ON f.student_id = s.id
      ORDER BY s.name ASC
    `);
    return res.json({ students });
  } catch (error) {
    console.error("Unable to load admin students:", error);
    return res.status(500).json({ message: "Unable to load student information" });
  }
});

app.patch("/api/admin/students/:id/fee-status", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const status = String(req.body.status || "").toUpperCase();
  if (!["CLEAR", "UNCLEAR"].includes(status)) {
    return res.status(400).json({ message: "Fee status must be CLEAR or UNCLEAR" });
  }

  try {
    const [[studentRecord]] = await pool.query("SELECT id FROM students WHERE id = ? LIMIT 1", [req.params.id]);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });

    await pool.execute(
      `INSERT INTO fee_status (student_id, status) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [studentRecord.id, status],
    );
    return res.json({ studentId: studentRecord.id, feeStatus: status });
  } catch (error) {
    console.error("Unable to update student fee status:", error);
    return res.status(500).json({ message: "Unable to update fee status" });
  }
});

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

app.get("/api/student/profile", async (req, res) => {
  try {
    const studentRecord = await getStudent(req.query.studentId);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });
    return res.json({ student: studentRecord });
  } catch (error) {
    console.error("Unable to load student profile:", error);
    return res.status(500).json({ message: "Unable to load student profile" });
  }
});

app.get("/api/student/admit-cards", async (req, res) => {
  try {
    const studentRecord = await getStudent(req.query.studentId);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });
    return res.json({ feeStatus: studentRecord.feeStatus, exams: studentRecord.feeStatus === "CLEAR" ? exams.map((exam) => ({ ...exam, student: studentRecord })) : [] });
  } catch (error) {
    console.error("Unable to load student admit cards:", error);
    return res.status(500).json({ message: "Unable to load admit cards" });
  }
});

app.get("/api/student/exams/:id/admit-card", async (req, res) => {
  const exam = findExam(req, res);
  if (!exam) return;
  try {
    const studentRecord = await getStudent(req.query.studentId);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });
    if (studentRecord.feeStatus !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });
    return res.json({ ...exam, student: studentRecord, feeStatus: studentRecord.feeStatus });
  } catch (error) {
    console.error("Unable to load student admit card:", error);
    return res.status(500).json({ message: "Unable to load admit card" });
  }
});

app.get("/api/student/exams/:id/qr", async (req, res) => {
  const exam = findExam(req, res);
  if (!exam) return;
  const studentRecord = await getStudent(req.query.studentId);
  if (!studentRecord) return res.status(404).json({ message: "Student not found" });
  if (studentRecord.feeStatus !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });

  const availableAt = new Date(new Date(exam.startTime).getTime() - (2 * 60 * 60 * 1000));
  if (Date.now() < availableAt.getTime()) {
    return res.status(403).json({ available: false, availableAt: availableAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
  }

  const tokenKey = `${studentRecord.studentId}:${exam.id}`;
  if (!qrTokens.has(tokenKey)) qrTokens.set(tokenKey, crypto.randomBytes(32).toString("hex"));
  return res.json({ available: true, token: qrTokens.get(tokenKey) });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});