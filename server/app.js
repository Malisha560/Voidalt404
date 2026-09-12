const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const { authenticateToken, requireRole } = require("./middleware/auth");

const app = express();

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

async function getStudentExams(studentId) {
  const [rows] = await pool.query(`
    SELECT e.id, e.subject, e.exam_name AS examName, e.exam_date AS examDate,
           e.start_time AS startTime, e.end_time AS endTime,
           ea.building, ea.room, ea.seat_number AS seatNumber
    FROM exams e
    INNER JOIN exam_allocations ea ON ea.exam_id = e.id
    INNER JOIN students s ON s.id = ea.student_id
    INNER JOIN programme_subjects ps ON ps.programme = s.course AND ps.subject = e.subject
    WHERE s.student_id = ?
    ORDER BY e.exam_date ASC, e.start_time ASC
  `, [studentId]);
  return rows.map((exam) => ({
    ...exam,
    dateLabel: new Date(exam.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    startLabel: formatTime(exam.startTime),
    endLabel: formatTime(exam.endTime),
    room: exam.room,
    seat: exam.seatNumber,
  }));
}

function formatTime(value) {
  const [hour, minute] = String(value).split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

async function getStudentExam(studentId, examId) {
  const exams = await getStudentExams(studentId);
  return exams.find((exam) => String(exam.id) === String(examId));
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

app.get("/api/invigilator/students", authenticateToken, requireRole("INVIGILATOR"), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT s.id, s.student_id AS studentId, s.name, s.email,
             s.phone_number AS phoneNumber, s.course, s.year,
             COALESCE(f.status, 'UNCLEAR') AS feeStatus
      FROM students s
      LEFT JOIN fee_status f ON f.student_id = s.id
      ORDER BY s.name ASC
    `);
    return res.json({ students });
  } catch (error) {
    console.error("Unable to load invigilator students:", error);
    return res.status(500).json({ message: "Unable to load student information" });
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
    const exams = studentRecord.feeStatus === "CLEAR" ? await getStudentExams(studentRecord.studentId) : [];
    return res.json({ feeStatus: studentRecord.feeStatus, exams: exams.map((exam) => ({ ...exam, student: studentRecord })) });
  } catch (error) {
    console.error("Unable to load student admit cards:", error);
    return res.status(500).json({ message: "Unable to load admit cards" });
  }
});

app.get("/api/student/exams/:id/admit-card", async (req, res) => {
  try {
    const studentRecord = await getStudent(req.query.studentId);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });
    if (studentRecord.feeStatus !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });
    const exam = await getStudentExam(studentRecord.studentId, req.params.id);
    if (!exam) return res.status(404).json({ message: "Examination allocation not found" });
    return res.json({ ...exam, student: studentRecord, feeStatus: studentRecord.feeStatus });
  } catch (error) {
    console.error("Unable to load student admit card:", error);
    return res.status(500).json({ message: "Unable to load admit card" });
  }
});

app.get("/api/student/exams/:id/qr", async (req, res) => {
  try {
    const studentRecord = await getStudent(req.query.studentId);
    if (!studentRecord) return res.status(404).json({ message: "Student not found" });
    if (studentRecord.feeStatus !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });
    const exam = await getStudentExam(studentRecord.studentId, req.params.id);
    if (!exam) return res.status(404).json({ message: "Examination allocation not found" });

    const examDate = new Date(exam.examDate).toISOString().slice(0, 10);
    const startTime = new Date(`${examDate}T${exam.startTime}`);
    const availableAt = new Date(startTime.getTime() - (2 * 60 * 60 * 1000));
    if (Date.now() < availableAt.getTime()) {
      return res.status(403).json({ available: false, availableAt: availableAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
    }

    const expiresAt = new Date(startTime.getTime() + (2 * 60 * 60 * 1000));
    if (Date.now() >= expiresAt.getTime()) {
      return res.status(410).json({ available: false, expired: true, message: "QR code has expired" });
    }
    const [[existingToken]] = await pool.query(
      "SELECT token FROM qr_tokens WHERE exam_id = ? AND student_id = ? LIMIT 1",
      [exam.id, studentRecord.id],
    );
    const token = existingToken?.token || crypto.randomBytes(32).toString("hex");
    if (!existingToken) {
      await pool.execute(
        "INSERT INTO qr_tokens (exam_id, student_id, token, issued_at, expires_at) VALUES (?, ?, ?, NOW(), ?)",
        [exam.id, studentRecord.id, token, expiresAt],
      );
    } else {
      await pool.execute(
        "UPDATE qr_tokens SET issued_at = NOW(), expires_at = ? WHERE exam_id = ? AND student_id = ?",
        [expiresAt, exam.id, studentRecord.id],
      );
    }
    return res.json({ available: true, token });
  } catch (error) {
    console.error("Unable to issue QR token:", error);
    return res.status(500).json({ message: "Unable to load QR code" });
  }
});

app.post("/api/invigilator/scan", authenticateToken, requireRole("INVIGILATOR"), async (req, res) => {
  const token = String(req.body.token || "").trim();
  if (!token) return res.status(400).json({ message: "QR token is required" });

  try {
    const [[record]] = await pool.query(`
      SELECT s.id AS studentId, s.student_id AS studentCode, s.name, s.email,
             s.phone_number AS phoneNumber, s.course,
             e.id AS examId, e.exam_name AS examName, e.subject,
             e.exam_date AS examDate, e.start_time AS startTime, e.end_time AS endTime,
             ea.building, ea.room, ea.seat_number AS seatNumber,
             qt.expires_at AS expiresAt
      FROM qr_tokens qt
      INNER JOIN students s ON s.id = qt.student_id
      INNER JOIN exams e ON e.id = qt.exam_id
      INNER JOIN exam_allocations ea ON ea.exam_id = e.id AND ea.student_id = s.id
      WHERE qt.token = ?
      LIMIT 1
    `, [token]);

    if (!record) return res.status(404).json({ message: "QR code is invalid" });
    if (new Date(record.expiresAt).getTime() <= Date.now()) return res.status(410).json({ message: "QR code has expired" });

    return res.json({
      student: {
        id: record.studentId,
        studentId: record.studentCode,
        name: record.name,
        email: record.email,
        phoneNumber: record.phoneNumber,
        course: record.course,
      },
      exam: {
        id: record.examId,
        examName: record.examName,
        subject: record.subject,
        examDate: record.examDate,
        startTime: record.startTime,
        endTime: record.endTime,
        building: record.building,
        room: record.room,
        seatNumber: record.seatNumber,
      },
    });
  } catch (error) {
    console.error("Unable to scan QR token:", error);
    return res.status(500).json({ message: "Unable to verify QR code" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});