import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/api';
import usePolling from '../hooks/usePolling';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import LiveMap from '../components/LiveMap';
import { distanceMeters, getCurrentPosition, speak } from '../utils/geo';

export default function DriverDashboard() {
  const [trip, setTrip] = useState(null); // { cab, passengers }
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [alerts, setAlerts] = useState([]); // drop alerts to show on screen
  const [otps, setOtps] = useState({});
  const [mode, setMode] = useState('off'); // 'off' | 'sim' | 'gps'

  // Refs always hold the newest values, so timers never use stale data
  const tripRef = useRef(null);
  const posRef = useRef(null);
  const lastSent = useRef(0);
  tripRef.current = trip;

  const load = async () => {
    try {
      const res = await api.get('/driver/trip');
      setTrip(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  usePolling(load, 4000);

  // ---- send GPS to the backend; backend answers with drop alerts ----
  const sendLocation = async (lat, lng) => {
    posRef.current = { lat, lng };
    try {
      const res = await api.post('/driver/location', { lat, lng });
      if (res.data.length > 0) {
        setAlerts((prev) => [...prev, ...res.data]);
        res.data.forEach((a) => speak(a.message));
        load();
      }
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  // ---- simulated drive (for demo on a laptop): the cab moves towards the next drop point ----
  useEffect(() => {
    if (mode !== 'sim') return undefined;
    const id = setInterval(() => {
      const t = tripRef.current;
      if (!t) return;
      const next = t.passengers.find((p) => p.status === 'BOARDED');
      if (!next) return;
      if (!posRef.current) {
        posRef.current = {
          lat: t.cab.currentLat ?? next.pickupLocation.latitude,
          lng: t.cab.currentLng ?? next.pickupLocation.longitude,
        };
      }
      const { lat, lng } = posRef.current;
      const tLat = next.dropLocation.latitude;
      const tLng = next.dropLocation.longitude;
      const dist = distanceMeters(lat, lng, tLat, tLng);
      const stepMeters = Math.max(dist * 0.2, 120);
      const f = Math.min(1, stepMeters / Math.max(dist, 1));
      sendLocation(lat + (tLat - lat) * f, lng + (tLng - lng) * f);
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- real GPS from the device ----
  useEffect(() => {
    if (mode !== 'gps') return undefined;
    if (!navigator.geolocation) {
      setMsg({ type: 'error', text: 'GPS is not available in this browser' });
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const now = Date.now();
        if (now - lastSent.current > 3000) {
          lastSent.current = now;
          sendLocation(p.coords.latitude, p.coords.longitude);
        }
      },
      () => setMsg({ type: 'error', text: 'Could not read GPS. Allow location access in the browser.' }),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const run = async (call, okText) => {
    try {
      await call();
      if (okText) setMsg({ type: 'success', text: okText });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const startTrip = () => run(() => api.post('/driver/trip/start'), 'Trip started. Drive safe!');
  const endTrip = () =>
    run(async () => {
      await api.post('/driver/trip/end');
      setMode('off');
      setAlerts([]);
    }, 'Trip ended');
  const verify = (id) =>
    run(async () => {
      await api.post(`/driver/bookings/${id}/verify-otp`, { otp: otps[id] || '' });
      setOtps((o) => ({ ...o, [id]: '' }));
    }, 'OTP verified - passenger boarded');
  const drop = (id) =>
    run(async () => {
      await api.post(`/driver/bookings/${id}/drop`);
      setAlerts((a) => a.filter((x) => x.bookingId !== id));
    }, 'Passenger dropped');
  const noShow = (id) => run(() => api.post(`/driver/bookings/${id}/no-show`), 'Marked as no-show');

  const sos = async () => {
    if (!window.confirm('Send an emergency SOS alert to the admin?')) return;
    try {
      const pos = posRef.current || (await getCurrentPosition());
      await api.post('/common/sos', pos);
      setMsg({ type: 'success', text: 'SOS sent to the admin with your location.' });
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  if (error && !trip) {
    return (
      <div className="container">
        <h2>Driver Dashboard</h2>
        <Alert msg={{ type: 'error', text: error }} />
      </div>
    );
  }
  if (!trip) return <div className="container">Loading...</div>;

  const { cab, passengers } = trip;
  const onTrip = cab.status === 'ON_TRIP';
  const pending = passengers.filter((p) => p.status === 'ASSIGNED' || p.status === 'BOARDED');
  const nextDrop = passengers.find((p) => p.status === 'BOARDED');

  return (
    <div className="container">
      <div className="row between">
        <h2>Driver Dashboard</h2>
        <button className="btn btn-danger" onClick={sos}>🚨 SOS</button>
      </div>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {alerts.map((a, i) => (
        <div key={`${a.bookingId}-${i}`} className="alert alert-warning big">
          <span>🔊 {a.message}</span>
          <div className="row gap">
            <button className="btn btn-primary" onClick={() => drop(a.bookingId)}>Mark dropped</button>
            <button className="alert-close" onClick={() => setAlerts((x) => x.filter((_, j) => j !== i))}>x</button>
          </div>
        </div>
      ))}

      <div className="grid-2">
        <div className="card">
          <h3>My Cab</h3>
          <p><b>{cab.cabNumber}</b> - {cab.model} ({cab.capacity} seats)</p>
          <p>Status: <StatusBadge status={cab.status} /></p>
          <p className="muted">Passengers today: {pending.length} pending</p>
          <div className="row gap">
            {!onTrip && <button className="btn btn-primary" onClick={startTrip}>▶ Start Trip</button>}
            {onTrip && <button className="btn btn-dark" onClick={endTrip}>■ End Trip</button>}
          </div>
        </div>

        <div className="card">
          <h3>Location &amp; Voice Alerts</h3>
          <p className="muted">
            The backend checks every GPS update. When the cab comes near a passenger's drop point, a voice alert is played here.
          </p>
          <div className="row gap wrap">
            <button className={`btn ${mode === 'sim' ? 'btn-primary' : 'btn-light'}`} onClick={() => setMode(mode === 'sim' ? 'off' : 'sim')}>
              {mode === 'sim' ? 'Stop simulation' : '🧪 Simulate drive (demo)'}
            </button>
            <button className={`btn ${mode === 'gps' ? 'btn-primary' : 'btn-light'}`} onClick={() => setMode(mode === 'gps' ? 'off' : 'gps')}>
              {mode === 'gps' ? 'Stop GPS' : '📡 Use real GPS'}
            </button>
            <button className="btn btn-light" onClick={() => speak('Voice alerts are working')}>🔈 Test voice</button>
          </div>
          {mode === 'sim' && !nextDrop && <p className="muted">Verify at least one passenger's OTP so there is a drop point to drive to.</p>}
          {nextDrop && <p>Next drop: <b>{nextDrop.employee.name}</b> at <b>{nextDrop.dropLocation.name}</b></p>}
        </div>
      </div>

      <div className="card">
        <h3>Passengers (in drop order)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Employee</th><th>Pickup</th><th>Drop</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {passengers.length === 0 && <tr><td colSpan="6" className="center muted">No passengers assigned for today</td></tr>}
              {passengers.map((p) => (
                <tr key={p.id} className={p.alertSent && p.status === 'BOARDED' ? 'row-alert' : ''}>
                  <td>{p.dropSequence ?? '-'}</td>
                  <td>{p.employee.name}<br /><small className="muted">{p.employee.phone}</small></td>
                  <td>{p.pickupLocation.name}</td>
                  <td>{p.dropLocation.name}</td>
                  <td>
                    <StatusBadge status={p.status} />
                    {p.alertSent && p.status === 'BOARDED' && <div><small>📍 Arrived</small></div>}
                  </td>
                  <td>
                    {p.status === 'ASSIGNED' && (
                      <div className="row gap">
                        <input className="otp-input" maxLength={4} placeholder="OTP" value={otps[p.id] || ''} onChange={(e) => setOtps({ ...otps, [p.id]: e.target.value })} />
                        <button className="btn btn-primary" onClick={() => verify(p.id)}>Verify</button>
                        <button className="btn btn-light" onClick={() => noShow(p.id)}>No-show</button>
                      </div>
                    )}
                    {p.status === 'BOARDED' && (
                      <button className={`btn ${p.alertSent ? 'btn-primary' : 'btn-light'}`} onClick={() => drop(p.id)}>Mark dropped</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Route Map</h3>
        <LiveMap
          cabs={cab.currentLat != null ? [{ id: cab.id, label: cab.cabNumber, lat: cab.currentLat, lng: cab.currentLng }] : []}
          places={pending.map((p) => ({
            id: p.id,
            label: `#${p.dropSequence ?? '-'} ${p.employee.name} → ${p.dropLocation.name}`,
            lat: p.dropLocation.latitude,
            lng: p.dropLocation.longitude,
            color: p.status === 'BOARDED' ? '#e74c3c' : '#e67e22',
          }))}
        />
      </div>
    </div>
  );
}
