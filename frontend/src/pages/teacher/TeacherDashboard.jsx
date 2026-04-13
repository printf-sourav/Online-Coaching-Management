import { useState, useEffect, Fragment } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import StatCard from '../../components/StatCard';
import { fetchTeacherData, apiGetMyPlans, apiGetTeacherDemos, apiConfirmDemo, apiCompleteDemo, apiGetStudentSlots, apiAddStudentSlot, apiUpdateStudentSlot, apiDeleteStudentSlot, createAssignment, apiTeacherGetAssignments, apiGradeSubmission, apiMarkAttendance, apiGetStudentAttendanceByTeacher, apiGetTopics, apiAddTopic, apiDeleteTopic, apiGetPerformanceNotes, apiAddPerformanceNote, apiDeletePerformanceNote, apiGetTeacherFeedback, apiGetAvailability, apiUpdateAvailability } from '../../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

// Open an uploaded file — files are served directly from /uploads/
const openFile = (fileUrl) => {
  if (!fileUrl) return;
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
};

export default function TeacherDashboard() {
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [d, setD] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchTeacherData().then(data => {
      if (!data) return;
      setD({
        ...data,
        students: data.students ?? [],
        assignments: data.assignments ?? [],
        recentActivity: data.recentActivity ?? [],
      });
      setAttendanceData((data.students ?? []).filter(s => s).reduce((acc, s) => ({ ...acc, [s.id]: 'present' }), {}));
    }).catch(() => {});
  }, []);

  const tickColor = isDark ? '#9898bb' : '#5a4e8a';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const chartOpts = {
    plugins: { legend: { labels: { color: tickColor, font: { family: 'Poppins', size: 11 } } } },
    scales: {
      x: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor }, max: 100 },
    },
  };

  // Demo classes state
  const [demoRequests, setDemoRequests] = useState([]);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({}); // { [demoId]: { date, time, zoomLink, notes } }
  const [savingDemo, setSavingDemo] = useState(null); // demoId being saved

  // Per-student schedule state
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const [studentSlotsList, setStudentSlotsList] = useState([]);
  const [studentSlotsLoading, setStudentSlotsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSlotForm, setStudentSlotForm] = useState({ day: 'Mon', subject: '', startTime: '', endTime: '', meetingLink: '', notes: '' });
  const [savingStudentSlot, setSavingStudentSlot] = useState(false);
  const [deletingStudentSlot, setDeletingStudentSlot] = useState(null);
  const [editingStudentSlot, setEditingStudentSlot] = useState(null); // slot being edited

  const loadStudentSlots = () => {
    setStudentSlotsLoading(true);
    apiGetStudentSlots().then(list => setStudentSlotsList(Array.isArray(list) ? list : [])).finally(() => setStudentSlotsLoading(false));
  };
  useEffect(() => { loadStudentSlots(); }, []);

  const handleAddStudentSlot = async () => {
    if (!selectedStudentId) { toast.error('Select a student first.'); return; }
    if (!studentSlotForm.subject.trim() || !studentSlotForm.startTime) { toast.error('Subject and start time are required.'); return; }
    setSavingStudentSlot(true);
    try {
      await apiAddStudentSlot(selectedStudentId, studentSlotForm);
      toast.success('✅ Schedule slot added and student notified!');
      setStudentSlotForm({ day: 'Mon', subject: '', startTime: '', endTime: '', meetingLink: '', notes: '' });
      loadStudentSlots();
    } catch (e) { toast.error(e?.message || 'Failed to add slot.'); }
    finally { setSavingStudentSlot(false); }
  };

  const handleUpdateStudentSlot = async () => {
    if (!editingStudentSlot) return;
    if (!editingStudentSlot.subject?.trim() || !editingStudentSlot.startTime) { toast.error('Subject and start time are required.'); return; }
    setSavingStudentSlot(true);
    try {
      const { _id, ...data } = editingStudentSlot;
      await apiUpdateStudentSlot(_id, data);
      toast.success('✅ Slot updated!');
      setEditingStudentSlot(null);
      loadStudentSlots();
    } catch (e) { toast.error(e?.message || 'Failed to update slot.'); }
    finally { setSavingStudentSlot(false); }
  };

  const handleDeleteStudentSlot = async (slotId) => {
    if (!window.confirm('Remove this schedule slot for the student?')) return;
    setDeletingStudentSlot(slotId);
    try { await apiDeleteStudentSlot(slotId); toast.success('Slot removed.'); loadStudentSlots(); }
    catch (e) { toast.error('Could not delete slot.'); }
    finally { setDeletingStudentSlot(null); }
  };

  const loadDemos = () => {
    setLoadingDemos(true);
    apiGetTeacherDemos().then(list => setDemoRequests(Array.isArray(list) ? list : [])).finally(() => setLoadingDemos(false));
  };

  useEffect(() => { loadDemos(); }, []);

  const confirmSchedule = async (demoId) => {
    const f = scheduleForm[demoId] || {};
    if (!f.date || !f.time) { toast.error('Select date and time for the demo.'); return; }
    if (!f.zoomLink?.trim()) { toast.error('Enter a Zoom link for the demo.'); return; }
    setSavingDemo(demoId);
    try {
      const scheduledAt = new Date(`${f.date}T${f.time}`);
      await apiConfirmDemo(demoId, { scheduledAt: scheduledAt.toISOString(), zoomLink: f.zoomLink, notes: f.notes || '' });
      toast.success('✅ Demo confirmed! Student has been notified.');
      setScheduleForm(p => { const n = {...p}; delete n[demoId]; return n; });
      loadDemos();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm demo');
    } finally {
      setSavingDemo(null);
    }
  };

  const markComplete = async (demoId) => {
    setSavingDemo(demoId);
    try {
      await apiCompleteDemo(demoId);
      toast.success('✅ Demo marked as completed.');
      loadDemos();
    } catch (err) {
      toast.error(err.message || 'Failed to update demo');
    } finally {
      setSavingDemo(null);
    }
  };

  const [homeworkForm, setHomeworkForm] = useState({ studentIds: [], title: '', due: '', desc: '', points: '' });
  const [savingHomework, setSavingHomework] = useState(false);
  const [liveAssignments, setLiveAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState(null); // id of expanded row
  const [gradingMap, setGradingMap] = useState({}); // { submissionId: { grade, remark, saving } }

  const loadAssignments = () => {
    setAssignmentsLoading(true);
    apiTeacherGetAssignments().then(list => {
      const arr = Array.isArray(list) ? list : [];
      setLiveAssignments(arr);
      setD(prev => prev ? { ...prev, assignments: arr } : prev);
    }).finally(() => setAssignmentsLoading(false));
  };

  // Auto-refresh every time the teacher opens the assignments section
  useEffect(() => { if (section === 'assignments') loadAssignments(); }, [section]);

  const handleGrade = async (submissionId, grade, remark) => {
    setGradingMap(p => ({ ...p, [submissionId]: { ...p[submissionId], saving: true } }));
    try {
      await apiGradeSubmission(submissionId, { grade, teacherRemark: remark });
      toast.success('✅ Submission graded!');
      loadAssignments();
    } catch (e) {
      toast.error(e?.message || 'Grading failed');
    } finally {
      setGradingMap(p => ({ ...p, [submissionId]: { ...p[submissionId], saving: false } }));
    }
  };

  const handleAssignHomework = async () => {
    if (!homeworkForm.title.trim()) { toast.error('Assignment title is required'); return; }
    if (!homeworkForm.due) { toast.error('Due date is required'); return; }
    setSavingHomework(true);
    try {
      const form = new FormData();
      if (homeworkForm.studentIds.length > 0) {
        homeworkForm.studentIds.forEach(id => form.append('studentIds[]', id));
      }
      form.append('title', homeworkForm.title);
      form.append('description', homeworkForm.desc);
      form.append('dueDate', homeworkForm.due);
      form.append('maxPoints', '10');
      if (hwFile) form.append('file', hwFile);
      await createAssignment(form);
      toast.success('📝 Assignment assigned to students!');
      setHomeworkForm({ studentIds: [], title: '', due: '', desc: '', points: '' });
      setHwFile(null);
      setHwFileErr('');
      loadAssignments();
    } catch (e) {
      toast.error(e?.message || 'Failed to assign homework');
    } finally {
      setSavingHomework(false);
    }
  };
  const [noteForm, setNoteForm] = useState({ student: '', note: '', score: '' });
  const [topicForm, setTopicForm] = useState({ student: '', topic: '', date: '', notes: '' });
  const [toastMsg, setToastMsg] = useState('');

  // ── Topics state ──
  const [topicsList, setTopicsList] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(null);

  const loadTopics = () => { setTopicsLoading(true); apiGetTopics().then(setTopicsList).finally(() => setTopicsLoading(false)); };
  useEffect(() => { loadTopics(); }, []);

  const handleAddTopic = async () => {
    if (!topicForm.student) { toast.error('Select a student'); return; }
    if (!topicForm.topic.trim()) { toast.error('Topic is required'); return; }
    setSavingTopic(true);
    try {
      await apiAddTopic({ studentId: topicForm.student, topic: topicForm.topic, date: topicForm.date || undefined, notes: topicForm.notes });
      toast.success('✅ Topic saved!');
      setTopicForm({ student: '', topic: '', date: '', notes: '' });
      loadTopics();
    } catch (e) { toast.error(e?.message || 'Failed to save topic'); }
    finally { setSavingTopic(false); }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    setDeletingTopic(id);
    try { await apiDeleteTopic(id); toast.success('Topic deleted'); loadTopics(); }
    catch { toast.error('Failed to delete'); }
    finally { setDeletingTopic(null); }
  };

  // ── Performance Notes state ──
  const [perfNotes, setPerfNotes] = useState([]);
  const [perfChartStudent, setPerfChartStudent] = useState('');
  const [perfLoading, setPerfLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);

  const loadPerfNotes = () => { setPerfLoading(true); apiGetPerformanceNotes().then(setPerfNotes).finally(() => setPerfLoading(false)); };
  useEffect(() => { loadPerfNotes(); }, []);

  const handleAddNote = async () => {
    if (!noteForm.student) { toast.error('Select a student'); return; }
    if (!noteForm.note.trim() && !noteForm.score) { toast.error('Provide a score or note'); return; }
    setSavingNote(true);
    try {
      await apiAddPerformanceNote({ studentId: noteForm.student, score: noteForm.score, note: noteForm.note });
      toast.success('📝 Performance note saved!');
      setNoteForm({ student: '', note: '', score: '' });
      loadPerfNotes();
    } catch (e) { toast.error(e?.message || 'Failed to save note'); }
    finally { setSavingNote(false); }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    setDeletingNote(id);
    try { await apiDeletePerformanceNote(id); toast.success('Note deleted'); loadPerfNotes(); }
    catch { toast.error('Failed to delete'); }
    finally { setDeletingNote(null); }
  };

  // ── Teacher Feedback state ──
  const [teacherFeedbacks, setTeacherFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackAvg, setFeedbackAvg] = useState(0);
  const [feedbackTotal, setFeedbackTotal] = useState(0);

  const loadTeacherFeedback = () => {
    setFeedbackLoading(true);
    apiGetTeacherFeedback().then(res => {
      setTeacherFeedbacks(res?.feedbacks ?? []);
      setFeedbackAvg(res?.avgRating ?? 0);
      setFeedbackTotal(res?.totalReviews ?? 0);
    }).finally(() => setFeedbackLoading(false));
  };
  useEffect(() => { loadTeacherFeedback(); }, []);

  // ── Availability state ──
  const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [avail, setAvail] = useState([]); // [{ day, slots: [{ start, end }] }]
  const [availLoading, setAvailLoading] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const loadAvailability = () => {
    setAvailLoading(true);
    apiGetAvailability().then(data => {
      const arr = Array.isArray(data) ? data : [];
      // Ensure all 7 days exist
      const map = {};
      arr.forEach(d => { map[d.day] = d.slots || []; });
      setAvail(FULL_DAYS.map(day => ({ day, slots: map[day] || [] })));
    }).finally(() => setAvailLoading(false));
  };
  useEffect(() => { loadAvailability(); }, []);

  const addSlotToDay = (dayIdx) => {
    setAvail(prev => prev.map((d, i) => i === dayIdx ? { ...d, slots: [...d.slots, { start: '09:00', end: '10:00' }] } : d));
  };
  const removeSlotFromDay = (dayIdx, slotIdx) => {
    setAvail(prev => prev.map((d, i) => i === dayIdx ? { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) } : d));
  };
  const updateSlot = (dayIdx, slotIdx, field, value) => {
    setAvail(prev => prev.map((d, i) => i === dayIdx ? { ...d, slots: d.slots.map((s, si) => si === slotIdx ? { ...s, [field]: value } : s) } : d));
  };
  const handleSaveAvailability = async () => {
    // Only send days with slots
    const payload = avail.filter(d => d.slots.length > 0);
    setSavingAvail(true);
    try {
      await apiUpdateAvailability(payload);
      toast.success('✅ Availability saved!');
    } catch (e) { toast.error(e?.message || 'Failed to save'); }
    finally { setSavingAvail(false); }
  };

  const [attendanceData, setAttendanceData] = useState({});
  const today = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedAttStudent, setSelectedAttStudent] = useState('');
  const [attHistory, setAttHistory] = useState(null);   // { summary, records } or null
  const [attHistoryLoading, setAttHistoryLoading] = useState(false);
  const [markingNewAtt, setMarkingNewAtt] = useState(false);  // toggle mark-form visibility
  const [newAttDate, setNewAttDate] = useState(today);
  const [newAttStatus, setNewAttStatus] = useState('present');
  const [hwFile, setHwFile] = useState(null);
  const [hwDrag, setHwDrag] = useState(false);
  const [hwFileErr, setHwFileErr] = useState('');

  // Plans state (read-only — managed by admin)
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    setPlansLoading(true);
    apiGetMyPlans().then(setPlans).finally(() => setPlansLoading(false));
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const validateHwFile = (file) => {
    if (!file) return;
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'];
    if (!allowed.includes(file.type)) { setHwFileErr('Unsupported type. Use PDF, DOC, DOCX, JPG or PNG.'); return; }
    if (file.size > 10 * 1024 * 1024) { setHwFileErr('File too large — max 10 MB.'); return; }
    setHwFileErr(''); setHwFile(file);
  };

  const parseScore = (s) => {
    if (!s || s === '—') return 0;
    const parts = String(s).split('/');
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (isNaN(num)) return 0;
    if (!isNaN(den) && den > 0) return Math.round((num / den) * 100);
    return Math.min(100, Math.max(0, num));
  };

  // Build a map of studentId → latest score from performance notes
  const perfScoreMap = {};
  perfNotes.forEach(n => {
    const sid = String(n.studentId ?? '');
    if (sid && n.score != null && !perfScoreMap[sid]) {
      perfScoreMap[sid] = n.score; // already sorted by createdAt desc from backend
    }
  });

  const barStudents = (d?.students ?? []).filter(s => s?.name).slice(0, 6);
  const barScores = barStudents.map(s => {
    const fromSubmission = parseScore(s.lastScore);
    if (fromSubmission > 0) return fromSubmission;
    return perfScoreMap[String(s.id)] ?? 0;
  });
  const hasBarData = barScores.some(v => v > 0);

  const barData = {
    labels: barStudents.map(s => s.name.split(' ')[0]),
    datasets: [{
      label: 'Score %', data: barScores,
      backgroundColor: ['rgba(124,92,252,.7)', 'rgba(0,212,170,.7)', 'rgba(255,107,157,.7)', 'rgba(255,179,64,.7)', 'rgba(56,189,248,.7)', 'rgba(124,92,252,.7)'],
      borderRadius: 8, borderSkipped: false,
    }],
  };

  const renderSection = () => {
    if (!d) return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 14, opacity: .6 }}>⏳</div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading dashboard…</div>
      </div>
    );
    switch (section) {
      case 'dashboard':
        return (
          <div className="flex-col" style={{ gap: 24 }}>
            {/* ── Redesigned Stats Hero ─────────────────── */}
            <div className="stats-hero">

              {/* Students hero card */}
              <div className="glass card ani-up" style={{
                display: 'flex', gap: 24, alignItems: 'center',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(124,92,252,.10) 0%,rgba(167,139,250,.05) 100%)'
                  : 'linear-gradient(135deg,rgba(124,92,252,.09) 0%,rgba(167,139,250,.05) 100%)',
                border: '1.5px solid rgba(124,92,252,.28)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,.18),transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ width: 68, height: 68, borderRadius: 18, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0, boxShadow: '0 8px 24px rgba(124,92,252,.4)' }}>👥</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Total Students</div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{d.totalStudents ?? 0}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>enrolled with you</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge bd-primary" style={{ fontSize: '.7rem' }}>{d.gradedAssignments ?? 0} graded</span>
                    <span className="badge bd-rose" style={{ fontSize: '.7rem' }}>{d.pendingEval ?? 0} pending</span>
                  </div>
                </div>
              </div>

              {/* Avg Rating card */}
              <div className="glass card ani-up" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(252,196,28,.09) 0%,rgba(249,115,22,.05) 100%)'
                  : 'linear-gradient(135deg,rgba(252,196,28,.10) 0%,rgba(249,115,22,.04) 100%)',
                border: '1.5px solid rgba(252,196,28,.28)',
                position: 'relative', overflow: 'hidden', animationDelay: '80ms',
              }}>
                <div style={{ position: 'absolute', right: -12, bottom: -12, fontSize: '5.5rem', lineHeight: 1, opacity: .07, pointerEvents: 'none' }}>⭐</div>
                <div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Avg. Rating</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg,#ffb340,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 4 }}>{(feedbackAvg || d.avgRating || 0).toFixed(1)}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>from student feedback</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '1rem', opacity: s <= Math.round(feedbackAvg || d.avgRating || 0) ? 1 : 0.25 }}>⭐</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ffb340,#f97316)', width: `${Math.min(100, (feedbackAvg || d.avgRating || 0) / 5 * 100)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                </div>
              </div>

              {/* Pending Eval + Scheduled Slots stacked */}
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
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Pending Eval</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{d.pendingEval ?? 0}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>assignments to grade</div>
                  </div>
                </div>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(0,212,170,.09) 0%,rgba(56,189,248,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(0,212,170,.10) 0%,rgba(56,189,248,.04) 100%)',
                  border: '1.5px solid rgba(0,212,170,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '240ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(0,212,170,.35)' }}>🗓</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Scheduled Slots</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{studentSlotsList.reduce((n, e) => n + e.slots.length, 0)}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>across all students</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student scores + recent activity */}
            <div className="grid-2">
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(124,92,252,.10),rgba(167,139,250,.05))', borderBottom: '1px solid rgba(124,92,252,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(124,92,252,.35)' }}>📊</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Student Scores</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Latest assignment / performance grades</div>
                  </div>
                  {hasBarData && <span className="badge bd-primary" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{(d.students ?? []).length} students</span>}
                </div>
                <div style={{ padding: '12px 16px 18px' }}>
                  {(d.students ?? []).length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 8, color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2.5rem', opacity: .4 }}>👥</div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>No students yet</div>
                    </div>
                  ) : !hasBarData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 8, color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2.5rem', opacity: .4 }}>📊</div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>No scores yet</div>
                      <div style={{ fontSize: '.78rem', textAlign: 'center', maxWidth: 220 }}>Appears once assignments are graded or performance notes are added</div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', height: 220 }}>
                      <Bar key={`bar-${isDark}`} data={barData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(0,212,170,.10),rgba(56,189,248,.05))', borderBottom: '1px solid rgba(0,212,170,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(0,212,170,.35)' }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Recent Activity</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Your latest platform events</div>
                  </div>
                  {d.recentActivity.length > 0 && <span className="badge bd-accent" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.recentActivity.length} events</span>}
                </div>
                <div className="scroll-area" style={{ padding: '8px 20px 16px' }}>
                  {d.recentActivity.map((act, i) => (
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
          </div>
        );


      case 'demos': {
        const pending = demoRequests.filter(r => r.status === 'pending');
        const confirmed = demoRequests.filter(r => r.status === 'confirmed');
        const completed = demoRequests.filter(r => r.status === 'completed');
        const statusBadgeCls = { pending: 'bd-amber', confirmed: 'bd-accent', completed: 'bd-success', cancelled: 'bd-muted' };
        return (
          <div className="flex-col" style={{ gap: 24 }}>
            {/* Pending requests */}
            <div className="glass card">
              <div className="section-title">📫 Pending Demo Requests{pending.length > 0 && <span className="badge bd-rose" style={{ marginLeft: 10, fontSize: '.7rem' }}>{pending.length} new</span>}</div>
              {loadingDemos ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : pending.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">🎉</div>
                  <div className="empty-title">No pending demo requests</div>
                  <div className="empty-desc">New requests will appear here when students book a demo with you.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {pending.map(req => {
                    const f = scheduleForm[req.demoId] || {};
                    const isSaving = savingDemo === req.demoId;
                    return (
                      <div key={req.demoId} className="glass-flat" style={{ borderRadius: 'var(--radius-md)', padding: '18px 20px', border: '1px solid rgba(255,179,64,.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="avatar" style={{ background: 'var(--grad-primary)', color: '#fff', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                              {(req.studentName || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{req.studentName}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                            </div>
                          </div>
                          <span className="badge bd-amber">⏳ Pending</span>
                        </div>
                        {/* Schedule form */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
                          <div className="form-group">
                            <label className="form-label">Date *</label>
                            <input type="date" className="form-input"
                              value={f.date || ''}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={e => setScheduleForm(p => ({ ...p, [req.demoId]: { ...f, date: e.target.value } }))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Time *</label>
                            <input type="time" className="form-input"
                              value={f.time || ''}
                              onChange={e => setScheduleForm(p => ({ ...p, [req.demoId]: { ...f, time: e.target.value } }))} />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Zoom / Meeting Link *</label>
                            <input type="url" className="form-input" placeholder="https://zoom.us/j/..."
                              value={f.zoomLink || ''}
                              onChange={e => setScheduleForm(p => ({ ...p, [req.demoId]: { ...f, zoomLink: e.target.value } }))} />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Notes for student (optional)</label>
                            <input className="form-input" placeholder="Preparation tips, topics to cover…"
                              value={f.notes || ''}
                              onChange={e => setScheduleForm(p => ({ ...p, [req.demoId]: { ...f, notes: e.target.value } }))} />
                          </div>
                        </div>
                        <button
                          className="btn btn-accent"
                          disabled={isSaving}
                          onClick={() => confirmSchedule(req.demoId)}
                        >
                          {isSaving ? 'Confirming…' : '📹 Confirm & Schedule Demo'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirmed demos */}
            {confirmed.length > 0 && (
              <div className="glass card">
                <div className="section-title">✅ Scheduled Demos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {confirmed.map(req => (
                    <div key={req.demoId} className="glass-flat" style={{ borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{req.studentName}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {req.scheduledAt ? new Date(req.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time TBD'}
                        </div>
                        {req.zoomLink && (
                          <a href={req.zoomLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.75rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                            🔗 {req.zoomLink}
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {req.zoomLink && (
                          <a href={req.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">🔴 Start</a>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={savingDemo === req.demoId}
                          onClick={() => markComplete(req.demoId)}
                        >
                          {savingDemo === req.demoId ? '…' : '✓ Mark Done'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed demos */}
            {completed.length > 0 && (
              <div className="glass card">
                <div className="section-title">🏁 Completed Demos</div>
                <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {completed.map(req => (
                      <tr key={req.demoId}>
                        <td style={{ fontWeight: 600 }}>{req.studentName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{req.scheduledAt ? new Date(req.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td><span className="badge bd-success">✓ Completed</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'attendance': {
        const allStudents = (d.students ?? []).filter(s => s);

        const loadStudentAtt = (sid) => {
          if (!sid) return;
          setAttHistoryLoading(true);
          setAttHistory(null);
          apiGetStudentAttendanceByTeacher(sid)
            .then(res => setAttHistory(res?.data ?? res))
            .catch(() => setAttHistory(null))
            .finally(() => setAttHistoryLoading(false));
        };

        const handleMarkNew = async () => {
          if (!selectedAttStudent) { toast.error('Select a student first'); return; }
          setSavingAttendance(true);
          try {
            await apiMarkAttendance(newAttDate, [{ studentId: selectedAttStudent, status: newAttStatus }]);
            toast.success('✅ Attendance saved!');
            setMarkingNewAtt(false);
            loadStudentAtt(selectedAttStudent);
          } catch (err) {
            toast.error(err.message || 'Failed to save attendance');
          } finally {
            setSavingAttendance(false);
          }
        };

        const selStudent = allStudents.find(s => s.id?.toString() === selectedAttStudent);
        const statusColor = { present: 'var(--color-accent)', absent: 'var(--color-rose)', late: 'var(--color-amber)' };
        const statusBadgeCls = { present: 'bd-success', absent: 'bd-rose', late: 'bd-amber' };

        return (
          <div className="glass card ani-up">
            <div className="section-title">✅ Attendance</div>

            {/* Student selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: 6 }}>Select Student</label>
              {allStudents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No enrolled students yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {allStudents.filter(s => s).map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        const sid = s.id?.toString();
                        setSelectedAttStudent(sid);
                        setMarkingNewAtt(false);
                        setNewAttDate(today);
                        setNewAttStatus('present');
                        loadStudentAtt(sid);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                        borderRadius: 99, border: '2px solid',
                        borderColor: selectedAttStudent === s.id?.toString() ? 'var(--color-accent)' : 'var(--color-border)',
                        background: selectedAttStudent === s.id?.toString() ? 'var(--grad-accent)' : 'transparent',
                        color: selectedAttStudent === s.id?.toString() ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '.87rem',
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student detail pane */}
            {selectedAttStudent && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--grad-primary)', color: '#fff' }}>{selStudent?.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selStudent?.name}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        {(selStudent?.subjectsEnrolled ?? []).join(', ') || selStudent?.planName || ''}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setMarkingNewAtt(v => !v); setNewAttDate(today); setNewAttStatus('present'); }}
                  >
                    {markingNewAtt ? 'Cancel' : '+ Mark Session'}
                  </button>
                </div>

                {/* Mark new session form */}
                {markingNewAtt && (
                  <div style={{
                    background: 'var(--color-surface)', borderRadius: 12, padding: '16px 20px',
                    marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '.85rem', display: 'block', marginBottom: 4 }}>Date</label>
                      <input
                        type="date" className="input" style={{ maxWidth: 180 }}
                        value={newAttDate} max={today}
                        onChange={e => setNewAttDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '.85rem', display: 'block', marginBottom: 4 }}>Status</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['present', 'absent', 'late'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setNewAttStatus(opt)}
                            className={`btn btn-sm ${newAttStatus === opt ? (opt === 'present' ? 'btn-accent' : opt === 'absent' ? 'btn-rose' : 'btn-amber') : 'btn-ghost'}`}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleMarkNew}
                      disabled={savingAttendance}
                    >
                      {savingAttendance ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}

                {/* Summary stats */}
                {attHistoryLoading && <p style={{ color: 'var(--text-muted)' }}>Loading history…</p>}
                {!attHistoryLoading && attHistory && (() => {
                  const { summary, records } = attHistory;
                  return (
                    <>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                        {[
                          { label: 'Sessions', val: summary.total, color: 'var(--text-primary)' },
                          { label: 'Present', val: summary.present, color: 'var(--color-accent)' },
                          { label: 'Absent', val: summary.absent, color: 'var(--color-rose)' },
                          { label: 'Late', val: summary.late, color: 'var(--color-amber)' },
                          { label: 'Attendance %', val: summary.percentage + '%', color: summary.percentage >= 75 ? 'var(--color-accent)' : 'var(--color-rose)' },
                        ].map(item => (
                          <div key={item.label} style={{
                            background: 'var(--color-surface)', borderRadius: 10, padding: '10px 18px',
                            textAlign: 'center', border: '1px solid var(--color-border)', minWidth: 80,
                          }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.val}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
                          </div>
                        ))}
                      </div>

                      {records.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No attendance records yet.</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr><th>Date</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            {records.map(r => (
                              <tr key={r._id}>
                                <td style={{ fontWeight: 500 }}>
                                  {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td>
                                  <span className={`badge ${statusBadgeCls[r.status] ?? 'bd-muted'}`}
                                    style={{ color: statusColor[r.status] }}>
                                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      }

      case 'students': {
        const badgeMap = { pending: 'bd-amber', done: 'bd-accent', active: 'bd-success', inactive: 'bd-muted', completed: 'bd-accent', submitted: 'bd-primary', late: 'bd-rose', graded: 'bd-success', approved: 'bd-success' };
        return (
          <div className="glass card ani-up">
            <div className="section-title">👥 Student Overview</div>
            {d.students.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">👥</div>
                <div className="empty-title">No students enrolled yet</div>
                <div className="empty-desc">Students will appear here once they enrol with you.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Grade</th><th>Attendance</th><th>Last Score</th><th>HW Status</th><th>Status</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {d.students.filter(s => s).map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                          </div>
                        </td>
                        <td><span className="badge bd-primary">Gr {s.grade}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, color: s.attendance >= 80 ? 'var(--color-accent)' : 'var(--color-rose)' }}>{s.attendance}%</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: s.lastScore === '—' ? 'var(--text-muted)' : 'var(--color-amber)' }}>{s.lastScore}</span>
                        </td>
                        <td>{s.homeworkStatus === '—' ? <span style={{ color: 'var(--text-muted)' }}>—</span> : <span className={`badge ${badgeMap[s.homeworkStatus] || 'bd-muted'}`}>{s.homeworkStatus}</span>}</td>
                        <td><span className={`badge ${badgeMap[s.status] || 'bd-muted'}`}>{s.status || '—'}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.8rem', maxWidth: 180 }}>{s.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      case 'topics':
        return (
          <div className="flex-col gap-lg">
            <div className="glass card ani-up">
              <div className="section-title">📚 Add Topic Covered</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-input form-select" value={topicForm.student} onChange={e => setTopicForm(p => ({ ...p, student: e.target.value }))}>
                    <option value="">— Select student —</option>
                    {(d.students ?? []).filter(s => s).map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade || 'No grade'})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <input type="text" className="form-input" placeholder="e.g. Integration by Parts" value={topicForm.topic} onChange={e => setTopicForm(p => ({ ...p, topic: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={topicForm.date} onChange={e => setTopicForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Teacher Notes</label>
                  <textarea className="form-input" placeholder="Key points, homework references, exam tips…" value={topicForm.notes} onChange={e => setTopicForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-accent" style={{ marginTop: 14 }} disabled={savingTopic} onClick={handleAddTopic}>
                {savingTopic ? 'Saving…' : 'Save Topic'}
              </button>
            </div>

            {/* Existing topics */}
            <div className="glass card ani-up">
              <div className="section-title">📋 Topics Covered</div>
              {topicsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : topicsList.length === 0 ? (
                <div className="empty-box"><div className="empty-icon">📚</div><div className="empty-title">No topics yet</div><div className="empty-desc">Add a topic above and it will appear here.</div></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Student</th><th>Topic</th><th>Date</th><th>Notes</th><th></th></tr></thead>
                    <tbody>
                      {topicsList.map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>{t.studentName}</td>
                          <td>{t.topic}</td>
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.date}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '.82rem', maxWidth: 200 }}>{t.notes || '—'}</td>
                          <td><button className="btn btn-rose btn-sm" disabled={deletingTopic === t.id} onClick={() => handleDeleteTopic(t.id)}>{deletingTopic === t.id ? '…' : '🗑'}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="flex-col gap-lg">
            <div className="glass card ani-up">
              <div className="section-title">📝 Assign Homework</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Assign To Students <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.78rem' }}>(leave empty to assign to all enrolled students)</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', minHeight: 44 }}>
                    {d.students.length === 0 && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>No students enrolled yet</span>}
                    {d.students.filter(s => s).map(s => {
                      const checked = homeworkForm.studentIds.includes(s.id);
                      return (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', borderRadius: 20, background: checked ? 'var(--color-primary)' : 'var(--color-bg)', border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`, color: checked ? '#fff' : 'var(--text-primary)', fontSize: '.82rem', fontWeight: checked ? 600 : 400, transition: 'all .15s', userSelect: 'none' }}>
                          <input type="checkbox" style={{ display: 'none' }} checked={checked} onChange={() => setHomeworkForm(p => ({ ...p, studentIds: checked ? p.studentIds.filter(id => id !== s.id) : [...p.studentIds, s.id] }))} />
                          {checked ? '✓ ' : ''}{s.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignment Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Chapter 7 – Integrals" value={homeworkForm.title} onChange={e => setHomeworkForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={homeworkForm.due} onChange={e => setHomeworkForm(p => ({ ...p, due: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Points</label>
                  <input type="number" className="form-input" value="10" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" placeholder="Describe the assignment…" value={homeworkForm.desc} onChange={e => setHomeworkForm(p => ({ ...p, desc: e.target.value }))} />
                </div>

                {/* ── File attachment zone ── */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">📎 Attach File (optional · PDF, DOC, JPG, PNG · Max 10 MB)</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setHwDrag(true); }}
                    onDragLeave={() => setHwDrag(false)}
                    onDrop={e => { e.preventDefault(); setHwDrag(false); validateHwFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('hw-file-input').click()}
                    className={`drop-zone${hwDrag ? ' drop-zone--active' : hwFile ? ' drop-zone--done' : ''}`}
                  >
                    <input id="hw-file-input" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => validateHwFile(e.target.files[0])} />
                    {hwFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1.8rem' }}>📄</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{hwFile.name}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{(hwFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setHwFile(null); setHwFileErr(''); }}
                          style={{ marginLeft: 8, background: 'var(--color-rose)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem' }}
                        >Remove</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📁</div>
                        <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: 3 }}>Drag & drop a file or click to browse</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Question papers, worksheets, reference PDFs</div>
                      </>
                    )}
                  </div>
                  {hwFileErr && <div style={{ color: 'var(--color-rose)', fontSize: '.78rem', marginTop: 6 }}>⚠ {hwFileErr}</div>}
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={handleAssignHomework} disabled={savingHomework}>
                {savingHomework ? 'Assigning…' : 'Assign Homework'}
              </button>
            </div>

            {/* Submission tracker */}
            <div className="glass card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>📊 Submission Tracker</div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '.78rem', padding: '5px 14px' }}
                  onClick={loadAssignments}
                  disabled={assignmentsLoading}
                >
                  {assignmentsLoading ? '⏳ Refreshing…' : '🔄 Refresh'}
                </button>
              </div>
              {assignmentsLoading && liveAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Assignment</th><th>Students</th><th>Due</th><th>Submitted</th><th>Attachment</th><th>Progress</th><th></th></tr>
                  </thead>
                  <tbody>
                    {liveAssignments.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No assignments yet</td></tr>
                    )}
                    {liveAssignments.map((a) => (
                      <Fragment key={a.id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedAssignment(expandedAssignment === a.id ? null : a.id)}>
                          <td style={{ fontWeight: 600 }}>{a.title}</td>
                          <td><span className="badge bd-primary">{a.total} student{a.total !== 1 ? 's' : ''}</span></td>
                          <td style={{ color: 'var(--text-secondary)' }}>{a.due}</td>
                          <td style={{ fontWeight: 700, color: a.submitted > 0 ? 'var(--color-accent)' : 'var(--text-muted)' }}>{a.submitted}/{a.total}</td>
                          <td>
                            {a.fileUrl
                              ? <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); openFile(a.fileUrl); }} style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '.8rem' }}>📎 View</a>
                              : <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>—</span>
                            }
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="progress-bar" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{ width: `${a.total > 0 ? Math.round((a.submitted / a.total) * 100) : 0}%`, background: 'var(--grad-accent)' }} />
                              </div>
                              <span style={{ fontSize: '.8rem', fontWeight: 600 }}>{a.total > 0 ? Math.round((a.submitted / a.total) * 100) : 0}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '.85rem' }}>{expandedAssignment === a.id ? '▲' : '▼'}</td>
                        </tr>
                        {expandedAssignment === a.id && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0, background: 'var(--color-surface)' }}>
                              <div style={{ padding: '12px 16px' }}>
                                {a.submissions.length === 0 ? (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', padding: '8px 0' }}>No submissions yet.</div>
                                ) : (
                                  <div style={{ overflowX: 'auto' }}>
                                  <table className="data-table" style={{ fontSize: '.82rem' }}>
                                    <thead>
                                      <tr><th>Student</th><th>Submitted At</th><th>File</th><th>Note</th><th>Status</th><th>Grade / 10</th><th>Remark</th><th>Action</th></tr>
                                    </thead>
                                    <tbody>
                                      {a.submissions.filter(s => s).map(s => {
                                        const g = gradingMap[s.id] || {};
                                        const gradeVal = g.grade !== undefined ? g.grade : (s.grade ?? '');
                                        const remarkVal = g.remark !== undefined ? g.remark : (s.teacherRemark || '');
                                        return (
                                          <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.studentName}<br /><span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.75rem' }}>{s.studentRollNo}</span></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{s.submittedAt}</td>
                                            <td>
                                              {s.fileUrl
                                                ? <a href="#" onClick={e => { e.preventDefault(); openFile(s.fileUrl); }} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>📎 View</a>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{s.note || '—'}</td>
                                            <td><span className={`badge ${s.status === 'graded' ? 'bd-success' : s.status === 'late' ? 'bd-rose' : 'bd-amber'}`}>{s.status}</span></td>
                                            <td>
                                              <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                className="form-input"
                                                style={{ width: 70, padding: '4px 8px', fontSize: '.82rem' }}
                                                placeholder={`0–10`}
                                                value={gradeVal}
                                                onChange={e => setGradingMap(p => ({ ...p, [s.id]: { ...p[s.id], grade: e.target.value } }))}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-input"
                                                style={{ width: 140, padding: '4px 8px', fontSize: '.82rem' }}
                                                placeholder="Add remark…"
                                                value={remarkVal}
                                                onChange={e => setGradingMap(p => ({ ...p, [s.id]: { ...p[s.id], remark: e.target.value } }))}
                                              />
                                            </td>
                                            <td>
                                              <button
                                                className="btn btn-primary"
                                                style={{ fontSize: '.75rem', padding: '4px 12px', whiteSpace: 'nowrap' }}
                                                disabled={g.saving || gradeVal === ''}
                                                onClick={() => handleGrade(s.id, gradeVal, remarkVal)}
                                              >
                                                {g.saving ? '…' : s.status === 'graded' ? '✏️ Update' : '✅ Grade'}
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'performance': {
        // Per-student line chart data
        const selectedStudentNotes = perfChartStudent
          ? [...perfNotes].filter(n => String(n.studentId) === perfChartStudent && n.score != null).reverse()
          : [];
        const hasLineData = selectedStudentNotes.length > 0;
        const lineData = {
          labels: selectedStudentNotes.map(n => n.date),
          datasets: [{
            label: 'Score %',
            data: selectedStudentNotes.map(n => n.score),
            fill: true,
            tension: 0.4,
            borderColor: 'rgba(124,92,252,1)',
            backgroundColor: 'rgba(124,92,252,0.12)',
            pointBackgroundColor: 'rgba(124,92,252,1)',
            pointRadius: 5,
          }],
        };
        const lineOpts = {
          ...chartOpts,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, ticks: { color: isDark ? '#aaa' : '#555', callback: v => v + '%' }, grid: { color: isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)' } },
            x: { ticks: { color: isDark ? '#aaa' : '#555' }, grid: { display: false } },
          },
        };
        return (
          <div className="flex-col gap-lg">
            <div className="glass card ani-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>📊 Student Performance Chart</div>
                <select
                  className="form-input form-select"
                  style={{ width: 200, padding: '6px 10px', fontSize: '.84rem' }}
                  value={perfChartStudent}
                  onChange={e => setPerfChartStudent(e.target.value)}
                >
                  <option value="">All students (overview)</option>
                  {(d?.students ?? []).filter(s => s).map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ position: 'relative', height: 280 }}>
                {perfChartStudent ? (
                  hasLineData
                    ? <Line key={`line-${perfChartStudent}-${isDark}`} data={lineData} options={lineOpts} />
                    : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <div style={{ fontWeight: 600 }}>No scores for this student yet</div>
                        <div style={{ fontSize: '.8rem', textAlign: 'center' }}>Add a performance note below to start tracking progress</div>
                      </div>
                ) : (
                  !hasBarData
                    ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <div style={{ fontWeight: 600 }}>No scores yet</div>
                        <div style={{ fontSize: '.8rem', textAlign: 'center' }}>Grade an assignment or add a performance note below to see scores here</div>
                      </div>
                    : <Bar key={`bar-perf-${isDark}`} data={barData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                )}
              </div>
            </div>
            <div className="glass card ani-up">
              <div className="section-title">📝 Add Performance Note</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-input form-select" value={noteForm.student} onChange={e => setNoteForm(p => ({ ...p, student: e.target.value }))}>
                    <option value="">Select student…</option>
                    {d.students.filter(s => s).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Latest Score (%)</label>
                  <input type="number" className="form-input" placeholder="e.g. 89" min="0" max="100" value={noteForm.score} onChange={e => setNoteForm(p => ({ ...p, score: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Performance Note / Remark</label>
                  <textarea className="form-input" placeholder="Add a personalised remark visible to student and parent…" value={noteForm.note} onChange={e => setNoteForm(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={savingNote} onClick={handleAddNote}>
                {savingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>

            {/* Existing notes */}
            <div className="glass card ani-up">
              <div className="section-title">📋 Performance History</div>
              {perfLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : perfNotes.length === 0 ? (
                <div className="empty-box"><div className="empty-icon">📝</div><div className="empty-title">No notes yet</div><div className="empty-desc">Add a performance note above.</div></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Student</th><th>Score</th><th>Note</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {perfNotes.map(n => (
                        <tr key={n.id}>
                          <td style={{ fontWeight: 600 }}>{n.studentName}</td>
                          <td>{n.score !== null && n.score !== undefined ? <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{n.score}%</span> : '—'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem', maxWidth: 240 }}>{n.note || '—'}</td>
                          <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{n.date}</td>
                          <td><button className="btn btn-rose btn-sm" disabled={deletingNote === n.id} onClick={() => handleDeleteNote(n.id)}>{deletingNote === n.id ? '…' : '🗑'}</button></td>
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

      case 'feedback':
        return (
          <div className="flex-col gap-lg">
            {/* Summary card */}
            <div className="glass card ani-up" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {feedbackAvg || '—'}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Avg Rating</div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: s <= Math.round(feedbackAvg) ? '#f59e0b' : 'var(--text-muted)', fontSize: '1rem' }}>★</span>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>Student Reviews</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                  {feedbackTotal} review{feedbackTotal !== 1 ? 's' : ''} from your students
                </div>
              </div>
            </div>

            {/* Reviews list */}
            <div className="glass card ani-up">
              <div className="section-title">⭐ All Reviews</div>
              {feedbackLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>Loading…</div>
              ) : teacherFeedbacks.length === 0 ? (
                <div className="empty-box"><div className="empty-icon">⭐</div><div className="empty-title">No reviews yet</div><div className="empty-desc">Students will rate you after their sessions.</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {teacherFeedbacks.map((f, i) => (
                    <div key={f.id} className="glass" style={{ padding: '16px 18px', animationDelay: `${i * 60}ms` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div className="avatar avatar-sm" style={{ background: 'var(--grad-primary)', color: '#fff', flexShrink: 0 }}>
                            {(f.studentName || 'S').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '.92rem' }}>{f.studentName}</span>
                        </div>
                        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{f.date}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= f.rating ? '#f59e0b' : 'var(--text-muted)', fontSize: '.9rem' }}>★</span>
                        ))}
                      </div>
                      {f.text && <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', lineHeight: 1.6 }}>{f.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'studentSchedules': {
        const enrolledStudents = (d?.students ?? []).filter(s => s);
        // Find the selected student's data from the loaded list
        const selectedEntry = studentSlotsList.find(e => e.studentId === selectedStudentId);
        const selectedStudentSlots = (selectedEntry?.slots ?? []).filter(s => s);
        const slotsByDay = DAYS.reduce((m, day) => { m[day] = selectedStudentSlots.filter(s => s.day === day); return m; }, {});
        const hasAnySlot = selectedStudentSlots.length > 0;

        return (
          <div className="flex-col" style={{ gap: 24 }}>

            {/* ═══════ Student Picker ═══════ */}
            <div className="glass card ani-up">
              <div className="section-title">👤 Select a Student</div>
              {enrolledStudents.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No enrolled students</div>
                  <div className="empty-desc">Students will appear here once they enrol with you.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {enrolledStudents.filter(s => s).map(s => {
                    const isActive = selectedStudentId === s.id;
                    const entry = studentSlotsList.find(e => e.studentId === s.id);
                    const count = entry?.slots?.length ?? 0;
                    return (
                      <button
                        key={s.id}
                        className={`glass-flat`}
                        onClick={() => setSelectedStudentId(isActive ? '' : s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px', borderRadius: 'var(--radius-md)',
                          cursor: 'pointer', border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                          background: isActive ? 'rgba(124,92,252,.1)' : undefined,
                          transition: 'var(--transition)',
                        }}
                      >
                        <div className="avatar avatar-sm" style={{
                          background: isActive ? 'var(--grad-primary)' : 'var(--color-border)',
                          color: isActive ? '#fff' : 'var(--text-secondary)', fontSize: '.75rem',
                        }}>
                          {(s.name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{s.grade || 'No grade'} · {count} slot{count !== 1 ? 's' : ''}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ═══════ Selected Student's Weekly Schedule ═══════ */}
            {selectedStudentId && (
              <>
                {/* Schedule grid by day */}
                <div className="glass card ani-up">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                    <div className="section-title" style={{ margin: 0 }}>
                      🗓 Weekly Schedule — {enrolledStudents.find(s => s.id === selectedStudentId)?.name ?? 'Student'}
                    </div>
                    <span className="badge bd-primary" style={{ fontSize: '.75rem' }}>{selectedStudentSlots.length} slot{selectedStudentSlots.length !== 1 ? 's' : ''}</span>
                  </div>

                  {studentSlotsLoading ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                  ) : !hasAnySlot ? (
                    <div className="empty-box">
                      <div className="empty-icon">📅</div>
                      <div className="empty-title">No schedule slots yet</div>
                      <div className="empty-desc">Use the form below to add weekly slots for this student.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {DAYS.map(day => {
                        const daySlots = slotsByDay[day];
                        if (daySlots.length === 0) return null;
                        return (
                          <div key={day}>
                            <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="badge bd-primary" style={{ fontSize: '.72rem', minWidth: 36, textAlign: 'center' }}>{day}</span>
                              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{daySlots.length} session{daySlots.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {daySlots.map(slot => {
                                const isEditing = editingStudentSlot?._id === slot._id;
                                if (isEditing) {
                                  // Inline edit row
                                  return (
                                    <div key={slot._id} className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>Subject *</label>
                                          <input className="form-input" value={editingStudentSlot.subject} onChange={e => setEditingStudentSlot(p => ({ ...p, subject: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>Day</label>
                                          <select className="form-input form-select" value={editingStudentSlot.day} onChange={e => setEditingStudentSlot(p => ({ ...p, day: e.target.value }))}>
                                            {DAYS.map(d => <option key={d}>{d}</option>)}
                                          </select>
                                        </div>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>Start *</label>
                                          <input type="time" className="form-input" value={editingStudentSlot.startTime} onChange={e => setEditingStudentSlot(p => ({ ...p, startTime: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>End</label>
                                          <input type="time" className="form-input" value={editingStudentSlot.endTime || ''} onChange={e => setEditingStudentSlot(p => ({ ...p, endTime: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>Meeting Link</label>
                                          <input type="url" className="form-input" placeholder="https://zoom.us/…" value={editingStudentSlot.meetingLink || ''} onChange={e => setEditingStudentSlot(p => ({ ...p, meetingLink: e.target.value }))} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                          <label className="form-label" style={{ fontSize: '.72rem' }}>Notes</label>
                                          <input className="form-input" placeholder="Notes…" value={editingStudentSlot.notes || ''} onChange={e => setEditingStudentSlot(p => ({ ...p, notes: e.target.value }))} />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <button className="btn btn-primary btn-sm" disabled={savingStudentSlot} onClick={handleUpdateStudentSlot}>
                                          {savingStudentSlot ? 'Saving…' : '💾 Save'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingStudentSlot(null)}>Cancel</button>
                                      </div>
                                    </div>
                                  );
                                }
                                // Normal display row
                                return (
                                  <div key={slot._id} className="glass" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 160 }}>
                                      <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{slot.subject}</div>
                                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                        🕒 {slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ''}
                                        {slot.notes && <span> · 📝 {slot.notes}</span>}
                                      </div>
                                    </div>
                                    {slot.meetingLink && (
                                      <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ fontSize: '.75rem' }}>🔗 Join</a>
                                    )}
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingStudentSlot({ ...slot })} style={{ fontSize: '.75rem' }}>✏️ Edit</button>
                                    <button className="btn btn-rose btn-sm" disabled={deletingStudentSlot === slot._id} onClick={() => handleDeleteStudentSlot(slot._id)} style={{ fontSize: '.75rem' }}>
                                      {deletingStudentSlot === slot._id ? '…' : '🗑'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add New Slot for this student */}
                <div className="glass card ani-up">
                  <div className="section-title">➕ Add New Slot for {enrolledStudents.find(s => s.id === selectedStudentId)?.name ?? 'Student'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Day</label>
                      <select className="form-input form-select" value={studentSlotForm.day} onChange={e => setStudentSlotForm(p => ({ ...p, day: e.target.value }))}>
                        {DAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject *</label>
                      <input className="form-input" placeholder="e.g. Mathematics" value={studentSlotForm.subject} onChange={e => setStudentSlotForm(p => ({ ...p, subject: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Time *</label>
                      <input type="time" className="form-input" value={studentSlotForm.startTime} onChange={e => setStudentSlotForm(p => ({ ...p, startTime: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-input" value={studentSlotForm.endTime} onChange={e => setStudentSlotForm(p => ({ ...p, endTime: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Meeting Link</label>
                      <input type="url" className="form-input" placeholder="https://zoom.us/…" value={studentSlotForm.meetingLink} onChange={e => setStudentSlotForm(p => ({ ...p, meetingLink: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Notes</label>
                      <input className="form-input" placeholder="e.g. Bring textbook, Chapter 5" value={studentSlotForm.notes} onChange={e => setStudentSlotForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={savingStudentSlot} onClick={handleAddStudentSlot}>
                    {savingStudentSlot ? 'Adding…' : '➕ Add Slot & Notify Student'}
                  </button>
                </div>
              </>
            )}

            {/* Not-selected prompt */}
            {!selectedStudentId && enrolledStudents.length > 0 && (
              <div className="glass card ani-up" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>☝️</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Select a student above</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '.88rem' }}>Choose a student to view and manage their personalised weekly schedule.</div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  const sectionTitles = {
    dashboard: { title: 'Teacher Dashboard', sub: `Good day, ${d?.name ?? 'Teacher'}! Here's your teaching overview.` },
    demos: { title: 'Demo Classes', sub: 'View, schedule and manage free demo class requests from students.' },
    students: { title: 'Students', sub: 'View all students and their performance at a glance.' },
    studentSchedules: { title: 'Student Schedule', sub: 'Manage weekly slots and personalised student schedules.' },
    attendance: { title: 'Mark Attendance', sub: 'Record daily class attendance.' },
    topics: { title: 'Topics Covered', sub: 'Update syllabus progress for each class.' },
    assignments: { title: 'Assignments', sub: 'Assign homework and track submissions.' },
    performance: { title: 'Performance', sub: 'Add performance notes and remarks for students.' },
    feedback: { title: 'Student Feedback', sub: 'See ratings and reviews from your students.' },

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

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: 'rgba(0,212,170,.12)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,212,170,.3)', borderRadius: 'var(--radius-md)',
          padding: '14px 22px', color: 'var(--color-accent-2)', fontWeight: 600, fontSize: '.9rem',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          animation: 'fadeUp .3s ease',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
