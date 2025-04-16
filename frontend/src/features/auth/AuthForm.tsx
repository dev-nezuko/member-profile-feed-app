import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { errorMessage, type Credentials } from '../../services/api';
import { signedIn, type Session } from './authSlice';

interface AuthFormProps {
  mode: 'login' | 'signup';
  title: string;
  submitLabel: string;
  failureMessage: string;
  isLoading: boolean;
  submit: (credentials: Credentials) => Promise<Session>;
}

export default function AuthForm({ mode, title, submitLabel, failureMessage, isLoading, submit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      dispatch(signedIn(await submit({ email, password })));
      navigate('/profile');
    } catch (failure) {
      setError(errorMessage(failure, failureMessage));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 bg-white p-6 shadow rounded space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <label className="block">
        <span className="block text-sm mb-1">Email</span>
        <input className="w-full border px-3 py-2 rounded" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Password</span>
        <input className="w-full border px-3 py-2 rounded" type="password" required minLength={8} maxLength={72}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button disabled={isLoading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        {isLoading ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
