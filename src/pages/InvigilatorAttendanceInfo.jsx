import React, { useState } from "react";
import "./InvigilatorAttendanceInfo.css";

const initialStudents = [
    { id: 1, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 2, name: "Hardik Ghimire", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Absent" },
    { id: 3, name: "Sulove Noko Shrestha", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Absent" },
    { id: 4, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 5, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 6, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 7, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 8, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 9, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Absent" },
    { id: 10, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Present" },
    { id: 11, name: "Ram Chandra Bahadur", collegeId: "np01cp4a240105@islingtoncollege.edu.np", contact: "9800000000", attendance: "Absent" },
];

export default function InvigilatorAttendanceInfo() {
    const [students, setStudents] = useState(initialStudents);
    const [examination, setExamination] = useState("");
    const [venue, setVenue] = useState("");
    const [searchName, setSearchName] = useState("");

    const toggleAttendance = (id) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, attendance: s.attendance === "Present" ? "Absent" : "Present" }
                    : s
            )
        );
    };

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
    );

    return (
        <div className="attendance-info-page">
            {/* ========== HEADER ========== */}
            <header className="app-header">
                <div className="header-left">
                    <div className="logo-block">
                        <div className="college-crest">
                            <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
                                <path d="M20 1.5L3.5 11.5V28.5C3.5 36.5 11 44 20 45.5C29 44 36.5 36.5 36.5 28.5V11.5L20 1.5Z" fill="#1e3a8a" />
                                <path d="M20 7L9.5 14V27C9.5 32.5 14 37 20 38.5C26 37 30.5 32.5 30.5 27V14L20 7Z" fill="#fff" />
                                <text x="20" y="26.5" textAnchor="middle" fill="#1e3a8a" fontSize="7.5" fontWeight="700" fontFamily="Arial">IC</text>
                            </svg>
                        </div>
                        <div className="college-text">
                            <div className="college-name">Islington College Kathmandu</div>
                            <div className="college-nepali">इस्लिङ्गटन कलेज</div>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <button className="header-icon" aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </button>
                    <button className="header-icon" aria-label="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </button>
                    <button className="header-icon avatar-btn" aria-label="Profile">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* ========== NAVIGATION ========== */}
            <nav className="main-nav">
                <button className="nav-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <rect x="7" y="7" width="10" height="10" rx="1" />
                    </svg>
                    Scan
                </button>

                <button className="nav-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    Student Info
                </button>

                <button className="nav-item active">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Attendance Log
                </button>
            </nav>

            {/* ========== FILTERS ========== */}
            <div className="filters-bar">
                <div className="left-filters">
                    <div className="select-pill">
                        <select value={examination} onChange={(e) => setExamination(e.target.value)}>
                            <option value="">Examination</option>
                            <option value="midterm">Mid Term</option>
                            <option value="final">Final</option>
                            <option value="quiz">Quiz</option>
                        </select>
                        <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    <div className="select-pill">
                        <select value={venue} onChange={(e) => setVenue(e.target.value)}>
                            <option value="">Venue</option>
                            <option value="hall-a">Hall A</option>
                            <option value="hall-b">Hall B</option>
                            <option value="lab-1">Lab 1</option>
                        </select>
                        <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>

                <div className="search-pill">
                    <input
                        type="text"
                        placeholder="Student Name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </div>
            </div>

            {/* ========== TABLE ========== */}
            <div className="table-card">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>S. No</th>
                            <th>Name</th>
                            <th>College ID</th>
                            <th>Contact</th>
                            <th>Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="sno">{index + 1}.</td>
                                <td>{student.name}</td>
                                <td className="college-id">{student.collegeId}</td>
                                <td>{student.contact}</td>
                                <td>
                                    <button
                                        type="button"
                                        className={`attendance-toggle ${student.attendance === "Present" ? "is-present" : "is-absent"}`}
                                        onClick={() => toggleAttendance(student.id)}
                                    >
                                        {student.attendance}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}