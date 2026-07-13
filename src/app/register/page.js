'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/apiCall';
import { AuthShapes, GoogleButton, OrDivider, AuthInput } from '@/components/AuthShell';
import Spinner from '@/components/Spinner';

const FIELDS = [
  { key: 'firstName', label: 'First Name', type: 'text' },
  { key: 'lastName', label: 'Last Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'repeatPassword', label: 'Repeat Password', type: 'password' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    repeatPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.repeatPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { repeatPassword, ...body } = form;
      await apiCall('/api/auth/register', { method: 'POST', body });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-white dark:bg-dcard">
      <AuthShapes />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-3">
          <div className="hidden lg:col-span-2 lg:block">
            <img src="/assets/images/registration.png" alt="" className="mx-auto w-full max-w-2xl dark:hidden" />
            <img
              src="/assets/images/registration1.png"
              alt=""
              className="mx-auto hidden w-full max-w-2xl dark:block"
            />
          </div>
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-md">
              <img src="/assets/images/logo.svg" alt="Buddy Script" className="mb-7 h-9" />
              <p className="mb-2 text-sm text-muted dark:text-gray-400">Get Started Now</p>
              <h4 className="mb-10 text-2xl font-semibold">Registration</h4>
              <GoogleButton label="Register with google" />
              <OrDivider />
              <form onSubmit={onSubmit}>
                {FIELDS.map((f) => (
                  <AuthInput
                    key={f.key}
                    label={f.label}
                    type={f.type}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    minLength={f.type === 'password' ? 8 : undefined}
                    required
                  />
                ))}
                <label className="flex items-center gap-2 text-sm text-muted dark:text-gray-400">
                  <input type="checkbox" defaultChecked required className="h-4 w-4 accent-brand" />I agree to terms
                  &amp; conditions
                </label>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-2 disabled:opacity-60"
                >
                  {loading && <Spinner />}
                  {loading ? 'Creating account...' : 'Register now'}
                </button>
              </form>
              <p className="mt-10 text-center text-sm text-muted dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-brand hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
