import Link from 'next/link';

import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to your workspace</p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
