import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/api';
import Alert from '../components/Alert';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', employeeCode: '', branch: '' });
  const [msg, setMsg] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setMsg({ type: 'success', text: 'Account created! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Employee Registration</h2>
        <Alert msg={msg} />
        <form onSubmit={submit}>
          <label>Full name</label>
          <input required value={form.name} onChange={set('name')} />
          <label>Email</label>
          <input type="email" required value={form.email} onChange={set('email')} />
          <label>Password</label>
          <input type="password" required minLength={4} value={form.password} onChange={set('password')} />
          <label>Phone</label>
          <input value={form.phone} onChange={set('phone')} />
          <div className="row gap">
            <div className="grow">
              <label>Employee ID</label>
              <input value={form.employeeCode} onChange={set('employeeCode')} />
            </div>
            <div className="grow">
              <label>Branch</label>
              <input value={form.branch} onChange={set('branch')} />
            </div>
          </div>
          <button className="btn btn-primary btn-block">Register</button>
        </form>
        <p className="center">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
