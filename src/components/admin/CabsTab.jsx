import { useState } from 'react';
import api, { errorMessage } from '../../api/api';
import usePolling from '../../hooks/usePolling';
import Alert from '../Alert';
import StatusBadge from '../StatusBadge';

/** Add / edit / delete cabs, choose the driver of each cab and run route optimization. */
export default function CabsTab() {
  const empty = { cabNumber: '', model: '', capacity: 4, driverId: '' };
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const [c, d] = await Promise.all([api.get('/admin/cabs'), api.get('/admin/users', { params: { role: 'DRIVER' } })]);
      setCabs(c.data);
      setDrivers(d.data);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };
  usePolling(load, 10000);

  const submit = async (e) => {
    e.preventDefault();
    const body = { ...form, capacity: Number(form.capacity), driverId: form.driverId ? Number(form.driverId) : null };
    try {
      if (editId) await api.put(`/admin/cabs/${editId}`, body);
      else await api.post('/admin/cabs', body);
      setMsg({ type: 'success', text: editId ? 'Cab updated' : 'Cab added' });
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const edit = (c) => {
    setEditId(c.id);
    setForm({ cabNumber: c.cabNumber, model: c.model || '', capacity: c.capacity, driverId: c.driver ? c.driver.id : '' });
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete cab ${c.cabNumber}?`)) return;
    try {
      await api.delete(`/admin/cabs/${c.id}`);
      setMsg({ type: 'success', text: 'Cab deleted' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const optimize = async (c) => {
    try {
      const res = await api.post(`/admin/cabs/${c.id}/optimize`);
      const order = res.data.map((b) => `${b.dropSequence}. ${b.employee.name} (${b.dropLocation.name})`).join('  →  ');
      setMsg({ type: 'success', text: res.data.length ? `Best drop order for ${c.cabNumber}: ${order}` : `No passengers assigned to ${c.cabNumber} today` });
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="card">
        <h3>{editId ? 'Edit' : 'Add'} Cab</h3>
        <form onSubmit={submit}>
          <div className="row gap wrap">
            <div className="grow"><label>Cab number</label><input required value={form.cabNumber} onChange={(e) => setForm({ ...form, cabNumber: e.target.value })} /></div>
            <div className="grow"><label>Model</label><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div className="grow"><label>Seats</label><input type="number" min="1" max="30" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div className="grow">
              <label>Driver</label>
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">No driver</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="row gap">
            <button className="btn btn-primary">{editId ? 'Update' : 'Add cab'}</button>
            {editId && <button type="button" className="btn btn-light" onClick={() => { setEditId(null); setForm(empty); }}>Cancel edit</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Cabs ({cabs.length})</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cab</th><th>Model</th><th>Seats</th><th>Driver</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {cabs.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.cabNumber}</b></td><td>{c.model}</td><td>{c.capacity}</td>
                  <td>{c.driver ? c.driver.name : <span className="muted">none</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="row gap wrap">
                      <button className="btn btn-light" onClick={() => optimize(c)}>⚡ Optimize route</button>
                      <button className="btn btn-light" onClick={() => edit(c)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => remove(c)}>Delete</button>
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
