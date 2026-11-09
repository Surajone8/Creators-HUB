"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { signUpAction, AuthState } from "@/app/actions/auth";
import { COMMON_TIMEZONES, getDefaultTimezone } from "@/lib/utils/timezone";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signUpAction,
    {}
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-11 w-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Create Creator Hub Account</h2>
          <p className="text-xs text-zinc-400">
            Personal-first creator workspace • Local AI metadata generation
          </p>
        </div>

        <form
          action={formAction}
          className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4 shadow-xl"
        >
          {state?.error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{state.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="displayName">
              Creator Display Name
            </label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="e.g. Suraj Yadav"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="email">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="creator@hub.local"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="password">
              Password (min. 6 characters)
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="timezone">
              Preferred Timezone
            </label>
            <Select id="timezone" name="timezone" defaultValue={getDefaultTimezone()}>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </div>

          <Button type="submit" isLoading={isPending} className="w-full">
            Create Account
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>

          <div className="text-center pt-3 border-t border-zinc-800/80">
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-red-400 hover:text-red-300 underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
