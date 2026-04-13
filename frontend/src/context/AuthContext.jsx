import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin, apiLogout, apiGetMe, apiRefreshToken,
  apiRegister, apiVerifyRegister, apiResendOTP,
  apiForgotPassword, apiResetPassword, apiUpdateProfile,
} from '../api';

const AUTH_KEY = 'edunova-user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);

  // ── Persist user to localStorage whenever it changes ──────────────────────
  const saveUser = (u) => {
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    else    localStorage.removeItem(AUTH_KEY);
    setUser(u);
  };

  // ── Silently refresh session on mount (if cookies are valid) ──────────────
  useEffect(() => {
    if (user) {
      apiGetMe()
        .then(res => saveUser({ ...user, ...res.data }))
        .catch(() => {
          // try refreshing the access token once
          apiRefreshToken()
            .then(() => apiGetMe().then(res => saveUser({ ...user, ...res.data })))
            .catch(() => saveUser(null));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── register: Step 1 – sends OTP ──────────────────────────────────────────
  const register = useCallback(async (name, email, password, mobileNumber) => {
    setLoading(true);
    try {
      await apiRegister(name, email, password, mobileNumber);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── verifyOTP: Step 2 – creates account ───────────────────────────────────
  const verifyOTP = useCallback(async (email, otp) => {
    setLoading(true);
    try {
      await apiVerifyRegister(email, otp);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── resendOTP ─────────────────────────────────────────────────────────────
  const resendOTP = useCallback(async (email) => {
    await apiResendOTP(email);
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await apiLogin(email, password);
      const meRes = await apiGetMe();
      const profile = meRes.data;
      saveUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    saveUser(null);
  }, []);

  // ── forgotPassword: sends reset OTP ───────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    await apiForgotPassword(email);
  }, []);

  // ── resetPassword ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email, otp, newPassword) => {
    await apiResetPassword(email, otp, newPassword);
  }, []);

  // ── updateUser: merge new fields into cached user ─────────────────
  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...(prev || {}), ...newData };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      register, verifyOTP, resendOTP,
      login, logout,
      forgotPassword, resetPassword,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

