import { useState } from 'react';
import api from '../../api/api';
import usePolling from '../../hooks/usePolling';
import LiveMap from '../LiveMap';
import StatusBadge from '../StatusBadge';

/** Shows every cab on the map; positions refresh every 4 seconds. */
export default function LiveMapTab() {
  const [cabs, setCabs] = useState([]);
  usePolling(async () => {
    try {
      setCabs((await api.get('/admin/cabs')).data);
    } catch {
      /* ignore */
    }
  }, 4000);

  const withPos = cabs.filter((c) => c.currentLat != null);
  return (
    <div className="card">
      <h3>Live Cab Tracking</h3>
      <LiveMap height={430} cabs={withPos.map((c) => ({ id: c.id, label: c.cabNumber, lat: c.currentLat, lng: c.currentLng }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Cab</th><th>Driver</th><th>Status</th><th>Last update</th></tr></thead>
          <tbody>
            {cabs.map((c) => (
              <tr key={c.id}>
                <td>{c.cabNumber}</td>
                <td>{c.driver ? c.driver.name : '-'}</td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.lastUpdated ? new Date(c.lastUpdated).toLocaleTimeString() : 'no signal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
