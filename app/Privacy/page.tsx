export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-zinc-400 mb-6">Last updated: June 2026</p>
      <div className="space-y-8 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
          <p>We collect your email for authentication and trading data you voluntarily enter.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
          <p>Your data is used exclusively to generate your personal analytics. We never sell your data.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">3. Data Security</h2>
          <p>All data is encrypted. Each user data is isolated with Row Level Security.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">4. Cookies</h2>
          <p>We use only essential cookies for authentication. No tracking cookies.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">5. Third-Party Services</h2>
          <p>We use Supabase, Stripe, and Groq to operate our platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">6. Your Rights</h2>
          <p>You can delete your account and all data anytime from Settings.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
          <p>Email: support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}