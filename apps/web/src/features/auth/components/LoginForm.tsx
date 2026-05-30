'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { loginInputSchema, type LoginInput } from '@collab/api-contracts';
import { Button, Input } from '@collab/ui';

import { api } from '@/lib/api/client';

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema) });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await api('/auth/login', { method: 'POST', body: JSON.stringify(values) });
          router.push('/');
        } catch (err) {
          form.setError('root', { message: 'Invalid credentials' });
        }
      })}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
      </div>
      {form.formState.errors.root && (
        <p className="text-xs text-destructive">{form.formState.errors.root.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
