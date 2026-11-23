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
import { signUpSchema, passwordChecks, type SignUpValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, PasswordField } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { refetch } = useProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: "customer" },
  });
  const password = form.watch("password");
  const checks = passwordChecks(password ?? "");

  async function afterAuth() {
    const { data } = await refetch();
    const role = data?.role ?? "customer";
    router.push(postLoginTarget(role, redirect));
    router.refresh();
  }

  async function onSubmit(values: SignUpValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        // @ts-expect-error additionalFields passthrough
        role: values.role,
        roleSelected: true,
      });
      if (error) {
        toast.error(error.message || "Could not create your account.");
        return;
      }
      toast.success("Welcome to WedPlan!");
      await afterAuth();
    } catch {
      toast.error("Could not create your account. Please try again.");
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
      if (error) toast.error(error.message || "Google sign-up failed.");
    } catch {
      toast.error("Google sign-up is not configured right now.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join WedPlan to discover and book wedding vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={google} disabled={googleBusy}>
            {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-charcoal-soft">
            <span className="h-px flex-1 bg-blush-100" /> or <span className="h-px flex-1 bg-blush-100" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="Full name" error={form.formState.errors.name?.message} htmlFor="name">
              <Input id="name" placeholder="Ayesha Rahman" {...form.register("name")} />
            </Field>
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
              {form.formState.errors.password ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {form.formState.errors.password.message}
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {checks.map((c) => (
                    <li
                      key={c.label}
                      className={cn("flex items-center gap-1.5 text-xs", c.ok ? "text-emerald-600" : "text-charcoal-soft")}
                    >
                      <span className={cn("flex size-3.5 items-center justify-center rounded-full text-[10px]", c.ok ? "bg-emerald-100" : "bg-stone-200")}>
                        {c.ok ? "✓" : ""}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Field label="I am joining as" htmlFor="role">
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "vendor"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => form.setValue("role", r)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors",
                      form.watch("role") === r
                        ? "border-blush-500 bg-blush-50 text-blush-800"
                        : "border-blush-200 bg-white text-charcoal-soft hover:border-blush-300",
                    )}
                  >
                    {r === "customer" ? "Couple / Customer" : "Vendor"}
                  </button>
                ))}
              </div>
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create account
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-charcoal-soft">
            Already have an account?{" "}
            <Link href={redirect ? `/signin?redirect=${encodeURIComponent(redirect)}` : "/signin"} className="font-semibold text-blush-700 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
