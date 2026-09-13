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

function getExamQrWindow(examDateValue, startTimeValue) {
  const date = new Date(examDateValue);
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const startTime = new Date(`${localDate}T${String(startTimeValue).slice(0, 8)}`);
  return {
    availableAt: new Date(startTime.getTime() - (2 * 60 * 60 * 1000)),
    expiresAt: new Date(startTime.getTime() + (2 * 60 * 60 * 1000)),
  };
}

async function createUniqueQrToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = crypto.randomBytes(32).toString("hex");
    const [[existingToken]] = await pool.query("SELECT id FROM qr_tokens WHERE token = ? LIMIT 1", [token]);
    if (!existingToken) return token;
  }
  throw new Error("Unable to create a unique QR token");
}

async function getStudentExam(studentId, examId) {
  const exams = await getStudentExams(studentId);
  return exams.find((exam) => String(exam.id) === String(examId));
}

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);

app.get("/api/admin/students", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT s.id, s.student_id AS studentId, s.name, s.email, s.phone_number AS phoneNumber,
              s.course, s.profile_image AS profileImage, s.year, COALESCE(f.status, 'UNCLEAR') AS feeStatus
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
      `INSERT INTO fee_status (student_id, status, updated_by) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_by = VALUES(updated_by)`,
      [studentRecord.id, status, req.user.sub],
    );
    return res.json({ studentId: studentRecord.id, feeStatus: status });
  } catch (error) {
    console.error("Unable to update student fee status:", error);
    return res.status(500).json({ message: "Unable to update fee status" });
  }
});

app.get("/api/admin/fee-status/export", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT s.student_id AS studentId, s.name, COALESCE(f.status, 'UNCLEAR') AS feeStatus
      FROM students s
      LEFT JOIN fee_status f ON f.student_id = s.id
      ORDER BY s.student_id ASC
    `);
    const csv = ["student_id,student_name,fee_status", ...students.map((student) => [student.studentId, student.name, student.feeStatus].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="fee-status.csv"');
    return res.send(csv);
  } catch (error) {
    console.error("Unable to export fee statuses:", error);
    return res.status(500).json({ message: "Unable to export fee statuses" });
  }
});

app.post("/api/admin/fee-status/import", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  const seenStudentIds = new Set();
  const invalidRows = [];
  const normalizedRows = rows.map((row, index) => {
    const studentCode = String(row?.studentId || "").trim();
    const status = String(row?.feeStatus || "").trim();
    const reasons = [];
    if (!studentCode) reasons.push("Student ID is required");
    if (!["CLEAR", "UNCLEAR"].includes(status)) reasons.push("Fee status must be CLEAR or UNCLEAR");
    if (studentCode && seenStudentIds.has(studentCode)) reasons.push("Duplicate student ID in upload");
    if (studentCode) seenStudentIds.add(studentCode);
    return { rowNumber: Number(row?.rowNumber) || index + 2, studentId: studentCode, feeStatus: status, reasons };
  });

  if (!normalizedRows.length) return res.status(400).json({ message: "The import file contains no records", summary: { processed: 0, updated: 0, invalid: 0, notFound: 0 } });

  try {
    const studentIds = normalizedRows.filter((row) => row.studentId).map((row) => row.studentId);
    const [students] = studentIds.length ? await pool.query("SELECT id, student_id AS studentId, name FROM students WHERE student_id IN (?)", [studentIds]) : [[]];
    const studentMap = new Map(students.map((student) => [student.studentId, student]));
    normalizedRows.forEach((row) => {
      const student = studentMap.get(row.studentId);
      if (!student && row.studentId) row.reasons.push("Student ID was not found");
      row.student = student || null;
      if (row.reasons.length) invalidRows.push({ rowNumber: row.rowNumber, studentId: row.studentId, studentName: student?.name || "Not found", feeStatus: row.feeStatus, reasons: row.reasons });
    });

    const validRows = normalizedRows.filter((row) => row.reasons.length === 0);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const row of validRows) {
          await connection.execute(
            `INSERT INTO fee_status (student_id, status, updated_by) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status), updated_by = VALUES(updated_by)`,
            [row.student.id, row.feeStatus, req.user.sub],
          );
        }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.json({
      summary: { processed: normalizedRows.length, updated: validRows.length, invalid: invalidRows.length, notFound: invalidRows.filter((row) => row.reasons.includes("Student ID was not found")).length },
      invalidRows,
    });
  } catch (error) {
    console.error("Unable to import fee statuses:", error);
    return res.status(500).json({ message: "Unable to import fee statuses" });
  }
});

app.patch("/api/admin/students/:id/profile-image", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const profileImage = String(req.body.profileImage || "");
  if (profileImage && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(profileImage)) {
    return res.status(400).json({ message: "Profile image must be a JPEG, PNG, or WebP image" });
  }
  if (profileImage.length > 900000) return res.status(413).json({ message: "Profile image is too large" });

  try {
    const [result] = await pool.execute("UPDATE students SET profile_image = ? WHERE id = ?", [profileImage || null, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Student not found" });
    return res.json({ studentId: Number(req.params.id), profileImage: profileImage || null });
  } catch (error) {
    console.error("Unable to update student profile image:", error);
    return res.status(500).json({ message: "Unable to update profile image" });
  }
});

app.get("/api/admin/exams", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [exams] = await pool.query(`
      SELECT e.id, e.exam_name AS examName, e.subject, e.programme, e.exam_date AS examDate,
             e.start_time AS startTime, e.end_time AS endTime,
             COUNT(DISTINCT ea.student_id) AS allocatedStudents
      FROM exams e
      LEFT JOIN exam_allocations ea ON ea.exam_id = e.id
      GROUP BY e.id, e.exam_name, e.subject, e.programme, e.exam_date, e.start_time, e.end_time
      ORDER BY e.exam_date ASC, e.start_time ASC
    `);
    return res.json({ exams });
  } catch (error) {
    console.error("Unable to load admin exams:", error);
    return res.status(500).json({ message: "Unable to load examinations" });
  }
});

app.post("/api/admin/exams", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const examName = String(req.body.examName || "").trim();
  const subject = String(req.body.subject || "").trim();
  const programme = String(req.body.programme || "").trim();
  const examDate = String(req.body.examDate || "").trim();
  const startTime = String(req.body.startTime || "").trim();
  const endTime = String(req.body.endTime || "").trim();
  if (!examName || !subject || !programme || !/^\d{4}-\d{2}-\d{2}$/.test(examDate) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return res.status(400).json({ message: "Exam name, subject, programme, date, start time, and end time are required" });
  }
  if (startTime >= endTime) return res.status(400).json({ message: "End time must be after start time" });

  try {
    const [result] = await pool.execute(
      "INSERT INTO exams (exam_name, subject, programme, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
      [examName, subject, programme, examDate, `${startTime}:00`, `${endTime}:00`],
    );
    return res.status(201).json({ id: result.insertId, examName, subject, programme, examDate, startTime, endTime, allocatedStudents: 0 });
  } catch (error) {
    console.error("Unable to create exam:", error);
    return res.status(500).json({ message: "Unable to create examination" });
  }
});

app.patch("/api/admin/exams/:id/programme", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const programme = String(req.body.programme || "").trim();
  if (!programme) return res.status(400).json({ message: "Programme is required" });
  try {
    const [result] = await pool.execute("UPDATE exams SET programme = ? WHERE id = ?", [programme, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Examination not found" });
    return res.json({ id: Number(req.params.id), programme });
  } catch (error) {
    console.error("Unable to assign exam programme:", error);
    return res.status(500).json({ message: "Unable to assign examination programme" });
  }
});

app.get("/api/admin/exams/:id/allocations", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [allocations] = await pool.query(`
      SELECT ea.exam_id AS examId, ea.student_id AS studentId, s.student_id AS studentCode,
             s.name, s.email, ea.building, ea.room, ea.seat_number AS seatNumber
      FROM exam_allocations ea
      INNER JOIN students s ON s.id = ea.student_id
      WHERE ea.exam_id = ?
      ORDER BY s.name ASC
    `, [req.params.id]);
    return res.json({ allocations });
  } catch (error) {
    console.error("Unable to load exam allocations:", error);
    return res.status(500).json({ message: "Unable to load exam allocations" });
  }
});

app.post("/api/admin/exams/:id/allocations", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const studentId = Number(req.body.studentId);
  const building = String(req.body.building || "").trim();
  const room = String(req.body.room || "").trim();
  const seatNumber = String(req.body.seatNumber || "").trim();
  if (!studentId || !building || !room || !seatNumber) return res.status(400).json({ message: "Student, building, room, and seat number are required" });

  try {
    const [[student]] = await pool.query("SELECT id, student_id AS studentCode, name FROM students WHERE id = ? LIMIT 1", [studentId]);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await pool.execute(
      `INSERT INTO exam_allocations (exam_id, student_id, building, room, seat_number)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE building = VALUES(building), room = VALUES(room), seat_number = VALUES(seat_number)`,
      [req.params.id, studentId, building, room, seatNumber],
    );
    return res.status(201).json({ examId: Number(req.params.id), studentId, studentCode: student.studentCode, name: student.name, building, room, seatNumber });
  } catch (error) {
    console.error("Unable to save exam allocation:", error);
    return res.status(500).json({ message: "Unable to save exam allocation" });
  }
});

app.post("/api/admin/exams/:id/programme-allocation", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const building = String(req.body.building || "").trim();
  const room = String(req.body.room || "").trim();
  const seatPrefix = String(req.body.seatPrefix || "").trim();
  if (!building || !room || !seatPrefix) return res.status(400).json({ message: "Building, room, and seat prefix are required" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[exam]] = await connection.query("SELECT id, programme FROM exams WHERE id = ? LIMIT 1", [req.params.id]);
    if (!exam) { await connection.rollback(); return res.status(404).json({ message: "Examination not found" }); }
    const [students] = await connection.query("SELECT id FROM students WHERE course = ? ORDER BY id", [exam.programme]);
    for (const [index, student] of students.entries()) {
      await connection.execute(
        `INSERT INTO exam_allocations (exam_id, student_id, building, room, seat_number)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE building = VALUES(building), room = VALUES(room), seat_number = VALUES(seat_number)`,
        [exam.id, student.id, building, room, `${seatPrefix}-${String(index + 1).padStart(2, '0')}`],
      );
    }
    await connection.commit();
    return res.json({ examId: exam.id, programme: exam.programme, allocatedStudents: students.length, building, room, seatPrefix });
  } catch (error) {
    await connection.rollback();
    console.error("Unable to allocate programme:", error);
    return res.status(500).json({ message: "Unable to allocate programme students" });
  } finally {
    connection.release();
  }
});

app.get("/api/admin/dashboard", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students) AS totalStudents,
        (SELECT COUNT(*) FROM exams) AS totalExams,
        (SELECT COUNT(*) FROM exams WHERE TIMESTAMP(exam_date, start_time) >= NOW()) AS upcomingExams,
        (SELECT COUNT(*) FROM attendance WHERE status = 'PRESENT') AS presentStudents,
        (SELECT COUNT(*) FROM attendance WHERE status = 'ABSENT') AS absentStudents
    `);
    const [upcomingExams] = await pool.query(`
      SELECT e.id, e.exam_name AS examName, e.subject, e.exam_date AS examDate,
             e.start_time AS startTime, COUNT(DISTINCT ea.student_id) AS allocatedStudents
      FROM exams e LEFT JOIN exam_allocations ea ON ea.exam_id = e.id
      WHERE TIMESTAMP(e.exam_date, e.start_time) >= NOW()
      GROUP BY e.id, e.exam_name, e.subject, e.exam_date, e.start_time
      ORDER BY e.exam_date ASC, e.start_time ASC
      LIMIT 5
    `);
    return res.json({ summary, upcomingExams });
  } catch (error) {
    console.error("Unable to load admin dashboard:", error);
    return res.status(500).json({ message: "Unable to load dashboard" });
  }
});

app.get("/api/invigilator/students", authenticateToken, requireRole("INVIGILATOR"), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT s.id, s.student_id AS studentId, s.name, s.email,
              s.phone_number AS phoneNumber, s.course, s.profile_image AS profileImage, s.year,
             COALESCE(f.status, 'UNCLEAR') AS feeStatus
      FROM students s
      LEFT JOIN fee_status f ON f.student_id = s.id
      WHERE EXISTS (SELECT 1 FROM exam_allocations ea WHERE ea.student_id = s.id)
      ORDER BY s.name ASC
    `);
    return res.json({ students });
  } catch (error) {
    console.error("Unable to load invigilator students:", error);
    return res.status(500).json({ message: "Unable to load student information" });
  }
});

app.get("/api/invigilator/dashboard", authenticateToken, requireRole("INVIGILATOR"), async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(DISTINCT ea.student_id) AS allocatedStudents,
        COUNT(DISTINCT ea.exam_id) AS allocatedExams,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS presentStudents,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absentStudents
      FROM exam_allocations ea
      LEFT JOIN attendance a ON a.exam_id = ea.exam_id AND a.student_id = ea.student_id
    `);
    return res.json({ summary });
  } catch (error) {
    console.error("Unable to load invigilator dashboard:", error);
    return res.status(500).json({ message: "Unable to load dashboard" });
  }
});

app.get("/api/invigilator/students/:id", authenticateToken, requireRole("INVIGILATOR"), async (req, res) => {
  try {
    const [[student]] = await pool.query(`
      SELECT s.id, s.student_id AS studentId, s.name, s.email,
             s.phone_number AS phoneNumber, s.course, s.profile_image AS profileImage,
             s.year, COALESCE(f.status, 'UNCLEAR') AS feeStatus
      FROM students s
      LEFT JOIN fee_status f ON f.student_id = s.id
      WHERE s.id = ?
      LIMIT 1
    `, [req.params.id]);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const [exams] = await pool.query(`
      SELECT e.id, e.exam_name AS examName, e.subject, e.exam_date AS examDate,
             e.start_time AS startTime, e.end_time AS endTime,
             ea.building, ea.room, ea.seat_number AS seatNumber
      FROM exam_allocations ea
      INNER JOIN exams e ON e.id = ea.exam_id
      WHERE ea.student_id = ?
      ORDER BY e.exam_date ASC, e.start_time ASC
    `, [student.id]);
    return res.json({ student, exams });
  } catch (error) {
    console.error("Unable to load invigilator student details:", error);
    return res.status(500).json({ message: "Unable to load student details" });
  }
});

app.post("/api/invigilator/attendance", authenticateToken, requireRole("INVIGILATOR", "ADMIN"), async (req, res) => {
  const studentId = Number(req.body.studentId);
  const examId = Number(req.body.examId);
  const status = String(req.body.status || "").toUpperCase();
  const method = String(req.body.method || "MANUAL").toUpperCase();
  if (!studentId || !examId || !["PRESENT", "ABSENT"].includes(status) || !["MANUAL", "QR"].includes(method)) {
    return res.status(400).json({ message: "Student, exam, and a valid attendance status are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[allocation]] = await connection.query(
      `SELECT ea.student_id AS studentId, ea.exam_id AS examId
       FROM exam_allocations ea
       INNER JOIN students s ON s.id = ea.student_id
       LEFT JOIN fee_status f ON f.student_id = s.id
       WHERE ea.student_id = ? AND ea.exam_id = ? AND COALESCE(f.status, 'UNCLEAR') = 'CLEAR'
       LIMIT 1`,
      [studentId, examId],
    );
    if (!allocation) {
      await connection.rollback();
      return res.status(403).json({ message: "Student must have cleared fees and be allocated to this examination" });
    }

    const [[existing]] = await connection.query(
      "SELECT id, status FROM attendance WHERE student_id = ? AND exam_id = ? FOR UPDATE",
      [studentId, examId],
    );
    const oldStatus = existing?.status || "ABSENT";
    let attendanceId = existing?.id;
    if (existing) {
      await connection.execute(
        "UPDATE attendance SET invigilator_id = ?, method = ?, status = ?, verified_at = NOW(), rejection_reason = ? WHERE id = ?",
        [req.user.sub, method, status, status === "ABSENT" ? "Entry rejected by invigilator" : null, existing.id],
      );
    } else {
      const [inserted] = await connection.execute(
        "INSERT INTO attendance (exam_id, student_id, invigilator_id, method, status, verified_at, rejection_reason) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
        [examId, studentId, req.user.sub, method, status, status === "ABSENT" ? "Entry rejected by invigilator" : null],
      );
      attendanceId = inserted.insertId;
    }
    await connection.execute(
      "INSERT INTO attendance_logs (attendance_id, action, old_status, new_status, changed_by, reason) VALUES (?, ?, ?, ?, ?, ?)",
      [attendanceId, status === "PRESENT" ? "APPROVE_ENTRY" : "REJECT_ENTRY", oldStatus, status, req.user.sub, status === "ABSENT" ? "Entry rejected by invigilator" : "Entry approved by invigilator"],
    );
    await connection.commit();
    return res.json({ attendanceId, studentId, examId, status, method });
  } catch (error) {
    await connection.rollback();
    console.error("Unable to update attendance:", error);
    return res.status(500).json({ message: "Unable to update attendance" });
  } finally {
    connection.release();
  }
});

app.get("/api/invigilator/attendance", authenticateToken, requireRole("INVIGILATOR", "ADMIN"), async (req, res) => {
  try {
    const [records] = await pool.query(`
      SELECT ea.exam_id AS examId, e.exam_name AS examName, e.subject,
             ea.building, ea.room, ea.student_id AS studentId,
             s.student_id AS studentCode, s.name, s.email, s.phone_number AS phoneNumber,
             COALESCE(a.status, 'ABSENT') AS status,
             a.method, a.verified_at AS verifiedAt,
             latestLog.action AS lastAction, latestLog.reason AS lastReason
      FROM (
        SELECT exam_id, student_id, MAX(building) AS building, MAX(room) AS room, MAX(seat_number) AS seat_number
        FROM exam_allocations
        GROUP BY exam_id, student_id
      ) ea
      INNER JOIN exams e ON e.id = ea.exam_id
      INNER JOIN students s ON s.id = ea.student_id
      LEFT JOIN (
        SELECT MAX(id) AS id, exam_id, student_id
        FROM attendance
        GROUP BY exam_id, student_id
      ) latestAttendance ON latestAttendance.exam_id = ea.exam_id AND latestAttendance.student_id = ea.student_id
      LEFT JOIN attendance a ON a.id = latestAttendance.id
      LEFT JOIN (
        SELECT al.attendance_id, al.action, al.reason
        FROM attendance_logs al
        INNER JOIN (
          SELECT attendance_id, MAX(id) AS id
          FROM attendance_logs
          GROUP BY attendance_id
        ) newestLog ON newestLog.id = al.id
      ) latestLog ON latestLog.attendance_id = a.id
      ORDER BY e.exam_date ASC, e.start_time ASC, s.name ASC
    `);
    return res.json({ records });
  } catch (error) {
    console.error("Unable to load attendance:", error);
    return res.status(500).json({ message: "Unable to load attendance records" });
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

    const { availableAt, expiresAt } = getExamQrWindow(exam.examDate, exam.startTime);
    if (Date.now() < availableAt.getTime()) {
      return res.status(403).json({ available: false, availableAt: availableAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
    }

    if (Date.now() >= expiresAt.getTime()) {
      return res.status(410).json({ available: false, expired: true, message: "QR code has expired" });
    }
    const [[existingToken]] = await pool.query(
      "SELECT token FROM qr_tokens WHERE exam_id = ? AND student_id = ? LIMIT 1",
      [exam.id, studentRecord.id],
    );
    let token = existingToken?.token;
    if (token) {
      const [[tokenOwner]] = await pool.query(
        "SELECT exam_id AS examId, student_id AS studentId FROM qr_tokens WHERE token = ? LIMIT 1",
        [token],
      );
      if (tokenOwner.examId !== exam.id || tokenOwner.studentId !== studentRecord.id) token = null;
    }
    if (!token) token = await createUniqueQrToken();
    if (!existingToken) {
      await pool.execute(
        "INSERT INTO qr_tokens (exam_id, student_id, token, issued_at, expires_at) VALUES (?, ?, ?, NOW(), ?)",
        [exam.id, studentRecord.id, token, expiresAt],
      );
    } else {
      await pool.execute(
        "UPDATE qr_tokens SET token = ?, issued_at = NOW(), expires_at = ? WHERE exam_id = ? AND student_id = ?",
        [token, expiresAt, exam.id, studentRecord.id],
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
                  COALESCE(f.status, 'UNCLEAR') AS feeStatus,
             qt.expires_at AS expiresAt
      FROM qr_tokens qt
      INNER JOIN students s ON s.id = qt.student_id
                LEFT JOIN fee_status f ON f.student_id = s.id
      INNER JOIN exams e ON e.id = qt.exam_id
      INNER JOIN exam_allocations ea ON ea.exam_id = e.id AND ea.student_id = s.id
      WHERE qt.token = ?
      LIMIT 1
    `, [token]);

    if (!record) return res.status(404).json({ message: "QR code is invalid" });
    if (record.feeStatus !== "CLEAR") return res.status(403).json({ message: "Examination fee has not been cleared" });
    const { availableAt } = getExamQrWindow(record.examDate, record.startTime);
    if (Date.now() < availableAt.getTime()) return res.status(403).json({ message: "QR code is not active yet" });
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