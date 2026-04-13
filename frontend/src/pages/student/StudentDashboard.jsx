import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import StatCard from '../../components/StatCard';
import StarRating from '../../components/StarRating';
import { fetchStudentData, fetchTutors, fetchFeeData, fetchTeacherUpdates, fetchEnrollments, apiRequestEnrollment, apiCancelEnrollment, apiInitiatePayment, apiInitiateMonthlyPayment, apiVerifyPayment, apiGetMyDemos, apiRequestDemo, apiGetStudentSchedule, submitAssignment, apiSubmitFeedback, apiGetMyFeedback, apiSubmitPlatformReview, apiGetMyPlatformReview, apiGetMyPerformanceNotes, apiGetMyFees, apiInitiateFeePayment, apiVerifyFeePayment } from '../../api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line, Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend);

const gradeColor = (g) => {
  switch(g) { case 'A+': return 'bd-success'; case 'A': return 'bd-accent'; case 'B+': return 'bd-primary'; default: return 'bd-muted'; }
};
const trendIcon = (t) => t === 'up' ? <span style={{ color: '#4ade80' }}>↑</span> : t === 'down' ? <span style={{ color: 'var(--color-rose)' }}>↓</span> : <span style={{ color: 'var(--color-amber)' }}>→</span>;

function AttendanceBar({ data }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

  const getGrad = (pct) => {
    if (pct >= 90) return 'linear-gradient(90deg,#4ade80,#22c55e)';
    if (pct >= 75) return 'linear-gradient(90deg,#00d4aa,#38bdf8)';
    if (pct >= 60) return 'linear-gradient(90deg,#ffb340,#f97316)';
    return 'linear-gradient(90deg,#ff6b9d,#f43f5e)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{item.subject}</span>
            <span style={{ fontSize: '.875rem', fontWeight: 700, color: item.pct >= 75 ? 'var(--color-accent)' : 'var(--color-rose)' }}>
              {item.attended}/{item.total} ({item.pct}%)
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: animated ? `${item.pct}%` : '0%', background: getGrad(item.pct) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTeacher, setFeedbackTeacher] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]); // existing feedbacks keyed by teacherId
  const [platformRating, setPlatformRating] = useState(0);
  const [platformText, setPlatformText] = useState('');
  const [platformReview, setPlatformReview] = useState(null);
  const [submittingPlatform, setSubmittingPlatform] = useState(false);
  const [platformSubmitted, setPlatformSubmitted] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [payMethod, setPayMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const EMPTY_D = {
    name: '', grade: '', rollNo: '', attendance: 0, totalSessions: 0, sessionsAttended: 0,
    pendingAssignments: 0, submittedAssignments: 0, gradedAssignments: 0,
    avgScore: 0, assignments: [], remarks: [],
    attendanceRecords: [], topicsCovered: [], schedule: [],
    performanceMonthly: [], subjectPerformance: [],
  };

  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollModal, setEnrollModal] = useState(null); // { tutor, grade, parentName, parentPhone, board } | null
  const [enrolling, setEnrolling] = useState(false);
  const [demosMap, setDemosMap] = useState({});
  const [bookingDemo, setBookingDemo] = useState(null); // tutorId being booked
  const [feeData, setFeeData] = useState({ pendingFees: 0, totalFeesPaid: 0, nextDueDate: '—', nextBillingDateRaw: null, pendingInvoices: [], feeHistory: [] });
  const [feeBannerDismissed, setFeeBannerDismissed] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null); // which invoice is being paid via Razorpay
  const [completingPaymentId, setCompletingPaymentId] = useState(null); // enrollmentId whose payment is being retried
  const [myFeeData, setMyFeeData] = useState({ fees: [], summary: { totalFee: 0, totalPaid: 0, totalPending: 0 } });
  const [payingFeeId, setPayingFeeId] = useState(null); // which admin-set fee is being paid via Razorpay
  const [teacherUpdates, setTeacherUpdates] = useState([]);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNote, setSubmitNote] = useState('');
  const [submitDone, setSubmitDone] = useState(new Set());
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [submitDrag, setSubmitDrag] = useState(false);
  const [submitFileErr, setSubmitFileErr] = useState('');
  // Weekly schedule from teachers-set recurring slots
  const [weekSchedule, setWeekSchedule] = useState([]);
  const { isDark } = useTheme();

  // Separately load weekly schedule so it doesn't block dashboard render
  useEffect(() => {
    apiGetStudentSchedule().then(list => setWeekSchedule(Array.isArray(list) ? list : []));
    apiGetMyFeedback().then(list => setMyFeedbacks(Array.isArray(list) ? list : []));
    apiGetMyPlatformReview().then(r => {
      if (r) { setPlatformReview(r); setPlatformRating(r.rating); setPlatformText(r.text || ''); }
    });
    apiGetMyFees().then(data => setMyFeeData(data));
  }, []);

  useEffect(() => {
    Promise.all([fetchStudentData(), fetchTutors(), fetchFeeData(), fetchTeacherUpdates(), fetchEnrollments(), apiGetMyDemos(), apiGetMyPerformanceNotes()])
      .then(([data, tutorList, fees, updates, myEnrollments, demoList, perfNotes]) => {
        setD({
          ...EMPTY_D,
          ...(data || {}),
          assignments: data?.assignments ?? [],
          remarks: data?.remarks ?? [],
          attendanceRecords: data?.attendanceRecords ?? [],
          topicsCovered: data?.topicsCovered ?? [],
          schedule: data?.schedule ?? [],
          performanceMonthly: data?.performanceMonthly ?? [],
          subjectPerformance: data?.subjectPerformance ?? [],
        });
        setTutors(tutorList ?? []);
        setEnrollments(Array.isArray(myEnrollments) ? myEnrollments : (myEnrollments?.data ?? []));
        if (fees) setFeeData(fees);
        if ((fees?.pendingInvoices?.length ?? 0) > 0) setFeeBannerDismissed(false);
        // Merge performance notes into teacherUpdates (prepend, avoid duplicates with notifications)
        const noteUpdates = (perfNotes ?? []).map(n => ({
          title: `📝 New remark from ${n.teacherName}`,
          message: [
            n.score != null ? `Score: ${n.score}%` : '',
            n.note || '',
          ].filter(Boolean).join(' · ') || 'Performance note added',
          type: 'remark',
          isRead: false,
          createdAt: n.createdAt,
          _fromPerfNote: true,
        }));
        // Notifications already include notes added after this fix; dedupe by checking existing remark notifications
        const existingRemarkTimes = new Set((updates ?? []).filter(u => u.type === 'remark').map(u => u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 16) : ''));
        const newNoteUpdates = noteUpdates.filter(n => !existingRemarkTimes.has(new Date(n.createdAt).toISOString().slice(0, 16)));
        const allUpdates = [...(updates ?? []), ...newNoteUpdates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTeacherUpdates(allUpdates);
        const dMap = {};
        (Array.isArray(demoList) ? demoList : []).forEach(dm => { if (dm.tutorId) dMap[String(dm.tutorId)] = dm; });
        setDemosMap(dMap);
      })
      .catch(() => { setD(EMPTY_D); })
      .finally(() => setLoading(false));
  }, []);

  const validateSubmitFile = (file) => {
    if (!file) return;
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'];
    if (!allowed.includes(file.type)) { setSubmitFileErr('Unsupported file type. Use PDF, DOC, DOCX, JPG or PNG.'); return; }
    if (file.size > 10 * 1024 * 1024) { setSubmitFileErr('File too large — maximum size is 10 MB.'); return; }
    setSubmitFileErr('');
    setSubmitFile(file);
  };

  const tickColor   = isDark ? '#9898bb' : '#5a4e8a';
  const gridColor   = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const legendColor = isDark ? '#9898bb' : '#5a4e8a';

  const chartDefaults = {
    plugins: { legend: { labels: { color: legendColor, font: { family: 'Poppins' } } } },
    scales: {
      x: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor }, min: 60 },
    },
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackTeacher) { toast.error('Select a teacher'); return; }
    if (!feedbackRating) { toast.error('Please give a rating'); return; }
    setSubmittingFeedback(true);
    try {
      await apiSubmitFeedback({ teacherId: feedbackTeacher, rating: feedbackRating, text: feedbackText });
      toast.success('⭐ Feedback submitted!');
      setSubmitted(true);
      apiGetMyFeedback().then(list => setMyFeedbacks(Array.isArray(list) ? list : []));
      setTimeout(() => { setSubmitted(false); setFeedbackRating(0); setFeedbackText(''); setFeedbackTeacher(''); }, 3000);
    } catch (err) { toast.error(err?.message || 'Failed to submit feedback'); }
    finally { setSubmittingFeedback(false); }
  };

  const handlePayMonthlyInvoice = async (invoice) => {
    setPayingInvoiceId(invoice.id);
    try {
      const initRes = await apiInitiateMonthlyPayment(invoice.id);
      const { orderId, key, amount, paymentId } = initRes?.data ?? initRes;

      if (!key) throw new Error('Payment gateway not configured. Please contact support.');
      if (typeof window === 'undefined' || !window.Razorpay)
        throw new Error('Razorpay SDK failed to load. Please refresh the page.');

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key,
          amount,
          currency: 'INR',
          name: 'EduNova',
          description: `Monthly fee – ${invoice.month}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              await apiVerifyPayment({ ...response, paymentId });
              toast.success('✅ Monthly fee paid successfully!');
              setFeeData(await fetchFeeData());
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          prefill: { name: d?.name ?? '' },
          theme: { color: '#7c5cfc' },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed.')));
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== 'Payment cancelled.') toast.error(err?.message || 'Payment failed');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleCompleteEnrollmentPayment = async (enroll) => {
    setCompletingPaymentId(enroll.enrollmentId);
    try {
      const initRes = await apiInitiatePayment(enroll.enrollmentId);
      const { orderId, key, amount, paymentId } = initRes?.data ?? initRes;

      if (!key) throw new Error('Payment gateway not configured. Please contact support.');
      if (!window.Razorpay) throw new Error('Razorpay SDK failed to load. Please refresh the page.');

      const tutorObj = tutors.find(t => String(t.id) === String(enroll.tutorId));
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key, amount, currency: 'INR',
          name: 'EduNova',
          description: `Enrollment – ${tutorObj?.name ?? 'Tutor'}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              await apiVerifyPayment({ ...response, paymentId });
              const fresh = await fetchEnrollments();
              setEnrollments(Array.isArray(fresh) ? fresh : (fresh?.data ?? []));
              toast.success('✅ Payment complete! Enrollment is now active.');
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          prefill: { name: d?.name ?? '' },
          theme: { color: '#7c5cfc' },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed.')));
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== 'Payment cancelled.') toast.error(err?.message ?? 'Payment failed');
    } finally {
      setCompletingPaymentId(null);
    }
  };

  // ── Pay an admin-set fee via Razorpay ───────────────────────────────────────
  const handlePayFee = async (fee) => {
    const pending = fee.totalFee - fee.paidAmount;
    if (pending <= 0) { toast.error('This fee is already fully paid'); return; }
    setPayingFeeId(fee._id);
    try {
      const initRes = await apiInitiateFeePayment(fee._id, pending);
      const { orderId, key, amount, feeId } = initRes?.data ?? initRes;

      if (!key) throw new Error('Payment gateway not configured. Please contact admin.');
      if (!window.Razorpay) throw new Error('Razorpay SDK failed to load. Please refresh the page.');

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key, amount, currency: 'INR',
          name: 'EduNova',
          description: fee.description || 'Fee Payment',
          order_id: orderId,
          handler: async (response) => {
            try {
              await apiVerifyFeePayment({ ...response, feeId, amount });
              toast.success('✅ Fee paid successfully!');
              // Refresh fee data
              const freshFees = await apiGetMyFees();
              setMyFeeData(freshFees);
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          prefill: { name: d?.name ?? '' },
          theme: { color: '#7c5cfc' },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed.')));
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== 'Payment cancelled.') toast.error(err?.message || 'Payment failed');
    } finally {
      setPayingFeeId(null);
    }
  };

  const handlePlatformReview = async (e) => {
    e.preventDefault();
    try {
      const res = await apiSubmitPlatformReview({ rating: platformRating, text: platformText });
      const saved = res?.data ?? res;
      setPlatformReview(saved);
      toast.success(platformReview ? '✏️ Review updated!' : '⭐ Platform review submitted!');
      setPlatformSubmitted(true);
      setTimeout(() => setPlatformSubmitted(false), 3000);
    } catch (err) { toast.error(err?.message || 'Failed to submit review'); }
    finally { setSubmittingPlatform(false); }
  };

  const perfMonthly = d?.performanceMonthly ?? [];
  const lineData = {
    labels: perfMonthly.map(m => m.month ?? m),
    datasets: [{
      label: 'Score %', data: perfMonthly.map(m => m.score ?? m),
      borderColor: '#7c5cfc', backgroundColor: 'rgba(124,92,252,.12)',
      tension: .4, fill: true, pointBackgroundColor: '#7c5cfc', pointRadius: 4,
      spanGaps: false,
    }],
  };

  const subjPerf = d?.subjectPerformance ?? [];
  const radarData = {
    labels: subjPerf.length > 0 ? subjPerf.map(s => s.subject ?? s) : ['Maths','Physics','Chemistry','English','Biology'],
    datasets: [{
      label: 'Score', data: subjPerf.length > 0 ? subjPerf.map(s => s.score ?? s) : [0,0,0,0,0],
      backgroundColor: 'rgba(0,212,170,.12)', borderColor: '#00d4aa',
      pointBackgroundColor: '#00d4aa', pointRadius: 4,
    }],
  };

  const hasMonthlyData = perfMonthly.some(m => m.score != null && m.score > 0);
  const hasSubjectData = subjPerf.length > 0;

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [d?.sessionsAttended ?? d?.classesAttended ?? 0, (d?.totalSessions ?? d?.totalClasses ?? 0) - (d?.sessionsAttended ?? d?.classesAttended ?? 0)],
      backgroundColor: ['rgba(0,212,170,.8)', 'rgba(255,107,157,.3)'],
      borderColor: ['#00d4aa', '#ff6b9d'], borderWidth: 2,
    }],
  };

  const radarOpts = {
    plugins: { legend: { display: false } },
    scales: {
      r: {
        ticks: { display: false, backdropColor: 'transparent' },
        grid: { color: gridColor },
        pointLabels: { color: tickColor, font: { family: 'Poppins', size: 12 } },
        suggestedMin: 0, suggestedMax: 100,
        angleLines: { color: gridColor },
      },
    },
  };

  /* ── Pending Enrollment Payment Banner ────────────────────────────────────
     Shown whenever any enrollment is in 'pending'/'approved'/'requested'        */
  const pendingPaymentBanner = (() => {
    const actionEnrolls = enrollments.filter(e =>
      e.status === 'pending' || e.status === 'approved' || e.status === 'requested'
    );
    if (actionEnrolls.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actionEnrolls.map(enroll => {
          /* ── Awaiting admin approval / fee setup ── */
          if (enroll.status === 'requested') {
            return (
              <div key={enroll.enrollmentId} className="glass card ani-up" style={{
                border: '1.5px solid rgba(124,92,252,.4)',
                background: 'rgba(124,92,252,.06)',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 20px',
              }}>
                <span style={{ fontSize: '1.6rem' }}>📩</span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: '.93rem', color: 'var(--color-primary)' }}>Request Sent — Awaiting Admin</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    Your request to enroll with <strong>{enroll.tutorName ?? 'Tutor'}</strong> has been received.
                    The admin will contact you to discuss and set the fee.
                  </div>
                </div>
              </div>
            );
          }

          /* ── Approved / Pending — admin will set fee separately ── */
          return (
            <div key={enroll.enrollmentId} className="glass card ani-up" style={{
              border: '1.5px solid rgba(0,212,170,.5)',
              background: 'rgba(0,212,170,.07)',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 20px',
            }}>
              <span style={{ fontSize: '1.6rem' }}>✅</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: '.93rem', color: 'var(--color-accent)' }}>Enrollment {enroll.status === 'approved' ? 'Approved' : 'Confirmed'}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                  You are enrolled with <strong>{enroll.tutorName ?? 'Tutor'}</strong>.
                  {' '}The admin will add your fee — check the <strong>Fee Payment</strong> section to pay when ready.
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  })();

  /* ── Fee Due Banner ─────────────────────────────────────────────────────────
     Shown whenever it is the billing day or a pending invoice exists.           */
  const feeDueBanner = (() => {
    if (feeBannerDismissed) return null;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const nbRaw = feeData?.nextBillingDateRaw ? new Date(feeData.nextBillingDateRaw) : null;
    if (nbRaw) nbRaw.setHours(0, 0, 0, 0);

    const hasPending = (feeData?.pendingInvoices?.length ?? 0) > 0;
    const isDueToday = nbRaw && nbRaw <= todayStart;
    if (!hasPending && !isDueToday) return null;

    const inv = feeData?.pendingInvoices?.[0] ?? null;
    const amount = inv?.amount ?? feeData?.pendingFees ?? 0;
    const teacherName = inv?.teacherName && inv.teacherName !== '—' ? inv.teacherName : null;
    const month = inv?.month ?? (nbRaw ? nbRaw.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '');
    const isOverdue = inv
      ? (inv.dueDate && new Date(inv.dueDate) < new Date())
      : (nbRaw && nbRaw < todayStart);
    const isPaying = payingInvoiceId === inv?.id;

    const handleBannerPay = () => {
      if (inv) {
        handlePayMonthlyInvoice(inv);
      } else {
        setSection('fees');
        toast.info('Your invoice is being generated. Please check back shortly.');
      }
    };

    return (
      <div className="glass card ani-up" style={{
        border: `1.5px solid ${isOverdue ? 'rgba(255,107,157,.55)' : 'rgba(252,196,28,.55)'}`,
        background: isOverdue ? 'rgba(255,107,157,.07)' : 'rgba(252,196,28,.07)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '18px 22px',
        position: 'relative',
      }}>
        <span style={{ fontSize: '2rem' }}>{isOverdue ? '⛔' : '💳'}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: isOverdue ? 'var(--color-rose)' : 'var(--color-amber)' }}>
            {isOverdue ? 'Monthly Fee Overdue' : 'Monthly Fee Due Today'}
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            {month}{teacherName ? ` · ${teacherName}` : ''} &nbsp;·&nbsp; <strong>₹{amount.toLocaleString()}</strong>
          </div>
        </div>
        <button
          className={`btn ${isOverdue ? 'btn-primary' : 'btn-accent'}`}
          disabled={isPaying}
          onClick={handleBannerPay}
          style={{ whiteSpace: 'nowrap' }}
        >
          {isPaying ? 'Processing…' : '💳 Pay Now →'}
        </button>
        <button
          onClick={() => setFeeBannerDismissed(true)}
          style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1 }}
          title="Dismiss"
        >×</button>
      </div>
    );
  })();

  const renderSection = () => {
    if (loading || !d) return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 14, opacity: .6 }}>⏳</div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading dashboard…</div>
      </div>
    );
    switch (section) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Pending enrollment payment banner */}
            {pendingPaymentBanner}
            {/* Fee Due Banner — appears when billing day arrives */}
            {feeDueBanner}

            {/* ── Redesigned Stats Hero ─────────────────────────────── */}
            <div className="stats-hero">

              {/* Attendance hero card */}
              <div className="glass card ani-up" style={{
                display: 'flex', gap: 24, alignItems: 'center',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(0,212,170,.10) 0%,rgba(56,189,248,.05) 100%)'
                  : 'linear-gradient(135deg,rgba(0,212,170,.09) 0%,rgba(56,189,248,.05) 100%)',
                border: '1.5px solid rgba(0,212,170,.28)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -28, top: -28, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,212,170,.15),transparent 70%)', pointerEvents: 'none' }} />
                {/* SVG ring */}
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="38" fill="none" stroke={isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'} strokeWidth="9" />
                    <circle cx="48" cy="48" r="38" fill="none"
                      stroke="url(#attRingGrad)" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - Math.min(100, d.attendance || 0) / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                    />
                    <defs>
                      <linearGradient id="attRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00d4aa" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>{d.attendance}%</span>
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Overall Attendance</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{d.attendance}%</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{d.classesAttended ?? 0} of {d.totalClasses ?? 0} classes attended</div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#00d4aa,#38bdf8)', width: `${Math.min(100, d.attendance || 0)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className={`badge ${(d.attendance ?? 0) >= 85 ? 'bd-success' : (d.attendance ?? 0) >= 60 ? 'bd-amber' : 'bd-rose'}`} style={{ fontSize: '.7rem', fontWeight: 700 }}>
                      {(d.attendance ?? 0) >= 85 ? '✓ Good Standing' : (d.attendance ?? 0) >= 60 ? '⚠ Needs Improvement' : '✗ Critical'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avg Score card */}
              <div className="glass card ani-up" style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                background: isDark
                  ? 'linear-gradient(135deg,rgba(252,196,28,.09) 0%,rgba(249,115,22,.05) 100%)'
                  : 'linear-gradient(135deg,rgba(252,196,28,.10) 0%,rgba(249,115,22,.04) 100%)',
                border: '1.5px solid rgba(252,196,28,.28)',
                position: 'relative', overflow: 'hidden', animationDelay: '80ms',
              }}>
                <div style={{ position: 'absolute', right: -12, bottom: -12, fontSize: '5.5rem', lineHeight: 1, opacity: .07, pointerEvents: 'none' }}>🏆</div>
                <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Avg Score</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
                    {(d.avgScore ?? 0) > 0 ? d.avgScore : '—'}
                  </div>
                  {(d.avgScore ?? 0) > 0 && <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffb340', marginBottom: 4 }}>%</div>}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                  {d.gradedAssignments > 0 ? `${d.gradedAssignments} assignment${d.gradedAssignments !== 1 ? 's' : ''} graded` : 'No assignments graded yet'}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>0%</span><span>100%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ffb340,#f97316)', width: `${Math.min(100, d.avgScore ?? 0)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                </div>
              </div>

              {/* Tasks + Schedule stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(255,107,157,.09) 0%,rgba(244,63,94,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(255,107,157,.10) 0%,rgba(244,63,94,.04) 100%)',
                  border: '1.5px solid rgba(255,107,157,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '160ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(244,63,94,.35)' }}>📝</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Pending Tasks</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{d.pendingAssignments ?? 0}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>assignments due soon</div>
                  </div>
                </div>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(124,92,252,.09) 0%,rgba(167,139,250,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(124,92,252,.10) 0%,rgba(167,139,250,.04) 100%)',
                  border: '1.5px solid rgba(124,92,252,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '240ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(124,92,252,.35)' }}>🗓</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Weekly Slots</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{weekSchedule.reduce((n, day) => n + (day.slots?.length ?? 0), 0)}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>scheduled this week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Charts row ──────────────────────────────────────────── */}
            <div className="grid-2">
              {/* Monthly Performance */}
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
                <div style={{
                  padding: '16px 22px 14px',
                  background: 'linear-gradient(135deg,rgba(124,92,252,.10),rgba(167,139,250,.05))',
                  borderBottom: '1px solid rgba(124,92,252,.15)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(124,92,252,.35)' }}>📈</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Monthly Performance</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Score % over last 12 months</div>
                  </div>
                  {hasMonthlyData && (
                    <span className="badge bd-primary" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>
                      {perfMonthly.filter(m => m.score != null).length} months
                    </span>
                  )}
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  {!hasMonthlyData
                    ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 10, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.8rem', opacity: .4 }}>📊</div>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>No scores recorded yet</div>
                        <div style={{ fontSize: '.78rem', textAlign: 'center', maxWidth: 220 }}>Your monthly performance will appear here once assignments are graded</div>
                      </div>
                    : <div style={{ position: 'relative', height: 220 }}>
                        <Line key={`line-${isDark}`} data={lineData} options={{ ...chartDefaults, maintainAspectRatio: false }} />
                      </div>
                  }
                </div>
              </div>

              {/* Subject Performance */}
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{
                  padding: '16px 22px 14px',
                  background: 'linear-gradient(135deg,rgba(0,212,170,.10),rgba(56,189,248,.05))',
                  borderBottom: '1px solid rgba(0,212,170,.15)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(0,212,170,.35)' }}>🎯</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Subject Performance</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Score breakdown by subject</div>
                  </div>
                  {hasSubjectData && (
                    <span className="badge bd-accent" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>
                      {subjPerf.length} subject{subjPerf.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  {!hasSubjectData
                    ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 10, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.8rem', opacity: .4 }}>🎯</div>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>No subject data yet</div>
                        <div style={{ fontSize: '.78rem', textAlign: 'center', maxWidth: 220 }}>Appears once attendance or graded assignments exist for your enrolled subjects</div>
                      </div>
                    : <div style={{ position: 'relative', height: 220 }}>
                        <Radar key={`radar-${isDark}`} data={radarData} options={{ ...radarOpts, maintainAspectRatio: false }} />
                      </div>
                  }
                </div>
              </div>
            </div>

            {/* Schedule + Attendance overview */}
            <div className="grid-2">
              <div className="glass card">
                <div className="section-title">🗓 This Week's Schedule</div>
                {weekSchedule.length === 0 && Object.values(demosMap).filter(dm => dm.status === 'confirmed' && dm.scheduledAt).length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon">📅</div>
                    <div className="empty-title">No schedule yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Confirmed upcoming demos */}
                    {Object.values(demosMap)
                      .filter(dm => dm.status === 'confirmed' && dm.scheduledAt)
                      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                      .slice(0, 2)
                      .map(dm => (
                        <div key={String(dm.tutorId)} className="glass" style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', border: '1px solid rgba(0,212,170,.3)', background: 'rgba(0,212,170,.05)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>🎓 Demo · {dm.tutorName}</div>
                            <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                              {new Date(dm.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} · {new Date(dm.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {dm.zoomLink && <a href={dm.zoomLink} target="_blank" rel="noreferrer" className="btn btn-accent btn-xs">Join</a>}
                        </div>
                      ))}
                    {weekSchedule.slice(0, 3).flatMap(day =>
                      (day.slots ?? []).slice(0, 2).map((slot, si) => (
                        <div key={`${day.day}-${si}`} className="glass" style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{slot.subject}</div>
                            <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>{day.day} · {slot.time}</div>
                          </div>
                          {slot.meetingLink && <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-xs">Join</a>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="glass card">
                <div className="section-title">✅ Attendance Overview</div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                    <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: '72%', maintainAspectRatio: false }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--grad-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{d.attendance}%</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginTop: 4 }}>{d.sessionsAttended ?? d.classesAttended ?? 0} present · {(d.totalSessions ?? d.totalClasses ?? 0) - (d.sessionsAttended ?? d.classesAttended ?? 0)} absent</div>
                    <div style={{ marginTop: 10 }}>
                      <span className={`badge ${d.attendance >= 85 ? 'bd-success' : 'bd-amber'}`}>{d.attendance >= 85 ? '✓ Good Standing' : '⚠ Below 85%'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent topics */}
            <div className="glass card">
              <div className="section-title">📚 Recent Topics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(d.topicsCovered ?? []).slice(0, 3).map((t, i) => (
                  <div key={i} className="glass" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div className="avatar avatar-sm" style={{ background: 'var(--grad-primary)', color: '#fff', flexShrink: 0 }}>
                        {(t.teacher || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{t.topic}</span>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{t.date}</span>
                        </div>
                        {t.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', lineHeight: 1.6 }}>{t.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {(d.topicsCovered ?? []).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', padding: '8px 0' }}>No topics covered yet.</div>}
              </div>
            </div>
          </div>
        );

      case 'schedule':{
        const hasSlots = weekSchedule.length > 0;
        const upcomingDemos = Object.values(demosMap)
          .filter(dm => dm.status === 'confirmed' && dm.scheduledAt)
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Confirmed Demo Classes ── */}
            {upcomingDemos.length > 0 && (
              <div className="glass card ani-up">
                <div className="section-title">🎓 Upcoming Demo Classes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcomingDemos.map(dm => {
                    const dt = new Date(dm.scheduledAt);
                    const isPast = dt < new Date();
                    return (
                      <div key={String(dm.tutorId)} style={{
                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                        padding: '14px 18px', borderRadius: 'var(--radius-md)',
                        background: isPast ? 'var(--color-surface)' : 'rgba(0,212,170,.06)',
                        border: `1.5px solid ${isPast ? 'var(--color-border)' : 'rgba(0,212,170,.3)'}`,
                      }}>
                        <div style={{ fontSize: '1.5rem' }}>{isPast ? '✅' : '🎯'}</div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>
                            Demo with <span style={{ color: 'var(--color-accent)' }}>{dm.tutorName}</span>
                            {dm.subject && dm.subject !== '—' && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.8rem' }}> · {dm.subject}</span>}
                          </div>
                          <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                            📅 {dt.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            &nbsp;·&nbsp; 🕐 {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${isPast ? 'bd-muted' : 'bd-success'}`} style={{ fontSize: '.72rem' }}>
                            {isPast ? 'Completed' : '✓ Confirmed'}
                          </span>
                          {dm.zoomLink && !isPast && (
                            <a href={dm.zoomLink} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm" style={{ fontSize: '.8rem' }}>
                              🔗 Join Demo
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="glass card ani-up">
            <div className="section-title">🗓 Weekly Class Schedule</div>
            {!hasSlots ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2rem', marginBottom:10 }}>📅</div>
                <div style={{ fontWeight:600 }}>No recurring schedule yet</div>
                <div style={{ fontSize:'.85rem', marginTop:6 }}>Your teachers haven’t set a weekly schedule yet. Check back soon!</div>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Day</th><th>Subject</th><th>Time</th><th>Teacher</th><th>Type</th><th>Join</th><th>Notes</th></tr></thead>
                  <tbody>
                    {weekSchedule.flatMap((day, di) =>
                      day.slots.map((slot, si) => (
                        <tr key={`${di}-${si}`}>
                          {si === 0 && (
                            <td rowSpan={day.slots.length} style={{ fontWeight:700, color:'var(--color-primary-2)', verticalAlign:'middle' }}>{day.day}</td>
                          )}
                          <td><span style={{ fontWeight:600 }}>{slot.subject}</span></td>
                          <td><span className="badge bd-primary" style={{ fontWeight:600 }}>{slot.time}</span></td>
                          <td style={{ color:'var(--text-secondary)' }}>{slot.teacher || '—'}</td>
                          <td>
                            {slot.isPersonal
                              ? <span className="badge bd-accent" title="Assigned personally for you">🎯 Personal</span>
                              : <span className="badge bd-muted">General</span>}
                          </td>
                          <td>
                            {slot.meetingLink
                              ? <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join</a>
                              : <span style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>TBA</span>}
                          </td>
                          <td style={{ fontSize:'.82rem', color:'var(--text-muted)' }}>{slot.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        );
      }

      case 'attendance': {
        const sortedRecs = [...(d.attendanceRecords ?? [])].sort((a, b) => b.pct - a.pct);
        const bestRec   = sortedRecs[0]   ?? null;
        const worstRec  = sortedRecs[sortedRecs.length - 1] ?? null;
        const hasRecs   = sortedRecs.length > 0;
        return (
          <div className="flex-col gap-lg">
            <div className="stats-grid">
              <StatCard icon="✅" label="Overall" value={`${d.attendance}%`} sub={`${d.classesAttended} of ${d.totalClasses}`} grad="var(--grad-accent)" />
              <StatCard icon="📊" label="Best Subject" value={hasRecs ? `${bestRec.pct}%` : '—'} sub={hasRecs ? bestRec.subject : 'No data yet'} grad="var(--grad-primary)" />
              <StatCard icon="⚠" label="Needs Attention" value={hasRecs && worstRec !== bestRec ? `${worstRec.pct}%` : (hasRecs ? `${bestRec.pct}%` : '—')} sub={hasRecs ? (worstRec !== bestRec ? worstRec.subject : bestRec.subject) : 'No data yet'} grad="var(--grad-amber)" />
            </div>
            <div className="glass card">
              <div className="section-title">📊 Subject-wise Attendance</div>
              {hasRecs ? (
                <AttendanceBar data={d.attendanceRecords} />
              ) : (
                <div className="empty-box">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No attendance records yet</div>
                  <div className="empty-desc">Attendance will appear here once your teacher marks it.</div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'topics':
        return (
          <div className="flex-col gap-md">
            {d.topicsCovered.map((t, i) => (
              <div key={i} className="glass card ani-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div className="avatar" style={{ background: 'var(--grad-primary)', color: '#fff', flexShrink: 0 }}>
                    {t.subject.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{t.topic}</span>
                        <span className="badge bd-sky" style={{ marginLeft: 10, fontSize: '.68rem' }}>{t.subject}</span>
                      </div>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{t.date}</span>
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>By {t.teacher}</div>
                    <div className="quote-block" style={{ marginTop: 4 }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 8 }}>📌 Teacher Note:</span>
                      <span style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{t.notes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'assignments':
        return (
          <div className="flex-col gap-sm">
            {d.assignments.length === 0 ? (
              <div className="glass card empty-box">
                <div className="empty-icon">📝</div>
                <div className="empty-title">No assignments available</div>
                <div className="empty-desc">Your teacher hasn't assigned any work yet. Check back later.</div>
              </div>
            ) : (
              <>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
              <StatCard icon="📝" label="Total" value={d.assignments.length} grad="var(--grad-primary)" />
              <StatCard icon="✅" label="Submitted" value={d.assignments.filter(a => a.status !== 'pending').length} grad="var(--grad-accent)" />
              <StatCard icon="⏳" label="Pending" value={d.assignments.filter(a => a.status === 'pending').length} grad="var(--grad-rose)" />
            </div>
            {d.assignments.map((a, i) => (
              <div key={a.id} className="glass card ani-up" style={{ animationDelay: `${i * 60}ms`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: a.color, borderRadius: '4px 0 0 4px' }} />
                <div style={{ paddingLeft: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 3 }}>{a.title}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge ${a.subject === 'Mathematics' ? 'bd-primary' : a.subject === 'Physics' ? 'bd-accent' : a.subject === 'Chemistry' ? 'bd-rose' : a.subject === 'English' ? 'bd-amber' : 'bd-sky'}`}>
                          {a.subject}
                        </span>
                        {a.teacherName && <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>👤 {a.teacherName}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span className={`badge ${{ pending: 'bd-amber', submitted: 'bd-primary', graded: 'bd-success', late: 'bd-rose', overdue: 'bd-rose' }[a.status] || 'bd-muted'}`}>{a.status || '—'}</span>
                      <span className={`badge ${a.priority === 'high' ? 'bd-rose' : a.priority === 'medium' ? 'bd-amber' : 'bd-muted'}`}>{a.priority}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>📅 Due: {a.due}</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>🏆 Max: {a.points} pts</span>
                    {a.status === 'graded' && a.grade !== null && a.grade !== undefined && (
                      <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>✅ Score: {a.grade}/{a.points}</span>
                    )}
                    {a.status === 'pending' && !submitDone.has(a.id) && (
                      <button
                        className="btn btn-primary btn-xs"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => { setSubmitModal(a); setSubmitFile(null); setSubmitNote(''); setSubmitFileErr(''); }}
                      >📎 Submit</button>
                    )}
                    {(submitDone.has(a.id) || a.status === 'submitted' || a.status === 'late') && (
                      <span className="badge bd-success" style={{ marginLeft: 'auto' }}>✅ Submitted</span>
                    )}
                    {a.status === 'graded' && !submitDone.has(a.id) && (
                      <span className="badge bd-accent" style={{ marginLeft: 'auto' }}>✓ Graded</span>
                    )}
                    {a.teacherRemark && (
                      <div style={{ width: '100%', marginTop: 6, fontSize: '.8rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-primary)', paddingLeft: 10, fontStyle: 'italic' }}>
                        💬 {a.teacherRemark}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </>
            )}
          </div>
        );

      case 'feedback': {
        const enrolledIds = new Set(enrollments.map(e => String(e.tutorId)));
        const enrolledTutors = tutors.filter(t => enrolledIds.has(String(t.id)));
        const ratedTeacherIds = new Set(myFeedbacks.map(f => String(f.teacherId)));
        const unratedTutors = enrolledTutors.filter(t => !ratedTeacherIds.has(String(t.id)));
        return (
          <div style={{ maxWidth: 600 }}>
            <div className="glass card ani-up">
              <div className="section-title">⭐ Submit Class Feedback</div>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 14 }}>🎉</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-accent)' }}>Thank you for your feedback!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your response helps us improve the teaching experience.</p>
                </div>
              ) : unratedTutors.length === 0 && enrolledTutors.length > 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>✅</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>All teachers rated!</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>You've already submitted feedback for all your enrolled tutors.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedback} className="flex-col" style={{ gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Select Teacher</label>
                    {unratedTutors.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', padding: '8px 0' }}>No enrolled tutors yet.</div>
                    ) : (
                      <select className="form-input form-select" value={feedbackTeacher} onChange={e => setFeedbackTeacher(e.target.value)}>
                        <option value="">— Choose a teacher —</option>
                        {unratedTutors.map(t => <option key={t.id} value={t.id}>{t.name}{t.subjects?.length ? ` – ${t.subjects.join(', ')}` : ''}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Rating</label>
                    <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {feedbackRating > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][feedbackRating] + ` (${feedbackRating}/5)` : 'Tap a star to rate'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Feedback</label>
                    <textarea className="form-input" placeholder="Share your experience about this teacher/class..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={feedbackRating === 0 || !feedbackTeacher || submittingFeedback} style={{ alignSelf: 'flex-start' }}>
                    {submittingFeedback ? 'Submitting…' : 'Submit Feedback  →'}
                  </button>
                </form>
              )}
            </div>

            {/* Previously submitted feedback */}
            {myFeedbacks.length > 0 && (
              <div className="glass card ani-up" style={{ marginTop: 20 }}>
                <div className="section-title">📝 Your Submitted Feedback</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {myFeedbacks.map(f => (
                    <div key={f.id} className="glass" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{f.teacherName}</span>
                        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{f.date}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= f.rating ? '#f59e0b' : 'var(--text-muted)', fontSize: '.85rem' }}>★</span>
                        ))}
                      </div>
                      {f.text && <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', lineHeight: 1.6 }}>{f.text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'rate-platform': {
        return (
          <div style={{ maxWidth: 600 }}>
            <div className="glass card ani-up">
              <div className="section-title">🌟 Rate Our Platform</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: 16, lineHeight: 1.6 }}>
                Tell us about your overall experience with EduNova. Your feedback helps us improve!
              </p>

              {platformSubmitted ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 14 }}>🎉</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-accent)' }}>
                    {platformReview ? 'Review updated!' : 'Thank you for your review!'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your feedback means a lot to us.</p>
                </div>
              ) : (
                <form onSubmit={handlePlatformReview} className="flex-col" style={{ gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Overall Rating</label>
                    <StarRating value={platformRating} onChange={setPlatformRating} />
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {platformRating > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][platformRating] + ` (${platformRating}/5)` : 'Tap a star to rate'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Review</label>
                    <textarea className="form-input" placeholder="Share your experience with our platform — what you loved, what we can improve…" value={platformText} onChange={e => setPlatformText(e.target.value)} rows={4} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={platformRating === 0 || submittingPlatform} style={{ alignSelf: 'flex-start' }}>
                    {submittingPlatform ? 'Submitting…' : platformReview ? 'Update Review  →' : 'Submit Review  →'}
                  </button>
                </form>
              )}
            </div>

            {/* Show existing review */}
            {platformReview && !platformSubmitted && (
              <div className="glass card ani-up" style={{ marginTop: 20 }}>
                <div className="section-title">📝 Your Platform Review</div>
                <div className="glass" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: s <= platformRating ? '#f59e0b' : 'var(--text-muted)', fontSize: '1rem' }}>★</span>
                    ))}
                    <span style={{ marginLeft: 8, fontSize: '.82rem', color: 'var(--text-muted)' }}>
                      {['','Poor','Fair','Good','Very Good','Excellent'][platformRating]}
                    </span>
                  </div>
                  {platformText && <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', lineHeight: 1.6 }}>{platformText}</p>}
                  <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    You can update your review anytime using the form above.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'tutors': {
        const enrolledIds = new Set(enrollments.map(e => String(e.tutorId)));
        const enrolledTutors = tutors.filter(t => enrolledIds.has(String(t.id)));
        const availableTutors = tutors.filter(t => !enrolledIds.has(String(t.id)));
        return (
          <div style={{ maxWidth: 960 }}>
            {/* Pending enrollment payment banner */}
            {pendingPaymentBanner && <div style={{ marginBottom: 20 }}>{pendingPaymentBanner}</div>}
            {/* Enrolled tutors */}
            <div className="section-title" style={{ marginBottom: 16 }}>📚 My Enrolled Tutors</div>
            {enrolledTutors.length === 0 ? (
              <div className="glass card empty-box" style={{ marginBottom: 32 }}>
                <div className="empty-icon">🎓</div>
                <div className="empty-title">No tutors enrolled yet</div>
                <div className="empty-desc">Browse tutors below and enroll in a plan to get started.</div>
              </div>
            ) : (
              <div className="glass table-scroll" style={{ marginBottom: 32, borderRadius: 'var(--radius-lg)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tutor</th>
                      <th>Subject</th>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Enrolled On</th>
                      <th>Status</th>
                      <th>Demo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledTutors.map(t => {
                      const enroll = enrollments.find(e => String(e.tutorId) === String(t.id));
                      const isPending = enroll?.status === 'pending';
                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar avatar-sm" style={{ background: t.avatarGrad, color: '#fff', fontWeight: 700, borderRadius: 8 }}>{t.avatar}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '.87rem' }}>{t.name}</div>
                                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{t.experience} experience</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge bd-primary" style={{ fontSize: '.7rem' }}>{t.subject}</span></td>
                          <td><span style={{ fontWeight: 600, fontSize: '.82rem' }}>{enroll?.planName ?? '—'}</span></td>
                          <td style={{ fontWeight: 700, fontSize: '.9rem' }}>
                            {enroll?.price != null ? <>₹{enroll.price.toLocaleString()}<span style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></> : '—'}
                          </td>
                          <td style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{enroll?.enrolledDate ?? '—'}</td>
                          <td>
                            {enroll?.status === 'requested' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className="badge bd-sky" style={{ fontSize: '.68rem' }}>📨 Requested</span>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '.68rem', padding: '2px 8px', color: 'var(--color-rose)' }}
                                  onClick={async () => {
                                    if (!window.confirm('Cancel this enrollment request?')) return;
                                    try {
                                      await apiCancelEnrollment(enroll.enrollmentId);
                                      const fresh = await fetchEnrollments();
                                      setEnrollments(Array.isArray(fresh) ? fresh : (fresh?.data ?? []));
                                      toast.success('Request cancelled.');
                                    } catch (err) {
                                      toast.error(err?.message ?? 'Failed to cancel');
                                    }
                                  }}
                                >Cancel</button>
                              </div>
                            ) : enroll?.status === 'approved' ? (
                              <span className="badge bd-primary" style={{ fontSize: '.68rem' }}>✅ Approved</span>
                            ) : isPending ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className="badge bd-amber" style={{ fontSize: '.68rem' }}>⏳ Pending Payment</span>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '.68rem', padding: '2px 8px', color: 'var(--color-rose)' }}
                                  onClick={async () => {
                                    if (!window.confirm('Cancel this enrollment?')) return;
                                    try {
                                      await apiCancelEnrollment(enroll.enrollmentId);
                                      const fresh = await fetchEnrollments();
                                      setEnrollments(Array.isArray(fresh) ? fresh : (fresh?.data ?? []));
                                      toast.success('Enrollment cancelled.');
                                    } catch (err) {
                                      toast.error(err?.message ?? 'Failed to cancel');
                                    }
                                  }}
                                >Cancel</button>
                              </div>
                            ) : enroll?.status === 'overdue' ? (
                              <span className="badge bd-rose" style={{ fontSize: '.68rem' }}>⚠️ Overdue</span>
                            ) : enroll?.status === 'cancelled' ? (
                              <span className="badge bd-muted" style={{ fontSize: '.68rem' }}>✕ Cancelled</span>
                            ) : enroll?.status === 'expired' ? (
                              <span className="badge bd-muted" style={{ fontSize: '.68rem' }}>⏰ Expired</span>
                            ) : (
                              <span className="badge bd-success" style={{ fontSize: '.68rem' }}>✓ Active</span>
                            )}
                          </td>
                          <td>
                            {enroll?.demoUsed
                              ? <span className="badge bd-success" style={{ fontSize: '.68rem' }}>✓ Used</span>
                              : <span className="badge bd-amber" style={{ fontSize: '.68rem' }}>Available</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Find a tutor CTA when none enrolled */}
            {enrolledTutors.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
                <a href="/tutors" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  🔍 Find a Tutor
                </a>
              </div>
            )}

            {/* Browse more tutors link — shown when already enrolled in at least one */}
            {enrolledTutors.length > 0 && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <a href="/tutors" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', textDecoration: 'none' }}>
                  🔍 Browse more tutors
                </a>
              </div>
            )}
          </div>
        );
      }

      case 'updates': {
        const typeIcon = { class: '📹', assignment: '📝', attendance: '✅', remark: '💬', fee: '💳' };
        const typeColor = { class: 'var(--grad-primary)', assignment: 'var(--grad-rose)', attendance: 'var(--grad-accent)', remark: 'var(--grad-amber)', fee: 'var(--grad-sky)' };
        return (
          <div className="flex-col gap-md">
            {teacherUpdates.length === 0 ? (
              <div className="glass card empty-box">
                <div className="empty-icon">🔔</div>
                <div className="empty-title">No updates yet</div>
                <div className="empty-desc">Your teacher notifications will appear here.</div>
              </div>
            ) : teacherUpdates.map((u, i) => (
              <div key={i} className="glass card ani-up" style={{ animationDelay: `${i * 80}ms`, opacity: u.isRead ? 0.75 : 1 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div className="avatar avatar-lg" style={{ background: typeColor[u.type] || 'var(--grad-primary)', color: '#fff', flexShrink: 0, fontSize: '1.2rem' }}>
                    {typeIcon[u.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.title}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{u.type || 'general'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!u.isRead && <span className="badge bd-primary" style={{ fontSize: '.65rem' }}>New</span>}
                        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>
                    </div>
                    <p className="quote-block" style={{ borderLeftColor: typeColor[u.type] || 'var(--color-primary)', margin: 0, background: 'var(--color-surface)' }}>
                      {u.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'fees': {
        const mySummary = myFeeData?.summary || {};
        const myFees = myFeeData?.fees || [];
        const pendingFees = myFees.filter(f => f.status !== 'paid');
        const paidFees = myFees.filter(f => f.status === 'paid');
        const statusColor = { paid: 'bd-success', pending: 'bd-amber', partial: 'bd-primary' };
        const pct = (mySummary.totalFee || 0) > 0 ? Math.min(100, Math.round(((mySummary.totalPaid || 0) / mySummary.totalFee) * 100)) : 0;

        return (
          <div style={{ maxWidth: 820 }} className="flex-col gap-lg">

            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: '💰', label: 'Total Fee', value: mySummary.totalFee || 0, color: 'var(--grad-primary)' },
                { icon: '✅', label: 'Paid', value: mySummary.totalPaid || 0, color: 'var(--grad-accent)' },
                { icon: '⏳', label: 'Pending', value: mySummary.totalPending || 0, color: 'var(--grad-rose)' },
              ].map((c, i) => (
                <div key={i} className="glass card ani-up" style={{ padding: '20px 18px', textAlign: 'center', animationDelay: `${i * 80}ms`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -10, top: -10, fontSize: '3.5rem', opacity: .08, pointerEvents: 'none' }}>{c.icon}</div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, background: c.color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>₹{c.value.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

            {/* ── Progress Bar ── */}
            {(mySummary.totalFee || 0) > 0 && (
              <div className="glass card ani-up" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  <span>Payment Progress</span>
                  <span style={{ fontWeight: 800, color: pct >= 100 ? 'var(--color-accent)' : 'var(--text-primary)', fontSize: '.85rem' }}>{pct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: pct >= 100 ? 'linear-gradient(90deg,#00d4aa,#38bdf8)' : pct >= 50 ? 'linear-gradient(90deg,#7c5cfc,#00d4aa)' : 'linear-gradient(90deg,#ff6b9d,#ffb340)', width: `${pct}%`, transition: 'width 1.2s ease' }} />
                </div>
              </div>
            )}

            {/* ── Pending Fees (Pay Now) ── */}
            <div className="glass card ani-up">
              <div className="section-title" style={{ marginBottom: 14 }}>🔔 Fees to Pay</div>
              {pendingFees.length === 0 ? (
                <div style={{ padding: '28px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--color-accent)' }}>All fees paid!</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: 4 }}>You have no pending fees right now.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingFees.map(f => {
                    const pending = f.totalFee - f.paidAmount;
                    const isPayingThis = payingFeeId === f._id;
                    const fPct = f.totalFee > 0 ? Math.round((f.paidAmount / f.totalFee) * 100) : 0;
                    return (
                      <div key={f._id} className="glass" style={{
                        padding: '16px 20px', borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${{ pending: 'var(--color-amber)', partial: 'var(--color-primary)' }[f.status] || 'var(--color-border)'}`,
                      }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontWeight: 700, fontSize: '.92rem', marginBottom: 4 }}>{f.description || 'Course Fee'}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className={`badge ${statusColor[f.status]}`} style={{ fontSize: '.64rem', textTransform: 'capitalize' }}>{f.status === 'partial' ? '🔶 Partial' : '⏳ Pending'}</span>
                              {f.dueDate && <span className="badge bd-sky" style={{ fontSize: '.64rem' }}>Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                            </div>
                            {/* Mini progress for partial */}
                            {f.status === 'partial' && (
                              <div style={{ marginTop: 8, maxWidth: 200 }}>
                                <div style={{ height: 4, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: 99, background: 'var(--grad-primary)', width: `${fPct}%`, transition: 'width .8s ease' }} />
                                </div>
                                <div style={{ fontSize: '.64rem', color: 'var(--text-muted)', marginTop: 3 }}>{fPct}% paid</div>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '.66rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Amount</div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{f.totalFee.toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '.66rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Due</div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-rose)' }}>₹{pending.toLocaleString('en-IN')}</div>
                            </div>
                            <button
                              className="btn btn-primary"
                              disabled={isPayingThis}
                              onClick={() => handlePayFee(f)}
                              style={{ whiteSpace: 'nowrap', minWidth: 120, fontWeight: 700, fontSize: '.88rem' }}
                            >
                              {isPayingThis ? '⏳ Processing…' : `💳 Pay ₹${pending.toLocaleString('en-IN')}`}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Previously Paid Fees ── */}
            <div className="glass card ani-up">
              <div className="section-title" style={{ marginBottom: 14 }}>📋 Previously Paid</div>
              {paidFees.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-muted)' }}>No paid fees yet</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Paid On</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidFees.map(f => (
                        <tr key={f._id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{f.description || 'Course Fee'}</div>
                            {f.dueDate && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Due was: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                          </td>
                          <td style={{ fontWeight: 800, fontSize: '.95rem' }}>₹{f.totalFee.toLocaleString('en-IN')}</td>
                          <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                            {f.paidAt ? new Date(f.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td><span className="badge bd-success" style={{ fontSize: '.68rem' }}>✅ Paid</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      }

      default: return null;
    }
  };

  const sectionTitles = {
    dashboard:  { title: 'Student Dashboard',   sub: `Welcome back, ${d?.name || 'there'}! Here's your learning overview.` },
    schedule:   { title: 'Class Schedule',       sub: 'Your weekly timetable.' },
    attendance: { title: 'Attendance Records',   sub: 'Track your presence across all subjects.' },
    topics:     { title: 'Topics Covered',       sub: 'Lessons and teacher notes from recent classes.' },
    assignments:{ title: 'Assignments',          sub: 'Pending, submitted, and graded work.' },
    feedback:   { title: 'Feedback',             sub: 'Rate your teachers and classes.' },
    'rate-platform': { title: 'Rate Platform',   sub: 'Share your overall experience with EduNova.' },
    tutors:     { title: 'My Tutors',            sub: 'Your enrolled tutors, plans, and demo class status.' },
    updates:    { title: 'Teacher Updates',      sub: 'Latest notes and observations from your teachers.' },
    fees:       { title: 'Fee Payment',          sub: 'View fees set by admin, pay online, and track your payment history.' },
  };

  return (
    <div className="dash-layout">
      <div className="mesh-bg" />
      <Sidebar active={section} onNav={setSection} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dash-main">
        <Topbar title={sectionTitles[section]?.title || ''} subtitle={sectionTitles[section]?.sub || ''} onMenuClick={() => setSidebarOpen(true)} />
        <div className="dash-content">
          <div key={section} className="section-enter">{renderSection()}</div>
        </div>
      </main>

      {/* ── Submit Assignment Modal ── */}
      {submitModal && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setSubmitModal(null); }}
        >
          <div className="modal-card">
            <button onClick={() => setSubmitModal(null)} className="modal-close">×</button>

            {/* Header */}
            <div className="modal-header">
              <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 6 }}>Submit Assignment</div>
              <div className="modal-title">{submitModal.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${submitModal.subject === 'Mathematics' ? 'bd-primary' : submitModal.subject === 'Physics' ? 'bd-accent' : submitModal.subject === 'Chemistry' ? 'bd-rose' : submitModal.subject === 'English' ? 'bd-amber' : 'bd-sky'}`}>{submitModal.subject}</span>
                <span className={`badge ${submitModal.priority === 'high' ? 'bd-rose' : submitModal.priority === 'medium' ? 'bd-amber' : 'bd-muted'}`}>{submitModal.priority} priority</span>
                <span style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>📅 Due {submitModal.due}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>🏆 {submitModal.points} pts</span>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setSubmitDrag(true); }}
              onDragLeave={() => setSubmitDrag(false)}
              onDrop={e => { e.preventDefault(); setSubmitDrag(false); validateSubmitFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('submit-file-input').click()}
              className={`drop-zone${submitDrag ? ' drop-zone--active' : submitFile ? ' drop-zone--done' : ''}`}
              style={{ marginBottom: 6 }}
            >
              <input id="submit-file-input" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => validateSubmitFile(e.target.files[0])} />
              {submitFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{submitFile.name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{(submitFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSubmitFile(null); setSubmitFileErr(''); }}
                    style={{ marginLeft: 8, background: 'var(--color-rose)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem' }}
                  >Remove</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📁</div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: 4 }}>Drag & drop your file here</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>or click to browse · PDF, DOC, DOCX, JPG, PNG · Max 10 MB</div>
                </>
              )}
            </div>

            {submitFileErr && <div style={{ color: 'var(--color-rose)', fontSize: '.78rem', marginBottom: 12 }}>⚠ {submitFileErr}</div>}

            {/* Note */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Note to Teacher (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Add any comments about your submission…" value={submitNote} onChange={e => setSubmitNote(e.target.value)} />
            </div>

            {/* Action */}
            <div className="modal-actions">
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSubmitModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center', opacity: submitFile ? 1 : .48 }}
                disabled={!submitFile || submittingAssignment}
                onClick={async () => {
                  if (!submitFile) return;
                  setSubmittingAssignment(true);
                  try {
                    await submitAssignment(submitModal.id, submitFile, submitNote);
                    // Update status in local state so UI reflects immediately
                    setD(prev => ({
                      ...prev,
                      assignments: prev.assignments.map(a =>
                        a.id === submitModal.id ? { ...a, status: 'submitted' } : a
                      ),
                    }));
                    setSubmitDone(prev => new Set([...prev, submitModal.id]));
                    setSubmitModal(null);
                    toast.success('✅ Assignment submitted successfully!');
                  } catch (err) {
                    toast.error(err?.message || 'Submission failed. Please try again.');
                  } finally {
                    setSubmittingAssignment(false);
                  }
                }}
              >{submittingAssignment ? '⏳ Submitting…' : '📤 Submit Assignment'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enroll Modal ─────────────────────────────────────────────── */}
      {enrollModal && (() => {
        const t = enrollModal.tutor;
        const plans = t.plans ?? [];
        const activePlanId = enrollModal._plan ?? plans[0]?._id ?? '';
        return (
          <div className="modal-overlay" onClick={() => setEnrollModal(null)}>
            <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Enroll with {t.name}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEnrollModal(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                <div className="avatar" style={{ background: t.avatarGrad, color: '#fff', fontWeight: 700, borderRadius: 10, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{t.subject} · {t.experience}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '.85rem', fontWeight: 700, color: 'var(--color-amber)' }}>⭐ {t.rating ?? '—'}</div>
              </div>

              {/* Info banner */}
              <div style={{ background: 'rgba(124,92,252,.07)', border: '1px solid rgba(124,92,252,.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                📋 Our team will review your request, contact you, and set the monthly fee before activating your enrollment.
              </div>

              {/* Request form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Grade / Class <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="e.g. Class 9" value={enrollModal.grade || ''} onChange={e => setEnrollModal(p => ({...p, grade: e.target.value}))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Board</label>
                  <select className="form-input form-select" value={enrollModal.board || 'CBSE'} onChange={e => setEnrollModal(p => ({...p, board: e.target.value}))}>
                    {['CBSE','ICSE','State Board','IB','Other'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Parent/Guardian Name <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="Full name" value={enrollModal.parentName || ''} onChange={e => setEnrollModal(p => ({...p, parentName: e.target.value}))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Parent/Guardian Phone <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="+91 XXXXX XXXXX" value={enrollModal.parentPhone || ''} onChange={e => setEnrollModal(p => ({...p, parentPhone: e.target.value}))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Your Mobile Number <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" value={enrollModal.mobileNumber || ''} onChange={e => setEnrollModal(p => ({...p, mobileNumber: e.target.value}))} />
                  <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Admin will call you on this number to discuss fee and schedule.</div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: enrolling ? .6 : 1 }}
                disabled={enrolling}
                onClick={async () => {
                  if (!enrollModal.grade?.trim())       { toast.error('Please enter student grade / class.'); return; }
                  if (!enrollModal.parentName?.trim())  { toast.error('Please enter parent / guardian name.'); return; }
                  if (!enrollModal.parentPhone?.trim()) { toast.error('Please enter parent / guardian phone.'); return; }
                  if (!enrollModal.mobileNumber?.trim()) { toast.error('Please enter your mobile number.'); return; }
                  setEnrolling(true);
                  try {
                    await apiRequestEnrollment(t.id, {
                      grade: enrollModal.grade,
                      board: enrollModal.board || 'CBSE',
                      parentName: enrollModal.parentName,
                      parentPhone: enrollModal.parentPhone,
                      mobileNumber: enrollModal.mobileNumber,
                      school: '',
                      subjectsEnrolled: [],
                      preferredDays: [],
                      notes: '',
                    });
                    const fresh = await fetchEnrollments();
                    setEnrollments(Array.isArray(fresh) ? fresh : (fresh?.data ?? []));
                    setEnrollModal(null);
                    toast.success('✅ Request sent! Admin will contact you shortly.');
                  } catch (err) {
                    toast.error(err?.message ?? 'Request failed');
                  } finally {
                    setEnrolling(false);
                  }
                }}
              >
                {enrolling ? 'Sending…' : '📩 Send Enrollment Request'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
