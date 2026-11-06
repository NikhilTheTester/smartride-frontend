import { useState } from 'react';
import api, { errorMessage } from '../../api/api';
import usePolling from '../../hooks/usePolling';
import Alert from '../Alert';

/** Add / edit / delete employees or drivers. `role` is "EMPLOYEE" or "DRIVER". */
export default function UsersTab({ role }) {
  const isDriver = role === 'DRIVER';
  const empty = { name: '', email: '', password: '', phone: '', employeeCode: '', branch: '', licenseNumber: '' };
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      setUsers((await api.get('/admin/users', { params: { role } })).data);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };
  usePolling(load, 15000);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/users/${editId}`, { ...form, role });
        setMsg({ type: 'success', text: 'Updated successfully' });
      } else {
        await api.post('/admin/users', { ...form, role });
        setMsg({ type: 'success', text: 'Created successfully' });
      }
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const edit = (u) => {
    setEditId(u.id);
    setForm({
      name: u.name || '', email: u.email || '', password: '', phone: u.phone || '',
      employeeCode: u.employeeCode || '', branch: u.branch || '', licenseNumber: u.licenseNumber || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setMsg({ type: 'success', text: 'Deleted' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="card">
        <h3>{editId ? 'Edit' : 'Add'} {isDriver ? 'Driver' : 'Employee'}</h3>
        <form onSubmit={submit}>
          <div className="row gap wrap">
            <div className="grow"><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
            <div className="grow"><label>Email</label><input type="email" required disabled={!!editId} value={form.email} onChange={set('email')} /></div>
            <div className="grow">
              <label>Password {editId && '(leave blank to keep)'}</label>
              <input type="password" required={!editId} value={form.password} onChange={set('password')} />
            </div>
          </div>
          <div className="row gap wrap">
            <div className="grow"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
            {isDriver ? (
              <div className="grow"><label>Licence number</label><input value={form.licenseNumber} onChange={set('licenseNumber')} /></div>
            ) : (
              <>
                <div className="grow"><label>Employee ID</label><input value={form.employeeCode} onChange={set('employeeCode')} /></div>
                <div className="grow"><label>Branch</label><input value={form.branch} onChange={set('branch')} /></div>
              </>
            )}
          </div>
          <div className="row gap">
            <button className="btn btn-primary">{editId ? 'Update' : 'Add'}</button>
            {editId && <button type="button" className="btn btn-light" onClick={() => { setEditId(null); setForm(empty); }}>Cancel edit</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>{isDriver ? 'Drivers' : 'Employees'} ({users.length})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th>
                {isDriver ? <th>Licence</th> : <><th>Employee ID</th><th>Branch</th></>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td>
                  {isDriver ? <td>{u.licenseNumber}</td> : <><td>{u.employeeCode}</td><td>{u.branch}</td></>}
                  <td>
                    <div className="row gap">
                      <button className="btn btn-light" onClick={() => edit(u)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => remove(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
