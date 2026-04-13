import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import StatCard from '../../components/StatCard';
import StarRating from '../../components/StarRating';
import { parentData, statusConfig } from '../../data/mockData';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const gradeColor = (g) => {
  switch(g) { case 'A+': return 'bd-success'; case 'A': return 'bd-accent'; case 'B+': return 'bd-primary'; default: return 'bd-muted'; }
};

const trendIcon = (t) => t === 'up' ? <span style={{ color: '#4ade80' }}>↑</span> : t === 'down' ? <span style={{ color: 'var(--color-rose)' }}>↓</span> : <span style={{ color: 'var(--color-amber)' }}>→</span>;

export default function ParentDashboard() {
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [payMethod, setPayMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTeacher, setFeedbackTeacher] = useState(parentData.teacherUpdates[0]?.teacher || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const d = parentData;
  const { isDark } = useTheme();

  const tickColor = isDark ? '#9898bb' : '#5a4e8a';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const chartOpts = {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor }, min: 60, max: 100 },
    },
  };

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };

  const lineData = {
    labels: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
    datasets: [{
      label: 'Score %', data: d.monthlyProgress,
      borderColor: '#7c5cfc', backgroundColor: 'rgba(124,92,252,.1)',
      tension: .4, fill: true, pointBackgroundColor: '#7c5cfc', pointRadius: 4,
    }],
  };

  const renderSection = () => {
    switch (section) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Child profile banner */}
            <div className="glass card ani-up" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--grad-primary)', opacity: .055, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <div className="avatar avatar-xl" style={{ background: 'var(--grad-primary)', color: '#fff', border: '3px solid rgba(124,92,252,.4)' }}>AS</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 4 }}>{d.child}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: 10 }}>{d.grade}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span className="badge bd-primary">📊 GPA: {d.childGpa}</span>
                    <span className={`badge ${d.childAttendance >= 85 ? 'bd-success' : 'bd-amber'}`}>✅ Attendance: {d.childAttendance}%</span>
                    <span className="badge bd-rose">📅 Fee Due: {d.nextDueDate}</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setSection('fees')}>Pay Fees →</button>
              </div>
            </div>

            {/* ── Redesigned Stats Hero ─────────────────── */}
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
                      stroke="url(#parentAttRing)" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - Math.min(100, d.childAttendance || 0) / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                    />
                    <defs>
                      <linearGradient id="parentAttRing" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00d4aa" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>{d.childAttendance}%</span>
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Child Attendance</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{d.childAttendance}%</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Overall class attendance</div>
                  <div style={{ marginTop: 2 }}>
                    <span className={`badge ${(d.childAttendance ?? 0) >= 85 ? 'bd-success' : (d.childAttendance ?? 0) >= 60 ? 'bd-amber' : 'bd-rose'}`} style={{ fontSize: '.7rem', fontWeight: 700 }}>
                      {(d.childAttendance ?? 0) >= 85 ? '✓ Good Standing' : (d.childAttendance ?? 0) >= 60 ? '⚠ Needs Improvement' : '✗ Critical'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPA card */}
              <div className="glass card ani-up" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(135deg,rgba(124,92,252,.09) 0%,rgba(167,139,250,.04) 100%)'
                  : 'linear-gradient(135deg,rgba(124,92,252,.10) 0%,rgba(167,139,250,.04) 100%)',
                border: '1.5px solid rgba(124,92,252,.28)',
                position: 'relative', overflow: 'hidden', animationDelay: '80ms',
              }}>
                <div style={{ position: 'absolute', right: -12, bottom: -12, fontSize: '5.5rem', lineHeight: 1, opacity: .07, pointerEvents: 'none' }}>🏆</div>
                <div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Current GPA</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{d.childGpa ?? '—'}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>Academic Year 2025-26</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>0.0</span><span>4.0</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'var(--grad-primary)', width: `${Math.min(100, (parseFloat(d.childGpa) || 0) / 4 * 100)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                </div>
              </div>

              {/* Fees stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(255,107,157,.09) 0%,rgba(244,63,94,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(255,107,157,.10) 0%,rgba(244,63,94,.04) 100%)',
                  border: '1.5px solid rgba(255,107,157,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '160ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(244,63,94,.35)' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Fees Due</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg,#ff6b9d,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>₹{d.pendingFees.toLocaleString()}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>due {d.nextDueDate}</div>
                  </div>
                </div>
                <div className="glass card ani-up" style={{
                  flex: 1, display: 'flex', gap: 16, alignItems: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg,rgba(252,196,28,.09) 0%,rgba(249,115,22,.04) 100%)'
                    : 'linear-gradient(135deg,rgba(252,196,28,.10) 0%,rgba(249,115,22,.04) 100%)',
                  border: '1.5px solid rgba(252,196,28,.28)',
                  padding: '16px 20px', position: 'relative', overflow: 'hidden', animationDelay: '240ms',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#ffb340,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 6px 18px rgba(249,115,22,.35)' }}>💰</div>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Total Paid</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg,#ffb340,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>₹{d.totalFeesPaid.toLocaleString()}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>this year</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance chart + Subject grid */}
            <div className="grid-2">
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(124,92,252,.10),rgba(167,139,250,.05))', borderBottom: '1px solid rgba(124,92,252,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(124,92,252,.35)' }}>📈</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Monthly Score Trend</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Score % over recent months</div>
                  </div>
                </div>
                <div style={{ padding: '16px 20px 20px', position: 'relative', height: 220 }}>
                  <Line key={`line-dash-${isDark}`} data={lineData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(0,212,170,.10),rgba(56,189,248,.05))', borderBottom: '1px solid rgba(0,212,170,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(0,212,170,.35)' }}>📚</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Subject Grades</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Performance by subject</div>
                  </div>
                  <span className="badge bd-accent" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.subjects.length} subjects</span>
                </div>
                <div style={{ padding: '8px 20px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.subjects.map((sub, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < d.subjects.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: 2 }}>{sub.name}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{sub.teacher}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{trendIcon(sub.trend)}</div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', width: 40, textAlign: 'center' }}>{sub.score}%</div>
                        <span className={`badge ${gradeColor(sub.grade)}`}>{sub.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher updates */}
            <div className="glass card ani-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '180ms' }}>
              <div style={{ padding: '16px 22px 14px', background: 'linear-gradient(135deg,rgba(252,196,28,.10),rgba(249,115,22,.05))', borderBottom: '1px solid rgba(252,196,28,.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#ffb340,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', boxShadow: '0 4px 12px rgba(249,115,22,.35)' }}>🏫</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-primary)' }}>Latest Teacher Updates</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Recent remarks &amp; feedback</div>
                </div>
                {d.teacherUpdates.length > 0 && <span className="badge bd-amber" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>{d.teacherUpdates.length} updates</span>}
              </div>
              <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {d.teacherUpdates.map((u, i) => (
                  <div key={i} className="glass" style={{ padding: '14px 16px', borderLeft: `3px solid ${u.type === 'positive' ? 'var(--color-accent)' : 'var(--color-amber)'}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{u.teacher}</span>
                      <span className="badge bd-sky">{u.subject}</span>
                      <span className={`badge ${u.type === 'positive' ? 'bd-success' : 'bd-amber'}`}>{u.type === 'positive' ? '✓ Positive' : '💡 Suggestion'}</span>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{u.date}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', lineHeight: 1.7 }}>{u.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="glass card ani-up">
              <div className="section-title">📈 Progress Over Time</div>
              <div style={{ position: 'relative', height: 300 }}>
                <Line key={`line-perf-${isDark}`} data={lineData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                </div>
            </div>
            <div className="glass card ani-up">
              <div className="section-title">📚 Subject Performance Details</div>
              <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Teacher</th><th>Score</th><th>Attendance</th><th>Grade</th><th>Trend</th></tr>
                </thead>
                <tbody>
                  {d.subjects.map((sub, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{sub.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{sub.teacher}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div className="progress-fill" style={{ width: `${sub.score}%`, background: 'var(--grad-primary)' }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{sub.score}%</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: sub.attendance >= 80 ? 'var(--color-accent)' : 'var(--color-amber)' }}>{sub.attendance}%</span></td>
                      <td><span className={`badge ${gradeColor(sub.grade)}`}>{sub.grade}</span></td>
                      <td style={{ fontSize: '1.1rem' }}>{trendIcon(sub.trend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="stats-grid">
              <StatCard icon="✅" label="Overall" value={`${d.childAttendance}%`} grad="var(--grad-accent)" />
              <StatCard icon="📊" label="Best" value="90%" sub="English" grad="var(--grad-primary)" />
            </div>
            <div className="glass card">
              <div className="section-title">📊 Attendance by Subject</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {d.subjects.map((sub, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{sub.name}</span>
                      <span style={{ fontWeight: 700, fontSize: '.875rem', color: sub.attendance >= 85 ? 'var(--color-accent)' : 'var(--color-amber)' }}>{sub.attendance}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${sub.attendance}%`, background: sub.attendance >= 85 ? 'var(--grad-accent)' : 'var(--grad-amber)', transition: 'width 1.2s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {d.teacherUpdates.map((u, i) => (
              <div key={i} className="glass card ani-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div className="avatar avatar-lg" style={{ background: u.type === 'positive' ? 'var(--grad-accent)' : 'var(--grad-amber)', color: '#fff', flexShrink: 0 }}>
                    {u.teacher.split(' ').filter(w => w[0] === w[0].toUpperCase()).map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.teacher}</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{u.subject}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`badge ${u.type === 'positive' ? 'bd-success' : 'bd-amber'}`}>{u.type === 'positive' ? '✓ Positive' : '💡 Suggestion'}</span>
                        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{u.date}</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '.9rem', lineHeight: 1.75, padding: '12px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${u.type === 'positive' ? 'var(--color-accent)' : 'var(--color-amber)'}` }}>
                      {u.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'fees':
        return (
          <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Fee history */}
            <div className="glass card ani-up">
              <div className="section-title">📜 Fee History</div>
              <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Month</th><th>Amount</th><th>Date</th><th>Status</th><th>TXN</th></tr>
                </thead>
                <tbody>
                  {d.feeHistory.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{f.month}</td>
                      <td style={{ fontWeight: 700 }}>₹{f.amount.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{f.date}</td>
                      <td><span className={`badge ${statusConfig[f.status]?.cls || 'bd-muted'}`}>{statusConfig[f.status]?.label}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '.8rem', color: 'var(--text-muted)' }}>{f.txn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Payment card */}
            <div className="glass card ani-up">
              <div className="section-title">💳 Pay Due Amount</div>

              {/* Due amount banner */}
              <div style={{ background: 'rgba(255,107,157,.08)', border: '1px solid rgba(255,107,157,.18)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Amount Due</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--grad-rose)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{d.pendingFees.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Due Date</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-rose)' }}>{d.nextDueDate}</div>
                </div>
              </div>

              {payStep === 1 ? (
                <>
                  {/* Payment method */}
                  <div style={{ marginBottom: 20 }}>
                    <div className="form-label" style={{ marginBottom: 12 }}>Choose Payment Method</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      {[
                        { id: 'card', label: 'Card', icon: '💳' },
                        { id: 'upi', label: 'UPI', icon: '📱' },
                        { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPayMethod(m.id)}
                          className={`btn ${payMethod === m.id ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ flexDirection: 'column', padding: '14px 8px', gap: 4, height: 'auto' }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                          <span style={{ fontSize: '.78rem' }}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {payMethod === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <input type="text" className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}
                          value={cardNum}
                          onChange={e => setCardNum(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim())}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cardholder Name</label>
                        <input type="text" className="form-input" placeholder="Name as on card" value={cardName} onChange={e => setCardName(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                        <div className="form-group">
                          <label className="form-label">Expiry</label>
                          <input type="text" className="form-input" placeholder="MM/YY" maxLength={5} value={cardExp} onChange={e => setCardExp(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input type="password" className="form-input" placeholder="•••" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {payMethod === 'upi' && (
                    <div className="form-group">
                      <label className="form-label">UPI ID</label>
                      <input type="text" className="form-input" placeholder="yourname@upi" />
                    </div>
                  )}

                  {payMethod === 'netbanking' && (
                    <div className="form-group">
                      <label className="form-label">Select Bank</label>
                      <select className="form-input form-select">
                        <option>SBI – State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '12px 14px', background: 'rgba(0,212,170,.07)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,212,170,.15)' }}>
                    <span style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>🔒</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>256-bit SSL encrypted. Your payment details are completely secure.</span>
                  </div>

                  <button className="btn btn-accent btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => setPayStep(2)}>
                    Pay ₹{d.pendingFees.toLocaleString()} Securely →
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 8, color: 'var(--color-accent)' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>₹{d.pendingFees.toLocaleString()} paid for March 2026</p>
                  <div style={{ display: 'inline-flex', gap: 8, padding: '10px 20px', background: 'rgba(0,212,170,.1)', border: '1px solid rgba(0,212,170,.2)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>TXN ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '.85rem', color: 'var(--color-accent)' }}>TXN2026030001</span>
                  </div>
                  <br />
                  <button className="btn btn-ghost btn-sm" onClick={() => setPayStep(1)}>← Pay Another Fee</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div style={{ maxWidth: 560 }}>
            <div className="glass card ani-up">
              <div className="section-title">⭐ Provide Feedback</div>
              {feedbackSubmitted ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 14 }}>🙏</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-accent)' }}>Feedback Received!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Thank you for taking the time to share your thoughts.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setFeedbackSubmitted(true); setTimeout(() => { setFeedbackSubmitted(false); setFeedbackRating(0); setFeedbackText(''); }, 4000); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Teacher</label>
                    <select className="form-input form-select" value={feedbackTeacher} onChange={e => setFeedbackTeacher(e.target.value)}>
                      {d.teacherUpdates.map(u => <option key={u.teacher}>{u.teacher} – {u.subject}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {feedbackRating > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][feedbackRating] + ` (${feedbackRating}/5)` : 'Tap to rate'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comments</label>
                    <textarea className="form-input" placeholder="Share your observations about the teaching quality, communication, and your child's progress…" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={feedbackRating === 0} style={{ alignSelf: 'flex-start' }}>
                    Submit Feedback →
                  </button>
                </form>
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  const sectionTitles = {
    dashboard: { title: "Parent Dashboard", sub: `Welcome, ${d.name}! Here's ${d.child}'s academic overview.` },
    performance: { title: 'Academic Performance', sub: `${d.child}'s subject-wise performance and trends.` },
    attendance: { title: 'Attendance Records', sub: "Track your child's attendance across all subjects." },
    updates: { title: 'Teacher Updates', sub: 'Latest notes and feedback from teachers.' },
    fees: { title: 'Fee Payment', sub: 'View dues and make secure payments.' },
    feedback: { title: 'Feedback', sub: 'Submit your ratings and reviews for teachers.' },
  };

  return (
    <div className="dash-layout">
      <div className="mesh-bg" />
      <Sidebar active={section} onNav={setSection} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dash-main">
        <Topbar title={sectionTitles[section]?.title || ''} subtitle={sectionTitles[section]?.sub || ''} onMenuClick={() => setSidebarOpen(true)} />
        <div className="dash-content">
          {renderSection()}
        </div>
      </main>

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: 'rgba(0,212,170,.12)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,212,170,.3)', borderRadius: 'var(--radius-md)',
          padding: '14px 22px', color: 'var(--color-accent-2)', fontWeight: 600, fontSize: '.9rem',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)', animation: 'fadeUp .3s ease',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
