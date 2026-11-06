import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-icon">🚖</span> Smart Ride
        <small>Corporate Cab Management</small>
      </div>
      {user && (
        <div className="nav-right">
          <span className="nav-user">
            {user.name} <span className={`role role-${user.role}`}>{user.role}</span>
          </span>
          <button className="btn btn-light" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
