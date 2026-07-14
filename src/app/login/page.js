"use client";

import {
  AuthInput,
  AuthShapes,
  GoogleButton,
  OrDivider,
} from "@/components/AuthShell";
import Spinner from "@/components/Spinner";
import { apiCall } from "@/lib/apiCall";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(
    searchParams.get("error") === "google"
      ? "Google sign-in failed. Please try again."
      : "",
  );
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiCall("/api/auth/login", { method: "POST", body: form });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <img
        src="/assets/images/logo.svg"
        alt="Buddy Script"
        className="mb-7 h-9"
      />
      <p className="mb-2 text-sm text-muted dark:text-gray-400">Welcome back</p>
      <h4 className="mb-10 text-2xl font-semibold">Login to your account</h4>
      <GoogleButton label="Or sign-in with google" />
      <OrDivider />
      <form onSubmit={onSubmit}>
        <AuthInput
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <AuthInput
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          required
        />
        <div className="mb-2 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted dark:text-gray-400">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-brand"
            />
            Remember me
          </label>
          <span className="text-muted dark:text-gray-400">
            Forgot password?
          </span>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-2 disabled:opacity-60"
        >
          {loading && <Spinner />}
          {loading ? "Logging in..." : "Login now"}
        </button>
      </form>
      <p className="mt-10 text-center text-sm text-muted dark:text-gray-400">
        Dont have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-brand hover:underline"
        >
          Create New Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white dark:bg-dcard">
      <AuthShapes />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-3">
          <div className="hidden lg:col-span-2 lg:block">
            <img
              src="/assets/images/login.png"
              alt=""
              className="mx-auto w-full max-w-2xl"
            />
          </div>
          <div className="flex justify-center lg:justify-start">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
