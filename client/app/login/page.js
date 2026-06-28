import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — PharmaVigil',
  description: 'Sign in to your PharmaVigil account to report adverse drug reactions',
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
