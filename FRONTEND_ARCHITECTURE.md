# Frontend Architecture

The frontend is split by responsibility so each portal can grow without putting all routes and UI in `src/App.jsx`.

## Structure

```text
src/
├── App.jsx                         # Route registry only
├── components/
│   └── common/
│       ├── Navbar.jsx              # Shared role-aware navigation
│       └── Logo.jsx                # College logo
├── layouts/
│   ├── StudentLayout.jsx           # Student shell + student tabs
│   ├── AdminLayout.jsx             # Admin shell + admin tabs
│   └── InvigilatorLayout.jsx       # Invigilator shell + invigilator tabs
├── pages/
│   ├── student/
│   │   ├── StudentHome.jsx
│   │   └── AdmitCard.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Exams.jsx
│   │   └── Attendance.jsx
│   └── invigilator/
│       ├── Dashboard.jsx
│       ├── ScanQR.jsx
│       ├── SearchStudent.jsx
│       ├── Verification.jsx
│       └── Attendance.jsx
└── services/
    └── api.js                      # Axios client and backend calls
```

## Route Map

### Student

- `/` and `/student` -> `StudentHome`
- `/student/admit-card` -> `AdmitCard`
- `/student/admit-card/:examId` -> `AdmitCard`

### Admin

- `/admin` -> `AdminDashboard`
- `/admin/student-info` -> `Students`
- `/admin/exams` -> `Exams`
- `/admin/attendance-log` -> `Attendance`

### Invigilator

- `/invigilator` -> `Dashboard`
- `/invigilator/scan` -> `ScanQR`
- `/invigilator/student-info` -> `SearchStudent`
- `/invigilator/verification` -> `Verification`
- `/invigilator/attendance-record` -> `Attendance`

## Navigation Rules

`Navbar.jsx` owns the tab definitions. Layouts select the role and render the same shared header:

- Student: Home, Classrooms, Subjects, Testpapers, Chat Rooms, My Time-Table, Help, Admit Card
- Admin: Student Info, Attendance Log
- Invigilator: Scan, Student Info, Attendance Record

Keep portal-specific navigation in `Navbar.jsx`; keep page-specific actions inside the page component.

## Adding a Page

1. Add the page component under the correct `src/pages/<role>/` directory.
2. Add the route in `src/App.jsx` inside the matching layout.
3. Add or update the matching tab in `src/components/common/Navbar.jsx`.
4. Put backend requests in `src/services/api.js`, not inside the navbar or layout.
5. Add page-specific styles to `src/App.css` only when an existing class cannot be reused.

## Verification

```bash
npm run lint
npm run build
```

Run the frontend with `npm run dev` and the API from `server/` with `npm start`.
