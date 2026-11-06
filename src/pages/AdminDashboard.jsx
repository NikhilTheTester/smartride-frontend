import { useState } from 'react';
import api from '../api/api';
import usePolling from '../hooks/usePolling';
import Overview from '../components/admin/Overview';
import BookingsTab from '../components/admin/BookingsTab';
import UsersTab from '../components/admin/UsersTab';
import CabsTab from '../components/admin/CabsTab';
import LiveMapTab from '../components/admin/LiveMapTab';
import SosTab from '../components/admin/SosTab';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'bookings', label: '📋 Bookings & Assign' },
  { id: 'employees', label: '👩‍💼 Employees' },
  { id: 'drivers', label: '🧑‍✈️ Drivers' },
  { id: 'cabs', label: '🚖 Cabs' },
  { id: 'map', label: '🗺️ Live Map' },
  { id: 'sos', label: '🚨 SOS' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [openSos, setOpenSos] = useState(0);

  // keeps the red SOS counter on the tab up to date
  usePolling(async () => {
    try {
      const res = await api.get('/admin/stats');
      setOpenSos(res.data.openSos);
    } catch {
      /* ignore */
    }
  }, 5000);

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'sos' && openSos > 0 && <span className="count">{openSos}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'employees' && <UsersTab role="EMPLOYEE" />}
      {tab === 'drivers' && <UsersTab role="DRIVER" />}
      {tab === 'cabs' && <CabsTab />}
      {tab === 'map' && <LiveMapTab />}
      {tab === 'sos' && <SosTab />}
    </div>
  );
}
