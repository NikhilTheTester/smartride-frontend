import { useState } from 'react';
import api, { errorMessage } from '../../api/api';
import usePolling from '../../hooks/usePolling';
import Alert from '../Alert';

/** Emergency alerts raised by employees and drivers. */
export default function SosTab() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      setList((await api.get('/admin/sos')).data);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };
  usePolling(load, 5000);

  const resolve = async (id) => {
    try {
      await api.put(`/admin/sos/${id}/resolve`);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div className="card">
      <h3>SOS Alerts</h3>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Raised by</th><th>Role</th><th>Phone</th><th>Location</th><th>Status</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="6" className="center muted">No SOS alerts</td></tr>}
            {list.map((s) => (
              <tr key={s.id} className={s.resolved ? '' : 'row-alert'}>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.user.name}</td>
                <td>{s.user.role}</td>
                <td>{s.user.phone}</td>
                <td>
                  <a href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`} target="_blank" rel="noreferrer">
                    {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                  </a>
                </td>
                <td>
                  {s.resolved ? <span className="badge badge-DROPPED">RESOLVED</span> : <button className="btn btn-primary" onClick={() => resolve(s.id)}>Mark resolved</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
