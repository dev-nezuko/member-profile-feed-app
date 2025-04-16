import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <nav className="flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-blue-600 font-semibold">Feed</Link>
        <Link to="/profile" className="text-blue-600">Profile</Link>
      </div>
      <div className="flex items-center space-x-4">
        {!token ? (
          <>
            <Link to="/login" className="text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600">Signup</Link>
          </>
        ) : (
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
