import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import { errorMessage } from '../api/api';
import Alert from '../components/Alert';

const DEMO = [
  { label: 'Admin', email: 'admin@smartride.com', password: 'admin123' },
  { label: 'Driver', email: 'driver1@smartride.com', password: 'driver123' },
  { label: 'Employee', email: 'emp1@smartride.com', password: 'emp123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const user = await login(form.email, form.password);
      navigate(homeFor(user.role));
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Welcome to Smart Ride</h2>
        <p className="muted">Corporate cab management with automatic drop alerts</p>
        <Alert msg={msg} />
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label>Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="center">
          New employee? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo-box">
          <small>Demo logins (click to fill):</small>
          <div className="row gap">
            {DEMO.map((d) => (
              <button key={d.label} type="button" className="btn btn-light" onClick={() => setForm({ email: d.email, password: d.password })}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
