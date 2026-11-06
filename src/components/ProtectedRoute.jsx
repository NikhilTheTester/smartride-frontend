import { Navigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';

/** Only lets a logged-in user with the right role see the page. */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
