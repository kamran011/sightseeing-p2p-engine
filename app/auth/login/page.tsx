"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-4 p-4 pb-28 pt-14">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="text-sm text-slate-600">
          Use your email + password to continue.
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

              const res = await signIn("credentials", {
                redirect: false,
                email: values.email,
                password: values.password,
              });

              if (!res?.ok) {
                setError("Invalid email or password");
                return;
              }

              const sessionRes = await fetch("/api/auth/session");
              const session = (await sessionRes.json().catch(() => null)) as
                | null
                | { user?: { role?: "POSTER" | "EYE" } };

              const role = session?.user?.role;
              if (role === "POSTER") return router.push("/poster");
              if (role === "EYE") return router.push("/eye");

              setError("Signed in, but role was not found");
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
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button className="w-full" disabled={isSubmitting} type="submit">
              Sign In
            </Button>

            <div className="pt-1 text-center">
              <Button
                variant="ghost"
                className="w-full"
                type="button"
                onClick={() => router.push("/auth/register")}
              >
                Signup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

