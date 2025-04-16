import { useState } from 'react';
import { useLoginMutation } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login({ email, password }).unwrap();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      navigate('/profile');
    } catch {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='max-w-md mx-auto mt-10 bg-white p-6 shadow rounded space-y-4'>
      <h2 className='text-xl font-semibold'>Login to your account</h2>
      <input
        className='w-full border px-3 py-2 rounded'
        aria-label='Email' type='email' required maxLength={254}
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className='w-full border px-3 py-2 rounded'
        type='password'
        aria-label='Password' required minLength={8} maxLength={72}
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={isLoading} type='submit' className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700'>
        Submit
      </button>
    </form>
  );
}
