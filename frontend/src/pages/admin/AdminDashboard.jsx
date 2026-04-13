import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import StatCard from '../../components/StatCard';
import { statusConfig } from '../../data/mockData';
import {
  fetchAdminData,
  apiAdminCreateTeacher,
  apiAdminUpdateTeacher,
  apiAdminDeleteTeacher,
  apiAdminGetReviews,
  apiAdminToggleFeatured,
  apiAdminGetPlatformReviews,
  apiAdminToggleFeaturedPlatform,
  apiAdminSearchStudents,
  apiAdminGetStudentDetails,
  apiAdminUpdateEnrollmentBilling,
  apiAdminUpdatePaymentDueDate,
  apiAdminGetAllEnrollments,
  apiAdminUpdateEnrollment,
  apiAdminAssignTutor,
  apiAdminGetAnnouncements,
  apiAdminPublishAnnouncement,
  apiAdminSetStudentFee,
  apiAdminUpdateStudentFee,
  apiAdminDeleteStudentFee,
  apiAdminGetStudentFees,
  apiAdminRecordFeePayment,
} from '../../api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const statusBadge = (s) => statusConfig[s] || { label: s, cls: 'bd-muted' };

export default function AdminDashboard() {
  const [section, setSection] = useState('dashboard');
  const [d, setD] = useState(null);
  const [dataError, setDataError] = useState('');
  const { isDark } = useTheme();

  const loadData = useCallback(() => {
    setD(null);
    setDataError('');
    fetchAdminData()
      .then(data => {
        if (!data) { setDataError('Failed to load dashboard data. Try logging out and back in.'); return; }
        setD({
          ...data,
          teachers: data.teachers ?? [],
          allStudents: data.allStudents ?? [],
          revenueTrend: data.revenueTrend ?? [],
          recentPayments: data.recentPayments ?? [],
          subjectDistribution: data.subjectDistribution ?? [],
          announcements: data.announcements ?? [],
          recentActivity: data.recentActivity ?? [],
          enrollmentTrend: data.enrollmentTrend ?? [],
          subjectPerformance: data.subjectPerformance ?? [],
          teacherUtilization: data.teacherUtilization ?? { full: 0, available: 0, onLeave: 0 },
        });
      })
      .catch(err => setDataError(err?.message || 'Unexpected error loading data'));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', audience: 'all', priority: 'normal' });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState(null); // null = not yet loaded
  const [showRegisterTeacher, setShowRegisterTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', phone: '', subject: 'Mathematics', experience: '', salary: '', grades: '', about: '', password: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState(null); // teacherId | null
  const [deletingTeacher, setDeletingTeacher] = useState(false);

  // ── Edit teacher state ────────────────────────────────────────────────────
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [editTeacherForm, setEditTeacherForm] = useState({ name: '', email: '', phone: '', subjects: '', experience: '', bio: '', salary: '' });
  const [editTeacherSaving, setEditTeacherSaving] = useState(false);

  // ── Reviews management state ─────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [togglingReview, setTogglingReview] = useState(null);

  const [platformReviews, setPlatformReviews] = useState([]);
  const [platformReviewsLoading, setPlatformReviewsLoading] = useState(false);
  const [togglingPlatformReview, setTogglingPlatformReview] = useState(null);

  // ── Student lookup (revenue section) ────────────────────────────────────
  const [stuQuery, setStuQuery] = useState('');
  const [stuSearchResults, setStuSearchResults] = useState([]);
  const [stuSearching, setStuSearching] = useState(false);
  const [stuDetail, setStuDetail] = useState(null);       // { profile, enrollments, payments, summary }
  const [stuDetailLoading, setStuDetailLoading] = useState(false);
  const [stuPayTab, setStuPayTab] = useState('payments'); // 'payments' | 'enrollments'
  const [editingDueDate, setEditingDueDate] = useState(null);   // paymentId being edited
  const [editingBilling, setEditingBilling] = useState(null);   // enrollmentId being edited
  const [savingDate, setSavingDate] = useState(false);

  // ── Enrollment management state ─────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null); // enrollment being edited
  const [enrollEditForm, setEnrollEditForm] = useState({ status: '', price: '', notes: '' });
  const [enrollEditSaving, setEnrollEditSaving] = useState(false);
  // Assign tutor modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStudentQuery, setAssignStudentQuery] = useState('');
  const [assignStudentDropOpen, setAssignStudentDropOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentEmail: '', tutorId: '', price: '', grade: '', board: 'CBSE', parentName: '', parentPhone: '', notes: '' });
  const [assignSaving, setAssignSaving] = useState(false);
  // student sub-tab within students section
  const [studentsTab, setStudentsTab] = useState('list'); // 'list' | 'enrollments'

  // ── Fee Management state ────────────────────────────────────────────────────
  const [feeStudentQuery, setFeeStudentQuery] = useState('');
  const [feeStudentResults, setFeeStudentResults] = useState([]);
  const [feeStudentSearching, setFeeStudentSearching] = useState(false);
  const [feeSelectedStudent, setFeeSelectedStudent] = useState(null); // { _id, name, ... }
  const [feeData, setFeeData] = useState({ fees: [], summary: {} });
  const [feeDataLoading, setFeeDataLoading] = useState(false);
  const [feeForm, setFeeForm] = useState({ totalFee: '', description: '', dueDate: '' });
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeEditId, setFeeEditId] = useState(null);
  const [feeEditForm, setFeeEditForm] = useState({ totalFee: '', paidAmount: '', description: '', dueDate: '' });
  const [feeEditSaving, setFeeEditSaving] = useState(false);
  const [feePayId, setFeePayId] = useState(null);
  const [feePayAmount, setFeePayAmount] = useState('');
  const [feePaySaving, setFeePaySaving] = useState(false);

  const handleStuSearch = async (q) => {
    setStuQuery(q);
    if (!q.trim()) { setStuSearchResults([]); return; }
    setStuSearching(true);
    try {
      const res = await apiAdminSearchStudents(q);
      setStuSearchResults(Array.isArray(res) ? res : []);
    } finally { setStuSearching(false); }
  };

  const handleStuSelect = async (stu) => {
    setStuSearchResults([]);
    setStuQuery(stu.name);
    setStuDetailLoading(true);
    setStuDetail(null);
    try {
      const data = await apiAdminGetStudentDetails(stu._id);
      setStuDetail(data);
    } catch { toast.error('Could not load student details'); }
    finally { setStuDetailLoading(false); }
  };

  const clearStuLookup = () => {
    setStuQuery(''); setStuSearchResults([]); setStuDetail(null);
  };

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const data = await apiAdminGetAllEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === 'students' && studentsTab === 'enrollments' && enrollments.length === 0) {
      loadEnrollments();
    }
  }, [section, studentsTab]);

  const loadReviews = () => {
    setReviewsLoading(true);
    apiAdminGetReviews().then(setReviews).finally(() => setReviewsLoading(false));
  };
  useEffect(() => { if (section === 'reviews') loadReviews(); }, [section]);

  const loadPlatformReviews = () => {
    setPlatformReviewsLoading(true);
    apiAdminGetPlatformReviews().then(setPlatformReviews).finally(() => setPlatformReviewsLoading(false));
  };
  useEffect(() => { if (section === 'reviews') loadPlatformReviews(); }, [section]);

  const handleToggleFeatured = async (id) => {
    setTogglingReview(id);
    try {
      const res = await apiAdminToggleFeatured(id);
      const featured = res?.data?.featured ?? res?.featured;
      setReviews(prev => prev.map(r => r.id === id ? { ...r, featured: !!featured } : r));
      toast.success(featured ? '⭐ Review featured on homepage' : 'Review removed from homepage');
    } catch (e) { toast.error(e?.message || 'Failed to update'); }
    finally { setTogglingReview(null); }
  };

  const handleToggleFeaturedPlatform = async (id) => {
    setTogglingPlatformReview(id);
    try {
      const res = await apiAdminToggleFeaturedPlatform(id);
      const featured = res?.data?.featured ?? res?.featured;
      setPlatformReviews(prev => prev.map(r => r.id === id ? { ...r, featured: !!featured } : r));
      toast.success(featured ? '⭐ Platform review featured on homepage' : 'Platform review removed from homepage');
    } catch (e) { toast.error(e?.message || 'Failed to update'); }
    finally { setTogglingPlatformReview(null); }
  };

  const tSet = (k, v) => setTeacherForm(p => ({ ...p, [k]: v }));

  const handleRegisterTeacher = async () => {
    const { name, email, phone, subject, experience, salary, password, about, grades } = teacherForm;
    if (!name || !email || !phone || !subject || !experience || !salary || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setRegisterLoading(true);
    try {
      await apiAdminCreateTeacher({
        name,
        email,
        password,
        phone,
        subjects: [subject],
        experience: Number(experience) || 0,
        bio: about,
        salary: Number(salary) || 0,
        grades,
      });
      toast.success(`✅ ${name} registered as teacher!`);
      setTeacherForm({ name: '', email: '', phone: '', subject: 'Mathematics', experience: '', salary: '', grades: '', about: '', password: '' });
      loadData();
      setSection('teachers');
    } catch (err) {
      toast.error(err.message || 'Failed to register teacher.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;
    const { name, email, phone, subjects, experience, bio, salary } = editTeacherForm;
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setEditTeacherSaving(true);
    try {
      await apiAdminUpdateTeacher(selectedTeacher.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
        experience: Number(experience) || 0,
        bio: bio.trim(),
        salary: Number(salary) || 0,
      });
      toast.success(`✅ ${name} updated successfully!`);
      setShowEditTeacher(false);
      loadData();
      setSelectedTeacher(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update teacher.');
    } finally {
      setEditTeacherSaving(false);
    }
  };

  const tickColor = isDark ? '#9898bb' : '#5a4e8a';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const chartOpts = {
    plugins: { legend: { labels: { color: tickColor, font: { family: 'Poppins', size: 11 } } } },
    scales: {
      x: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
    },
  };

  const sectionTitles = {
    dashboard: ['Admin Dashboard', 'Platform overview & key metrics'],
    teachers: ['Teacher Management', 'View, manage & monitor all teachers'],
    'add-teacher': ['Register New Teacher', 'Add a new teacher to the platform'],
    students: ['Student Management', 'All enrolled students across the platform'],
    'fee-management': ['Fee Management', 'Set and manage individual student fees'],
    classes: ['Session Monitoring', 'Sessions across the platform'],
    revenue: ['Revenue & Fees', 'Financial overview & payment tracking'],
    announcements: ['Announcements', 'Platform-wide notices & communications'],
    reports: ['Reports & Analytics', 'Detailed platform analytics & insights'],
    reviews: ['Student Reviews', 'Manage tutor & platform reviews and feature testimonials on the homepage'],
    settings: ['Platform Settings', 'Configure platform preferences'],
  };

  const [title, subtitle] = sectionTitles[section] || ['Admin', ''];

  /* ────────────────────────── SECTION RENDERERS ────────────────────────── */

  const renderSection = () => {
    if (dataError) return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⚠️</div>
        <div style={{ fontWeight: 700, color: 'var(--color-rose)', marginBottom: 12 }}>{dataError}</div>
        <button className="btn btn-primary" onClick={loadData}>🔄 Retry</button>
      </div>
    );
    if (!d) return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 14, opacity: .6 }}>⏳</div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading admin dashboard…</div>
      </div>
    );

    switch (section) {

      /* ═══════════════════ DASHBOARD ═══════════════════ */
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ── Redesigned Stats Hero ─────────────────── */}
            <div className="stats-hero">

              {/* Revenue hero card */}
              <div className="glass card ani-up" style={{
                display: 'flex', gap: 24, alignItems: 'center',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(252,196,28,.10) 0%,rgba(249,115,22,.05) 100%)'
                  : 'linear-gradient(135deg,rgba(252,196,28,.09) 0%,rgba(249,115,22,.05) 100%)',
                border: '1.5px solid rgba(252,196,28,.28)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle,rgba(252,196,28,.18),transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ width: 68, height: 68, borderRadius: 18, background: 'linear-gradient(135deg,#ffb340,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0, boxShadow: '0 8px 24px rgba(249,115,22,.4)' }}>💰</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Revenue</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#ffb340,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>₹{((d.monthlyRevenue ?? 0) / 1000).toFixed(0)}K</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>This month&apos;s collections</div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ffb340,#f97316)', width: `${Math.min(100, (d.monthlyRevenue ?? 0) / Math.max(1, (d.yearlyRevenue ?? d.monthlyRevenue ?? 1) / 12) * 100)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className="badge bd-accent" style={{ fontSize: '.7rem', fontWeight: 700 }}>₹{((d.yearlyRevenue ?? (d.monthlyRevenue ?? 0) * 12) / 1000).toFixed(0)}K annual</span>
                  </div>
                </div>
              </div>

              {/* Teachers + Students stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(0,212,170,.09) 0%,rgba(56,189,248,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(0,212,170,.10) 0%,rgba(56,189,248,.04) 100%)',
                  border: '1.5px solid rgba(0,212,170,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '80ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(0,212,170,.35)' }}>🏫</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Total Teachers</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{d.totalTeachers ?? 0}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>active on platform</div>
                  </div>
                </div>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(124,92,252,.09) 0%,rgba(167,139,250,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(124,92,252,.10) 0%,rgba(167,139,250,.04) 100%)',
                  border: '1.5px solid rgba(124,92,252,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '160ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(124,92,252,.35)' }}>🎓</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Total Students</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{d.totalStudents ?? 0}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>enrolled across batches</div>
                  </div>
                </div>
              </div>

              {/* Avg Attendance ring card */}
              <div className="glass card ani-up" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(255,107,157,.09) 0%,rgba(244,63,94,.04) 100%)'
                  : 'linear-gradient(135deg,rgba(255,107,157,.10) 0%,rgba(244,63,94,.04) 100%)',
                border: '1.5px solid rgba(255,107,157,.28)',
                position: 'relative', overflow: 'hidden', animationDelay: '240ms',
              }}>
                <div style={{ position: 'absolute', right: -12, bottom: -12, fontSize: '5.5rem', lineHeight: 1, opacity: .07, pointerEvents: 'none' }}>📊</div>
                <div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Avg Attendance</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{d.avgAttendance ?? 0}%</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>Platform average</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>0%</span><span>100%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ff6b9d,#f43f5e)', width: `${Math.min(100, d.avgAttendance ?? 0)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className={`badge ${(d.avgAttendance ?? 0) >= 80 ? 'bd-success' : 'bd-amber'}`} style={{ fontSize: '.7rem', fontWeight: 700 }}>
                      {(d.avgAttendance ?? 0) >= 80 ? '✓ Healthy' : '⚠ Below Target'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick glance: charts */}
            <div className="grid-2">
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(124,92,252,.10),rgba(167,139,250,.05))', borderBottom: '1px solid rgba(124,92,252,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(124,92,252,.35)' }}>📈</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Revenue Trend</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Last 6 months · ₹K</div>
                  </div>
                  <span className="badge bd-primary" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.revenueTrend.length} months</span>
                </div>
                <div style={{ padding: '16px 20px 20px', position: 'relative', height: 220 }}>
                  <Line key={`rev-${isDark}`} data={{
                    labels: d.revenueTrend.map(r => r.month),
                    datasets: [{ label: 'Revenue (₹K)', data: d.revenueTrend.map(r => (r.collected ?? r.amount ?? 0) / 1000), borderColor: '#7c5cfc', backgroundColor: 'rgba(124,92,252,.15)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#7c5cfc' }],
                  }} options={{ ...chartOpts, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(0,212,170,.10),rgba(56,189,248,.05))', borderBottom: '1px solid rgba(0,212,170,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(0,212,170,.35)' }}>📚</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Students by Subject</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Distribution across subjects</div>
                  </div>
                  {d.subjectDistribution.length > 0 && <span className="badge bd-accent" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.subjectDistribution.length} subjects</span>}
                </div>
                <div style={{ padding: '16px 20px 20px', position: 'relative', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {d.subjectDistribution.length === 0
                    ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', opacity: .4 }}>📚</div>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>No subject data yet</div>
                      </div>
                    : <Doughnut key={`subj-${isDark}`} data={{ labels: d.subjectDistribution.map(s => s.subject), datasets: [{ data: d.subjectDistribution.map(s => s.count || s.studentCount || 1), backgroundColor: ['rgba(124,92,252,.8)','rgba(0,212,170,.8)','rgba(255,107,157,.8)','rgba(255,179,64,.8)','rgba(56,189,248,.8)','rgba(99,102,241,.8)'], borderWidth: 0 }] }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: tickColor, font: { family: 'Poppins', size: 11 }, padding: 12 } } } }} />
                  }
                </div>
              </div>
            </div>

            {/* Top teachers + recent activity */}
            <div className="grid-2">
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(252,196,28,.10),rgba(249,115,22,.05))', borderBottom: '1px solid rgba(252,196,28,.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#ffb340,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(249,115,22,.35)' }}>⭐</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Top Rated Teachers</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Sorted by student rating</div>
                  </div>
                  <span className="badge bd-amber" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>Top {Math.min(5, d.teachers.length)}</span>
                </div>
                <div className="scroll-area" style={{ padding: '8px 20px 16px' }}>
                  {d.teachers.sort((a, b) => b.rating - a.rating).slice(0, 5).map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 14, borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none', marginBottom: 14 }}>
                      <div className="avatar" style={{ background: t.avatarGrad, color: '#fff', flexShrink: 0 }}>{t.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{t.name}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>{t.subject} · {t.students} students</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--color-amber)' }}>⭐ {t.rating}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{t.reviews} reviews</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(124,92,252,.10),rgba(167,139,250,.05))', borderBottom: '1px solid rgba(124,92,252,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(124,92,252,.35)' }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Recent Platform Activity</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Latest actions across the platform</div>
                  </div>
                  {d.recentActivity.length > 0 && <span className="badge bd-primary" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.recentActivity.length} events</span>}
                </div>
                <div className="scroll-area" style={{ padding: '8px 20px 16px' }}>
                  {d.recentActivity.length === 0
                    ? <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '32px 0' }}>No recent activity</div>
                    : d.recentActivity.map((act, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 14, borderBottom: i < d.recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none', marginBottom: 14 }}>
                      <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{act.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{act.action}</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', margin: '2px 0' }}>{act.detail}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* Platform health */}
            <div className="stats-grid">
              <StatCard icon="📊" label="Avg. Attendance" value={`${d.avgAttendance}%`} sub="Platform average" grad="var(--grad-accent)" delay={0} />
              <StatCard icon="📝" label="Assignments" value={d.totalAssignments} sub="Created this month" grad="var(--grad-primary)" delay={80} />
              <StatCard icon="⭐" label="Avg. Rating" value={d.avgPlatformRating} sub="Across all teachers" grad="var(--grad-amber)" delay={160} />
              <StatCard icon="🔔" label="Complaints" value={d.openComplaints} sub="Pending resolution" grad="var(--grad-rose)" delay={240} />
            </div>
          </div>
        );

      /* ═══════════════════ TEACHERS ═══════════════════ */
      case 'teachers': {
        const subjects = ['All', ...new Set(d.teachers.map(t => t.subject))];
        const filtered = d.teachers.filter(t => {
          const matchesSearch = t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.subject.toLowerCase().includes(teacherSearch.toLowerCase());
          const matchesSubject = teacherSubjectFilter === 'All' || t.subject === teacherSubjectFilter;
          return matchesSearch && matchesSubject;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Filters */}
            <div className="glass card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text" className="form-input" placeholder="🔍 Search teachers…"
                  value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <select className="form-input" value={teacherSubjectFilter} onChange={e => setTeacherSubjectFilter(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="badge bd-primary" style={{ fontSize: '.75rem' }}>{filtered.length} teachers</span>
                <button className="btn btn-accent btn-sm" onClick={() => setSection('add-teacher')} style={{ marginLeft: 'auto' }}>
                  ➕ Register Teacher
                </button>
              </div>
            </div>

            {/* Teacher Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
              {filtered.length === 0 && (
                <div className="glass card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👨‍🏫</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>No teachers found</div>
                  <div style={{ fontSize: '.85rem', marginBottom: 16 }}>{teacherSearch || teacherSubjectFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Register your first teacher to get started.'}</div>
                  {!teacherSearch && teacherSubjectFilter === 'All' && (
                    <button className="btn btn-accent btn-sm" onClick={() => setSection('add-teacher')}>➕ Register Teacher</button>
                  )}
                </div>
              )}
              {filtered.map(t => (
                <div key={t.id} className="glass card" style={{ cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => setSelectedTeacher(t)}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div className="avatar" style={{ background: t.avatarGrad, color: '#fff', width: 52, height: 52, fontSize: '1.1rem' }}>{t.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{t.name}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{t.subject} · {t.experience}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span className={`badge ${t.badgeCls}`} style={{ fontSize: '.65rem' }}>{t.badge}</span>
                        <span className="badge bd-primary" style={{ fontSize: '.65rem' }}>{t.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-2)' }}>{t.students}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>Students</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-amber)' }}>⭐ {t.rating}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>Rating</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)' }}>{t.reviews}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>Reviews</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.speciality.split(' · ').slice(0, 3).map((s, i) => (
                      <span key={i} style={{ fontSize: '.68rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--text-secondary)' }}>{s}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setSelectedTeacher(t); }}>
                      View Details
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', padding: '0 12px' }}
                      onClick={e => { e.stopPropagation(); setSelectedTeacher(t); setConfirmDeleteTeacher(t.id); }}
                      title="Remove teacher"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Teacher Detail Modal */}
            {selectedTeacher && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setSelectedTeacher(null); setConfirmDeleteTeacher(null); setShowEditTeacher(false); }}>
                <div className="glass-flat" style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-xl)', padding: '32px 28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setSelectedTeacher(null); setConfirmDeleteTeacher(null); setShowEditTeacher(false); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>

                  {/* Header */}
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 24 }}>
                    <div className="avatar" style={{ background: selectedTeacher.avatarGrad, color: '#fff', width: 72, height: 72, fontSize: '1.5rem' }}>{selectedTeacher.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{selectedTeacher.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>{selectedTeacher.subject} · {selectedTeacher.experience}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <span className={`badge ${selectedTeacher.badgeCls}`}>{selectedTeacher.badge}</span>
                        <span className="badge bd-primary">{selectedTeacher.status}</span>
                        <span className="badge bd-accent">{selectedTeacher.employeeId}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => {
                        setShowEditTeacher(e => !e);
                        setEditTeacherForm({
                          name: selectedTeacher.name,
                          email: selectedTeacher.email,
                          phone: selectedTeacher.phone || '',
                          subjects: selectedTeacher.subjects?.join(', ') || selectedTeacher.subject || '',
                          experience: String(selectedTeacher.experience || '').replace(' years', ''),
                          bio: selectedTeacher.about || '',
                          salary: String(selectedTeacher.salary || ''),
                        });
                      }}
                    >
                      ✏️ Edit Details
                    </button>
                  </div>

                  {/* Inline Edit Form */}
                  {showEditTeacher && (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 18px', marginBottom: 24, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 14, color: 'var(--color-primary-2)' }}>✏️ Edit Teacher Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div className="form-group">
                          <label className="form-label">Name *</label>
                          <input className="form-input" value={editTeacherForm.name} onChange={e => setEditTeacherForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email *</label>
                          <input className="form-input" type="email" value={editTeacherForm.email} onChange={e => setEditTeacherForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone</label>
                          <input className="form-input" value={editTeacherForm.phone} onChange={e => setEditTeacherForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Experience (years)</label>
                          <input className="form-input" type="number" min="0" value={editTeacherForm.experience} onChange={e => setEditTeacherForm(p => ({ ...p, experience: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Salary (₹/mo)</label>
                          <input className="form-input" type="number" min="0" value={editTeacherForm.salary} onChange={e => setEditTeacherForm(p => ({ ...p, salary: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Subjects (comma-separated)</label>
                          <input className="form-input" placeholder="e.g. Mathematics, Physics" value={editTeacherForm.subjects} onChange={e => setEditTeacherForm(p => ({ ...p, subjects: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Bio / About</label>
                          <textarea className="form-input" rows={2} value={editTeacherForm.bio} onChange={e => setEditTeacherForm(p => ({ ...p, bio: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button className="btn btn-primary btn-sm" disabled={editTeacherSaving} onClick={handleUpdateTeacher}>
                          {editTeacherSaving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowEditTeacher(false)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Students', value: selectedTeacher.students, color: 'var(--color-primary-2)' },
                      { label: 'Rating', value: `⭐ ${selectedTeacher.rating}`, color: 'var(--color-amber)' },
                      { label: 'Reviews', value: selectedTeacher.reviews, color: 'var(--color-accent)' },
                      { label: 'Classes/Week', value: selectedTeacher.classesPerWeek, color: 'var(--color-rose)' },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '14px 8px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* About */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>About</div>
                    <div style={{ fontSize: '.875rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{selectedTeacher.about}</div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Contact Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Email</div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{selectedTeacher.email}</div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Phone</div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{selectedTeacher.phone}</div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Joining Date</div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{selectedTeacher.joiningDate}</div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Salary</div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>₹{selectedTeacher.salary?.toLocaleString()}/mo</div>
                      </div>
                    </div>
                  </div>

                  {/* Grades & Languages */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Grades</div>
                      <div style={{ fontSize: '.875rem' }}>{selectedTeacher.grades}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Languages</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedTeacher.languages?.map((l, i) => (
                          <span key={i} className="badge bd-primary" style={{ fontSize: '.7rem' }}>{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Topics */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Topics Covered</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedTeacher.topics?.map((t, i) => (
                        <span key={i} style={{ fontSize: '.75rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--text-secondary)', border: '1px solid var(--color-border)' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Availability</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedTeacher.availability?.map((day, i) => (
                        <span key={i} className="badge bd-accent" style={{ fontSize: '.72rem' }}>{day}</span>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(239,68,68,.2)' }}>
                    {confirmDeleteTeacher === selectedTeacher.id ? (
                      <div style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#ef4444', marginBottom: 6 }}>⚠️ Confirm Removal</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                          This will permanently delete <strong>{selectedTeacher.name}</strong>, cancel all their active enrollments, and remove their login account. This cannot be undone.
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#ef4444', color: '#fff', border: 'none', flex: 1 }}
                            disabled={deletingTeacher}
                            onClick={async () => {
                              setDeletingTeacher(true);
                              try {
                                await apiAdminDeleteTeacher(selectedTeacher.id);
                                toast.success(`${selectedTeacher.name} has been removed.`);
                                setSelectedTeacher(null);
                                setConfirmDeleteTeacher(null);
                                loadData();
                              } catch (err) {
                                toast.error(err.message || 'Failed to remove teacher');
                              } finally {
                                setDeletingTeacher(false);
                              }
                            }}
                          >
                            {deletingTeacher ? 'Removing…' : 'Yes, Remove Teacher'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteTeacher(null)} disabled={deletingTeacher}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', width: '100%' }}
                        onClick={() => setConfirmDeleteTeacher(selectedTeacher.id)}
                      >
                        🗑️ Remove Teacher
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      /* ═══════════════════ STUDENTS ═══════════════════ */
      case 'students': {
        const grades = ['All', ...new Set(d.allStudents.map(s => s.grade))];
        const filteredStudents = d.allStudents.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
          const matchesGrade = studentGradeFilter === 'All' || s.grade === studentGradeFilter;
          return matchesSearch && matchesGrade;
        });

        // ── Enrollment list filtering ──
        const statusColors = {
          requested: 'bd-amber', approved: 'bd-primary', active: 'bd-success',
          cancelled: 'bd-rose', expired: 'bd-muted', pending: 'bd-muted', overdue: 'bd-rose',
        };
        const filteredEnrollments = enrollments.filter(e => {
          const matchStatus = enrollmentStatusFilter === 'all' || e.status === enrollmentStatusFilter;
          const q = enrollmentSearch.toLowerCase();
          const matchSearch = !q || e.studentName.toLowerCase().includes(q) || e.tutorName.toLowerCase().includes(q) || e.studentEmail.toLowerCase().includes(q);
          return matchStatus && matchSearch;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Stats */}
            <div className="stats-grid">
              <StatCard icon="🎓" label="Total Students" value={d.totalStudents} sub="Registered students" grad="var(--grad-primary)" delay={0} />
              <StatCard icon="📊" label="Avg Attendance" value={`${d.avgAttendance}%`} sub="Platform-wide" grad="var(--grad-accent)" delay={80} />
              <StatCard icon="📋" label="Pending Requests" value={enrollments.filter(e => e.status === 'requested').length} sub="Awaiting review" grad="var(--grad-amber)" delay={160} />
            </div>

            {/* Sub-tab switcher */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['list', '👥 Students'], ['enrollments', '📋 Enrollments']].map(([tab, label]) => (
                  <button key={tab} onClick={() => {
                    setStudentsTab(tab);
                    if (tab === 'enrollments' && enrollments.length === 0) loadEnrollments();
                  }}
                    className={`btn${studentsTab === tab ? ' btn-primary' : ' btn-ghost'}`}
                    style={{ fontSize: '.83rem', padding: '7px 16px' }}>
                    {label}
                  </button>
                ))}
              </div>
              <button className="btn btn-accent btn-sm" onClick={() => {
                setAssignForm({ studentEmail: '', tutorId: '', price: '', grade: '', board: 'CBSE', parentName: '', parentPhone: '', notes: '' });
                setShowAssignModal(true);
              }}>
                ➕ Assign Tutor
              </button>
            </div>

            {/* ════ STUDENTS LIST TAB ════ */}
            {studentsTab === 'list' && (
              <>
                <div className="glass card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" className="form-input" placeholder="🔍 Search students…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                    <select className="form-input" value={studentGradeFilter} onChange={e => setStudentGradeFilter(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="badge bd-primary" style={{ fontSize: '.75rem' }}>{filteredStudents.length} students</span>
                  </div>
                </div>

                <div className="glass card" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        {['Student', 'Grade', 'Attendance', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎓</div>
                          <div style={{ fontWeight: 700 }}>No students found</div>
                        </td></tr>
                      )}
                      {filteredStudents.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'var(--transition)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <div className="avatar" style={{ background: s.avatarGrad, color: '#fff', width: 36, height: 36, fontSize: '.8rem' }}>{s.avatar}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{s.rollNo}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>{s.grade}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, maxWidth: 80, height: 6, borderRadius: 3, background: 'var(--color-surface-2)' }}>
                                <div style={{ width: `${s.attendance}%`, height: '100%', borderRadius: 3, background: s.attendance >= 85 ? 'var(--color-accent)' : s.attendance >= 70 ? 'var(--color-amber)' : 'var(--color-rose)' }} />
                              </div>
                              <span style={{ fontSize: '.78rem', fontWeight: 600 }}>{s.attendance}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className={`badge ${statusBadge(s.performanceStatus).cls}`} style={{ fontSize: '.7rem' }}>{statusBadge(s.performanceStatus).label}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => {
                                setSelectedStudent(s);
                                setStuPayTab('profile');
                                setStuDetail(null);
                                handleStuSelect({ _id: s.id, name: s.name });
                              }}>View</button>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={() => {
                                setAssignForm({ studentEmail: s.email || '', tutorId: '', price: '', grade: s.grade || '', board: 'CBSE', parentName: s.parentName || '', parentPhone: s.parentPhone || '', notes: '' });
                                setShowAssignModal(true);
                              }}>Assign Tutor</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ════ ENROLLMENTS TAB ════ */}
            {studentsTab === 'enrollments' && (
              <>
                {/* Filters row */}
                <div className="glass card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input className="form-input" placeholder="🔍 Search student or tutor…" value={enrollmentSearch}
                      onChange={e => setEnrollmentSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                    <select className="form-input" value={enrollmentStatusFilter} onChange={e => setEnrollmentStatusFilter(e.target.value)} style={{ minWidth: 160 }}>
                      {['all','requested','approved','active','cancelled','overdue','pending','expired'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={loadEnrollments} disabled={enrollmentsLoading}>🔄 Refresh</button>
                    <span className="badge bd-primary" style={{ fontSize: '.75rem' }}>{filteredEnrollments.length} records</span>
                  </div>
                </div>

                {enrollmentsLoading ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading enrollments…</div>
                ) : (
                  <div className="glass card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          {['Student', 'Mobile', 'Tutor', 'Status', 'Fee/mo', 'Grade', 'Date', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontWeight: 700, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnrollments.length === 0 ? (
                          <tr><td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>No enrollment records match your filter.</td></tr>
                        ) : filteredEnrollments.map(e => (
                          <tr key={e._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'var(--transition)' }}
                            onMouseOver={ev => ev.currentTarget.style.background = 'var(--color-surface)'}
                            onMouseOut={ev => ev.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{e.studentName}</div>
                              <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{e.studentEmail}</div>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{e.studentMobile}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{e.tutorName}</div>
                              <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{e.tutorEmail}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className={`badge ${statusColors[e.status] || 'bd-muted'}`} style={{ fontSize: '.65rem' }}>{e.status}</span>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-accent)' }}>
                              {e.price ? `₹${e.price.toLocaleString('en-IN')}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '.78rem' }}>{e.grade}</td>
                            <td style={{ padding: '10px 12px', fontSize: '.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <button className="btn btn-primary btn-sm" style={{ fontSize: '.72rem', whiteSpace: 'nowrap' }}
                                onClick={() => {
                                  setSelectedEnrollment(e);
                                  setEnrollEditForm({ status: e.status, price: e.price || '', notes: e.notes || '' });
                                }}>
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ════ STUDENT DETAIL MODAL ════ */}
            {selectedStudent && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                onClick={() => { setSelectedStudent(null); clearStuLookup(); }}>
                <div className="glass-flat" style={{ maxWidth: 760, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-xl)', padding: '28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setSelectedStudent(null); clearStuLookup(); }}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                    <div className="avatar" style={{ background: selectedStudent.avatarGrad, color: '#fff', width: 60, height: 60, fontSize: '1.25rem', flexShrink: 0 }}>{selectedStudent.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{selectedStudent.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '.82rem', marginTop: 2 }}>{selectedStudent.grade} · {selectedStudent.rollNo}</div>
                      <span className={`badge ${statusBadge(selectedStudent.performanceStatus).cls}`} style={{ marginTop: 4, fontSize: '.7rem' }}>{statusBadge(selectedStudent.performanceStatus).label}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                    {[['profile', '👤 Profile'], ['payments', '🧾 Payments'], ['enrollments', '📚 Enrolments']].map(([tab, label]) => (
                      <button key={tab} onClick={() => setStuPayTab(tab)}
                        className={`btn${stuPayTab === tab ? ' btn-primary' : ''}`}
                        style={{ fontSize: '.8rem', padding: '6px 14px', opacity: stuPayTab === tab ? 1 : 0.65 }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {stuPayTab === 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div style={{ textAlign: 'center', padding: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-accent)' }}>{selectedStudent.attendance}%</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Attendance</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{selectedStudent.gpa}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>GPA</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-amber)' }}>{selectedStudent.pendingAssignments}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Pending HW</div>
                        </div>
                      </div>
                      {selectedStudent.teachers.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Enrolled Teachers</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {selectedStudent.teachers.map((t, i) => <span key={i} className="badge bd-accent" style={{ fontSize: '.72rem' }}>{t}</span>)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Parent Contact</div>
                        <div style={{ fontSize: '.85rem' }}>
                          {selectedStudent.parentName && selectedStudent.parentName !== '—'
                            ? <><strong>{selectedStudent.parentName}</strong>{selectedStudent.parentPhone && selectedStudent.parentPhone !== '—' ? ` · ${selectedStudent.parentPhone}` : ''}</>
                            : <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                        </div>
                      </div>
                      <div style={{ paddingTop: 8 }}>
                        <button className="btn btn-accent btn-sm" onClick={() => {
                          setSelectedStudent(null);
                          setAssignForm({ studentEmail: selectedStudent.email || '', tutorId: '', price: '', grade: selectedStudent.grade || '', board: 'CBSE', parentName: selectedStudent.parentName || '', parentPhone: selectedStudent.parentPhone || '', notes: '' });
                          setShowAssignModal(true);
                        }}>➕ Assign a Tutor to this Student</button>
                      </div>
                    </div>
                  )}

                  {stuPayTab === 'payments' && (
                    stuDetailLoading ? (
                      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading payment history…</div>
                    ) : (() => {
                      const payments = stuDetail?.payments ?? [];
                      const summary = stuDetail?.summary ?? {};
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[
                              { label: 'Total Paid', val: `₹${(summary.totalPaid || 0).toLocaleString('en-IN')}`, color: 'var(--color-accent)' },
                              { label: 'Pending', val: `₹${(summary.totalPending || 0).toLocaleString('en-IN')}`, color: 'var(--color-amber)' },
                              { label: 'Payments', val: summary.totalPayments || 0, color: 'var(--color-primary)' },
                              { label: 'Active Plans', val: summary.activeEnrollments || 0, color: 'var(--color-rose)' },
                            ].map(s => (
                              <div key={s.label} style={{ background: 'var(--color-glass)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: s.color }}>{s.val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                  {['#', 'Amount', 'Type', 'Month', 'Status', 'Paid On', 'Due Date', 'Invoice', 'Txn ID'].map(h => (
                                    <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {payments.length === 0 ? (
                                  <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No payment records found.</td></tr>
                                ) : payments.map((p, i) => (
                                  <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '9px 10px', color: 'var(--text-muted)', fontSize: '.75rem' }}>{i + 1}</td>
                                    <td style={{ padding: '9px 10px', fontWeight: 700, color: 'var(--color-accent)' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '9px 10px' }}><span className={`badge ${p.type === 'monthly' ? 'bd-primary' : 'bd-muted'}`} style={{ fontSize: '.62rem' }}>{p.type}</span></td>
                                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '.76rem' }}>{p.billingMonth || '—'}</td>
                                    <td style={{ padding: '9px 10px' }}><span className={`badge ${p.status === 'paid' ? 'bd-success' : p.status === 'failed' ? 'bd-rose' : 'bd-amber'}`} style={{ fontSize: '.62rem' }}>{p.status}</span></td>
                                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                                      {editingDueDate === p._id ? (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                          <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '3px 6px', width: 130 }}
                                            defaultValue={p.dueDate ? new Date(p.dueDate).toISOString().slice(0,10) : ''}
                                            id={`dd-${p._id}`} />
                                          <button className="btn btn-accent btn-sm" style={{ fontSize: '.68rem', padding: '2px 8px' }}
                                            disabled={savingDate}
                                            onClick={async () => {
                                              const val = document.getElementById(`dd-${p._id}`)?.value;
                                              setSavingDate(true);
                                              try {
                                                await apiAdminUpdatePaymentDueDate(p._id, val || null);
                                                setStuDetail(prev => ({ ...prev, payments: prev.payments.map(x => x._id === p._id ? { ...x, dueDate: val ? new Date(val).toISOString() : null } : x) }));
                                                toast.success('Due date updated');
                                                setEditingDueDate(null);
                                              } catch { toast.error('Failed to update'); }
                                              finally { setSavingDate(false); }
                                            }}>{savingDate ? '…' : '✓'}</button>
                                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '.68rem', padding: '2px 8px' }} onClick={() => setEditingDueDate(null)}>✕</button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                          <span>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                          {p.status !== 'paid' && <button title="Edit due date" onClick={() => setEditingDueDate(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: 'var(--color-primary)', lineHeight: 1 }}>✏️</button>}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '.7rem' }}>{p.invoiceNumber || '—'}</td>
                                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '.7rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.razorpayPaymentId}>{p.razorpayPaymentId !== '—' ? p.razorpayPaymentId : p.razorpayOrderId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {stuPayTab === 'enrollments' && (
                    stuDetailLoading ? (
                      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading enrolments…</div>
                    ) : (() => {
                      const enrs = stuDetail?.enrollments ?? [];
                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                {['Teacher', 'Price/mo', 'Status', 'Grade', 'Started', 'Next Billing', 'Actions'].map(h => (
                                  <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {enrs.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No enrolment records found.</td></tr>
                              ) : enrs.map(e => (
                                <tr key={e._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td style={{ padding: '9px 10px', fontWeight: 600 }}>{e.tutorName}</td>
                                  <td style={{ padding: '9px 10px', fontWeight: 700, color: 'var(--color-accent)' }}>₹{(e.price || 0).toLocaleString('en-IN')}</td>
                                  <td style={{ padding: '9px 10px' }}><span className={`badge ${statusColors[e.status] || 'bd-muted'}`} style={{ fontSize: '.62rem' }}>{e.status}</span></td>
                                  <td style={{ padding: '9px 10px' }}>{e.grade}</td>
                                  <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>{e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                  <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                                    {editingBilling === e._id ? (
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '3px 6px', width: 130 }}
                                          defaultValue={e.nextBillingDate ? new Date(e.nextBillingDate).toISOString().slice(0,10) : ''}
                                          id={`nb-${e._id}`} />
                                        <button className="btn btn-accent btn-sm" style={{ fontSize: '.68rem', padding: '2px 8px' }}
                                          disabled={savingDate}
                                          onClick={async () => {
                                            const val = document.getElementById(`nb-${e._id}`)?.value;
                                            setSavingDate(true);
                                            try {
                                              await apiAdminUpdateEnrollmentBilling(e._id, val || null);
                                              setStuDetail(prev => ({ ...prev, enrollments: prev.enrollments.map(x => x._id === e._id ? { ...x, nextBillingDate: val ? new Date(val).toISOString() : null } : x) }));
                                              toast.success('Next billing date updated');
                                              setEditingBilling(null);
                                            } catch { toast.error('Failed to update'); }
                                            finally { setSavingDate(false); }
                                          }}>{savingDate ? '…' : '✓'}</button>
                                        <button className="btn btn-ghost btn-sm" style={{ fontSize: '.68rem', padding: '2px 8px' }} onClick={() => setEditingBilling(null)}>✕</button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ color: e.nextBillingDate ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '.78rem' }}>
                                          {e.nextBillingDate ? new Date(e.nextBillingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                        {e.status === 'active' && <button title="Edit next billing date" onClick={() => setEditingBilling(e._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: 'var(--color-primary)', lineHeight: 1 }}>✏️</button>}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '9px 10px' }}>
                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '.7rem' }}
                                      onClick={() => {
                                        setSelectedEnrollment({ ...e, studentName: selectedStudent?.name });
                                        setEnrollEditForm({ status: e.status, price: e.price || '', notes: e.notes || '' });
                                      }}>Manage</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {/* ════ ENROLLMENT MANAGE MODAL ════ */}
            {selectedEnrollment && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                onClick={() => setSelectedEnrollment(null)}>
                <div className="glass-flat" style={{ maxWidth: 500, width: '100%', borderRadius: 'var(--radius-xl)', padding: '28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedEnrollment(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>

                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>Manage Enrollment</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                    <strong>{selectedEnrollment.studentName}</strong> → <strong>{selectedEnrollment.tutorName}</strong>
                  </div>

                  {/* Student contact info */}
                  <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: '.82rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Email: </span>{selectedEnrollment.studentEmail}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Mobile: </span><strong>{selectedEnrollment.studentMobile || '—'}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Parent: </span>{selectedEnrollment.parentName}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Parent Ph: </span>{selectedEnrollment.parentPhone}</div>
                      {selectedEnrollment.grade && <div><span style={{ color: 'var(--text-muted)' }}>Grade: </span>{selectedEnrollment.grade}</div>}
                      {selectedEnrollment.board && <div><span style={{ color: 'var(--text-muted)' }}>Board: </span>{selectedEnrollment.board}</div>}
                    </div>
                    {selectedEnrollment.notes && <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Notes: {selectedEnrollment.notes}</div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Status</label>
                      <select className="form-input" value={enrollEditForm.status} onChange={e => setEnrollEditForm(p => ({ ...p, status: e.target.value }))}>
                        {['requested','approved','active','cancelled','expired','pending','overdue'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Monthly Fee (₹) — set after negotiation</label>
                      <input className="form-input" type="number" placeholder="e.g. 3000" value={enrollEditForm.price}
                        onChange={e => setEnrollEditForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Admin Notes</label>
                      <textarea className="form-input" rows={2} value={enrollEditForm.notes}
                        onChange={e => setEnrollEditForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Internal notes…" style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: enrollEditSaving ? .6 : 1 }}
                        disabled={enrollEditSaving}
                        onClick={async () => {
                          setEnrollEditSaving(true);
                          try {
                            await apiAdminUpdateEnrollment(selectedEnrollment._id, {
                              status: enrollEditForm.status,
                              price: enrollEditForm.price ? Number(enrollEditForm.price) : undefined,
                              notes: enrollEditForm.notes,
                            });
                            // Update in local list
                            setEnrollments(prev => prev.map(e => e._id === selectedEnrollment._id
                              ? { ...e, status: enrollEditForm.status, price: enrollEditForm.price ? Number(enrollEditForm.price) : e.price, notes: enrollEditForm.notes }
                              : e));
                            toast.success('✅ Enrollment updated');
                            setSelectedEnrollment(null);
                          } catch (err) {
                            toast.error(err?.message || 'Failed to update');
                          } finally {
                            setEnrollEditSaving(false);
                          }
                        }}>
                        {enrollEditSaving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setSelectedEnrollment(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ ASSIGN TUTOR MODAL ════ */}
            {showAssignModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                onClick={() => { setShowAssignModal(false); setAssignStudentQuery(''); setAssignStudentDropOpen(false); }}>
                <div className="glass-flat" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-xl)', padding: '28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowAssignModal(false); setAssignStudentQuery(''); setAssignStudentDropOpen(false); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>

                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>➕ Assign Tutor to Student</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Admin can assign any tutor to any student. Multiple tutors can be assigned to the same student.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* ── Student Search Dropdown ── */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Student <span style={{ color: 'red' }}>*</span></label>
                      {assignForm.studentEmail ? (
                        /* Selected state */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{assignStudentQuery}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{assignForm.studentEmail}</div>
                          </div>
                          <button onClick={() => { setAssignForm(p => ({ ...p, studentEmail: '' })); setAssignStudentQuery(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
                        </div>
                      ) : (
                        /* Search input */
                        <>
                          <input className="form-input" placeholder="Search by name or email…"
                            value={assignStudentQuery}
                            onChange={e => { setAssignStudentQuery(e.target.value); setAssignStudentDropOpen(true); }}
                            onFocus={() => setAssignStudentDropOpen(true)}
                            onBlur={() => setTimeout(() => setAssignStudentDropOpen(false), 150)}
                            autoComplete="off"
                          />
                          {assignStudentDropOpen && assignStudentQuery.length > 0 && (() => {
                            const q = assignStudentQuery.toLowerCase();
                            const matches = (d.allStudents || []).filter(s =>
                              s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
                            ).slice(0, 8);
                            return (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxHeight: 240, overflowY: 'auto', marginTop: 2 }}>
                                {matches.length === 0 ? (
                                  <div style={{ padding: '12px 14px', fontSize: '.82rem', color: 'var(--text-muted)' }}>No students found</div>
                                ) : matches.map(s => (
                                  <div key={s.id}
                                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-glass)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                      setAssignForm(p => ({
                                        ...p,
                                        studentEmail: s.email,
                                        parentName: p.parentName || s.parentName !== '—' ? (p.parentName || s.parentName) : '',
                                        parentPhone: p.parentPhone || s.parentPhone !== '—' ? (p.parentPhone || s.parentPhone) : '',
                                        grade: p.grade || s.grade !== '—' ? (p.grade || s.grade) : '',
                                      }));
                                      setAssignStudentQuery(s.name);
                                      setAssignStudentDropOpen(false);
                                    }}>
                                    <div className="avatar" style={{ background: s.avatarGrad, color: '#fff', width: 30, height: 30, fontSize: '.7rem', flexShrink: 0 }}>{s.avatar}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{s.name}</div>
                                      <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email || 'No email'} · Grade: {s.grade}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Select Tutor <span style={{ color: 'red' }}>*</span></label>
                      <select className="form-input" value={assignForm.tutorId} onChange={e => setAssignForm(p => ({ ...p, tutorId: e.target.value }))}>
                        <option value="">— Choose a tutor —</option>
                        {(d.teachers || []).map(t => (
                          <option key={t.id} value={t.id}>{t.name} — {t.subjects?.join(', ') || t.subject || '—'}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Grade / Class <span style={{ color: 'red' }}>*</span></label>
                        <input className="form-input" placeholder="e.g. Class 9" value={assignForm.grade}
                          onChange={e => setAssignForm(p => ({ ...p, grade: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Board</label>
                        <select className="form-input" value={assignForm.board} onChange={e => setAssignForm(p => ({ ...p, board: e.target.value }))}>
                          {['CBSE','ICSE','State Board','IB','Other'].map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Monthly Fee (₹)</label>
                        <input className="form-input" type="number" placeholder="e.g. 3000" value={assignForm.price}
                          onChange={e => setAssignForm(p => ({ ...p, price: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Parent Name</label>
                        <input className="form-input" placeholder="Full name" value={assignForm.parentName}
                          onChange={e => setAssignForm(p => ({ ...p, parentName: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Parent Phone</label>
                        <input className="form-input" placeholder="+91 XXXXX XXXXX" value={assignForm.parentPhone}
                          onChange={e => setAssignForm(p => ({ ...p, parentPhone: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>Notes (optional)</label>
                        <textarea className="form-input" rows={2} placeholder="Any internal notes…" value={assignForm.notes}
                          onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(124,92,252,.06)', border: '1px solid rgba(124,92,252,.18)', borderRadius: 10, padding: '10px 14px', fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                      💡 This will create an <strong>approved</strong> enrollment. The student will be able to proceed to payment. You can assign multiple tutors to the same student.
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: assignSaving ? .6 : 1 }}
                        disabled={assignSaving}
                        onClick={async () => {
                          if (!assignForm.studentEmail.trim()) { toast.error('Please select a student'); return; }
                          if (!assignForm.tutorId) { toast.error('Please select a tutor'); return; }
                          if (!assignForm.grade.trim()) { toast.error('Grade is required'); return; }
                          setAssignSaving(true);
                          try {
                            await apiAdminAssignTutor({
                              studentEmail: assignForm.studentEmail.trim(),
                              tutorId: assignForm.tutorId,
                              price: assignForm.price ? Number(assignForm.price) : 0,
                              grade: assignForm.grade,
                              board: assignForm.board,
                              parentName: assignForm.parentName,
                              parentPhone: assignForm.parentPhone,
                              notes: assignForm.notes,
                              subjectsEnrolled: [],
                              preferredDays: [],
                              school: '',
                            });
                            toast.success('✅ Tutor assigned successfully!');
                            setShowAssignModal(false);
                            setAssignStudentQuery('');
                            loadEnrollments();
                          } catch (err) {
                            toast.error(err?.message || 'Assignment failed');
                          } finally {
                            setAssignSaving(false);
                          }
                        }}>
                        {assignSaving ? 'Assigning…' : '➕ Assign Tutor'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setShowAssignModal(false); setAssignStudentQuery(''); setAssignStudentDropOpen(false); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      /* ═══════════════════ REVENUE ═══════════════════ */
      case 'revenue': {
        const fmtK = v => {
          if (!v || v === 0) return '₹0';
          if (v >= 1000) {
            const k = v / 1000;
            return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
          }
          return `₹${v.toLocaleString('en-IN')}`;
        };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -16 }}>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem' }} onClick={loadData}>🔄 Refresh</button>
            </div>
            <div className="stats-grid">
              {[{ icon: '💰', label: 'Total Revenue', val: fmtK(d.totalRevenue), sub: 'All-time earnings', color: 'var(--color-primary)' },
                { icon: '📈', label: 'This Month', val: fmtK(d.monthlyRevenue), sub: 'Current month', color: 'var(--color-accent)' },
                { icon: '⏳', label: 'Pending Fees', val: fmtK(d.pendingFees), sub: 'Yet to be collected', color: 'var(--color-amber)' },
                { icon: '🎯', label: 'Collection Rate', val: `${d.collectionRate ?? 0}%`, sub: 'Payment success', color: 'var(--color-rose)' },
              ].map(({ icon, label, val, sub, color }) => (
                <div key={label} className="glass card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{val}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>{sub}</div>
                  <div style={{ position: 'absolute', top: 14, right: 14, fontSize: '1.6rem', opacity: .25 }}>{icon}</div>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="glass card">
              <div className="section-title">💰 Monthly Revenue Breakdown</div>
              <div style={{ position: 'relative', height: 280 }}>
                <Bar key={`revenue-bar-${isDark}`} data={{
                  labels: d.revenueTrend.map(r => r.month),
                  datasets: [{
                    label: 'Collected (₹K)', data: d.revenueTrend.map(r => r.collected / 1000),
                    backgroundColor: 'rgba(0,212,170,.7)', borderRadius: 8, borderSkipped: false,
                  }, {
                    label: 'Pending (₹K)', data: d.revenueTrend.map(r => r.pending / 1000),
                    backgroundColor: 'rgba(255,179,64,.7)', borderRadius: 8, borderSkipped: false,
                  }],
                }} options={{ ...chartOpts, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Recent payments table */}
            <div className="glass card">
              <div className="section-title">📋 Recent Payments</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      {['Student', 'Amount', 'Date', 'Method', 'Status', 'Txn ID'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : d.recentPayments.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.student}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-accent)' }}>₹{(p.amount ?? 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px' }}>{p.date}</td>
                        <td style={{ padding: '12px 14px' }}>{p.method}</td>
                        <td style={{ padding: '12px 14px' }}><span className={`badge ${p.status === 'completed' ? 'bd-success' : p.status === 'pending' ? 'bd-amber' : 'bd-muted'}`} style={{ fontSize: '.7rem' }}>{p.status}</span></td>
                        <td style={{ padding: '12px 14px', fontSize: '.78rem', fontFamily: 'monospace' }}>{p.txnId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student details — see the Students section */}
          </div>
        );
      }

      /* ═══════════════════ ANNOUNCEMENTS ═══════════════════ */
      case 'announcements': {
        // Load announcements on first visit
        if (announcementsList === null) {
          apiAdminGetAnnouncements().then(list => setAnnouncementsList(list));
        }
        const displayList = announcementsList ?? d.announcements ?? [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* New Announcement Form */}
            <div className="glass card">
              <div className="section-title">📢 New Announcement</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" placeholder="Announcement title…" value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={3} placeholder="Write your announcement…" value={announcementForm.message} onChange={e => setAnnouncementForm(p => ({ ...p, message: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                    <label className="form-label">Audience</label>
                    <select className="form-input" value={announcementForm.audience} onChange={e => setAnnouncementForm(p => ({ ...p, audience: e.target.value }))}>
                      <option value="all">Everyone</option>
                      <option value="teachers">Teachers Only</option>
                      <option value="students">Students Only</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value }))}>
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" disabled={announcementSaving} style={{ opacity: announcementSaving ? .6 : 1 }}
                  onClick={async () => {
                    if (!announcementForm.title.trim()) { toast.error('Title is required'); return; }
                    if (!announcementForm.message.trim()) { toast.error('Message is required'); return; }
                    setAnnouncementSaving(true);
                    try {
                      const res = await apiAdminPublishAnnouncement(announcementForm);
                      const newItem = res?.data ?? res;
                      setAnnouncementsList(prev => [{
                        _id: newItem._id,
                        title: newItem.title,
                        message: newItem.message,
                        audience: newItem.audience,
                        priority: newItem.priority,
                        author: 'Admin',
                        date: new Date(newItem.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                      }, ...(prev ?? [])]);
                      setAnnouncementForm({ title: '', message: '', audience: 'all', priority: 'normal' });
                      toast.success('📢 Announcement published!');
                    } catch (err) {
                      toast.error(err?.message || 'Failed to publish');
                    } finally {
                      setAnnouncementSaving(false);
                    }
                  }}>
                  {announcementSaving ? 'Publishing…' : '📢 Publish Announcement'}
                </button>
              </div>
            </div>

            {/* Previous Announcements */}
            <div className="glass card">
              <div className="section-title">📋 Previous Announcements</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {announcementsList === null && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>⏳ Loading…</div>
                )}
                {announcementsList !== null && displayList.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No announcements yet.</div>
                )}
                {displayList.map((a, i) => (
                  <div key={a._id ?? i} className="glass" style={{ padding: '16px 18px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: a.priority === 'urgent' ? 'var(--color-rose)' : a.priority === 'important' ? 'var(--color-amber)' : 'var(--color-primary)', borderRadius: '3px 0 0 3px' }} />
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{a.title}</span>
                        <span className={`badge ${a.priority === 'urgent' ? 'bd-rose' : a.priority === 'important' ? 'bd-amber' : 'bd-primary'}`} style={{ fontSize: '.65rem' }}>{a.priority}</span>
                        <span className="badge bd-accent" style={{ fontSize: '.65rem' }}>{a.audience}</span>
                      </div>
                      <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{a.message}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Published: {a.date} · By: {a.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════ REPORTS ═══════════════════ */
      case 'reports':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Enrollment trend */}
            <div className="glass card">
              <div className="section-title">📈 Enrollment Trend (6 months)</div>
              <div style={{ position: 'relative', height: 260 }}>
                <Line key={`enroll-${isDark}`} data={{
                  labels: d.enrollmentTrend.map(e => e.month),
                  datasets: [
                    { label: 'New Students', data: d.enrollmentTrend.map(e => e.students), borderColor: '#7c5cfc', backgroundColor: 'rgba(124,92,252,.1)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#7c5cfc' },
                    { label: 'New Teachers', data: d.enrollmentTrend.map(e => e.teachers), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,.1)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#00d4aa' },
                  ],
                }} options={{ ...chartOpts, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Subject-wise performance */}
            <div className="grid-2">
              <div className="glass card">
                <div className="section-title">📊 Subject-wise Avg Score</div>
                <div style={{ position: 'relative', height: 240 }}>
                  <Bar key={`subj-score-${isDark}`} data={{
                    labels: d.subjectPerformance.map(s => s.subject),
                    datasets: [{
                      label: 'Avg Score %', data: d.subjectPerformance.map(s => s.avgScore),
                      backgroundColor: ['rgba(124,92,252,.7)', 'rgba(0,212,170,.7)', 'rgba(255,107,157,.7)', 'rgba(255,179,64,.7)', 'rgba(56,189,248,.7)', 'rgba(99,102,241,.7)'],
                      borderRadius: 8, borderSkipped: false,
                    }],
                  }} options={{ ...chartOpts, maintainAspectRatio: false, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100 } } }} />
                </div>
              </div>

              <div className="glass card">
                <div className="section-title">🎯 Teacher Utilization</div>
                <div style={{ position: 'relative', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Doughnut key={`util-${isDark}`} data={{
                    labels: ['Full Capacity', 'Available Slots', 'On Leave'],
                    datasets: [{
                      data: [d.teacherUtilization.full, d.teacherUtilization.available, d.teacherUtilization.onLeave],
                      backgroundColor: ['rgba(0,212,170,.8)', 'rgba(124,92,252,.8)', 'rgba(255,107,157,.8)'],
                      borderWidth: 0,
                    }],
                  }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tickColor, font: { family: 'Poppins', size: 11 }, padding: 16 } } } }} />
                </div>
              </div>
            </div>

            {/* Key metrics summary */}
            <div className="glass card">
              <div className="section-title">📋 Platform Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Total Classes Conducted', value: d.totalClassesConducted, icon: '📹' },
                  { label: 'Avg Class Duration', value: `${d.avgClassDuration} min`, icon: '⏱️' },
                  { label: 'Assignment Completion', value: `${d.assignmentCompletion}%`, icon: '📝' },
                  { label: 'Parent Satisfaction', value: `${d.parentSatisfaction}%`, icon: '👨‍👩‍👦' },
                  { label: 'Platform Uptime', value: `${d.platformUptime}%`, icon: '🖥️' },
                  { label: 'Avg Response Time', value: d.avgResponseTime, icon: '⚡' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '16px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-2)' }}>{m.value}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ═══════════════════ REVIEWS ═══════════════════ */
      case 'reviews':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="glass card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="section-title" style={{ marginBottom: 4 }}>⭐ Student Reviews</div>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Toggle the star to feature a review on the public homepage as a testimonial.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                  <span>Total: <strong>{reviews.length}</strong></span>
                  <span>Featured: <strong style={{ color: 'var(--color-amber)' }}>{reviews.filter(r => r.featured).length}</strong></span>
                </div>
              </div>

              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : reviews.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">⭐</div>
                  <div className="empty-title">No reviews yet</div>
                  <div className="empty-desc">Student reviews will appear here once submitted.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Teacher</th>
                        <th>Rating</th>
                        <th>Feedback</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Homepage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.studentName}</td>
                          <td style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{r.teacherName}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : 'var(--text-muted)', fontSize: '.8rem' }}>★</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)', maxWidth: 280, whiteSpace: 'normal', lineHeight: 1.5 }}>
                            {r.text || <em style={{ color: 'var(--text-muted)' }}>No text</em>}
                          </td>
                          <td style={{ fontSize: '.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.date}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`btn btn-sm ${r.featured ? 'btn-primary' : 'btn-ghost'}`}
                              style={{ fontSize: '.78rem', minWidth: 90 }}
                              disabled={togglingReview === r.id}
                              onClick={() => handleToggleFeatured(r.id)}
                            >
                              {togglingReview === r.id ? '…' : r.featured ? '⭐ Featured' : '☆ Feature'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Platform Reviews */}
            <div className="glass card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="section-title" style={{ marginBottom: 4 }}>🌟 Platform Reviews</div>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Students rate the platform overall. Toggle to feature on homepage.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                  <span>Total: <strong>{platformReviews.length}</strong></span>
                  <span>Featured: <strong style={{ color: 'var(--color-amber)' }}>{platformReviews.filter(r => r.featured).length}</strong></span>
                </div>
              </div>

              {platformReviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : platformReviews.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">🌟</div>
                  <div className="empty-title">No platform reviews yet</div>
                  <div className="empty-desc">Platform reviews will appear here once students submit them.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Rating</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Homepage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformReviews.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.studentName}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : 'var(--text-muted)', fontSize: '.8rem' }}>★</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)', maxWidth: 320, whiteSpace: 'normal', lineHeight: 1.5 }}>
                            {r.text || <em style={{ color: 'var(--text-muted)' }}>No text</em>}
                          </td>
                          <td style={{ fontSize: '.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.date}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`btn btn-sm ${r.featured ? 'btn-primary' : 'btn-ghost'}`}
                              style={{ fontSize: '.78rem', minWidth: 90 }}
                              disabled={togglingPlatformReview === r.id}
                              onClick={() => handleToggleFeaturedPlatform(r.id)}
                            >
                              {togglingPlatformReview === r.id ? '…' : r.featured ? '⭐ Featured' : '☆ Feature'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      /* ═══════════════════ SETTINGS ═══════════════════ */
      case 'settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="glass card">
              <div className="section-title">⚙️ Platform Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Platform Name', value: 'EduNova', type: 'text' },
                  { label: 'Support Email', value: 'support@edunova.in', type: 'email' },
                  { label: 'Max Students per Class', value: '30', type: 'number' },
                  { label: 'Default Class Duration', value: '55', type: 'number' },
                ].map((field, i) => (
                  <div key={i} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <input type={field.type} className="form-input" defaultValue={field.value} />
                  </div>
                ))}
                <button className="btn btn-primary" onClick={() => import('react-hot-toast').then(({ default: toast }) => toast.success('Settings saved!'))}>
                  💾 Save Settings
                </button>
              </div>
            </div>

            <div className="glass card">
              <div className="section-title">🔐 Access Control</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { role: 'Teachers', desc: 'Can manage classes, students, assignments', enabled: true },
                  { role: 'Students', desc: 'Can view classes, submit assignments, give feedback', enabled: true },
                  { role: 'Parents', desc: 'Can view child progress, attendance, fees', enabled: true },
                  { role: 'Self Registration', desc: 'Allow new users to sign up', enabled: false },
                ].map((ac, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{ac.role}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>{ac.desc}</div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: ac.enabled ? 'var(--color-accent)' : 'var(--color-surface-2)', cursor: 'pointer', position: 'relative', transition: 'var(--transition)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: ac.enabled ? 22 : 2, transition: 'var(--transition)', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ═══════════════════ ADD TEACHER ═══════════════════ */
      case 'add-teacher': {
        const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'History & Civics', 'Economics', 'Hindi', 'Other'];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 720 }}>
            {/* Back button */}
            <button className="btn btn-sm" style={{ alignSelf: 'flex-start', background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--color-border)' }} onClick={() => setSection('teachers')}>
              ← Back to Teachers
            </button>

            <div className="glass card">
              <div className="section-title">👨‍🏫 Register New Teacher</div>
              <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Fill in the details below to add a new teacher to the platform. The teacher will receive login credentials via email.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Row 1: Name & Email */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-input" placeholder="e.g. Dr. Priya Nair" value={teacherForm.name} onChange={e => tSet('name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" placeholder="teacher@edunova.in" value={teacherForm.email} onChange={e => tSet('email', e.target.value)} />
                  </div>
                </div>

                {/* Row 2: Phone & Subject */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Phone Number *</label>
                    <input type="tel" className="form-input" placeholder="+91 98765 43210" value={teacherForm.phone} onChange={e => tSet('phone', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Subject *</label>
                    <select className="form-input" value={teacherForm.subject} onChange={e => tSet('subject', e.target.value)}>
                      {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 3: Experience & Salary */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Experience *</label>
                    <input type="text" className="form-input" placeholder="e.g. 5 years" value={teacherForm.experience} onChange={e => tSet('experience', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Monthly Salary (₹) *</label>
                    <input type="number" className="form-input" placeholder="e.g. 55000" value={teacherForm.salary} onChange={e => tSet('salary', e.target.value)} />
                  </div>
                </div>

                {/* Row 4: Grades & Password */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Grades Handled</label>
                    <input type="text" className="form-input" placeholder="e.g. Grade 9–12" value={teacherForm.grades} onChange={e => tSet('grades', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Temporary Password *</label>
                    <input type="text" className="form-input" placeholder="Initial login password" value={teacherForm.password} onChange={e => tSet('password', e.target.value)} />
                  </div>
                </div>

                {/* About */}
                <div className="form-group">
                  <label className="form-label">About / Bio</label>
                  <textarea className="form-input" rows={3} placeholder="Brief description of qualifications, teaching style…" value={teacherForm.about} onChange={e => tSet('about', e.target.value)} style={{ resize: 'vertical' }} />
                </div>

                {/* Info box */}
                <div style={{ padding: '12px 14px', background: 'rgba(0,212,170,.08)', border: '1px solid rgba(0,212,170,.15)', borderRadius: 'var(--radius-sm)', fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                  📧 The teacher will receive an email with their login credentials and onboarding instructions.
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--color-border)' }} onClick={() => setSection('teachers')}>
                    Cancel
                  </button>
                  <button className="btn btn-accent" onClick={handleRegisterTeacher} style={{ flex: 1 }} disabled={registerLoading}>
                    {registerLoading ? '⏳ Registering…' : '👨‍🏫 Register Teacher'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════ FEE MANAGEMENT ═══════════════════ */
      case 'fee-management': {
        const handleFeeStudentSearch = async (q) => {
          setFeeStudentQuery(q);
          if (!q.trim()) { setFeeStudentResults([]); return; }
          setFeeStudentSearching(true);
          try {
            const res = await apiAdminSearchStudents(q);
            setFeeStudentResults(Array.isArray(res) ? res : []);
          } finally { setFeeStudentSearching(false); }
        };

        const handleFeeStudentSelect = async (stu) => {
          setFeeStudentResults([]);
          setFeeStudentQuery(stu.name);
          setFeeSelectedStudent(stu);
          setFeeDataLoading(true);
          try {
            const data = await apiAdminGetStudentFees(stu._id);
            setFeeData(data);
          } catch { toast.error('Could not load fee data'); }
          finally { setFeeDataLoading(false); }
        };

        const handleSetFee = async (e) => {
          e.preventDefault();
          if (!feeSelectedStudent) { toast.error('Select a student first'); return; }
          if (!feeForm.totalFee || Number(feeForm.totalFee) <= 0) { toast.error('Enter a valid fee amount'); return; }
          setFeeSaving(true);
          try {
            await apiAdminSetStudentFee({
              studentId: feeSelectedStudent._id,
              totalFee: Number(feeForm.totalFee),
              description: feeForm.description,
              dueDate: feeForm.dueDate || undefined,
            });
            toast.success('Fee set successfully!');
            setFeeForm({ totalFee: '', description: '', dueDate: '' });
            const data = await apiAdminGetStudentFees(feeSelectedStudent._id);
            setFeeData(data);
          } catch (err) { toast.error(err?.message || 'Failed to set fee'); }
          finally { setFeeSaving(false); }
        };

        const handleUpdateFee = async (feeId) => {
          setFeeEditSaving(true);
          try {
            await apiAdminUpdateStudentFee(feeId, {
              totalFee: Number(feeEditForm.totalFee) || undefined,
              paidAmount: feeEditForm.paidAmount !== '' ? Number(feeEditForm.paidAmount) : undefined,
              description: feeEditForm.description,
              dueDate: feeEditForm.dueDate || undefined,
            });
            toast.success('Fee updated!');
            setFeeEditId(null);
            const data = await apiAdminGetStudentFees(feeSelectedStudent._id);
            setFeeData(data);
          } catch (err) { toast.error(err?.message || 'Update failed'); }
          finally { setFeeEditSaving(false); }
        };

        const handleDeleteFee = async (feeId) => {
          if (!confirm('Delete this fee record?')) return;
          try {
            await apiAdminDeleteStudentFee(feeId);
            toast.success('Fee deleted');
            const data = await apiAdminGetStudentFees(feeSelectedStudent._id);
            setFeeData(data);
          } catch (err) { toast.error(err?.message || 'Delete failed'); }
        };

        const handleRecordPayment = async (feeId) => {
          if (!feePayAmount || Number(feePayAmount) <= 0) { toast.error('Enter a valid amount'); return; }
          setFeePaySaving(true);
          try {
            await apiAdminRecordFeePayment(feeId, Number(feePayAmount));
            toast.success('Payment recorded!');
            setFeePayId(null);
            setFeePayAmount('');
            const data = await apiAdminGetStudentFees(feeSelectedStudent._id);
            setFeeData(data);
          } catch (err) { toast.error(err?.message || 'Failed to record payment'); }
          finally { setFeePaySaving(false); }
        };

        const statusColor = { paid: 'bd-success', pending: 'bd-amber', partial: 'bd-primary' };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Search student */}
            <div className="glass card" style={{ padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 14 }}>🔍 Search Student to Manage Fees</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type student name…"
                  value={feeStudentQuery}
                  onChange={e => handleFeeStudentSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
                {feeStudentSearching && <div style={{ position: 'absolute', right: 14, top: 10, fontSize: '.85rem', color: 'var(--text-muted)' }}>⏳</div>}
                {feeStudentResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', maxHeight: 220, overflowY: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                  }}>
                    {feeStudentResults.map(s => (
                      <div key={s._id} onClick={() => handleFeeStudentSelect(s)}
                        style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--color-border)', transition: 'var(--transition)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{s.email} · {s.studentId || '—'} · Grade {s.grade || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected student info + fee form */}
            {feeSelectedStudent && (
              <>
                <div className="glass card" style={{ padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(feeSelectedStudent.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{feeSelectedStudent.name}</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {feeSelectedStudent.email} · {feeSelectedStudent.studentId || '—'} · Grade {feeSelectedStudent.grade || '—'}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFeeSelectedStudent(null); setFeeStudentQuery(''); setFeeData({ fees: [], summary: {} }); }}>Clear</button>
                </div>

                {/* Fees summary */}
                <div className="stats-grid">
                  <StatCard icon="💰" label="Total Fee" value={`₹${(feeData.summary?.totalFee || 0).toLocaleString('en-IN')}`} sub="All fee records" grad="var(--grad-primary)" delay={0} />
                  <StatCard icon="✅" label="Paid Amount" value={`₹${(feeData.summary?.totalPaid || 0).toLocaleString('en-IN')}`} sub="Received" grad="var(--grad-accent)" delay={80} />
                  <StatCard icon="⏳" label="Pending Amount" value={`₹${(feeData.summary?.totalPending || 0).toLocaleString('en-IN')}`} sub="Remaining" grad="var(--grad-rose)" delay={160} />
                </div>

                {/* Add new fee form */}
                <div className="glass card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 14 }}>➕ Set New Fee</div>
                  <form onSubmit={handleSetFee} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                      <label className="form-label">Total Fee (₹) *</label>
                      <input type="number" className="form-input" placeholder="e.g. 5000" value={feeForm.totalFee} onChange={e => setFeeForm(p => ({ ...p, totalFee: e.target.value }))} required min="1" />
                    </div>
                    <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                      <label className="form-label">Description</label>
                      <input type="text" className="form-input" placeholder="e.g. Grade 10 - Mathematics - March" value={feeForm.description} onChange={e => setFeeForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                      <label className="form-label">Due Date</label>
                      <input type="date" className="form-input" value={feeForm.dueDate} onChange={e => setFeeForm(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={feeSaving} style={{ height: 42, whiteSpace: 'nowrap' }}>
                      {feeSaving ? '⏳ Saving…' : '💾 Set Fee'}
                    </button>
                  </form>
                </div>

                {/* Existing fee records */}
                <div className="glass card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 14 }}>📋 Fee Records</div>
                  {feeDataLoading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading…</div>
                  ) : feeData.fees.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                      <div style={{ fontWeight: 700 }}>No fee records yet</div>
                      <div style={{ fontSize: '.82rem' }}>Use the form above to set a fee for this student.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {feeData.fees.map(f => {
                        const pending = f.totalFee - f.paidAmount;
                        const isEditing = feeEditId === f._id;
                        const isPaying = feePayId === f._id;

                        return (
                          <div key={f._id} className="glass" style={{ padding: '16px 20px', borderLeft: `3px solid ${{ paid: 'var(--color-accent)', pending: 'var(--color-amber)', partial: 'var(--color-primary)' }[f.status] || 'var(--color-border)'}` }}>
                            {/* Normal view */}
                            {!isEditing && (
                              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 180 }}>
                                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{f.description || 'Fee'}</div>
                                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className={`badge ${statusColor[f.status] || 'bd-muted'}`} style={{ fontSize: '.66rem' }}>{f.status}</span>
                                    {f.dueDate && <span className="badge bd-sky" style={{ fontSize: '.66rem' }}>Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 120 }}>
                                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Total</div>
                                  <div style={{ fontWeight: 800 }}>₹{f.totalFee.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 100 }}>
                                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Paid</div>
                                  <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>₹{f.paidAmount.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 100 }}>
                                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Pending</div>
                                  <div style={{ fontWeight: 700, color: pending > 0 ? 'var(--color-rose)' : 'var(--color-accent)' }}>₹{pending.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {f.status !== 'paid' && (
                                    <button className="btn btn-accent btn-sm" onClick={() => { setFeePayId(f._id); setFeePayAmount(''); }}>💳 Record Pay</button>
                                  )}
                                  <button className="btn btn-ghost btn-sm" onClick={() => {
                                    setFeeEditId(f._id);
                                    setFeeEditForm({ totalFee: f.totalFee, paidAmount: f.paidAmount, description: f.description || '', dueDate: f.dueDate ? f.dueDate.slice(0, 10) : '' });
                                  }}>✏️</button>
                                  <button className="btn btn-sm" style={{ background: 'rgba(255,107,157,.1)', color: 'var(--color-rose)', border: '1px solid rgba(255,107,157,.2)' }} onClick={() => handleDeleteFee(f._id)}>🗑</button>
                                </div>
                              </div>
                            )}

                            {/* Edit mode */}
                            {isEditing && (
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                                  <label className="form-label" style={{ fontSize: '.72rem' }}>Total Fee</label>
                                  <input type="number" className="form-input" value={feeEditForm.totalFee} onChange={e => setFeeEditForm(p => ({ ...p, totalFee: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                                  <label className="form-label" style={{ fontSize: '.72rem' }}>Paid Amount</label>
                                  <input type="number" className="form-input" value={feeEditForm.paidAmount} onChange={e => setFeeEditForm(p => ({ ...p, paidAmount: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 2, minWidth: 160 }}>
                                  <label className="form-label" style={{ fontSize: '.72rem' }}>Description</label>
                                  <input type="text" className="form-input" value={feeEditForm.description} onChange={e => setFeeEditForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
                                  <label className="form-label" style={{ fontSize: '.72rem' }}>Due Date</label>
                                  <input type="date" className="form-input" value={feeEditForm.dueDate} onChange={e => setFeeEditForm(p => ({ ...p, dueDate: e.target.value }))} />
                                </div>
                                <button className="btn btn-primary btn-sm" disabled={feeEditSaving} onClick={() => handleUpdateFee(f._id)}>{feeEditSaving ? '⏳' : '💾 Save'}</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setFeeEditId(null)}>✕</button>
                              </div>
                            )}

                            {/* Record payment inline */}
                            {isPaying && !isEditing && (
                              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                                  <label className="form-label" style={{ fontSize: '.72rem' }}>Payment Amount (₹)</label>
                                  <input type="number" className="form-input" placeholder="Amount received" value={feePayAmount} onChange={e => setFeePayAmount(e.target.value)} min="1" max={pending} />
                                </div>
                                <button className="btn btn-accent btn-sm" disabled={feePaySaving} onClick={() => handleRecordPayment(f._id)}>{feePaySaving ? '⏳' : '✅ Confirm'}</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setFeePayId(null); setFeePayAmount(''); }}>Cancel</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }

      default:
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Section coming soon…</div>;
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dash-layout">
      <Sidebar active={section} onNav={setSection} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dash-main">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <div className="dash-content">{renderSection()}</div>
      </main>
    </div>
  );
}
