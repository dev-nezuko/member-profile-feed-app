import { useState } from 'react';
import { useLoginMutation } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data }: any = await login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      navigate('/profile');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='max-w-md mx-auto mt-10 bg-white p-6 shadow rounded space-y-4'>
      <h2 className='text-xl font-semibold'>Login to your account</h2>
      <input
        className='w-full border px-3 py-2 rounded'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className='w-full border px-3 py-2 rounded'
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type='submit' className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700'>
        Submit
      </button>
    </form>
  );
}
