import { useState } from 'react';
import api from '../../api/api';
import usePolling from '../../hooks/usePolling';

const CARDS = [
  ['employees', 'Employees'],
  ['drivers', 'Drivers'],
  ['cabs', 'Cabs'],
  ['cabsOnTrip', 'Cabs on trip'],
  ['bookingsToday', 'Bookings today'],
  ['REQUESTED', 'Requested'],
  ['ASSIGNED', 'Assigned'],
  ['BOARDED', 'On board'],
  ['DROPPED', 'Dropped'],
  ['NO_SHOW', 'No-show'],
  ['CANCELLED', 'Cancelled'],
  ['openSos', 'Open SOS'],
];

/** Report cards with live numbers (refresh every 5 seconds). */
export default function Overview() {
  const [stats, setStats] = useState(null);
  usePolling(async () => {
    try {
      setStats((await api.get('/admin/stats')).data);
    } catch {
      /* ignore */
    }
  }, 5000);

  if (!stats) return <p>Loading...</p>;
  return (
    <div className="stat-grid">
      {CARDS.map(([key, label]) => (
        <div key={key} className={`stat ${key === 'openSos' && stats[key] > 0 ? 'stat-danger' : ''}`}>
          <div className="stat-num">{stats[key]}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
