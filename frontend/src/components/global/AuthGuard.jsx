import { Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

/**
 * Wrap protected routes with this component.
 * If user is not logged in, redirect to /auth.
 */
export default function AuthGuard({ children }) {
  const user = useStore((state) => state.user);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
