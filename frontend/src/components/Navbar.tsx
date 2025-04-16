import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { signedOut } from '../features/auth/authSlice';
import { api } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((state) => Boolean(state.auth.session));

  const logOut = () => {
    dispatch(signedOut());
    // Drop cached profile and feed data so the next member never sees the previous one's.
    dispatch(api.util.resetApiState());
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-blue-600 font-semibold">Feed</Link>
        <Link to="/profile" className="text-blue-600">Profile</Link>
      </div>
      <div className="flex items-center space-x-4">
        {signedIn ? (
          <button type="button" onClick={logOut} className="text-red-600 hover:underline">Logout</button>
        ) : (
          <>
            <Link to="/login" className="text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
