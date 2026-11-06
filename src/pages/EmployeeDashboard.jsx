import { useState } from 'react';
import api, { errorMessage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import LiveMap from '../components/LiveMap';
import { distanceMeters, formatDistance, etaMinutes, getCurrentPosition, today } from '../utils/geo';

const ACTIVE = ['REQUESTED', 'ASSIGNED', 'BOARDED'];
const STEPS = ['REQUESTED', 'ASSIGNED', 'BOARDED', 'DROPPED'];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ pickupLocationId: '', dropLocationId: '', tripDate: today(), shiftTime: '09:00 AM' });

  const load = async () => {
    try {
      const [b, l] = await Promise.all([
        api.get('/employee/bookings'),
        locations.length ? Promise.resolve({ data: locations }) : api.get('/common/locations'),
      ]);
      setBookings(b.data);
      setLocations(l.data);
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };
  usePolling(load, 5000);

  const active = bookings.find((b) => ACTIVE.includes(b.status));

  const book = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employee/bookings', {
        pickupLocationId: Number(form.pickupLocationId),
        dropLocationId: Number(form.dropLocationId),
        tripDate: form.tripDate,
        shiftTime: form.shiftTime,
      });
      setMsg({ type: 'success', text: 'Cab requested! The admin will assign a cab soon.' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/employee/bookings/${id}/cancel`);
      setMsg({ type: 'success', text: 'Booking cancelled' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const rate = async (id, rating, feedback) => {
    try {
      await api.post(`/employee/bookings/${id}/rate`, { rating: Number(rating), feedback });
      setMsg({ type: 'success', text: 'Thanks for your feedback!' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const sos = async () => {
    if (!window.confirm('Send an emergency SOS alert to the admin?')) return;
    try {
      const pos = await getCurrentPosition();
      await api.post('/common/sos', pos);
      setMsg({ type: 'success', text: 'SOS sent to the admin with your location.' });
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div className="container">
      <div className="row between">
        <h2>Employee Dashboard</h2>
        <button className="btn btn-danger" onClick={sos}>🚨 SOS</button>
      </div>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      <div className="grid-2">
        <div className="card">
          <h3>My Profile</h3>
          <p><b>{user.name}</b></p>
          <p className="muted">Employee ID: {user.employeeCode || '-'} | Branch: {user.branch || '-'}</p>
          <p className="muted">{user.email} | {user.phone || 'no phone'}</p>
        </div>

        <div className="card">
          <h3>Book a Cab</h3>
          <form onSubmit={book}>
            <div className="row gap">
              <div className="grow">
                <label>Pickup point</label>
                <select required value={form.pickupLocationId} onChange={(e) => setForm({ ...form, pickupLocationId: e.target.value })}>
                  <option value="">Select</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grow">
                <label>Drop (destination)</label>
                <select required value={form.dropLocationId} onChange={(e) => setForm({ ...form, dropLocationId: e.target.value })}>
                  <option value="">Select</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="row gap">
              <div className="grow">
                <label>Date</label>
                <input type="date" required min={today()} value={form.tripDate} onChange={(e) => setForm({ ...form, tripDate: e.target.value })} />
              </div>
              <div className="grow">
                <label>Shift time</label>
                <select value={form.shiftTime} onChange={(e) => setForm({ ...form, shiftTime: e.target.value })}>
                  {['06:00 AM', '09:00 AM', '02:00 PM', '06:00 PM', '10:00 PM'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary">Request Cab</button>
          </form>
        </div>
      </div>

      {active && <ActiveRide b={active} />}

      <div className="card">
        <h3>My Trips</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Shift</th><th>Route</th><th>Cab</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {bookings.length === 0 && <tr><td colSpan="6" className="center muted">No trips yet</td></tr>}
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.tripDate}</td>
                  <td>{b.shiftTime}</td>
                  <td>{b.pickupLocation.name} → {b.dropLocation.name}</td>
                  <td>{b.cab ? b.cab.cabNumber : '-'}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {(b.status === 'REQUESTED' || b.status === 'ASSIGNED') && (
                      <button className="btn btn-light" onClick={() => cancel(b.id)}>Cancel</button>
                    )}
                    {b.status === 'DROPPED' && (b.rating ? <span>⭐ {b.rating}/5</span> : <RateBox onRate={(r, f) => rate(b.id, r, f)} />)}
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

function RateBox({ onRate }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  return (
    <div className="row gap">
      <select value={rating} onChange={(e) => setRating(e.target.value)}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
      </select>
      <input placeholder="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <button className="btn btn-primary" onClick={() => onRate(rating, feedback)}>Rate</button>
    </div>
  );
}

function ActiveRide({ b }) {
  const stepIndex = STEPS.indexOf(b.status);
  const cab = b.cab;
  const hasCabPos = cab && cab.currentLat != null && cab.currentLng != null;
  let distance = null;
  if (hasCabPos) {
    distance = distanceMeters(cab.currentLat, cab.currentLng, b.dropLocation.latitude, b.dropLocation.longitude);
  }

  return (
    <div className="card highlight">
      <h3>Current Ride</h3>
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i <= stepIndex ? 'done' : ''}`}>
            <span className="dot">{i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      {b.status === 'REQUESTED' && <p>Waiting for the admin to assign a cab for {b.tripDate} ({b.shiftTime}).</p>}

      {b.status === 'ASSIGNED' && (
        <div className="otp-box">
          <p>Show this OTP to the driver when you board the cab:</p>
          <div className="otp">{b.otp}</div>
        </div>
      )}

      {cab && (
        <p>
          <b>Cab:</b> {cab.cabNumber} ({cab.model}) &nbsp;|&nbsp; <b>Driver:</b> {cab.driver?.name} ({cab.driver?.phone})
          {b.dropSequence ? <> &nbsp;|&nbsp; <b>Your drop order:</b> #{b.dropSequence}</> : null}
        </p>
      )}

      {b.status === 'BOARDED' && b.alertSent && (
        <div className="alert alert-success">📍 Your destination is arriving. Please get ready to get down.</div>
      )}

      {distance != null && (
        <p>
          Cab is <b>{formatDistance(distance)}</b> from your drop point ({b.dropLocation.name}) - about <b>{etaMinutes(distance)} min</b>.
        </p>
      )}

      {hasCabPos && (
        <LiveMap
          cabs={[{ id: cab.id, label: cab.cabNumber, lat: cab.currentLat, lng: cab.currentLng }]}
          places={[
            { id: 'pickup', label: `Pickup: ${b.pickupLocation.name}`, lat: b.pickupLocation.latitude, lng: b.pickupLocation.longitude, color: '#27ae60' },
            { id: 'drop', label: `Drop: ${b.dropLocation.name}`, lat: b.dropLocation.latitude, lng: b.dropLocation.longitude, color: '#e74c3c' },
          ]}
        />
      )}
    </div>
  );
}
