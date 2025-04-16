import { useLoginMutation } from '../../services/api';
import AuthForm from './AuthForm';

export default function Login() {
  const [login, { isLoading }] = useLoginMutation();
  return (
    <AuthForm mode="login" title="Log in to your account" submitLabel="Log in" failureMessage="Login failed. Please try again."
      isLoading={isLoading} submit={(credentials) => login(credentials).unwrap()} />
  );
}
