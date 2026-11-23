"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useProfile, postLoginTarget } from "@/hooks/use-auth";
import { signInSchema, type SignInValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, PasswordField } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/brand";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const blocked = searchParams.get("blocked") === "1";
  const { refetch } = useProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function afterAuth() {
    const { data } = await refetch();
    const role = data?.role ?? "customer";
    router.push(postLoginTarget(role, redirect));
    router.refresh();
  }

  async function onSubmit(values: SignInValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("block")) {
          toast.error("Your account has been blocked. Please contact support.");
        } else {
          toast.error(error.message || "Invalid email or password.");
        }
        return;
      }
      toast.success("Welcome back!");
      await afterAuth();
    } catch {
      toast.error("Could not sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function google() {
    setGoogleBusy(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirect ?? "/onboarding",
      });
      if (error) toast.error(error.message || "Google sign-in failed.");
    } catch {
      toast.error("Google sign-in is not configured right now.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to manage your wedding plans.</CardDescription>
      </CardHeader>
      <CardContent>
        {blocked && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Your account has been blocked. Please contact support.
          </p>
        )}
        <Button variant="outline" className="w-full" onClick={google} disabled={googleBusy}>
          {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-charcoal-soft">
          <span className="h-px flex-1 bg-blush-100" /> or <span className="h-px flex-1 bg-blush-100" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" error={form.formState.errors.email?.message} htmlFor="email">
            <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <PasswordField show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-charcoal-soft">
          New to WedPlan?{" "}
          <Link
            href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"}
            className="font-semibold text-blush-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
