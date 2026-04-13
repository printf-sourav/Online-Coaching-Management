import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

/* ── Lazy-loaded pages for better initial load ── */
const Homepage         = lazy(() => import('./pages/Homepage'));
const Landing          = lazy(() => import('./pages/Landing'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const AdminLogin       = lazy(() => import('./pages/admin/AdminLogin'));
const TutorCatalog     = lazy(() => import('./pages/TutorCatalog'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));

/* ── Loading spinner shown while chunks load ── */
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', transition: 'background .3s' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)', borderRadius: '50%',
          animation: 'spin .8s linear infinite', margin: '0 auto 16px',
        }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem', fontWeight: 600 }}>Loading…</div>
      </div>
    </div>
  );
}

/* ── Global error boundary — shows the crash instead of blank white page ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', color: 'var(--text-primary)', fontFamily: 'monospace', padding: 32 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️ Something crashed</div>
          <pre className="alert alert-error" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '.8rem' }}>
            {error.message}{'\n'}{error.stack?.split('\n').slice(1, 5).join('\n')}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            className="btn btn-primary"
            style={{ marginTop: 18 }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }
}

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/tutors" element={<TutorCatalog />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <Register />} />
        <Route path="/admin/login" element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : <AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface-2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-border-2)',
                borderRadius: '14px',
                backdropFilter: 'blur(16px)',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '.875rem',
                fontWeight: 500,
                boxShadow: 'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#00d4aa', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ff6b9d', secondary: '#fff' } },
              duration: 2200,
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

