import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
};

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
      toast.success('Welcome to TaskFlow!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid"></div>
      <div className="auth-card">
        <div className="auth-logo">
          <Zap size={28} />
          <span>TaskFlow</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start managing your team's work</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="signup-name"
              type="text" className="form-input"
              placeholder="Jane Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required autoFocus minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="signup-email"
              type="email" className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'} className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={6}
                style={{ paddingRight: 40 }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <>
                <div className="password-strength">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`strength-bar ${strength >= i ? 'active' : ''} ${strength >= 3 ? 'strong' : strength >= 2 ? 'medium' : ''}`} />
                  ))}
                </div>
                <div className="password-hint" style={{ color: strength >= 3 ? 'var(--green)' : strength >= 2 ? 'var(--yellow)' : 'var(--text-dim)' }}>
                  {strengthLabels[strength]}
                </div>
              </>
            )}
          </div>
          <button id="signup-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
