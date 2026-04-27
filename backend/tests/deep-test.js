/**
 * ============================================================
 *  DEEP CONTROLLER TEST SUITE — Merit Nook / Online Coaching
 * ============================================================
 *
 * Tests every controller endpoint for the 3 roles:
 *   Admin, Teacher, Student
 *
 * Usage:
 *   node --env-file=src/.env tests/deep-test.js
 *
 * The server must be running on PORT (default 5000).
 */

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

// ─── Credentials ─────────────────────────────────────────────────────────────
const CREDS = {
  admin:   { email: "admin@meritnook.com",   password: "password123" },
  teacher: { email: "teacher@meritnook.com", password: "password123" },
  student: { email: "student@meritnook.com", password: "password123" },
};

// ─── State shared across tests ───────────────────────────────────────────────
const tokens = {};        // { admin: "...", teacher: "...", student: "..." }
const state = {};         // populated as tests run

let totalTests = 0;
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function request(method, path, { body, token, expectStatus, label, formData } = {}) {
  totalTests++;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const opts = { method, headers: {} };

  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
    opts.headers["Cookie"] = `accessToken=${token}`;
  }

  if (body && !formData) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    const status = res.status;
    const ok = expectStatus ? status === expectStatus : status >= 200 && status < 300;

    if (ok) {
      passed++;
      console.log(`  ✅ ${label || path}  (${status})`);
    } else {
      failed++;
      const msg = `  ❌ ${label || path}  expected ${expectStatus || "2xx"}, got ${status} — ${data?.message || text.slice(0, 120)}`;
      console.log(msg);
      failures.push(msg);
    }

    return { status, data, ok };
  } catch (err) {
    failed++;
    const msg = `  ❌ ${label || path}  NETWORK ERROR: ${err.message}`;
    console.log(msg);
    failures.push(msg);
    return { status: 0, data: null, ok: false };
  }
}

function skip(label, reason) {
  totalTests++;
  skipped++;
  console.log(`  ⏭️  ${label}  SKIPPED — ${reason}`);
}

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ─── 1. AUTH TESTS ───────────────────────────────────────────────────────────
async function testAuth() {
  section("1. AUTH — Login all 3 roles");

  for (const role of ["admin", "teacher", "student"]) {
    const { data, ok } = await request("POST", "/auth/login", {
      body: CREDS[role],
      label: `Login ${role}`,
    });

    if (ok && data?.data?.accessToken) {
      tokens[role] = data.data.accessToken;
      console.log(`     ↳ Token obtained for ${role}`);
    } else {
      console.log(`     ↳ ⚠️  No token for ${role} — downstream tests will fail`);
    }
  }

  // /auth/me — all roles
  for (const role of ["admin", "teacher", "student"]) {
    if (!tokens[role]) { skip(`GET /auth/me (${role})`, "no token"); continue; }

    const { data } = await request("GET", "/auth/me", {
      token: tokens[role],
      label: `GET /auth/me (${role})`,
    });
    if (data?.data?._id) state[`${role}UserId`] = data.data._id;
    if (data?.data?.name) state[`${role}Name`] = data.data.name;
  }

  // Refresh token test
  await request("POST", "/auth/refresh-token", {
    token: tokens.student,
    label: "POST /auth/refresh-token (student)",
    expectStatus: 401, // no cookie in raw fetch, expects 401
  });

  // Auth guard tests — no token
  await request("GET", "/auth/me", {
    label: "GET /auth/me (no token) → 401",
    expectStatus: 401,
  });
}

// ─── 2. PUBLIC ENDPOINTS ─────────────────────────────────────────────────────
async function testPublic() {
  section("2. PUBLIC ENDPOINTS (no auth)");

  // Teacher list
  const { data } = await request("GET", "/teacher/list", {
    label: "GET /teacher/list (public)",
  });
  if (data?.data?.length > 0) {
    state.teacherIds = data.data.map(t => t.id);
    state.firstTeacherId = data.data[0].id;
    console.log(`     ↳ Found ${data.data.length} teacher(s)`);
  }

  // Featured reviews
  await request("GET", "/admin/reviews/featured", {
    label: "GET /admin/reviews/featured (public)",
  });

  // Featured platform reviews
  await request("GET", "/admin/platform-reviews/featured", {
    label: "GET /admin/platform-reviews/featured (public)",
  });
}

// ─── 3. ADMIN TESTS ────────────────────────────────────────────────────────
async function testAdmin() {
  section("3. ADMIN ENDPOINTS");

  if (!tokens.admin) { skip("All admin tests", "no admin token"); return; }
  const t = tokens.admin;

  // Stats
  await request("GET", "/admin/stats", { token: t, label: "GET /admin/stats" });

  // Teachers
  const { data: teacherData } = await request("GET", "/admin/teachers", { token: t, label: "GET /admin/teachers" });
  if (teacherData?.data?.length > 0) {
    state.adminTeacherId = teacherData.data[0]._id || teacherData.data[0].id;
    console.log(`     ↳ Found ${teacherData.data.length} teacher(s)`);
  }

  // Students
  const { data: studentData } = await request("GET", "/admin/students", { token: t, label: "GET /admin/students" });
  if (studentData?.data?.length > 0) {
    state.adminStudentId = studentData.data[0]._id || studentData.data[0].id;
    console.log(`     ↳ Found ${studentData.data.length} student(s)`);
  }

  // Search students
  await request("GET", "/admin/students/search?q=test", { token: t, label: "GET /admin/students/search?q=test" });

  // Regex injection guard — should not crash
  await request("GET", "/admin/students/search?q=.*%2B%2B%2B.*", { token: t, label: "GET /admin/students/search (regex injection)" });

  // Student details
  if (state.adminStudentId) {
    await request("GET", `/admin/students/${state.adminStudentId}/details`, { token: t, label: "GET /admin/students/:id/details" });
  } else {
    skip("GET /admin/students/:id/details", "no student ID");
  }

  // Classes
  await request("GET", "/admin/classes", { token: t, label: "GET /admin/classes" });

  // Enrollments
  const { data: enrollData } = await request("GET", "/admin/enrollments", { token: t, label: "GET /admin/enrollments" });
  if (enrollData?.data?.length > 0) {
    state.adminEnrollmentId = enrollData.data[0]._id || enrollData.data[0].id;
  }

  // Reviews
  await request("GET", "/admin/reviews", { token: t, label: "GET /admin/reviews" });

  // Platform reviews
  await request("GET", "/admin/platform-reviews", { token: t, label: "GET /admin/platform-reviews" });

  // Announcements
  await request("GET", "/admin/announcements", { token: t, label: "GET /admin/announcements" });

  // Analytics
  await request("GET", "/admin/analytics/overview", { token: t, label: "GET /admin/analytics/overview" });
  await request("GET", "/admin/analytics/monthly", { token: t, label: "GET /admin/analytics/monthly" });
  await request("GET", "/admin/analytics/teachers", { token: t, label: "GET /admin/analytics/teachers" });

  // RBAC: student trying admin route → 403
  if (tokens.student) {
    await request("GET", "/admin/stats", {
      token: tokens.student,
      label: "GET /admin/stats (student) → 403",
      expectStatus: 403,
    });
  }
}

// ─── 4. TEACHER TESTS ───────────────────────────────────────────────────────
async function testTeacher() {
  section("4. TEACHER ENDPOINTS");

  if (!tokens.teacher) { skip("All teacher tests", "no teacher token"); return; }
  const t = tokens.teacher;

  // Dashboard
  const { data: dashData } = await request("GET", "/teacher/dashboard", { token: t, label: "GET /teacher/dashboard" });
  if (dashData?.data) {
    console.log(`     ↳ Dashboard: ${dashData.data.totalStudents} students, ${dashData.data.totalClasses} classes`);
    if (dashData.data.students?.length > 0) {
      state.teacherStudentId = dashData.data.students[0].id;
      state.teacherEnrollmentId = dashData.data.students[0].enrollmentId;
    }
  }

  // Assignments
  const { data: asgData } = await request("GET", "/teacher/assignments", { token: t, label: "GET /teacher/assignments" });
  if (asgData?.data?.length > 0) {
    state.teacherAssignmentId = asgData.data[0].id;
    if (asgData.data[0].submissions?.length > 0) {
      state.teacherSubmissionId = asgData.data[0].submissions[0].id;
    }
    console.log(`     ↳ Found ${asgData.data.length} assignment(s)`);
  }

  // Plans
  await request("GET", "/teacher/plans", { token: t, label: "GET /teacher/plans" });

  // Topics
  await request("GET", "/teacher/topics", { token: t, label: "GET /teacher/topics" });

  // Performance notes
  await request("GET", "/teacher/performance-notes", { token: t, label: "GET /teacher/performance-notes" });

  // Feedback
  await request("GET", "/teacher/feedback", { token: t, label: "GET /teacher/feedback" });

  // Availability
  await request("GET", "/teacher/availability", { token: t, label: "GET /teacher/availability" });

  // Classes (teacher)
  const { data: classData } = await request("GET", "/classes", { token: t, label: "GET /classes (teacher)" });
  if (classData?.data?.classes?.length > 0) {
    state.teacherClassId = classData.data.classes[0]._id;
    console.log(`     ↳ Found ${classData.data.classes.length} class(es)`);
  }

  // Attendance - teacher
  await request("GET", "/attendance/teacher", { token: t, label: "GET /attendance/teacher" });

  if (state.teacherStudentId) {
    await request("GET", `/attendance/student/${state.teacherStudentId}`, {
      token: t,
      label: "GET /attendance/student/:id (teacher)",
    });
  }

  // Demo requests
  await request("GET", "/demos/requests", { token: t, label: "GET /demos/requests (teacher)" });

  // Schedule
  await request("GET", "/schedule", { token: t, label: "GET /schedule (teacher)" });
  await request("GET", "/schedule/students", { token: t, label: "GET /schedule/students (teacher)" });

  // RBAC: student trying teacher route → 403
  if (tokens.student) {
    await request("GET", "/teacher/dashboard", {
      token: tokens.student,
      label: "GET /teacher/dashboard (student) → 403",
      expectStatus: 403,
    });
  }
}

// ─── 5. STUDENT TESTS ───────────────────────────────────────────────────────
async function testStudent() {
  section("5. STUDENT ENDPOINTS");

  if (!tokens.student) { skip("All student tests", "no student token"); return; }
  const t = tokens.student;

  // Dashboard
  const { data: dashData } = await request("GET", "/student/dashboard", { token: t, label: "GET /student/dashboard" });
  if (dashData?.data) {
    console.log(`     ↳ Dashboard: ${dashData.data.totalClasses} classes, ${dashData.data.attendance}% attendance`);
  }

  // Classes (student)
  await request("GET", "/student/classes", { token: t, label: "GET /student/classes" });

  // Attendance (student)
  await request("GET", "/attendance/student", { token: t, label: "GET /attendance/student" });
  await request("GET", "/student/attendance", { token: t, label: "GET /student/attendance (alt)" });

  // Assignments (student)
  const { data: asgData } = await request("GET", "/student/assignments", { token: t, label: "GET /student/assignments" });
  if (asgData?.data?.length > 0) {
    state.studentAssignmentId = asgData.data[0]._id;
    console.log(`     ↳ Found ${asgData.data.length} assignment(s)`);
  }

  // Payment history
  await request("GET", "/student/payments/history", { token: t, label: "GET /student/payments/history" });
  await request("GET", "/payments/history", { token: t, label: "GET /payments/history" });

  // Feedback (student)
  await request("GET", "/student/feedback", { token: t, label: "GET /student/feedback" });

  // Platform review
  await request("GET", "/student/platform-review", { token: t, label: "GET /student/platform-review" });

  // Performance notes (student)
  await request("GET", "/student/performance-notes", { token: t, label: "GET /student/performance-notes" });

  // Enrollments
  const { data: enrollData } = await request("GET", "/enrollments", { token: t, label: "GET /enrollments" });
  if (enrollData?.data?.length > 0) {
    state.studentEnrollmentId = enrollData.data[0]._id || enrollData.data[0].id;
    console.log(`     ↳ Found ${enrollData.data.length} enrollment(s)`);
  }

  // Notifications
  await request("GET", "/notifications", { token: t, label: "GET /notifications" });

  // Demo classes
  await request("GET", "/demos", { token: t, label: "GET /demos (student)" });

  // Fees
  await request("GET", "/fees/my", { token: t, label: "GET /fees/my (student)" });

  // Schedule (student)
  await request("GET", "/schedule/student", { token: t, label: "GET /schedule/student" });

  // RBAC: teacher trying student route → 403
  if (tokens.teacher) {
    await request("GET", "/student/dashboard", {
      token: tokens.teacher,
      label: "GET /student/dashboard (teacher) → 403",
      expectStatus: 403,
    });
  }
}

// ─── 6. WRITE OPERATION TESTS ────────────────────────────────────────────────
async function testWriteOps() {
  section("6. WRITE OPERATIONS (non-destructive)");

  // ── Notification mark-all-read ──
  if (tokens.student) {
    await request("PUT", "/notifications/read-all", {
      token: tokens.student,
      label: "PUT /notifications/read-all (student)",
    });
  }

  // ── Teacher: mark attendance (with a past date to avoid conflicts) ──
  if (tokens.teacher && state.teacherStudentId) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // 30 days ago
    pastDate.setHours(0, 0, 0, 0);

    await request("POST", "/attendance", {
      token: tokens.teacher,
      body: {
        date: pastDate.toISOString(),
        records: [
          { studentId: state.teacherStudentId, status: "present" },
        ],
      },
      label: "POST /attendance (teacher marks attendance)",
    });
  } else {
    skip("POST /attendance", "no teacher token or student ID");
  }

  // ── Teacher: add topic ──
  if (tokens.teacher && state.teacherStudentId) {
    const { data } = await request("POST", "/teacher/topics", {
      token: tokens.teacher,
      body: {
        studentId: state.teacherStudentId,
        topic: "Test Topic — Deep Test",
        notes: "Auto-generated by deep-test.js",
      },
      label: "POST /teacher/topics",
    });
    if (data?.data?._id) {
      state.testTopicId = data.data._id;
    }
  } else {
    skip("POST /teacher/topics", "no teacher token or student ID");
  }

  // ── Teacher: add performance note ──
  if (tokens.teacher && state.teacherStudentId) {
    const { data } = await request("POST", "/teacher/performance-notes", {
      token: tokens.teacher,
      body: {
        studentId: state.teacherStudentId,
        score: 85,
        note: "Test note — Deep Test",
      },
      label: "POST /teacher/performance-notes",
    });
    if (data?.data?._id) {
      state.testNoteId = data.data._id;
    }
  } else {
    skip("POST /teacher/performance-notes", "no teacher token or student ID");
  }

  // ── Teacher: update availability ──
  if (tokens.teacher) {
    await request("PUT", "/teacher/availability", {
      token: tokens.teacher,
      body: {
        availability: [
          { day: "Monday", slots: [{ start: "09:00", end: "12:00" }] },
          { day: "Wednesday", slots: [{ start: "14:00", end: "17:00" }] },
        ],
      },
      label: "PUT /teacher/availability",
    });
  }

  // ── Admin: create announcement ──
  if (tokens.admin) {
    await request("POST", "/admin/announcements", {
      token: tokens.admin,
      body: {
        title: "Test Announcement — Deep Test",
        message: "Auto-generated by deep-test.js",
      },
      label: "POST /admin/announcements",
    });
  }

  // ── Student: submit feedback (for first teacher) ──
  if (tokens.student && state.firstTeacherId) {
    await request("POST", "/student/feedback", {
      token: tokens.student,
      body: {
        teacherId: state.firstTeacherId,
        rating: 4,
        text: "Test feedback from deep-test.js",
      },
      label: "POST /student/feedback",
    });
  } else {
    skip("POST /student/feedback", "no student token or teacher ID");
  }

  // ── Student: submit platform review ──
  if (tokens.student) {
    await request("POST", "/student/platform-review", {
      token: tokens.student,
      body: {
        rating: 5,
        text: "Test platform review from deep-test.js",
      },
      label: "POST /student/platform-review",
    });
  }
}

// ─── 7. VALIDATION / EDGE CASE TESTS ────────────────────────────────────────
async function testEdgeCases() {
  section("7. VALIDATION & EDGE CASES");

  // Invalid ObjectId in params
  await request("GET", "/classes/invalid-id-here", {
    token: tokens.teacher || tokens.admin,
    label: "GET /classes/invalid-id → 400",
    expectStatus: 400,
  });

  // Non-existent valid ObjectId
  await request("GET", "/classes/000000000000000000000000", {
    token: tokens.teacher || tokens.admin,
    label: "GET /classes/non-existent → 404",
    expectStatus: 404,
  });

  // Missing required fields in login
  await request("POST", "/auth/login", {
    body: { email: "admin@meritnook.com" },
    label: "POST /auth/login (missing password) → 400",
    expectStatus: 400,
  });

  // Wrong password
  await request("POST", "/auth/login", {
    body: { email: "admin@meritnook.com", password: "wrongpassword" },
    label: "POST /auth/login (wrong password) → 400",
    expectStatus: 400,
  });

  // Non-existent user login
  await request("POST", "/auth/login", {
    body: { email: "doesntexist@test.com", password: "test123" },
    label: "POST /auth/login (non-existent user) → 404",
    expectStatus: 404,
  });

  // 404 route
  await request("GET", "/this-route-does-not-exist", {
    label: "GET /non-existent-route → 404",
    expectStatus: 404,
  });

  // Invalid attendance status
  if (tokens.teacher && state.teacherStudentId) {
    await request("POST", "/attendance", {
      token: tokens.teacher,
      body: {
        date: new Date().toISOString(),
        records: [
          { studentId: state.teacherStudentId, status: "INVALID_STATUS" },
        ],
      },
      label: "POST /attendance (invalid status) → 400",
      expectStatus: 400,
    });
  }

  // Empty attendance records
  if (tokens.teacher) {
    await request("POST", "/attendance", {
      token: tokens.teacher,
      body: { date: new Date().toISOString(), records: [] },
      label: "POST /attendance (empty records) → 400",
      expectStatus: 400,
    });
  }

  // Missing date in attendance
  if (tokens.teacher) {
    await request("POST", "/attendance", {
      token: tokens.teacher,
      body: { records: [{ studentId: "000000000000000000000000", status: "present" }] },
      label: "POST /attendance (missing date) → 400",
      expectStatus: 400,
    });
  }

  // Teacher availability — invalid day
  if (tokens.teacher) {
    await request("PUT", "/teacher/availability", {
      token: tokens.teacher,
      body: {
        availability: [{ day: "InvalidDay", slots: [{ start: "09:00", end: "12:00" }] }],
      },
      label: "PUT /teacher/availability (invalid day) → 400",
      expectStatus: 400,
    });
  }

  // Student feedback — invalid rating
  if (tokens.student && state.firstTeacherId) {
    await request("POST", "/student/feedback", {
      token: tokens.student,
      body: { teacherId: state.firstTeacherId, rating: 10, text: "bad" },
      label: "POST /student/feedback (rating > 5) → 400",
      expectStatus: 400,
    });
  }

  // Expired/fake token
  await request("GET", "/auth/me", {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid_signature",
    label: "GET /auth/me (fake token) → 401",
    expectStatus: 401,
  });
}

// ─── 8. CLEANUP ──────────────────────────────────────────────────────────────
async function cleanup() {
  section("8. CLEANUP (delete test data)");

  // Delete test topic
  if (tokens.teacher && state.testTopicId) {
    await request("DELETE", `/teacher/topics/${state.testTopicId}`, {
      token: tokens.teacher,
      label: "DELETE test topic",
    });
  }

  // Delete test performance note
  if (tokens.teacher && state.testNoteId) {
    await request("DELETE", `/teacher/performance-notes/${state.testNoteId}`, {
      token: tokens.teacher,
      label: "DELETE test performance note",
    });
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║      DEEP CONTROLLER TEST SUITE — MERIT NOOK            ║
║      ${new Date().toLocaleString("en-IN")}                        ║
╚══════════════════════════════════════════════════════════╝
`);
  console.log(`Base URL: ${BASE}\n`);

  try {
    await testAuth();
    await testPublic();
    await testAdmin();
    await testTeacher();
    await testStudent();
    await testWriteOps();
    await testEdgeCases();
    await cleanup();
  } catch (err) {
    console.error("\n💀 FATAL ERROR during test execution:", err.message);
  }

  // ── Summary ──
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  📊 TEST RESULTS`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Total:   ${totalTests}`);
  console.log(`  ✅ Pass:  ${passed}`);
  console.log(`  ❌ Fail:  ${failed}`);
  console.log(`  ⏭️  Skip:  ${skipped}`);
  console.log(`  Rate:    ${totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0}%`);

  if (failures.length > 0) {
    console.log(`\n  ── FAILURES ──`);
    failures.forEach(f => console.log(f));
  }

  console.log(`\n${"═".repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
