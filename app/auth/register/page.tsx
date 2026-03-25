"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["POSTER", "EYE"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", role: "POSTER" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-4 p-4 pb-28">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create account
        </h1>
        <p className="text-sm text-slate-600">
          Choose a role, then we will sign you in.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              setError(null);
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });

              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data?.error || "Registration failed");
                return;
              }

              const signInRes = await signIn("credentials", {
                redirect: false,
                email: values.email,
                password: values.password,
              });

              if (!signInRes?.ok) {
                setError("Could not sign you in after registration");
                return;
              }

              router.push(values.role === "POSTER" ? "/poster" : "/eye");
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email ? (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password ? (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("role")}
              >
                <option value="POSTER">Poster</option>
                <option value="EYE">Eye</option>
              </select>
              {errors.role ? (
                <p className="text-xs text-red-600">{errors.role.message}</p>
              ) : null}
            </div>

            <Button className="w-full" disabled={isSubmitting} type="submit">
              Create &amp; sign in
            </Button>

            <div className="pt-1 text-center">
              <Button
                variant="ghost"
                type="button"
                className="h-auto min-h-0 w-full justify-center p-0 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                onClick={() => router.push("/api/auth/signin")}
              >
                Already have an account?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

