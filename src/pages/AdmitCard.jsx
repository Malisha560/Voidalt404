import React, { useState } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const AdmitCard = () => {
    const examList = [
        {
            id: 'CC-01234-SE',
            code: 'CC-01234',
            subject: 'Software Engineering',
            date: 'Sat 12 Sep',
            time: '10:00 - 12:00',
            venue: 'Alumni Block - SR01',
            seatNo: 'CD-E08',
            studentName: 'Hardik Ghimire',
            londonMetId: '24046767',
            isAvailable: true
        },
        {
            id: 'CC-5678-DB',
            code: 'CC-5678',
            subject: 'Databases',
            date: 'Sat 13 Sep',
            time: '11:00 - 13:00',
            venue: 'Alumni Block - SR02',
            seatNo: 'CD-E09',
            studentName: 'Hardik Ghimire',
            londonMetId: '24046767',
            isAvailable: false
        },
        {
            id: 'CC-2468-AD',
            code: 'CC-2468',
            subject: 'Application Development',
            date: 'Sat 12 Sep',
            time: '10:00 - 12:00',
            venue: 'Skill Block - SR01',
            seatNo: 'CD-E10',
            studentName: 'Hardik Ghimire',
            londonMetId: '24046767',
            isAvailable: false
        },
        {
            id: 'CC-01234-PE',
            code: 'CC-01234',
            subject: 'Professional Ethics',
            date: 'Sat 12 Sep',
            time: '10:00 - 12:00',
            venue: 'Alumni Block - SR01',
            seatNo: 'CD-E11',
            studentName: 'Hardik Ghimire',
            londonMetId: '24046767',
            isAvailable: false
        }
    ];

    const [selectedExamId, setSelectedExamId] = useState(examList[0].id);
    const selectedExam = examList.find((e) => e.id === selectedExamId);

    return (
        <div className="admit-card-container">
            <div className="sidebar-section">
                <div className="sidebar-card">
                    <div className="sidebar-header">
                        <FiCalendar className="sidebar-icon" />
                        <h3>Upcoming Exams</h3>
                    </div>

                    <div className="exam-cards-list">
                        {examList.map((exam) => (
                            <div
                                key={exam.id}
                                className={`exam-card ${selectedExamId === exam.id ? 'active' : ''}`}
                                onClick={() => setSelectedExamId(exam.id)}
                            >
                                <h4 className="exam-title">{exam.code} - {exam.subject}</h4>
                                <p className="exam-detail">{exam.date}: {exam.time}</p>
                                <p className="exam-detail">{exam.venue}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="main-admit-card-panel">
                <h3 className="panel-title">Your Admit Card</h3>

                {selectedExam?.isAvailable ? (
                    <div className="admit-card-content">
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="label">Name:</span>
                                <span className="value">{selectedExam.studentName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Venue:</span>
                                <span className="value">{selectedExam.venue}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">London Met ID:</span>
                                <span className="value">{selectedExam.londonMetId}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Seat No.:</span>
                                <span className="value">{selectedExam.seatNo}</span>
                            </div>
                        </div>

                        <div className="qr-section">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    id: selectedExam.londonMetId,
                                    seat: selectedExam.seatNo,
                                    code: selectedExam.code,
                                })}
                                size={220}
                                level="H"
                            />
                        </div>

                        <div className="admit-card-notes-box">
                            <ul className="admit-card-notes">
                                <li>Candidate must show this QR for entry into the exam hall</li>
                                <li>This QR is only valid for its respective examination</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="admit-card-placeholder">
                        <div className="clock-icon-wrapper">
                            <FiClock className="large-clock-icon" />
                        </div>
                        <p className="placeholder-text">
                            Admit Card are released 2 hours before the examination
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdmitCard;