import { useSignupMutation } from '../../services/api';
import AuthForm from './AuthForm';

export default function Signup() {
  const [signup, { isLoading }] = useSignupMutation();
  return (
    <AuthForm mode="signup" title="Create an account" submitLabel="Create account" failureMessage="Signup failed. Please try again."
      isLoading={isLoading} submit={(credentials) => signup(credentials).unwrap()} />
  );
}
