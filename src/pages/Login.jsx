import React, { useEffect, useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/api/base44Client";

// Sign in, create account, forgot password and set-new-password in one screen.
// Set VITE_ALLOW_SIGNUP=false (and turn off sign-ups in Supabase) for invite-only access.
const ALLOW_SIGNUP = import.meta.env.VITE_ALLOW_SIGNUP !== "false";

const safeNext = () => {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
};

const COPY = {
  signin: { title: "Welcome back", subtitle: "Sign in to Millionaire Business OS", button: "Sign in" },
  signup: { title: "Create your account", subtitle: "Build your offer, funnel and launch plan", button: "Create account" },
  forgot: { title: "Reset your password", subtitle: "We'll email you a reset link", button: "Send reset link" },
  reset: { title: "Set a new password", subtitle: "Choose a password with at least 8 characters", button: "Save new password" },
};

export default function Login({ initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => data?.subscription?.unsubscribe();
  }, []);

  const switchMode = (next) => { setMode(next); setError(""); setNotice(""); };

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
        window.location.assign(safeNext());
        return;
      }
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (err) throw err;
        if (data?.session) { window.location.assign("/"); return; }
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice("If that email has an account, a reset link is on its way.");
      }
      if (mode === "reset") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        window.location.assign("/");
        return;
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  const copy = COPY[mode];

  return (
    <AuthLayout
      icon={LogIn}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        mode === "signin" ? (
          ALLOW_SIGNUP ? (
            <>New here? <button type="button" className="underline font-semibold" onClick={() => switchMode("signup")}>Create an account</button></>
          ) : "Access is by invitation."
        ) : mode !== "reset" ? (
          <>Already have an account? <button type="button" className="underline font-semibold" onClick={() => switchMode("signin")}>Sign in</button></>
        ) : null
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block" htmlFor="fullName">Your name</label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
        )}
        {mode !== "reset" && (
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block" htmlFor="email">Email</label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
        )}
        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="password">
                {mode === "reset" ? "New password" : "Password"}
              </label>
              {mode === "signin" && (
                <button type="button" className="text-sm underline text-muted-foreground" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              required
              minLength={mode === "signin" ? 1 : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
        )}

        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-3">{error}</p>}
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">{notice}</p>}

        <Button type="submit" disabled={busy} className="w-full accent-gradient text-white font-bold h-11">
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {copy.button}
        </Button>
      </form>
    </AuthLayout>
  );
}
