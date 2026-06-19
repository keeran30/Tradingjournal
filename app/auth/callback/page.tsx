"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-zinc-400">
            {isSignUp ? "Start your trading journey" : "Sign in to your trading journal"}
          </p>
        </div>

        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-xl mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-xl font-bold transition disabled:opacity-50">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-zinc-900 text-zinc-400">or</span></div>
            </div>
            <button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
              🚀 Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-400 mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }} className="text-yellow-500 hover:text-yellow-400 font-bold transition">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
        <p className="text-center mt-4">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition">← Back to home</a>
        </p>
      </div>
    </main>
  );
}