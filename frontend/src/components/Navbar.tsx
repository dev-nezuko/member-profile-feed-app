import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { signedOut } from '../features/auth/authSlice';
import { api } from '../services/api';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full font-bold ${isActive ? 'bg-ink text-card' : 'text-ink hover:bg-line/60'}`;

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
    <header className="border-b border-line bg-card">
      <nav aria-label="Main" className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg">
          <img src="/favicon.svg" alt="" className="w-8 h-8" />
          Member board
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {signedIn ? (
            <>
              <NavLink to="/" end className={linkClass}>Feed</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <button type="button" onClick={logOut} className="px-3 py-2 rounded-full font-bold text-rust-deep hover:bg-rust-wash">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <NavLink to="/signup" className={linkClass}>Sign up</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
