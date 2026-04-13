/**
 * API layer — all functions call the real backend.
 */

// ─── REAL API HELPERS ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '';  // '' = use Vite proxy

// Shared refresh promise — prevents multiple concurrent refresh calls
let _refreshing = null;

/**
 * Generic fetch wrapper.
 * - sends cookies (credentials: 'include')
 * - auto-parses JSON
 * - throws { message } on non-2xx
 * - automatically refreshes access token on 401 and retries once
 */
async function request(method, path, body, isFormData = false) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers, credentials: 'include' };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${API_BASE}${path}`, opts);

  // On 401, try refreshing the access token once then retry
  if (res.status === 401 && path !== '/api/auth/refresh-token' && path !== '/api/auth/login') {
    try {
      if (!_refreshing) {
        _refreshing = fetch(`${API_BASE}/api/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
        }).finally(() => { _refreshing = null; });
      }
      const refreshRes = await _refreshing;
      if (refreshRes.ok) {
        // Retry the original request with the new cookie
        res = await fetch(`${API_BASE}${path}`, opts);
      }
    } catch { /* fall through to original error below */ }
  }

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) throw new Error(data?.message || 'Something went wrong');
  return data;
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────

/** POST /api/auth/register  → Sends OTP to email */
export const apiRegister = (name, email, password, mobileNumber) =>
  request('POST', '/api/auth/register', { name, email, password, mobileNumber });

/** POST /api/auth/verify-register  → Verifies OTP, creates account */
export const apiVerifyRegister = (email, otp) =>
  request('POST', '/api/auth/verify-register', { email, otp });

/** POST /api/auth/resend-otp */
export const apiResendOTP = (email) =>
  request('POST', '/api/auth/resend-otp', { email });

/** POST /api/auth/login  → returns { accessToken, refreshToken } via cookies */
export const apiLogin = (email, password) =>
  request('POST', '/api/auth/login', { email, password });

/** POST /api/auth/logout */
export const apiLogout = () =>
  request('POST', '/api/auth/logout');

/** GET /api/auth/me  → returns logged-in user profile */
export const apiGetMe = () =>
  request('GET', '/api/auth/me');

/** PUT /api/auth/profile  → update name, phone, dob, gender, bio, avatar (file or URL) */
export const apiUpdateProfile = (data) =>
  data instanceof FormData
    ? request('PUT', '/api/auth/profile', data, true)   // multipart
    : request('PUT', '/api/auth/profile', data);        // JSON

/** POST /api/auth/refresh-token */
export const apiRefreshToken = () =>
  request('POST', '/api/auth/refresh-token');

/** POST /api/auth/forgot-password  → Sends reset OTP */
export const apiForgotPassword = (email) =>
  request('POST', '/api/auth/forgot-password', { email });

/** POST /api/auth/reset-password */
export const apiResetPassword = (email, otp, newPassword) =>
  request('POST', '/api/auth/reset-password', { email, otp, newPassword });

// ─── STUDENT API ──────────────────────────────────────────────────────────────

export const apiStudentDashboard = () => request('GET', '/api/student/dashboard');
export const apiStudentClasses = () => request('GET', '/api/student/classes');
export const apiStudentAttendance = () => request('GET', '/api/student/attendance');
export const apiStudentAssignments = () => request('GET', '/api/student/assignments');
export const apiSubmitAssignment = (id, formData) =>
  request('POST', `/api/student/assignments/${id}/submit`, formData, true);
export const apiStudentPayments = () => request('GET', '/api/student/payments/history');
export const apiStudentNotifications = () => request('GET', '/api/notifications');

// ─── TEACHER API ──────────────────────────────────────────────────────────────

export const apiTeacherDashboard = () => request('GET', '/api/teacher/dashboard');
export const apiTeachersList = () => request('GET', '/api/teacher/list');
export const apiTeacherClasses = () => request('GET', '/api/classes');
export const apiCreateClass = (data) => request('POST', '/api/classes', data);
export const apiUpdateClass = (id, data) => request('PUT', `/api/classes/${id}`, data);
export const apiDeleteClass = (id) => request('DELETE', `/api/teacher/classes/${id}`);
/** POST /api/attendance  — no class needed; body: { date, records: [{ studentId, status }] } */
export const apiMarkAttendance = (date, records) =>
  request('POST', '/api/attendance', { date, records });
export const apiGetAttendance = () =>
  request('GET', '/api/attendance/student');
/** Teacher: fetch attendance history for a specific student */
export const apiGetStudentAttendanceByTeacher = (studentId) =>
  request('GET', `/api/attendance/student/${studentId}`);
export const apiCreateAssignmentReal = (formData) =>
  request('POST', '/api/teacher/assignments', formData, true);
export const apiTeacherGetAssignments = () =>
  request('GET', '/api/teacher/assignments').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiGradeSubmission = (id, data) =>
  request('PUT', `/api/teacher/submissions/${id}`, data);
export const apiGetAllSubmissions = () => request('GET', '/api/teacher/submissions');

// ─── TEACHER PLAN API (read-only for teachers) ────────────────────────────────
export const apiGetMyPlans = () =>
  request('GET', '/api/teacher/plans').then(r => r?.data?.plans ?? r?.data ?? r ?? []).catch(() => []);

// ─── TEACHER TOPICS ───────────────────────────────────────────────────────────
export const apiGetTopics = () =>
  request('GET', '/api/teacher/topics').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiAddTopic = (data) =>
  request('POST', '/api/teacher/topics', data);
export const apiDeleteTopic = (id) =>
  request('DELETE', `/api/teacher/topics/${id}`);

// ─── TEACHER PERFORMANCE NOTES ────────────────────────────────────────────────
export const apiGetPerformanceNotes = () =>
  request('GET', '/api/teacher/performance-notes').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiAddPerformanceNote = (data) =>
  request('POST', '/api/teacher/performance-notes', data);
export const apiDeletePerformanceNote = (id) =>
  request('DELETE', `/api/teacher/performance-notes/${id}`);

// ─── ADMIN TEACHER API ────────────────────────────────────────────────────────
export const apiAdminUpdateTeacher    = (teacherId, data) =>
  request('PUT', `/api/admin/teachers/${teacherId}`, data);
export const apiAdminDeleteTeacher    = (teacherId) =>
  request('DELETE', `/api/admin/teachers/${teacherId}`);
export const apiAdminGetClasses = () =>
  request('GET', '/api/admin/classes').then(r => r?.data ?? r ?? []).catch(() => []);

// ─── PAYMENT API ──────────────────────────────────────────────────────────────

// ─── PAYMENT API ────────────────────────────────────────────────────────

export const apiInitiatePayment = (enrollmentId) =>
  request('POST', '/api/payments/initiate', { enrollmentId });
export const apiInitiateMonthlyPayment = (paymentId) =>
  request('POST', '/api/payments/initiate', { paymentId });
export const apiVerifyPayment = (data) =>
  request('POST', '/api/payments/verify', data);
export const apiPaymentHistory = () => request('GET', '/api/payments/history');
export const apiDownloadInvoice = (id) =>
  fetch(`${API_BASE}/api/payments/${id}/invoice`, { credentials: 'include' });

// ─── ENROLLMENT API ───────────────────────────────────────────────────────────

/** Enroll in a tutor — pass full data: { planId, grade, board, school, subjectsEnrolled, parentName, parentPhone, preferredDays, notes } */
export const apiRequestEnrollment = (tutorId, data) =>
  request('POST', `/api/enrollments/request`, { tutorId, ...data });
export const apiCancelEnrollment = (id) =>
  request('DELETE', `/api/enrollments/${id}`);

/** Student enrollments — GET /api/enrollments */
export const fetchEnrollments = () =>
  request('GET', '/api/enrollments').then(res => res?.data ?? res ?? []).catch(() => []);

// ─── DEMO API ─────────────────────────────────────────────────────────────────
/** Request a free demo with a tutor (before enrollment) */
export const apiRequestDemo = (tutorId) =>
  request('POST', `/api/demos/${tutorId}`);
/** Get all my demo requests */
export const apiGetMyDemos = () =>
  request('GET', '/api/demos').then(r => r?.data ?? r ?? []).catch(() => []);
/** Check if a demo has been booked for a specific tutor */
export const apiGetDemoStatus = (tutorId) =>
  request('GET', `/api/demos/status/${tutorId}`).then(r => r?.data ?? { booked: false }).catch(() => ({ booked: false }));
/** Teacher: get all demo requests for their profile */
export const apiGetTeacherDemos = () =>
  request('GET', '/api/demos/requests').then(r => r?.data ?? r ?? []).catch(() => []);
/** Teacher: confirm a demo — schedule date/time and add Zoom link */
export const apiConfirmDemo = (demoId, data) =>
  request('PATCH', `/api/demos/${demoId}/confirm`, data);
/** Teacher: mark a demo as completed */
export const apiCompleteDemo = (demoId) =>
  request('PATCH', `/api/demos/${demoId}/complete`);

// ─── SCHEDULE API ─────────────────────────────────────────────────────────────
/** Teacher: get their weekly schedule slots */
export const apiGetMySchedule = () =>
  request('GET', '/api/schedule').then(r => r?.data ?? r ?? []).catch(() => []);
/** Teacher: add a new recurring slot */
export const apiAddScheduleSlot = (data) =>
  request('POST', '/api/schedule', data);
/** Teacher: update a slot */
export const apiUpdateScheduleSlot = (id, data) =>
  request('PUT', `/api/schedule/${id}`, data);
/** Teacher: delete a slot */
export const apiDeleteScheduleSlot = (id) =>
  request('DELETE', `/api/schedule/${id}`);
/** Student: get merged schedule from all enrolled tutors */
export const apiGetStudentSchedule = () =>
  request('GET', '/api/schedule/student').then(r => r?.data ?? r ?? []).catch(() => []);

// ─── STUDENT FEEDBACK ─────────────────────────────────────────────────────────
export const apiSubmitFeedback = (data) =>
  request('POST', '/api/student/feedback', data);
export const apiGetMyFeedback = () =>
  request('GET', '/api/student/feedback').then(r => r?.data ?? r ?? []).catch(() => []);

// ─── TEACHER FEEDBACK ─────────────────────────────────────────────────────────
export const apiGetTeacherFeedback = () =>
  request('GET', '/api/teacher/feedback').then(r => r?.data ?? r ?? {}).catch(() => ({}));
// ─── TEACHER AVAILABILITY ─────────────────────────────────────────────────────────
export const apiGetAvailability = () =>
  request('GET', '/api/teacher/availability').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiUpdateAvailability = (availability) =>
  request('PUT', '/api/teacher/availability', { availability });
/** Teacher: get all per-student schedule slots grouped by student */
export const apiGetStudentSlots = () =>
  request('GET', '/api/schedule/students').then(r => r?.data ?? r ?? []).catch(() => []);
/** Teacher: add a personal slot for a specific student */
export const apiAddStudentSlot = (studentId, data) =>
  request('POST', `/api/schedule/student/${studentId}`, data);
/** Teacher: update a student-specific slot */
export const apiUpdateStudentSlot = (slotId, data) =>
  request('PUT', `/api/schedule/${slotId}`, data);
/** Teacher: delete a student-specific slot */
export const apiDeleteStudentSlot = (slotId) =>
  request('DELETE', `/api/schedule/student-slot/${slotId}`);

// ─── PAYMENT API

export const apiGetNotifications = () => request('GET', '/api/notifications');
export const apiMarkNotificationRead = (id) =>
  request('PUT', `/api/notifications/${id}/read`);
export const apiDeleteNotification = (id) =>
  request('DELETE', `/api/notifications/${id}`);

// ─── ADMIN API ────────────────────────────────────────────────────────────────

export const apiAdminOverview = () =>
  request('GET', '/api/admin/analytics/overview');
export const apiAdminMonthly = () =>
  request('GET', '/api/admin/analytics/monthly');
export const apiAdminTeacherRevenue = () =>
  request('GET', '/api/admin/analytics/teachers');
export const apiAdminCreateTeacher = (data) =>
  request('POST', '/api/admin/create-teacher', data);
export const apiAdminGetTeachers = () =>
  request('GET', '/api/admin/teachers');
export const apiAdminGetStudents = () =>
  request('GET', '/api/admin/students');

// ─── ADMIN REVIEWS ───────────────────────────────────────────────────────────────
export const apiAdminGetReviews = () =>
  request('GET', '/api/admin/reviews').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiAdminToggleFeatured = (id) =>
  request('PUT', `/api/admin/reviews/${id}/feature`);
export const apiFeaturedReviews = () =>
  request('GET', '/api/admin/reviews/featured').then(r => r?.data ?? r ?? []).catch(() => []);

// ─── PLATFORM REVIEWS (Student) ──────────────────────────────────────────────
export const apiSubmitPlatformReview = (data) =>
  request('POST', '/api/student/platform-review', data);
export const apiGetMyPlatformReview = () =>
  request('GET', '/api/student/platform-review').then(r => r?.data ?? r ?? null).catch(() => null);

// ─── ADMIN PLATFORM REVIEWS ─────────────────────────────────────────────────
export const apiAdminGetPlatformReviews = () =>
  request('GET', '/api/admin/platform-reviews').then(r => r?.data ?? r ?? []).catch(() => []);
export const apiAdminToggleFeaturedPlatform = (id) =>
  request('PUT', `/api/admin/platform-reviews/${id}/feature`);
export const apiFeaturedPlatformReviews = () =>
  request('GET', '/api/admin/platform-reviews/featured').then(r => r?.data ?? r ?? []).catch(() => []);

// ─── ADMIN STUDENT LOOKUP ────────────────────────────────────────────────────
export const apiAdminSearchStudents = (q) =>
  request('GET', `/api/admin/students/search?q=${encodeURIComponent(q)}`).then(r => r?.data ?? []).catch(() => []);
export const apiAdminGetStudentDetails = (studentId) =>
  request('GET', `/api/admin/students/${studentId}/details`).then(r => r?.data ?? null).catch(() => null);
export const apiAdminUpdateEnrollmentBilling = (enrollmentId, nextBillingDate) =>
  request('PUT', `/api/admin/enrollments/${enrollmentId}/billing`, { nextBillingDate });
export const apiAdminUpdatePaymentDueDate = (paymentId, dueDate) =>
  request('PUT', `/api/admin/payments/${paymentId}/due-date`, { dueDate });

// ─── ADMIN ENROLLMENT MANAGEMENT ─────────────────────────────────────────────
/** Get all enrollments, optionally filtered: ?status=requested */
export const apiAdminGetAllEnrollments = (status) =>
  request('GET', `/api/admin/enrollments${status ? `?status=${status}` : ''}`).then(r => r?.data ?? []).catch(() => []);
/** Update an enrollment (status, price, notes) */
export const apiAdminUpdateEnrollment = (enrollmentId, data) =>
  request('PUT', `/api/admin/enrollments/${enrollmentId}`, data);
/** Directly assign a tutor to a student (admin creates enrollment) */
export const apiAdminAssignTutor = (data) =>
  request('POST', '/api/admin/enrollments/create', data);

/** Fetch all announcements */
export const apiAdminGetAnnouncements = () =>
  request('GET', '/api/admin/announcements').then(r => r?.data ?? []).catch(() => []);
/** Publish a new announcement */
export const apiAdminPublishAnnouncement = (data) =>
  request('POST', '/api/admin/announcements', data);

// ─── DASHBOARD FETCH HELPERS (uses real backend) ─────────────────────────────

/** Student dashboard — GET /api/student/dashboard */
export const fetchStudentData = () =>
  request('GET', '/api/student/dashboard').then(res => res?.data ?? res).catch(() => null);

/** Tutors list — GET /api/teacher/list */
export const fetchTutors = () =>
  request('GET', '/api/teacher/list').then(res => (Array.isArray(res) ? res : (res?.data ?? []))).catch(() => []);

/** Fee / payment history — GET /api/payments/history */
export const fetchFeeData = async () => {
  try {
    const res = await request('GET', '/api/payments/history');
    // Support enriched response { payments, pendingInvoices } or flat array
    const payments = Array.isArray(res) ? res
      : Array.isArray(res?.data?.payments) ? res.data.payments
      : Array.isArray(res?.payments) ? res.payments
      : Array.isArray(res?.data) ? res.data
      : [];
    const pendingInvoices = Array.isArray(res?.data?.pendingInvoices) ? res.data.pendingInvoices
      : Array.isArray(res?.pendingInvoices) ? res.pendingInvoices
      : [];

    // nextBillingDate from active enrollment — used as fallback when no pending invoice has a dueDate
    const nextBillingDate = res?.data?.nextBillingDate ?? res?.nextBillingDate ?? null;

    const paid = payments.filter(p => p.status === 'paid');
    const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);
    const nextDue = pendingInvoices[0] ?? payments.find(p => p.status === 'pending');
    const nextDueSrc = nextDue?.dueDate ?? nextBillingDate;

    return {
      pendingFees: pendingInvoices.reduce((s, p) => s + (p.amount || 0), 0),
      totalFeesPaid: totalPaid,
      nextBillingDateRaw: nextBillingDate ?? null,          // raw ISO/Date for day-checks in UI
      nextDueDate: nextDueSrc
        ? new Date(nextDueSrc).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      pendingInvoices,
      feeHistory: payments.map(p => ({
        id: p.id ?? p._id,
        month: p.billingMonth || (p.createdAt
          ? new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          : '—'),
        amount: p.amount ?? 0,
        status: p.status,
        type: p.type || 'initial',
        dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        date: p.paidAt
          ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
        txn: p.invoiceNumber || p.razorpayPaymentId || p.razorpayOrderId || '—',
        planName: p.planName || '—',
        teacherName: p.teacherName || '—',
        isAutoGenerated: !!p.isAutoGenerated,
      })),
    };
  } catch {
    return { pendingFees: 0, totalFeesPaid: 0, nextDueDate: '—', pendingInvoices: [], feeHistory: [] };
  }
};

export const apiGetMyPerformanceNotes = () =>
  request('GET', '/api/student/performance-notes')
    .then(res => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))
    .catch(() => []);

/** Teacher updates / notifications — GET /api/notifications */
export const fetchTeacherUpdates = () =>
  request('GET', '/api/notifications')
    .then(res => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []))
    .catch(() => []);

/** Teacher dashboard — GET /api/teacher/dashboard */
export const fetchTeacherData = () =>
  request('GET', '/api/teacher/dashboard').then(res => res?.data ?? res).catch(() => null);

/** Admin dashboard — combines /api/admin/analytics/overview + teachers + students */
export const fetchAdminData = async () => {
  try {
    const [overview, teachers, students] = await Promise.allSettled([
      request('GET', '/api/admin/analytics/overview'),
      request('GET', '/api/admin/teachers'),
      request('GET', '/api/admin/students'),
    ]);
    const ov = overview.status === 'fulfilled' ? (overview.value?.data ?? overview.value ?? {}) : {};
    const tList = teachers.status === 'fulfilled' ? (teachers.value?.data ?? teachers.value ?? []) : [];
    const sList = students.status === 'fulfilled' ? (students.value?.data ?? students.value ?? []) : [];

    return {
      totalTeachers: ov.totalTeachers ?? tList.length,
      totalStudents: ov.totalStudents ?? sList.length,
      monthlyRevenue: ov.monthlyRevenue ?? 0,
      totalRevenue: ov.totalRevenue ?? 0,
      pendingFees: ov.pendingFees ?? 0,
      collectionRate: ov.collectionRate ?? 0,
      avgAttendance: ov.avgAttendance ?? 0,  // now real from backend
      totalAssignments: ov.totalAssignments ?? 0,
      avgPlatformRating: ov.avgPlatformRating ?? 0,
      openComplaints: 0,
      avgGPA: ov.avgGPA ?? 0,
      atRiskStudents: 0,
      totalClassesConducted: ov.totalClassesConducted ?? 0,
      assignmentCompletion: ov.assignmentCompletion ?? 0,
      avgClassDuration: ov.avgClassDuration ?? 0,
      parentSatisfaction: 0,
      platformUptime: 99.9,
      avgResponseTime: '< 2 hrs',
      teachers: tList.map((t, i) => ({
        id: t._id ?? i,
        name: t.userId?.name ?? 'Teacher',
        subject: t.subjects?.[0] ?? '',
        subjects: t.subjects ?? [],
        avatar: (t.userId?.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarGrad: 'linear-gradient(135deg,#7c5cfc,#c084fc)',
        status: t.userId?.isActive === false ? 'Inactive' : 'Active',
        employeeId: t.teacherId ?? `TCH-${i}`,
        email: t.userId?.email ?? '',
        phone: t.userId?.phone || '',
        classesPerWeek: 0,
        joiningDate: t.createdAt
          ? new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          : '—',
        salary: t.salary ?? 0,
        rating: t.rating ?? 0,
        reviews: t.totalReviews ?? 0,
        students: t.totalStudents ?? 0,
        experience: t.experience ? `${t.experience} years` : '',
        badge: t.badge ?? 'New',
        badgeCls: t.badge === 'Top Rated' ? 'bd-success' : 'bd-muted',
        plans: t.plans ?? [],
        about: t.bio ?? '',
        topics: t.subjects ?? [],
        availability: [],
        languages: [],
        grades: '',
        speciality: t.subjects?.join(' · ') ?? '',
        color: 'var(--grad-primary)',
      })),
      allStudents: sList.map((s, i) => ({
        id: s._id ?? i,
        name: s.userId?.name ?? 'Student',
        email: s.userId?.email ?? '',
        rollNo: s.studentId ?? `STU-${i}`,
        grade: s.grade ?? '—',
        avatar: (s.userId?.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarGrad: 'linear-gradient(135deg,#7c5cfc,#c084fc)',
        attendance: s.attendancePercentage ?? 0,
        totalClasses: s.totalClasses ?? 0,
        gpa: 0,
        performanceStatus: 'active',
        pendingAssignments: 0,
        teachers: [],
        subjects: [],
        parentName: s.parentName ?? '—',
        parentPhone: s.parentPhone ?? '—',
      })),
      revenueTrend: ov.revenueTrend ?? [],
      recentPayments: ov.recentPayments ?? [],
      subjectDistribution: (() => {
        const fromBackend = (ov.subjectPerformance ?? ov.subjectDistribution ?? [])
          .filter(s => s.subject)
          .map(s => ({ subject: s.subject, count: s.count ?? 1 }));
        if (fromBackend.length > 0) return fromBackend;
        // Fallback: count subjects across all teachers
        const map = {};
        tList.forEach(t => (t.subjects ?? []).forEach(sub => { map[sub] = (map[sub] ?? 0) + 1; }));
        return Object.entries(map).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count).slice(0, 8);
      })(),
      announcements: [],
      recentActivity: (ov.recentPayments ?? []).slice(0, 8).map(p => ({
        icon: p.status === 'completed' ? '💰' : '🔔',
        action: p.status === 'completed' ? `Payment received from ${p.student}` : `Pending payment — ${p.student}`,
        detail: `₹${(p.amount ?? 0).toLocaleString('en-IN')} · ${p.method ?? '—'}`,
        time: p.date ?? '—',
      })),
      enrollmentTrend: ov.enrollmentTrend ?? [],
      subjectPerformance: ov.subjectPerformance ?? [],
      teacherUtilization: ov.teacherUtilization ?? { full: 0, available: 0, onLeave: 0 },
    };
  } catch {
    return null;
  }
};

// ─── keep remaining real helper exports below ─────────────────────────────────

/** POST /api/student/assignments/:id/submit  (multipart/form-data) */
export const submitAssignment = async (assignmentId, file, note) => {
  const form = new FormData();
  form.append('file', file);
  if (note) form.append('note', note);
  return apiSubmitAssignment(assignmentId, form);
};

/** POST /api/teacher/assignments  (multipart/form-data) */
export const createAssignment = async (formData) =>
  apiCreateAssignmentReal(formData);

/** GET /api/teacher/submissions */
export const getSubmissions = async () => apiGetAllSubmissions().catch(() => []);

/** (placeholder – actual download uses apiDownloadInvoice) */
export const downloadSubmission = async (_submissionId) => null;

// ─── STUDENT FEE API ──────────────────────────────────────────────────────────

/** Admin: set fee for a student */
export const apiAdminSetStudentFee = (data) =>
  request('POST', '/api/fees/admin/set', data);
/** Admin: update a fee record */
export const apiAdminUpdateStudentFee = (feeId, data) =>
  request('PUT', `/api/fees/admin/${feeId}`, data);
/** Admin: delete a fee record */
export const apiAdminDeleteStudentFee = (feeId) =>
  request('DELETE', `/api/fees/admin/${feeId}`);
/** Admin: get all fees for a student */
export const apiAdminGetStudentFees = (studentId) =>
  request('GET', `/api/fees/admin/student/${studentId}`).then(r => r?.data ?? { fees: [], summary: {} }).catch(() => ({ fees: [], summary: {} }));
/** Admin: record a payment against a fee */
export const apiAdminRecordFeePayment = (feeId, amount) =>
  request('POST', `/api/fees/admin/${feeId}/pay`, { amount });
/** Student: get own fee details */
export const apiGetMyFees = () =>
  request('GET', '/api/fees/my').then(r => r?.data ?? { fees: [], summary: {} }).catch(() => ({ fees: [], summary: {} }));
/** Student: initiate Razorpay payment for a fee */
export const apiInitiateFeePayment = (feeId, amount) =>
  request('POST', '/api/fees/pay/initiate', { feeId, amount });
/** Student: verify Razorpay payment for a fee */
export const apiVerifyFeePayment = (data) =>
  request('POST', '/api/fees/pay/verify', data);