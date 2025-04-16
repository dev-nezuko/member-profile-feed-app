import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid gap-10 md:grid-cols-[1fr_minmax(0,26rem)] md:items-center">
      <section className="max-w-md">
        <p className="text-rust-deep font-bold uppercase tracking-[0.18em] text-sm">Member board</p>
        <p className="font-display text-4xl sm:text-5xl font-extrabold leading-[1.05] mt-3">
          {mode === 'signup' ? 'Introduce yourself to the other members.' : 'See who has joined since you last looked.'}
        </p>
        <p className="text-muted mt-4">
          Members share a short profile with a photo and interests, browse each other, and leave a like for the people they appreciate.
        </p>
      </section>
      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-3xl p-6 sm:p-8 space-y-5">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {error && <p role="alert" className="notice notice-error">{error}</p>}
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field" type="email" autoComplete="email" required maxLength={254}
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <div>
          <label className="block">
            <span className="field-label">Password</span>
            <input className="field" type="password" required minLength={8} maxLength={72} aria-describedby="password-hint"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <span id="password-hint" className="field-hint">At least 8 characters.</span>
        </div>
        <button disabled={isLoading} type="submit" className="btn btn-primary w-full">
          {isLoading ? 'Please wait…' : submitLabel}
        </button>
        <p className="text-sm text-muted text-center">
          {mode === 'signup'
            ? <>Already a member? <Link className="font-bold text-rust-deep underline" to="/login">Log in</Link></>
            : <>New here? <Link className="font-bold text-rust-deep underline" to="/signup">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
