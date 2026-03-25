"use client";

import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-10 p-4 pb-8">
      <header className="pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          Trust-first real-time marketplace
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Real-time sightseeing,
          <span className="block text-indigo-600">on demand.</span>
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-slate-600">
          Post a request, get matched with an on-site “Eye”, and go live in
          seconds. Pay for outcomes, rate quality, and stay in control.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link href="/auth/register">
              Post a job <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto"
            size="lg"
            variant="outline"
          >
            <Link href="/auth/register">Become an Eye</Link>
          </Button>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-indigo-700 hover:underline" href="/auth/login">
            Log in
          </Link>
        </p>
      </header>

      <section className="grid gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-5 w-5 text-indigo-600" />
              Live video, instantly
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Start a session the moment you accept a bid. Built for mobile-first
            streaming and fast connection.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Nearby Eyes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Discover and match with Eyes close to the location. Great for
            property checks, logistics, and real-time tours.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Trust built-in
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Rate completed jobs, build reputation, and report streams instantly
            if anything looks wrong.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

