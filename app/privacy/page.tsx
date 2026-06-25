export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-zinc-400 mb-4">Last updated: June 2026</p>
      
      <div className="space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
          <p>We collect your email address, trading data you voluntarily enter, and usage analytics to improve our service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
          <p>Your trading data is used solely to generate your personal analytics and insights. We do not sell or share your data with third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Data Security</h2>
          <p>All data is encrypted in transit and at rest. Each user's data is isolated via Row Level Security in our database.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Cookies</h2>
          <p>We use essential cookies for authentication. No tracking cookies are used.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Your Rights</h2>
          <p>You can delete your account and all associated data at any time from the Settings page.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Contact</h2>
          <p>Privacy concerns? Contact support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}