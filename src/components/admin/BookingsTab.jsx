import { useState } from 'react';
import api, { errorMessage } from '../../api/api';
import usePolling from '../../hooks/usePolling';
import Alert from '../Alert';
import StatusBadge from '../StatusBadge';

const STATUSES = ['ALL', 'REQUESTED', 'ASSIGNED', 'BOARDED', 'DROPPED', 'NO_SHOW', 'CANCELLED'];

/** All bookings, assign a cab to a request, filter and export a CSV report. */
export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [choice, setChoice] = useState({}); // bookingId -> selected cabId
  const [filter, setFilter] = useState('ALL');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const [b, c] = await Promise.all([api.get('/admin/bookings'), api.get('/admin/cabs')]);
      setBookings(b.data);
      setCabs(c.data);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };
  usePolling(load, 5000);

  const assign = async (b) => {
    const cabId = choice[b.id] || (b.cab ? b.cab.id : '');
    if (!cabId) {
      setMsg({ type: 'error', text: 'Please select a cab first' });
      return;
    }
    try {
      await api.put(`/admin/bookings/${b.id}/assign`, { cabId: Number(cabId) });
      setMsg({ type: 'success', text: `${b.employee.name} assigned. Drop order was optimized automatically.` });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const shown = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  const exportCsv = () => {
    const header = ['ID', 'Date', 'Shift', 'Employee', 'Pickup', 'Drop', 'Cab', 'Driver', 'Status', 'Rating'];
    const rows = shown.map((b) => [
      b.id, b.tripDate, b.shiftTime, b.employee.name, b.pickupLocation.name, b.dropLocation.name,
      b.cab?.cabNumber || '', b.cab?.driver?.name || '', b.status, b.rating || '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-ride-bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div className="row between wrap">
        <h3>Bookings ({shown.length})</h3>
        <div className="row gap">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-light" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
      </div>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Employee</th><th>Route</th><th>Status</th><th>Cab</th><th>Drop #</th><th>Assign cab</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan="7" className="center muted">No bookings</td></tr>}
            {shown.map((b) => {
              const canAssign = b.status === 'REQUESTED' || b.status === 'ASSIGNED';
              return (
                <tr key={b.id}>
                  <td>{b.tripDate}<br /><small className="muted">{b.shiftTime}</small></td>
                  <td>{b.employee.name}<br /><small className="muted">{b.employee.employeeCode}</small></td>
                  <td>{b.pickupLocation.name} → <b>{b.dropLocation.name}</b></td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>{b.cab ? b.cab.cabNumber : '-'}</td>
                  <td>{b.dropSequence ?? '-'}</td>
                  <td>
                    {canAssign ? (
                      <div className="row gap">
                        <select value={choice[b.id] ?? (b.cab ? b.cab.id : '')} onChange={(e) => setChoice({ ...choice, [b.id]: e.target.value })}>
                          <option value="">Select cab</option>
                          {cabs.map((c) => (
                            <option key={c.id} value={c.id}>{c.cabNumber} ({c.driver ? c.driver.name : 'no driver'}, {c.capacity} seats)</option>
                          ))}
                        </select>
                        <button className="btn btn-primary" onClick={() => assign(b)}>Assign</button>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
