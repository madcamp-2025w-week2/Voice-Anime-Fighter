import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const ProtectedRoute = () => {
  const { token } = useUserStore();
  const location = useLocation();

  if (!token) {
    // Redirect to login page, saving the location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
