"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AppLoader from "../components/AppLoader";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <AppLoader message="Loading Settings" />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-6">Settings</h1>
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <p className="text-zinc-400 text-lg mb-4">Account preferences and configuration.</p>
          <p className="text-zinc-600 text-sm">Settings features coming soon.</p>
        </div>
      </section>
    </main>
  );
}